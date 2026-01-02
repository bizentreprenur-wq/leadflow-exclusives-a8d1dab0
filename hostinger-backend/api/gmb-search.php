<?php
/**
 * GMB Search API Endpoint
 * Searches for businesses using Google Custom Search API
 * 
 * Deploy this to your Hostinger hosting at: yourdomain.com/api/gmb-search.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load config
require_once __DIR__ . '/../config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

// Validate input
$service = isset($input['service']) ? trim($input['service']) : '';
$location = isset($input['location']) ? trim($input['location']) : '';

if (empty($service)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Service type is required']);
    exit();
}

if (empty($location)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Location is required']);
    exit();
}

// Sanitize inputs
$service = htmlspecialchars($service, ENT_QUOTES, 'UTF-8');
$location = htmlspecialchars($location, ENT_QUOTES, 'UTF-8');

// Limit input lengths
if (strlen($service) > 100 || strlen($location) > 100) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Input too long']);
    exit();
}

try {
    $results = searchGMBListings($service, $location);
    echo json_encode([
        'success' => true,
        'data' => $results,
        'query' => [
            'service' => $service,
            'location' => $location
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Search for GMB listings using Google Custom Search API
 */
function searchGMBListings($service, $location) {
    $query = urlencode("$service in $location site:google.com/maps");
    
    // Use Google Custom Search API
    $apiKey = GOOGLE_API_KEY;
    $searchEngineId = GOOGLE_SEARCH_ENGINE_ID;
    
    if (empty($apiKey) || empty($searchEngineId)) {
        // Return mock data if API not configured
        return getMockResults($service, $location);
    }
    
    $url = "https://www.googleapis.com/customsearch/v1?key=$apiKey&cx=$searchEngineId&q=$query&num=10";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('Failed to fetch search results');
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['items'])) {
        return [];
    }
    
    $results = [];
    foreach ($data['items'] as $item) {
        $results[] = [
            'id' => uniqid('gmb_'),
            'name' => $item['title'] ?? 'Unknown Business',
            'url' => $item['link'] ?? '',
            'snippet' => $item['snippet'] ?? '',
            'displayLink' => $item['displayLink'] ?? '',
        ];
    }
    
    // Analyze each result for website quality
    return array_map('analyzeBusinessWebsite', $results);
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
