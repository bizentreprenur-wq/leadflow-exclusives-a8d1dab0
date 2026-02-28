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
$filters = normalizeSearchFilters($input['filters'] ?? null);

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

// Always force Option B context to selected platforms
$filters['platformMode'] = true;
$filters['platforms'] = $platforms;

// Raw Serper-only mode (default) bypasses custom fetcher completely.
$rawSerperOnly = forceRawSerperOnlyMode();
$useCustomPipeline = !$rawSerperOnly && function_exists('customFetcherEnabled') && customFetcherEnabled();

if ($useCustomPipeline) {
    streamPlatformSearchCustom($service, $location, $platforms, $limit, $filters);
} else {
    streamPlatformSearchLegacy($service, $location, $platforms, $limit, $filters);
}

/**
 * Stream platform search using the custom fetcher pipeline (original).
 */
function streamPlatformSearchCustom($service, $location, $platforms, $limit, $filters = [])
{
    $platformQueries = buildPlatformQueries($platforms);
    $platformModifier = '';
    if (!empty($platformQueries)) {
        $platformModifier = '(' . implode(' OR ', array_slice($platformQueries, 0, 5)) . ')';
    }
    $effectiveService = $service;
    if ($platformModifier !== '') {
        $effectiveService = $service . ' ' . $platformModifier;
    }
    $filters = normalizeSearchFilters($filters);
    $filters['platformMode'] = true;
    $filters['platforms'] = $platforms;
    $filters['platformQueries'] = $platformQueries;
    $filtersActive = true;
    $targetCount = getSearchFillTargetCount($limit);
    streamCustomOneShotSearch($effectiveService, $location, $limit, $filters, $filtersActive, $targetCount);
}

/**
 * Legacy platform search — uses Serper organic directly without enrichment.
 * Returns raw results as-is from search snippets.
 */
function streamPlatformSearchLegacy($service, $location, $platforms, $limit, $filters = [])
{
    $hasSerper = defined('SERPER_API_KEY') && !empty(SERPER_API_KEY);
    if (!$hasSerper) {
        sendSSE('error', ['error' => 'No search API configured. Please add SERPER_API_KEY to config.php']);
        return;
    }

    $filters = normalizeSearchFilters($filters);
    $filters['platformMode'] = true;
    $filters['platforms'] = $platforms;
    // Platform selection is already encoded in search queries.
    // Avoid strict post-filtering by detected platform token in legacy/raw mode.
    $filtersForMatching = $filters;
    $filtersForMatching['platforms'] = [];

    $queryPlatforms = $platforms;
    if (!empty($filtersForMatching['noWebsite'])) {
        $queryPlatforms = array_values(array_unique(array_merge($queryPlatforms, [
            'gmb', 'yelp', 'yellowpages', 'manta', 'bbb', 'angi', 'thumbtack', 'homeadvisor',
            'mapquest', 'foursquare', 'superpages', 'citysearch', 'chamberofcommerce',
            'merchantcircle', 'local'
        ])));
    }
    $platformQueries = buildPlatformQueries($queryPlatforms);

    sendSSE('start', [
        'query' => "$service in $location",
        'limit' => $limit,
        'sources' => ['Serper Organic'],
        'platforms' => $platforms,
        'filtersActive' => hasAnySearchFilter($filters),
    ]);

    $diagnostics = [
        'rawCandidates' => 0,
        'invalidDomainCandidates' => 0,
        'dedupedCandidates' => 0,
        'preFilterCandidates' => 0,
        'filterMatchedCandidates' => 0,
        'filterRejectedCandidates' => 0,
        'filterRejections' => [
            'phoneOnly' => 0,
            'noWebsite' => 0,
            'notMobile' => 0,
            'outdated' => 0,
            'platforms' => 0,
            'combined' => 0,
        ],
        'queriesPlanned' => 0,
        'queriesExecuted' => 0,
        'finalResults' => 0,
    ];

    $allResults = [];
    $seenResults = [];
    $totalResults = 0;
    $queryErrorCount = 0;
    $lastQueryError = '';
    $emitBatchSize = 5;

    // Build search queries: service + each platform modifier + location
    $queries = [];
    foreach ($platformQueries as $modifier) {
        $queries[] = "$service $modifier $location";
    }
    // Also add a generic query
    $queries[] = "$service in $location";
    $diagnostics['queriesPlanned'] = count($queries);
    sendSSE('status', [
        'message' => 'Initializing platform search...',
        'progress' => 1,
        'source' => 'Serper Organic',
        'locationCount' => 1,
        'variantCount' => max(1, count($platformQueries)),
        'estimatedQueries' => count($queries),
        'phase' => 'searching',
    ]);

    foreach ($queries as $queryIdx => $query) {
        if ($totalResults >= $limit) break;
        $diagnostics['queriesExecuted']++;

        // Serper organic search
        $url = 'https://google.serper.dev/search';
        $payload = json_encode([
            'q' => $query,
            'num' => min(100, $limit - $totalResults),
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'X-API-KEY: ' . SERPER_API_KEY,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            $queryErrorCount++;
            $decodedError = is_string($response) ? json_decode($response, true) : null;
            $apiError = is_array($decodedError) ? ($decodedError['message'] ?? $decodedError['error'] ?? '') : '';
            $lastQueryError = trim("HTTP {$httpCode} {$apiError}");
            continue;
        }

        $data = json_decode($response, true);
        $organic = $data['organic'] ?? [];

        $leadBuffer = [];
        foreach ($organic as $item) {
            if ($totalResults >= $limit) break;
            $diagnostics['rawCandidates']++;

            $link = $item['link'] ?? '';
            $domain = parse_url($link, PHP_URL_HOST) ?: '';
            $dedupeKey = buildSearchResultDedupKey($link);
            if ($dedupeKey === '') {
                $diagnostics['invalidDomainCandidates']++;
                continue;
            }
            if (isset($seenResults[$dedupeKey])) {
                $diagnostics['dedupedCandidates']++;
                continue;
            }
            $seenResults[$dedupeKey] = true;

            $business = [
                'id' => 'plat_' . substr(md5($link . time()), 0, 12),
                'name' => $item['title'] ?? $domain,
                'url' => $link,
                'website' => inferBusinessWebsiteFromSearchResultUrl($link),
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => $domain,
                'phone' => extractPhoneFromSnippet($item['snippet'] ?? ''),
                'email' => extractEmailFromSnippet($item['snippet'] ?? ''),
                'source' => 'Serper Organic',
                'sources' => ['Serper Organic'],
                'websiteAnalysis' => quickWebsiteCheck($link, ($item['snippet'] ?? '') . ' ' . ($item['title'] ?? '')),
            ];
            $diagnostics['preFilterCandidates']++;

            if (!matchesSearchFilters($business, $filtersForMatching)) {
                $diagnostics['filterRejectedCandidates']++;
                $reasons = getSearchFilterFailureReasons($business, $filtersForMatching);
                foreach ($reasons as $reason) {
                    if (!isset($diagnostics['filterRejections'][$reason])) {
                        $reason = 'combined';
                    }
                    $diagnostics['filterRejections'][$reason]++;
                }
                continue;
            }
            $diagnostics['filterMatchedCandidates']++;

            $allResults[] = $business;
            $leadBuffer[] = $business;
            $totalResults++;

            if (count($leadBuffer) >= $emitBatchSize) {
                sendSSE('results', [
                    'leads' => $leadBuffer,
                    'total' => $totalResults,
                    'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
                    'source' => 'Serper Organic',
                ]);
                $leadBuffer = [];
            }
        }

        if (!empty($leadBuffer)) {
            sendSSE('results', [
                'leads' => $leadBuffer,
                'total' => $totalResults,
                'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
                'source' => 'Serper Organic',
            ]);
        }

        sendSSE('status', [
            'message' => "Query " . ($queryIdx + 1) . "/" . count($queries) . " ({$totalResults}/{$limit} found)",
            'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
            'source' => 'Serper Organic',
            'phase' => 'searching',
        ]);
    }

    $diagnostics['finalResults'] = $totalResults;
    $diagnostics['queryErrors'] = $queryErrorCount;
    if ($totalResults === 0 && $queryErrorCount > 0) {
        $errorMessage = 'Platform search upstream failed for all queries.';
        if ($lastQueryError !== '') {
            $errorMessage .= ' Last error: ' . $lastQueryError;
        }
        sendSSE('error', ['error' => $errorMessage, 'diagnostics' => $diagnostics]);
        return;
    }

    sendSSE('complete', [
        'total' => $totalResults,
        'leads' => $allResults,
        'diagnostics' => $diagnostics,
    ]);
}

/**
 * Quick website check from URL/snippet only (no network calls).
 */
function quickWebsiteCheck($url, $contextText = '')
{
    $host = parse_url($url, PHP_URL_HOST) ?? '';
    $hostLower = strtolower($host);
    $context = strtolower((string)$contextText);
    $businessWebsite = inferBusinessWebsiteFromSearchResultUrl($url);

    $platform = null;
    $needsUpgrade = false;
    $issues = [];

    if (strpos($hostLower, 'wix') !== false || strpos($hostLower, 'wixsite') !== false || strpos($context, 'built with wix') !== false) {
        $platform = 'wix';
        $needsUpgrade = true;
        $issues[] = 'Using Wix template';
    } elseif (strpos($hostLower, 'squarespace') !== false || strpos($context, 'powered by squarespace') !== false) {
        $platform = 'squarespace';
        $needsUpgrade = true;
        $issues[] = 'Using Squarespace template';
    } elseif (strpos($hostLower, 'weebly') !== false || strpos($context, 'powered by weebly') !== false) {
        $platform = 'weebly';
        $needsUpgrade = true;
        $issues[] = 'Using Weebly template';
    } elseif (strpos($hostLower, 'godaddy') !== false || strpos($hostLower, 'godaddysites') !== false || strpos($context, 'godaddy website') !== false) {
        $platform = 'godaddy';
        $needsUpgrade = true;
        $issues[] = 'Using GoDaddy builder';
    } elseif (strpos($hostLower, 'wordpress.com') !== false || strpos($context, 'powered by wordpress') !== false || strpos($context, 'wp-content') !== false) {
        $platform = 'wordpress';
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

    // Estimate mobileScore from platform heuristics (no HTTP calls)
    $estimatedMobile = null;
    if ($platform !== null) {
        $weakMobilePlatforms = ['joomla', 'drupal', 'opencart', 'prestashop', 'zencart', 'oscommerce', 'blogger'];
        $mediumMobilePlatforms = ['wix', 'weebly', 'godaddy', 'wordpress.com', 'jimdo', 'facebook'];
        $goodMobilePlatforms = ['shopify', 'webflow', 'squarespace'];
        if (in_array($platform, $weakMobilePlatforms, true)) {
            $estimatedMobile = 35;
        } elseif (in_array($platform, $mediumMobilePlatforms, true)) {
            $estimatedMobile = 52;
        } elseif (in_array($platform, $goodMobilePlatforms, true)) {
            $estimatedMobile = 72;
        } else {
            $estimatedMobile = 55;
        }
    }

    return [
        'hasWebsite' => $businessWebsite !== '',
        'platform' => $platform,
        'needsUpgrade' => $needsUpgrade,
        'issues' => $issues,
        'mobileScore' => $estimatedMobile,
        'loadTime' => null,
    ];
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
