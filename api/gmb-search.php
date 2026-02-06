<?php
/**
 * GMB Search API Endpoint
 * Searches for businesses using Serper.dev Places API
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Authentication is optional for search - allows demo/testing
// If user is authenticated, we can track usage; otherwise anonymous
// Use getCurrentUser() which returns null instead of exiting with 401
$user = getCurrentUser();

// Apply rate limiting (stricter for anonymous users)
if ($user) {
    enforceRateLimit($user, 'search');
}
// Note: Anonymous users are allowed but could have stricter limits added here

// Get and validate input
$input = getJsonInput();
if (!$input) {
    sendError('Invalid JSON input');
}

$service = sanitizeInput($input['service'] ?? '');
$location = sanitizeInput($input['location'] ?? '');
$limit = intval($input['limit'] ?? 100); // Default 100, max 50000
$filters = normalizeSearchFilters($input['filters'] ?? null);
$filtersActive = hasAnySearchFilter($filters);
$filterMultiplier = $filtersActive ? (defined('FILTER_OVERFETCH_MULTIPLIER') ? max(1, (int)FILTER_OVERFETCH_MULTIPLIER) : 3) : 1;
if ($filtersActive && $limit >= 500) {
    $filterMultiplier = max($filterMultiplier, 4);
}
if ($filtersActive && $limit >= 1500) {
    $filterMultiplier = max($filterMultiplier, 5);
}

// Validate limit (min 20, max 50000)
$limit = max(20, min(50000, $limit));
$targetCount = getSearchFillTargetCount($limit);

if (empty($service)) {
    sendError('Service type is required');
}

if (empty($location)) {
    sendError('Location is required');
}

try {
    $filtersKey = $filtersActive ? md5(json_encode($filters)) : 'none';
    $cacheKey = "gmb_search_{$service}_{$location}_{$limit}_{$filtersKey}";
    
    // Check cache
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        sendJson([
            'success' => true,
            'data' => $cached,
            'query' => [
                'service' => $service,
                'location' => $location,
                'limit' => $limit
            ],
            'cached' => true
        ]);
    }
    
    $results = searchGMBListings($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $targetCount);
    
    // Cache results
    setCache($cacheKey, $results);
    
    sendJson([
        'success' => true,
        'data' => $results,
        'query' => [
            'service' => $service,
            'location' => $location,
            'limit' => $limit
        ],
        'totalResults' => count($results),
        'targetCount' => $targetCount,
        'coverage' => round((count($results) / max(1, $limit)) * 100, 2)
    ]);
} catch (Exception $e) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred while searching', 500);
    }
}

/**
 * Search for business listings using Serper.dev.
 * Uses Serper Places with an organic fallback.
 */
function searchGMBListings($service, $location, $limit = 100, $filters = [], $filtersActive = false, $filterMultiplier = 1, $targetCount = null) {
    $hasSerper = defined('SERPER_API_KEY') && !empty(SERPER_API_KEY);
    
    if (!$hasSerper) {
        throw new Exception('No search API configured. Please add SERPER_API_KEY to config.php for real search results.');
    }
    
    set_time_limit(3600); // 60 min for massive searches
    
    $allResults = [];
    $seenBusinesses = [];
    
    if ($hasSerper) {
        $serperResults = searchSerperPlaces($service, $location, $limit, $filters, $filtersActive, $filterMultiplier);
        foreach ($serperResults as $business) {
            $dedupeKey = buildBusinessDedupeKey($business, $location);
            if (!isset($seenBusinesses[$dedupeKey])) {
                $seenBusinesses[$dedupeKey] = count($allResults);
                $allResults[] = $business;
            }
            if (count($allResults) >= $limit) break;
        }
    }
    
    return $allResults;
}

function isSerpApiCreditsError($message) {
    $msg = strtolower($message);
    $needles = [
        'run out of searches',
        'no searches left',
        'no more searches',
        'insufficient credits',
        'exceeded your plan',
        'exceeded plan',
        'payment required',
        'quota'
    ];
    foreach ($needles as $needle) {
        if (strpos($msg, $needle) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Search using Serper.dev Places API (Google Maps alternative)
 */
function searchSerperPlaces($service, $location, $limit, $filters, $filtersActive, $filterMultiplier) {
    $results = [];
    $query = "$service in $location";
    
    // Serper Places endpoint for local business search
    $payload = [
        'q' => $query,
        'gl' => 'us',
        'hl' => 'en'
    ];
    
    $response = curlRequest('https://google.serper.dev/places', [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'X-API-KEY: ' . SERPER_API_KEY,
            'Content-Type: application/json'
        ]
    ]);
    
    if ($response['httpCode'] !== 200) {
        // Fall back to regular search if places fails
        return searchSerperOrganic($service, $location, $limit, $filters);
    }
    
    $data = json_decode($response['response'], true);
    $places = $data['places'] ?? [];
    
    foreach ($places as $item) {
        if (count($results) >= $limit) break;
        
        $business = [
            'id' => generateId('srpr_'),
            'name' => $item['title'] ?? '',
            'url' => $item['website'] ?? '',
            'snippet' => $item['category'] ?? '',
            'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
            'address' => $item['address'] ?? '',
            'phone' => $item['phoneNumber'] ?? '',
            'rating' => $item['rating'] ?? null,
            'reviews' => $item['ratingCount'] ?? null,
            'source' => 'Serper Places',
            'sources' => ['Serper Places']
        ];
        
        if (empty($business['name'])) continue;
        if (!matchesSearchFilters($business, $filters)) continue;
        
        $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
        $results[] = $business;
    }
    
    // If places didn't return enough, supplement with organic search
    if (count($results) < $limit) {
        $organicResults = searchSerperOrganic($service, $location, $limit - count($results), $filters);
        $results = array_merge($results, $organicResults);
    }
    
    return $results;
}

/**
 * Search Serper organic results as fallback
 */
function searchSerperOrganic($service, $location, $limit, $filters) {
    $results = [];
    $query = "$service in $location";
    
    $payload = [
        'q' => $query,
        'num' => min(100, $limit),
        'gl' => 'us',
        'hl' => 'en'
    ];
    
    $response = curlRequest('https://google.serper.dev/search', [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'X-API-KEY: ' . SERPER_API_KEY,
            'Content-Type: application/json'
        ]
    ]);
    
    if ($response['httpCode'] !== 200) {
        return [];
    }
    
    $data = json_decode($response['response'], true);
    $organic = $data['organic'] ?? [];
    
    foreach ($organic as $item) {
        if (count($results) >= $limit) break;
        
        $business = [
            'id' => generateId('srpr_'),
            'name' => $item['title'] ?? '',
            'url' => $item['link'] ?? '',
            'snippet' => $item['snippet'] ?? '',
            'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?? '',
            'address' => '',
            'phone' => extractPhoneFromSnippet($item['snippet'] ?? ''),
            'rating' => null,
            'reviews' => null,
            'source' => 'Serper',
            'sources' => ['Serper']
        ];
        
        if (empty($business['name'])) continue;
        if (!matchesSearchFilters($business, $filters)) continue;
        
        $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
        $results[] = $business;
    }
    
    return $results;
}

/**
 * Extract phone from snippet text
 */
function extractPhoneFromSnippet($text) {
    if (preg_match('/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $text, $matches)) {
        return $matches[0];
    }
    return null;
}

/**
 * Search using SerpAPI engines (fallback)
 */
function searchSerpApiEngines($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $targetCount = null) {
    $apiKey = SERPAPI_KEY;
    $allResults = [];
    $seenBusinesses = [];
    $targetCount = $targetCount !== null ? (int)$targetCount : getSearchFillTargetCount($limit); // kept for response telemetry compatibility
    
    // Search engines supported by SerpAPI
    $searchEngines = [
        ['engine' => 'google_maps', 'name' => 'Google Maps', 'resultsKey' => 'local_results'],
        ['engine' => 'yelp', 'name' => 'Yelp', 'resultsKey' => 'organic_results'],
        ['engine' => 'bing_maps', 'name' => 'Bing Places', 'resultsKey' => 'local_results'],
    ];
    
    $enableExpansion = defined('ENABLE_LOCATION_EXPANSION') ? ENABLE_LOCATION_EXPANSION : true;
    $expansionMax = defined('LOCATION_EXPANSION_MAX') ? max(0, (int)LOCATION_EXPANSION_MAX) : 5;
    if ($limit >= 250) {
        $expansionMax = max($expansionMax, 20);
    }
    if ($limit >= 500) {
        $expansionMax = max($expansionMax, 30);
    }
    if ($limit >= 1000) {
        $expansionMax = max($expansionMax, 40);
    }
    if ($limit >= 2000) {
        $expansionMax = max($expansionMax, 60);
    }
    $expandedLocations = $enableExpansion ? buildLocationExpansions($location) : [];
    if ($expansionMax > 0) {
        $expandedLocations = array_slice($expandedLocations, 0, $expansionMax);
    } else {
        $expandedLocations = [];
    }
    $locationsToSearch = array_merge([$location], $expandedLocations);
    $searchedLocations = [];

    $collectFromQuery = function ($query, $searchLocation) use (&$allResults, &$seenBusinesses, $searchEngines, $limit, $filters, $filtersActive, $filterMultiplier, $apiKey) {
        $engineCount = count($searchEngines);
        $engineIndex = 0;

        foreach ($searchEngines as $engineConfig) {
            if (count($allResults) >= $limit) {
                break;
            }

            $engineIndex++;
            $remaining = $limit - count($allResults);
            $remainingEngines = max(1, $engineCount - $engineIndex + 1);
            $resultsPerEngine = (int)ceil($remaining / $remainingEngines);
            if ($filtersActive && $filterMultiplier > 1) {
                $resultsPerEngine = (int)ceil($resultsPerEngine * $filterMultiplier);
            }
            $resultsPerEngine = max(50, min(2500, $resultsPerEngine));

            $engineResults = searchSingleEngineNonStream(
                $apiKey,
                $engineConfig['engine'],
                $query,
                $engineConfig['resultsKey'],
                $resultsPerEngine,
                $engineConfig['name']
            );

            foreach ($engineResults as $business) {
                if (count($allResults) >= $limit) {
                    break;
                }

                if (!matchesSearchFilters($business, $filters)) {
                    continue;
                }

                $dedupeKey = buildBusinessDedupeKey($business, $searchLocation);
                if (!isset($seenBusinesses[$dedupeKey])) {
                    $seenBusinesses[$dedupeKey] = count($allResults);
                    $business['sources'] = [$engineConfig['name']];
                    $allResults[] = $business;
                } else {
                    $existingIndex = $seenBusinesses[$dedupeKey];
                    if (isset($allResults[$existingIndex]) && !in_array($engineConfig['name'], $allResults[$existingIndex]['sources'] ?? [])) {
                        $allResults[$existingIndex]['sources'][] = $engineConfig['name'];
                    }
                }
            }

            usleep(50000); // 50ms between engines
        }
    };
    
    foreach ($locationsToSearch as $searchLocation) {
        if (count($allResults) >= $limit) {
            break;
        }
        
        $searchedLocations[] = $searchLocation;
        $query = "$service in $searchLocation";
        $collectFromQuery($query, $searchLocation);
    }

    if (count($allResults) < $limit) {
        $variants = buildSearchQueryVariantsForNonStream(
            $service,
            !empty($searchedLocations) ? $searchedLocations : [$location],
            $limit,
            $filtersActive
        );
        foreach ($variants as $variant) {
            if (count($allResults) >= $limit) {
                break;
            }
            $collectFromQuery($variant['query'], $variant['location']);
        }
    }
    
    return $allResults;
}

/**
 * Build supplemental search query variants for non-stream fallback.
 */
function buildSearchQueryVariantsForNonStream($service, $searchedLocations, $limit = 100, $filtersActive = false) {
    $service = trim((string)$service);
    if ($service === '') {
        return [];
    }

    $locations = [];
    if (is_array($searchedLocations)) {
        foreach ($searchedLocations as $loc) {
            $loc = preg_replace('/\s+/', ' ', trim((string)$loc));
            if ($loc !== '' && !in_array($loc, $locations, true)) {
                $locations[] = $loc;
            }
        }
    }
    $locations = array_slice($locations, 0, 4);
    if (empty($locations)) {
        return [];
    }

    $serviceVariants = expandServiceSynonyms($service);
    if (empty($serviceVariants)) {
        $serviceVariants = [$service];
    }

    $templates = [
        'best %s in %s',
        '%s near %s',
        '%s companies in %s',
        '%s services %s',
    ];

    $variants = [];
    foreach ($locations as $loc) {
        foreach ($serviceVariants as $serviceVariant) {
            foreach ($templates as $template) {
                $query = sprintf($template, $serviceVariant, $loc);
                $query = preg_replace('/\s+/', ' ', trim($query));
                if ($query === '') {
                    continue;
                }
                $key = strtolower($query);
                if (!isset($variants[$key])) {
                    $variants[$key] = [
                        'query' => $query,
                        'location' => $loc,
                    ];
                }
            }
        }
    }

    $maxVariants = defined('SEARCH_QUERY_VARIANT_MAX') ? max(1, (int)SEARCH_QUERY_VARIANT_MAX) : 8;
    if ($limit >= 250) {
        $maxVariants = max($maxVariants, 30);
    }
    if ($limit >= 500) {
        $maxVariants = max($maxVariants, 45);
    }
    if ($limit >= 1000) {
        $maxVariants = max($maxVariants, 70);
    }
    if ($limit >= 2000) {
        $maxVariants = max($maxVariants, 90);
    }
    if ($filtersActive) {
        $maxVariants = (int)ceil($maxVariants * 1.25);
    }
    return array_slice(array_values($variants), 0, $maxVariants);
}

/**
 * Search a single SerpAPI engine (non-streaming version)
 */
function searchSingleEngineNonStream($apiKey, $engine, $query, $resultsKey, $limit, $sourceName) {
    $results = [];
    $resultsPerPage = 20;
    if ($engine === 'yelp') {
        $resultsPerPage = 10;
    } elseif ($engine === 'bing_maps') {
        $resultsPerPage = 30;
    }
    $maxPages = ceil($limit / $resultsPerPage);
    if ($limit <= 100) {
        $pageCap = 20;
    } elseif ($limit <= 500) {
        $pageCap = 60;
    } elseif ($limit <= 2000) {
        $pageCap = 150;
    } elseif ($limit <= 10000) {
        $pageCap = 600;
    } else {
        $pageCap = 2500;
    }
    if ($limit >= 1000) {
        if ($engine === 'google_maps') {
            $pageCap = min($pageCap, 12);
        } elseif ($engine === 'yelp') {
            $pageCap = min($pageCap, 15);
        } elseif ($engine === 'bing_maps') {
            $pageCap = min($pageCap, 20);
        }
    }
    $maxPages = min($maxPages, $pageCap);
    $throttleUs = defined('SERPAPI_THROTTLE_US') ? max(0, (int)SERPAPI_THROTTLE_US) : 50000; // Reduced from 100ms to 50ms
    if ($limit >= 2000) {
        $throttleUs = min($throttleUs, 10000);
    } elseif ($limit >= 1000) {
        $throttleUs = min($throttleUs, 15000);
    }
    $connectTimeout = defined('SERPAPI_CONNECT_TIMEOUT_SEC') ? max(5, (int)SERPAPI_CONNECT_TIMEOUT_SEC) : 15;
    $requestTimeout = defined('SERPAPI_TIMEOUT_SEC')
        ? max(10, (int)SERPAPI_TIMEOUT_SEC)
        : ($limit >= 2000 ? 60 : ($limit >= 500 ? 45 : 35));
    $requestRetries = defined('SERPAPI_REQUEST_RETRIES') ? max(0, (int)SERPAPI_REQUEST_RETRIES) : 2;
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        $params = [
            'engine' => $engine,
            'q' => $query,
            'api_key' => $apiKey,
        ];
        
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
                $params['start'] = $page * 10;
            }
        } elseif ($engine === 'bing_maps') {
            $params['count'] = min(30, $resultsPerPage);
            if ($page > 0) {
                $params['first'] = $page * $resultsPerPage;
            }
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = null;
        for ($attempt = 0; $attempt <= $requestRetries; $attempt++) {
            $response = curlRequest($url, [
                CURLOPT_CONNECTTIMEOUT => $connectTimeout,
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ], $requestTimeout);
            $httpCode = (int)($response['httpCode'] ?? 0);
            $curlError = (string)($response['error'] ?? '');

            if ($httpCode === 200) {
                break;
            }

            $retryableStatus = in_array($httpCode, [408, 429, 500, 502, 503, 504], true);
            $retryable = $retryableStatus || isTransientNetworkErrorMessage($curlError) || $httpCode === 0;
            if (!$retryable || $attempt >= $requestRetries) {
                break;
            }

            usleep((int)(250000 * ($attempt + 1))); // 250ms, 500ms, 750ms...
        }
        
        if ($response['httpCode'] !== 200) {
            $errorMessage = "SerpAPI error (HTTP {$response['httpCode']})";
            if (!empty($response['error'])) {
                $errorMessage .= " - cURL: {$response['error']}";
            }
            $decoded = json_decode($response['response'] ?? '', true);
            if (is_array($decoded)) {
                $apiError = $decoded['error'] ?? ($decoded['search_metadata']['status'] ?? null);
                if (!empty($apiError)) {
                    $errorMessage = "SerpAPI error: {$apiError}";
                }
            }
            throw new Exception($errorMessage);
        }
        
        $data = json_decode($response['response'], true);
        if (is_array($data)) {
            $apiError = $data['error'] ?? null;
            $status = $data['search_metadata']['status'] ?? null;
            if (!empty($apiError)) {
                if ($engine === 'yelp' && stripos($apiError, "yelp hasn't returned any results") !== false) {
                    return [];
                }
                if ($engine === 'google_maps' && stripos($apiError, "google hasn't returned any results") !== false) {
                    return [];
                }
                throw new Exception("SerpAPI error: {$apiError}");
            }
            if (!empty($status) && strtolower($status) === 'error') {
                $errorMessage = $data['search_metadata']['error'] ?? $status;
                if ($engine === 'yelp' && stripos($errorMessage, "yelp hasn't returned any results") !== false) {
                    return [];
                }
                if ($engine === 'google_maps' && stripos($errorMessage, "google hasn't returned any results") !== false) {
                    return [];
                }
                throw new Exception("SerpAPI error: {$errorMessage}");
            }
        }
        $items = $data[$resultsKey] ?? [];
        
        if (empty($items)) {
            break;
        }
        
        foreach ($items as $item) {
            if (count($results) >= $limit) {
                break;
            }
            
            $business = normalizeBusinessResultNonStream($item, $engine, $sourceName);
            if ($business) {
                $results[] = $business;
            }
        }
        
        if (!isset($data['serpapi_pagination']['next'])) {
            break;
        }
        
        if ($throttleUs > 0) {
            usleep($throttleUs);
        }
    }
    
    return $results;
}

/**
 * Normalize business result from different engines
 */
function normalizeBusinessResultNonStream($item, $engine, $sourceName) {
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
    } elseif ($engine === 'bing_maps') {
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
    
    $websiteAnalysis = quickWebsiteCheck($websiteUrl);
    
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
        'websiteAnalysis' => $websiteAnalysis
    ];
}

/**
 * Quick website check - fast detection without HTTP requests
 * Only analyzes the URL structure to avoid timeouts
 */
function quickWebsiteCheck($url) {
    $host = parse_url($url, PHP_URL_HOST) ?? '';
    $hostLower = strtolower($host);
    
    // Detect platform from URL
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

// Mock data functions removed - real API results only
