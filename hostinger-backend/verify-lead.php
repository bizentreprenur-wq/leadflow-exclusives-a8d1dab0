<?php
/**
 * Lead Verification API Endpoint
 * Verifies and enriches lead data
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

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

$url = isset($input['url']) ? trim($input['url']) : '';
$leadId = sanitizeInput($input['leadId'] ?? '');

if (empty($url)) {
    sendError('URL is required');
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    // Try adding https
    $url = 'https://' . ltrim($url, '/');
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        sendError('Invalid URL format');
    }
}

try {
    $cacheKey = "verify_lead_" . md5($url);
    
    // Check cache (shorter TTL for verification)
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        sendJson([
            'success' => true,
            'data' => $cached,
            'cached' => true
        ]);
    }
    
    $result = verifyLead($url, $leadId);
    
    // Cache results (shorter TTL for verification data)
    setCache($cacheKey, $result, 60); // 1 minute cache
    
    sendJson([
        'success' => true,
        'data' => $result
    ]);
} catch (Exception $e) {
    if (DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred while verifying the lead', 500);
    }
}

/**
 * Verify and enrich lead data
 */
function verifyLead($url, $leadId) {
    $result = [
        'leadId' => $leadId,
        'url' => $url,
        'isAccessible' => false,
        'contactInfo' => [
            'phones' => [],
            'emails' => [],
            'address' => null
        ],
        'businessInfo' => [
            'name' => null,
            'description' => null,
            'socialLinks' => []
        ],
        'websiteAnalysis' => null,
        'verifiedAt' => date('c')
    ];
    
    // Fetch the website
    $response = curlRequest($url, [
        CURLOPT_TIMEOUT => WEBSITE_TIMEOUT,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    
    if ($response['httpCode'] !== 200 || empty($response['response'])) {
        $result['isAccessible'] = false;
        return $result;
    }
    
    $result['isAccessible'] = true;
    $html = $response['response'];
    
    // Website analysis
    $result['websiteAnalysis'] = [
        'platform' => detectPlatform($html),
        'issues' => detectIssues($html),
        'pageSize' => strlen($html),
        'mobileReady' => strpos(strtolower($html), 'viewport') !== false
    ];
    
    // Extract contact information
    $result['contactInfo']['phones'] = extractPhoneNumbers($html);
    $result['contactInfo']['emails'] = extractEmails($html);
    
    // Extract business name from title
    if (preg_match('/<title>([^<]+)<\/title>/i', $html, $matches)) {
        $result['businessInfo']['name'] = trim(strip_tags($matches[1]));
    }
    
    // Extract meta description
    if (preg_match('/meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']/i', $html, $matches)) {
        $result['businessInfo']['description'] = trim($matches[1]);
    }
    
    // Extract address (look for common patterns)
    $result['contactInfo']['address'] = extractAddress($html);
    
    // Extract social links
    $result['businessInfo']['socialLinks'] = extractSocialLinks($html);
    
    // Check for contact page
    $result['hasContactPage'] = (
        strpos(strtolower($html), 'contact') !== false ||
        strpos(strtolower($html), 'contact-us') !== false
    );
    
    return $result;
}

/**
 * Extract address from HTML
 */
function extractAddress($html) {
    // Look for address in schema.org markup
    if (preg_match('/"streetAddress"\s*:\s*"([^"]+)"/i', $html, $matches)) {
        return trim($matches[1]);
    }
    
    // Look for address patterns
    $patterns = [
        '/\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,\s]+[A-Z][a-z]+[,\s]+[A-Z]{2}\s+\d{5}/i',
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $html, $matches)) {
            return trim($matches[0]);
        }
    }
    
    return null;
}

/**
 * Extract social media links
 */
function extractSocialLinks($html) {
    $links = [];
    
    $socialPatterns = [
        'facebook' => '/href=["\']([^"\']*facebook\.com[^"\']*)["\']/',
        'instagram' => '/href=["\']([^"\']*instagram\.com[^"\']*)["\']/',
        'twitter' => '/href=["\']([^"\']*(?:twitter|x)\.com[^"\']*)["\']/',
        'linkedin' => '/href=["\']([^"\']*linkedin\.com[^"\']*)["\']/',
        'youtube' => '/href=["\']([^"\']*youtube\.com[^"\']*)["\']/',
        'yelp' => '/href=["\']([^"\']*yelp\.com[^"\']*)["\']/',
    ];
    
    foreach ($socialPatterns as $platform => $pattern) {
        if (preg_match($pattern, $html, $matches)) {
            $links[$platform] = $matches[1];
        }
    }
    
    return $links;
}
