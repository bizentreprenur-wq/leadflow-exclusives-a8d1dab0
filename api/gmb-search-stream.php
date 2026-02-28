<?php
/**
 * GMB Search API Endpoint - STREAMING VERSION
 * Streams results progressively from the active search pipeline
 * Uses Server-Sent Events (SSE) for real-time updates
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/includes/firecrawl.php';
require_once __DIR__ . '/includes/geo-grid.php';
require_once __DIR__ . '/includes/custom_fetcher.php';

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

// Increase time limit for massive searches (up to 50000 leads = ~60 min)
set_time_limit(3600);
ini_set('memory_limit', '1024M');

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
$limit = max(20, min(50000, $limit));
// Set global so inlineExtractEmail can skip for high-volume searches
$GLOBALS['_bamlead_search_limit'] = $limit;
$filters = normalizeSearchFilters($input['filters'] ?? null);
$filtersActive = hasAnySearchFilter($filters);
$baseFilterMultiplier = defined('FILTER_OVERFETCH_MULTIPLIER') ? max(1, (int)FILTER_OVERFETCH_MULTIPLIER) : 3;
$filterMultiplier = $filtersActive ? $baseFilterMultiplier : 1;
if ($filtersActive) {
    $strictFilterCount = 0;
    foreach (['phoneOnly', 'noWebsite', 'notMobile', 'outdated'] as $filterKey) {
        if (!empty($filters[$filterKey])) {
            $strictFilterCount++;
        }
    }
    $platformFilterActive = !empty($filters['platforms']) && is_array($filters['platforms']) && count($filters['platforms']) > 0;
    if ($platformFilterActive) {
        $strictFilterCount++;
    }

    $strictnessBoost = 1.0 + (max(0, $strictFilterCount - 1) * 0.35);
    if (!empty($filters['platformMode']) && $platformFilterActive) {
        $strictnessBoost += 0.4;
    }
    if (!empty($filters['noWebsite']) && (!empty($filters['notMobile']) || !empty($filters['outdated']))) {
        $strictnessBoost += 0.25;
    }

    $filterMultiplier = (int)ceil($filterMultiplier * $strictnessBoost);
    if ($limit >= 500) {
        $filterMultiplier = max($filterMultiplier, 4);
    }
    if ($limit >= 1500) {
        $filterMultiplier = max($filterMultiplier, 5);
    }
    $filterMultiplier = min($filterMultiplier, $limit >= 2000 ? 10 : 8);
}
$targetCount = getSearchFillTargetCount($limit);

if (empty($service)) {
    sendSSEError('Service type is required');
    exit();
}

if (empty($location)) {
    sendSSEError('Location is required');
    exit();
}

// Start streaming search:
// - Raw Serper-only mode (default) bypasses custom fetcher and enrichment.
// - Legacy Serper pipeline remains the execution path in this mode.
$rawSerperOnly = forceRawSerperOnlyMode();
$useCustomPipeline = !$rawSerperOnly && function_exists('customFetcherEnabled') && customFetcherEnabled();
$legacySerperAllowed = $rawSerperOnly || (defined('ENABLE_LEGACY_SERPER_PIPELINE') && ENABLE_LEGACY_SERPER_PIPELINE);

if ($useCustomPipeline) {
    streamCustomOneShotSearch($service, $location, $limit, $filters, $filtersActive, $targetCount);
    exit();
}

if (!$legacySerperAllowed) {
    sendSSEError('Legacy Serper pipeline is disabled. Enable custom one-shot fetcher in config.');
    exit();
}

// Legacy mode (kept for rollback only)
$enrichmentSessionId = 'enrich_' . uniqid() . '_' . time();
// Search-time enrichment is force-disabled for speed and faster lead appearance.
$enableEnrichment = false;

streamGMBSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $targetCount, $enrichmentSessionId, $enableEnrichment);

/**
 * Send SSE message
 */
function sendSSE($event, $data) {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    if (function_exists('ob_flush')) {
        @ob_flush();
    }
    flush();
}

/**
 * Send SSE error
 */
function sendSSEError($message) {
    sendSSE('error', ['error' => $message]);
}

/**
 * Stream multi-source search results progressively
 * Uses Serper.dev for search coverage and Firecrawl for enrichment
 */
function streamGMBSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $targetCount, $enrichmentSessionId = '', $enableEnrichment = false) {
    $hasSerper = defined('SERPER_API_KEY') && !empty(SERPER_API_KEY);
    $enrichmentSearchType = !empty($filters['platformMode']) ? 'platform' : 'gmb';

    if (!$hasSerper) {
        sendSSEError('No search API configured. Please add SERPER_API_KEY to config.php');
        return;
    }

    $allResults = [];
    $seenBusinesses = [];
    $totalResults = 0;

    $enableExpansion = defined('ENABLE_LOCATION_EXPANSION') ? ENABLE_LOCATION_EXPANSION : true;
    $expansionMax = defined('LOCATION_EXPANSION_MAX') ? max(0, (int)LOCATION_EXPANSION_MAX) : 12;
    if ($limit >= 250) {
        $expansionMax = max($expansionMax, 28);
    }
    if ($limit >= 500) {
        $expansionMax = max($expansionMax, 36);
    }
    if ($limit >= 1000) {
        $expansionMax = max($expansionMax, 50);
    }
    if ($limit >= 2000) {
        $expansionMax = max($expansionMax, 80);
    }
    if ($limit >= 5000) {
        $expansionMax = max($expansionMax, 120);
    }
    if ($filtersActive) {
        if ($limit >= 2000) {
            $expansionMax = max($expansionMax, 150);
        } elseif ($limit >= 1000) {
            $expansionMax = max($expansionMax, 90);
        } else {
            $expansionMax = max($expansionMax, 45);
        }
    }
    // ⚡ RE-ENABLED: Auto-expand to nearby cities/suburbs for higher volume
    $expandedLocations = [];
    $locationsToSearch = [$location];
    $searchedLocations = [];

    // Auto-expand using metro sub-areas from geo-grid
    if ($enableExpansion) {
        $cityClean = $location;
        if (strpos($location, ',') !== false) {
            [$cityClean] = array_map('trim', explode(',', $location, 2));
        }
        $subAreas = function_exists('getMetroSubAreas') ? getMetroSubAreas(strtolower(trim($cityClean))) : [];
        if (!empty($subAreas)) {
            // Add suburbs/neighborhoods as additional search locations
            $expansionCount = min(count($subAreas), $expansionMax);
            $expandedLocations = array_slice($subAreas, 0, $expansionCount);
            $locationsToSearch = array_merge($locationsToSearch, $expandedLocations);
        }
    }

    // Pre-compute synonym variants for use in primary search loop
    $serviceVariants = expandServiceSynonyms($service);
    if (empty($serviceVariants)) {
        $serviceVariants = [$service];
    }
    // For high-volume searches, use synonym variants per location.
    // BUT: Places/Maps only returns ~20 results per query, so too many
    // synonyms per location bottlenecks the stream. Keep this small and
    // rely on the dedicated deep organic pass for volume.
    // Feed MORE synonyms per location for broader discovery
    $synonymsPerLocation = 2;
    if ($limit >= 250) $synonymsPerLocation = 3;
    if ($limit >= 500) $synonymsPerLocation = 5;
    if ($limit >= 1000) $synonymsPerLocation = 8;
    if ($limit >= 2000) $synonymsPerLocation = 12;
    if ($limit >= 5000) $synonymsPerLocation = 16;
    // Pick top N synonyms (skip first which is the original) — includes intent modifiers
    $synonymSubset = array_slice($serviceVariants, 1, $synonymsPerLocation);

    // For high-volume, also prepare directory-specific queries
    $directoryQueries = [];
    if ($limit >= 500 || ($filtersActive && $limit >= 250)) {
        $topDirectories = [
            'site:yelp.com', 'site:bbb.org', 'site:yellowpages.com',
            'site:manta.com', 'site:angi.com', 'site:thumbtack.com',
            'site:homeadvisor.com', 'site:mapquest.com', 'site:foursquare.com',
            'site:superpages.com', 'site:chamberofcommerce.com',
            'site:expertise.com', 'site:porch.com', 'site:bark.com',
        ];
        $dirCount = $limit >= 2000 ? count($topDirectories) : ($limit >= 1000 ? 8 : ($filtersActive ? 7 : 5));
        $directoryQueries = array_slice($topDirectories, 0, $dirCount);
    }

    $locationCount = count($locationsToSearch);
    $variantCount = 1 + count($synonymSubset); // base + synonyms
    $estimatedQueries = $locationCount * $variantCount;

    sendSSE('start', [
        'query' => "$service in $location",
        'limit' => $limit,
        'targetCount' => $targetCount,
        'sources' => ['Serper Places', 'Serper Organic', 'Serper Maps'],
        'estimatedSources' => 3,
        'expandedLocations' => $expandedLocations,
        'synonymVariants' => count($serviceVariants),
        'filtersActive' => $filtersActive,
        'enrichmentEnabled' => $enableEnrichment,
        'enrichmentSessionId' => $enrichmentSessionId,
        'locationCount' => $locationCount,
        'variantCount' => $variantCount,
        'estimatedQueries' => $estimatedQueries
    ]);

    // Enrichment plumbing removed — enrichment is permanently disabled.
    // The $emitEnrichment closure is kept as a no-op so call-sites don't need
    // to be touched (they are guarded by $enableEnrichment = false anyway).
    $emitEnrichment = function () { /* no-op */ };

    // ---- PRIMARY SEARCH LOOP ----
    // ⚡ SPEED: Fire Places queries for ALL locations in parallel via curl_multi
    // instead of sequential per-location calls
    $placesLocationsToSearch = $locationsToSearch;
    if ($limit >= 500) {
        $placesLocationCap = $limit >= 2000 ? 20 : ($limit >= 1000 ? 14 : 8);
        if ($filtersActive) {
            $placesLocationCap = (int)ceil($placesLocationCap * 1.5);
        }
        $placesLocationsToSearch = array_slice($locationsToSearch, 0, min($placesLocationCap, count($locationsToSearch)));
    }

    // Build ALL queries upfront (base + synonyms per location)
    $allPrimaryQueries = [];
    foreach ($placesLocationsToSearch as $locationIndex => $searchLocation) {
        $allPrimaryQueries[] = [
            'query' => "$service in $searchLocation",
            'location' => $searchLocation,
            'type' => 'base',
        ];
        if ($limit >= 500 && !empty($synonymSubset)) {
            foreach ($synonymSubset as $synonym) {
                $allPrimaryQueries[] = [
                    'query' => "$synonym in $searchLocation",
                    'location' => $searchLocation,
                    'type' => 'synonym',
                ];
            }
        }
    }

    // ⚡ Fire ALL primary queries in parallel batches via curl_multi (Places endpoint)
    // ⚡ Shared hosting (Hostinger) throttles curl_multi — keep concurrency low
    $primaryBatchSize = 8; // Reduced from 20 for shared hosting resilience
    $primaryBatches = array_chunk($allPrimaryQueries, $primaryBatchSize);

    foreach ($primaryBatches as $batchIdx => $batch) {
        if ($totalResults >= $limit) break;

        $queryStrings = array_map(fn($q) => $q['query'], $batch);
        $batchResults = parallelSerperSearch($queryStrings, 'places', $primaryBatchSize);

        $leadBuffer = [];
        foreach ($batchResults as $resultIdx => $places) {
            if ($totalResults >= $limit) break;
            if (empty($places)) continue;

            $batchLocation = $batch[$resultIdx]['location'] ?? $location;
            if (!in_array($batchLocation, $searchedLocations)) {
                $searchedLocations[] = $batchLocation;
            }

            foreach ($places as $item) {
                if ($totalResults >= $limit) break;

                $business = [
                    'id' => generateId('srpr_'),
                    'name' => $item['title'] ?? '',
                    'url' => $item['website'] ?? '',
                    'snippet' => $item['description'] ?? ($item['type'] ?? ''),
                    'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
                    'address' => $item['address'] ?? '',
                    'phone' => $item['phone'] ?? ($item['phoneNumber'] ?? ''),
                    'email' => extractEmailFromText($item['description'] ?? ''),
                    'rating' => $item['rating'] ?? null,
                    'reviews' => $item['reviews'] ?? ($item['ratingCount'] ?? null),
                    'source' => 'Serper Places',
                    'sources' => ['Serper Places'],
                ];

                if (empty($business['name'])) continue;
                $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
                if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;

                $dedupeKey = buildBusinessDedupeKey($business, $batchLocation);
                if (isset($seenBusinesses[$dedupeKey])) continue;

                $seenBusinesses[$dedupeKey] = count($allResults);
                $allResults[] = $business;
                $totalResults++;
                $leadBuffer[] = $business;

                if ($enableEnrichment && !empty($business['url'])) {
                    queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
                }

                // Batch SSE: send every 25 leads
                if (count($leadBuffer) >= 25) {
                    $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                    sendSSE('results', [
                        'leads' => $leadBuffer,
                        'total' => $totalResults,
                        'progress' => $progress,
                        'source' => 'Serper Places'
                    ]);
                    $leadBuffer = [];
                }
            }
        }
        // Flush remaining
        if (!empty($leadBuffer)) {
            $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
            sendSSE('results', [
                'leads' => $leadBuffer,
                'total' => $totalResults,
                'progress' => $progress,
                'source' => 'Serper Places'
            ]);
        }

        $emitEnrichment();

        sendSSE('status', [
            'message' => "Parallel Places batch " . ($batchIdx + 1) . "/" . count($primaryBatches) . " ({$totalResults}/{$limit} found)",
            'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
        ]);
    }

    // ---- SHORT-CIRCUIT: Skip remaining passes for small searches ----
    if ($limit <= 100 && $totalResults >= $limit) {
        sendSSE('complete', [
            'total' => $totalResults,
            'requested' => $limit,
            'targetCount' => $targetCount,
            'coverage' => round(($totalResults / max(1, $limit)) * 100, 2),
            'sources' => ['Serper Places'],
            'query' => ['service' => $service, 'location' => $location, 'limit' => $limit],
            'searchedLocations' => $searchedLocations,
            'enrichmentSessionId' => $enrichmentSessionId,
            'enrichmentEnabled' => $enableEnrichment
        ]);
        return;
    }

    // ---- MULTI-PAGE PLACES PAGINATION (Pages 2-5) ----
    // Serper Places supports pagination — fetch additional pages for more unique results
    $maxPlacesPages = 2;
    if ($limit >= 500) $maxPlacesPages = 3;
    if ($limit >= 1000) $maxPlacesPages = 4;
    if ($limit >= 2000) $maxPlacesPages = 5;

    for ($placesPage = 2; $placesPage <= $maxPlacesPages; $placesPage++) {
        if ($totalResults >= $limit) break;

        sendSSE('status', [
            'message' => "Places pagination — page {$placesPage}/{$maxPlacesPages} ({$totalResults}/{$limit} found)",
            'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
        ]);

        foreach ($primaryBatches as $batchIdx => $batch) {
            if ($totalResults >= $limit) break;

            $queryStrings = array_map(fn($q) => $q['query'], $batch);
            $batchResults = parallelSerperSearch($queryStrings, 'places', $primaryBatchSize, $placesPage);

            $leadBuffer = [];
            foreach ($batchResults as $resultIdx => $places) {
                if ($totalResults >= $limit) break;
                if (empty($places)) continue;

                $batchLocation = $batch[$resultIdx]['location'] ?? $location;

                foreach ($places as $item) {
                    if ($totalResults >= $limit) break;

                    $business = [
                        'id' => generateId('srpp_'),
                        'name' => $item['title'] ?? '',
                        'url' => $item['website'] ?? '',
                        'snippet' => $item['description'] ?? ($item['type'] ?? ''),
                        'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
                        'address' => $item['address'] ?? '',
                        'phone' => $item['phone'] ?? ($item['phoneNumber'] ?? ''),
                        'email' => extractEmailFromText($item['description'] ?? ''),
                        'rating' => $item['rating'] ?? null,
                        'reviews' => $item['reviews'] ?? ($item['ratingCount'] ?? null),
                        'source' => 'Serper Places (p' . $placesPage . ')',
                        'sources' => ['Serper Places'],
                    ];

                    if (empty($business['name'])) continue;
                    $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
                    if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;

                    $dedupeKey = buildBusinessDedupeKey($business, $batchLocation);
                    if (isset($seenBusinesses[$dedupeKey])) continue;

                    $seenBusinesses[$dedupeKey] = count($allResults);
                    $allResults[] = $business;
                    $totalResults++;
                    $leadBuffer[] = $business;

                    if (count($leadBuffer) >= 25) {
                        $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                        sendSSE('results', [
                            'leads' => $leadBuffer,
                            'total' => $totalResults,
                            'progress' => $progress,
                            'source' => 'Serper Places (p' . $placesPage . ')'
                        ]);
                        $leadBuffer = [];
                    }
                }
            }

            if (!empty($leadBuffer)) {
                $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                sendSSE('results', [
                    'leads' => $leadBuffer,
                    'total' => $totalResults,
                    'progress' => $progress,
                    'source' => 'Serper Places (p' . $placesPage . ')'
                ]);
            }
        }
    }

    // ---- GRID PARALLEL SEARCH (Step A + B) ----
    // Fire 50-150 location-specific queries simultaneously via curl_multi
    // This is the highest-throughput phase: covers neighborhoods, suburbs, and distance rings
    if ($totalResults < $limit && $limit >= 200) {
        $gridQueries = generateSearchGrid($service, $location, $limit - $totalResults);

        if (!empty($gridQueries)) {
            $gridCount = count($gridQueries);
            sendSSE('coverage', [
                'message' => "🔥 Grid parallel search: firing {$gridCount} tile queries simultaneously...",
                'total' => $totalResults,
                'target' => $limit,
                'gridTiles' => $gridCount,
                'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
            ]);

            // Fire ALL queries in parallel (30 concurrent connections)
            $gridResultBatches = parallelSerperSearch($gridQueries, 'places', 10);

            $gridBatch = [];
            foreach ($gridResultBatches as $places) {
                if ($totalResults >= $limit) break;
                if (empty($places)) continue;

                foreach ($places as $item) {
                    if ($totalResults >= $limit) break;

                    $business = [
                        'id' => generateId('grid_'),
                        'name' => $item['title'] ?? '',
                        'url' => $item['website'] ?? '',
                        'snippet' => $item['description'] ?? ($item['type'] ?? ''),
                        'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
                        'address' => $item['address'] ?? '',
                        'phone' => $item['phone'] ?? '',
                        'email' => extractEmailFromText($item['description'] ?? ''),
                        'rating' => $item['rating'] ?? null,
                        'reviews' => $item['reviews'] ?? null,
                        'source' => 'Grid Search',
                        'sources' => ['Grid Search'],
                    ];

                    if (empty($business['name'])) continue;
                    $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
                    if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;

                    $dedupeKey = buildBusinessDedupeKey($business, $location);
                    if (isset($seenBusinesses[$dedupeKey])) continue;

                    $seenBusinesses[$dedupeKey] = count($allResults);
                    $allResults[] = $business;
                    $totalResults++;
                    $gridBatch[] = $business;

                    if ($enableEnrichment && !empty($business['url'])) {
                        queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
                    }

                    // Batch SSE: send every 25 leads at once
                    if (count($gridBatch) >= 25) {
                        $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                        sendSSE('results', [
                            'leads' => $gridBatch,
                            'total' => $totalResults,
                            'progress' => $progress,
                            'source' => 'Grid Search'
                        ]);
                        $gridBatch = [];
                    }
                }
            }

            // Flush remaining
            if (!empty($gridBatch)) {
                $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                sendSSE('results', [
                    'leads' => $gridBatch,
                    'total' => $totalResults,
                    'progress' => $progress,
                    'source' => 'Grid Search'
                ]);
            }

            $emitEnrichment();

            sendSSE('status', [
                'message' => "Grid search complete: {$totalResults} total leads ({$gridCount} tiles searched in parallel)",
                'progress' => min(98, round(($totalResults / max(1, $limit)) * 100)),
            ]);
        }
    }

    // ---- SECONDARY TOP-UP PASS ----
    // Only run expensive Places/Maps query variants for small searches.
    // For high-volume, deep organic is substantially faster.
    if ($totalResults < $limit && $limit < 500) {
        sendSSE('coverage', [
            'message' => "Under requested count ({$totalResults}/{$limit}). Running broader query variants...",
            'total' => $totalResults,
            'target' => $limit,
            'progress' => min(100, round(($totalResults / max(1, $limit)) * 100)),
        ]);

        $queryVariants = buildSearchQueryVariants(
            $service,
            !empty($searchedLocations) ? $searchedLocations : [$location],
            $limit,
            $filtersActive
        );
        foreach ($queryVariants as $variant) {
            if ($totalResults >= $limit) {
                break;
            }

            $query = $variant['query'];
            $variantLocation = $variant['location'];
            sendSSE('variant_start', [
                'query' => $query,
                'location' => $variantLocation,
                'remaining' => $limit - $totalResults,
            ]);

            streamSerperSearchInto(
                $service,
                $variantLocation,
                $limit,
                $filters,
                $filtersActive,
                $filterMultiplier,
                $allResults,
                $seenBusinesses,
                $totalResults,
                $enrichmentSessionId,
                $enableEnrichment,
                $enrichmentSearchType,
                false,
                $query
            );

            $emitEnrichment();
        }
    } elseif ($totalResults < $limit) {
        sendSSE('coverage', [
            'message' => "Switching to deep organic search to reach {$limit} leads...",
            'total' => $totalResults,
            'target' => $limit,
            'progress' => min(98, round(($totalResults / max(1, $limit)) * 100)),
        ]);
    }

    // ---- TERTIARY: Deep organic pagination pass for remaining deficit ----
    if ($totalResults < $limit) {
        $deficit = $limit - $totalResults;
        sendSSE('coverage', [
            'message' => "Running deep organic search for remaining {$deficit} leads...",
            'total' => $totalResults,
            'target' => $limit,
            'progress' => min(98, round(($totalResults / max(1, $limit)) * 100)),
        ]);

        // Fewer query shards + deeper pagination is faster and more reliable on many hosts.
        $maxOrgPages = $limit >= 5000 ? 22 : ($limit >= 2000 ? 16 : ($limit >= 1000 ? 11 : ($limit >= 500 ? 6 : 4)));
        $maxOrgVariants = $limit >= 5000 ? 14 : ($limit >= 2000 ? 9 : ($limit >= 1000 ? 6 : ($limit >= 500 ? 4 : 3)));
        $maxOrgLocations = $limit >= 5000 ? 14 : ($limit >= 2000 ? 10 : ($limit >= 1000 ? 6 : ($limit >= 500 ? 4 : 3)));
        if ($filtersActive) {
            $maxOrgPages = (int)ceil($maxOrgPages * 1.7);
            $maxOrgVariants = (int)ceil($maxOrgVariants * 2.0);
            $maxOrgLocations = (int)ceil($maxOrgLocations * 1.8);
        }
        $maxOrgPages = min($maxOrgPages, $limit >= 5000 ? 28 : 22);
        $maxOrgVariants = min($maxOrgVariants, $filtersActive ? ($limit >= 5000 ? 28 : 22) : ($limit >= 5000 ? 20 : 16));
        $maxOrgLocations = min($maxOrgLocations, $filtersActive ? ($limit >= 5000 ? 22 : 18) : ($limit >= 5000 ? 16 : 12));

        $organicVariants = array_slice($serviceVariants, 0, min($maxOrgVariants, count($serviceVariants)));
        $organicLocationSeed = array_values(array_unique(array_merge($searchedLocations, $locationsToSearch)));
        $organicLocations = array_slice($organicLocationSeed, 0, min($maxOrgLocations, count($organicLocationSeed)));
        if (empty($organicLocations)) {
            $organicLocations = [$location];
        }

        // Build unique organic queries
        $organicQueryMap = [];
        foreach ($organicLocations as $orgLoc) {
            foreach ($organicVariants as $orgVariant) {
                $q = preg_replace('/\s+/', ' ', trim("$orgVariant in $orgLoc"));
                $k = strtolower($q);
                if (!isset($organicQueryMap[$k])) {
                    $organicQueryMap[$k] = ['query' => $q, 'location' => $orgLoc];
                }
            }
        }
        $organicQueryList = array_values($organicQueryMap);

        $batchSize = 6; // Reduced for shared hosting (Hostinger) resilience
        if ($limit >= 1000) $batchSize = 8;
        if ($limit >= 2000) $batchSize = 10;
        if ($filtersActive) $batchSize = min(12, $batchSize + 2);
        $queryBatches = array_chunk($organicQueryList, $batchSize);

        for ($orgPage = 1; $orgPage <= $maxOrgPages; $orgPage++) {
            if ($totalResults >= $limit) break;

            sendSSE('status', [
                'message' => "Deep organic search — page {$orgPage}/{$maxOrgPages} ({$totalResults}/{$limit})",
                'engine' => 'Serper Organic',
                'progress' => min(98, round(($totalResults / max(1, $limit)) * 100)),
            ]);

            foreach ($queryBatches as $batch) {
                if ($totalResults >= $limit) break 2;

                $queryStrings = array_values(array_map(function ($q) { return $q['query']; }, $batch));
                $batchResults = fetchSerperOrganicBatch($queryStrings, $batchSize, $orgPage);

                foreach ($batchResults as $batchIdx => $organicResults) {
                    if ($totalResults >= $limit) break;
                    if (empty($organicResults)) continue;

                    $orgLoc = $batch[$batchIdx]['location'] ?? '';

                    $orgBatch = [];
                    foreach ($organicResults as $item) {
                        if ($totalResults >= $limit) break;

                        $business = [
                            'id' => generateId('srpo_'),
                            'name' => $item['title'] ?? '',
                            'url' => $item['link'] ?? '',
                            'snippet' => $item['snippet'] ?? '',
                            'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?? '',
                            'address' => '',
                            'phone' => extractPhoneFromText($item['snippet'] ?? ''),
                            'email' => extractEmailFromText($item['snippet'] ?? ''),
                            'rating' => null,
                            'reviews' => null,
                            'source' => 'Serper Organic',
                            'sources' => ['Serper Organic']
                        ];

                        if (empty($business['name'])) continue;
                        $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
                        if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;

                        $dedupeKey = buildBusinessDedupeKey($business, $orgLoc);
                        if (isset($seenBusinesses[$dedupeKey])) continue;

                        $seenBusinesses[$dedupeKey] = count($allResults);
                        $allResults[] = $business;
                        $totalResults++;
                        $orgBatch[] = $business;

                        if ($enableEnrichment && !empty($business['url'])) {
                            queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
                        }

                        // Batch SSE: send every 25 leads at once
                        if (count($orgBatch) >= 25) {
                            $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                            sendSSE('results', [
                                'leads' => $orgBatch,
                                'total' => $totalResults,
                                'progress' => $progress,
                                'source' => 'Serper Organic'
                            ]);
                            $orgBatch = [];
                        }
                    }
                    // Flush remaining
                    if (!empty($orgBatch)) {
                        $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                        sendSSE('results', [
                            'leads' => $orgBatch,
                            'total' => $totalResults,
                            'progress' => $progress,
                            'source' => 'Serper Organic'
                        ]);
                    }
                }

                $emitEnrichment();
            }
        }
    }

    // ---- QUATERNARY: Directory-focused pass (Yelp, BBB, YellowPages, etc.) ----
    if ($totalResults < $limit && !empty($directoryQueries)) {
        $deficit = $limit - $totalResults;
        sendSSE('coverage', [
            'message' => "Searching " . count($directoryQueries) . " business directories for remaining {$deficit} leads...",
            'total' => $totalResults,
            'target' => $limit,
            'progress' => min(98, round(($totalResults / max(1, $limit)) * 100)),
        ]);

        $dirLocationSeed = array_values(array_unique(array_merge($searchedLocations, [$location])));
        $dirLocations = array_slice($dirLocationSeed, 0, min($filtersActive ? 15 : 10, count($dirLocationSeed)));
        $dirPages = $limit >= 2000 ? 3 : (($filtersActive || $limit >= 1000) ? 2 : 1);
        foreach ($directoryQueries as $dirSite) {
            if ($totalResults >= $limit) break;
            foreach ($dirLocations as $dirLoc) {
                if ($totalResults >= $limit) break;

                for ($dirPage = 1; $dirPage <= $dirPages; $dirPage++) {
                if ($totalResults >= $limit) break;
                $dirQuery = "$service $dirLoc $dirSite";
                $organicResults = fetchSerperOrganicPage($dirQuery, $dirPage, 100);
                if (empty($organicResults)) continue;

                $dirBatch = [];
                foreach ($organicResults as $item) {
                    if ($totalResults >= $limit) break;

                    $business = [
                        'id' => generateId('sdir_'),
                        'name' => $item['title'] ?? '',
                        'url' => $item['link'] ?? '',
                        'snippet' => $item['snippet'] ?? '',
                        'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?? '',
                        'address' => '',
                        'phone' => extractPhoneFromText($item['snippet'] ?? ''),
                        'email' => extractEmailFromText($item['snippet'] ?? ''),
                        'rating' => null,
                        'reviews' => null,
                        'source' => 'Directory',
                        'sources' => ['Directory']
                    ];

                    if (empty($business['name'])) continue;
                    $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
                    if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;

                    $dedupeKey = buildBusinessDedupeKey($business, $dirLoc);
                    if (isset($seenBusinesses[$dedupeKey])) continue;

                    $seenBusinesses[$dedupeKey] = count($allResults);
                    $allResults[] = $business;
                    $totalResults++;
                    $dirBatch[] = $business;

                    if ($enableEnrichment && !empty($business['url'])) {
                        queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
                    }

                    if (count($dirBatch) >= 25) {
                        $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                        sendSSE('results', [
                            'leads' => $dirBatch,
                            'total' => $totalResults,
                            'progress' => $progress,
                            'source' => 'Directory'
                        ]);
                        $dirBatch = [];
                    }
                }
                if (!empty($dirBatch)) {
                    $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                    sendSSE('results', [
                        'leads' => $dirBatch,
                        'total' => $totalResults,
                        'progress' => $progress,
                        'source' => 'Directory'
                    ]);
                }

                $emitEnrichment();
                }
            }
        }
    }

    // Enrichment flush removed — enrichment is permanently disabled.
    }

    sendSSE('complete', [
        'total' => $totalResults,
        'requested' => $limit,
        'targetCount' => $targetCount,
        'coverage' => round(($totalResults / max(1, $limit)) * 100, 2),
        'sources' => ['Serper Places', 'Serper Organic', 'Serper Maps'],
        'query' => [
            'service' => $service,
            'location' => $location,
            'limit' => $limit
        ],
        'searchedLocations' => $searchedLocations,
        'enrichmentSessionId' => $enrichmentSessionId,
        'enrichmentEnabled' => $enableEnrichment
    ]);
    return;
}
/**
 * Build supplemental search query variants for top-up passes.
 */
function buildSearchQueryVariants($service, $searchedLocations, $limit = 100, $filtersActive = false) {
    $service = trim((string)$service);
    if ($service === '') {
        return [];
    }

    $serviceVariants = expandServiceSynonyms($service);
    if (empty($serviceVariants)) {
        $serviceVariants = [$service];
    }

    $locations = [];
    if (is_array($searchedLocations)) {
        foreach ($searchedLocations as $loc) {
            $loc = preg_replace('/\s+/', ' ', trim((string)$loc));
            if ($loc !== '' && !in_array($loc, $locations, true)) {
                $locations[] = $loc;
            }
        }
    }
    $maxLocations = 4;
    if ($limit >= 500) {
        $maxLocations = 6;
    }
    if ($limit >= 1000) {
        $maxLocations = 8;
    }
    if ($limit >= 2000) {
        $maxLocations = 12;
    }
    if ($filtersActive) {
        $maxLocations = (int)ceil($maxLocations * 1.25);
    }
    $locations = array_slice($locations, 0, $maxLocations);
    if (empty($locations)) {
        return [];
    }

    $templates = [
        'best %s in %s',
        'top %s in %s',
        '%s near %s',
        '%s in %s',
        'local %s in %s',
        '%s companies in %s',
        '%s businesses in %s',
        '%s providers in %s',
        '%s services in %s',
        'affordable %s in %s',
        'professional %s in %s',
        '%s contractors in %s',
        'licensed %s in %s',
        'trusted %s in %s',
        '%s specialists in %s',
        'emergency %s in %s',
        '%s reviews %s',
        'top rated %s in %s',
        '%s near me %s',
    ];

    $variants = [];
    foreach ($locations as $loc) {
        foreach ($serviceVariants as $serviceVariant) {
            foreach ($templates as $template) {
                $query = sprintf($template, $serviceVariant, $loc);
                $query = preg_replace('/\s+/', ' ', trim($query));
                if ($query === '') {
                    continue;
                }
                $key = strtolower($query);
                if (!isset($variants[$key])) {
                    $variants[$key] = [
                        'query' => $query,
                        'location' => $loc,
                    ];
                }
            }
        }
    }

    $maxVariants = defined('SEARCH_QUERY_VARIANT_MAX') ? max(1, (int)SEARCH_QUERY_VARIANT_MAX) : 24;
    if ($limit >= 250) {
        $maxVariants = max($maxVariants, 40);
    }
    if ($limit >= 500) {
        $maxVariants = max($maxVariants, 60);
    }
    if ($limit >= 1000) {
        $maxVariants = max($maxVariants, 90);
    }
    if ($limit >= 2000) {
        $maxVariants = max($maxVariants, 200);
    }
    if ($limit >= 5000) {
        $maxVariants = max($maxVariants, 400);
    }
    if ($filtersActive) {
        $maxVariants = (int)ceil($maxVariants * 1.6);
    }
    return array_slice(array_values($variants), 0, $maxVariants);
}

/**
 * Fetch a single page of Serper organic search results with pagination.
 * Returns array of organic results or empty array on failure.
 */
function fetchSerperOrganicPage($query, $page = 1, $num = 100) {
    if (!defined('SERPER_API_KEY') || empty(SERPER_API_KEY)) {
        return [];
    }

    $payload = [
        'q' => $query,
        'gl' => 'us',
        'hl' => 'en',
        'num' => min(100, max(10, $num)),
    ];
    if ($page > 1) {
        $payload['page'] = (int)$page;
    }

    $response = curlRequest('https://google.serper.dev/search', [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'X-API-KEY: ' . SERPER_API_KEY,
            'Content-Type: application/json'
        ],
         CURLOPT_TIMEOUT => 15,
         CURLOPT_CONNECTTIMEOUT => 5,
    ]);

    if (($response['httpCode'] ?? 0) !== 200) {
        return [];
    }

    $data = json_decode($response['response'] ?? '', true);
    return $data['organic'] ?? [];
}

function isSerpApiCreditsError($message) {
    $msg = strtolower($message);
    $needles = [
        'run out of searches',
        'no searches left',
        'no more searches',
        'insufficient credits',
        'exceeded your plan',
        'exceeded plan',
        'payment required',
        'quota'
    ];
    foreach ($needles as $needle) {
        if (strpos($msg, $needle) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Search a single SerpAPI engine
 * Supports up to 50000 total leads by increasing page limits per engine
 */
function searchSingleEngine($apiKey, $engine, $query, $resultsKey, $limit, $sourceName, $onPageResults = null, $onPageTick = null) {
    $results = [];
    
    // Engine-specific page sizes
    $resultsPerPage = 20;
    if ($engine === 'yelp') {
        $resultsPerPage = 10;
    } elseif ($engine === 'bing_maps') {
        $resultsPerPage = 30;
    }
    
    // Calculate max pages needed - scale based on requested limit
    // For 50000 leads split across 3 engines = ~16667 per engine
    // Google Maps: 16667/20 = 834 pages, Yelp: 16667/10 = 1667 pages, Bing: 16667/20 = 834 pages
    $maxPages = ceil($limit / $resultsPerPage);
    
    // Dynamic page cap based on limit requested - scaled for massive searches.
    // We intentionally keep high-volume searches wider (more query shards) and
    // shallower (fewer pages per shard) for better speed and uniqueness.
    if ($limit <= 100) {
        $pageCap = 20; // Doubled from 10
    } elseif ($limit <= 500) {
        $pageCap = 60; // Doubled from 30
    } elseif ($limit <= 2000) {
        $pageCap = 150; // Increased from 100
    } elseif ($limit <= 10000) {
        $pageCap = 600; // Increased from 500
    } else {
        $pageCap = 2500; // Increased from 2000
    }
    if ($limit >= 1000) {
        if ($engine === 'google_maps') {
            $pageCap = min($pageCap, 12);
        } elseif ($engine === 'yelp') {
            $pageCap = min($pageCap, 15);
        } elseif ($engine === 'bing_maps') {
            $pageCap = min($pageCap, 20);
        }
    }
    $maxPages = min($maxPages, $pageCap);
    
    $emptyPageStreak = 0; // Track consecutive empty pages to exit early
    
    // Zero throttle for all high-volume searches — maximum speed
    $throttleUs = defined('SERPAPI_THROTTLE_US') ? max(0, (int)SERPAPI_THROTTLE_US) : 30000;
    if ($limit >= 500) {
        $throttleUs = 0; // No delay at all for 500+ lead searches
    }
    
    $connectTimeout = defined('SERPAPI_CONNECT_TIMEOUT_SEC') ? max(5, (int)SERPAPI_CONNECT_TIMEOUT_SEC) : 15;
    $requestTimeout = defined('SERPAPI_TIMEOUT_SEC')
        ? max(10, (int)SERPAPI_TIMEOUT_SEC)
        : ($limit >= 2000 ? 60 : ($limit >= 500 ? 45 : 35));
    $requestRetries = defined('SERPAPI_REQUEST_RETRIES') ? max(0, (int)SERPAPI_REQUEST_RETRIES) : 2;

    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) {
            break;
        }
        
        // Exit if we've had 3 consecutive empty pages (API exhausted)
        if ($emptyPageStreak >= 3) {
            break;
        }
        
        $params = [
            'engine' => $engine,
            'q' => $query,
            'api_key' => $apiKey,
        ];
        
        // Engine-specific parameters
        if ($engine === 'google_maps') {
            $params['type'] = 'search';
            $params['hl'] = 'en';
            if ($page > 0) {
                $params['start'] = $page * $resultsPerPage;
            }
        } elseif ($engine === 'yelp') {
            $params['find_desc'] = explode(' in ', $query)[0];
            $params['find_loc'] = explode(' in ', $query)[1] ?? $query;
            if ($page > 0) {
                $params['start'] = $page * $resultsPerPage;
            }
        } elseif ($engine === 'bing_maps') {
            $params['count'] = min(30, $resultsPerPage);
            if ($page > 0) {
                $params['first'] = $page * $resultsPerPage;
            }
        }
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = null;
        $lastRequestError = '';
        for ($attempt = 0; $attempt <= $requestRetries; $attempt++) {
            $response = curlRequest($url, [
                CURLOPT_CONNECTTIMEOUT => $connectTimeout,
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ], $requestTimeout);
            $httpCode = (int)($response['httpCode'] ?? 0);
            $curlError = (string)($response['error'] ?? '');
            $lastRequestError = $curlError;

            if ($httpCode === 200) {
                break;
            }

            $retryableStatus = in_array($httpCode, [408, 429, 500, 502, 503, 504], true);
            $retryable = $retryableStatus || isTransientNetworkErrorMessage($curlError) || $httpCode === 0;
            if (!$retryable || $attempt >= $requestRetries) {
                break;
            }

            usleep((int)(100000 * ($attempt + 1))); // 100ms, 200ms, 300ms (was 250/500/750)
        }
        
        if ($response['httpCode'] !== 200) {
            $errorMessage = "SerpAPI error (HTTP {$response['httpCode']})";
            if (!empty($response['error'])) {
                $errorMessage .= " - cURL: {$response['error']}";
            }
            $decoded = json_decode($response['response'] ?? '', true);
            if (is_array($decoded)) {
                $apiError = $decoded['error'] ?? ($decoded['search_metadata']['status'] ?? null);
                if (!empty($apiError)) {
                    $errorMessage = "SerpAPI error: {$apiError}";
                }
            }
            throw new Exception($errorMessage);
        }
        
        $data = json_decode($response['response'], true);
        if (is_array($data)) {
            $apiError = $data['error'] ?? null;
            $status = $data['search_metadata']['status'] ?? null;
            if (!empty($apiError)) {
                if ($engine === 'yelp' && stripos($apiError, "yelp hasn't returned any results") !== false) {
                    return [];
                }
                if ($engine === 'google_maps' && stripos($apiError, "google hasn't returned any results") !== false) {
                    return [];
                }
                throw new Exception("SerpAPI error: {$apiError}");
            }
            if (!empty($status) && strtolower($status) === 'error') {
                $errorMessage = $data['search_metadata']['error'] ?? $status;
                if ($engine === 'yelp' && stripos($errorMessage, "yelp hasn't returned any results") !== false) {
                    return [];
                }
                if ($engine === 'google_maps' && stripos($errorMessage, "google hasn't returned any results") !== false) {
                    return [];
                }
                throw new Exception("SerpAPI error: {$errorMessage}");
            }
        }
        $items = $data[$resultsKey] ?? [];
        
        if (empty($items)) {
            $emptyPageStreak++;
            continue;
        }
        
        $emptyPageStreak = 0; // Reset on successful results
        
        $pageResults = [];
        foreach ($items as $item) {
            if (count($results) >= $limit) {
                break;
            }
            
            $business = normalizeBusinessResult($item, $engine, $sourceName);
            if ($business) {
                $results[] = $business;
                $pageResults[] = $business;
            }
        }
        
        if (!empty($pageResults) && is_callable($onPageResults)) {
            $continue = $onPageResults($pageResults);
            if ($continue === false) {
                break;
            }
        }
        
        // Check for pagination - but don't break, just note it
        $hasPagination = isset($data['serpapi_pagination']['next']) || 
                         isset($data['serpapi_pagination']['next_page_token']);
        
        // For large searches, continue even without explicit pagination (try next offset)
        if (!$hasPagination && $limit <= 100) {
            break;
        }
        
        if (is_callable($onPageTick)) {
            $onPageTick($page + 1, count($results));
        }

        if ($throttleUs > 0) {
            usleep($throttleUs);
        }
    }
    
    return $results;
}

/**
 * Normalize business result from different engines to common format
 */
function normalizeBusinessResult($item, $engine, $sourceName) {
    $websiteUrl = '';
    $name = '';
    $address = '';
    $phone = '';
    $rating = null;
    $reviews = null;
    $snippet = '';
    
    if ($engine === 'google_maps') {
        $name = $item['title'] ?? '';
        $websiteUrl = $item['website'] ?? '';
        $address = $item['address'] ?? '';
        $phone = $item['phone'] ?? '';
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? null;
        $snippet = $item['description'] ?? ($item['type'] ?? '');
    } elseif ($engine === 'yelp') {
        $name = $item['title'] ?? ($item['name'] ?? '');
        $websiteUrl = $item['link'] ?? '';
        $address = $item['address'] ?? ($item['neighborhood'] ?? '');
        $phone = $item['phone'] ?? '';
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? null;
        $snippet = $item['snippet'] ?? ($item['categories'] ?? '');
        if (is_array($snippet)) {
            $snippet = implode(', ', array_map(function ($value) {
                if (is_scalar($value)) {
                    return (string)$value;
                }
                if (is_array($value)) {
                    $label = $value['title'] ?? $value['name'] ?? null;
                    if (is_string($label) && $label !== '') {
                        return $label;
                    }
                }
                return json_encode($value);
            }, $snippet));
        }
    } elseif ($engine === 'bing_maps') {
        $name = $item['title'] ?? '';
        $websiteUrl = $item['link'] ?? ($item['website'] ?? '');
        $address = $item['address'] ?? '';
        $phone = $item['phone'] ?? '';
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? null;
        $snippet = $item['description'] ?? '';
    }
    
    if (empty($name)) {
        return null;
    }
    
    // Extract email from snippet if available
    $email = extractEmailFromText($snippet);
    
    // Also try to extract phone from snippet if not found directly
    if (empty($phone) && !empty($snippet)) {
        $phone = extractPhoneFromText($snippet);
    }

    // ⚡ SPEED: Inline email extraction REMOVED — all email discovery now deferred
    // to BamLead Scraper (post-discovery enrichment) for maximum stream speed.
    
    return [
        'id' => generateId(strtolower(substr($engine, 0, 3)) . '_'),
        'name' => $name,
        'url' => $websiteUrl,
        'snippet' => $snippet,
        'displayLink' => parse_url($websiteUrl, PHP_URL_HOST) ?? '',
        'address' => $address,
        'phone' => $phone,
        'email' => $email,
        'rating' => $rating,
        'reviews' => $reviews,
        'source' => $sourceName,
        'websiteAnalysis' => quickWebsiteCheck($websiteUrl)
    ];
}

/**
 * Extract email from text
 */
function extractEmailFromText($text) {
    if (empty($text)) return null;
    if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
        $email = strtolower($matches[0]);
        // Filter out common non-business emails
        $excludePatterns = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.', 'noreply', 'no-reply', 'wixpress', 'sentry.io'];
        foreach ($excludePatterns as $pattern) {
            if (strpos($email, $pattern) !== false) {
                return null;
            }
        }
        return $email;
    }
    return null;
}

/**
 * Fast inline email extraction from a website URL.
 * Uses cache first, then does a quick homepage + /contact scrape (2-3s max).
 * This runs during the search stream so leads arrive WITH emails.
 */
function inlineExtractEmail($url) {
    if (empty($url)) return null;

    // Normalize URL
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    // Check cache first (instant)
    $cacheKey = "scrape_contacts_v2_" . md5($url);
    $cached = getCache($cacheKey);
    if ($cached !== null && !empty($cached['emails'])) {
        return $cached['emails'][0] ?? null;
    }
    $fcCacheKey = "firecrawl_" . md5($url . 'gmb');
    $fcCached = getCache($fcCacheKey);
    if ($fcCached !== null && !empty($fcCached['emails'])) {
        return $fcCached['emails'][0] ?? null;
    }
    
    try {
        $parsed = parse_url($url);
        if (!$parsed || empty($parsed['host'])) return null;
        
        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'];
        $baseUrl = "{$scheme}://{$host}";
        $domain = preg_replace('/^www\./', '', $host);
        
        // Skip platform/directory URLs — they won't have the business's own email
        $platformHosts = ['facebook.com','yelp.com','yellowpages.com','bbb.org','linkedin.com',
            'instagram.com','twitter.com','x.com','tiktok.com','nextdoor.com','angi.com',
            'thumbtack.com','homeadvisor.com','manta.com','mapquest.com','google.com'];
        foreach ($platformHosts as $ph) {
            if (stripos($host, $ph) !== false) return null;
        }
        
        // ⚡ PHASE 1: Parallel fetch homepage + contact paths + Serper email hunt
        // ALL requests fire simultaneously — Serper adds ZERO extra wait time
        $mh = curl_multi_init();
        curl_multi_setopt($mh, CURLMOPT_PIPELINING, CURLPIPE_MULTIPLEX);
        $handles = [];
        $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
        
        $pagesToFetch = [
            'homepage' => $baseUrl,
            'contact' => $baseUrl . '/contact',
            'contact-us' => $baseUrl . '/contact-us',
            'contactus' => $baseUrl . '/contactus',
            'about' => $baseUrl . '/about',
            'about-us' => $baseUrl . '/about-us',
            'get-in-touch' => $baseUrl . '/get-in-touch',
            'team' => $baseUrl . '/team',
            'our-team' => $baseUrl . '/our-team',
            'staff' => $baseUrl . '/staff',
        ];
        
        foreach ($pagesToFetch as $key => $pageUrl) {
            $ch = curl_init($pageUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 4,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_USERAGENT => $ua,
                CURLOPT_ENCODING => 'gzip, deflate',
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
            ]);
            curl_multi_add_handle($mh, $ch);
            $handles[$key] = $ch;
        }
        
        // 🔍 SERPER EMAIL HUNT: Runs IN PARALLEL with page fetches (no extra wait)
        $serperKey = defined('SERPER_API_KEY') ? SERPER_API_KEY : '';
        if (!empty($serperKey)) {
            $emailQuery = '"@' . $domain . '" email OR contact';
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://google.serper.dev/search',
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode(['q' => $emailQuery, 'num' => 5]),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . $serperKey,
                    'Content-Type: application/json'
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 4,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
            ]);
            curl_multi_add_handle($mh, $ch);
            $handles['serper_email'] = $ch;
        }
        
        // Execute ALL in parallel (pages + Serper at the same time)
        $running = null;
        do {
            curl_multi_exec($mh, $running);
            if ($running > 0) curl_multi_select($mh, 0.05);
        } while ($running > 0);
        
        // Collect emails from all sources
        $allEmails = [];
        foreach ($handles as $key => $ch) {
            $response = curl_multi_getcontent($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
            
            if ($key === 'serper_email') {
                // Parse Serper organic results for emails
                if ($httpCode === 200 && !empty($response)) {
                    $serperData = @json_decode($response, true);
                    if (!empty($serperData['organic'])) {
                        foreach ($serperData['organic'] as $result) {
                            $searchText = ($result['title'] ?? '') . ' ' . ($result['snippet'] ?? '') . ' ' . ($result['link'] ?? '');
                            $foundEmails = extractEmails($searchText);
                            $allEmails = array_merge($allEmails, $foundEmails);
                        }
                    }
                    // Also check knowledgeGraph and answerBox
                    if (!empty($serperData['knowledgeGraph'])) {
                        $kgText = json_encode($serperData['knowledgeGraph']);
                        $kgEmails = extractEmails($kgText);
                        $allEmails = array_merge($allEmails, $kgEmails);
                    }
                    if (!empty($serperData['answerBox'])) {
                        $abText = json_encode($serperData['answerBox']);
                        $abEmails = extractEmails($abText);
                        $allEmails = array_merge($allEmails, $abEmails);
                    }
                }
                continue;
            }
            
            if ($httpCode === 200 && !empty($response)) {
                // Standard extraction
                $pageEmails = extractEmails($response);
                $allEmails = array_merge($allEmails, $pageEmails);
                
                // 🧠 DEEP: Extract emails from JavaScript data blobs
                $jsEmails = extractEmailsFromJSBlobs($response, $domain);
                $allEmails = array_merge($allEmails, $jsEmails);
                
                // Extract obfuscated emails
                if (function_exists('bamleadExtractObfuscatedEmails')) {
                    $obfuscated = bamleadExtractObfuscatedEmails($response);
                    if (!empty($obfuscated)) {
                        $allEmails = array_merge($allEmails, $obfuscated);
                    }
                }
            }
        }
        curl_multi_close($mh);
        
        // Dedupe and filter
        $allEmails = filterBusinessEmails($allEmails, $domain);
        
        if (!empty($allEmails)) {
            setCache($cacheKey, ['emails' => $allEmails, 'phones' => [], 'hasWebsite' => true], 86400);
            return $allEmails[0];
        }
        
        // 🧠 PHASE 2: Role-based email prediction with MX validation
        $roleEmails = inlinePredictRoleEmails($domain);
        if (!empty($roleEmails)) {
            setCache($cacheKey, ['emails' => $roleEmails, 'phones' => [], 'hasWebsite' => true, 'predicted' => true], 86400);
            return $roleEmails[0];
        }
        
        // Negative cache (5 min) so we don't re-scrape misses too fast
        setCache($cacheKey, ['emails' => [], 'phones' => [], 'hasWebsite' => true], 300);
        
    } catch (Exception $e) {
        // Silently fail
    }
    
    return null;
}

/**
 * 🧠 Extract emails hidden inside JavaScript data blobs, JSON-LD, and inline scripts
 * Catches Wix, Squarespace, WordPress, and other JS-rendered contact data
 */
function extractEmailsFromJSBlobs($html, $domain = '') {
    $emails = [];
    
    // 1. Extract all <script> tag contents and search for email patterns
    if (preg_match_all('/<script[^>]*>(.*?)<\/script>/si', $html, $scriptMatches)) {
        foreach ($scriptMatches[1] as $script) {
            if (empty($script) || strlen($script) < 10) continue;
            
            // Look for email patterns in JSON strings: "email":"foo@bar.com"
            if (preg_match_all('/"(?:email|mail|e-mail|contact_email|emailAddress|contactEmail|business_email|owner_email|reply_to|replyTo)":\s*"([^"]+@[^"]+\.[a-z]{2,})"/i', $script, $jsonEmails)) {
                $emails = array_merge($emails, $jsonEmails[1]);
            }
            
            // Generic email pattern in script blocks
            if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $script, $rawEmails)) {
                // Only keep emails matching the business domain or common providers
                foreach ($rawEmails[0] as $e) {
                    $eLower = strtolower($e);
                    // Keep if it matches business domain
                    if (!empty($domain) && strpos($eLower, '@' . $domain) !== false) {
                        $emails[] = $e;
                    }
                    // Keep if it's a common business email provider
                    if (preg_match('/@(gmail|yahoo|hotmail|outlook|aol|icloud|protonmail|zoho|yandex|mail)\./i', $e)) {
                        $emails[] = $e;
                    }
                }
            }
            
            // Wix-specific: decode base64 or unicode-escaped emails
            if (preg_match_all('/\\\\u([0-9a-fA-F]{4})/', $script, $unicodeMatches, PREG_SET_ORDER)) {
                $decoded = $script;
                foreach ($unicodeMatches as $um) {
                    $decoded = str_replace($um[0], mb_chr(hexdec($um[1]), 'UTF-8'), $decoded);
                }
                if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $decoded, $decodedEmails)) {
                    $emails = array_merge($emails, $decodedEmails[0]);
                }
            }
        }
    }
    
    // 2. JSON-LD structured data (often has email even when page doesn't show it visually)
    if (preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/si', $html, $ldMatches)) {
        foreach ($ldMatches[1] as $ld) {
            $data = @json_decode($ld, true);
            if (!$data) continue;
            $ldEmails = extractEmailsFromArray($data);
            $emails = array_merge($emails, $ldEmails);
        }
    }
    
    // 3. HTML data attributes (data-email, data-contact, etc.)
    if (preg_match_all('/data-(?:email|contact|mail|address)=["\']([^"\']+@[^"\']+\.[a-z]{2,})/i', $html, $dataAttrEmails)) {
        $emails = array_merge($emails, $dataAttrEmails[1]);
    }
    
    // 4. href="mailto:" that might be URL-encoded or inside onclick handlers
    if (preg_match_all('/(?:href|onclick|action)=["\'][^"\']*mailto:([^"\'&\s?]+)/i', $html, $mailtoDeep)) {
        foreach ($mailtoDeep[1] as $m) {
            $decoded = urldecode($m);
            if (filter_var($decoded, FILTER_VALIDATE_EMAIL)) {
                $emails[] = $decoded;
            }
        }
    }
    
    // 5. aria-label or title attributes with emails
    if (preg_match_all('/(?:aria-label|title|alt)=["\'][^"\']*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i', $html, $ariaEmails)) {
        $emails = array_merge($emails, $ariaEmails[1]);
    }
    
    return $emails;
}

/**
 * Recursively extract emails from a nested array (for JSON-LD parsing)
 */
function extractEmailsFromArray($data) {
    $emails = [];
    if (!is_array($data)) return $emails;
    
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $keyLower = is_string($key) ? strtolower($key) : '';
            if (in_array($keyLower, ['email', 'mail', 'contactemail', 'e-mail', 'emailaddress', 'contactpoint'])) {
                $clean = str_replace('mailto:', '', $value);
                if (filter_var($clean, FILTER_VALIDATE_EMAIL)) {
                    $emails[] = $clean;
                }
            }
            // Also catch any email-like value
            if (preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $value)) {
                $emails[] = $value;
            }
        } elseif (is_array($value)) {
            $emails = array_merge($emails, extractEmailsFromArray($value));
        }
    }
    return $emails;
}

/**
 * Filter and dedupe business emails, removing junk
 */
function filterBusinessEmails($emails, $domain = '') {
    $emails = array_values(array_unique(array_filter($emails)));
    
    $junkPatterns = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.woff', '.ttf',
        'example.com', 'test.com', 'domain.com', 'sentry.io', 'wordpress.org', 'wixpress.com',
        'schema.org', 'w3.org', 'gravatar.com', 'wp.com', 'googleapis.com', 'gstatic.com',
        'cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'cdnjs.com', 'placeholder',
        'noreply', 'no-reply', 'mailer-daemon', 'postmaster@', 'localhost',
        'webpack', 'jquery', 'bootstrap', 'tailwind', 'fontawesome', 'yoursite', 'yourdomain',
        'changeme', 'user@', 'admin@wordpress', 'email@email'];
    
    $filtered = [];
    foreach ($emails as $email) {
        $emailLower = strtolower(trim($email));
        if (strlen($emailLower) > 100 || strlen($emailLower) < 5) continue;
        if (!filter_var($emailLower, FILTER_VALIDATE_EMAIL)) continue;
        
        $isJunk = false;
        foreach ($junkPatterns as $pattern) {
            if (strpos($emailLower, $pattern) !== false) {
                $isJunk = true;
                break;
            }
        }
        if (!$isJunk) {
            $filtered[] = $emailLower;
        }
    }
    
    // Prioritize: domain-matching emails first, then common providers
    if (!empty($domain)) {
        usort($filtered, function($a, $b) use ($domain) {
            $aMatch = strpos($a, '@' . $domain) !== false ? 0 : 1;
            $bMatch = strpos($b, '@' . $domain) !== false ? 0 : 1;
            return $aMatch - $bMatch;
        });
    }
    
    return array_values(array_unique($filtered));
}

/**
 * 🧠 Role-based email prediction with MX validation
 */
function inlinePredictRoleEmails($domain) {
    if (empty($domain)) return [];
    
    $skipDomains = ['facebook.com', 'google.com', 'yelp.com', 'yellowpages.com', 'bbb.org',
        'linkedin.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
        'wix.com', 'squarespace.com', 'godaddy.com', 'wordpress.com', 'weebly.com',
        'shopify.com', 'etsy.com', 'amazon.com', 'nextdoor.com', 'angi.com',
        'thumbtack.com', 'homeadvisor.com', 'manta.com', 'mapquest.com'];
    if (in_array(strtolower($domain), $skipDomains)) return [];
    
    // Check if domain has MX records (validates it can receive email)
    $mxHosts = [];
    $hasMX = @getmxrr($domain, $mxHosts);
    
    if (!$hasMX || empty($mxHosts)) {
        $aRecords = @dns_get_record($domain, DNS_A);
        if (empty($aRecords)) return [];
    }
    
    // Generate common role-based emails
    $roles = ['info', 'contact', 'hello', 'sales', 'admin', 'office', 'support', 'help'];
    $predictedEmails = [];
    foreach ($roles as $role) {
        $predictedEmails[] = $role . '@' . $domain;
    }
    
    return array_slice($predictedEmails, 0, 3);
}

/**
 * Extract phone from text
 */
function extractPhoneFromText($text) {
    if (empty($text)) return null;
    if (preg_match('/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $text, $matches)) {
        return $matches[0];
    }
    return null;
}

/**
 * Quick website check - URL + snippet/title hints
 */
function quickWebsiteCheck($url, $hintText = '') {
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
    $hintLower = strtolower((string)$hintText);
    $combinedSignals = trim($hostLower . ' ' . $hintLower);
    
    $platform = null;
    $needsUpgrade = false;
    $issues = [];
    
    $hasWordPressSignal = strpos($hostLower, 'wordpress') !== false ||
        strpos($hintLower, 'powered by wordpress') !== false ||
        strpos($hintLower, 'wp-content') !== false ||
        strpos($hintLower, 'wp-json') !== false ||
        strpos($hintLower, 'wordpress.com') !== false;

    if (strpos($combinedSignals, 'wix') !== false || strpos($combinedSignals, 'wixsite') !== false) {
        $platform = 'wix';
        $needsUpgrade = true;
        $issues[] = 'Using Wix template';
    } elseif (strpos($combinedSignals, 'squarespace') !== false) {
        $platform = 'squarespace';
        $needsUpgrade = true;
        $issues[] = 'Using Squarespace template';
    } elseif (strpos($combinedSignals, 'weebly') !== false) {
        $platform = 'weebly';
        $needsUpgrade = true;
        $issues[] = 'Using Weebly template';
    } elseif (strpos($combinedSignals, 'godaddy') !== false || strpos($combinedSignals, 'godaddysites') !== false) {
        $platform = 'godaddy';
        $needsUpgrade = true;
        $issues[] = 'Using GoDaddy builder';
    } elseif (strpos($combinedSignals, 'wordpress.com') !== false) {
        $platform = 'wordpress.com';
        $needsUpgrade = true;
        $issues[] = 'Using free WordPress.com';
    } elseif ($hasWordPressSignal) {
        $platform = 'wordpress';
    } elseif (strpos($combinedSignals, 'shopify') !== false) {
        $platform = 'shopify';
    } elseif (strpos($combinedSignals, 'webflow') !== false) {
        $platform = 'webflow';
    } elseif (strpos($combinedSignals, 'jimdo') !== false) {
        $platform = 'jimdo';
        $needsUpgrade = true;
        $issues[] = 'Using Jimdo builder';
    } elseif (strpos($combinedSignals, 'joomla') !== false) {
        $platform = 'joomla';
        $needsUpgrade = true;
        $issues[] = 'Using Joomla CMS';
    } elseif (strpos($combinedSignals, 'drupal') !== false) {
        $platform = 'drupal';
        $needsUpgrade = true;
        $issues[] = 'Using Drupal CMS';
    } elseif (strpos($combinedSignals, 'opencart') !== false) {
        $platform = 'opencart';
        $needsUpgrade = true;
        $issues[] = 'Using OpenCart CMS';
    } elseif (strpos($combinedSignals, 'prestashop') !== false) {
        $platform = 'prestashop';
        $needsUpgrade = true;
        $issues[] = 'Using PrestaShop CMS';
    } elseif (strpos($combinedSignals, 'magento') !== false) {
        $platform = 'magento';
    } elseif (strpos($combinedSignals, 'zencart') !== false || strpos($combinedSignals, 'zen cart') !== false) {
        $platform = 'zencart';
        $needsUpgrade = true;
        $issues[] = 'Using Zen Cart CMS';
    } elseif (strpos($combinedSignals, 'oscommerce') !== false) {
        $platform = 'oscommerce';
        $needsUpgrade = true;
        $issues[] = 'Using osCommerce CMS';
    } elseif (strpos($combinedSignals, 'blogger') !== false || strpos($combinedSignals, 'blogspot') !== false) {
        $platform = 'blogger';
        $needsUpgrade = true;
        $issues[] = 'Using Blogger';
    } elseif (
        strpos($combinedSignals, 'facebook.com') !== false ||
        strpos($combinedSignals, 'instagram.com') !== false ||
        strpos($combinedSignals, 'tiktok.com') !== false ||
        strpos($combinedSignals, 'linktr.ee') !== false
    ) {
        $platform = strpos($combinedSignals, 'facebook.com') !== false
            ? 'facebook'
            : (strpos($combinedSignals, 'instagram.com') !== false
                ? 'instagram'
                : (strpos($combinedSignals, 'tiktok.com') !== false ? 'tiktok' : 'linktree'));
        $needsUpgrade = true;
        $issues[] = 'Social-only web presence';
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

/**
 * Stream search results using Serper.dev Places API
 */
function streamSerperSearch($service, $location, $limit, $filters, $filtersActive, $filterMultiplier, $enrichmentSessionId = '', $enableEnrichment = false, $enrichmentSearchType = 'gmb') {
    $allResults = [];
    $seenBusinesses = [];
    $totalResults = 0;

    streamSerperSearchInto(
        $service,
        $location,
        $limit,
        $filters,
        $filtersActive,
        $filterMultiplier,
        $allResults,
        $seenBusinesses,
        $totalResults,
        $enrichmentSessionId,
        $enableEnrichment,
        $enrichmentSearchType,
        true
    );
}

/**
 * Fetch Serper places/maps concurrently to reduce per-query latency.
 */
function fetchSerperPlacesAndMaps($payload) {
    $headers = [
        'X-API-KEY: ' . SERPER_API_KEY,
        'Content-Type: application/json'
    ];
    $body = json_encode($payload);

    $createHandle = function ($url) use ($headers, $body) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);
        return $ch;
    };

    $multi = curl_multi_init();
    $placesHandle = $createHandle('https://google.serper.dev/places');
    $mapsHandle = $createHandle('https://google.serper.dev/maps');

    curl_multi_add_handle($multi, $placesHandle);
    curl_multi_add_handle($multi, $mapsHandle);

    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 1.0);
        }
    } while ($running && $status === CURLM_OK);

    $places = [
        'response' => curl_multi_getcontent($placesHandle),
        'httpCode' => (int)curl_getinfo($placesHandle, CURLINFO_HTTP_CODE),
        'error' => curl_error($placesHandle),
    ];
    $maps = [
        'response' => curl_multi_getcontent($mapsHandle),
        'httpCode' => (int)curl_getinfo($mapsHandle, CURLINFO_HTTP_CODE),
        'error' => curl_error($mapsHandle),
    ];

    curl_multi_remove_handle($multi, $placesHandle);
    curl_multi_remove_handle($multi, $mapsHandle);
    curl_close($placesHandle);
    curl_close($mapsHandle);
    curl_multi_close($multi);

    return [
        'places' => $places,
        'maps' => $maps,
    ];
}

/**
 * Batch fetch multiple Serper organic queries in parallel using curl_multi.
 * Runs up to $batchSize queries simultaneously for massive speed improvement.
 */
function fetchSerperOrganicBatch($queries, $batchSize = 8, $page = 1) {
    if (empty($queries) || !defined('SERPER_API_KEY') || empty(SERPER_API_KEY)) return [];

    $page = max(1, (int)$page);

    $allResults = [];
    $batches = array_chunk($queries, $batchSize, true);

    foreach ($batches as $batch) {
        $multi = curl_multi_init();
        $handles = [];

        foreach ($batch as $i => $query) {
            $payload = [
                'q' => $query,
                'gl' => 'us',
                'hl' => 'en',
                'num' => 100,
            ];
            if ($page > 1) {
                $payload['page'] = $page;
            }

            $ch = curl_init('https://google.serper.dev/search');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . SERPER_API_KEY,
                    'Content-Type: application/json'
                ],
                CURLOPT_TIMEOUT => 15,
                CURLOPT_CONNECTTIMEOUT => 5,
            ]);
            curl_multi_add_handle($multi, $ch);
            $handles[$i] = $ch;
        }

        do {
            $status = curl_multi_exec($multi, $running);
            if ($running) curl_multi_select($multi, 1.0);
        } while ($running && $status === CURLM_OK);

        foreach ($handles as $i => $ch) {
            $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($httpCode === 200) {
                $data = json_decode(curl_multi_getcontent($ch), true);
                $allResults[$i] = $data['organic'] ?? [];
            } else {
                $allResults[$i] = [];
            }
            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);
        }
        curl_multi_close($multi);
    }

    return $allResults;
}

/**
 * Stream search results using Serper.dev Places API into existing collections.
 */
function streamSerperSearchInto(
    $service,
    $location,
    $limit,
    $filters,
    $filtersActive,
    $filterMultiplier,
    &$allResults,
    &$seenBusinesses,
    &$totalResults,
    $enrichmentSessionId = '',
    $enableEnrichment = false,
    $enrichmentSearchType = 'gmb',
    $emitComplete = true,
    $queryOverride = null
) {
    $query = $queryOverride ?: "$service in $location";
    $enrichmentLastPolled = 0;
    $enrichmentLastId = 0;
    $enrichmentLastTrigger = 0;
    $enrichmentPollInterval = 0;
    $enrichmentTriggerInterval = 4;

    if ($enableEnrichment && function_exists('triggerBackgroundEnrichmentProcessing')) {
        triggerBackgroundEnrichmentProcessing($enrichmentSessionId);
        $enrichmentLastTrigger = time();
    }

    $emitEnrichment = function () use (
        &$enrichmentLastPolled,
        &$enrichmentLastId,
        &$enrichmentLastTrigger,
        $enrichmentPollInterval,
        $enrichmentTriggerInterval,
        $enrichmentSessionId,
        $enableEnrichment
    ) {
        if (!$enableEnrichment || empty($enrichmentSessionId)) {
            return;
        }

        $now = time();
        if (($now - $enrichmentLastPolled) < $enrichmentPollInterval) {
            return;
        }
        $enrichmentLastPolled = $now;

        if (function_exists('triggerBackgroundEnrichmentProcessing') && ($now - $enrichmentLastTrigger) >= $enrichmentTriggerInterval) {
            $enrichmentLastTrigger = $now;
            triggerBackgroundEnrichmentProcessing($enrichmentSessionId);
        }

        $completed = getCompletedEnrichments($enrichmentSessionId, $enrichmentLastId);
        if (!empty($completed['results'])) {
            sendSSE('enrichment', [
                'results' => $completed['results'],
                'processed' => count($completed['results'])
            ]);
        }
        $enrichmentLastId = $completed['lastId'] ?? $enrichmentLastId;
    };
    
    sendSSE('status', [
        'message' => 'Searching with Serper Places API...',
        'engine' => 'Serper Places',
        'progress' => min(100, round(($totalResults / max(1, $limit)) * 100))
    ]);
    
    // Search Serper Places + Maps in parallel
    $payload = [
        'q' => $query,
        'gl' => 'us',
        'hl' => 'en'
    ];

    $payloadCandidates = [];
    $addPayloadCandidate = function ($q) use (&$payloadCandidates) {
        $q = preg_replace('/\s+/', ' ', trim((string)$q));
        if ($q === '') {
            return;
        }
        foreach ($payloadCandidates as $existing) {
            if (($existing['q'] ?? '') === $q) {
                return;
            }
        }
        $payloadCandidates[] = [
            'q' => $q,
            'gl' => 'us',
            'hl' => 'en'
        ];
    };
    $addPayloadCandidate($query);
    $addPayloadCandidate(trim("$service $location"));
    $addPayloadCandidate(preg_replace('/\s+in\s+/i', ' ', $query, 1));
    $payloadCandidates = array_values(array_slice($payloadCandidates, 0, 3));
    if (empty($payloadCandidates)) {
        $payloadCandidates[] = $payload;
    }

    $primaryResponses = fetchSerperPlacesAndMaps($payloadCandidates[0]);
    $placesResponse = $primaryResponses['places'];
    $mapsResponse = $primaryResponses['maps'];

    $parseSerperError = function ($response, $defaultPrefix = 'Serper API error') {
        $httpCode = (int)($response['httpCode'] ?? 0);
        $message = "{$defaultPrefix}: HTTP {$httpCode}";
        $decoded = json_decode($response['response'] ?? '', true);
        if (is_array($decoded)) {
            $apiMessage = $decoded['message'] ?? $decoded['error'] ?? '';
            if (!empty($apiMessage)) {
                $message .= " - {$apiMessage}";
            }
        }
        if (!empty($response['error'])) {
            $message .= " - cURL: " . $response['error'];
        }
        return $message;
    };

    $places = [];
    $isOrganic = false;
    if (($placesResponse['httpCode'] ?? 0) === 200) {
        $data = json_decode($placesResponse['response'] ?? '', true);
        $places = $data['places'] ?? [];
    } else {
        // Fallback to organic search using progressively simpler query candidates.
        $organicResponse = null;
        $lastOrganicError = '';
        foreach ($payloadCandidates as $candidatePayload) {
            $tryResponse = curlRequest('https://google.serper.dev/search', [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($candidatePayload),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . SERPER_API_KEY,
                    'Content-Type: application/json'
                ]
            ]);

            if (($tryResponse['httpCode'] ?? 0) === 200) {
                $organicResponse = $tryResponse;
                break;
            }

            $lastOrganicError = $parseSerperError($tryResponse);
            if (DEBUG_MODE) {
                error_log("[Serper] Organic fallback failed for query '{$candidatePayload['q']}': {$lastOrganicError}");
            }
        }

        if ($organicResponse !== null) {
            $data = json_decode($organicResponse['response'] ?? '', true);
            $places = $data['organic'] ?? [];
            $isOrganic = true;
        } elseif (($mapsResponse['httpCode'] ?? 0) !== 200) {
            $placesError = $parseSerperError($placesResponse);
            $mapsError = $parseSerperError($mapsResponse);
            $combinedError = $lastOrganicError ?: "{$placesError}; {$mapsError}";
            // Non-fatal: a single shard can fail on shared hosts. Continue the global search.
            sendSSE('source_error', [
                'error' => $combinedError,
                'engine' => 'Serper',
                'query' => $query,
                'location' => $location,
            ]);
            return;
            if (DEBUG_MODE) {
                $placesError = $parseSerperError($placesResponse);
                error_log("[Serper] Places failed but Maps is available. Continuing with Maps only. {$placesError}");
            }
            $places = [];
            $isOrganic = false;
        }
    }
    
    sendSSE('status', [
        'message' => 'Processing ' . count($places) . ' results from Serper...',
        'engine' => 'Serper',
        'progress' => 30
    ]);
    
    $placesBatch = [];
    foreach ($places as $index => $item) {
        if (count($allResults) >= $limit) break;
        
        if ($isOrganic) {
            $business = [
                'id' => generateId('srpr_'),
                'name' => $item['title'] ?? '',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?? '',
                'address' => '',
                'phone' => '',
                'rating' => null,
                'reviews' => null,
                'source' => 'Serper Organic',
                'sources' => ['Serper Organic']
            ];
        } else {
            $business = [
                'id' => generateId('srpr_'),
                'name' => $item['title'] ?? '',
                'url' => $item['website'] ?? '',
                'snippet' => $item['category'] ?? '',
                'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
                'address' => $item['address'] ?? '',
                'phone' => $item['phoneNumber'] ?? '',
                'rating' => $item['rating'] ?? null,
                'reviews' => $item['ratingCount'] ?? null,
                'source' => 'Serper Places',
                'sources' => ['Serper Places']
            ];
        }
        
        if (empty($business['name'])) continue;
        $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
        if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;
        
        $dedupeKey = buildBusinessDedupeKey($business, $location);
        if (isset($seenBusinesses[$dedupeKey])) continue;
        
        $seenBusinesses[$dedupeKey] = count($allResults);
        $allResults[] = $business;
        $totalResults++;
        $placesBatch[] = $business;
        
        // Queue for Firecrawl enrichment
        $needsEnrichment = empty($business['email']) || empty($business['phone']);
        if ($enableEnrichment && $needsEnrichment && !empty($business['url'])) {
            queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
        }
        
        // ⚡ Batch SSE: send every 25 leads at once (was 1-at-a-time)
        if (count($placesBatch) >= 25) {
            $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
            sendSSE('results', [
                'leads' => $placesBatch,
                'total' => $totalResults,
                'progress' => $progress,
                'source' => $business['source'] ?? 'Serper'
            ]);
            $placesBatch = [];
            $emitEnrichment();
        }
    }
    // Flush remaining places batch
    if (!empty($placesBatch)) {
        $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
        sendSSE('results', [
            'leads' => $placesBatch,
            'total' => $totalResults,
            'progress' => $progress,
            'source' => 'Serper Places'
        ]);
        $emitEnrichment();
    }
    
    // If we need more results, try Maps search
    if (count($allResults) < $limit && ($mapsResponse['httpCode'] ?? 0) === 200) {
        sendSSE('status', [
            'message' => 'Searching additional sources...',
            'engine' => 'Serper Maps',
            'progress' => 60
        ]);

        $mapsData = json_decode($mapsResponse['response'] ?? '', true);
        $mapsPlaces = $mapsData['places'] ?? [];
        
        $mapsBatch = [];
        foreach ($mapsPlaces as $item) {
            if (count($allResults) >= $limit) break;
            
            $business = [
                'id' => generateId('srpm_'),
                'name' => $item['title'] ?? '',
                'url' => $item['website'] ?? '',
                'snippet' => $item['category'] ?? '',
                'displayLink' => parse_url($item['website'] ?? '', PHP_URL_HOST) ?? '',
                'address' => $item['address'] ?? '',
                'phone' => $item['phoneNumber'] ?? '',
                'rating' => $item['rating'] ?? null,
                'reviews' => $item['ratingCount'] ?? null,
                'source' => 'Serper Maps',
                'sources' => ['Serper Maps']
            ];
            
            if (empty($business['name'])) continue;
            $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
            if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;
            
            $dedupeKey = buildBusinessDedupeKey($business, $location);
            if (isset($seenBusinesses[$dedupeKey])) continue;
            
            $seenBusinesses[$dedupeKey] = count($allResults);
            $allResults[] = $business;
            $totalResults++;
            $mapsBatch[] = $business;

            $needsEnrichment = empty($business['email']) || empty($business['phone']);
            if ($enableEnrichment && $needsEnrichment && !empty($business['url'])) {
                queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
            }
            
            // ⚡ Batch SSE: send every 25 leads at once
            if (count($mapsBatch) >= 25) {
                $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                sendSSE('results', [
                    'leads' => $mapsBatch,
                    'total' => $totalResults,
                    'progress' => $progress,
                    'source' => 'Serper Maps'
                ]);
                $mapsBatch = [];
                $emitEnrichment();
            }
        }
        // Flush remaining maps batch
        if (!empty($mapsBatch)) {
            $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
            sendSSE('results', [
                'leads' => $mapsBatch,
                'total' => $totalResults,
                'progress' => $progress,
                'source' => 'Serper Maps'
            ]);
            $emitEnrichment();
        }
    }

    // ORGANIC BOOST: For small searches only.
    // For high-volume searches, we rely on the dedicated deep organic pass (batched + parallel)
    // later in the pipeline to avoid repeated per-location pagination that can time out on shared hosts.
    if ($totalResults < $limit && $limit < 500) {
        $organicPages = 1;
        if ($limit >= 500) $organicPages = 3;
        if ($limit >= 1000) $organicPages = 5;
        if ($limit >= 2000) $organicPages = 8;

        for ($orgPage = 1; $orgPage <= $organicPages; $orgPage++) {
            if ($totalResults >= $limit) break;

            $organicResults = fetchSerperOrganicPage($query, $orgPage, 100);
            if (empty($organicResults)) break;

            foreach ($organicResults as $item) {
                if ($totalResults >= $limit) break;

                $business = [
                    'id' => generateId('srpo_'),
                    'name' => $item['title'] ?? '',
                    'url' => $item['link'] ?? '',
                    'snippet' => $item['snippet'] ?? '',
                    'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?? '',
                    'address' => '',
                    'phone' => extractPhoneFromText($item['snippet'] ?? ''),
                    // Inline website scraping here kills throughput on big searches.
                    // Any real emails should come from background enrichment.
                    'email' => extractEmailFromText($item['snippet'] ?? ''),
                    'rating' => null,
                    'reviews' => null,
                    'source' => 'Serper Organic',
                    'sources' => ['Serper Organic']
                ];

                if (empty($business['name'])) continue;
                $business['websiteAnalysis'] = quickWebsiteCheck($business['url'], ($business['snippet'] ?? '') . ' ' . ($business['name'] ?? ''));
                if ($filtersActive && !matchesSearchFilters($business, $filters)) continue;

                $dedupeKey = buildBusinessDedupeKey($business, $location);
                if (isset($seenBusinesses[$dedupeKey])) continue;

                $seenBusinesses[$dedupeKey] = count($allResults);
                $allResults[] = $business;
                $totalResults++;

                if ($enableEnrichment && !empty($business['url'])) {
                    queueFirecrawlEnrichment($business['id'], $business['url'], $enrichmentSessionId, $enrichmentSearchType);
                }

                $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
                sendSSE('results', [
                    'leads' => [$business],
                    'total' => $totalResults,
                    'progress' => $progress,
                    'source' => 'Serper Organic'
                ]);
            }

            $emitEnrichment();
        }
    }

    if ($enableEnrichment && $emitComplete) {
        $flushStart = time();
        $flushSeconds = defined('ENRICHMENT_FINAL_FLUSH_SECONDS') ? max(1, (int)ENRICHMENT_FINAL_FLUSH_SECONDS) : 1;
        while ((time() - $flushStart) < $flushSeconds) {
            $emitEnrichment();
            usleep(25000); // 25ms poll — max speed
        }
    }
    
    if ($emitComplete) {
        // Send completion
        sendSSE('complete', [
            'total' => $totalResults,
            'requested' => $limit,
            'coverage' => round(($totalResults / max(1, $limit)) * 100, 2),
            'query' => [
                'service' => $service,
                'location' => $location,
                'limit' => $limit
            ],
            'enrichmentSessionId' => $enrichmentSessionId,
            'enrichmentEnabled' => $enableEnrichment,
            'message' => "Search complete! Found {$totalResults} businesses."
        ]);
    }
}
