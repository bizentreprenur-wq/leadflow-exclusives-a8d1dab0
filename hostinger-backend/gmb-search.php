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

// Require authentication and enforce rate limit
$user = requireAuth();
enforceRateLimit($user, 'search');

// Get and validate input
$input = getJsonInput();
if (!$input) {
    sendError('Invalid JSON input');
}

$service = sanitizeInput($input['service'] ?? '');
$location = sanitizeInput($input['location'] ?? '');

if (empty($service)) {
    sendError('Service type is required');
}

if (empty($location)) {
    sendError('Location is required');
}

try {
    $cacheKey = "gmb_search_{$service}_{$location}";
    
    // Check cache
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        sendJson([
            'success' => true,
            'data' => $cached,
            'query' => [
                'service' => $service,
                'location' => $location
            ],
            'cached' => true
        ]);
    }
    
    $results = searchGMBListings($service, $location);
    
    // Cache results
    setCache($cacheKey, $results);
    
    sendJson([
        'success' => true,
        'data' => $results,
        'query' => [
            'service' => $service,
            'location' => $location
        ]
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
 * Fetches multiple pages for more comprehensive results
 */
function searchGMBListings($service, $location) {
    $apiKey = defined('SERPAPI_KEY') ? SERPAPI_KEY : '';
    
    if (empty($apiKey)) {
        // Return mock data if API not configured
        return getMockResults($service, $location);
    }
    
    $query = "$service in $location";
    $allResults = [];
    $maxPages = 3; // Fetch up to 3 pages (60+ results)
    $nextPageToken = null;
    
    for ($page = 0; $page < $maxPages; $page++) {
        $params = [
            'engine' => 'google_maps',
            'q' => $query,
            'type' => 'search',
            'api_key' => $apiKey,
            'll' => '@29.7604267,-95.3698028,11z', // Houston coordinates with zoom
        ];
        
        // Add pagination token if available
        if ($nextPageToken) {
            $params['start'] = $page * 20;
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
        
        $nextPageToken = true;
        
        // Small delay to avoid rate limiting
        usleep(200000); // 200ms delay between requests
    }
    
    return $allResults;
}

/**
 * Return mock results when API is not configured
 */
function getMockResults($service, $location) {
    return [
        [
            'id' => 'mock_1',
            'name' => "Best $service Services",
            'url' => 'https://example-business.com',
            'snippet' => "Top rated $service in $location area",
            'displayLink' => 'example-business.com',
            'address' => "123 Main St, $location",
            'phone' => '(555) 123-4567',
            'rating' => 4.5,
            'reviews' => 42,
            'websiteAnalysis' => [
                'hasWebsite' => true,
                'platform' => 'WordPress',
                'needsUpgrade' => true,
                'issues' => ['Not mobile responsive', 'Outdated jQuery version'],
                'mobileScore' => 45
            ]
        ],
        [
            'id' => 'mock_2',
            'name' => "$location $service Pros",
            'url' => 'https://example-pros.com',
            'snippet' => "Professional $service services in $location",
            'displayLink' => 'example-pros.com',
            'address' => "456 Oak Ave, $location",
            'phone' => '(555) 987-6543',
            'rating' => 4.8,
            'reviews' => 127,
            'websiteAnalysis' => [
                'hasWebsite' => true,
                'platform' => 'Wix',
                'needsUpgrade' => false,
                'issues' => [],
                'mobileScore' => 85
            ]
        ],
        [
            'id' => 'mock_3',
            'name' => "Quick $service Co",
            'url' => '',
            'snippet' => "Fast and reliable $service",
            'displayLink' => '',
            'address' => "789 Elm St, $location",
            'phone' => '(555) 456-7890',
            'rating' => 4.2,
            'reviews' => 18,
            'websiteAnalysis' => [
                'hasWebsite' => false,
                'platform' => null,
                'needsUpgrade' => true,
                'issues' => ['No website found'],
                'mobileScore' => null
            ]
        ]
    ];
}
