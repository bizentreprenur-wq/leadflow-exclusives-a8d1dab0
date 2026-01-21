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
    
    $query = "$service in $location";
    $allResults = [];
    $resultsPerPage = 20;
    $maxPages = ceil($limit / $resultsPerPage); // Calculate pages needed for limit
    $maxPages = min($maxPages, 100); // Cap at 100 pages (2000 results max)
    
    for ($page = 0; $page < $maxPages; $page++) {
        // Stop if we have enough results
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
        
        // Add pagination offset for subsequent pages
        if ($page > 0) {
            $params['start'] = $page * $resultsPerPage;
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        
        $response = curlRequest($url);
        
        if ($response['httpCode'] !== 200) {
            // If first page fails, throw error; otherwise just stop pagination
            if ($page === 0) {
                throw new Exception('Failed to fetch search results from SerpAPI');
            }
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['local_results']) || empty($data['local_results'])) {
            break; // No more results
        }
        
        foreach ($data['local_results'] as $item) {
            // Stop if we've reached the limit
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
            
            // Analyze website if exists
            if (!empty($websiteUrl)) {
                $business['websiteAnalysis'] = analyzeWebsite($websiteUrl);
            } else {
                $business['websiteAnalysis'] = [
                    'hasWebsite' => false,
                    'platform' => null,
                    'needsUpgrade' => true,
                    'issues' => ['No website found']
                ];
            }
            
            $allResults[] = $business;
        }
        
        // Check if there are more pages
        if (!isset($data['serpapi_pagination']['next'])) {
            break;
        }
        
        // Small delay to avoid rate limiting
        usleep(200000); // 200ms delay between requests
    }
    
    return $allResults;
}

// Mock data functions removed - real API results only
