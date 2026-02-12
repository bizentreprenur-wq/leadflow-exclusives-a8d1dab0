<?php
/**
 * GMB Search API Endpoint - STREAMING VERSION
 * Streams results progressively as they arrive from Serper
 * Uses Server-Sent Events (SSE) for real-time updates
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/includes/firecrawl.php';
require_once __DIR__ . '/includes/geo-grid.php';

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

// Start streaming search
// Generate enrichment session ID
$enrichmentSessionId = 'enrich_' . uniqid() . '_' . time();
$enableEnrichment = defined('FIRECRAWL_API_KEY') && !empty(FIRECRAWL_API_KEY) && FIRECRAWL_API_KEY !== 'YOUR_FIRECRAWL_API_KEY_HERE';

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
    $expandedLocations = $enableExpansion ? buildLocationExpansions($location) : [];
    if ($expansionMax > 0) {
        $expandedLocations = array_slice($expandedLocations, 0, $expansionMax);
    } else {
        $expandedLocations = [];
    }
    $locationsToSearch = array_merge([$location], $expandedLocations);
    $searchedLocations = [];

    // Pre-compute synonym variants for use in primary search loop
    $serviceVariants = expandServiceSynonyms($service);
    if (empty($serviceVariants)) {
        $serviceVariants = [$service];
    }
    // For high-volume searches, use synonym variants per location.
    // BUT: Places/Maps only returns ~20 results per query, so too many
    // synonyms per location bottlenecks the stream. Keep this small and
    // rely on the dedicated deep organic pass for volume.
    $synonymsPerLocation = 1;
    if ($limit >= 500) $synonymsPerLocation = 2;
    if ($limit >= 1000) $synonymsPerLocation = 4;
    if ($limit >= 2000) $synonymsPerLocation = 6;
    if ($limit >= 5000) $synonymsPerLocation = 8;
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

    $enrichmentLastPolled = 0;
    $enrichmentLastId = 0;
    $enrichmentLastTrigger = 0;
    $enrichmentPollInterval = 0; // Poll every cycle for max speed
    $enrichmentTriggerInterval = 4; // Re-trigger enrichment more frequently

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
    $primaryBatchSize = 20; // 20 concurrent Places queries
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
                $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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
            $gridResultBatches = parallelSerperSearch($gridQueries, 'places', 30);

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
                    $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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
        $maxOrgPages = $limit >= 2000 ? 15 : ($limit >= 1000 ? 10 : 4);
        $maxOrgVariants = $limit >= 2000 ? 8 : ($limit >= 1000 ? 5 : 3);
        $maxOrgLocations = $limit >= 2000 ? 8 : ($limit >= 1000 ? 5 : 3);
        if ($filtersActive) {
            $maxOrgPages = (int)ceil($maxOrgPages * 1.5);
            $maxOrgVariants = (int)ceil($maxOrgVariants * 1.6);
            $maxOrgLocations = (int)ceil($maxOrgLocations * 1.5);
        }
        $maxOrgPages = min($maxOrgPages, $limit >= 5000 ? 25 : 20);
        $maxOrgVariants = min($maxOrgVariants, $limit >= 5000 ? 20 : 16);
        $maxOrgLocations = min($maxOrgLocations, $limit >= 5000 ? 16 : 12);

        $organicVariants = array_slice($serviceVariants, 0, min($maxOrgVariants, count($serviceVariants)));
        $organicLocations = array_slice($searchedLocations, 0, min($maxOrgLocations, count($searchedLocations)));
        if (empty($organicLocations)) {
            $organicLocations = array_slice($locationsToSearch, 0, min($maxOrgLocations, count($locationsToSearch)));
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

        $batchSize = 15; // ⚡ Increased from 8 for faster parallel organic fetching
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
                        $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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

        $dirLocations = array_slice($searchedLocations, 0, min(10, count($searchedLocations)));
        $dirPages = $limit >= 2000 ? 3 : 1;
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
                    $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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

    if ($enableEnrichment) {
        $flushStart = time();
        $flushSeconds = $limit >= 1000 ? 2 : 3; // Minimal flush — enrichment continues in background
        while ((time() - $flushStart) < $flushSeconds) {
            $emitEnrichment();
            usleep(25000); // 25ms poll — maximum speed
        }
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

    // For high-volume searches, we still want SOME leads to arrive with emails.
    // Track how many inline extractions we've done and cap it to avoid blocking
    // the SSE stream for too long. First ~150 leads get inline emails; the rest
    // rely on Firecrawl background enrichment.
    if (isset($GLOBALS['_bamlead_search_limit']) && $GLOBALS['_bamlead_search_limit'] >= 500) {
        if (!isset($GLOBALS['_bamlead_inline_email_count'])) {
            $GLOBALS['_bamlead_inline_email_count'] = 0;
        }
        $maxInline = 150; // Extract emails for first ~150 leads even on large searches
        if ($GLOBALS['_bamlead_inline_email_count'] >= $maxInline) {
            return null;
        }
        $GLOBALS['_bamlead_inline_email_count']++;
    }
    
    // Normalize URL
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    // Check cache first (instant)
    $cacheKey = "scrape_contacts_" . md5($url);
    $cached = getCache($cacheKey);
    if ($cached !== null && !empty($cached['emails'])) {
        return $cached['emails'][0] ?? null;
    }
    
    // Also check Firecrawl cache
    $fcCacheKey = "firecrawl_" . md5($url . 'gmb');
    $fcCached = getCache($fcCacheKey);
    if ($fcCached !== null && !empty($fcCached['emails'])) {
        return $fcCached['emails'][0] ?? null;
    }
    
    // Quick scrape: only homepage + /contact page (2s timeout for speed)
    try {
        $parsed = parse_url($url);
        if (!$parsed || empty($parsed['host'])) return null;
        
        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'];
        $baseUrl = "{$scheme}://{$host}";
        
        // Try homepage first (many businesses list email in footer)
        $result = curlRequest($baseUrl, [
            CURLOPT_TIMEOUT => 3,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 2,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ], 3);
        
        if ($result['httpCode'] === 200 && !empty($result['response'])) {
            $emails = extractEmails($result['response']);
            if (!empty($emails)) {
                // Cache the result
                setCache($cacheKey, ['emails' => $emails, 'phones' => [], 'hasWebsite' => true], 86400);
                return $emails[0];
            }
            
            // Try /contact page
            $contactResult = curlRequest($baseUrl . '/contact', [
                CURLOPT_TIMEOUT => 2,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 2,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ], 2);
            
            if ($contactResult['httpCode'] === 200 && !empty($contactResult['response'])) {
                $contactEmails = extractEmails($contactResult['response']);
                if (!empty($contactEmails)) {
                    setCache($cacheKey, ['emails' => $contactEmails, 'phones' => [], 'hasWebsite' => true], 86400);
                    return $contactEmails[0];
                }
            }
        }
    } catch (Exception $e) {
        // Silently fail — email extraction is best-effort
    }
    
    return null;
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
        $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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
            $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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
                $business['websiteAnalysis'] = quickWebsiteCheck($business['url']);
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
