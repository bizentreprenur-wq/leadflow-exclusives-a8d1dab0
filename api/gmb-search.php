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
$limit = intval($input['limit'] ?? 100); // Default 100, max 2000

// Validate limit (min 20, max 2000)
$limit = max(20, min(2000, $limit));

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
 * Search for GMB listings using SerpAPI Google Maps
 * Fetches multiple pages for comprehensive results up to the specified limit
 */
function searchGMBListings($service, $location, $limit = 100) {
    $apiKey = defined('SERPAPI_KEY') ? SERPAPI_KEY : '';
    
    if (empty($apiKey)) {
        // NO MOCK DATA - require real API key
        throw new Exception('SERPAPI_KEY is not configured. Please add it to config.php for real search results.');
    }
    
    // Increase PHP time limit for large searches
    set_time_limit(300); // 5 minutes max
    
    $query = "$service in $location";
    $allResults = [];
    $resultsPerPage = 20;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 100); // Cap at 100 pages (2000 results max)
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($allResults) >= $limit) {
            break;
        }
        
        $params = [
            'engine' => 'google_maps',
            'q' => $query,
            'type' => 'search',
            'api_key' => $apiKey,
            'hl' => 'en',
            'num' => $resultsPerPage,
        ];
        
        if ($page > 0) {
            $params['start'] = $page * $resultsPerPage;
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        
        $response = curlRequest($url);
        
        if ($response['httpCode'] !== 200) {
            if ($page === 0) {
                throw new Exception('Failed to fetch search results from SerpAPI');
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['local_results']) || empty($data['local_results'])) {
            break;
        }
        
        foreach ($data['local_results'] as $item) {
            if (count($allResults) >= $limit) {
                break;
            }
            
            $websiteUrl = $item['website'] ?? '';
            
            $business = [
                'id' => generateId('gmb_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $websiteUrl,
                'snippet' => $item['description'] ?? ($item['type'] ?? ''),
                'displayLink' => parse_url($websiteUrl, PHP_URL_HOST) ?? '',
                'address' => $item['address'] ?? '',
                'phone' => $item['phone'] ?? '',
                'rating' => $item['rating'] ?? null,
                'reviews' => $item['reviews'] ?? null,
                'placeId' => $item['place_id'] ?? '',
            ];
            
            // SKIP deep website analysis to prevent timeout
            // Use quick detection from URL only
            if (!empty($websiteUrl)) {
                $business['websiteAnalysis'] = quickWebsiteCheck($websiteUrl);
            } else {
                $business['websiteAnalysis'] = [
                    'hasWebsite' => false,
                    'platform' => null,
                    'needsUpgrade' => true,
                    'issues' => ['No website found'],
                    'mobileScore' => null,
                    'loadTime' => null
                ];
            }
            
            $allResults[] = $business;
        }
        
        if (!isset($data['serpapi_pagination']['next'])) {
            break;
        }
        
        // Minimal delay
        usleep(100000); // 100ms delay
    }
    
    return $allResults;
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
