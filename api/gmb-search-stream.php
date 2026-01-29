<?php
/**
 * GMB Search API Endpoint - STREAMING VERSION
 * Streams results progressively as they arrive from SerpAPI
 * Uses Server-Sent Events (SSE) for real-time updates
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';

// SSE headers
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Disable nginx buffering
setCorsHeaders();

// Disable output buffering for streaming
if (ob_get_level()) ob_end_clean();
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', false);

// Increase time limit for massive searches (up to 50000 leads = ~60 min)
set_time_limit(3600);
ini_set('memory_limit', '1024M');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendSSEError('Method not allowed');
    exit();
}

// Authentication is optional
$user = getCurrentUser();
if ($user) {
    enforceRateLimit($user, 'search');
}

// Get and validate input
$input = getJsonInput();
if (!$input) {
    sendSSEError('Invalid JSON input');
    exit();
}

$service = sanitizeInput($input['service'] ?? '');
$location = sanitizeInput($input['location'] ?? '');
$limit = intval($input['limit'] ?? 100);
$limit = max(20, min(50000, $limit));
$filters = normalizeSearchFilters($input['filters'] ?? null);
$filtersActive = hasAnySearchFilter($filters);
$filterMultiplier = $filtersActive ? (defined('FILTER_OVERFETCH_MULTIPLIER') ? max(1, (int)FILTER_OVERFETCH_MULTIPLIER) : 3) : 1;

if (empty($service)) {
    sendSSEError('Service type is required');
    exit();
}

if (empty($location)) {
    sendSSEError('Location is required');
    exit();
}

// Start streaming search
streamGMBSearch($service, $location, $limit);

/**
 * Send SSE message
 */
function sendSSE($event, $data) {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    if (function_exists('ob_flush')) {
        @ob_flush();
    }
    flush();
}

/**
 * Send SSE error
 */
function sendSSEError($message) {
    sendSSE('error', ['error' => $message]);
}

/**
 * Stream multi-source search results progressively
 * Searches Google Maps, Yelp, and Bing Local via SerpAPI
 */
function streamGMBSearch($service, $location, $limit) {
    $apiKey = defined('SERPAPI_KEY') ? SERPAPI_KEY : '';
    
    if (empty($apiKey)) {
        sendSSEError('SERPAPI_KEY is not configured');
        return;
    }
    
    $allResults = [];
    $seenBusinesses = []; // Track by dedupe key to index for deduplication
    $totalResults = 0;
    
    // Define search engines to query (all supported by SerpAPI)
    $searchEngines = [
        ['engine' => 'google_maps', 'name' => 'Google Maps', 'resultsKey' => 'local_results'],
        ['engine' => 'yelp', 'name' => 'Yelp', 'resultsKey' => 'organic_results'],
        ['engine' => 'bing_local', 'name' => 'Bing Places', 'resultsKey' => 'local_results'],
    ];
    
    $enableExpansion = defined('ENABLE_LOCATION_EXPANSION') ? ENABLE_LOCATION_EXPANSION : true;
    $expansionMax = defined('LOCATION_EXPANSION_MAX') ? max(0, (int)LOCATION_EXPANSION_MAX) : 5;
    $expandedLocations = $enableExpansion ? buildLocationExpansions($location) : [];
    if ($expansionMax > 0) {
        $expandedLocations = array_slice($expandedLocations, 0, $expansionMax);
    } else {
        $expandedLocations = [];
    }
    $locationsToSearch = array_merge([$location], $expandedLocations);
    $searchedLocations = [];
    
    // Send initial status
    sendSSE('start', [
        'query' => "$service in $location",
        'limit' => $limit,
        'sources' => array_column($searchEngines, 'name'),
        'estimatedSources' => count($searchEngines),
        'expandedLocations' => $expandedLocations,
        'filtersActive' => $filtersActive
    ]);
    
    foreach ($locationsToSearch as $locationIndex => $searchLocation) {
        if ($totalResults >= $limit) {
            break;
        }
        
        $query = "$service in $searchLocation";
        $searchedLocations[] = $searchLocation;
        
        if ($locationIndex > 0) {
            sendSSE('expansion_start', [
                'location' => $searchLocation,
                'remaining' => $limit - $totalResults
            ]);
        }
        
        $engineCount = count($searchEngines);
        $engineIndex = 0;
        
        foreach ($searchEngines as $engineConfig) {
            if ($totalResults >= $limit) {
                break;
            }
            
            $engineIndex++;
            $remaining = $limit - $totalResults;
            $remainingEngines = max(1, $engineCount - $engineIndex + 1);
            $resultsPerEngine = (int)ceil($remaining / $remainingEngines);
            if ($filtersActive && $filterMultiplier > 1) {
                $resultsPerEngine = (int)ceil($resultsPerEngine * $filterMultiplier);
            }
            
            $engineName = $engineConfig['engine'];
            $sourceName = $engineConfig['name'];
            $resultsKey = $engineConfig['resultsKey'];
            
            sendSSE('source_start', [
                'source' => $sourceName,
                'engine' => $engineName,
                'location' => $searchLocation
            ]);
            
            $engineFound = 0;
            $engineAdded = 0;
            
            searchSingleEngine(
                $apiKey,
                $engineName,
                $query,
                $resultsKey,
                $resultsPerEngine,
                $sourceName,
                function ($pageResults) use (&$allResults, &$seenBusinesses, &$totalResults, &$engineFound, &$engineAdded, $limit, $sourceName, $searchLocation, $filters) {
                    $engineFound += count($pageResults);
                    
                    $newResults = [];
                    foreach ($pageResults as $business) {
                        if (!matchesSearchFilters($business, $filters)) {
                            continue;
                        }
                        $dedupeKey = buildBusinessDedupeKey($business, $searchLocation);
                        
                        if (!isset($seenBusinesses[$dedupeKey])) {
                            $seenBusinesses[$dedupeKey] = count($allResults);
                            $business['sources'] = [$sourceName];
                            $newResults[] = $business;
                            $allResults[] = $business;
                            $totalResults++;
                            $engineAdded++;
                            
                            if ($totalResults >= $limit) {
                                break;
                            }
                        } else {
                            // Business already exists, track that we found it in multiple sources
                            $existingIndex = $seenBusinesses[$dedupeKey];
                            if (isset($allResults[$existingIndex]) && !in_array($sourceName, $allResults[$existingIndex]['sources'] ?? [])) {
                                $allResults[$existingIndex]['sources'][] = $sourceName;
                            }
                        }
                    }
                    
                    if (!empty($newResults)) {
                        $progress = min(100, round(($totalResults / $limit) * 100));
                        sendSSE('results', [
                            'leads' => $newResults,
                            'total' => $totalResults,
                            'progress' => $progress,
                            'source' => $sourceName
                        ]);
                    }
                    
                    return $totalResults < $limit;
                }
            );
            
            sendSSE('source_complete', [
                'source' => $sourceName,
                'found' => $engineFound,
                'added' => $engineAdded
            ]);
            
            // Small delay between engines
            usleep(200000); // 200ms
        }
    }
    
    // Send completion
    sendSSE('complete', [
        'total' => $totalResults,
        'sources' => array_column($searchEngines, 'name'),
        'query' => [
            'service' => $service,
            'location' => $location,
            'limit' => $limit
        ],
        'searchedLocations' => $searchedLocations
    ]);
}

/**
 * Search a single SerpAPI engine
 * Supports up to 50000 total leads by increasing page limits per engine
 */
function searchSingleEngine($apiKey, $engine, $query, $resultsKey, $limit, $sourceName, $onPageResults = null) {
    $results = [];
    
    // Yelp returns 10 per page, others return 20
    $resultsPerPage = ($engine === 'yelp') ? 10 : 20;
    
    // Calculate max pages needed - scale based on requested limit
    // For 50000 leads split across 3 engines = ~16667 per engine
    // Google Maps: 16667/20 = 834 pages, Yelp: 16667/10 = 1667 pages, Bing: 16667/20 = 834 pages
    $maxPages = ceil($limit / $resultsPerPage);
    
    // Dynamic page cap based on limit requested - scaled for massive searches
    // Small searches (≤100): 10 pages, Medium (≤500): 30 pages, Large (≤2000): 100 pages
    // Extra Large (≤10000): 500 pages, Massive (≤50000): 2000 pages per engine
    // Increased page caps for better results yield
    if ($limit <= 100) {
        $pageCap = 20; // Doubled from 10
    } elseif ($limit <= 500) {
        $pageCap = 60; // Doubled from 30
    } elseif ($limit <= 2000) {
        $pageCap = 150; // Increased from 100
    } elseif ($limit <= 10000) {
        $pageCap = 600; // Increased from 500
    } else {
        $pageCap = 2500; // Increased from 2000
    }
    $maxPages = min($maxPages, $pageCap);
    
    $emptyPageStreak = 0; // Track consecutive empty pages to exit early
    
    $throttleUs = defined('SERPAPI_THROTTLE_US') ? max(0, (int)SERPAPI_THROTTLE_US) : 150000;
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        // Exit if we've had 3 consecutive empty pages (API exhausted)
        if ($emptyPageStreak >= 3) {
            break;
        }
        
        $params = [
            'engine' => $engine,
            'q' => $query,
            'api_key' => $apiKey,
        ];
        
        // Engine-specific parameters
        if ($engine === 'google_maps') {
            $params['type'] = 'search';
            $params['hl'] = 'en';
            if ($page > 0) {
                $params['start'] = $page * $resultsPerPage;
            }
        } elseif ($engine === 'yelp') {
            $params['find_desc'] = explode(' in ', $query)[0];
            $params['find_loc'] = explode(' in ', $query)[1] ?? $query;
            if ($page > 0) {
                $params['start'] = $page * $resultsPerPage;
            }
        } elseif ($engine === 'bing_local') {
            if ($page > 0) {
                $params['first'] = $page * $resultsPerPage;
            }
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = curlRequest($url, [], 20); // Increased timeout for pagination
        
        if ($response['httpCode'] !== 200) {
            $emptyPageStreak++;
            continue; // Try next page on error instead of breaking
        }
        
        $data = json_decode($response['response'], true);
        $items = $data[$resultsKey] ?? [];
        
        if (empty($items)) {
            $emptyPageStreak++;
            continue;
        }
        
        $emptyPageStreak = 0; // Reset on successful results
        
        $pageResults = [];
        foreach ($items as $item) {
            if (count($results) >= $limit) {
                break;
            }
            
            $business = normalizeBusinessResult($item, $engine, $sourceName);
            if ($business) {
                $results[] = $business;
                $pageResults[] = $business;
            }
        }
        
        if (!empty($pageResults) && is_callable($onPageResults)) {
            $continue = $onPageResults($pageResults);
            if ($continue === false) {
                break;
            }
        }
        
        // Check for pagination - but don't break, just note it
        $hasPagination = isset($data['serpapi_pagination']['next']) || 
                         isset($data['serpapi_pagination']['next_page_token']);
        
        // For large searches, continue even without explicit pagination (try next offset)
        if (!$hasPagination && $limit <= 100) {
            break;
        }
        
        if ($throttleUs > 0) {
            usleep($throttleUs);
        }
    }
    
    return $results;
}

/**
 * Normalize business result from different engines to common format
 */
function normalizeBusinessResult($item, $engine, $sourceName) {
    $websiteUrl = '';
    $name = '';
    $address = '';
    $phone = '';
    $rating = null;
    $reviews = null;
    $snippet = '';
    
    if ($engine === 'google_maps') {
        $name = $item['title'] ?? '';
        $websiteUrl = $item['website'] ?? '';
        $address = $item['address'] ?? '';
        $phone = $item['phone'] ?? '';
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? null;
        $snippet = $item['description'] ?? ($item['type'] ?? '');
    } elseif ($engine === 'yelp') {
        $name = $item['title'] ?? ($item['name'] ?? '');
        $websiteUrl = $item['link'] ?? '';
        $address = $item['address'] ?? ($item['neighborhood'] ?? '');
        $phone = $item['phone'] ?? '';
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? null;
        $snippet = $item['snippet'] ?? ($item['categories'] ?? '');
        if (is_array($snippet)) {
            $snippet = implode(', ', $snippet);
        }
    } elseif ($engine === 'bing_local') {
        $name = $item['title'] ?? '';
        $websiteUrl = $item['link'] ?? ($item['website'] ?? '');
        $address = $item['address'] ?? '';
        $phone = $item['phone'] ?? '';
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? null;
        $snippet = $item['description'] ?? '';
    }
    
    if (empty($name)) {
        return null;
    }
    
    // Extract email from snippet if available
    $email = extractEmailFromText($snippet);
    
    // Also try to extract phone from snippet if not found directly
    if (empty($phone) && !empty($snippet)) {
        $phone = extractPhoneFromText($snippet);
    }
    
    return [
        'id' => generateId(strtolower(substr($engine, 0, 3)) . '_'),
        'name' => $name,
        'url' => $websiteUrl,
        'snippet' => $snippet,
        'displayLink' => parse_url($websiteUrl, PHP_URL_HOST) ?? '',
        'address' => $address,
        'phone' => $phone,
        'email' => $email,
        'rating' => $rating,
        'reviews' => $reviews,
        'source' => $sourceName,
        'websiteAnalysis' => quickWebsiteCheck($websiteUrl)
    ];
}

/**
 * Extract email from text
 */
function extractEmailFromText($text) {
    if (empty($text)) return null;
    if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
        $email = strtolower($matches[0]);
        // Filter out common non-business emails
        $excludePatterns = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.', 'noreply', 'no-reply', 'wixpress', 'sentry.io'];
        foreach ($excludePatterns as $pattern) {
            if (strpos($email, $pattern) !== false) {
                return null;
            }
        }
        return $email;
    }
    return null;
}

/**
 * Extract phone from text
 */
function extractPhoneFromText($text) {
    if (empty($text)) return null;
    if (preg_match('/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $text, $matches)) {
        return $matches[0];
    }
    return null;
}

/**
 * Quick website check - URL-based only
 */
function quickWebsiteCheck($url) {
    if (empty($url)) {
        return [
            'hasWebsite' => false,
            'platform' => null,
            'needsUpgrade' => true,
            'issues' => ['No website found'],
            'mobileScore' => null,
            'loadTime' => null
        ];
    }
    
    $host = parse_url($url, PHP_URL_HOST) ?? '';
    $hostLower = strtolower($host);
    
    $platform = null;
    $needsUpgrade = false;
    $issues = [];
    
    if (strpos($hostLower, 'wix') !== false || strpos($hostLower, 'wixsite') !== false) {
        $platform = 'wix';
        $needsUpgrade = true;
        $issues[] = 'Using Wix template';
    } elseif (strpos($hostLower, 'squarespace') !== false) {
        $platform = 'squarespace';
        $needsUpgrade = true;
        $issues[] = 'Using Squarespace template';
    } elseif (strpos($hostLower, 'weebly') !== false) {
        $platform = 'weebly';
        $needsUpgrade = true;
        $issues[] = 'Using Weebly template';
    } elseif (strpos($hostLower, 'godaddy') !== false) {
        $platform = 'godaddy';
        $needsUpgrade = true;
        $issues[] = 'Using GoDaddy builder';
    } elseif (strpos($hostLower, 'wordpress.com') !== false) {
        $platform = 'wordpress.com';
        $needsUpgrade = true;
        $issues[] = 'Using free WordPress.com';
    } elseif (strpos($hostLower, 'shopify') !== false) {
        $platform = 'shopify';
    } elseif (strpos($hostLower, 'blogger') !== false || strpos($hostLower, 'blogspot') !== false) {
        $platform = 'blogger';
        $needsUpgrade = true;
        $issues[] = 'Using Blogger';
    } elseif (strpos($hostLower, 'facebook.com') !== false) {
        $platform = 'facebook';
        $needsUpgrade = true;
        $issues[] = 'Only Facebook presence';
    }
    
    return [
        'hasWebsite' => true,
        'platform' => $platform,
        'needsUpgrade' => $needsUpgrade,
        'issues' => $issues,
        'mobileScore' => null,
        'loadTime' => null
    ];
}
