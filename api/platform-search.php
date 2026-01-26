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

try {
    $cacheKey = "platform_search_{$service}_{$location}_" . implode(',', $platforms) . "_{$limit}";
    
    // Check cache
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        sendJson([
            'success' => true,
            'data' => $cached,
            'query' => [
                'service' => $service,
                'location' => $location,
                'platforms' => $platforms
            ],
            'cached' => true
        ]);
    }
    
    $results = searchPlatformsFunc($service, $location, $platforms, $limit);
    
    // Cache results
    setCache($cacheKey, $results);
    
    sendJson([
        'success' => true,
        'data' => $results,
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
function searchPlatformsFunc($service, $location, $platforms, $limit = 50) {
    // Increase PHP time limit for large searches
    set_time_limit(300); // 5 minutes max
    
    // Build platform query modifiers and search in chunks so every platform is represented.
    $platformQueries = buildPlatformQueries($platforms);
    $queryGroups = array_chunk($platformQueries, 3);

    $unique = [];
    $seen = [];
    $hasSerpApi = defined('SERPAPI_KEY') && !empty(SERPAPI_KEY);
    $hasGoogleApi = !empty(GOOGLE_API_KEY) && !empty(GOOGLE_SEARCH_ENGINE_ID);
    $hasBingApi = !empty(BING_API_KEY);

    $addResults = function($results) use (&$unique, &$seen) {
        foreach ($results as $result) {
            $domain = parse_url($result['url'], PHP_URL_HOST);
            if (!$domain || isset($seen[$domain])) {
                continue;
            }
            $seen[$domain] = true;
            $unique[] = $result;
        }
    };

    foreach ($queryGroups as $group) {
        if (count($unique) >= $limit) {
            break;
        }
        $remaining = $limit - count($unique);

        // Search using SerpAPI if key is available (preferred)
        if ($hasSerpApi) {
            $addResults(searchSerpApi($service, $location, $group, $remaining));
        }
        // Fallback: Search Google if API key is available
        elseif ($hasGoogleApi) {
            $addResults(searchGoogle($service, $location, $group, $remaining));
        }

        // Search Bing if API key is available
        if ($hasBingApi) {
            $addResults(searchBing($service, $location, $group, $remaining));
        }
    }

    if (empty($unique)) {
        if (!$hasSerpApi && !$hasGoogleApi && !$hasBingApi) {
            throw new Exception('No search API configured. Please set SERPAPI_KEY, GOOGLE_API_KEY, or BING_API_KEY in config.php');
        }
        throw new Exception('Search API returned 0 results. Verify your API keys or try a different query.');
    }
    
    // Use QUICK website analysis (URL-based only) to avoid timeouts
    return array_map(function($result) {
        $result['websiteAnalysis'] = quickWebsiteCheck($result['url']);
        return $result;
    }, array_slice($unique, 0, $limit));
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
 * Search using SerpAPI (Google Search)
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
    $maxPages = min($maxPages, 20); // Cap at 20 pages (2000 results max)
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        // SerpAPI location expects a strict canonical string; rely on query text to avoid hard errors.
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
        
        $response = curlRequest($url);
        
        if ($response['httpCode'] !== 200) {
            $message = 'SerpAPI error: HTTP ' . $response['httpCode'];
            $decoded = json_decode($response['response'], true);
            if (is_array($decoded)) {
                $message = $decoded['error'] ?? $decoded['error_message'] ?? $message;
            }
            if (DEBUG_MODE) {
                error_log($message . ' - ' . $response['response']);
            }
            // If first page fails, throw a clear error; otherwise return what we have.
            if ($page === 0) {
                throw new Exception($message);
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['organic_results']) || empty($data['organic_results'])) {
            break; // No more results
        }
        
        foreach ($data['organic_results'] as $item) {
            if (count($results) >= $limit) {
                break 2; // Exit both loops
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
    $maxPages = min($maxPages, 40); // Cap at 2000 results
    
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
