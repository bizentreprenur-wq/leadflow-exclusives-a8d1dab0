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

// Increase time limit for large searches
set_time_limit(300);

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
$limit = max(20, min(2000, $limit));

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
    
    $query = "$service in $location";
    $allResults = [];
    $seenBusinesses = []; // Track by name+address for deduplication
    $totalResults = 0;
    
    // Define search engines to query (all supported by SerpAPI)
    $searchEngines = [
        ['engine' => 'google_maps', 'name' => 'Google Maps', 'resultsKey' => 'local_results'],
        ['engine' => 'yelp', 'name' => 'Yelp', 'resultsKey' => 'organic_results'],
        ['engine' => 'bing_local', 'name' => 'Bing Places', 'resultsKey' => 'local_results'],
    ];
    
    // Send initial status
    sendSSE('start', [
        'query' => $query,
        'limit' => $limit,
        'sources' => array_column($searchEngines, 'name'),
        'estimatedSources' => count($searchEngines)
    ]);
    
    $resultsPerEngine = ceil($limit / count($searchEngines));
    
    foreach ($searchEngines as $engineConfig) {
        if ($totalResults >= $limit) {
            break;
        }
        
        $engineName = $engineConfig['engine'];
        $sourceName = $engineConfig['name'];
        $resultsKey = $engineConfig['resultsKey'];
        
        sendSSE('source_start', [
            'source' => $sourceName,
            'engine' => $engineName
        ]);
        
        $engineResults = searchSingleEngine($apiKey, $engineName, $query, $resultsKey, $resultsPerEngine, $sourceName);
        
        // Deduplicate and add results
        $newResults = [];
        foreach ($engineResults as $business) {
            $dedupeKey = strtolower(trim($business['name'])) . '|' . strtolower(trim($business['address'] ?? ''));
            
            if (!isset($seenBusinesses[$dedupeKey])) {
                $seenBusinesses[$dedupeKey] = true;
                $business['sources'] = [$sourceName];
                $newResults[] = $business;
                $allResults[] = $business;
                $totalResults++;
                
                if ($totalResults >= $limit) {
                    break;
                }
            } else {
                // Business already exists, track that we found it in multiple sources
                foreach ($allResults as &$existing) {
                    $existingKey = strtolower(trim($existing['name'])) . '|' . strtolower(trim($existing['address'] ?? ''));
                    if ($existingKey === $dedupeKey && !in_array($sourceName, $existing['sources'] ?? [])) {
                        $existing['sources'][] = $sourceName;
                        break;
                    }
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
        
        sendSSE('source_complete', [
            'source' => $sourceName,
            'found' => count($engineResults),
            'added' => count($newResults)
        ]);
        
        // Small delay between engines
        usleep(200000); // 200ms
    }
    
    // Send completion
    sendSSE('complete', [
        'total' => $totalResults,
        'sources' => array_column($searchEngines, 'name'),
        'query' => [
            'service' => $service,
            'location' => $location,
            'limit' => $limit
        ]
    ]);
}

/**
 * Search a single SerpAPI engine
 */
function searchSingleEngine($apiKey, $engine, $query, $resultsKey, $limit, $sourceName) {
    $results = [];
    $resultsPerPage = 20;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 10); // Cap pages per engine
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
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
                $params['start'] = $page * 10; // Yelp uses 10 per page
            }
        } elseif ($engine === 'bing_local') {
            if ($page > 0) {
                $params['first'] = $page * $resultsPerPage;
            }
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = curlRequest($url, [], 15);
        
        if ($response['httpCode'] !== 200) {
            break;
        }
        
        $data = json_decode($response['response'], true);
        $items = $data[$resultsKey] ?? [];
        
        if (empty($items)) {
            break;
        }
        
        foreach ($items as $item) {
            if (count($results) >= $limit) {
                break;
            }
            
            $business = normalizeBusinessResult($item, $engine, $sourceName);
            if ($business) {
                $results[] = $business;
            }
        }
        
        // Check for pagination
        if (!isset($data['serpapi_pagination']['next'])) {
            break;
        }
        
        usleep(100000); // 100ms between pages
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
    
    return [
        'id' => generateId(strtolower(substr($engine, 0, 3)) . '_'),
        'name' => $name,
        'url' => $websiteUrl,
        'snippet' => $snippet,
        'displayLink' => parse_url($websiteUrl, PHP_URL_HOST) ?? '',
        'address' => $address,
        'phone' => $phone,
        'rating' => $rating,
        'reviews' => $reviews,
        'source' => $sourceName,
        'websiteAnalysis' => quickWebsiteCheck($websiteUrl)
    ];
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
