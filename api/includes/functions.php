<?php
/**
 * Shared helper functions for BamLead API
 */

require_once __DIR__ . '/../config.php';

/**
 * Check if origin is a Lovable preview/project domain
 */
function isLovableOrigin($origin) {
    // Match all Lovable domains more permissively
    // Patterns: *.lovableproject.com, *.lovable.app, any subdomain combination
    return preg_match('/^https:\/\/[a-z0-9\-\.]+\.lovableproject\.com$/i', $origin) ||
           preg_match('/^https:\/\/[a-z0-9\-\.]+\.lovable\.app$/i', $origin) ||
           strpos($origin, 'lovableproject.com') !== false ||
           strpos($origin, 'lovable.app') !== false;
}

/**
 * Set CORS headers for API responses
 */
function setCorsHeaders() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    $isAllowed = false;
    
    // Check explicit whitelist first
    if (defined('ALLOWED_ORIGINS') && in_array($origin, ALLOWED_ORIGINS)) {
        $isAllowed = true;
    }
    // Allow all Lovable preview/project domains dynamically
    elseif (isLovableOrigin($origin)) {
        $isAllowed = true;
    }
    // In dev mode, allow localhost origins
    elseif (defined('DEBUG_MODE') && DEBUG_MODE) {
        if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
            $isAllowed = true;
        }
    }
    
    if ($isAllowed) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
    // If origin not allowed, don't set CORS header - browser will block
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    
    // Security headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // CSP for API responses (JSON)
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Send JSON response
 */
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendJson(['success' => false, 'error' => $message], $statusCode);
}

/**
 * Get JSON input from request body
 */
function getJsonInput() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }
    return $input;
}

/**
 * Sanitize string input
 */
function sanitizeInput($input, $maxLength = 100) {
    if (!is_string($input)) {
        return '';
    }
    $input = trim($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    if (strlen($input) > $maxLength) {
        $input = substr($input, 0, $maxLength);
    }
    return $input;
}

/**
 * Make a cURL request
 * @param string $url The URL to request
 * @param array $options Additional cURL options
 * @param int $timeout Timeout in seconds (default 10)
 */
function curlRequest($url, $options = [], $timeout = 10) {
    $ch = curl_init();
    
    $defaultOptions = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'BamLead/1.0 (Website Analyzer)',
    ];
    
    curl_setopt_array($ch, $defaultOptions + $options);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'response' => $response,
        'httpCode' => $httpCode,
        'error' => $error
    ];
}

/**
 * Get cached result if available
 */
function getCache($key) {
    if (!defined('ENABLE_CACHE') || !ENABLE_CACHE) {
        return null;
    }
    
    // Validate cache key to prevent directory traversal
    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $key)) {
        return null;
    }
    
    $cacheFile = CACHE_DIR . '/' . md5($key) . '.cache';
    
    if (!file_exists($cacheFile)) {
        return null;
    }
    
    // Use JSON instead of unserialize to prevent object injection
    $contents = file_get_contents($cacheFile);
    $data = json_decode($contents, true);
    
    if (!$data || !isset($data['expires']) || $data['expires'] < time()) {
        @unlink($cacheFile);
        return null;
    }
    
    return $data['value'];
}

/**
 * Set cache value
 */
function setCache($key, $value, $ttl = null) {
    if (!defined('ENABLE_CACHE') || !ENABLE_CACHE) {
        return false;
    }
    
    // Validate cache key
    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $key)) {
        return false;
    }
    
    if (!is_dir(CACHE_DIR)) {
        @mkdir(CACHE_DIR, 0755, true);
    }
    
    $ttl = $ttl ?? CACHE_DURATION;
    $cacheFile = CACHE_DIR . '/' . md5($key) . '.cache';
    
    $data = [
        'expires' => time() + $ttl,
        'value' => $value
    ];
    
    // Use JSON instead of serialize for security
    return file_put_contents($cacheFile, json_encode($data)) !== false;
}

/**
 * Detect website platform from HTML
 */
function detectPlatform($html) {
    $html = strtolower($html);
    
    $platforms = [
        'WordPress' => ['wp-content', 'wordpress', 'wp-includes'],
        'Wix' => ['wix.com', 'wixsite.com', 'static.wixstatic.com'],
        'Squarespace' => ['squarespace', 'sqsp.net', 'static1.squarespace.com'],
        'Shopify' => ['shopify', 'cdn.shopify.com', 'myshopify.com'],
        'Webflow' => ['webflow', 'assets.website-files.com'],
        'GoDaddy' => ['godaddy', 'secureserver.net', 'godaddysites.com'],
        'Weebly' => ['weebly', 'weeblycloud.com'],
        'Joomla' => ['joomla', '/components/com_', '/modules/mod_'],
        'Drupal' => ['drupal', '/sites/default/files', 'drupal.settings'],
        'Magento' => ['magento', 'mage/', 'varien'],
        'PrestaShop' => ['prestashop', '/themes/default/', 'presta'],
        'OpenCart' => ['opencart', '/catalog/view/', 'route='],
        'Zen Cart' => ['zen cart', 'zen-cart', 'zencart'],
        'osCommerce' => ['oscommerce', 'osc_session'],
        'Jimdo' => ['jimdo', 'jimdofree', 'jimcdn.com'],
        'Web.com' => ['web.com', 'website-builder'],
        'BigCommerce' => ['bigcommerce', 'bigcommercecdn'],
        'Duda' => ['duda', 'dudaone', 'duda.co'],
        'HubSpot' => ['hubspot', 'hs-scripts', 'hscta'],
    ];
    
    foreach ($platforms as $name => $indicators) {
        foreach ($indicators as $indicator) {
            if (strpos($html, $indicator) !== false) {
                return $name;
            }
        }
    }
    
    // Check for basic indicators
    if (strpos($html, '<!doctype html>') !== false || strpos($html, '<!DOCTYPE html>') !== false) {
        // Check for any CMS indicators
        if (preg_match('/content="[^"]*generator[^"]*"/i', $html)) {
            return 'Custom CMS';
        }
    }
    
    // Check for very old sites
    if (strpos($html, '<table') !== false && strpos($html, 'width=') !== false) {
        return 'Custom HTML (Legacy)';
    }
    
    if (strpos($html, '.php') !== false) {
        return 'Custom PHP';
    }
    
    return 'Custom/Unknown';
}

/**
 * Detect website issues
 */
function detectIssues($html) {
    $issues = [];
    $htmlLower = strtolower($html);
    
    // Mobile responsiveness
    if (strpos($htmlLower, 'viewport') === false) {
        $issues[] = 'Not mobile responsive';
    }
    
    // Page size
    $pageSize = strlen($html);
    if ($pageSize > 500000) {
        $issues[] = 'Large page size (slow loading)';
    }
    
    // HTML5 doctype
    if (strpos($htmlLower, '<!doctype html>') === false) {
        $issues[] = 'Outdated HTML structure';
    }
    
    // Meta description
    if (strpos($htmlLower, 'meta name="description"') === false && 
        strpos($htmlLower, "meta name='description'") === false) {
        $issues[] = 'Missing meta description';
    }
    
    // Title tag
    if (strpos($htmlLower, '<title>') === false || strpos($htmlLower, '<title></title>') !== false) {
        $issues[] = 'Missing or empty title tag';
    }
    
    // Old jQuery
    if (preg_match('/jquery[.-]?1\.[0-9]/', $htmlLower) || 
        preg_match('/jquery[.-]?2\.[0-2]/', $htmlLower)) {
        $issues[] = 'Outdated jQuery version';
    }
    
    // Flash content
    if (strpos($htmlLower, 'swfobject') !== false || strpos($htmlLower, '.swf') !== false) {
        $issues[] = 'Uses Flash (deprecated)';
    }
    
    // Missing alt tags
    if (preg_match('/<img[^>]+(?!alt)[^>]*>/i', $html)) {
        $issues[] = 'Missing alt tags on images';
    }
    
    // Inline styles (indicator of old practices)
    $inlineStyleCount = substr_count($htmlLower, 'style="');
    if ($inlineStyleCount > 20) {
        $issues[] = 'Excessive inline styles';
    }
    
    // Tables for layout
    $tableCount = substr_count($htmlLower, '<table');
    if ($tableCount > 5 && strpos($htmlLower, 'width=') !== false) {
        $issues[] = 'Tables used for layout';
    }
    
    // HTTP resources on HTTPS
    if (preg_match('/src=["\']http:\/\//i', $html)) {
        $issues[] = 'Mixed content (HTTP on HTTPS)';
    }
    
    // Missing Open Graph tags
    if (strpos($htmlLower, 'og:') === false) {
        $issues[] = 'Missing social media meta tags';
    }
    
    // Missing favicon
    if (strpos($htmlLower, 'favicon') === false && strpos($htmlLower, 'icon') === false) {
        $issues[] = 'Missing favicon';
    }
    
    // ========== NEW DETECTIONS ==========
    
    // No Facebook Pixel
    $hasFacebookPixel = strpos($htmlLower, 'facebook.com/tr') !== false ||
                        strpos($htmlLower, 'fbq(') !== false ||
                        strpos($htmlLower, 'facebook-jssdk') !== false ||
                        strpos($htmlLower, 'connect.facebook.net') !== false;
    if (!$hasFacebookPixel) {
        $issues[] = 'No Facebook Pixel installed';
    }
    
    // No Google Tag / Analytics
    $hasGoogleTag = strpos($htmlLower, 'googletagmanager.com') !== false ||
                    strpos($htmlLower, 'gtag(') !== false ||
                    strpos($htmlLower, 'google-analytics.com') !== false ||
                    strpos($htmlLower, 'analytics.js') !== false ||
                    strpos($htmlLower, 'gtm.js') !== false ||
                    strpos($htmlLower, 'ga(') !== false;
    if (!$hasGoogleTag) {
        $issues[] = 'No Google Analytics or Tag Manager';
    }
    
    // No booking system or contact funnel
    $hasBookingSystem = strpos($htmlLower, 'calendly') !== false ||
                        strpos($htmlLower, 'acuityscheduling') !== false ||
                        strpos($htmlLower, 'booksy') !== false ||
                        strpos($htmlLower, 'simplybook') !== false ||
                        strpos($htmlLower, 'schedulicity') !== false ||
                        strpos($htmlLower, 'square.com/appointments') !== false ||
                        strpos($htmlLower, 'setmore') !== false ||
                        strpos($htmlLower, 'appointy') !== false ||
                        strpos($htmlLower, 'booking.com') !== false ||
                        strpos($htmlLower, 'book-now') !== false ||
                        strpos($htmlLower, 'book now') !== false ||
                        strpos($htmlLower, 'schedule-appointment') !== false ||
                        strpos($htmlLower, 'schedule appointment') !== false ||
                        strpos($htmlLower, 'book-online') !== false ||
                        strpos($htmlLower, 'book online') !== false;
    
    $hasContactFunnel = strpos($htmlLower, 'contact-form') !== false ||
                        strpos($htmlLower, 'contact form') !== false ||
                        strpos($htmlLower, 'wpcf7') !== false ||
                        strpos($htmlLower, 'wpforms') !== false ||
                        strpos($htmlLower, 'gravity-forms') !== false ||
                        strpos($htmlLower, 'typeform') !== false ||
                        strpos($htmlLower, 'jotform') !== false ||
                        strpos($htmlLower, 'formspree') !== false ||
                        strpos($htmlLower, 'hubspot-form') !== false ||
                        strpos($htmlLower, 'input type="email"') !== false ||
                        (strpos($htmlLower, '<form') !== false && strpos($htmlLower, 'submit') !== false);
    
    if (!$hasBookingSystem && !$hasContactFunnel) {
        $issues[] = 'No booking system or contact funnel';
    } else if (!$hasBookingSystem) {
        $issues[] = 'No online booking system';
    }
    
    // Inactive/weak social profiles (check for social links)
    $hasFacebookLink = strpos($htmlLower, 'facebook.com/') !== false;
    $hasInstagramLink = strpos($htmlLower, 'instagram.com/') !== false;
    $hasTwitterLink = strpos($htmlLower, 'twitter.com/') !== false || strpos($htmlLower, 'x.com/') !== false;
    $hasLinkedInLink = strpos($htmlLower, 'linkedin.com/') !== false;
    $hasYouTubeLink = strpos($htmlLower, 'youtube.com/') !== false;
    
    $socialCount = ($hasFacebookLink ? 1 : 0) + ($hasInstagramLink ? 1 : 0) + 
                   ($hasTwitterLink ? 1 : 0) + ($hasLinkedInLink ? 1 : 0) + ($hasYouTubeLink ? 1 : 0);
    
    if ($socialCount === 0) {
        $issues[] = 'No social media presence linked';
    } else if ($socialCount === 1) {
        $issues[] = 'Weak social media presence (only 1 platform)';
    }
    
    // Severely outdated website indicators
    $severelyOutdated = false;
    $outdatedIndicators = 0;
    
    if (strpos($htmlLower, '<!doctype html>') === false) $outdatedIndicators++;
    if (preg_match('/jquery[.-]?1\.[0-5]/', $htmlLower)) $outdatedIndicators++;
    if (strpos($htmlLower, 'swfobject') !== false || strpos($htmlLower, '.swf') !== false) $outdatedIndicators++;
    if ($tableCount > 5 && strpos($htmlLower, 'width=') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'viewport') === false) $outdatedIndicators++;
    if (preg_match('/copyright\s*(©|&copy;)?\s*(19[89]\d|200[0-9]|201[0-5])/i', $htmlLower)) $outdatedIndicators++;
    if (strpos($htmlLower, 'font face=') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'marquee') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'bgsound') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'frameset') !== false || strpos($htmlLower, 'iframe') === false && strpos($htmlLower, '<frame') !== false) $outdatedIndicators++;
    
    if ($outdatedIndicators >= 4) {
        $issues[] = 'Severely outdated website (needs complete rebuild)';
    }
    
    // Check for no SSL/HTTPS indicators
    if (preg_match_all('/href=["\']http:\/\/(?!localhost)/i', $html, $httpMatches) && count($httpMatches[0]) > 3) {
        $issues[] = 'Multiple non-secure HTTP links';
    }
    
    // Check for spending money but leaking leads (has ads but no conversion tracking)
    $hasAds = strpos($htmlLower, 'googlesyndication') !== false ||
              strpos($htmlLower, 'doubleclick') !== false ||
              strpos($htmlLower, 'adsense') !== false ||
              strpos($htmlLower, 'adsbygoogle') !== false;
    
    $hasConversionTracking = $hasFacebookPixel || $hasGoogleTag ||
                             strpos($htmlLower, 'hotjar') !== false ||
                             strpos($htmlLower, 'clarity.ms') !== false ||
                             strpos($htmlLower, 'mixpanel') !== false ||
                             strpos($htmlLower, 'segment.com') !== false;
    
    if ($hasAds && !$hasConversionTracking) {
        $issues[] = 'Spending on ads but no conversion tracking (leaking leads)';
    }
    
    // No call-to-action buttons detected
    $hasCTA = preg_match('/(get\s*(started|quote|estimate)|call\s*now|contact\s*us|request\s*(quote|appointment)|free\s*(consultation|estimate)|schedule|book\s*(now|today))/i', $htmlLower);
    if (!$hasCTA) {
        $issues[] = 'No clear call-to-action buttons';
    }
    
    return $issues;
}

/**
 * Analyze a website and return analysis data
 */
function analyzeWebsite($url) {
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
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    $startTime = microtime(true);
    
    $result = curlRequest($url, [
        CURLOPT_TIMEOUT => WEBSITE_TIMEOUT,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    
    $loadTime = round((microtime(true) - $startTime) * 1000); // ms
    
    $analysis = [
        'hasWebsite' => $result['httpCode'] === 200,
        'platform' => null,
        'needsUpgrade' => false,
        'issues' => [],
        'mobileScore' => null,
        'loadTime' => $loadTime
    ];
    
    if ($result['httpCode'] !== 200 || empty($result['response'])) {
        $analysis['hasWebsite'] = false;
        $analysis['needsUpgrade'] = true;
        $analysis['issues'][] = 'Website not accessible';
        return $analysis;
    }
    
    $html = $result['response'];
    
    // Detect platform
    $analysis['platform'] = detectPlatform($html);
    
    // Detect issues
    $analysis['issues'] = detectIssues($html);
    
    // Calculate mobile score (simplified)
    $mobileScore = 100;
    if (strpos(strtolower($html), 'viewport') === false) {
        $mobileScore -= 40;
    }
    if (strlen($html) > 300000) {
        $mobileScore -= 20;
    }
    if ($loadTime > 3000) {
        $mobileScore -= 20;
    }
    foreach ($analysis['issues'] as $issue) {
        $mobileScore -= 5;
    }
    $analysis['mobileScore'] = max(0, min(100, $mobileScore));
    
    // Determine if needs upgrade
    $lowPriorityPlatforms = ['WordPress', 'Wix', 'Weebly', 'GoDaddy', 'Joomla', 'Drupal'];
    $analysis['needsUpgrade'] = 
        count($analysis['issues']) >= 2 ||
        in_array($analysis['platform'], $lowPriorityPlatforms) ||
        $analysis['mobileScore'] < 60 ||
        $loadTime > 4000;
    
    return $analysis;
}

/**
 * Extract phone numbers from text
 */
function extractPhoneNumbers($text) {
    $phones = [];
    
    // US phone patterns
    $patterns = [
        '/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/',
        '/\d{3}[-.\s]\d{3}[-.\s]\d{4}/',
        '/1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/',
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match_all($pattern, $text, $matches)) {
            $phones = array_merge($phones, $matches[0]);
        }
    }
    
    return array_unique($phones);
}

/**
 * Extract email addresses from text
 */
function extractEmails($text) {
    $emails = [];
    
    if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
        $emails = array_unique($matches[0]);
    }
    
    return $emails;
}

/**
 * Generate a unique ID
 */
function generateId($prefix = '') {
    return $prefix . uniqid() . '_' . bin2hex(random_bytes(4));
}

/**
 * Get the client's real IP address (handles proxies)
 */
function getClientIP() {
    // Check for forwarded IP (when behind proxy/load balancer)
    $forwardedFor = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if (!empty($forwardedFor)) {
        // Take the first IP (original client) if comma-separated
        $ips = explode(',', $forwardedFor);
        return trim($ips[0]);
    }
    
    // Check X-Real-IP header
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    
    // Fall back to remote address
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Check if request IP is allowed for cron endpoints
 * Returns true if CRON_ALLOWED_IPS is not defined or empty (backwards compatible)
 */
function isAllowedCronIP() {
    // If whitelist not configured, allow all (backwards compatible)
    if (!defined('CRON_ALLOWED_IPS') || !is_array(CRON_ALLOWED_IPS) || empty(CRON_ALLOWED_IPS)) {
        return true;
    }
    
    $clientIP = getClientIP();
    
    // Check if IP is in whitelist
    return in_array($clientIP, CRON_ALLOWED_IPS, true);
}
