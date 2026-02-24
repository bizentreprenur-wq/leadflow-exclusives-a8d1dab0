<?php
/**
 * Platform Search API Endpoint - STREAMING VERSION
 * SSE streaming for Agency Lead Finder (Option B)
 * Now uses the unified custom fetcher pipeline (no-key discovery)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/includes/custom_fetcher.php';

// SSE headers
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');
setCorsHeaders();

// Disable output buffering for streaming
if (ob_get_level())
    ob_end_clean();
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', false);

set_time_limit(600); // 10 minutes max
ini_set('memory_limit', '512M');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendSSE('error', ['error' => 'Method not allowed']);
    exit();
}

$user = getCurrentUser();
if ($user) {
    enforceRateLimit($user, 'search');
}

$input = getJsonInput();
if (!$input) {
    sendSSE('error', ['error' => 'Invalid JSON input']);
    exit();
}

$service = sanitizeInput($input['service'] ?? '');
$location = sanitizeInput($input['location'] ?? '');
$platforms = isset($input['platforms']) && is_array($input['platforms']) ? $input['platforms'] : [];
$limit = isset($input['limit']) ? min(2000, max(10, intval($input['limit']))) : 100;

if (empty($service)) {
    sendSSE('error', ['error' => 'Service type is required']);
    exit();
}
if (empty($location)) {
    sendSSE('error', ['error' => 'Location is required']);
    exit();
}
if (empty($platforms)) {
    sendSSE('error', ['error' => 'At least one platform must be selected']);
    exit();
}

$platforms = array_map(function ($p) {
    return sanitizeInput($p, 50);
}, array_slice($platforms, 0, 20));

streamPlatformSearch($service, $location, $platforms, $limit);

/**
 * Stream platform search results using the unified custom fetcher pipeline.
 * Platform query modifiers are passed via filters and integrated into query building.
 */
function streamPlatformSearch($service, $location, $platforms, $limit)
{
    // Build platform query modifiers
    $platformQueries = buildPlatformQueries($platforms);

    // Build a composite service query that includes platform modifiers.
    // The custom fetcher's query expansion will handle location and synonym variants.
    // We append platform modifiers directly to the service for query building.
    $platformModifier = '';
    if (!empty($platformQueries)) {
        // Combine platform modifiers with OR to find businesses on any selected platform
        $platformModifier = '(' . implode(' OR ', array_slice($platformQueries, 0, 5)) . ')';
    }

    // Build the effective service query with platform context
    $effectiveService = $service;
    if ($platformModifier !== '') {
        $effectiveService = $service . ' ' . $platformModifier;
    }

    // Set up filters with platform metadata
    $filters = [
        'platformMode' => true,
        'platforms' => $platforms,
        'platformQueries' => $platformQueries,
    ];
    $filtersActive = true;

    $targetCount = getSearchFillTargetCount($limit);

    // Delegate to the custom fetcher streaming pipeline
    streamCustomOneShotSearch($effectiveService, $location, $limit, $filters, $filtersActive, $targetCount);
}

/**
 * Build search query modifiers for platforms
 */
function buildPlatformQueries($platforms)
{
    $modifiers = [];
    $platformIndicators = [
        'wordpress' => 'site:*.wordpress.com OR "powered by wordpress" OR "wp-content"',
        'wix' => 'site:*.wix.com OR site:*.wixsite.com OR "built with wix"',
        'weebly' => 'site:*.weebly.com OR "powered by weebly"',
        'godaddy' => '"godaddy website" OR site:*.godaddysites.com',
        'squarespace' => 'site:*.squarespace.com OR "powered by squarespace"',
        'joomla' => '"powered by joomla" OR "joomla!"',
        'drupal' => '"powered by drupal"',
        'webcom' => 'site:*.web.com',
        'jimdo' => 'site:*.jimdofree.com OR site:*.jimdo.com',
        'opencart' => '"powered by opencart"',
        'prestashop' => '"powered by prestashop"',
        'magento' => '"powered by magento"',
        'zencart' => '"powered by zen cart"',
        'oscommerce' => '"powered by oscommerce"',
        'customhtml' => 'inurl:".html" OR inurl:".htm"',
        'customphp' => 'inurl:".php"',
        'gmb' => 'site:google.com/maps OR site:maps.google.com OR "google.com/maps/place"',
        // Free business directories - Major platforms
        'yelp' => 'site:yelp.com',
        'bbb' => 'site:bbb.org',
        'yellowpages' => 'site:yellowpages.com',
        'manta' => 'site:manta.com',
        'angi' => 'site:angi.com OR site:angieslist.com',
        'thumbtack' => 'site:thumbtack.com',
        'homeadvisor' => 'site:homeadvisor.com',
        // Map directories
        'mapquest' => 'site:mapquest.com',
        'foursquare' => 'site:foursquare.com',
        // Classic directories
        'superpages' => 'site:superpages.com',
        'citysearch' => 'site:citysearch.com',
        'whitepages' => 'site:whitepages.com',
        'dexknows' => 'site:dexknows.com',
        'local' => 'site:local.com',
        // Business directories
        'chamberofcommerce' => 'site:chamberofcommerce.com',
        'merchantcircle' => 'site:merchantcircle.com',
        'brownbook' => 'site:brownbook.net',
        'hotfrog' => 'site:hotfrog.com',
        'spoke' => 'site:spoke.com',
        'buzzfile' => 'site:buzzfile.com',
        'dandb' => 'site:dandb.com OR site:dnb.com',
        // Service directories
        'bark' => 'site:bark.com',
        'expertise' => 'site:expertise.com',
        'thervo' => 'site:thervo.com',
        'porch' => 'site:porch.com',
        'networx' => 'site:networx.com',
        'houzz' => 'site:houzz.com',
        'buildzoom' => 'site:buildzoom.com',
        // USA aggregators
        'searchusa' => 'site:searchusa.com',
        'showmelocal' => 'site:showmelocal.com',
        'cylex' => 'site:cylex-usa.com',
        'americantowns' => 'site:americantowns.com',
        // Health directories
        'healthgrades' => 'site:healthgrades.com',
        'zocdoc' => 'site:zocdoc.com',
        'vitals' => 'site:vitals.com',
        // Legal directories
        'avvo' => 'site:avvo.com',
        'justia' => 'site:justia.com',
        'findlaw' => 'site:findlaw.com',
        // Food directories
        'tripadvisor' => 'site:tripadvisor.com',
        'opentable' => 'site:opentable.com',
        // Social platforms
        'linkedin' => 'site:linkedin.com/company OR site:linkedin.com/in',
    ];
    foreach ($platforms as $platform) {
        $key = strtolower($platform);
        if (isset($platformIndicators[$key])) {
            $modifiers[] = $platformIndicators[$key];
        }
    }
    return $modifiers;
}
