<?php
/**
 * GMB Search API Endpoint
 * Searches for businesses using SerpAPI Google Maps
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

// Validate limit (min 20, max 50000)
$limit = max(20, min(50000, $limit));

if (empty($service)) {
    sendError('Service type is required');
}

if (empty($location)) {
    sendError('Location is required');
}

try {
    $cacheKey = "gmb_search_{$service}_{$location}_{$limit}";
    
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
    
    $results = searchGMBListings($service, $location, $limit);
    
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
        'totalResults' => count($results)
    ]);
} catch (Exception $e) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred while searching', 500);
    }
}

/**
 * Search for business listings using multiple SerpAPI engines
 * Queries Google Maps, Yelp, and Bing Local for comprehensive results
 */
function searchGMBListings($service, $location, $limit = 100) {
    $apiKey = defined('SERPAPI_KEY') ? SERPAPI_KEY : '';
    
    if (empty($apiKey)) {
        throw new Exception('SERPAPI_KEY is not configured. Please add it to config.php for real search results.');
    }
    
    set_time_limit(3600); // 60 min for massive searches
    
    $query = "$service in $location";
    $allResults = [];
    $seenBusinesses = [];
    
    // Search engines supported by SerpAPI
    $searchEngines = [
        ['engine' => 'google_maps', 'name' => 'Google Maps', 'resultsKey' => 'local_results'],
        ['engine' => 'yelp', 'name' => 'Yelp', 'resultsKey' => 'organic_results'],
        ['engine' => 'bing_local', 'name' => 'Bing Places', 'resultsKey' => 'local_results'],
    ];
    
    $resultsPerEngine = ceil($limit / count($searchEngines));
    
    foreach ($searchEngines as $engineConfig) {
        if (count($allResults) >= $limit) {
            break;
        }
        
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
            
            $dedupeKey = strtolower(trim($business['name'])) . '|' . strtolower(trim($business['address'] ?? ''));
            
            if (!isset($seenBusinesses[$dedupeKey])) {
                $seenBusinesses[$dedupeKey] = true;
                $business['sources'] = [$engineConfig['name']];
                $allResults[] = $business;
            } else {
                // Update existing with additional source
                foreach ($allResults as &$existing) {
                    $existingKey = strtolower(trim($existing['name'])) . '|' . strtolower(trim($existing['address'] ?? ''));
                    if ($existingKey === $dedupeKey && !in_array($engineConfig['name'], $existing['sources'] ?? [])) {
                        $existing['sources'][] = $engineConfig['name'];
                        break;
                    }
                }
            }
        }
        
        usleep(200000); // 200ms between engines
    }
    
    return $allResults;
}

/**
 * Search a single SerpAPI engine (non-streaming version)
 */
function searchSingleEngineNonStream($apiKey, $engine, $query, $resultsKey, $limit, $sourceName) {
    $results = [];
    $resultsPerPage = 20;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 10);
    
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
        } elseif ($engine === 'bing_local') {
            if ($page > 0) {
                $params['first'] = $page * $resultsPerPage;
            }
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = curlRequest($url);
        
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
            
            $business = normalizeBusinessResultNonStream($item, $engine, $sourceName);
            if ($business) {
                $results[] = $business;
            }
        }
        
        if (!isset($data['serpapi_pagination']['next'])) {
            break;
        }
        
        usleep(100000);
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
