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
 * Build a list of expanded location variants to increase result volume.
 * Keeps the original location out of the list and preserves order.
 */
function buildLocationExpansions($location) {
    $clean = preg_replace('/\s+/', ' ', trim((string)$location));
    if ($clean === '') {
        return [];
    }

    $expansions = [];
    $variants = ['area', 'metro', 'metro area', 'suburbs', 'downtown', 'nearby'];
    foreach ($variants as $variant) {
        $expansions[] = "{$clean} {$variant}";
    }

    $city = '';
    $state = '';
    if (strpos($clean, ',') !== false) {
        $parts = array_map('trim', explode(',', $clean, 2));
        $city = $parts[0] ?? '';
        $state = $parts[1] ?? '';
    }

    if ($city && $state) {
        $cityState = "{$city}, {$state}";
        $expansions[] = $cityState;
        $expansions[] = "{$cityState} metro";
        $expansions[] = "{$cityState} suburbs";
        $expansions[] = "{$cityState} downtown";
        foreach (['north', 'south', 'east', 'west'] as $direction) {
            $expansions[] = "{$direction} {$city}, {$state}";
        }
    }

    $includeState = defined('LOCATION_EXPANSION_INCLUDE_STATE') ? LOCATION_EXPANSION_INCLUDE_STATE : false;
    if ($includeState && $state) {
        $expansions[] = $state;
    }

    $includeCountry = defined('LOCATION_EXPANSION_INCLUDE_COUNTRY') ? LOCATION_EXPANSION_INCLUDE_COUNTRY : false;
    if ($includeCountry) {
        $expansions[] = 'United States';
    }

    $unique = [];
    foreach ($expansions as $loc) {
        $loc = preg_replace('/\s+/', ' ', trim($loc));
        if ($loc === '' || strcasecmp($loc, $clean) === 0) {
            continue;
        }
        if (!in_array($loc, $unique, true)) {
            $unique[] = $loc;
        }
    }

    return $unique;
}

/**
 * Build a stable dedupe key for a business result.
 */
function buildBusinessDedupeKey($business, $context = '') {
    $name = strtolower(trim((string)($business['name'] ?? '')));
    $name = preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9\s]/', '', $name));
    $address = strtolower(trim((string)($business['address'] ?? '')));
    if ($address !== '') {
        return "{$name}|{$address}";
    }
    $phone = preg_replace('/\D+/', '', (string)($business['phone'] ?? ''));
    if ($phone !== '') {
        return "{$name}|phone:{$phone}";
    }
    $host = '';
    if (!empty($business['url'])) {
        $host = strtolower(trim(parse_url($business['url'], PHP_URL_HOST) ?? ''));
    }
    if ($host !== '') {
        return "{$name}|host:{$host}";
    }
    $snippet = strtolower(trim((string)($business['snippet'] ?? '')));
    if ($snippet !== '') {
        $snippet = preg_replace('/\s+/', ' ', $snippet);
    }
    $ctx = strtolower(trim((string)$context));
    if ($ctx !== '' && $snippet !== '') {
        return "{$name}|{$ctx}|snip:" . substr(sha1($snippet), 0, 12);
    }
    if ($ctx !== '') {
        return "{$name}|{$ctx}";
    }
    if ($snippet !== '') {
        return "{$name}|snip:" . substr(sha1($snippet), 0, 12);
    }
    return $name;
}

/**
 * Minimum acceptable fill ratio for search results.
 */
function getSearchFillTargetRatio() {
    $ratio = defined('SEARCH_FILL_TARGET_RATIO') ? (float)SEARCH_FILL_TARGET_RATIO : 0.95;
    if ($ratio < 0.5) {
        $ratio = 0.5;
    }
    if ($ratio > 1.0) {
        $ratio = 1.0;
    }
    return $ratio;
}

/**
 * Minimum acceptable result count for a requested limit.
 */
function getSearchFillTargetCount($limit) {
    $limit = max(1, (int)$limit);
    return (int)ceil($limit * getSearchFillTargetRatio());
}

/**
 * Normalize search filters from request input.
 */
function normalizeSearchFilters($input) {
    $filters = is_array($input) ? $input : [];
    $platforms = [];
    if (!empty($filters['platforms']) && is_array($filters['platforms'])) {
        foreach ($filters['platforms'] as $platform) {
            if (!is_string($platform)) continue;
            $platform = strtolower(trim($platform));
            if ($platform !== '') {
                $platforms[] = $platform;
            }
        }
    }

    return [
        'phoneOnly' => !empty($filters['phoneOnly']),
        'noWebsite' => !empty($filters['noWebsite']),
        'notMobile' => !empty($filters['notMobile']),
        'outdated' => !empty($filters['outdated']),
        'platforms' => array_values(array_unique($platforms)),
        'platformMode' => !empty($filters['platformMode']),
    ];
}

/**
 * Determine if any search filters are active.
 */
function hasAnySearchFilter($filters) {
    if (!is_array($filters)) return false;
    return !empty($filters['phoneOnly']) ||
        !empty($filters['noWebsite']) ||
        !empty($filters['notMobile']) ||
        !empty($filters['outdated']) ||
        (!empty($filters['platforms']) && count($filters['platforms']) > 0);
}

/**
 * Apply normalized search filters to a business result.
 */
function matchesSearchFilters($business, $filters) {
    if (!is_array($filters) || !hasAnySearchFilter($filters)) {
        return true;
    }

    $analysis = is_array($business['websiteAnalysis'] ?? null) ? $business['websiteAnalysis'] : [];
    $hasWebsite = array_key_exists('hasWebsite', $analysis) ? (bool)$analysis['hasWebsite'] : true;
    $needsUpgrade = array_key_exists('needsUpgrade', $analysis) ? (bool)$analysis['needsUpgrade'] : false;
    $issues = isset($analysis['issues']) && is_array($analysis['issues']) ? $analysis['issues'] : [];
    $platform = strtolower(trim((string)($analysis['platform'] ?? '')));
    $mobileScore = $analysis['mobileScore'] ?? null;

    if (!empty($filters['phoneOnly'])) {
        $phone = trim((string)($business['phone'] ?? ''));
        if ($phone === '') return false;
    }

    if (!empty($filters['noWebsite'])) {
        if ($hasWebsite) return false;
    }

    if (!empty($filters['notMobile'])) {
        if ($mobileScore !== null && $mobileScore !== '' && $mobileScore >= 50) {
            return false;
        }
    }

    if (!empty($filters['outdated'])) {
        if (!$needsUpgrade && empty($issues)) return false;
    }

    $platforms = $filters['platforms'] ?? [];
    if (!empty($platforms)) {
        if (!empty($filters['platformMode']) && in_array('gmb', $platforms, true)) {
            return true;
        }
        $matchesPlatform = $platform !== '' && in_array($platform, $platforms, true);
        if (!empty($filters['platformMode'])) {
            $url = trim((string)($business['url'] ?? ''));
            $include = !$hasWebsite || $needsUpgrade || !empty($issues) || $matchesPlatform || $url === '';
            if (!$include) return false;
        } else {
            if (!$matchesPlatform) return false;
        }
    }

    return true;
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
    
    // Filter out invalid/spam emails
    $filtered = [];
    $excludePatterns = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.', 'noreply', 'no-reply', 
                        'wixpress', 'sentry.io', 'cloudflare', 'google.com', 'facebook.com', 'twitter.com', 
                        'instagram.com', 'linkedin.com', 'youtube.com', 'placeholder', 'yoursite', 'yourdomain',
                        'webpack', 'localhost', 'jquery', 'bootstrap', '.png', '.jpg', '.gif', '.svg', '.css', '.js'];
    
    foreach ($emails as $email) {
        $emailLower = strtolower($email);
        $isValid = true;
        foreach ($excludePatterns as $pattern) {
            if (strpos($emailLower, $pattern) !== false) {
                $isValid = false;
                break;
            }
        }
        if ($isValid && strlen($email) < 100) {
            $filtered[] = $emailLower;
        }
    }
    
    return array_values(array_unique($filtered));
}

/**
 * Scrape website for contact information (email, phone)
 * Checks homepage, footer, and common contact page URLs
 * 
 * @param string $url Website URL
 * @param int $timeout Request timeout in seconds
 * @return array Contact info with emails and phones found
 */
function scrapeWebsiteForContacts($url, $timeout = 8) {
    if (empty($url)) {
        return ['emails' => [], 'phones' => [], 'hasWebsite' => false, 'pagesChecked' => []];
    }
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    // Parse and get base URL
    $parsed = parse_url($url);
    if (!$parsed || empty($parsed['host'])) {
        return ['emails' => [], 'phones' => [], 'hasWebsite' => false, 'pagesChecked' => []];
    }
    
    $scheme = $parsed['scheme'] ?? 'https';
    $host = $parsed['host'];
    $baseUrl = "{$scheme}://{$host}";
    
    $allEmails = [];
    $allPhones = [];
    $pagesChecked = [];
    $hasWebsite = false;
    
    // Common contact page paths to check
    $contactPaths = [
        '',                    // Homepage
        '/contact',
        '/contact-us',
        '/contact-us/',
        '/contactus',
        '/about',
        '/about-us',
        '/about/',
        '/get-in-touch',
        '/reach-us',
    ];
    
    // Check up to 3 pages to avoid too many requests
    $pagesLimit = 3;
    $pagesScraped = 0;
    
    foreach ($contactPaths as $path) {
        if ($pagesScraped >= $pagesLimit) {
            break;
        }
        
        // Already have email? Stop early
        if (!empty($allEmails)) {
            break;
        }
        
        $pageUrl = $baseUrl . $path;
        
        // Skip if already checked
        if (in_array($pageUrl, $pagesChecked)) {
            continue;
        }
        
        $result = curlRequest($pageUrl, [
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ], $timeout);
        
        $pagesChecked[] = $pageUrl;
        
        if ($result['httpCode'] !== 200 || empty($result['response'])) {
            continue;
        }
        
        $hasWebsite = true;
        $pagesScraped++;
        $html = $result['response'];
        
        // Extract emails from page
        $pageEmails = extractEmails($html);
        $allEmails = array_merge($allEmails, $pageEmails);
        
        // Extract phones from page
        $pagePhones = extractPhoneNumbers($html);
        $allPhones = array_merge($allPhones, $pagePhones);
        
        // Also check for mailto: links specifically
        if (preg_match_all('/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/', $html, $mailtoMatches)) {
            $allEmails = array_merge($allEmails, array_map('strtolower', $mailtoMatches[1]));
        }
        
        // Check for tel: links
        if (preg_match_all('/tel:([+\d\-\(\)\s\.]+)/', $html, $telMatches)) {
            $allPhones = array_merge($allPhones, $telMatches[1]);
        }
        
        // Small delay between pages
        usleep(100000); // 100ms
    }
    
    // Dedupe and clean
    $allEmails = array_values(array_unique($allEmails));
    $allPhones = array_values(array_unique(array_map(function($p) {
        return preg_replace('/[^\d+]/', '', $p);
    }, $allPhones)));
    
    // Filter phones - only valid US format (10+ digits)
    $allPhones = array_filter($allPhones, function($p) {
        $digits = preg_replace('/\D/', '', $p);
        return strlen($digits) >= 10;
    });
    
    return [
        'emails' => array_slice($allEmails, 0, 5), // Limit to 5 emails
        'phones' => array_slice(array_values($allPhones), 0, 3), // Limit to 3 phones
        'hasWebsite' => $hasWebsite,
        'pagesChecked' => $pagesChecked
    ];
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
