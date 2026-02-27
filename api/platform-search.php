<?php
/**
 * Platform Search API Endpoint
 * Searches Google & Bing for businesses using specific website platforms
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
// Use getCurrentUser() which returns null instead of exiting with 401
$user = getCurrentUser();

// Apply rate limiting only for authenticated users
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
$platforms = isset($input['platforms']) && is_array($input['platforms']) ? $input['platforms'] : [];
$limit = isset($input['limit']) ? min(2000, max(10, intval($input['limit']))) : 100; // Default 100, max 2000
$filters = normalizeSearchFilters($input['filters'] ?? null);

if (empty($service)) {
    sendError('Service type is required');
}

if (empty($location)) {
    sendError('Location is required');
}

if (empty($platforms)) {
    sendError('At least one platform must be selected');
}

// Sanitize platforms
$platforms = array_map(function($p) {
    return sanitizeInput($p, 50);
}, array_slice($platforms, 0, 20));

$filters['platformMode'] = true;
$filters['platforms'] = $platforms;

try {
    $rawSerperOnly = forceRawSerperOnlyMode();
    $filtersKey = md5(json_encode($filters));
    $cacheMode = $rawSerperOnly ? 'rawserper' : 'normal';
    $cacheKey = "platform_search_{$cacheMode}_{$service}_{$location}_" . implode(',', $platforms) . "_{$limit}_{$filtersKey}";
    
    // Check cache
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        $cachedLeads = is_array($cached) && array_key_exists('leads', $cached) ? ($cached['leads'] ?? []) : $cached;
        $cachedDiagnostics = is_array($cached) && array_key_exists('diagnostics', $cached) ? ($cached['diagnostics'] ?? null) : null;
        sendJson([
            'success' => true,
            'data' => $cachedLeads,
            'diagnostics' => $cachedDiagnostics,
            'query' => [
                'service' => $service,
                'location' => $location,
                'platforms' => $platforms
            ],
            'cached' => true
        ]);
    }
    
    $searchOutput = searchPlatformsFunc($service, $location, $platforms, $limit, $filters, $rawSerperOnly);
    $results = is_array($searchOutput) && array_key_exists('leads', $searchOutput) ? ($searchOutput['leads'] ?? []) : $searchOutput;
    $diagnostics = is_array($searchOutput) && array_key_exists('diagnostics', $searchOutput) ? ($searchOutput['diagnostics'] ?? null) : null;
    
    // Cache results
    setCache($cacheKey, [
        'leads' => $results,
        'diagnostics' => $diagnostics,
    ]);
    
    sendJson([
        'success' => true,
        'data' => $results,
        'diagnostics' => $diagnostics,
        'query' => [
            'service' => $service,
            'location' => $location,
            'platforms' => $platforms
        ]
    ]);
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred while searching', 500);
    }
}

/**
 * Search for businesses using specific platforms
 */
function searchPlatformsFunc($service, $location, $platforms, $limit = 50, $filters = [], $rawSerperOnly = false) {
    // Increase PHP time limit for large searches
    set_time_limit(300); // 5 minutes max
    $filters = normalizeSearchFilters($filters);
    $filters['platformMode'] = true;
    $filters['platforms'] = $platforms;
    $diagnostics = [
        'rawCandidates' => 0,
        'invalidDomainCandidates' => 0,
        'dedupedCandidates' => 0,
        'preFilterCandidates' => 0,
        'filterMatchedCandidates' => 0,
        'filterRejectedCandidates' => 0,
        'filterRejections' => [
            'phoneOnly' => 0,
            'noWebsite' => 0,
            'notMobile' => 0,
            'outdated' => 0,
            'platforms' => 0,
            'combined' => 0,
        ],
        'queriesExecuted' => 0,
        'finalResults' => 0,
    ];
    
    // Build platform query modifiers and search in chunks so every platform is represented.
    $platformQueries = buildPlatformQueries($platforms);
    $queryGroups = array_chunk($platformQueries, 3);

    $unique = [];
    $seen = [];
    $hasSerper = defined('SERPER_API_KEY') && !empty(SERPER_API_KEY);
    $hasSerpApi = !$rawSerperOnly && defined('SERPAPI_KEY') && !empty(SERPAPI_KEY);
    $hasGoogleApi = !$rawSerperOnly && !empty(GOOGLE_API_KEY) && !empty(GOOGLE_SEARCH_ENGINE_ID);
    $hasBingApi = !$rawSerperOnly && !empty(BING_API_KEY);

    $addResults = function($results) use (&$unique, &$seen, &$diagnostics) {
        foreach ($results as $result) {
            $diagnostics['rawCandidates']++;
            $domain = parse_url($result['url'], PHP_URL_HOST);
            if (!$domain) {
                $diagnostics['invalidDomainCandidates']++;
                continue;
            }
            if (isset($seen[$domain])) {
                $diagnostics['dedupedCandidates']++;
                continue;
            }
            $seen[$domain] = true;
            $unique[] = $result;
        }
    };

    $serviceVariants = expandServiceSynonyms($service);
    if (empty($serviceVariants)) {
        $serviceVariants = [$service];
    } elseif (!in_array($service, $serviceVariants, true)) {
        array_unshift($serviceVariants, $service);
    }
    $serviceVariantCap = 3;
    if ($limit >= 250) $serviceVariantCap = 5;
    if ($limit >= 500) $serviceVariantCap = 7;
    if ($limit >= 1000) $serviceVariantCap = 9;
    $serviceVariants = array_slice(array_values(array_unique($serviceVariants)), 0, $serviceVariantCap);

    // Geo expansion disabled
    $locationVariants = [$location];

    $searchCombos = [];
    foreach ($locationVariants as $locVariant) {
        foreach ($serviceVariants as $serviceVariant) {
            $comboKey = strtolower(trim($serviceVariant)) . '|' . strtolower(trim($locVariant));
            if (!isset($searchCombos[$comboKey])) {
                $searchCombos[$comboKey] = [
                    'service' => $serviceVariant,
                    'location' => $locVariant,
                ];
            }
        }
    }
    $comboCap = 24;
    if ($limit >= 250) $comboCap = 40;
    if ($limit >= 500) $comboCap = 56;
    if ($limit >= 1000) $comboCap = 72;
    $searchCombos = array_slice(array_values($searchCombos), 0, $comboCap);

    foreach ($searchCombos as $combo) {
        if (count($unique) >= $limit) {
            break;
        }

        foreach ($queryGroups as $group) {
            if (count($unique) >= $limit) {
                break 2;
            }
            $diagnostics['queriesExecuted']++;
            $remaining = $limit - count($unique);
            $comboService = $combo['service'];
            $comboLocation = $combo['location'];

            // Prefer SerpAPI; only fall back to Serper if SerpAPI credits are exhausted
            if ($hasSerpApi) {
                try {
                    $addResults(searchSerpApi($comboService, $comboLocation, $group, $remaining));
                } catch (Exception $e) {
                    if (isSerpApiCreditsError($e->getMessage()) && $hasSerper) {
                        $addResults(searchSerper($comboService, $comboLocation, $group, $remaining));
                    } else {
                        throw $e;
                    }
                }
            } elseif ($hasSerper) {
                $addResults(searchSerper($comboService, $comboLocation, $group, $remaining));
            } elseif ($hasGoogleApi) {
                $addResults(searchGoogle($comboService, $comboLocation, $group, $remaining));
            }

            // Search Bing if API key is available
            if ($hasBingApi && count($unique) < $limit) {
                $addResults(searchBing($comboService, $comboLocation, $group, $remaining));
            }
        }
    }

    if (empty($unique)) {
        if ($rawSerperOnly && !$hasSerper) {
            throw new Exception('Raw Serper-only mode requires SERPER_API_KEY in config.php');
        }
        if (!$hasSerper && !$hasSerpApi && !$hasGoogleApi && !$hasBingApi) {
            throw new Exception('No search API configured. Please set SERPER_API_KEY, SERPAPI_KEY, GOOGLE_API_KEY, or BING_API_KEY in config.php');
        }
        throw new Exception('Search API returned 0 results. Verify your API keys or try a different query.');
    }
    
    // Use QUICK website analysis (URL-based only) to avoid timeouts
    // Also extract contact info from snippet text
    $enriched = array_map(function($result) {
        $result['websiteAnalysis'] = quickWebsiteCheck($result['url']);
        // Extract email from snippet if not already present
        if (empty($result['email'])) {
            $result['email'] = extractEmailFromSnippet($result['snippet'] ?? '');
        }
        // Extract phone from snippet if not already present
        if (empty($result['phone'])) {
            $result['phone'] = extractPhoneFromSnippet($result['snippet'] ?? '');
        }
        return $result;
    }, array_slice($unique, 0, $limit));

    // Enforce selected Option B filters on Serper/SerpAPI results
    $diagnostics['preFilterCandidates'] = count($enriched);
    $filteredLeads = [];
    foreach ($enriched as $lead) {
        if (matchesSearchFilters($lead, $filters)) {
            $diagnostics['filterMatchedCandidates']++;
            $filteredLeads[] = $lead;
            continue;
        }
        $diagnostics['filterRejectedCandidates']++;
        $reasons = getSearchFilterFailureReasons($lead, $filters);
        foreach ($reasons as $reason) {
            if (!isset($diagnostics['filterRejections'][$reason])) {
                $reason = 'combined';
            }
            $diagnostics['filterRejections'][$reason]++;
        }
    }
    
    // Return raw filtered Serper-derived lead rows (no enrichment prioritization reshuffle).
    $final = array_slice($filteredLeads, 0, $limit);
    $diagnostics['finalResults'] = count($final);
    return [
        'leads' => $final,
        'diagnostics' => $diagnostics,
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

/**
 * Search using Serper.dev (Google Search - Cheapest option)
 */
function searchSerper($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    
    // Build query
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    // Serper returns up to 100 results per request with num parameter
    $resultsPerPage = min(100, $limit);
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 10); // Serper supports pagination
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        $payload = [
            'q' => $baseQuery,
            'num' => min($resultsPerPage, $limit - count($results)),
            'gl' => 'us',
            'hl' => 'en'
        ];
        
        if ($page > 0) {
            $payload['page'] = $page + 1;
        }
        
        $response = curlRequest('https://google.serper.dev/search', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'X-API-KEY: ' . SERPER_API_KEY,
                'Content-Type: application/json'
            ]
        ]);
        
        if ($response['httpCode'] !== 200) {
            $message = 'Serper error: HTTP ' . $response['httpCode'];
            $decoded = json_decode($response['response'], true);
            if (is_array($decoded)) {
                $message = $decoded['message'] ?? $decoded['error'] ?? $message;
            }
            if (DEBUG_MODE) {
                error_log($message . ' - ' . $response['response']);
            }
            if ($page === 0) {
                throw new Exception($message);
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['organic']) || empty($data['organic'])) {
            break; // No more results
        }
        
        foreach ($data['organic'] as $item) {
            if (count($results) >= $limit) {
                break 2;
            }
            $results[] = [
                'id' => generateId('srpr_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?: '',
                'source' => 'serper',
                'phone' => extractPhoneFromSnippet($item['snippet'] ?? ''),
                'address' => ''
            ];
        }
    }
    
    return $results;
}

/**
 * Search using SerpAPI (Google Search - Fallback)
 */
function searchSerpApi($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    
    // Build query
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    // SerpAPI often caps results at 10 per page on lower plans, so paginate in 10s.
    $resultsPerPage = 10;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 50);
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        $params = [
            'api_key' => SERPAPI_KEY,
            'engine' => 'google',
            'q' => $baseQuery,
            'num' => min($resultsPerPage, $limit - count($results))
        ];
        
        if ($page > 0) {
            $params['start'] = $page * $resultsPerPage;
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        
        $timeout = defined('SERPAPI_TIMEOUT_SEC') ? max(5, (int)SERPAPI_TIMEOUT_SEC) : 30;
        $response = curlRequest($url, [
            CURLOPT_CONNECTTIMEOUT => defined('SERPAPI_CONNECT_TIMEOUT_SEC') ? max(3, (int)SERPAPI_CONNECT_TIMEOUT_SEC) : 10,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ], $timeout);
        
        if ($response['httpCode'] !== 200) {
            $message = 'SerpAPI error: HTTP ' . $response['httpCode'];
            if (!empty($response['error'])) {
                $message .= ' - cURL: ' . $response['error'];
            }
            $decoded = json_decode($response['response'], true);
            if (is_array($decoded)) {
                $message = $decoded['error'] ?? $decoded['error_message'] ?? $message;
            }
            if (DEBUG_MODE) {
                error_log($message . ' - ' . $response['response']);
            }
            if ($page === 0) {
                throw new Exception($message);
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['organic_results']) || empty($data['organic_results'])) {
            break;
        }
        
        foreach ($data['organic_results'] as $item) {
            if (count($results) >= $limit) {
                break 2;
            }
            $results[] = [
                'id' => generateId('serp_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => $item['displayed_link'] ?? parse_url($item['link'] ?? '', PHP_URL_HOST) ?: '',
                'source' => 'serpapi',
                'phone' => extractPhoneFromSnippet($item['snippet'] ?? ''),
                'address' => $item['address'] ?? ''
            ];
        }
    }
    
    return $results;
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
 * Extract phone number from text if present
 */
function extractPhoneFromSnippet($text) {
    if (preg_match('/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $text, $matches)) {
        return $matches[0];
    }
    return null;
}

/**
 * Extract email address from text if present
 */
function extractEmailFromSnippet($text) {
    // Common email pattern
    if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
        $email = strtolower($matches[0]);
        // Filter out common non-business emails
        $excludePatterns = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.'];
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
 * Build search query modifiers for platforms
 */
function buildPlatformQueries($platforms) {
    $modifiers = [];
    
    $platformIndicators = [
        'wordpress' => 'site:*.wordpress.com OR "powered by wordpress" OR "wp-content"',
        'wix' => 'site:*.wix.com OR site:*.wixsite.com OR "built with wix"',
        'weebly' => 'site:*.weebly.com OR "powered by weebly"',
        'godaddy' => '"godaddy website" OR site:*.godaddysites.com',
        'squarespace' => 'site:*.squarespace.com OR "powered by squarespace"',
        'joomla' => '"powered by joomla" OR "joomla!"',
        'drupal' => '"powered by drupal"',
        'webcom' => 'site:*.web.com',
        'jimdo' => 'site:*.jimdofree.com OR site:*.jimdo.com',
        'opencart' => '"powered by opencart"',
        'prestashop' => '"powered by prestashop"',
        'magento' => '"powered by magento"',
        'zencart' => '"powered by zen cart"',
        'oscommerce' => '"powered by oscommerce"',
        'customhtml' => 'inurl:".html" OR inurl:".htm"',
        'customphp' => 'inurl:".php"',
        // GMB/Google Maps - searches for local business listings
        'gmb' => 'site:google.com/maps OR site:maps.google.com OR "google.com/maps/place"',
        // Social platforms
        'linkedin' => 'site:linkedin.com/company OR site:linkedin.com/in',
    ];
    
    foreach ($platforms as $platform) {
        $key = strtolower($platform);
        if (isset($platformIndicators[$key])) {
            $modifiers[] = $platformIndicators[$key];
        }
    }
    
    return $modifiers;
}

/**
 * Search Google Custom Search API with pagination
 */
function searchGoogle($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    
    // Build query
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    // Google CSE max is 10 per request, paginate for larger limits
    $resultsPerPage = 10;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 10); // Google CSE limits to 100 results total
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        $params = [
            'key' => GOOGLE_API_KEY,
            'cx' => GOOGLE_SEARCH_ENGINE_ID,
            'q' => $baseQuery,
            'num' => $resultsPerPage
        ];
        
        if ($page > 0) {
            $params['start'] = ($page * $resultsPerPage) + 1;
        }
        
        $url = "https://www.googleapis.com/customsearch/v1?" . http_build_query($params);
        
        $response = curlRequest($url);
        
        if ($response['httpCode'] !== 200) {
            if (DEBUG_MODE && $page === 0) {
                throw new Exception('Google API error: ' . $response['httpCode']);
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['items']) || empty($data['items'])) {
            break;
        }
        
        foreach ($data['items'] as $item) {
            if (count($results) >= $limit) {
                break 2;
            }
            $results[] = [
                'id' => generateId('goog_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => $item['displayLink'] ?? '',
                'source' => 'google'
            ];
        }
    }
    
    return $results;
}

/**
 * Search Bing Web Search API with pagination
 */
function searchBing($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    
    // Build query
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    // Bing max is 50 per request, paginate for larger limits
    $resultsPerPage = 50;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 60); // Increased from 40 to 60 pages for better results
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        $params = [
            'q' => $baseQuery,
            'count' => min($resultsPerPage, $limit - count($results)),
            'responseFilter' => 'Webpages'
        ];
        
        if ($page > 0) {
            $params['offset'] = $page * $resultsPerPage;
        }
        
        $url = "https://api.bing.microsoft.com/v7.0/search?" . http_build_query($params);
        
        $response = curlRequest($url, [
            CURLOPT_HTTPHEADER => [
                'Ocp-Apim-Subscription-Key: ' . BING_API_KEY
            ]
        ]);
        
        if ($response['httpCode'] !== 200) {
            if (DEBUG_MODE && $page === 0) {
                throw new Exception('Bing API error: ' . $response['httpCode']);
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['webPages']['value']) || empty($data['webPages']['value'])) {
            break;
        }
        
        foreach ($data['webPages']['value'] as $item) {
            if (count($results) >= $limit) {
                break 2;
            }
            $results[] = [
                'id' => generateId('bing_'),
                'name' => $item['name'] ?? 'Unknown Business',
                'url' => $item['url'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => parse_url($item['url'] ?? '', PHP_URL_HOST) ?: '',
                'source' => 'bing'
            ];
        }
    }
    
    return $results;
}

// Mock data functions removed - real API results only
