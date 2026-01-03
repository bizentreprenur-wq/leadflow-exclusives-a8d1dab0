<?php
/**
 * GMB Search API Endpoint
 * Searches for businesses using Google Custom Search API
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

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
 */
function searchGMBListings($service, $location) {
    $apiKey = defined('SERPAPI_KEY') ? SERPAPI_KEY : '';
    
    if (empty($apiKey)) {
        // Return mock data if API not configured
        return getMockResults($service, $location);
    }
    
    $query = "$service in $location";
    $url = "https://serpapi.com/search.json?" . http_build_query([
        'engine' => 'google_maps',
        'q' => $query,
        'type' => 'search',
        'api_key' => $apiKey
    ]);
    
    $response = curlRequest($url);
    
    if ($response['httpCode'] !== 200) {
        throw new Exception('Failed to fetch search results from SerpAPI');
    }
    
    $data = json_decode($response['response'], true);
    
    if (!isset($data['local_results'])) {
        return [];
    }
    
    $results = [];
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
        
        $results[] = $business;
    }
    
    return $results;
}

/**
 * Analyze a business website for quality indicators
 */
function analyzeBusinessWebsite($business) {
    if (empty($business['url'])) {
        $business['websiteAnalysis'] = [
            'hasWebsite' => false,
            'platform' => null,
            'needsUpgrade' => true,
            'issues' => ['No website found']
        ];
        return $business;
    }
    
    // Try to fetch the website
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $business['url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0)');
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $analysis = [
        'hasWebsite' => $httpCode === 200,
        'platform' => null,
        'needsUpgrade' => false,
        'issues' => [],
        'mobileScore' => null
    ];
    
    if ($httpCode !== 200 || empty($html)) {
        $analysis['hasWebsite'] = false;
        $analysis['needsUpgrade'] = true;
        $analysis['issues'][] = 'Website not accessible';
        $business['websiteAnalysis'] = $analysis;
        return $business;
    }
    
    // Detect platform
    $analysis['platform'] = detectPlatform($html);
    
    // Check for common issues
    $analysis['issues'] = detectIssues($html);
    
    // Determine if needs upgrade
    $analysis['needsUpgrade'] = count($analysis['issues']) >= 2 || 
                                 $analysis['platform'] === 'outdated' ||
                                 strpos($html, 'viewport') === false;
    
    $business['websiteAnalysis'] = $analysis;
    return $business;
}

/**
 * Detect the website platform
 */
function detectPlatform($html) {
    $html = strtolower($html);
    
    if (strpos($html, 'wp-content') !== false || strpos($html, 'wordpress') !== false) {
        return 'WordPress';
    }
    if (strpos($html, 'wix.com') !== false) {
        return 'Wix';
    }
    if (strpos($html, 'squarespace') !== false) {
        return 'Squarespace';
    }
    if (strpos($html, 'shopify') !== false) {
        return 'Shopify';
    }
    if (strpos($html, 'webflow') !== false) {
        return 'Webflow';
    }
    if (strpos($html, 'godaddy') !== false) {
        return 'GoDaddy';
    }
    if (strpos($html, 'weebly') !== false) {
        return 'Weebly';
    }
    
    return 'Custom/Unknown';
}

/**
 * Detect common website issues
 */
function detectIssues($html) {
    $issues = [];
    
    // Check for mobile responsiveness
    if (strpos($html, 'viewport') === false) {
        $issues[] = 'Not mobile responsive';
    }
    
    // Check for HTTPS (already handled by curl follow redirect)
    
    // Check for slow-loading indicators
    if (strlen($html) > 500000) {
        $issues[] = 'Large page size (slow loading)';
    }
    
    // Check for outdated HTML
    if (strpos($html, '<!doctype html>') === false && strpos($html, '<!DOCTYPE html>') === false) {
        $issues[] = 'Outdated HTML structure';
    }
    
    // Check for missing meta description
    if (strpos($html, 'meta name="description"') === false && strpos($html, "meta name='description'") === false) {
        $issues[] = 'Missing meta description (bad SEO)';
    }
    
    // Check for old jQuery
    if (preg_match('/jquery[.-]?1\.[0-9]/', strtolower($html))) {
        $issues[] = 'Outdated jQuery version';
    }
    
    // Check for Flash content
    if (strpos($html, 'swfobject') !== false || strpos($html, '.swf') !== false) {
        $issues[] = 'Uses Flash (deprecated)';
    }
    
    return $issues;
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
