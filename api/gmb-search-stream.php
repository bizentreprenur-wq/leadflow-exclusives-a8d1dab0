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

// Increase time limit for large searches
set_time_limit(300);

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
$limit = max(20, min(2000, $limit));

if (empty($service)) {
    sendSSEError('Service type is required');
    exit();
}

if (empty($location)) {
    sendSSEError('Location is required');
    exit();
}

// Start streaming search
streamGMBSearch($service, $location, $limit);

/**
 * Send SSE message
 */
function sendSSE($event, $data) {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    flush();
}

/**
 * Send SSE error
 */
function sendSSEError($message) {
    sendSSE('error', ['error' => $message]);
}

/**
 * Stream GMB search results progressively
 */
function streamGMBSearch($service, $location, $limit) {
    $apiKey = defined('SERPAPI_KEY') ? SERPAPI_KEY : '';
    
    if (empty($apiKey)) {
        sendSSEError('SERPAPI_KEY is not configured');
        return;
    }
    
    $query = "$service in $location";
    $resultsPerPage = 20;
    $maxPages = ceil($limit / $resultsPerPage);
    $maxPages = min($maxPages, 100);
    
    $totalResults = 0;
    $allResults = [];
    
    // Send initial status
    sendSSE('start', [
        'query' => $query,
        'limit' => $limit,
        'estimatedPages' => $maxPages
    ]);
    
    for ($page = 0; $page < $maxPages; $page++) {
        if ($totalResults >= $limit) {
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
        
        // Use shorter timeout for individual requests
        $response = curlRequest($url, [], 15);
        
        if ($response['httpCode'] !== 200) {
            if ($page === 0) {
                sendSSEError('Failed to fetch results from SerpAPI');
                return;
            }
            // Continue with what we have
            break;
        }
        
        $data = json_decode($response['response'], true);
        
        if (!isset($data['local_results']) || empty($data['local_results'])) {
            break;
        }
        
        $pageResults = [];
        foreach ($data['local_results'] as $item) {
            if ($totalResults >= $limit) {
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
                'websiteAnalysis' => quickWebsiteCheck($websiteUrl)
            ];
            
            $pageResults[] = $business;
            $allResults[] = $business;
            $totalResults++;
        }
        
        // Send this batch of results
        $progress = min(100, round(($totalResults / $limit) * 100));
        sendSSE('results', [
            'leads' => $pageResults,
            'total' => $totalResults,
            'progress' => $progress,
            'page' => $page + 1
        ]);
        
        // Check for more pages
        if (!isset($data['serpapi_pagination']['next'])) {
            break;
        }
        
        // Small delay between pages
        usleep(100000); // 100ms
    }
    
    // Send completion
    sendSSE('complete', [
        'total' => $totalResults,
        'query' => [
            'service' => $service,
            'location' => $location,
            'limit' => $limit
        ]
    ]);
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
