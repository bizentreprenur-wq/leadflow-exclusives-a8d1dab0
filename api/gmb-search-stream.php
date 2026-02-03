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
if ($filtersActive && $limit >= 500) {
    $filterMultiplier = max($filterMultiplier, 4);
}
if ($filtersActive && $limit >= 1500) {
    $filterMultiplier = max($filterMultiplier, 5);
}
$targetCount = getSearchFillTargetCount($limit);

if (empty($service)) {
    sendSSEError('Service type is required');
    exit();
}

if (empty($location)) {
    sendSSEError('Location is required');
    exit();
}

// Start streaming search
streamGMBSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $targetCount);

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
 * Uses SerpAPI primarily; falls back to Serper.dev only when credits are exhausted
 */
function streamGMBSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $targetCount) {
    $hasSerper = defined('SERPER_API_KEY') && !empty(SERPER_API_KEY);
    $hasSerpApi = defined('SERPAPI_KEY') && !empty(SERPAPI_KEY);
    
    if (!$hasSerper && !$hasSerpApi) {
        sendSSEError('No search API configured. Please add SERPER_API_KEY or SERPAPI_KEY to config.php');
        return;
    }
    
    // Prefer SerpAPI; only fall back to Serper if SerpAPI is out of credits
    if ($hasSerpApi) {
        $serpapiExhausted = false;
        
        // Fallback to SerpAPI
        $apiKey = SERPAPI_KEY;
        
        $allResults = [];
        $seenBusinesses = []; // Track by dedupe key to index for deduplication
        $totalResults = 0;
        
        // Define search engines to query (all supported by SerpAPI)
        $searchEngines = [
            ['engine' => 'google_maps', 'name' => 'Google Maps', 'resultsKey' => 'local_results'],
            ['engine' => 'yelp', 'name' => 'Yelp', 'resultsKey' => 'organic_results'],
            ['engine' => 'bing_maps', 'name' => 'Bing Places', 'resultsKey' => 'local_results'],
        ];
        
        $enableExpansion = defined('ENABLE_LOCATION_EXPANSION') ? ENABLE_LOCATION_EXPANSION : true;
        $expansionMax = defined('LOCATION_EXPANSION_MAX') ? max(0, (int)LOCATION_EXPANSION_MAX) : 5;
        if ($limit >= 1000) {
            $expansionMax = max($expansionMax, 20);
        }
        if ($limit >= 2000) {
            $expansionMax = max($expansionMax, 35);
        }
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
            'targetCount' => $targetCount,
            'sources' => array_column($searchEngines, 'name'),
            'estimatedSources' => count($searchEngines),
            'expandedLocations' => $expandedLocations,
            'filtersActive' => $filtersActive
        ]);
        
        $hadEngineError = false;

        foreach ($locationsToSearch as $locationIndex => $searchLocation) {
            if ($totalResults >= $limit || $serpapiExhausted) {
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
                if ($totalResults >= $limit || $serpapiExhausted) {
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
                
                try {
                    $lastPingAt = 0;
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
                        },
                        function ($page, $pageTotal) use (&$lastPingAt, $sourceName, $searchLocation, &$totalResults, $limit) {
                            $now = time();
                            if ($now - $lastPingAt >= 10) {
                                $lastPingAt = $now;
                                $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                                sendSSE('ping', [
                                    'source' => $sourceName,
                                    'location' => $searchLocation,
                                    'page' => $page,
                                    'total' => $totalResults,
                                    'progress' => $progress
                                ]);
                            }
                        }
                    );
                } catch (Exception $e) {
                    if (isSerpApiCreditsError($e->getMessage())) {
                        $serpapiExhausted = true;
                        break;
                    }
                    $hadEngineError = true;
                    sendSSE('source_error', [
                        'source' => $sourceName,
                        'engine' => $engineName,
                        'location' => $searchLocation,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
                
                sendSSE('source_complete', [
                    'source' => $sourceName,
                    'found' => $engineFound,
                    'added' => $engineAdded
                ]);
                
                // Minimal delay between engines (50ms instead of 200ms)
                usleep(50000);
            }
        }

        // If we still under-fill the request, run additional query variants before finishing.
        if (!$serpapiExhausted && $totalResults < $targetCount) {
            sendSSE('coverage', [
                'message' => "Under target ({$totalResults}/{$targetCount}). Running broader query variants...",
                'total' => $totalResults,
                'target' => $targetCount,
                'progress' => min(100, round(($totalResults / max(1, $limit)) * 100)),
            ]);

            $queryVariants = buildSearchQueryVariants($service, !empty($searchedLocations) ? $searchedLocations : [$location]);
            foreach ($queryVariants as $variant) {
                if ($totalResults >= $limit || $serpapiExhausted) {
                    break;
                }

                $query = $variant['query'];
                $variantLocation = $variant['location'];
                sendSSE('variant_start', [
                    'query' => $query,
                    'location' => $variantLocation,
                    'remaining' => $limit - $totalResults,
                ]);

                $engineCount = count($searchEngines);
                $engineIndex = 0;
                foreach ($searchEngines as $engineConfig) {
                    if ($totalResults >= $limit || $serpapiExhausted) {
                        break;
                    }

                    $engineIndex++;
                    $remaining = $limit - $totalResults;
                    $remainingEngines = max(1, $engineCount - $engineIndex + 1);
                    $resultsPerEngine = (int)ceil($remaining / $remainingEngines);
                    if ($filtersActive && $filterMultiplier > 1) {
                        $resultsPerEngine = (int)ceil($resultsPerEngine * $filterMultiplier);
                    }
                    $resultsPerEngine = max(50, min(2500, $resultsPerEngine));

                    $engineName = $engineConfig['engine'];
                    $sourceName = $engineConfig['name'];
                    $resultsKey = $engineConfig['resultsKey'];
                    $sourceLabel = $sourceName . ' (variant)';

                    try {
                        $lastPingAt = 0;
                        searchSingleEngine(
                            $apiKey,
                            $engineName,
                            $query,
                            $resultsKey,
                            $resultsPerEngine,
                            $sourceName,
                            function ($pageResults) use (&$allResults, &$seenBusinesses, &$totalResults, $limit, $sourceLabel, $variantLocation, $filters) {
                                $newResults = [];
                                foreach ($pageResults as $business) {
                                    if (!matchesSearchFilters($business, $filters)) {
                                        continue;
                                    }
                                    $dedupeKey = buildBusinessDedupeKey($business, $variantLocation);
                                    if (!isset($seenBusinesses[$dedupeKey])) {
                                        $seenBusinesses[$dedupeKey] = count($allResults);
                                        $business['sources'] = [$sourceLabel];
                                        $newResults[] = $business;
                                        $allResults[] = $business;
                                        $totalResults++;
                                        if ($totalResults >= $limit) {
                                            break;
                                        }
                                    } else {
                                        $existingIndex = $seenBusinesses[$dedupeKey];
                                        if (isset($allResults[$existingIndex]) && !in_array($sourceLabel, $allResults[$existingIndex]['sources'] ?? [])) {
                                            $allResults[$existingIndex]['sources'][] = $sourceLabel;
                                        }
                                    }
                                }

                                if (!empty($newResults)) {
                                    $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                                    sendSSE('results', [
                                        'leads' => $newResults,
                                        'total' => $totalResults,
                                        'progress' => $progress,
                                        'source' => $sourceLabel
                                    ]);
                                }

                                return $totalResults < $limit;
                            },
                            function ($page, $pageTotal) use (&$lastPingAt, $sourceLabel, $variantLocation, &$totalResults, $limit) {
                                $now = time();
                                if ($now - $lastPingAt >= 10) {
                                    $lastPingAt = $now;
                                    $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                                    sendSSE('ping', [
                                        'source' => $sourceLabel,
                                        'location' => $variantLocation,
                                        'page' => $page,
                                        'total' => $totalResults,
                                        'progress' => $progress
                                    ]);
                                }
                            }
                        );
                    } catch (Exception $e) {
                        if (isSerpApiCreditsError($e->getMessage())) {
                            $serpapiExhausted = true;
                            break;
                        }
                        $hadEngineError = true;
                        sendSSE('source_error', [
                            'source' => $sourceLabel,
                            'engine' => $engineName,
                            'location' => $variantLocation,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }
        }
        
        if ($serpapiExhausted) {
            if ($hasSerper) {
                sendSSE('status', [
                    'message' => 'SerpAPI credits exhausted. Switching to Serper...',
                    'engine' => 'Serper',
                    'progress' => 0
                ]);
                streamSerperSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier);
                return;
            }
            sendSSEError('SerpAPI credits exhausted and SERPER_API_KEY not configured.');
            return;
        }
        
        if ($totalResults === 0 && $hadEngineError) {
            if ($hasSerper) {
                sendSSE('status', [
                    'message' => 'Primary sources timed out. Switching to Serper fallback...',
                    'engine' => 'Serper',
                    'progress' => 0
                ]);
                streamSerperSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier);
                return;
            }
            sendSSEError('Search failed to return results from all sources. Please try again.');
            return;
        }

        // Send completion
        sendSSE('complete', [
            'total' => $totalResults,
            'requested' => $limit,
            'targetCount' => $targetCount,
            'coverage' => round(($totalResults / max(1, $limit)) * 100, 2),
            'sources' => array_column($searchEngines, 'name'),
            'query' => [
                'service' => $service,
                'location' => $location,
                'limit' => $limit
            ],
            'searchedLocations' => $searchedLocations
        ]);
        return;
    }
    
    // If no SerpAPI key, use Serper directly
    if ($hasSerper) {
        streamSerperSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier);
        return;
    }
    
    // Fallback (should not reach due to earlier guard)
    sendSSEError('No search API configured. Please add SERPAPI_KEY or SERPER_API_KEY to config.php');
    return;
    
    // ---- Original SerpAPI stream logic removed below ----
    // ---- Original SerpAPI stream logic removed above ----
}

/**
 * Build supplemental search query variants for top-up passes.
 */
function buildSearchQueryVariants($service, $searchedLocations) {
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

    $templates = [
        'best %s in %s',
        '%s near %s',
        '%s companies in %s',
        '%s services %s',
    ];

    $variants = [];
    foreach ($locations as $loc) {
        foreach ($templates as $template) {
            $query = sprintf($template, $service, $loc);
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

    $maxVariants = defined('SEARCH_QUERY_VARIANT_MAX') ? max(1, (int)SEARCH_QUERY_VARIANT_MAX) : 8;
    return array_slice(array_values($variants), 0, $maxVariants);
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
 * Search a single SerpAPI engine
 * Supports up to 50000 total leads by increasing page limits per engine
 */
function searchSingleEngine($apiKey, $engine, $query, $resultsKey, $limit, $sourceName, $onPageResults = null, $onPageTick = null) {
    $results = [];
    
    // Engine-specific page sizes
    $resultsPerPage = 20;
    if ($engine === 'yelp') {
        $resultsPerPage = 10;
    } elseif ($engine === 'bing_maps') {
        $resultsPerPage = 30;
    }
    
    // Calculate max pages needed - scale based on requested limit
    // For 50000 leads split across 3 engines = ~16667 per engine
    // Google Maps: 16667/20 = 834 pages, Yelp: 16667/10 = 1667 pages, Bing: 16667/20 = 834 pages
    $maxPages = ceil($limit / $resultsPerPage);
    
    // Dynamic page cap based on limit requested - scaled for massive searches.
    // We intentionally keep high-volume searches wider (more query shards) and
    // shallower (fewer pages per shard) for better speed and uniqueness.
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
    
    $emptyPageStreak = 0; // Track consecutive empty pages to exit early
    
    // Reduced throttle for faster searches
    $throttleUs = defined('SERPAPI_THROTTLE_US') ? max(0, (int)SERPAPI_THROTTLE_US) : 50000;
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
        } elseif ($engine === 'bing_maps') {
            $params['count'] = min(30, $resultsPerPage);
            if ($page > 0) {
                $params['first'] = $page * $resultsPerPage;
            }
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = null;
        $lastRequestError = '';
        for ($attempt = 0; $attempt <= $requestRetries; $attempt++) {
            $response = curlRequest($url, [
                CURLOPT_CONNECTTIMEOUT => $connectTimeout,
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ], $requestTimeout);
            $httpCode = (int)($response['httpCode'] ?? 0);
            $curlError = (string)($response['error'] ?? '');
            $lastRequestError = $curlError;

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
        
        if (is_callable($onPageTick)) {
            $onPageTick($page + 1, count($results));
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
            $snippet = implode(', ', array_map(function ($value) {
                if (is_scalar($value)) {
                    return (string)$value;
                }
                if (is_array($value)) {
                    $label = $value['title'] ?? $value['name'] ?? null;
                    if (is_string($label) && $label !== '') {
                        return $label;
                    }
                }
                return json_encode($value);
            }, $snippet));
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

/**
 * Stream search results using Serper.dev Places API
 */
function streamSerperSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier) {
    $allResults = [];
    $seenBusinesses = [];
    $totalResults = 0;
    $query = "$service in $location";
    
    sendSSE('status', [
        'message' => 'Searching with Serper Places API...',
        'engine' => 'Serper Places',
        'progress' => 0
    ]);
    
    // Search Serper Places
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
        // Try organic search as fallback
        $response = curlRequest('https://google.serper.dev/search', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'X-API-KEY: ' . SERPER_API_KEY,
                'Content-Type: application/json'
            ]
        ]);
        
        if ($response['httpCode'] !== 200) {
            sendSSEError('Serper API error: HTTP ' . $response['httpCode']);
            return;
        }
        
        $data = json_decode($response['response'], true);
        $places = $data['organic'] ?? [];
        $isOrganic = true;
    } else {
        $data = json_decode($response['response'], true);
        $places = $data['places'] ?? [];
        $isOrganic = false;
    }
    
    sendSSE('status', [
        'message' => 'Processing ' . count($places) . ' results from Serper...',
        'engine' => 'Serper',
        'progress' => 30
    ]);
    
    foreach ($places as $index => $item) {
        if (count($allResults) >= $limit) break;
        
        if ($isOrganic) {
            $business = [
                'id' => generateId('srpr_'),
                'name' => $item['title'] ?? '',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?? '',
                'address' => '',
                'phone' => '',
                'rating' => null,
                'reviews' => null,
                'source' => 'Serper Organic',
                'sources' => ['Serper Organic']
            ];
        } else {
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
        }
        
        if (empty($business['name'])) continue;
        if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;
        
        $dedupeKey = buildBusinessDedupeKey($business, $location);
        if (isset($seenBusinesses[$dedupeKey])) continue;
        
        $seenBusinesses[$dedupeKey] = count($allResults);
        $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
        $allResults[] = $business;
        $totalResults++;
        
        // Stream each result (frontend expects "results" with "leads")
        $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
        sendSSE('results', [
            'leads' => [$business],
            'total' => $totalResults,
            'progress' => $progress,
            'source' => $business['source'] ?? 'Serper'
        ]);
        
        // Minimal delay - 5ms instead of 10ms
        usleep(5000);
    }
    
    // If we need more results, try Maps search
    if (count($allResults) < $limit) {
        sendSSE('status', [
            'message' => 'Searching additional sources...',
            'engine' => 'Serper Maps',
            'progress' => 60
        ]);
        
        $mapsPayload = [
            'q' => $query,
            'gl' => 'us',
            'hl' => 'en'
        ];
        
        $mapsResponse = curlRequest('https://google.serper.dev/maps', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($mapsPayload),
            CURLOPT_HTTPHEADER => [
                'X-API-KEY: ' . SERPER_API_KEY,
                'Content-Type: application/json'
            ]
        ]);
        
        if ($mapsResponse['httpCode'] === 200) {
            $mapsData = json_decode($mapsResponse['response'], true);
            $mapsPlaces = $mapsData['places'] ?? [];
            
            foreach ($mapsPlaces as $item) {
                if (count($allResults) >= $limit) break;
                
                $business = [
                    'id' => generateId('srpm_'),
                    'name' => $item['title'] ?? '',
                    'url' => $item['website'] ?? '',
                    'snippet' => $item['category'] ?? '',
                    'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
                    'address' => $item['address'] ?? '',
                    'phone' => $item['phoneNumber'] ?? '',
                    'rating' => $item['rating'] ?? null,
                    'reviews' => $item['ratingCount'] ?? null,
                    'source' => 'Serper Maps',
                    'sources' => ['Serper Maps']
                ];
                
                if (empty($business['name'])) continue;
                if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;
                
                $dedupeKey = buildBusinessDedupeKey($business, $location);
                if (isset($seenBusinesses[$dedupeKey])) continue;
                
                $seenBusinesses[$dedupeKey] = count($allResults);
                $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
                $allResults[] = $business;
                $totalResults++;
                
                $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                sendSSE('results', [
                    'leads' => [$business],
                    'total' => $totalResults,
                    'progress' => $progress,
                    'source' => $business['source'] ?? 'Serper Maps'
                ]);
                
                usleep(5000);
            }
        }
    }
    
    // Send completion
    sendSSE('complete', [
        'totalResults' => $totalResults,
        'message' => "Search complete! Found {$totalResults} businesses."
    ]);
}
