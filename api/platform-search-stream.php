<?php
/**
 * Platform Search API Endpoint - STREAMING VERSION
 * SSE streaming for Agency Lead Finder (Option B)
 * With geo expansion, synonym expansion, and volume fulfillment
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/includes/custom_fetcher.php';
require_once __DIR__ . '/includes/geo-grid.php';

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
    $filtersForMatching = $filters;
    $filtersForMatching['platforms'] = [];
    $filtersActive = hasAnySearchFilter($filters);
    $noWebsiteFilter = !empty($filtersForMatching['noWebsite']);

    // ---- OVER-DELIVERY: Aim for 125% of requested leads ----
    $targetCount = (int) ceil($limit * 1.25);

    // ---- PLATFORM QUERIES ----
    $queryPlatforms = $platforms;
    if ($noWebsiteFilter) {
        $queryPlatforms = array_values(array_unique(array_merge($queryPlatforms, [
            'gmb', 'yelp', 'yellowpages', 'manta', 'bbb', 'angi', 'thumbtack', 'homeadvisor',
            'mapquest', 'foursquare', 'superpages', 'citysearch', 'chamberofcommerce',
            'merchantcircle', 'local'
        ])));
    }
    $platformQueries = buildPlatformQueries($queryPlatforms);

    // ---- GEO EXPANSION: Build list of locations to search ----
    $locationsToSearch = [$location];
    $expandedLocations = [];
    $cityClean = $location;
    $stateSuffix = '';
    if (strpos($location, ',') !== false) {
        [$cityClean, $stateSuffix] = array_map('trim', explode(',', $location, 2));
        $stateSuffix = ", $stateSuffix";
    }

    // Always expand to surrounding areas for volume fulfillment
    if (function_exists('getMetroSubAreas')) {
        $subAreas = getMetroSubAreas(strtolower(trim($cityClean)));
        if (!empty($subAreas)) {
            // Scale expansion based on requested limit
            $expansionCount = 8;
            if ($limit >= 50) $expansionCount = 15;
            if ($limit >= 100) $expansionCount = 25;
            if ($limit >= 250) $expansionCount = 40;
            if ($limit >= 500) $expansionCount = 60;
            $expansionCount = min($expansionCount, count($subAreas));
            $expandedLocations = array_slice($subAreas, 0, $expansionCount);
            foreach ($expandedLocations as $area) {
                $locationsToSearch[] = $area . $stateSuffix;
            }
        }
    }

    // Add directional expansions for broader geographic coverage
    $directions = ['North', 'South', 'East', 'West'];
    foreach ($directions as $dir) {
        $locationsToSearch[] = "$dir $cityClean" . $stateSuffix;
    }
    $locationsToSearch[] = "near $cityClean" . $stateSuffix;
    $locationsToSearch[] = "greater $cityClean" . $stateSuffix;

    // ---- SYNONYM EXPANSION: Build service variants ----
    $serviceVariants = [$service];
    if (function_exists('expandServiceSynonyms')) {
        $synonyms = expandServiceSynonyms($service);
        if (!empty($synonyms)) {
            // Scale synonyms based on limit
            $synCount = 3;
            if ($limit >= 50) $synCount = 5;
            if ($limit >= 100) $synCount = 8;
            if ($limit >= 250) $synCount = 12;
            $serviceVariants = array_merge($serviceVariants, array_slice($synonyms, 0, $synCount));
            $serviceVariants = array_unique($serviceVariants);
        }
    }

    sendSSE('start', [
        'query' => "$service in $location",
        'limit' => $limit,
        'targetCount' => $targetCount,
        'sources' => $noWebsiteFilter ? ['Serper Places', 'Serper Organic'] : ['Serper Organic'],
        'platforms' => $platforms,
        'filtersActive' => $filtersActive,
        'locationCount' => count($locationsToSearch),
        'synonymCount' => count($serviceVariants),
        'expandedLocations' => array_slice($expandedLocations, 0, 10),
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
        'placesResults' => 0,
        'locationsSearched' => 0,
        'synonymsUsed' => 0,
        'finalResults' => 0,
    ];

    $allResults = [];
    $seenResults = [];
    $totalResults = 0;
    $queryErrorCount = 0;
    $lastQueryError = '';
    $emitBatchSize = 5;

    // ================================================================
    // PASS 1: PLACES (Google Maps) — When "No website" filter is active
    // ⚡ Uses parallelSerperSearch() for batch execution
    // ================================================================
    if ($noWebsiteFilter) {
        $placesQueries = [];
        foreach (array_slice($locationsToSearch, 0, 20) as $loc) {
            foreach (array_slice($serviceVariants, 0, 4) as $svc) {
                $placesQueries[] = "$svc in $loc";
            }
        }

        sendSSE('status', [
            'message' => 'Searching Google Maps for businesses without websites...',
            'progress' => 2,
            'source' => 'Serper Places',
            'phase' => 'places_search',
        ]);

        // ⚡ Fire all places queries in parallel batches of 10
        $placesBatchSize = 10;
        $placesBatches = array_chunk($placesQueries, $placesBatchSize);

        foreach ($placesBatches as $pbIdx => $batch) {
            if ($totalResults >= $targetCount) break;

            $batchResults = parallelSerperSearch($batch, 'places', $placesBatchSize);
            $diagnostics['queriesExecuted'] += count($batch);

            $leadBuffer = [];
            foreach ($batchResults as $resultIdx => $places) {
                if ($totalResults >= $targetCount) break;
                if (empty($places)) continue;

                foreach ($places as $place) {
                    if ($totalResults >= $targetCount) break;
                    $diagnostics['rawCandidates']++;

                    $placeWebsite = trim($place['website'] ?? '');
                    $placeName = $place['title'] ?? ($place['name'] ?? '');
                    $placePhone = $place['phoneNumber'] ?? ($place['phone'] ?? '');
                    $placeAddress = $place['address'] ?? '';

                    $dedupeKey = strtolower(preg_replace('/[^a-z0-9]/', '', $placeName));
                    if (isset($seenResults[$dedupeKey])) {
                        $diagnostics['dedupedCandidates']++;
                        continue;
                    }
                    $seenResults[$dedupeKey] = true;

                    $business = [
                        'id' => 'plat_places_' . substr(md5($placeName . $placeAddress . $resultIdx), 0, 12),
                        'name' => $placeName,
                        'url' => '',
                        'website' => $placeWebsite,
                        'address' => $placeAddress,
                        'phone' => $placePhone,
                        'email' => '',
                        'rating' => $place['rating'] ?? null,
                        'reviewCount' => $place['reviews'] ?? ($place['reviewsCount'] ?? null),
                        'source' => 'Serper Places',
                        'sources' => ['Serper Places'],
                        'websiteAnalysis' => [
                            'hasWebsite' => $placeWebsite !== '',
                            'platform' => null,
                            'needsUpgrade' => false,
                            'issues' => $placeWebsite === '' ? ['No website detected'] : [],
                            'mobileScore' => null,
                            'loadTime' => null,
                        ],
                    ];

                    $diagnostics['preFilterCandidates']++;
                    if (!matchesSearchFilters($business, $filtersForMatching)) {
                        $diagnostics['filterRejectedCandidates']++;
                        $reasons = getSearchFilterFailureReasons($business, $filtersForMatching);
                        foreach ($reasons as $reason) {
                            if (!isset($diagnostics['filterRejections'][$reason])) $reason = 'combined';
                            $diagnostics['filterRejections'][$reason]++;
                        }
                        continue;
                    }

                    $diagnostics['filterMatchedCandidates']++;
                    $diagnostics['placesResults']++;
                    $allResults[] = $business;
                    $leadBuffer[] = $business;
                    $totalResults++;
                }
            }

            // Emit entire batch at once for fast jumps
            if (!empty($leadBuffer)) {
                sendSSE('results', [
                    'leads' => $leadBuffer,
                    'total' => $totalResults,
                    'progress' => min(45, round(($totalResults / max(1, $targetCount)) * 100)),
                    'source' => 'Serper Places',
                ]);
            }

            sendSSE('status', [
                'message' => "Maps batch " . ($pbIdx + 1) . "/" . count($placesBatches) . " ({$totalResults} leads)",
                'progress' => min(45, round(($totalResults / max(1, $targetCount)) * 100)),
                'source' => 'Serper Places',
                'phase' => 'places_search',
            ]);
        }

        if ($totalResults > 0) {
            sendSSE('status', [
                'message' => "Found {$totalResults} from Google Maps, expanding organic search...",
                'progress' => min(50, round(($totalResults / max(1, $targetCount)) * 100)),
                'source' => 'Serper Organic',
                'phase' => 'searching',
            ]);
        }
    }

    // ================================================================
    // PASS 2: ORGANIC SEARCH — Platform queries across all locations + synonyms
    // ================================================================
    // Build all organic queries: (service variants) × (platform modifiers) × (locations)
    $queries = [];

    // Phase A: Primary service + all platform modifiers + primary location
    foreach ($platformQueries as $modifier) {
        $queries[] = ['q' => "$service $modifier $location", 'phase' => 'primary'];
    }
    $queries[] = ['q' => "$service in $location", 'phase' => 'primary'];

    // Phase B: Primary service + expanded locations (geo expansion)
    if (count($locationsToSearch) > 1) {
        foreach (array_slice($locationsToSearch, 1) as $expandedLoc) {
            // Use top platform modifiers for expanded locations
            $topModifiers = array_slice($platformQueries, 0, min(5, count($platformQueries)));
            foreach ($topModifiers as $modifier) {
                $queries[] = ['q' => "$service $modifier $expandedLoc", 'phase' => 'geo_expansion'];
            }
            $queries[] = ['q' => "$service in $expandedLoc", 'phase' => 'geo_expansion'];
        }
    }

    // Phase C: Synonym variants + primary location (synonym expansion)
    if (count($serviceVariants) > 1) {
        foreach (array_slice($serviceVariants, 1) as $synonym) {
            $topModifiers = array_slice($platformQueries, 0, min(3, count($platformQueries)));
            foreach ($topModifiers as $modifier) {
                $queries[] = ['q' => "$synonym $modifier $location", 'phase' => 'synonym_expansion'];
            }
            $queries[] = ['q' => "$synonym in $location", 'phase' => 'synonym_expansion'];
        }
    }

    // Phase D: Synonyms + expanded locations (deep expansion — only if still short)
    if (count($serviceVariants) > 1 && count($locationsToSearch) > 1) {
        $topSynonyms = array_slice($serviceVariants, 1, 3);
        $topLocations = array_slice($locationsToSearch, 1, 10);
        foreach ($topSynonyms as $synonym) {
            foreach ($topLocations as $expandedLoc) {
                $queries[] = ['q' => "$synonym in $expandedLoc", 'phase' => 'deep_expansion'];
            }
        }
    }

    $diagnostics['queriesPlanned'] += count($queries);
    $totalQueries = count($queries);

    sendSSE('status', [
        'message' => $noWebsiteFilter
            ? "Searching directories across " . count($locationsToSearch) . " locations..."
            : "Searching " . count($locationsToSearch) . " locations with " . count($serviceVariants) . " service variants...",
        'progress' => $noWebsiteFilter ? 50 : 1,
        'source' => 'Serper Organic',
        'locationCount' => count($locationsToSearch),
        'variantCount' => count($serviceVariants),
        'estimatedQueries' => $totalQueries,
        'phase' => 'searching',
    ]);

    // ⚡ PARALLEL ORGANIC SEARCH: Group queries by phase and fire in batches
    // Group queries by phase for progress reporting
    $phaseGroups = [];
    foreach ($queries as $queryItem) {
        $phase = $queryItem['phase'];
        $phaseGroups[$phase][] = $queryItem['q'];
    }

    $phaseLabels = [
        'primary' => 'Primary search',
        'geo_expansion' => 'Expanding to surrounding cities',
        'synonym_expansion' => 'Trying related search terms',
        'deep_expansion' => 'Deep expansion: related terms + nearby cities',
    ];

    $organicBatchSize = 10; // Fire 10 queries simultaneously
    $globalQueryIdx = 0;

    foreach ($phaseGroups as $phase => $phaseQueries) {
        if ($totalResults >= $targetCount) break;

        $diagnostics['locationsSearched']++;
        sendSSE('status', [
            'message' => ($phaseLabels[$phase] ?? $phase) . " ({$totalResults}/{$limit} leads)...",
            'progress' => min(90, round(($totalResults / max(1, $targetCount)) * 100)),
            'source' => 'Serper Organic',
            'phase' => $phase,
        ]);

        $batches = array_chunk($phaseQueries, $organicBatchSize);

        foreach ($batches as $batchIdx => $batch) {
            if ($totalResults >= $targetCount) break;

            // Build payloads with num parameter
            $payloads = [];
            foreach ($batch as $q) {
                $payloads[] = [
                    'q' => $q,
                    'num' => min(100, max(20, $targetCount - $totalResults)),
                ];
            }

            $batchResults = parallelSerperSearch($payloads, 'search', $organicBatchSize);
            $diagnostics['queriesExecuted'] += count($batch);

            $leadBuffer = [];
            foreach ($batchResults as $resultIdx => $organic) {
                if ($totalResults >= $targetCount) break;
                if (empty($organic)) continue;

                foreach ($organic as $item) {
                    if ($totalResults >= $targetCount) break;
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
                        'id' => 'plat_' . substr(md5($link . $globalQueryIdx), 0, 12),
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
                            if (!isset($diagnostics['filterRejections'][$reason])) $reason = 'combined';
                            $diagnostics['filterRejections'][$reason]++;
                        }
                        continue;
                    }
                    $diagnostics['filterMatchedCandidates']++;

                    $allResults[] = $business;
                    $leadBuffer[] = $business;
                    $totalResults++;
                }
                $globalQueryIdx++;
            }

            // Emit entire batch at once — this creates the "jump" effect (50 → 120 → 200)
            if (!empty($leadBuffer)) {
                sendSSE('results', [
                    'leads' => $leadBuffer,
                    'total' => $totalResults,
                    'progress' => min(95, round(($totalResults / max(1, $targetCount)) * 100)),
                    'source' => 'Serper Organic',
                ]);
            }

            // Progress update per batch
            sendSSE('status', [
                'message' => ($phaseLabels[$phase] ?? $phase) . " batch " . ($batchIdx + 1) . "/" . count($batches) . " ({$totalResults}/{$limit} leads)",
                'progress' => min(95, round(($totalResults / max(1, $targetCount)) * 100)),
                'source' => 'Serper Organic',
                'phase' => $phase,
            ]);
        }
    }

    $diagnostics['finalResults'] = $totalResults;
    $diagnostics['locationsSearched'] = count($locationsToSearch);
    $diagnostics['synonymsUsed'] = count($serviceVariants);
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
        'requested' => $limit,
        'overDelivered' => $totalResults > $limit,
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
