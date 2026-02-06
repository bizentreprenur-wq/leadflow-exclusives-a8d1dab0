<?php
/**
 * Scrape Website for Contact Information
 * 
 * Scrapes a business website to extract email addresses and phone numbers.
 * Checks the homepage, footer, and common contact pages (e.g., /contact, /about).
 * 
 * Usage: POST { "url": "https://example.com" }
 * Or: POST { "urls": ["https://example1.com", "https://example2.com"] } for batch
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Allow both GET and POST
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $url = isset($_GET['url']) ? trim($_GET['url']) : '';
    $urls = !empty($url) ? [$url] : [];
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $url = isset($input['url']) ? trim($input['url']) : '';
    $urls = isset($input['urls']) && is_array($input['urls']) ? $input['urls'] : [];
    
    // If single URL provided, add to array
    if (!empty($url) && empty($urls)) {
        $urls = [$url];
    }
} else {
    sendError('Method not allowed', 405);
}

if (empty($urls)) {
    sendError('URL or URLs array is required');
}

// Limit batch size
$maxBatch = 10;
$urls = array_slice($urls, 0, $maxBatch);

$results = [];

foreach ($urls as $singleUrl) {
    $singleUrl = trim($singleUrl);
    
    if (empty($singleUrl)) {
        continue;
    }
    
    // Validate URL format
    $cleanUrl = $singleUrl;
    if (!preg_match('/^https?:\/\//', $cleanUrl)) {
        $cleanUrl = 'https://' . $cleanUrl;
    }
    
    if (!filter_var($cleanUrl, FILTER_VALIDATE_URL)) {
        $results[$singleUrl] = [
            'success' => false,
            'error' => 'Invalid URL format',
            'emails' => [],
            'phones' => [],
            'hasWebsite' => false
        ];
        continue;
    }
    
    try {
        // Check cache first
        $cacheKey = "scrape_contacts_" . md5($cleanUrl);
        $cached = getCache($cacheKey);
        
        $cachedEmails = is_array($cached) ? ($cached['emails'] ?? []) : [];
        $cachedPhones = is_array($cached) ? ($cached['phones'] ?? []) : [];
        $hasCachedContacts = !empty($cachedEmails) || !empty($cachedPhones);

        if ($cached !== null && $hasCachedContacts) {
            $results[$singleUrl] = array_merge(['success' => true, 'cached' => true], $cached);
            continue;
        }
        
        // Scrape the website
        $contactInfo = scrapeWebsiteForContacts($cleanUrl, 8);
        
        // Cache positive hits longer; retry empty results sooner.
        $cacheTtl = (!empty($contactInfo['emails']) || !empty($contactInfo['phones'])) ? 86400 : 900;
        setCache($cacheKey, $contactInfo, $cacheTtl);
        
        $results[$singleUrl] = array_merge([
            'success' => true,
            'cached' => false,
            'url' => $cleanUrl
        ], $contactInfo);
        
    } catch (Exception $e) {
        $results[$singleUrl] = [
            'success' => false,
            'error' => DEBUG_MODE ? $e->getMessage() : 'Failed to scrape website',
            'emails' => [],
            'phones' => [],
            'hasWebsite' => false
        ];
    }
}

// For single URL requests, return just that result
if (count($urls) === 1) {
    $singleResult = reset($results);
    sendJson($singleResult);
} else {
    // For batch requests, return all results
    sendJson([
        'success' => true,
        'results' => $results,
        'count' => count($results)
    ]);
}
