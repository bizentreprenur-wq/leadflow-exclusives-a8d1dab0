<?php
/**
 * Custom One-Shot Lead Fetcher + Enrichment
 *
 * Discovery:
 * - Serper (primary)
 * - Optional Google Custom Search + Bing Web Search
 * - No-key web discovery fallback (manual endpoint only)
 *
 * Enrichment:
 * - Inline concurrent website fetches (homepage + contact/about/team/support)
 * - Extract emails, phones, socials in the same pipeline
 *
 * This module is designed to replace legacy Serper + BamLead + Firecrawl search-time flow.
 */

require_once __DIR__ . '/functions.php';

if (!defined('ENABLE_CUSTOM_ONE_SHOT_FETCHER')) {
    define('ENABLE_CUSTOM_ONE_SHOT_FETCHER', true);
}
if (!defined('ENABLE_LEGACY_SERPER_PIPELINE')) {
    define('ENABLE_LEGACY_SERPER_PIPELINE', false);
}
if (!defined('ENABLE_LEGACY_BAMLEAD_SCRAPER')) {
    define('ENABLE_LEGACY_BAMLEAD_SCRAPER', false);
}
if (!defined('ENABLE_LEGACY_FIRECRAWL_ENRICHMENT')) {
    define('ENABLE_LEGACY_FIRECRAWL_ENRICHMENT', false);
}
if (!defined('CUSTOM_FETCH_DISCOVERY_SOURCES')) {
    define('CUSTOM_FETCH_DISCOVERY_SOURCES', ['no_key']);
}
if (!defined('CUSTOM_FETCH_ENGINE_MODE')) {
    define('CUSTOM_FETCH_ENGINE_MODE', 'current');
}
if (!defined('ENABLE_NO_KEY_OUTSCRAPER_STYLE')) {
    define('ENABLE_NO_KEY_OUTSCRAPER_STYLE', false);
}
if (!defined('CUSTOM_FETCH_ENRICH_CONCURRENCY')) {
    define('CUSTOM_FETCH_ENRICH_CONCURRENCY', 5);
}
if (!defined('CUSTOM_FETCH_CONTACT_TIMEOUT_SEC')) {
    define('CUSTOM_FETCH_CONTACT_TIMEOUT_SEC', 7);
}
if (!defined('CUSTOM_FETCH_TARGET_RATIO')) {
    define('CUSTOM_FETCH_TARGET_RATIO', 1.05);
}
if (!defined('CUSTOM_FETCH_OVER_DELIVER_BUFFER')) {
    define('CUSTOM_FETCH_OVER_DELIVER_BUFFER', 0.10);
}
if (!defined('CUSTOM_FETCH_ENABLE_INLINE_ENRICHMENT')) {
    define('CUSTOM_FETCH_ENABLE_INLINE_ENRICHMENT', false);
}
if (!defined('CUSTOM_FETCH_SERPER_ORGANIC_TOPUP')) {
    define('CUSTOM_FETCH_SERPER_ORGANIC_TOPUP', false);
}
if (!defined('CUSTOM_FETCH_SERPER_INCLUDE_MAPS')) {
    define('CUSTOM_FETCH_SERPER_INCLUDE_MAPS', true);
}
if (!defined('CUSTOM_FETCH_ENABLE_LOW_COVERAGE_TOPUP')) {
    define('CUSTOM_FETCH_ENABLE_LOW_COVERAGE_TOPUP', true);
}
if (!defined('CUSTOM_FETCH_LOW_COVERAGE_THRESHOLD')) {
    define('CUSTOM_FETCH_LOW_COVERAGE_THRESHOLD', 0.80);
}
if (!defined('CUSTOM_FETCH_MAX_TOPUP_QUERIES')) {
    define('CUSTOM_FETCH_MAX_TOPUP_QUERIES', 18);
}
if (!defined('CUSTOM_FETCH_DISCOVERY_TIMEOUT_SEC')) {
    define('CUSTOM_FETCH_DISCOVERY_TIMEOUT_SEC', 6);
}
if (!defined('CUSTOM_FETCH_STREAM_EMIT_BATCH_SIZE')) {
    define('CUSTOM_FETCH_STREAM_EMIT_BATCH_SIZE', 6);
}
if (!defined('CUSTOM_FETCH_QUERY_CONCURRENCY')) {
    define('CUSTOM_FETCH_QUERY_CONCURRENCY', 3);
}
if (!defined('CUSTOM_FETCH_ENABLE_PLATFORM_RELAXATION')) {
    define('CUSTOM_FETCH_ENABLE_PLATFORM_RELAXATION', true);
}
if (!defined('CUSTOM_FETCH_PLATFORM_RELAX_THRESHOLD')) {
    define('CUSTOM_FETCH_PLATFORM_RELAX_THRESHOLD', 0.20);
}
if (!defined('CUSTOM_FETCH_PLATFORM_RELAX_AFTER_QUERY_RATIO')) {
    define('CUSTOM_FETCH_PLATFORM_RELAX_AFTER_QUERY_RATIO', 0.35);
}
if (!defined('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE')) {
    define('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE', true);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC', 5);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY', 20);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY', 500);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_PASS')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_PASS', 50);
}
if (!defined('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE')) {
    define('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE', false);
}
if (!defined('CUSTOM_FETCH_TOPUP_USE_NO_KEY_FALLBACK')) {
    define('CUSTOM_FETCH_TOPUP_USE_NO_KEY_FALLBACK', false);
}
if (!defined('NO_KEY_DISCOVERY_CONCURRENCY')) {
    define('NO_KEY_DISCOVERY_CONCURRENCY', 16);
}
if (!defined('NO_KEY_PROVIDER_TIMEOUT_SEC')) {
    define('NO_KEY_PROVIDER_TIMEOUT_SEC', 5);
}
if (!defined('NO_KEY_PROVIDER_RETRIES')) {
    define('NO_KEY_PROVIDER_RETRIES', 0);
}
if (!defined('NO_KEY_TOPUP_MAX_PASSES')) {
    define('NO_KEY_TOPUP_MAX_PASSES', 3);
}
if (!defined('NO_KEY_TOPUP_MAX_QUERIES')) {
    define('NO_KEY_TOPUP_MAX_QUERIES', 30);
}
if (!defined('NO_KEY_STREAM_EMIT_BATCH_SIZE')) {
    define('NO_KEY_STREAM_EMIT_BATCH_SIZE', 6);
}
if (!defined('NO_KEY_BLOCK_BACKOFF_MS')) {
    define('NO_KEY_BLOCK_BACKOFF_MS', 200);
}
if (!defined('NO_KEY_TARGET_RATIO')) {
    define('NO_KEY_TARGET_RATIO', 0.85);
}
if (!defined('NO_KEY_MAX_SEED_QUERIES')) {
    define('NO_KEY_MAX_SEED_QUERIES', 25);
}
if (!defined('NO_KEY_ENABLE_TOPUP')) {
    define('NO_KEY_ENABLE_TOPUP', true);
}
if (!defined('NO_KEY_DEFER_QUICK_PROBE')) {
    define('NO_KEY_DEFER_QUICK_PROBE', true);
}
if (!defined('NO_KEY_MAX_EMPTY_SEED_CHUNKS')) {
    define('NO_KEY_MAX_EMPTY_SEED_CHUNKS', 4);
}
if (!defined('NO_KEY_MAX_EMPTY_TOPUP_CHUNKS')) {
    define('NO_KEY_MAX_EMPTY_TOPUP_CHUNKS', 3);
}

function customFetcherEnabled()
{
    return defined('ENABLE_CUSTOM_ONE_SHOT_FETCHER') && ENABLE_CUSTOM_ONE_SHOT_FETCHER;
}

function customFetcherEngineMode()
{
    $mode = strtolower(trim((string) (defined('CUSTOM_FETCH_ENGINE_MODE') ? CUSTOM_FETCH_ENGINE_MODE : 'current')));
    if (!in_array($mode, ['current', 'no_key_outscraper_style'], true)) {
        return 'current';
    }
    return $mode;
}

function customFetcherNoKeyOutscraperEnabled()
{
    return defined('ENABLE_NO_KEY_OUTSCRAPER_STYLE') && ENABLE_NO_KEY_OUTSCRAPER_STYLE;
}

function customFetcherUseNoKeyOutscraperStyle()
{
    return customFetcherNoKeyOutscraperEnabled() && customFetcherEngineMode() === 'no_key_outscraper_style';
}

function customFetcherResolveSources()
{
    if (customFetcherUseNoKeyOutscraperStyle()) {
        return ['no_key'];
    }
    $raw = defined('CUSTOM_FETCH_DISCOVERY_SOURCES') ? CUSTOM_FETCH_DISCOVERY_SOURCES : ['serper'];
    if (!is_array($raw)) {
        $raw = ['serper'];
    }

    $normalized = [];
    foreach ($raw as $src) {
        $key = strtolower(trim((string) $src));
        if (in_array($key, ['serper', 'google', 'bing', 'no_key'], true) && !in_array($key, $normalized, true)) {
            $normalized[] = $key;
        }
    }
    $available = [];
    foreach ($normalized as $src) {
        if ($src === 'serper' && defined('SERPER_API_KEY') && trim((string) SERPER_API_KEY) !== '') {
            $available[] = $src;
        }
        if (
            $src === 'google' && defined('GOOGLE_API_KEY') && defined('GOOGLE_SEARCH_ENGINE_ID') &&
            trim((string) GOOGLE_API_KEY) !== '' && trim((string) GOOGLE_SEARCH_ENGINE_ID) !== ''
        ) {
            $available[] = $src;
        }
        if ($src === 'bing' && defined('BING_API_KEY') && trim((string) BING_API_KEY) !== '') {
            $available[] = $src;
        }
        if ($src === 'no_key') {
            $available[] = $src;
        }
    }
    return $available;
}

function customFetcherTargetRatio()
{
    $ratio = defined('CUSTOM_FETCH_TARGET_RATIO') ? (float) CUSTOM_FETCH_TARGET_RATIO : 0.95;
    if ($ratio < 0.50)
        $ratio = 0.50;
    if ($ratio > 1.00)
        $ratio = 1.00;
    return $ratio;
}

function customFetcherInlineEnrichmentEnabled()
{
    return defined('CUSTOM_FETCH_ENABLE_INLINE_ENRICHMENT') && CUSTOM_FETCH_ENABLE_INLINE_ENRICHMENT;
}

function customFetcherSerperOrganicTopupEnabled()
{
    return defined('CUSTOM_FETCH_SERPER_ORGANIC_TOPUP') && CUSTOM_FETCH_SERPER_ORGANIC_TOPUP;
}

function customFetcherSerperIncludeMaps()
{
    return defined('CUSTOM_FETCH_SERPER_INCLUDE_MAPS') ? (bool) CUSTOM_FETCH_SERPER_INCLUDE_MAPS : true;
}

function customFetcherLowCoverageTopupEnabled()
{
    return defined('CUSTOM_FETCH_ENABLE_LOW_COVERAGE_TOPUP') && CUSTOM_FETCH_ENABLE_LOW_COVERAGE_TOPUP;
}

function customFetcherLowCoverageThreshold()
{
    $threshold = defined('CUSTOM_FETCH_LOW_COVERAGE_THRESHOLD') ? (float) CUSTOM_FETCH_LOW_COVERAGE_THRESHOLD : 0.80;
    if ($threshold < 0.35)
        $threshold = 0.35;
    if ($threshold > 0.98)
        $threshold = 0.98;
    return $threshold;
}

function customFetcherMaxTopupQueries()
{
    $max = defined('CUSTOM_FETCH_MAX_TOPUP_QUERIES') ? (int) CUSTOM_FETCH_MAX_TOPUP_QUERIES : 18;
    return max(4, min(80, $max));
}

function customFetcherDiscoveryTimeout()
{
    $timeout = defined('CUSTOM_FETCH_DISCOVERY_TIMEOUT_SEC') ? (int) CUSTOM_FETCH_DISCOVERY_TIMEOUT_SEC : 6;
    return max(3, min(12, $timeout));
}

function customFetcherStreamEmitBatchSize()
{
    $batch = defined('CUSTOM_FETCH_STREAM_EMIT_BATCH_SIZE') ? (int) CUSTOM_FETCH_STREAM_EMIT_BATCH_SIZE : 6;
    return max(1, min(50, $batch));
}

function customFetcherQueryConcurrency()
{
    $value = defined('CUSTOM_FETCH_QUERY_CONCURRENCY') ? (int) CUSTOM_FETCH_QUERY_CONCURRENCY : 3;
    return max(1, min(8, $value));
}

function customFetcherPlatformRelaxationEnabled()
{
    return defined('CUSTOM_FETCH_ENABLE_PLATFORM_RELAXATION') ? (bool) CUSTOM_FETCH_ENABLE_PLATFORM_RELAXATION : true;
}

function customFetcherPlatformRelaxThreshold()
{
    $value = defined('CUSTOM_FETCH_PLATFORM_RELAX_THRESHOLD') ? (float) CUSTOM_FETCH_PLATFORM_RELAX_THRESHOLD : 0.20;
    if ($value < 0.05)
        $value = 0.05;
    if ($value > 0.80)
        $value = 0.80;
    return $value;
}

function customFetcherPlatformRelaxAfterQueryRatio()
{
    $value = defined('CUSTOM_FETCH_PLATFORM_RELAX_AFTER_QUERY_RATIO') ? (float) CUSTOM_FETCH_PLATFORM_RELAX_AFTER_QUERY_RATIO : 0.35;
    if ($value < 0.10)
        $value = 0.10;
    if ($value > 0.95)
        $value = 0.95;
    return $value;
}

function customFetcherMatchesWithOptionalPlatformRelaxation($lead, $filters, $relaxPlatformFiltering)
{
    if (!$relaxPlatformFiltering) {
        return matchesSearchFilters($lead, $filters);
    }

    $filtersCopy = is_array($filters) ? $filters : [];
    $filtersCopy['platforms'] = [];
    return matchesSearchFilters($lead, $filtersCopy);
}

function customFetcherQuickEmailProbeEnabled()
{
    return defined('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE') && CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE;
}

function customFetcherQuickEmailTimeout()
{
    $timeout = defined('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC') ? (int) CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC : 5;
    return max(1, min(10, $timeout));
}

function customFetcherQuickEmailConcurrency()
{
    $c = defined('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY') ? (int) CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY : 16;
    return max(2, min(20, $c));
}

function customFetcherQuickEmailMaxPerQuery()
{
    $m = defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY') ? (int) CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY : 500;
    return max(20, min(2000, $m));
}

function customFetcherQuickEmailMaxPerPass()
{
    $m = defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_PASS') ? (int) CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_PASS : 50;
    return max(1, min(200, $m));
}

function customFetcherDeferQuickProbe()
{
    return defined('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE') ? (bool) CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE : true;
}

function customFetcherTopupUseNoKeyFallback()
{
    return defined('CUSTOM_FETCH_TOPUP_USE_NO_KEY_FALLBACK') ? (bool) CUSTOM_FETCH_TOPUP_USE_NO_KEY_FALLBACK : false;
}

function customFetcherEnrichConcurrency()
{
    $c = defined('CUSTOM_FETCH_ENRICH_CONCURRENCY') ? (int) CUSTOM_FETCH_ENRICH_CONCURRENCY : 5;
    return max(1, min(12, $c));
}

function customFetcherContactTimeout()
{
    $timeout = defined('CUSTOM_FETCH_CONTACT_TIMEOUT_SEC') ? (int) CUSTOM_FETCH_CONTACT_TIMEOUT_SEC : 7;
    return max(3, min(15, $timeout));
}

function customFetcherNoKeyDiscoveryConcurrency()
{
    $value = defined('NO_KEY_DISCOVERY_CONCURRENCY') ? (int) NO_KEY_DISCOVERY_CONCURRENCY : 6;
    return max(1, min(20, $value));
}

function customFetcherNoKeyProviderTimeout()
{
    $value = defined('NO_KEY_PROVIDER_TIMEOUT_SEC') ? (int) NO_KEY_PROVIDER_TIMEOUT_SEC : 2;
    return max(2, min(20, $value));
}

function customFetcherNoKeyProviderRetries()
{
    $value = defined('NO_KEY_PROVIDER_RETRIES') ? (int) NO_KEY_PROVIDER_RETRIES : 0;
    return max(0, min(4, $value));
}

function customFetcherNoKeyTopupMaxPasses()
{
    $value = defined('NO_KEY_TOPUP_MAX_PASSES') ? (int) NO_KEY_TOPUP_MAX_PASSES : 0;
    return max(0, min(6, $value));
}

function customFetcherNoKeyTopupMaxQueries()
{
    $value = defined('NO_KEY_TOPUP_MAX_QUERIES') ? (int) NO_KEY_TOPUP_MAX_QUERIES : 8;
    return max(0, min(200, $value));
}

function customFetcherNoKeyStreamEmitBatchSize()
{
    $value = defined('NO_KEY_STREAM_EMIT_BATCH_SIZE') ? (int) NO_KEY_STREAM_EMIT_BATCH_SIZE : 3;
    return max(1, min(30, $value));
}

function customFetcherNoKeyBlockBackoffMs()
{
    $value = defined('NO_KEY_BLOCK_BACKOFF_MS') ? (int) NO_KEY_BLOCK_BACKOFF_MS : 350;
    return max(0, min(5000, $value));
}

function customFetcherNoKeyTargetRatio()
{
    $value = defined('NO_KEY_TARGET_RATIO') ? (float) NO_KEY_TARGET_RATIO : 0.50;
    if ($value < 0.20)
        $value = 0.20;
    if ($value > 0.98)
        $value = 0.98;
    return $value;
}

function customFetcherNoKeyMaxSeedQueries()
{
    $value = defined('NO_KEY_MAX_SEED_QUERIES') ? (int) NO_KEY_MAX_SEED_QUERIES : 7;
    return max(3, min(120, $value));
}

function customFetcherNoKeyTopupEnabled()
{
    return defined('NO_KEY_ENABLE_TOPUP') ? (bool) NO_KEY_ENABLE_TOPUP : false;
}

function customFetcherNoKeyDeferQuickProbe()
{
    return defined('NO_KEY_DEFER_QUICK_PROBE') ? (bool) NO_KEY_DEFER_QUICK_PROBE : true;
}

function customFetcherNoKeyMaxEmptySeedChunks()
{
    $value = defined('NO_KEY_MAX_EMPTY_SEED_CHUNKS') ? (int) NO_KEY_MAX_EMPTY_SEED_CHUNKS : 2;
    return max(1, min(20, $value));
}

function customFetcherNoKeyMaxEmptyTopupChunks()
{
    $value = defined('NO_KEY_MAX_EMPTY_TOPUP_CHUNKS') ? (int) NO_KEY_MAX_EMPTY_TOPUP_CHUNKS : 1;
    return max(1, min(20, $value));
}

function customFetcherAdaptiveNoKeySeedQueryCap($limit, $filtersActive)
{
    $cap = customFetcherNoKeyMaxSeedQueries();
    $limit = max(20, (int) $limit);
    if ($limit >= 250)
        $cap = max($cap, 36);
    if ($limit >= 500)
        $cap = max($cap, 54);
    if ($limit >= 1000)
        $cap = max($cap, 78);
    if ($limit >= 2000)
        $cap = max($cap, 110);
    if ($filtersActive)
        $cap = (int) ceil($cap * 1.18);
    return max(8, min(180, (int) $cap));
}

function customFetcherAdaptiveNoKeyTopupQueryCap($limit, $filtersActive)
{
    $cap = customFetcherNoKeyTopupMaxQueries();
    $limit = max(20, (int) $limit);
    if ($limit >= 250)
        $cap = max($cap, 45);
    if ($limit >= 500)
        $cap = max($cap, 70);
    if ($limit >= 1000)
        $cap = max($cap, 95);
    if ($limit >= 2000)
        $cap = max($cap, 120);
    if ($filtersActive)
        $cap = (int) ceil($cap * 1.15);
    return max(12, min(180, (int) $cap));
}

function customFetcherAdaptiveNoKeyTargetCount($limit, $filtersActive, $requestedTargetCount = null)
{
    $limit = max(20, (int) $limit);
    $ratio = customFetcherNoKeyTargetRatio();
    if ($limit >= 250)
        $ratio = max($ratio, 0.88);
    if ($limit >= 500)
        $ratio = max($ratio, 0.91);
    if ($limit >= 1000)
        $ratio = max($ratio, 0.94);
    if ($limit >= 2000)
        $ratio = max($ratio, 0.96);
    if ($filtersActive)
        $ratio = max(0.82, $ratio - 0.02);
    $derived = (int) ceil($limit * min(0.98, $ratio));

    if ($requestedTargetCount === null) {
        return min($limit, max(1, $derived));
    }

    $requested = max(1, (int) $requestedTargetCount);
    return min($limit, max($requested, $derived));
}

function customFetcherBuildLocations($location, $limit, $filtersActive)
{
    $locations = [$location];
    $expanded = buildLocationExpansions($location);
    if (!empty($expanded)) {
        $locations = array_merge($locations, $expanded);
    }
    $locations = customFetcherUniqueCleanArray($locations);

    $maxLocations = 6;
    if ($limit >= 250)
        $maxLocations = 10;
    if ($limit >= 500)
        $maxLocations = 16;
    if ($limit >= 1000)
        $maxLocations = 24;
    if ($limit >= 2000)
        $maxLocations = 40;
    if ($filtersActive)
        $maxLocations = (int) ceil($maxLocations * 1.4);

    return array_slice($locations, 0, $maxLocations);
}

function customFetcherBuildServiceVariants($service, $limit, $filtersActive)
{
    $variants = expandServiceSynonyms($service);
    if (empty($variants)) {
        $variants = [$service];
    } elseif (!in_array($service, $variants, true)) {
        array_unshift($variants, $service);
    }
    $variants = customFetcherUniqueCleanArray($variants);

    $maxVariants = 5;
    if ($limit >= 250)
        $maxVariants = 8;
    if ($limit >= 500)
        $maxVariants = 12;
    if ($limit >= 1000)
        $maxVariants = 16;
    if ($limit >= 2000)
        $maxVariants = 24;
    if ($filtersActive)
        $maxVariants = (int) ceil($maxVariants * 1.5);

    return array_slice($variants, 0, $maxVariants);
}

function customFetcherBuildQueries($serviceVariants, $locations, $limit, $filtersActive)
{
    $templates = [
        '%s in %s',
        '%s near %s',
        'best %s in %s',
        '%s services %s',
    ];

    $map = [];
    foreach ($locations as $loc) {
        foreach ($serviceVariants as $serviceVariant) {
            foreach ($templates as $tpl) {
                $query = preg_replace('/\s+/', ' ', trim(sprintf($tpl, $serviceVariant, $loc)));
                if ($query === '')
                    continue;
                $key = strtolower($query);
                if (!isset($map[$key])) {
                    $map[$key] = ['query' => $query, 'location' => $loc];
                }
            }
        }
    }

    $maxQueries = 24;
    if ($limit >= 250)
        $maxQueries = 48;
    if ($limit >= 500)
        $maxQueries = 96;
    if ($limit >= 1000)
        $maxQueries = 160;
    if ($limit >= 2000)
        $maxQueries = 240;
    if ($filtersActive)
        $maxQueries = min(400, (int) ceil($maxQueries * 1.35));

    return array_slice(array_values($map), 0, $maxQueries);
}

function customFetcherBuildLowCoverageTopupQueries($service, $location, $limit, $filtersActive, $existingQueries)
{
    $existingSet = [];
    foreach ((array) $existingQueries as $existing) {
        if (is_array($existing)) {
            $existing = $existing['query'] ?? '';
        }
        $key = strtolower(trim((string) $existing));
        if ($key !== '') {
            $existingSet[$key] = true;
        }
    }

    $serviceVariants = customFetcherBuildServiceVariants($service, max(250, (int) ($limit * 1.8)), $filtersActive);
    $serviceVariants = customFetcherUniqueCleanArray(array_merge($serviceVariants, [
        $service . ' company',
        $service . ' contractor',
        $service . ' provider',
        'local ' . $service,
    ]));

    $locations = customFetcherBuildLocations($location, max(250, (int) ($limit * 1.8)), $filtersActive);
    $expansions = buildLocationExpansions($location);
    $expansionCap = min(40, max(10, (int) ceil($limit / 12)));
    $locations = customFetcherUniqueCleanArray(array_merge([$location], $locations, array_slice($expansions, 0, $expansionCap)));

    $templates = [
        '%s in %s',
        'best %s in %s',
        'top rated %s in %s',
        'local %s %s',
        '%s near %s',
        '%s services %s',
        '%s business %s',
        '%s companies %s',
        '%s experts %s',
    ];

    $queries = [];
    $maxQueries = customFetcherMaxTopupQueries();
    if ($limit >= 250)
        $maxQueries = min(80, (int) ceil($maxQueries * 1.3));
    if ($limit >= 500)
        $maxQueries = min(80, (int) ceil($maxQueries * 1.5));
    if ($filtersActive)
        $maxQueries = min(80, (int) ceil($maxQueries * 1.2));

    foreach ($locations as $loc) {
        foreach ($serviceVariants as $variant) {
            foreach ($templates as $tpl) {
                if (count($queries) >= $maxQueries)
                    break 3;
                $query = preg_replace('/\s+/', ' ', trim(sprintf($tpl, $variant, $loc)));
                if ($query === '')
                    continue;
                $key = strtolower($query);
                if (isset($existingSet[$key]))
                    continue;
                $existingSet[$key] = true;
                $queries[] = [
                    'query' => $query,
                    'location' => $loc,
                ];
            }
        }
    }

    return $queries;
}

function customFetcherUniqueCleanArray($values)
{
    $out = [];
    foreach ((array) $values as $value) {
        $clean = preg_replace('/\s+/', ' ', trim((string) $value));
        if ($clean === '')
            continue;
        if (!in_array($clean, $out, true)) {
            $out[] = $clean;
        }
    }
    return $out;
}

function customFetcherTokenizeText($value)
{
    $text = strtolower((string) $value);
    $text = preg_replace('/https?:\/\/\S+/', ' ', $text);
    $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
    $text = preg_replace('/\s+/', ' ', trim($text));
    if ($text === '') {
        return [];
    }

    $stopWords = [
        'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'our', 'are',
        'was', 'were', 'have', 'has', 'had', 'not', 'near', 'best', 'top', 'local', 'new',
        'inc', 'llc', 'ltd', 'co', 'corp', 'company', 'services', 'service', 'business',
        'in', 'at', 'on', 'by', 'to', 'or', 'of', 'a', 'an', 'us', 'usa',
    ];
    $stopMap = array_fill_keys($stopWords, true);

    $tokens = [];
    foreach (explode(' ', $text) as $token) {
        $token = trim($token);
        if ($token === '' || strlen($token) < 2) {
            continue;
        }
        if (isset($stopMap[$token])) {
            continue;
        }
        $tokens[] = $token;
    }
    return customFetcherUniqueCleanArray($tokens);
}

function customFetcherTokenCoverage($tokens, $haystack)
{
    $tokens = (array) $tokens;
    if (empty($tokens)) {
        return 0.0;
    }
    $haystack = strtolower((string) $haystack);
    if ($haystack === '') {
        return 0.0;
    }
    $hits = 0;
    foreach ($tokens as $token) {
        $token = trim((string) $token);
        if ($token === '') {
            continue;
        }
        if (strpos($haystack, $token) !== false) {
            $hits++;
        }
    }
    return $hits / max(1, count($tokens));
}

function customFetcherLeadContactCompletenessScore($lead)
{
    $email = trim((string) ($lead['email'] ?? ''));
    $phone = trim((string) ($lead['phone'] ?? ''));
    $url = trim((string) ($lead['url'] ?? ''));
    $address = trim((string) ($lead['address'] ?? ''));

    $score = 0.0;
    if ($email !== '') {
        $score += 0.55;
    }
    if ($phone !== '') {
        $score += 0.45;
    }
    if ($url !== '') {
        $score += 0.08;
    }
    if ($address !== '') {
        $score += 0.05;
    }
    if ($email !== '' && $phone !== '') {
        $score += 0.15;
    }
    return min(1.0, $score);
}

function customFetcherLeadRelevanceScore($lead, $service, $baseLocation, $queryLocation = '', $queryText = '')
{
    $name = strtolower(trim((string) ($lead['name'] ?? '')));
    $snippet = strtolower(trim((string) ($lead['snippet'] ?? '')));
    $address = strtolower(trim((string) ($lead['address'] ?? '')));
    $url = strtolower(trim((string) ($lead['url'] ?? '')));
    $displayLink = strtolower(trim((string) ($lead['displayLink'] ?? '')));
    $haystack = trim(implode(' ', [$name, $snippet, $address, $url, $displayLink]));

    if ($haystack === '') {
        return 0.0;
    }

    $serviceText = strtolower(trim((string) $service));
    $locationText = strtolower(trim((string) $baseLocation . ' ' . $queryLocation));
    $queryText = strtolower(trim((string) $queryText));

    $serviceTokens = customFetcherTokenizeText($serviceText);
    $locationTokens = customFetcherTokenizeText($locationText);
    $queryTokens = customFetcherTokenizeText($queryText);

    $score = 0.0;
    if ($serviceText !== '' && strpos($haystack, $serviceText) !== false) {
        $score += 0.35;
    }

    $serviceCoverage = customFetcherTokenCoverage($serviceTokens, $haystack);
    $locationCoverage = customFetcherTokenCoverage($locationTokens, $haystack);
    $queryCoverage = customFetcherTokenCoverage($queryTokens, $haystack);

    $score += min(0.38, $serviceCoverage * 0.38);
    $score += min(0.22, $locationCoverage * 0.22);
    $score += min(0.15, $queryCoverage * 0.15);

    if ($address !== '' && $locationCoverage > 0.0) {
        $score += 0.06;
    }

    if ($name !== '' && $serviceCoverage > 0.0) {
        $score += 0.06;
    }

    return max(0.0, min(1.0, $score));
}

function customFetcherMinimumRelevanceScore($filtersActive, $currentCount, $targetCount, $limit)
{
    $base = 0.18;
    if ($filtersActive) {
        $base += 0.04;
    }
    if ($limit <= 100) {
        $base += 0.03;
    } elseif ($limit >= 1000) {
        $base -= 0.03;
    }

    $needRatio = 1.0;
    if ($targetCount > 0) {
        $needRatio = max(0.0, min(1.0, ($targetCount - $currentCount) / max(1, $targetCount)));
    }
    if ($needRatio < 0.35) {
        $base += 0.08;
    } elseif ($needRatio > 0.80) {
        $base -= 0.04;
    }

    if ($base < 0.08) {
        $base = 0.08;
    }
    if ($base > 0.42) {
        $base = 0.42;
    }
    return $base;
}

function customFetcherPrepareDiscoveredLeads($leads, $service, $baseLocation, $queryLocation, $queryText, $filtersActive, $currentCount, $targetCount, $limit)
{
    if (empty($leads)) {
        return [];
    }

    $minScore = customFetcherMinimumRelevanceScore($filtersActive, (int) $currentCount, (int) $targetCount, (int) $limit);
    $scored = [];

    foreach ((array) $leads as $lead) {
        if (!is_array($lead) || empty($lead['name'])) {
            continue;
        }

        $relevance = customFetcherLeadRelevanceScore($lead, $service, $baseLocation, (string) $queryLocation, (string) $queryText);
        $contact = customFetcherLeadContactCompletenessScore($lead);

        // Keep strongly relevant leads, and allow mildly relevant ones when contacts are present.
        if ($relevance < $minScore && $contact < 0.45) {
            continue;
        }
        if ($relevance < ($minScore * 0.65) && $contact <= 0.0) {
            continue;
        }

        $websiteBonus = trim((string) ($lead['url'] ?? '')) !== '' ? 0.04 : 0.0;
        $addressBonus = trim((string) ($lead['address'] ?? '')) !== '' ? 0.03 : 0.0;
        $rank = ($relevance * 0.72) + ($contact * 0.24) + $websiteBonus + $addressBonus;

        $lead['_cf_rank'] = $rank;
        $lead['_cf_relevance'] = $relevance;
        $scored[] = $lead;
    }

    usort($scored, function ($a, $b) {
        $aRank = (float) ($a['_cf_rank'] ?? 0.0);
        $bRank = (float) ($b['_cf_rank'] ?? 0.0);
        if ($aRank === $bRank) {
            return 0;
        }
        return ($aRank > $bRank) ? -1 : 1;
    });

    foreach ($scored as &$lead) {
        unset($lead['_cf_rank'], $lead['_cf_relevance']);
    }
    unset($lead);

    return $scored;
}

function customFetcherNormalizeBusiness($item, $engine, $sourceName)
{
    $websiteUrl = '';
    $name = '';
    $address = '';
    $phone = '';
    $rating = null;
    $reviews = null;
    $snippet = '';

    if ($engine === 'serper_places') {
        $name = $item['title'] ?? ($item['name'] ?? '');
        $websiteUrl = $item['website'] ?? ($item['link'] ?? '');
        $address = $item['address'] ?? '';
        $phone = $item['phone'] ?? ($item['phoneNumber'] ?? '');
        $rating = $item['rating'] ?? null;
        $reviews = $item['reviews'] ?? ($item['ratingCount'] ?? null);
        $snippet = $item['description'] ?? ($item['category'] ?? ($item['type'] ?? ''));
    } elseif ($engine === 'serper_organic') {
        $name = $item['title'] ?? ($item['name'] ?? '');
        $websiteUrl = $item['link'] ?? ($item['url'] ?? '');
        $snippet = $item['snippet'] ?? '';
        $phone = customFetcherExtractPhoneFromText($snippet);
    } elseif ($engine === 'google_maps') {
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
                if (is_scalar($value))
                    return (string) $value;
                if (is_array($value))
                    return (string) ($value['title'] ?? $value['name'] ?? '');
                return '';
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
    } elseif ($engine === 'google_custom') {
        $name = $item['title'] ?? '';
        $websiteUrl = $item['link'] ?? '';
        $snippet = $item['snippet'] ?? '';
        $phone = customFetcherExtractPhoneFromText($snippet);
    } elseif ($engine === 'bing_web') {
        $name = $item['name'] ?? '';
        $websiteUrl = $item['url'] ?? '';
        $snippet = $item['snippet'] ?? '';
        $phone = customFetcherExtractPhoneFromText($snippet);
    } elseif ($engine === 'no_key') {
        $name = $item['title'] ?? ($item['name'] ?? '');
        $websiteUrl = $item['link'] ?? ($item['url'] ?? '');
        $snippet = $item['snippet'] ?? '';
        $phone = customFetcherExtractPhoneFromText($snippet);
    }

    if ($name === '') {
        return null;
    }

    if ($phone === '' || $phone === null) {
        $phone = customFetcherExtractPhoneFromText($snippet);
    }
    $email = customFetcherExtractEmailFromText($snippet);
    $websiteAnalysis = customFetcherQuickWebsiteCheck($websiteUrl, ($snippet . ' ' . $name));

    // Zero-cost: extract social links from snippet text (Serper often includes them)
    $snippetSocials = customFetcherExtractSocialLinks($snippet . ' ' . ($item['description'] ?? ''));

    $lead = [
        'id' => generateId('cst_'),
        'name' => $name,
        'url' => $websiteUrl,
        'snippet' => $snippet,
        'displayLink' => parse_url($websiteUrl, PHP_URL_HOST) ?? '',
        'address' => $address,
        'phone' => $phone ?: '',
        'email' => $email ?: '',
        'rating' => $rating,
        'reviews' => $reviews,
        'source' => $sourceName,
        'sources' => [$sourceName],
        'websiteAnalysis' => $websiteAnalysis,
    ];

    // Pre-populate enrichment with any socials found in snippets
    if (!empty($snippetSocials)) {
        $lead['enrichment'] = [
            'emails' => $email ? [$email] : [],
            'phones' => $phone ? [$phone] : [],
            'socials' => $snippetSocials,
            'hasEmail' => !empty($email),
            'hasPhone' => !empty($phone),
            'hasSocials' => true,
            'sources' => ['snippet_extraction'],
            'scrapedAt' => gmdate('c'),
            'isCatchAll' => false,
        ];
    }

    return $lead;
}

function customFetcherExtractEmailFromText($text)
{
    if (!is_string($text) || $text === '')
        return '';
    $emails = extractEmails($text);
    return !empty($emails) ? (string) $emails[0] : '';
}

function customFetcherQuickWebsiteCheck($url, $hintText = '')
{
    if (empty($url)) {
        return [
            'hasWebsite' => false,
            'platform' => null,
            'needsUpgrade' => true,
            'issues' => ['No website found'],
            'mobileScore' => null,
            'loadTime' => null,
        ];
    }

    $host = strtolower((string) (parse_url($url, PHP_URL_HOST) ?? ''));
    $hint = strtolower((string) $hintText);
    $signals = trim($host . ' ' . $hint);
    $platform = null;
    $needsUpgrade = false;
    $issues = [];

    if (strpos($signals, 'wix') !== false || strpos($signals, 'wixsite') !== false) {
        $platform = 'wix';
        $needsUpgrade = true;
        $issues[] = 'Using Wix template';
    } elseif (strpos($signals, 'squarespace') !== false) {
        $platform = 'squarespace';
        $needsUpgrade = true;
        $issues[] = 'Using Squarespace template';
    } elseif (strpos($signals, 'weebly') !== false) {
        $platform = 'weebly';
        $needsUpgrade = true;
        $issues[] = 'Using Weebly builder';
    } elseif (strpos($signals, 'godaddy') !== false) {
        $platform = 'godaddy';
        $needsUpgrade = true;
        $issues[] = 'Using GoDaddy site builder';
    } elseif (strpos($signals, 'wordpress') !== false || strpos($signals, 'wp-content') !== false || strpos($signals, 'wp-json') !== false) {
        $platform = 'wordpress';
    } elseif (strpos($signals, 'shopify') !== false) {
        $platform = 'shopify';
    } elseif (strpos($signals, 'joomla') !== false) {
        $platform = 'joomla';
        $needsUpgrade = true;
        $issues[] = 'Using Joomla CMS';
    } elseif (strpos($signals, 'drupal') !== false) {
        $platform = 'drupal';
        $needsUpgrade = true;
        $issues[] = 'Using Drupal CMS';
    }

    return [
        'hasWebsite' => true,
        'platform' => $platform,
        'needsUpgrade' => $needsUpgrade,
        'issues' => $issues,
        'mobileScore' => null,
        'loadTime' => null,
    ];
}

function customFetcherExtractPhoneFromText($text)
{
    if (!is_string($text) || $text === '')
        return '';
    $phones = extractPhoneNumbers($text);
    return !empty($phones) ? (string) $phones[0] : '';
}

function customFetcherSearchSerperPlaces($query, $limit)
{
    if (!defined('SERPER_API_KEY') || trim((string) SERPER_API_KEY) === '' || $limit <= 0) {
        return [];
    }
    $timeout = customFetcherDiscoveryTimeout();
    $payload = json_encode([
        'q' => $query,
        'gl' => 'us',
        'hl' => 'en',
    ]);
    $headers = [
        'X-API-KEY: ' . SERPER_API_KEY,
        'Content-Type: application/json',
    ];
    $includeMaps = customFetcherSerperIncludeMaps();

    $multi = curl_multi_init();
    $placesHandle = curl_init();
    curl_setopt_array($placesHandle, [
        CURLOPT_URL => 'https://google.serper.dev/places',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => min(3, $timeout),
        CURLOPT_HTTPHEADER => $headers,
    ]);
    curl_multi_add_handle($multi, $placesHandle);

    $mapsHandle = null;
    if ($includeMaps) {
        $mapsHandle = curl_init();
        curl_setopt_array($mapsHandle, [
            CURLOPT_URL => 'https://google.serper.dev/maps',
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => min(3, $timeout),
            CURLOPT_HTTPHEADER => $headers,
        ]);
        curl_multi_add_handle($multi, $mapsHandle);
    }

    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 0.6);
        }
    } while ($running && $status === CURLM_OK);

    $parseSerperPlaces = function ($body, $sourceName, $cap) {
        $rows = [];
        if (!is_string($body) || $body === '') {
            return $rows;
        }
        $json = json_decode($body, true);
        $places = is_array($json) && isset($json['places']) && is_array($json['places']) ? $json['places'] : [];
        foreach ($places as $item) {
            if (count($rows) >= $cap) {
                break;
            }
            $biz = customFetcherNormalizeBusiness($item, 'serper_places', $sourceName);
            if ($biz) {
                $rows[] = $biz;
            }
        }
        return $rows;
    };

    $results = [];
    $placesCode = (int) curl_getinfo($placesHandle, CURLINFO_HTTP_CODE);
    $placesBody = (string) curl_multi_getcontent($placesHandle);
    if ($placesCode === 200) {
        $results = array_merge($results, $parseSerperPlaces($placesBody, 'Serper Places', $limit));
    }
    curl_multi_remove_handle($multi, $placesHandle);
    curl_close($placesHandle);

    if ($mapsHandle) {
        $mapsCode = (int) curl_getinfo($mapsHandle, CURLINFO_HTTP_CODE);
        $mapsBody = (string) curl_multi_getcontent($mapsHandle);
        if ($mapsCode === 200) {
            $results = array_merge($results, $parseSerperPlaces($mapsBody, 'Serper Maps', $limit));
        }
        curl_multi_remove_handle($multi, $mapsHandle);
        curl_close($mapsHandle);
    }

    curl_multi_close($multi);
    $results = customFetcherDedupeDiscoveryLeads($results, $limit);

    // For higher-volume runs, use organic fallback when maps/places underfill.
    $needsOrganicTopup = customFetcherSerperOrganicTopupEnabled() || $limit >= 80;
    if ($needsOrganicTopup && count($results) < $limit) {
        $organic = customFetcherSearchSerperOrganic($query, $limit - count($results));
        $results = customFetcherDedupeDiscoveryLeads(array_merge($results, $organic), $limit);
    }

    return $results;
}

function customFetcherDiscoverSerperPlacesChunk($queryChunk, $perQueryLimit)
{
    if (!defined('SERPER_API_KEY') || trim((string) SERPER_API_KEY) === '' || $perQueryLimit <= 0) {
        return [];
    }
    if (empty($queryChunk)) {
        return [];
    }

    $timeout = customFetcherDiscoveryTimeout();
    $includeMaps = customFetcherSerperIncludeMaps();
    $multi = curl_multi_init();
    $handleMap = [];
    $queryMeta = [];
    $queryRows = [];

    foreach ($queryChunk as $qIdx => $queryData) {
        $query = trim((string) ($queryData['query'] ?? ''));
        if ($query === '') {
            continue;
        }
        $queryMeta[$qIdx] = [
            'queryData' => $queryData,
            'query' => $query,
        ];
        $queryRows[$qIdx] = [];

        $payload = json_encode([
            'q' => $query,
            'gl' => 'us',
            'hl' => 'en',
        ]);
        $headers = [
            'X-API-KEY: ' . SERPER_API_KEY,
            'Content-Type: application/json',
        ];

        $placesHandle = curl_init();
        curl_setopt_array($placesHandle, [
            CURLOPT_URL => 'https://google.serper.dev/places',
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => min(3, $timeout),
            CURLOPT_HTTPHEADER => $headers,
        ]);
        curl_multi_add_handle($multi, $placesHandle);
        $handleMap[(int) $placesHandle] = [
            'handle' => $placesHandle,
            'queryIndex' => $qIdx,
            'kind' => 'places',
        ];

        if ($includeMaps) {
            $mapsHandle = curl_init();
            curl_setopt_array($mapsHandle, [
                CURLOPT_URL => 'https://google.serper.dev/maps',
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => min(3, $timeout),
                CURLOPT_HTTPHEADER => $headers,
            ]);
            curl_multi_add_handle($multi, $mapsHandle);
            $handleMap[(int) $mapsHandle] = [
                'handle' => $mapsHandle,
                'queryIndex' => $qIdx,
                'kind' => 'maps',
            ];
        }
    }

    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 0.6);
        }
    } while ($running && $status === CURLM_OK);

    foreach ($handleMap as $meta) {
        $ch = $meta['handle'];
        $qIdx = (int) ($meta['queryIndex'] ?? -1);
        $kind = (string) ($meta['kind'] ?? 'places');
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = (string) curl_multi_getcontent($ch);

        if ($qIdx >= 0 && isset($queryRows[$qIdx]) && $httpCode === 200 && $body !== '') {
            $json = json_decode($body, true);
            $places = is_array($json) && isset($json['places']) && is_array($json['places']) ? $json['places'] : [];
            $sourceName = $kind === 'maps' ? 'Serper Maps' : 'Serper Places';
            foreach ($places as $item) {
                if (count($queryRows[$qIdx]) >= ($perQueryLimit * 2)) {
                    break;
                }
                $biz = customFetcherNormalizeBusiness($item, 'serper_places', $sourceName);
                if ($biz) {
                    $queryRows[$qIdx][] = $biz;
                }
            }
        }

        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);

    $out = [];
    foreach ($queryChunk as $qIdx => $queryData) {
        $results = customFetcherDedupeDiscoveryLeads($queryRows[$qIdx] ?? [], $perQueryLimit);
        $query = (string) ($queryMeta[$qIdx]['query'] ?? ($queryData['query'] ?? ''));
        $needsOrganicTopup = customFetcherSerperOrganicTopupEnabled() || $perQueryLimit >= 80;
        if ($query !== '' && $needsOrganicTopup && count($results) < $perQueryLimit) {
            $organic = customFetcherSearchSerperOrganic($query, $perQueryLimit - count($results));
            $results = customFetcherDedupeDiscoveryLeads(array_merge($results, $organic), $perQueryLimit);
        }

        $out[] = [
            'query' => $queryData,
            'discovered' => $results,
        ];
    }

    return $out;
}

function customFetcherSearchSerperOrganic($query, $limit)
{
    if (!defined('SERPER_API_KEY') || trim((string) SERPER_API_KEY) === '' || $limit <= 0) {
        return [];
    }

    $response = curlRequest('https://google.serper.dev/search', [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'q' => $query,
            'num' => min(100, max(10, (int) $limit)),
            'gl' => 'us',
            'hl' => 'en',
        ]),
        CURLOPT_HTTPHEADER => [
            'X-API-KEY: ' . SERPER_API_KEY,
            'Content-Type: application/json',
        ],
    ], customFetcherDiscoveryTimeout());

    if ((int) ($response['httpCode'] ?? 0) !== 200) {
        return [];
    }

    $json = json_decode((string) ($response['response'] ?? ''), true);
    $organic = is_array($json) && isset($json['organic']) && is_array($json['organic']) ? $json['organic'] : [];
    $results = [];
    foreach ($organic as $item) {
        if (count($results) >= $limit)
            break;
        $biz = customFetcherNormalizeBusiness($item, 'serper_organic', 'Serper');
        if ($biz)
            $results[] = $biz;
    }

    return customFetcherDedupeDiscoveryLeads($results, $limit);
}

function customFetcherDecodeNoKeyResultUrl($url)
{
    $url = trim(html_entity_decode((string) $url, ENT_QUOTES | ENT_HTML5));
    if ($url === '')
        return '';
    if (strpos($url, '//') === 0) {
        $url = 'https:' . $url;
    }

    $parsed = parse_url($url);
    if ($parsed && !empty($parsed['host']) && stripos($parsed['host'], 'duckduckgo.com') !== false) {
        parse_str((string) ($parsed['query'] ?? ''), $q);
        if (!empty($q['uddg'])) {
            $url = urldecode((string) $q['uddg']);
        }
    }

    if (!preg_match('/^https?:\/\//i', $url)) {
        return '';
    }
    return filter_var($url, FILTER_VALIDATE_URL) ? $url : '';
}

function customFetcherParseDuckDuckGoHtml($html, $limit)
{
    if (!is_string($html) || $html === '')
        return [];
    $results = [];

    preg_match_all('/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/is', $html, $linkMatches, PREG_SET_ORDER);
    preg_match_all('/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>(.*?)<\/a>|<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>(.*?)<\/div>/is', $html, $snippetMatches, PREG_SET_ORDER);

    foreach ($linkMatches as $idx => $match) {
        if (count($results) >= $limit)
            break;
        $candidateUrl = customFetcherDecodeNoKeyResultUrl($match[1] ?? '');
        if ($candidateUrl === '' || !customFetcherIsLikelyBusinessWebsite($candidateUrl))
            continue;

        $title = trim(html_entity_decode(strip_tags((string) ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5));
        if ($title === '')
            continue;

        $snippetRaw = (string) ($snippetMatches[$idx][1] ?? $snippetMatches[$idx][2] ?? '');
        $snippet = trim(html_entity_decode(strip_tags($snippetRaw), ENT_QUOTES | ENT_HTML5));

        $results[] = [
            'title' => $title,
            'link' => $candidateUrl,
            'snippet' => $snippet,
        ];
    }

    return $results;
}

function customFetcherParseBingHtml($html, $limit)
{
    if (!is_string($html) || $html === '')
        return [];
    $results = [];
    preg_match_all('/<li[^>]+class="[^"]*b_algo[^"]*"[^>]*>.*?<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a><\/h2>.*?(?:<p>(.*?)<\/p>)?/is', $html, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        if (count($results) >= $limit)
            break;
        $candidateUrl = customFetcherDecodeNoKeyResultUrl($match[1] ?? '');
        if ($candidateUrl === '' || !customFetcherIsLikelyBusinessWebsite($candidateUrl))
            continue;

        $title = trim(html_entity_decode(strip_tags((string) ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5));
        if ($title === '')
            continue;

        $snippet = trim(html_entity_decode(strip_tags((string) ($match[3] ?? '')), ENT_QUOTES | ENT_HTML5));
        $results[] = [
            'title' => $title,
            'link' => $candidateUrl,
            'snippet' => $snippet,
        ];
    }

    return $results;
}

function customFetcherParseGoogleHtml($html, $limit)
{
    if (!is_string($html) || $html === '')
        return [];
    $results = [];

    // Google organic results: <div class="g"> blocks with <h3> and <a href>
    preg_match_all('/<div[^>]+class="[^"]*\bg\b[^"]*"[^>]*>(.*?)<\/div>\s*(?=<div[^>]+class="[^"]*\bg\b|$)/is', $html, $divMatches);
    if (empty($divMatches[1])) {
        // Fallback: try capturing <a href> + <h3> pairs directly
        preg_match_all('/<a[^>]+href="(\/url\?q=([^&"]+)[^"]*|https?:\/\/[^"]+)"[^>]*>.*?<h3[^>]*>(.*?)<\/h3>/is', $html, $fallback, PREG_SET_ORDER);
        foreach ($fallback as $match) {
            if (count($results) >= $limit)
                break;
            $rawUrl = !empty($match[2]) ? urldecode($match[2]) : ($match[1] ?? '');
            $candidateUrl = customFetcherDecodeNoKeyResultUrl($rawUrl);
            if ($candidateUrl === '' || !customFetcherIsLikelyBusinessWebsite($candidateUrl))
                continue;
            $title = trim(html_entity_decode(strip_tags((string) ($match[3] ?? '')), ENT_QUOTES | ENT_HTML5));
            if ($title === '')
                continue;
            $results[] = ['title' => $title, 'link' => $candidateUrl, 'snippet' => ''];
        }
        return $results;
    }

    foreach ($divMatches[1] as $block) {
        if (count($results) >= $limit)
            break;
        // Extract URL
        if (!preg_match('/<a[^>]+href="(\/url\?q=([^&"]+)[^"]*|https?:\/\/[^"]+)"[^>]*>/is', $block, $urlMatch))
            continue;
        $rawUrl = !empty($urlMatch[2]) ? urldecode($urlMatch[2]) : ($urlMatch[1] ?? '');
        $candidateUrl = customFetcherDecodeNoKeyResultUrl($rawUrl);
        if ($candidateUrl === '' || !customFetcherIsLikelyBusinessWebsite($candidateUrl))
            continue;

        // Extract title from <h3>
        if (!preg_match('/<h3[^>]*>(.*?)<\/h3>/is', $block, $titleMatch))
            continue;
        $title = trim(html_entity_decode(strip_tags((string) ($titleMatch[1] ?? '')), ENT_QUOTES | ENT_HTML5));
        if ($title === '')
            continue;

        // Extract snippet
        $snippet = '';
        if (preg_match('/<(?:span|div)[^>]+class="[^"]*(?:st|VwiC3b|IsZvec)[^"]*"[^>]*>(.*?)<\/(?:span|div)>/is', $block, $snippetMatch)) {
            $snippet = trim(html_entity_decode(strip_tags((string) ($snippetMatch[1] ?? '')), ENT_QUOTES | ENT_HTML5));
        }

        $results[] = ['title' => $title, 'link' => $candidateUrl, 'snippet' => $snippet];
    }

    return $results;
}

function customFetcherParseStartpageHtml($html, $limit)
{
    if (!is_string($html) || $html === '')
        return [];
    $results = [];

    // Startpage uses .w-gl__result containers or .result class
    preg_match_all('/<a[^>]+class="[^"]*w-gl__result-url[^"]*"[^>]+href="([^"]+)"[^>]*>/is', $html, $urlMatches, PREG_SET_ORDER);
    preg_match_all('/<h3[^>]*class="[^"]*w-gl__result-title[^"]*"[^>]*>(.*?)<\/h3>/is', $html, $titleMatches, PREG_SET_ORDER);
    preg_match_all('/<p[^>]*class="[^"]*w-gl__description[^"]*"[^>]*>(.*?)<\/p>/is', $html, $snippetMatches, PREG_SET_ORDER);

    $count = min(count($urlMatches), count($titleMatches));
    for ($i = 0; $i < $count; $i++) {
        if (count($results) >= $limit)
            break;
        $candidateUrl = customFetcherDecodeNoKeyResultUrl($urlMatches[$i][1] ?? '');
        if ($candidateUrl === '' || !customFetcherIsLikelyBusinessWebsite($candidateUrl))
            continue;

        $title = trim(html_entity_decode(strip_tags((string) ($titleMatches[$i][1] ?? '')), ENT_QUOTES | ENT_HTML5));
        if ($title === '')
            continue;

        $snippet = trim(html_entity_decode(strip_tags((string) ($snippetMatches[$i][1] ?? '')), ENT_QUOTES | ENT_HTML5));
        $results[] = ['title' => $title, 'link' => $candidateUrl, 'snippet' => $snippet];
    }

    // Fallback: if structured parsing yields nothing, try generic link+heading extraction
    if (empty($results)) {
        preg_match_all('/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>.*?<h[23][^>]*>(.*?)<\/h[23]>/is', $html, $generic, PREG_SET_ORDER);
        foreach ($generic as $match) {
            if (count($results) >= $limit)
                break;
            $candidateUrl = customFetcherDecodeNoKeyResultUrl($match[1] ?? '');
            if ($candidateUrl === '' || !customFetcherIsLikelyBusinessWebsite($candidateUrl))
                continue;
            $title = trim(html_entity_decode(strip_tags((string) ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5));
            if ($title === '')
                continue;
            $results[] = ['title' => $title, 'link' => $candidateUrl, 'snippet' => ''];
        }
    }

    return $results;
}

function customFetcherDedupeDiscoveryLeads($leads, $limit)
{
    $unique = [];
    $seen = [];
    foreach ((array) $leads as $lead) {
        if (!is_array($lead) || empty($lead['name']))
            continue;
        $key = buildBusinessDedupeKey($lead, '');
        if (isset($seen[$key]))
            continue;
        $seen[$key] = true;
        $unique[] = $lead;
        if (count($unique) >= $limit)
            break;
    }
    return $unique;
}

function customFetcherNoKeyProviders()
{
    return [
        'duckduckgo' => [
            'label' => 'No-Key DuckDuckGo',
            'url_builder' => function ($query) {
                return 'https://duckduckgo.com/html/?q=' . urlencode((string) $query);
            },
            'parser' => 'customFetcherParseDuckDuckGoHtml',
        ],
        'bing_html' => [
            'label' => 'No-Key Bing HTML',
            'url_builder' => function ($query) {
                return 'https://www.bing.com/search?q=' . urlencode((string) $query);
            },
            'parser' => 'customFetcherParseBingHtml',
        ],
        'google_html' => [
            'label' => 'No-Key Google HTML',
            'url_builder' => function ($query) {
                return 'https://www.google.com/search?q=' . urlencode((string) $query) . '&num=20&hl=en';
            },
            'parser' => 'customFetcherParseGoogleHtml',
        ],
        'startpage' => [
            'label' => 'No-Key Startpage',
            'url_builder' => function ($query) {
                return 'https://www.startpage.com/do/dsearch?query=' . urlencode((string) $query) . '&cat=web&language=english';
            },
            'parser' => 'customFetcherParseStartpageHtml',
        ],
    ];
}

function customFetcherRotateNoKeyProviders($providers, $seed)
{
    if (empty($providers) || count($providers) <= 1) {
        return $providers;
    }
    $keys = array_keys($providers);
    $seedHash = sprintf('%u', crc32(strtolower(trim((string) $seed))));
    $offset = (int) ($seedHash % max(1, count($keys)));
    $rotated = [];
    $keyCount = count($keys);
    for ($i = 0; $i < $keyCount; $i++) {
        $providerKey = $keys[($offset + $i) % $keyCount];
        if (isset($providers[$providerKey])) {
            $rotated[$providerKey] = $providers[$providerKey];
        }
    }
    return $rotated;
}

function customFetcherNoKeyProviderRuntimeState($providerKey)
{
    $providerKey = trim((string) $providerKey);
    if ($providerKey === '') {
        return [
            'cooldown_until_ms' => 0,
            'fail_streak' => 0,
            'blocked_count' => 0,
            'success_count' => 0,
        ];
    }
    if (!isset($GLOBALS['__custom_fetch_no_key_provider_runtime']) || !is_array($GLOBALS['__custom_fetch_no_key_provider_runtime'])) {
        $GLOBALS['__custom_fetch_no_key_provider_runtime'] = [];
    }
    if (!isset($GLOBALS['__custom_fetch_no_key_provider_runtime'][$providerKey])) {
        $GLOBALS['__custom_fetch_no_key_provider_runtime'][$providerKey] = [
            'cooldown_until_ms' => 0,
            'fail_streak' => 0,
            'blocked_count' => 0,
            'success_count' => 0,
        ];
    }
    return $GLOBALS['__custom_fetch_no_key_provider_runtime'][$providerKey];
}

function customFetcherNoKeyProviderRuntimeStateSet($providerKey, $state)
{
    $providerKey = trim((string) $providerKey);
    if ($providerKey === '') {
        return;
    }
    if (!isset($GLOBALS['__custom_fetch_no_key_provider_runtime']) || !is_array($GLOBALS['__custom_fetch_no_key_provider_runtime'])) {
        $GLOBALS['__custom_fetch_no_key_provider_runtime'] = [];
    }
    $GLOBALS['__custom_fetch_no_key_provider_runtime'][$providerKey] = $state;
}

function customFetcherNoKeyProviderIsCoolingDown($providerKey)
{
    $state = customFetcherNoKeyProviderRuntimeState($providerKey);
    $nowMs = (int) round(microtime(true) * 1000);
    return ((int) ($state['cooldown_until_ms'] ?? 0)) > $nowMs;
}

function customFetcherNoKeyProviderMarkSuccess($providerKey)
{
    $state = customFetcherNoKeyProviderRuntimeState($providerKey);
    $state['success_count'] = (int) ($state['success_count'] ?? 0) + 1;
    $state['fail_streak'] = 0;
    $state['cooldown_until_ms'] = 0;
    customFetcherNoKeyProviderRuntimeStateSet($providerKey, $state);
}

function customFetcherNoKeyProviderMarkFailed($providerKey, $backoffMs)
{
    $state = customFetcherNoKeyProviderRuntimeState($providerKey);
    $nowMs = (int) round(microtime(true) * 1000);
    $failStreak = min(10, (int) ($state['fail_streak'] ?? 0) + 1);
    $penalty = max(150, (int) ceil($backoffMs * 0.6));
    $penalty *= max(1, (int) floor($failStreak / 2));
    $state['fail_streak'] = $failStreak;
    $state['cooldown_until_ms'] = max((int) ($state['cooldown_until_ms'] ?? 0), $nowMs + min(12000, $penalty));
    customFetcherNoKeyProviderRuntimeStateSet($providerKey, $state);
}

function customFetcherNoKeyProviderMarkBlocked($providerKey, $backoffMs, $attempt)
{
    $state = customFetcherNoKeyProviderRuntimeState($providerKey);
    $nowMs = (int) round(microtime(true) * 1000);
    $failStreak = min(12, (int) ($state['fail_streak'] ?? 0) + 2);
    $state['blocked_count'] = (int) ($state['blocked_count'] ?? 0) + 1;
    $state['fail_streak'] = $failStreak;
    $multiplier = max(1, (int) $attempt + 1) * max(1, (int) floor($failStreak / 2));
    $penalty = max(350, (int) $backoffMs) * $multiplier;
    $state['cooldown_until_ms'] = max((int) ($state['cooldown_until_ms'] ?? 0), $nowMs + min(25000, $penalty));
    customFetcherNoKeyProviderRuntimeStateSet($providerKey, $state);
}

function customFetcherNoKeyLooksBlocked($httpCode, $body)
{
    $httpCode = (int) $httpCode;
    if (in_array($httpCode, [403, 429, 503], true)) {
        return true;
    }
    $text = strtolower(substr((string) $body, 0, 2500));
    if ($text === '')
        return false;
    $needles = [
        'captcha',
        'unusual traffic',
        'automated queries',
        'verify you are human',
        'access denied',
        'temporarily blocked',
    ];
    foreach ($needles as $needle) {
        if (strpos($text, $needle) !== false)
            return true;
    }
    return false;
}

function customFetcherRunNoKeyRequests($requests, $timeout)
{
    if (empty($requests))
        return [];
    $timeout = max(2, (int) $timeout);
    $multi = curl_multi_init();
    $handleMap = [];

    foreach ($requests as $requestId => $request) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => (string) $request['url'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => max(1, min(2, $timeout - 1)),
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_NOSIGNAL => true,
            CURLOPT_HTTPHEADER => [
                'User-Agent: BamLead-NoKeyDiscovery/1.0',
                'Accept-Language: en-US,en;q=0.9',
            ],
        ]);
        curl_multi_add_handle($multi, $ch);
        $handleMap[(int) $ch] = ['handle' => $ch, 'requestId' => $requestId];
    }

    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 0.8);
        }
    } while ($running && $status === CURLM_OK);

    $responses = [];
    foreach ($handleMap as $meta) {
        $ch = $meta['handle'];
        $responses[$meta['requestId']] = [
            'httpCode' => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
            'body' => (string) curl_multi_getcontent($ch),
            'curlErrNo' => (int) curl_errno($ch),
            'curlError' => (string) curl_error($ch),
        ];
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);
    return $responses;
}

function customFetcherSearchNoKeyWithPolicy($query, $limit, $timeout, $retries, $backoffMs, &$stats = null)
{
    $stats = [
        'provider_success' => 0,
        'provider_fail' => 0,
        'provider_blocked' => 0,
    ];
    if ($limit <= 0)
        return [];
    $providers = customFetcherRotateNoKeyProviders(customFetcherNoKeyProviders(), $query);
    $results = [];
    $seen = [];
    $pending = [];
    $coolingDown = [];

    foreach ($providers as $providerKey => $provider) {
        if (customFetcherNoKeyProviderIsCoolingDown($providerKey)) {
            $coolingDown[] = [
                'providerKey' => $providerKey,
                'provider' => $provider,
            ];
            continue;
        }
        $pending[] = [
            'providerKey' => $providerKey,
            'provider' => $provider,
            'attempt' => 0,
        ];
    }
    if (empty($pending)) {
        foreach ($coolingDown as $item) {
            $pending[] = [
                'providerKey' => $item['providerKey'],
                'provider' => $item['provider'],
                'attempt' => 0,
            ];
            if (count($pending) >= 2) {
                break;
            }
        }
    }

    $retries = max(0, (int) $retries);
    $backoffMs = max(0, (int) $backoffMs);

    while (!empty($pending) && count($results) < $limit) {
        $requestMap = [];
        foreach ($pending as $idx => $task) {
            $builder = $task['provider']['url_builder'];
            $requestMap[$idx] = [
                'url' => $builder($query),
                'task' => $task,
            ];
        }
        $responses = customFetcherRunNoKeyRequests($requestMap, $timeout);
        $nextPending = [];

        foreach ($requestMap as $idx => $request) {
            $task = $request['task'];
            $provider = $task['provider'];
            $response = $responses[$idx] ?? ['httpCode' => 0, 'body' => '', 'curlErrNo' => 0];
            $httpCode = (int) ($response['httpCode'] ?? 0);
            $body = (string) ($response['body'] ?? '');
            $blocked = customFetcherNoKeyLooksBlocked($httpCode, $body);
            $ok = $httpCode >= 200 && $httpCode < 300 && !$blocked && $body !== '';

            if ($ok) {
                $stats['provider_success']++;
                customFetcherNoKeyProviderMarkSuccess((string) ($task['providerKey'] ?? ''));
                $raw = call_user_func($provider['parser'], $body, $limit);
                foreach ($raw as $item) {
                    if (count($results) >= $limit)
                        break;
                    $biz = customFetcherNormalizeBusiness($item, 'no_key', $provider['label']);
                    if (!$biz)
                        continue;
                    $key = buildBusinessDedupeKey($biz, '');
                    if (isset($seen[$key]))
                        continue;
                    $seen[$key] = true;
                    $results[] = $biz;
                }
                continue;
            }

            if ($blocked) {
                $stats['provider_blocked']++;
                customFetcherNoKeyProviderMarkBlocked((string) ($task['providerKey'] ?? ''), $backoffMs, (int) ($task['attempt'] ?? 0));
            } else {
                $stats['provider_fail']++;
                customFetcherNoKeyProviderMarkFailed((string) ($task['providerKey'] ?? ''), $backoffMs);
            }

            $attempt = (int) $task['attempt'] + 1;
            if ($attempt <= $retries) {
                $task['attempt'] = $attempt;
                $nextPending[] = $task;
            }
        }

        if (!empty($nextPending) && $backoffMs > 0) {
            usleep((int) ($backoffMs * 1000));
        }
        $pending = $nextPending;
    }

    return customFetcherDedupeDiscoveryLeads($results, $limit);
}

function customFetcherSearchNoKey($query, $limit)
{
    $stats = [];
    return customFetcherSearchNoKeyWithPolicy(
        $query,
        $limit,
        customFetcherNoKeyProviderTimeout(),
        customFetcherNoKeyProviderRetries(),
        customFetcherNoKeyBlockBackoffMs(),
        $stats
    );
}

function customFetcherDiscoverNoKeyChunk($queryChunk, $perQueryLimit, $timeout, $retries, $backoffMs)
{
    $out = [];
    if (empty($queryChunk))
        return $out;
    $providers = customFetcherNoKeyProviders();
    $pending = [];
    $queryLeads = [];
    $querySeen = [];
    $queryStats = [];
    $queryDone = [];

    foreach ($queryChunk as $qIdx => $queryData) {
        $query = (string) ($queryData['query'] ?? '');
        if ($query === '')
            continue;
        $queryLeads[$qIdx] = [];
        $querySeen[$qIdx] = [];
        $queryDone[$qIdx] = false;
        $queryStats[$qIdx] = [
            'provider_success' => 0,
            'provider_fail' => 0,
            'provider_blocked' => 0,
        ];
        $rotatedProviders = customFetcherRotateNoKeyProviders($providers, $query);
        $activeProviders = [];
        $coolingProviders = [];
        foreach ($rotatedProviders as $providerKey => $provider) {
            if (customFetcherNoKeyProviderIsCoolingDown($providerKey)) {
                $coolingProviders[$providerKey] = $provider;
                continue;
            }
            $activeProviders[$providerKey] = $provider;
        }
        if (empty($activeProviders)) {
            foreach ($coolingProviders as $providerKey => $provider) {
                $activeProviders[$providerKey] = $provider;
                if (count($activeProviders) >= 2) {
                    break;
                }
            }
        }

        foreach ($activeProviders as $providerKey => $provider) {
            $pending[] = [
                'queryIndex' => $qIdx,
                'queryData' => $queryData,
                'providerKey' => $providerKey,
                'provider' => $provider,
                'attempt' => 0,
            ];
        }
    }

    $retries = max(0, (int) $retries);
    $backoffMs = max(0, (int) $backoffMs);

    while (!empty($pending)) {
        $requestMap = [];
        foreach ($pending as $idx => $task) {
            $taskQueryIndex = (int) ($task['queryIndex'] ?? -1);
            if ($taskQueryIndex < 0 || !empty($queryDone[$taskQueryIndex])) {
                continue;
            }
            $builder = $task['provider']['url_builder'];
            $requestMap[$idx] = [
                'url' => $builder((string) ($task['queryData']['query'] ?? '')),
                'task' => $task,
            ];
        }
        if (empty($requestMap)) {
            break;
        }
        $responses = customFetcherRunNoKeyRequests($requestMap, $timeout);
        $nextPending = [];

        foreach ($requestMap as $idx => $request) {
            $task = $request['task'];
            $qIdx = (int) $task['queryIndex'];
            if (!isset($queryStats[$qIdx]))
                continue;

            $response = $responses[$idx] ?? ['httpCode' => 0, 'body' => '', 'curlErrNo' => 0];
            $httpCode = (int) ($response['httpCode'] ?? 0);
            $body = (string) ($response['body'] ?? '');
            $blocked = customFetcherNoKeyLooksBlocked($httpCode, $body);
            $ok = $httpCode >= 200 && $httpCode < 300 && !$blocked && $body !== '';

            if ($ok) {
                $queryStats[$qIdx]['provider_success']++;
                customFetcherNoKeyProviderMarkSuccess((string) ($task['providerKey'] ?? ''));
                $rawItems = call_user_func($task['provider']['parser'], $body, $perQueryLimit);
                foreach ($rawItems as $item) {
                    if (count($queryLeads[$qIdx]) >= $perQueryLimit)
                        break;
                    $lead = customFetcherNormalizeBusiness($item, 'no_key', $task['provider']['label']);
                    if (!$lead)
                        continue;
                    $leadKey = buildBusinessDedupeKey($lead, '');
                    if (isset($querySeen[$qIdx][$leadKey]))
                        continue;
                    $querySeen[$qIdx][$leadKey] = true;
                    $queryLeads[$qIdx][] = $lead;
                }
                if (count($queryLeads[$qIdx]) >= $perQueryLimit) {
                    $queryDone[$qIdx] = true;
                }
                continue;
            }

            if ($blocked) {
                $queryStats[$qIdx]['provider_blocked']++;
                customFetcherNoKeyProviderMarkBlocked((string) ($task['providerKey'] ?? ''), $backoffMs, (int) ($task['attempt'] ?? 0));
            } else {
                $queryStats[$qIdx]['provider_fail']++;
                customFetcherNoKeyProviderMarkFailed((string) ($task['providerKey'] ?? ''), $backoffMs);
            }

            $nextAttempt = (int) $task['attempt'] + 1;
            if (empty($queryDone[$qIdx]) && $nextAttempt <= $retries) {
                $task['attempt'] = $nextAttempt;
                $nextPending[] = $task;
            }
        }

        if (!empty($nextPending) && $backoffMs > 0) {
            usleep((int) ($backoffMs * 1000));
        }
        $pending = $nextPending;
    }

    foreach ($queryChunk as $qIdx => $queryData) {
        $out[] = [
            'query' => $queryData,
            'discovered' => array_slice($queryLeads[$qIdx] ?? [], 0, $perQueryLimit),
            'stats' => $queryStats[$qIdx] ?? [
                'provider_success' => 0,
                'provider_fail' => 0,
                'provider_blocked' => 0,
            ],
        ];
    }
    return $out;
}

function customFetcherSearchGoogleCustom($query, $limit)
{
    if (!defined('GOOGLE_API_KEY') || !defined('GOOGLE_SEARCH_ENGINE_ID'))
        return [];
    $key = trim((string) GOOGLE_API_KEY);
    $cx = trim((string) GOOGLE_SEARCH_ENGINE_ID);
    if ($key === '' || $cx === '' || $limit <= 0)
        return [];

    $results = [];
    $start = 1;
    $pageSize = 10;
    while (count($results) < $limit && $start <= 91) {
        $num = min($pageSize, $limit - count($results));
        $url = 'https://www.googleapis.com/customsearch/v1?' . http_build_query([
            'key' => $key,
            'cx' => $cx,
            'q' => $query,
            'num' => $num,
            'start' => $start,
            'gl' => 'us',
            'hl' => 'en',
        ]);
        $resp = curlRequest($url, [], 15);
        if ((int) ($resp['httpCode'] ?? 0) !== 200)
            break;
        $json = json_decode((string) ($resp['response'] ?? ''), true);
        $items = $json['items'] ?? [];
        if (!is_array($items) || empty($items))
            break;
        foreach ($items as $item) {
            if (count($results) >= $limit)
                break;
            $biz = customFetcherNormalizeBusiness($item, 'google_custom', 'Google Search');
            if ($biz)
                $results[] = $biz;
        }
        if (empty($json['queries']['nextPage']))
            break;
        $start += $pageSize;
    }

    return $results;
}

function customFetcherSearchBingWeb($query, $limit)
{
    if (!defined('BING_API_KEY'))
        return [];
    $key = trim((string) BING_API_KEY);
    if ($key === '' || $limit <= 0)
        return [];

    $results = [];
    $offset = 0;
    $batch = 50;
    while (count($results) < $limit && $offset <= 950) {
        $count = min($batch, $limit - count($results));
        $url = 'https://api.bing.microsoft.com/v7.0/search?' . http_build_query([
            'q' => $query,
            'count' => $count,
            'offset' => $offset,
            'mkt' => 'en-US',
            'responseFilter' => 'Webpages',
        ]);
        $resp = curlRequest($url, [
            CURLOPT_HTTPHEADER => [
                'Ocp-Apim-Subscription-Key: ' . $key,
            ],
        ], 15);
        if ((int) ($resp['httpCode'] ?? 0) !== 200)
            break;

        $json = json_decode((string) ($resp['response'] ?? ''), true);
        $items = $json['webPages']['value'] ?? [];
        if (!is_array($items) || empty($items))
            break;
        foreach ($items as $item) {
            if (count($results) >= $limit)
                break;
            $biz = customFetcherNormalizeBusiness($item, 'bing_web', 'Bing Search');
            if ($biz)
                $results[] = $biz;
        }
        if (count($items) < $count)
            break;
        $offset += $count;
    }
    return $results;
}

function customFetcherDiscoverBySources($query, $limit, $sources)
{
    $all = [];
    $seen = [];

    foreach ($sources as $source) {
        if (count($all) >= $limit)
            break;
        $remaining = $limit - count($all);
        $runLimit = $remaining;

        // Keep each source call bounded for lower tail latency per query.
        if ($source === 'serper') {
            $runLimit = min($remaining, 80);
        } elseif ($source === 'no_key') {
            $runLimit = min($remaining, 50);
        }

        $discovered = [];
        if ($source === 'serper') {
            $discovered = customFetcherSearchSerperPlaces($query, $runLimit);
        } elseif ($source === 'google') {
            $discovered = customFetcherSearchGoogleCustom($query, $runLimit);
        } elseif ($source === 'bing') {
            $discovered = customFetcherSearchBingWeb($query, $runLimit);
        } elseif ($source === 'no_key') {
            $discovered = customFetcherSearchNoKey($query, $runLimit);
        }

        foreach ($discovered as $lead) {
            if (count($all) >= $limit)
                break;
            if (!is_array($lead) || empty($lead['name']))
                continue;
            $key = buildBusinessDedupeKey($lead, '');
            if (isset($seen[$key]))
                continue;
            $seen[$key] = true;
            $all[] = $lead;
        }
    }

    return array_slice($all, 0, $limit);
}

function customFetcherNormalizePrimaryPhone($phone)
{
    $phone = trim((string) $phone);
    if ($phone === '')
        return '';
    $digits = preg_replace('/\D+/', '', $phone);
    if (strlen($digits) === 11 && strpos($digits, '1') === 0) {
        $digits = substr($digits, 1);
    }
    if (strlen($digits) !== 10) {
        return $phone;
    }
    return sprintf('(%s) %s-%s', substr($digits, 0, 3), substr($digits, 3, 3), substr($digits, 6));
}

function customFetcherBuildPendingEnrichment($lead)
{
    $email = trim((string) ($lead['email'] ?? ''));
    $phone = trim((string) ($lead['phone'] ?? ''));
    return [
        'emails' => $email !== '' ? [$email] : [],
        'phones' => $phone !== '' ? [$phone] : [],
        'socials' => [],
        'hasEmail' => $email !== '',
        'hasPhone' => $phone !== '',
        'hasSocials' => false,
        'sources' => ['custom_fetcher_discovery'],
        'scrapedAt' => gmdate('c'),
        'isCatchAll' => false,
    ];
}

function customFetcherExtractSocials($html)
{
    if (!is_string($html) || $html === '')
        return [];
    $patterns = [
        'facebook' => '/https?:\/\/(?:www\.)?facebook\.com\/[^\s"\'<>()]+/i',
        'linkedin' => '/https?:\/\/(?:www\.)?linkedin\.com\/[^\s"\'<>()]+/i',
        'instagram' => '/https?:\/\/(?:www\.)?instagram\.com\/[^\s"\'<>()]+/i',
        'youtube' => '/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s"\'<>()]+/i',
        'tiktok' => '/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"\'<>()]+/i',
    ];

    $socials = [];
    foreach ($patterns as $platform => $regex) {
        if (preg_match($regex, $html, $m)) {
            $socials[$platform] = $m[0];
        }
    }
    return $socials;
}

function customFetcherPageUrls($url, $maxPages)
{
    $urls = [];
    $baseUrl = trim((string) $url);
    if ($baseUrl === '')
        return $urls;
    if (!preg_match('/^https?:\/\//i', $baseUrl)) {
        $baseUrl = 'https://' . $baseUrl;
    }
    $parsed = parse_url($baseUrl);
    if (!$parsed || empty($parsed['host']))
        return $urls;
    $scheme = $parsed['scheme'] ?? 'https';
    $host = $parsed['host'];
    $root = $scheme . '://' . $host;

    $paths = [
        '',              // homepage
        '/contact',      // contact page
        '/contact-us',
        '/contactus',
        '/connect',
        '/about',
        '/about-us',
        '/aboutus',
        '/about-me',
        '/team',
        '/our-team',
        '/support',
        '/get-in-touch',
        '/reach-us',
        '/locations',
        '/footer',       // some SPAs expose footer content here
        '/info',
        '/help',
    ];
    $paths = array_slice($paths, 0, max(1, $maxPages));
    foreach ($paths as $path) {
        $urls[] = $root . $path;
    }
    return customFetcherUniqueCleanArray($urls);
}

function customFetcherQuickProbeCacheKeyForUrl($url)
{
    $baseUrl = trim((string) $url);
    if ($baseUrl === '')
        return '';
    if (!preg_match('/^https?:\/\//i', $baseUrl)) {
        $baseUrl = 'https://' . $baseUrl;
    }
    $parts = parse_url($baseUrl);
    if (!$parts || empty($parts['host']))
        return '';

    $scheme = strtolower((string) ($parts['scheme'] ?? 'https'));
    $host = strtolower((string) $parts['host']);
    return $scheme . '://' . $host;
}

function customFetcherQuickProbeApplySignals($lead, $emails, $phones, $socials = [])
{
    $emails = customFetcherUniqueCleanArray(array_filter((array) $emails, function ($email) {
        return trim((string) $email) !== '';
    }));
    $phones = customFetcherUniqueCleanArray(array_filter(array_map('customFetcherNormalizePrimaryPhone', (array) $phones), function ($phone) {
        return trim((string) $phone) !== '';
    }));
    $socials = is_array($socials) ? $socials : [];

    $existingEmail = trim((string) ($lead['email'] ?? ''));
    $existingPhone = trim((string) ($lead['phone'] ?? ''));
    if ($existingEmail === '' && !empty($emails)) {
        $lead['email'] = (string) $emails[0];
    }
    if ($existingPhone === '' && !empty($phones)) {
        $lead['phone'] = (string) $phones[0];
    }

    if (!isset($lead['enrichment']) || !is_array($lead['enrichment'])) {
        $lead['enrichment'] = customFetcherBuildPendingEnrichment($lead);
    }

    $baseEmails = isset($lead['enrichment']['emails']) && is_array($lead['enrichment']['emails']) ? $lead['enrichment']['emails'] : [];
    $basePhones = isset($lead['enrichment']['phones']) && is_array($lead['enrichment']['phones']) ? $lead['enrichment']['phones'] : [];
    $baseSocials = isset($lead['enrichment']['socials']) && is_array($lead['enrichment']['socials']) ? $lead['enrichment']['socials'] : [];
    $mergedEmails = customFetcherUniqueCleanArray(array_merge($baseEmails, $emails));
    $mergedPhones = customFetcherUniqueCleanArray(array_merge($basePhones, $phones));
    // Socials are keyed by platform — merge with new values overriding
    $mergedSocials = array_merge($baseSocials, $socials);

    $lead['enrichment']['emails'] = array_slice($mergedEmails, 0, 5);
    $lead['enrichment']['phones'] = array_slice($mergedPhones, 0, 3);
    $lead['enrichment']['socials'] = $mergedSocials;
    $lead['enrichment']['hasEmail'] = !empty($mergedEmails);
    $lead['enrichment']['hasPhone'] = !empty($mergedPhones);
    $lead['enrichment']['hasSocials'] = !empty($mergedSocials);
    $lead['enrichment']['scrapedAt'] = gmdate('c');

    $sources = isset($lead['enrichment']['sources']) && is_array($lead['enrichment']['sources']) ? $lead['enrichment']['sources'] : [];
    $sources[] = 'custom_fetcher_quick_probe';
    $lead['enrichment']['sources'] = array_values(array_unique($sources));

    return $lead;
}

/**
 * Extract social media profile URLs from HTML body.
 * Returns associative array: ['facebook' => 'url', 'instagram' => 'url', ...]
 * Zero-cost: runs regex on already-fetched HTML, no extra HTTP calls.
 */
function customFetcherExtractSocialLinks($html)
{
    $socials = [];
    $patterns = [
        'facebook'  => '/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._\-]{2,}(?:\/)?/i',
        'instagram' => '/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]{2,}(?:\/)?/i',
        'linkedin'  => '/https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9._\-]{2,}(?:\/)?/i',
        'twitter'   => '/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]{1,15}(?:\/)?/i',
        'youtube'   => '/https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|c\/|user\/)[a-zA-Z0-9._\-]{2,}(?:\/)?/i',
        'tiktok'    => '/https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._]{2,}(?:\/)?/i',
        'yelp'      => '/https?:\/\/(?:www\.)?yelp\.com\/biz\/[a-zA-Z0-9._\-]{2,}(?:\/)?/i',
    ];
    $excludeFragments = ['/sharer', '/share', '/intent/', '/dialog/', '/plugins/', '/login', '/signup', '/help', '/about', '/policies', '/terms', '/privacy', '/legal'];

    foreach ($patterns as $platform => $regex) {
        if (isset($socials[$platform])) continue; // first match wins
        if (preg_match_all($regex, $html, $matches)) {
            foreach ($matches[0] as $url) {
                $urlLower = strtolower($url);
                $skip = false;
                foreach ($excludeFragments as $frag) {
                    if (strpos($urlLower, $frag) !== false) { $skip = true; break; }
                }
                if (!$skip) {
                    $socials[$platform] = rtrim($url, '/');
                    break; // one per platform
                }
            }
        }
    }
    return $socials;
}

function customFetcherQuickEmailProbeLeads($leads, $timeout, $concurrency, $maxLeads)
{
    if (empty($leads) || $maxLeads <= 0)
        return $leads;

    $candidateMap = [];
    $networkTasks = [];
    foreach ($leads as $idx => $lead) {
        if (count($candidateMap) >= $maxLeads)
            break;
        $email = trim((string) ($lead['email'] ?? ''));
        $url = trim((string) ($lead['url'] ?? ''));
        if ($email !== '' || $url === '')
            continue;

        $cacheRoot = customFetcherQuickProbeCacheKeyForUrl($url);
        if ($cacheRoot !== '') {
            $cacheKey = 'custom_fetch_quick_probe_' . md5($cacheRoot);
            $cached = getCache($cacheKey);
            if (is_array($cached) && (!empty($cached['emails']) || !empty($cached['phones']) || !empty($cached['socials']))) {
                $leads[$idx] = customFetcherQuickProbeApplySignals(
                    $lead,
                    $cached['emails'] ?? [],
                    $cached['phones'] ?? [],
                    $cached['socials'] ?? []
                );
                continue;
            }
            $candidateMap[$idx] = [
                'cacheKey' => $cacheKey,
                'emails' => [],
                'phones' => [],
                'socials' => [],
            ];
        } else {
            $candidateMap[$idx] = [
                'cacheKey' => '',
                'emails' => [],
                'phones' => [],
                'socials' => [],
            ];
        }

        $pages = customFetcherPageUrls($url, 8);
        foreach ($pages as $pageUrl) {
            $networkTasks[] = [
                'idx' => $idx,
                'url' => $pageUrl,
            ];
        }
    }

    if (empty($networkTasks)) {
        return $leads;
    }

    $multi = curl_multi_init();
    $active = [];
    $taskCursor = 0;
    $taskCount = count($networkTasks);
    $concurrency = max(1, (int) $concurrency);
    $timeout = max(1, (int) $timeout);

    do {
        while (count($active) < $concurrency && $taskCursor < $taskCount) {
            $task = $networkTasks[$taskCursor++];
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $task['url'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language: en-US,en;q=0.9'],
                CURLOPT_ENCODING => '',
            ]);
            curl_multi_add_handle($multi, $ch);
            $active[(int) $ch] = [
                'handle' => $ch,
                'idx' => $task['idx'],
            ];
        }

        do {
            $status = curl_multi_exec($multi, $running);
        } while ($status === CURLM_CALL_MULTI_PERFORM);

        while ($info = curl_multi_info_read($multi)) {
            $ch = $info['handle'];
            $handleId = (int) $ch;
            if (!isset($active[$handleId])) {
                curl_multi_remove_handle($multi, $ch);
                curl_close($ch);
                continue;
            }

            $idx = $active[$handleId]['idx'];
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $body = (string) curl_multi_getcontent($ch);
            if ($httpCode >= 200 && $httpCode < 400 && $body !== '' && isset($candidateMap[$idx])) {
                $candidateMap[$idx]['emails'] = array_merge($candidateMap[$idx]['emails'], extractEmails($body));
                $candidateMap[$idx]['phones'] = array_merge($candidateMap[$idx]['phones'], extractPhoneNumbers($body));
                $candidateMap[$idx]['socials'] = array_merge($candidateMap[$idx]['socials'], customFetcherExtractSocialLinks($body));
            }

            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);
            unset($active[$handleId]);
        }

        if ($running > 0) {
            curl_multi_select($multi, 0.5);
        }
    } while ($taskCursor < $taskCount || !empty($active));

    curl_multi_close($multi);

    foreach ($candidateMap as $idx => $signal) {
        if (!isset($leads[$idx]))
            continue;
        $emails = customFetcherUniqueCleanArray($signal['emails']);
        $phones = customFetcherUniqueCleanArray(array_map('customFetcherNormalizePrimaryPhone', $signal['phones']));
        $socials = $signal['socials']; // already keyed by platform

        if ($signal['cacheKey'] !== '' && (!empty($emails) || !empty($phones) || !empty($socials))) {
            setCache($signal['cacheKey'], [
                'emails' => array_slice($emails, 0, 5),
                'phones' => array_slice($phones, 0, 3),
                'socials' => $socials,
            ], 21600);
        }

        $leads[$idx] = customFetcherQuickProbeApplySignals($leads[$idx], $emails, $phones, $socials);
    }

    return $leads;
}

function customFetcherEnrichLeadChunk($leads, $timeout)
{
    if (empty($leads))
        return [];
    // Keep per-lead crawl shallow for speed; fallback scraper handles gaps.
    $maxPages = count($leads) >= 8 ? 2 : 3;

    $multi = curl_multi_init();
    $handleMap = [];
    $responses = [];

    foreach ($leads as $idx => $lead) {
        $url = trim((string) ($lead['url'] ?? ''));
        if ($url === '')
            continue;
        $pageUrls = customFetcherPageUrls($url, $maxPages);
        foreach ($pageUrls as $pageUrl) {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $pageUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => min(5, $timeout),
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT => 'BamLead-CustomFetcher/1.0',
            ]);
            curl_multi_add_handle($multi, $ch);
            $key = (string) $idx . '|' . $pageUrl;
            $handleMap[(int) $ch] = ['handle' => $ch, 'key' => $key, 'idx' => $idx, 'url' => $pageUrl];
        }
    }

    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 1.0);
        }
    } while ($running && $status === CURLM_OK);

    foreach ($handleMap as $meta) {
        $ch = $meta['handle'];
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = (string) curl_multi_getcontent($ch);
        if ($httpCode >= 200 && $httpCode < 400 && $body !== '') {
            if (!isset($responses[$meta['idx']]))
                $responses[$meta['idx']] = [];
            $responses[$meta['idx']][] = $body;
        }
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);

    $enriched = [];
    foreach ($leads as $idx => $lead) {
        $leadUrl = trim((string) ($lead['url'] ?? ''));
        $emails = [];
        $phones = [];
        $socials = [];

        if ($leadUrl !== '') {
            $cacheKey = 'custom_fetch_enrich_' . md5($leadUrl);
            $cached = getCache($cacheKey);
            if (is_array($cached) && !empty($cached['emails']) && is_array($cached['emails'])) {
                $emails = $cached['emails'] ?? [];
                $phones = $cached['phones'] ?? [];
                $socials = $cached['socials'] ?? [];
            } else {
                foreach (($responses[$idx] ?? []) as $html) {
                    $emails = array_merge($emails, extractEmails($html));
                    $phones = array_merge($phones, extractPhoneNumbers($html));
                    $socials = array_merge($socials, customFetcherExtractSocials($html));
                }
                $emails = customFetcherUniqueCleanArray($emails);
                $phones = customFetcherUniqueCleanArray(array_map('customFetcherNormalizePrimaryPhone', $phones));

                // Fallback scrape is expensive; only run when contact capture is still incomplete.
                if (empty($emails) || empty($phones)) {
                    $fallback = scrapeWebsiteForContacts($leadUrl, max(4, $timeout));
                    if (is_array($fallback)) {
                        $emails = customFetcherUniqueCleanArray(array_merge($emails, $fallback['emails'] ?? []));
                        $phones = customFetcherUniqueCleanArray(array_merge($phones, array_map('customFetcherNormalizePrimaryPhone', $fallback['phones'] ?? [])));
                    }
                }
                setCache($cacheKey, [
                    'emails' => array_slice($emails, 0, 5),
                    'phones' => array_slice($phones, 0, 3),
                    'socials' => $socials,
                ], 86400);
            }
        }

        $primaryEmail = trim((string) ($lead['email'] ?? ''));
        if ($primaryEmail === '' && !empty($emails)) {
            $primaryEmail = (string) $emails[0];
        }
        $primaryPhone = trim((string) ($lead['phone'] ?? ''));
        if ($primaryPhone === '' && !empty($phones)) {
            $primaryPhone = (string) $phones[0];
        }

        $lead['email'] = $primaryEmail;
        $lead['phone'] = $primaryPhone;
        $lead['enrichment'] = [
            'emails' => array_slice($emails, 0, 5),
            'phones' => array_slice($phones, 0, 3),
            'socials' => $socials,
            'hasEmail' => !empty($emails),
            'hasPhone' => !empty($phones),
            'hasSocials' => !empty($socials),
            'sources' => ['custom_fetcher'],
            'scrapedAt' => gmdate('c'),
            'isCatchAll' => false,
        ];
        $lead['enrichmentStatus'] = 'completed';
        $lead['sources'] = isset($lead['sources']) && is_array($lead['sources']) ? array_values(array_unique($lead['sources'])) : [$lead['source'] ?? 'Custom Fetcher'];
        $enriched[] = $lead;
    }

    return $enriched;
}

function customFetcherEnrichLeads($leads, $timeout, $concurrency)
{
    if (empty($leads))
        return [];
    $out = [];
    $chunks = array_chunk($leads, max(1, $concurrency));
    foreach ($chunks as $chunk) {
        $out = array_merge($out, customFetcherEnrichLeadChunk($chunk, $timeout));
    }
    return $out;
}

function customFetcherSearchAndEnrichNoKeyOutscraperStyle($service, $location, $limit, $filters, $filtersActive, $targetCount, $onStatus = null, $onBatch = null)
{
    $startedAt = microtime(true);
    $limit = max(20, min(50000, (int) $limit));
    $locations = customFetcherBuildLocations($location, $limit, $filtersActive);
    $variants = customFetcherBuildServiceVariants($service, $limit, $filtersActive);
    $queries = customFetcherBuildQueries($variants, $locations, $limit, $filtersActive);
    if (empty($queries)) {
        $queries = [['query' => "$service in $location", 'location' => $location]];
    }
    $queries = array_slice($queries, 0, customFetcherAdaptiveNoKeySeedQueryCap($limit, $filtersActive));

    $targetCount = customFetcherAdaptiveNoKeyTargetCount($limit, $filtersActive, $targetCount);
    $noKeyTargetCount = $targetCount;

    $emitBatchSize = customFetcherNoKeyStreamEmitBatchSize();
    $quickProbeEnabled = customFetcherQuickEmailProbeEnabled();
    $quickProbeRemaining = $quickProbeEnabled ? min($limit, customFetcherQuickEmailMaxPerQuery()) : 0;
    $quickProbePerPass = customFetcherQuickEmailMaxPerPass();
    $quickProbeTimeout = customFetcherQuickEmailTimeout();
    $quickProbeConcurrency = customFetcherQuickEmailConcurrency();

    $discoveryConcurrency = customFetcherNoKeyDiscoveryConcurrency();
    $providerTimeout = customFetcherNoKeyProviderTimeout();
    $providerRetries = customFetcherNoKeyProviderRetries();
    $blockBackoffMs = customFetcherNoKeyBlockBackoffMs();
    $topupMaxPasses = customFetcherNoKeyTopupMaxPasses();
    $topupMaxQueries = customFetcherAdaptiveNoKeyTopupQueryCap($limit, $filtersActive);
    $topupEnabled = customFetcherNoKeyTopupEnabled() || $limit >= 250;
    if ($limit >= 500 && $topupMaxPasses < 2)
        $topupMaxPasses = 2;
    if ($limit >= 1000 && $topupMaxPasses < 3)
        $topupMaxPasses = 3;
    if ($limit >= 2000 && $topupMaxPasses < 4)
        $topupMaxPasses = 4;
    $deferQuickProbe = customFetcherNoKeyDeferQuickProbe();
    $maxEmptySeedChunks = customFetcherNoKeyMaxEmptySeedChunks();
    $maxEmptyTopupChunks = customFetcherNoKeyMaxEmptyTopupChunks();

    $allResults = [];
    $seen = [];
    $resultIndexById = [];
    $batchToEmit = [];
    $deferredProbeQueue = [];
    $milestoneTimes = ['25' => null, '50' => null, '100' => null];

    $recordMilestones = function () use (&$milestoneTimes, &$allResults, $startedAt) {
        $count = count($allResults);
        foreach ([25, 50, 100] as $milestone) {
            $key = (string) $milestone;
            if ($milestoneTimes[$key] === null && $count >= $milestone) {
                $milestoneTimes[$key] = (int) round((microtime(true) - $startedAt) * 1000);
            }
        }
    };

    $flushDeferredProbeUpdates = function ($force = false) use (&$deferredProbeQueue, &$quickProbeRemaining, $quickProbePerPass, $quickProbeTimeout, $quickProbeConcurrency, &$allResults, &$resultIndexById, $limit, $onBatch) {
        if (empty($deferredProbeQueue) || $quickProbeRemaining <= 0) {
            return;
        }
        $maxPerRun = $force
            ? min(count($deferredProbeQueue), $quickProbeRemaining)
            : min(count($deferredProbeQueue), $quickProbePerPass, $quickProbeRemaining);
        if ($maxPerRun <= 0)
            return;

        $probeSlice = array_splice($deferredProbeQueue, 0, $maxPerRun);
        $quickProbeRemaining -= $maxPerRun;
        $enrichedSlice = customFetcherQuickEmailProbeLeads($probeSlice, $quickProbeTimeout, $quickProbeConcurrency, $maxPerRun);
        $updates = [];

        foreach ($enrichedSlice as $candidate) {
            $leadId = (string) ($candidate['id'] ?? '');
            if ($leadId === '' || !isset($resultIndexById[$leadId]))
                continue;
            $idx = $resultIndexById[$leadId];
            if (!isset($allResults[$idx]) || !is_array($allResults[$idx]))
                continue;
            $lead = $allResults[$idx];
            $changed = false;

            $newEmail = trim((string) ($candidate['email'] ?? ''));
            $oldEmail = trim((string) ($lead['email'] ?? ''));
            if ($oldEmail === '' && $newEmail !== '') {
                $lead['email'] = $newEmail;
                $changed = true;
            }

            $newPhone = trim((string) ($candidate['phone'] ?? ''));
            $oldPhone = trim((string) ($lead['phone'] ?? ''));
            if ($oldPhone === '' && $newPhone !== '') {
                $lead['phone'] = $newPhone;
                $changed = true;
            }

            if (isset($candidate['enrichment']) && is_array($candidate['enrichment'])) {
                $lead['enrichment'] = $candidate['enrichment'];
                $changed = true;
            }

            if ($changed) {
                $allResults[$idx] = $lead;
                $updates[] = $lead;
            }
        }

        if (!empty($updates) && is_callable($onBatch)) {
            $onBatch($updates, count($allResults), $limit);
        }
    };

    $ingestDiscovered = function ($discovered, $queryLocation, $queryText = '') use (&$allResults, &$seen, &$resultIndexById, &$batchToEmit, &$deferredProbeQueue, $filters, $limit, $emitBatchSize, $onBatch, $quickProbeEnabled, $deferQuickProbe, &$quickProbeRemaining, $quickProbePerPass, $quickProbeTimeout, $quickProbeConcurrency, $recordMilestones, $service, $location, $filtersActive, $targetCount) {
        if (empty($discovered))
            return;
        $fresh = [];
        foreach ($discovered as $lead) {
            if (!is_array($lead) || empty($lead['name']))
                continue;
            $dedupeKey = buildBusinessDedupeKey($lead, (string) $queryLocation);
            if (isset($seen[$dedupeKey]))
                continue;
            $seen[$dedupeKey] = true;
            $fresh[] = $lead;
        }
        if (empty($fresh))
            return;

        if ($quickProbeEnabled && !$deferQuickProbe && $quickProbeRemaining > 0) {
            $probeCandidates = 0;
            foreach ($fresh as $probeLead) {
                $leadEmail = trim((string) ($probeLead['email'] ?? ''));
                $leadUrl = trim((string) ($probeLead['url'] ?? ''));
                if ($leadEmail === '' && $leadUrl !== '') {
                    $probeCandidates++;
                }
            }
            if ($probeCandidates > 0) {
                $probeBudget = min($quickProbeRemaining, $probeCandidates, $quickProbePerPass);
                if ($probeBudget > 0) {
                    $fresh = customFetcherQuickEmailProbeLeads($fresh, $quickProbeTimeout, $quickProbeConcurrency, $probeBudget);
                    $quickProbeRemaining -= $probeBudget;
                }
            }
        }
        $fresh = customFetcherPrepareDiscoveredLeads(
            $fresh,
            $service,
            $location,
            (string) $queryLocation,
            (string) $queryText,
            $filtersActive,
            count($allResults),
            $targetCount,
            $limit
        );
        if (empty($fresh))
            return;

        foreach ($fresh as $lead) {
            if (!matchesSearchFilters($lead, $filters))
                continue;
            if (!isset($lead['enrichment']) || !is_array($lead['enrichment'])) {
                $lead['enrichment'] = customFetcherBuildPendingEnrichment($lead);
            }
            $lead['enrichmentStatus'] = 'pending';
            $allResults[] = $lead;
            $idx = count($allResults) - 1;
            $leadId = (string) ($lead['id'] ?? '');
            if ($leadId !== '') {
                $resultIndexById[$leadId] = $idx;
            }
            $batchToEmit[] = $lead;

            $leadEmail = trim((string) ($lead['email'] ?? ''));
            $leadUrl = trim((string) ($lead['url'] ?? ''));
            if ($quickProbeEnabled && $leadEmail === '' && $leadUrl !== '') {
                $deferredProbeQueue[] = $lead;
            }

            if (count($batchToEmit) >= $emitBatchSize && is_callable($onBatch)) {
                $onBatch($batchToEmit, count($allResults), $limit);
                $batchToEmit = [];
            }

            $recordMilestones();
            if (count($allResults) >= $limit)
                break;
        }
    };

    $queryChunks = array_chunk($queries, $discoveryConcurrency);
    $totalSeedChunks = count($queryChunks);
    $emptySeedChunkStreak = 0;
    foreach ($queryChunks as $chunkIndex => $queryChunk) {
        if (count($allResults) >= $limit)
            break;
        $beforeChunkTotal = count($allResults);
        $remaining = $limit - count($allResults);
        $perQueryLimit = min(30, max(8, (int) ceil(($remaining * ($filtersActive ? 1.45 : 1.15)) / max(1, count($queryChunk)))));

        if (is_callable($onStatus)) {
            $onStatus([
                'message' => 'No-key discovery chunk ' . ($chunkIndex + 1) . '/' . max(1, $totalSeedChunks),
                'phase' => 'discovery',
                'provider' => 'no_key',
                'progress' => min(95, max(1, (int) round((count($allResults) / max(1, $limit)) * 100))),
                'seedIndex' => $chunkIndex + 1,
                'seedTotal' => $totalSeedChunks,
            ]);
        }

        $chunkDiscovered = customFetcherDiscoverNoKeyChunk($queryChunk, $perQueryLimit, $providerTimeout, $providerRetries, $blockBackoffMs);
        foreach ($chunkDiscovered as $item) {
            if (count($allResults) >= $limit)
                break;
            $queryLocation = $item['query']['location'] ?? $location;
            $ingestDiscovered($item['discovered'] ?? [], $queryLocation, (string) ($item['query']['query'] ?? ''));
        }

        if ($deferQuickProbe) {
            $flushDeferredProbeUpdates(false);
        }
        if (count($allResults) <= $beforeChunkTotal) {
            $emptySeedChunkStreak++;
            if ($emptySeedChunkStreak >= $maxEmptySeedChunks && $chunkIndex >= 1) {
                if (is_callable($onStatus)) {
                    $onStatus([
                        'message' => 'Stopping no-key seed discovery early due to repeated low-yield chunks.',
                        'phase' => 'discovery',
                        'provider' => 'no_key',
                        'progress' => min(95, max(1, (int) round((count($allResults) / max(1, $limit)) * 100))),
                    ]);
                }
                break;
            }
        } else {
            $emptySeedChunkStreak = 0;
        }
        if (count($allResults) >= $targetCount && $chunkIndex > 0) {
            break;
        }
    }

    if ($topupEnabled && count($allResults) < $targetCount && $topupMaxPasses > 0) {
        $topupPool = customFetcherBuildLowCoverageTopupQueries($service, $location, $limit, $filtersActive, $queries);
        for ($pass = 1; $pass <= $topupMaxPasses; $pass++) {
            if (count($allResults) >= $limit || count($allResults) >= $targetCount)
                break;
            $offset = ($pass - 1) * $topupMaxQueries;
            $passQueries = array_slice($topupPool, $offset, $topupMaxQueries);
            if (empty($passQueries))
                break;

            $passChunks = array_chunk($passQueries, $discoveryConcurrency);
            $passChunkTotal = count($passChunks);
            $emptyTopupChunkStreak = 0;
            foreach ($passChunks as $passChunkIndex => $queryChunk) {
                if (count($allResults) >= $limit)
                    break;
                $beforePassChunkTotal = count($allResults);
                $remaining = $limit - count($allResults);
                $perQueryLimit = min(35, max(8, (int) ceil(($remaining * ($filtersActive ? 1.5 : 1.2)) / max(1, count($queryChunk)))));

                if (is_callable($onStatus)) {
                    $onStatus([
                        'message' => 'No-key top-up pass ' . $pass . ': chunk ' . ($passChunkIndex + 1) . '/' . max(1, $passChunkTotal),
                        'phase' => 'topup',
                        'provider' => 'no_key',
                        'topupPass' => $pass,
                        'progress' => min(98, max(1, (int) round((count($allResults) / max(1, $limit)) * 100))),
                        'seedIndex' => $passChunkIndex + 1,
                        'seedTotal' => $passChunkTotal,
                    ]);
                }

                $chunkDiscovered = customFetcherDiscoverNoKeyChunk($queryChunk, $perQueryLimit, $providerTimeout, $providerRetries, $blockBackoffMs);
                foreach ($chunkDiscovered as $item) {
                    if (count($allResults) >= $limit)
                        break;
                    $queryLocation = $item['query']['location'] ?? $location;
                    $ingestDiscovered($item['discovered'] ?? [], $queryLocation, (string) ($item['query']['query'] ?? ''));
                }
                if ($deferQuickProbe) {
                    $flushDeferredProbeUpdates(false);
                }
                if (count($allResults) <= $beforePassChunkTotal) {
                    $emptyTopupChunkStreak++;
                    if ($emptyTopupChunkStreak >= $maxEmptyTopupChunks) {
                        break;
                    }
                } else {
                    $emptyTopupChunkStreak = 0;
                }
                if (count($allResults) >= $targetCount && $passChunkIndex > 0) {
                    break;
                }
            }
        }
    }

    if ($deferQuickProbe) {
        while (!empty($deferredProbeQueue) && $quickProbeRemaining > 0) {
            $flushDeferredProbeUpdates(true);
        }
    }

    // === FINAL EMAIL SWEEP: re-probe any leads still missing email ===
    $missingEmail = [];
    foreach ($allResults as $finalIdx => $finalLead) {
        $fe = trim((string) ($finalLead['email'] ?? ''));
        $fu = trim((string) ($finalLead['url'] ?? ''));
        if ($fe === '' && $fu !== '') {
            $missingEmail[] = $finalLead;
        }
    }
    if (!empty($missingEmail)) {
        $sweepBudget = min(count($missingEmail), 200);
        $sweepTimeout = max($quickProbeTimeout, 5);
        if (is_callable($onStatus)) {
            $onStatus([
                'message' => 'Final email sweep: re-probing ' . $sweepBudget . ' leads with extended timeout...',
                'phase' => 'email_sweep',
                'progress' => 96,
            ]);
        }
        $sweepResults = customFetcherQuickEmailProbeLeads($missingEmail, $sweepTimeout, $quickProbeConcurrency, $sweepBudget);
        $sweepUpdates = [];
        foreach ($sweepResults as $sweepLead) {
            $sweepId = (string) ($sweepLead['id'] ?? '');
            if ($sweepId === '' || !isset($resultIndexById[$sweepId])) continue;
            $sweepIdx = $resultIndexById[$sweepId];
            if (!isset($allResults[$sweepIdx])) continue;
            $newEmail = trim((string) ($sweepLead['email'] ?? ''));
            if ($newEmail !== '' && trim((string) ($allResults[$sweepIdx]['email'] ?? '')) === '') {
                $allResults[$sweepIdx]['email'] = $newEmail;
                if (isset($sweepLead['enrichment'])) {
                    $allResults[$sweepIdx]['enrichment'] = $sweepLead['enrichment'];
                }
                $sweepUpdates[] = $allResults[$sweepIdx];
            }
        }
        if (!empty($sweepUpdates) && is_callable($onBatch)) {
            $onBatch($sweepUpdates, count($allResults), $limit);
        }
    }

    if (!empty($batchToEmit) && is_callable($onBatch)) {
        $onBatch($batchToEmit, count($allResults), $limit);
    }

    $durationMs = (int) round((microtime(true) - $startedAt) * 1000);
    $total = count($allResults);
    $withEmail = 0;
    $withPhone = 0;
    $withEither = 0;
    foreach ($allResults as $lead) {
        $hasEmail = trim((string) ($lead['email'] ?? '')) !== '';
        $hasPhone = trim((string) ($lead['phone'] ?? '')) !== '';
        if ($hasEmail)
            $withEmail++;
        if ($hasPhone)
            $withPhone++;
        if ($hasEmail || $hasPhone)
            $withEither++;
    }

    error_log('[CustomFetcherNoKey] ' . json_encode([
        'mode' => 'no_key_outscraper_style',
        'requested' => $limit,
        'returned' => $total,
        'target_count' => $targetCount,
        'coverage_pct' => round(($total / max(1, $limit)) * 100, 2),
        'email_pct' => round(($withEmail / max(1, $total)) * 100, 2),
        'phone_pct' => round(($withPhone / max(1, $total)) * 100, 2),
        'either_pct' => round(($withEither / max(1, $total)) * 100, 2),
        'ms_to_25' => $milestoneTimes['25'],
        'ms_to_50' => $milestoneTimes['50'],
        'ms_to_100' => $milestoneTimes['100'],
        'duration_ms' => $durationMs,
    ]));

    return array_slice($allResults, 0, $limit);
}

function customFetcherSearchAndEnrich($service, $location, $limit, $filters, $filtersActive, $targetCount, $onStatus = null, $onBatch = null)
{
    if (customFetcherUseNoKeyOutscraperStyle()) {
        return customFetcherSearchAndEnrichNoKeyOutscraperStyle(
            $service,
            $location,
            $limit,
            $filters,
            $filtersActive,
            $targetCount,
            $onStatus,
            $onBatch
        );
    }

    $limit = max(20, min(50000, (int) $limit));
    $sources = customFetcherResolveSources();
    if (empty($sources)) {
        throw new Exception('No discovery source configured for custom fetcher.');
    }

    $locations = customFetcherBuildLocations($location, $limit, $filtersActive);
    $variants = customFetcherBuildServiceVariants($service, $limit, $filtersActive);
    $queries = customFetcherBuildQueries($variants, $locations, $limit, $filtersActive);
    if (empty($queries)) {
        $queries = [['query' => "$service in $location", 'location' => $location]];
    }

    $allResults = [];
    $seen = [];
    $totalQueries = count($queries);
    $batchToEmit = [];
    $timeout = customFetcherContactTimeout();
    $concurrency = customFetcherEnrichConcurrency();
    $overDeliverBuffer = defined('CUSTOM_FETCH_OVER_DELIVER_BUFFER') ? (float) CUSTOM_FETCH_OVER_DELIVER_BUFFER : 0.10;
    $hardLimit = (int) ceil($limit * (1.0 + max(0, min(0.25, $overDeliverBuffer))));
    $targetCount = $targetCount !== null ? (int) $targetCount : (int) ceil($limit * customFetcherTargetRatio());
    $targetCount = min($hardLimit, max($targetCount, $limit));
    $emitBatchSize = customFetcherStreamEmitBatchSize();
    $inlineEnrichment = customFetcherInlineEnrichmentEnabled();
    $quickProbeEnabled = !$inlineEnrichment && customFetcherQuickEmailProbeEnabled();
    $quickProbeRemaining = $quickProbeEnabled ? min($limit, customFetcherQuickEmailMaxPerQuery()) : 0;
    $quickProbePerPass = customFetcherQuickEmailMaxPerPass();
    $quickProbeTimeout = customFetcherQuickEmailTimeout();
    $quickProbeConcurrency = customFetcherQuickEmailConcurrency();
    $deferQuickProbe = customFetcherDeferQuickProbe();
    $queryConcurrency = customFetcherQueryConcurrency();
    $lowCoverageTopupEnabled = customFetcherLowCoverageTopupEnabled();
    $lowCoverageThreshold = customFetcherLowCoverageThreshold();
    $topupUseNoKeyFallback = customFetcherTopupUseNoKeyFallback();
    $platformRelaxationEnabled = customFetcherPlatformRelaxationEnabled();
    $platformRelaxThreshold = customFetcherPlatformRelaxThreshold();
    $platformRelaxAfterQueryRatio = customFetcherPlatformRelaxAfterQueryRatio();
    $platformMode = !empty($filters['platformMode']);
    $hasPlatformSelection = !empty($filters['platforms']) && is_array($filters['platforms']) && count($filters['platforms']) > 0;
    $relaxPlatformFiltering = false;
    $resultIndexById = [];
    $deferredProbeQueue = [];

    // Primary discovery sources: use whatever is available.
    $primarySources = $sources;
    if (empty($primarySources)) {
        throw new Exception('No discovery source configured. Set CUSTOM_FETCH_DISCOVERY_SOURCES.');
    }

    $flushDeferredProbeUpdates = function ($force = false) use (&$deferredProbeQueue, &$quickProbeRemaining, $quickProbePerPass, $quickProbeTimeout, $quickProbeConcurrency, &$allResults, &$resultIndexById, $limit, $onBatch) {
        if (empty($deferredProbeQueue) || $quickProbeRemaining <= 0) {
            return;
        }
        $maxPerRun = $force
            ? min(count($deferredProbeQueue), $quickProbeRemaining)
            : min(count($deferredProbeQueue), $quickProbePerPass, $quickProbeRemaining);
        if ($maxPerRun <= 0) {
            return;
        }

        $probeSlice = array_splice($deferredProbeQueue, 0, $maxPerRun);
        $quickProbeRemaining -= $maxPerRun;
        $enrichedSlice = customFetcherQuickEmailProbeLeads($probeSlice, $quickProbeTimeout, $quickProbeConcurrency, $maxPerRun);
        $updates = [];

        foreach ($enrichedSlice as $candidate) {
            $leadId = (string) ($candidate['id'] ?? '');
            if ($leadId === '' || !isset($resultIndexById[$leadId])) {
                continue;
            }
            $idx = $resultIndexById[$leadId];
            if (!isset($allResults[$idx]) || !is_array($allResults[$idx])) {
                continue;
            }
            $lead = $allResults[$idx];
            $changed = false;

            $newEmail = trim((string) ($candidate['email'] ?? ''));
            $oldEmail = trim((string) ($lead['email'] ?? ''));
            if ($oldEmail === '' && $newEmail !== '') {
                $lead['email'] = $newEmail;
                $changed = true;
            }

            $newPhone = trim((string) ($candidate['phone'] ?? ''));
            $oldPhone = trim((string) ($lead['phone'] ?? ''));
            if ($oldPhone === '' && $newPhone !== '') {
                $lead['phone'] = $newPhone;
                $changed = true;
            }

            if (isset($candidate['enrichment']) && is_array($candidate['enrichment'])) {
                $lead['enrichment'] = $candidate['enrichment'];
                $changed = true;
            }

            if ($changed) {
                $allResults[$idx] = $lead;
                $updates[] = $lead;
            }
        }

        if (!empty($updates) && is_callable($onBatch)) {
            $onBatch($updates, count($allResults), $limit);
        }
    };

    $queryChunks = array_chunk($queries, $queryConcurrency);
    $totalQueryChunks = count($queryChunks);
    $processedQueryCount = 0;
    foreach ($queryChunks as $chunkIndex => $queryChunk) {
        if (count($allResults) >= $hardLimit)
            break;
        $remaining = $hardLimit - count($allResults);
        $perQueryDiscoveryLimit = min(120, max(20, (int) ceil(($remaining * ($filtersActive ? 1.6 : 1.2)) / max(1, count($queryChunk)))));

        if (is_callable($onStatus)) {
            $onStatus([
                'message' => 'Custom one-shot search chunk ' . ($chunkIndex + 1) . '/' . max(1, $totalQueryChunks),
                'progress' => min(95, max(1, (int) round((count($allResults) / max(1, $limit)) * 100))),
                'queryIndex' => $chunkIndex + 1,
                'queryTotal' => $totalQueryChunks,
                'sources' => $primarySources,
            ]);
        }

        $chunkDiscoveries = [];
        if (count($primarySources) === 1 && $primarySources[0] === 'serper') {
            $chunkDiscoveries = customFetcherDiscoverSerperPlacesChunk($queryChunk, $perQueryDiscoveryLimit);
        } elseif (count($primarySources) === 1 && $primarySources[0] === 'no_key') {
            $chunkDiscoveries = customFetcherDiscoverNoKeyChunk(
                $queryChunk,
                $perQueryDiscoveryLimit,
                customFetcherNoKeyProviderTimeout(),
                customFetcherNoKeyProviderRetries(),
                customFetcherNoKeyBlockBackoffMs()
            );
        } else {
            foreach ($queryChunk as $queryData) {
                $query = $queryData['query'] ?? '';
                $discovered = customFetcherDiscoverBySources($query, $perQueryDiscoveryLimit, $primarySources);
                $chunkDiscoveries[] = [
                    'query' => $queryData,
                    'discovered' => $discovered,
                ];
            }
        }

        foreach ($chunkDiscoveries as $queryResult) {
            if (count($allResults) >= $hardLimit)
                break;
            $processedQueryCount++;
            $queryLocation = $queryResult['query']['location'] ?? $location;
            $discovered = $queryResult['discovered'] ?? [];
            if (empty($discovered))
                continue;

            $fresh = [];
            foreach ($discovered as $lead) {
                if (!is_array($lead) || empty($lead['name']))
                    continue;
                $dedupeKey = buildBusinessDedupeKey($lead, $queryLocation);
                if (isset($seen[$dedupeKey]))
                    continue;
                $seen[$dedupeKey] = true;
                $fresh[] = $lead;
            }
            if (empty($fresh))
                continue;

            if (!$inlineEnrichment) {
                if ($quickProbeEnabled && !$deferQuickProbe && $quickProbeRemaining > 0) {
                    $probeCandidates = 0;
                    foreach ($fresh as $probeLead) {
                        $leadEmail = trim((string) ($probeLead['email'] ?? ''));
                        $leadUrl = trim((string) ($probeLead['url'] ?? ''));
                        if ($leadEmail === '' && $leadUrl !== '') {
                            $probeCandidates++;
                        }
                    }
                    if ($probeCandidates > 0) {
                        $probeBudget = min($quickProbeRemaining, $probeCandidates, $quickProbePerPass);
                        $fresh = customFetcherQuickEmailProbeLeads($fresh, $quickProbeTimeout, $quickProbeConcurrency, $probeBudget);
                        $quickProbeRemaining -= $probeBudget;
                    }
                }
                $fresh = customFetcherPrepareDiscoveredLeads(
                    $fresh,
                    $service,
                    $location,
                    (string) $queryLocation,
                    (string) ($queryResult['query']['query'] ?? ''),
                    $filtersActive,
                    count($allResults),
                    $targetCount,
                    $limit
                );
                if (empty($fresh)) {
                    continue;
                }

                // Fast-path: stream discovery results immediately, skip inline website crawling.
                foreach ($fresh as $lead) {
                    if (!customFetcherMatchesWithOptionalPlatformRelaxation($lead, $filters, $relaxPlatformFiltering))
                        continue;
                    if (!isset($lead['enrichment']) || !is_array($lead['enrichment'])) {
                        $lead['enrichment'] = customFetcherBuildPendingEnrichment($lead);
                    }
                    $lead['enrichmentStatus'] = 'pending';
                    $allResults[] = $lead;
                    $idx = count($allResults) - 1;
                    $leadId = (string) ($lead['id'] ?? '');
                    if ($leadId !== '') {
                        $resultIndexById[$leadId] = $idx;
                    }
                    $batchToEmit[] = $lead;

                    if ($quickProbeEnabled && $deferQuickProbe) {
                        $leadEmail = trim((string) ($lead['email'] ?? ''));
                        $leadUrl = trim((string) ($lead['url'] ?? ''));
                        if ($leadEmail === '' && $leadUrl !== '') {
                            $deferredProbeQueue[] = $lead;
                        }
                    }

                    if (count($batchToEmit) >= $emitBatchSize && is_callable($onBatch)) {
                        $onBatch($batchToEmit, count($allResults), $limit);
                        $batchToEmit = [];
                    }
                    if (count($allResults) >= $hardLimit)
                        break;
                }
            } else {
                $fresh = customFetcherPrepareDiscoveredLeads(
                    $fresh,
                    $service,
                    $location,
                    (string) $queryLocation,
                    (string) ($queryResult['query']['query'] ?? ''),
                    $filtersActive,
                    count($allResults),
                    $targetCount,
                    $limit
                );
                if (empty($fresh)) {
                    continue;
                }
                // Do not enrich more than needed for the remaining target window.
                $remainingNeed = $hardLimit - count($allResults);
                $maxFreshToEnrich = max(20, (int) ceil($remainingNeed * ($filtersActive ? 2.0 : 1.3)));
                if (count($fresh) > $maxFreshToEnrich) {
                    $fresh = array_slice($fresh, 0, $maxFreshToEnrich);
                }

                // Enrich in small chunks so results stream earlier instead of waiting for full query batch.
                $freshChunks = array_chunk($fresh, max(10, $concurrency * 4));
                foreach ($freshChunks as $freshChunk) {
                    $enriched = customFetcherEnrichLeads($freshChunk, $timeout, $concurrency);
                    foreach ($enriched as $lead) {
                        if (!customFetcherMatchesWithOptionalPlatformRelaxation($lead, $filters, $relaxPlatformFiltering))
                            continue;
                        $allResults[] = $lead;
                        $batchToEmit[] = $lead;

                        if (count($batchToEmit) >= $emitBatchSize && is_callable($onBatch)) {
                            $onBatch($batchToEmit, count($allResults), $limit);
                            $batchToEmit = [];
                        }
                        if (count($allResults) >= $hardLimit)
                            break;
                    }
                    if (count($allResults) >= $hardLimit)
                        break;
                }
            }
        } // end foreach discovery item

        if ($deferQuickProbe) {
            $flushDeferredProbeUpdates(false);
        }

        if (
            !$relaxPlatformFiltering &&
            $platformRelaxationEnabled &&
            $platformMode &&
            $hasPlatformSelection
        ) {
            $queryProgressRatio = $processedQueryCount / max(1, $totalQueries);
            $coverageRatioNow = count($allResults) / max(1, $limit);
            if ($queryProgressRatio >= $platformRelaxAfterQueryRatio && $coverageRatioNow < $platformRelaxThreshold) {
                $relaxPlatformFiltering = true;
                if (is_callable($onStatus)) {
                    $onStatus([
                        'message' => 'Low platform-match coverage detected. Broadening filter to include unknown-stack opportunities.',
                        'phase' => 'platform_relaxation',
                        'progress' => min(96, max(1, (int) round($coverageRatioNow * 100))),
                    ]);
                }
            }
        }

        if (count($allResults) >= $targetCount && $processedQueryCount > 2) {
            break;
        }
    }

    $coverageRatio = count($allResults) / max(1, $limit);
    if (
        $lowCoverageTopupEnabled &&
        count($allResults) < $targetCount
    ) {
        $topupQueries = customFetcherBuildLowCoverageTopupQueries($service, $location, $limit, $filtersActive, $queries);
        $topupSources = $primarySources;
        if ($topupUseNoKeyFallback && !in_array('no_key', $topupSources, true)) {
            $topupSources[] = 'no_key';
        }
        if (!in_array('no_key', $topupSources, true) && count($allResults) < (int) ceil($targetCount * 0.55)) {
            $topupSources[] = 'no_key';
        }

        $topupChunks = array_chunk($topupQueries, $queryConcurrency);
        $topupChunkTotal = count($topupChunks);
        foreach ($topupChunks as $topupChunkIndex => $queryChunk) {
            if (count($allResults) >= $hardLimit) {
                break;
            }
            $remaining = $hardLimit - count($allResults);
            $discoveryLimit = min(120, max(25, (int) ceil(($remaining * ($filtersActive ? 1.7 : 1.35)) / max(1, count($queryChunk)))));

            if (is_callable($onStatus)) {
                $onStatus([
                    'message' => 'Coverage top-up chunk ' . ($topupChunkIndex + 1) . '/' . max(1, $topupChunkTotal),
                    'progress' => min(97, max(1, (int) round((count($allResults) / max(1, $limit)) * 100))),
                    'queryIndex' => $topupChunkIndex + 1,
                    'queryTotal' => $topupChunkTotal,
                    'phase' => 'topup',
                    'sources' => $topupSources,
                ]);
            }

            $chunkDiscoveries = [];
            if (count($topupSources) === 1 && $topupSources[0] === 'serper') {
                $chunkDiscoveries = customFetcherDiscoverSerperPlacesChunk($queryChunk, $discoveryLimit);
            } elseif (count($topupSources) === 1 && $topupSources[0] === 'no_key') {
                $chunkDiscoveries = customFetcherDiscoverNoKeyChunk(
                    $queryChunk,
                    $discoveryLimit,
                    customFetcherNoKeyProviderTimeout(),
                    customFetcherNoKeyProviderRetries(),
                    customFetcherNoKeyBlockBackoffMs()
                );
            } else {
                foreach ($queryChunk as $queryData) {
                    $query = $queryData['query'] ?? '';
                    $discovered = customFetcherDiscoverBySources($query, $discoveryLimit, $topupSources);
                    $chunkDiscoveries[] = [
                        'query' => $queryData,
                        'discovered' => $discovered,
                    ];
                }
            }

            foreach ($chunkDiscoveries as $queryResult) {
                if (count($allResults) >= $hardLimit) {
                    break;
                }
                $queryLocation = $queryResult['query']['location'] ?? $location;
                $discovered = $queryResult['discovered'] ?? [];
                if (empty($discovered)) {
                    continue;
                }

                $fresh = [];
                foreach ($discovered as $lead) {
                    if (!is_array($lead) || empty($lead['name'])) {
                        continue;
                    }
                    $dedupeKey = buildBusinessDedupeKey($lead, $queryLocation);
                    if (isset($seen[$dedupeKey])) {
                        continue;
                    }
                    $seen[$dedupeKey] = true;
                    $fresh[] = $lead;
                }
                if (empty($fresh)) {
                    continue;
                }

                if (!$inlineEnrichment) {
                    if ($quickProbeEnabled && !$deferQuickProbe && $quickProbeRemaining > 0) {
                        $probeCandidates = 0;
                        foreach ($fresh as $probeLead) {
                            $leadEmail = trim((string) ($probeLead['email'] ?? ''));
                            $leadUrl = trim((string) ($probeLead['url'] ?? ''));
                            if ($leadEmail === '' && $leadUrl !== '') {
                                $probeCandidates++;
                            }
                        }
                        if ($probeCandidates > 0) {
                            $probeBudget = min($quickProbeRemaining, $probeCandidates, $quickProbePerPass);
                            $fresh = customFetcherQuickEmailProbeLeads($fresh, $quickProbeTimeout, $quickProbeConcurrency, $probeBudget);
                            $quickProbeRemaining -= $probeBudget;
                        }
                    }
                    $fresh = customFetcherPrepareDiscoveredLeads(
                        $fresh,
                        $service,
                        $location,
                        (string) $queryLocation,
                        (string) ($queryResult['query']['query'] ?? ''),
                        $filtersActive,
                        count($allResults),
                        $targetCount,
                        $limit
                    );
                    if (empty($fresh)) {
                        continue;
                    }

                    foreach ($fresh as $lead) {
                        if (!customFetcherMatchesWithOptionalPlatformRelaxation($lead, $filters, $relaxPlatformFiltering)) {
                            continue;
                        }
                        if (!isset($lead['enrichment']) || !is_array($lead['enrichment'])) {
                            $lead['enrichment'] = customFetcherBuildPendingEnrichment($lead);
                        }
                        $lead['enrichmentStatus'] = 'pending';
                        $allResults[] = $lead;
                        $idx = count($allResults) - 1;
                        $leadId = (string) ($lead['id'] ?? '');
                        if ($leadId !== '') {
                            $resultIndexById[$leadId] = $idx;
                        }
                        $batchToEmit[] = $lead;

                        if ($quickProbeEnabled && $deferQuickProbe) {
                            $leadEmail = trim((string) ($lead['email'] ?? ''));
                            $leadUrl = trim((string) ($lead['url'] ?? ''));
                            if ($leadEmail === '' && $leadUrl !== '') {
                                $deferredProbeQueue[] = $lead;
                            }
                        }

                        if (count($batchToEmit) >= $emitBatchSize && is_callable($onBatch)) {
                            $onBatch($batchToEmit, count($allResults), $limit);
                            $batchToEmit = [];
                        }
                        if (count($allResults) >= $hardLimit) {
                            break;
                        }
                    }
                } else {
                    $fresh = customFetcherPrepareDiscoveredLeads(
                        $fresh,
                        $service,
                        $location,
                        (string) $queryLocation,
                        (string) ($queryResult['query']['query'] ?? ''),
                        $filtersActive,
                        count($allResults),
                        $targetCount,
                        $limit
                    );
                    if (empty($fresh)) {
                        continue;
                    }
                    $remainingNeed = $hardLimit - count($allResults);
                    $maxFreshToEnrich = max(20, (int) ceil($remainingNeed * ($filtersActive ? 2.0 : 1.3)));
                    if (count($fresh) > $maxFreshToEnrich) {
                        $fresh = array_slice($fresh, 0, $maxFreshToEnrich);
                    }

                    $freshChunks = array_chunk($fresh, max(10, $concurrency * 4));
                    foreach ($freshChunks as $freshChunk) {
                        $enriched = customFetcherEnrichLeads($freshChunk, $timeout, $concurrency);
                        foreach ($enriched as $lead) {
                            if (!customFetcherMatchesWithOptionalPlatformRelaxation($lead, $filters, $relaxPlatformFiltering)) {
                                continue;
                            }
                            $allResults[] = $lead;
                            $batchToEmit[] = $lead;

                            if (count($batchToEmit) >= $emitBatchSize && is_callable($onBatch)) {
                                $onBatch($batchToEmit, count($allResults), $limit);
                                $batchToEmit = [];
                            }
                            if (count($allResults) >= $hardLimit) {
                                break;
                            }
                        }
                        if (count($allResults) >= $hardLimit) {
                            break;
                        }
                    }
                }
            }

    // Final aggressive flush — probe ALL remaining deferred leads
    if ($deferQuickProbe) {
        while (!empty($deferredProbeQueue) && $quickProbeRemaining > 0) {
            $flushDeferredProbeUpdates(true);
        }
    }

            if (count($allResults) >= $targetCount && $topupChunkIndex > 1) {
                break;
            }
        }
    }

    // === NEARBY CITY EXPANSION PASS ===
    // If still below target after primary + topup, expand to all nearby cities
    // and generate fresh queries with synonyms to fill the gap.
    if (count($allResults) < $targetCount && count($allResults) < $hardLimit) {
        $allExistingKeys = [];
        foreach ($queries as $q) {
            $allExistingKeys[strtolower($q['query'] ?? '')] = true;
        }
        // Get ALL nearby city expansions (not capped)
        $allExpansions = buildLocationExpansions($location);
        $expansionLocations = customFetcherUniqueCleanArray(array_merge($allExpansions));
        $serviceVars = customFetcherBuildServiceVariants($service, max(250, $limit), $filtersActive);
        $nearbyQueries = [];
        $nearbyTemplates = ['%s in %s', '%s near %s', 'best %s in %s'];
        foreach ($expansionLocations as $loc) {
            foreach ($serviceVars as $sv) {
                foreach ($nearbyTemplates as $tpl) {
                    $q = preg_replace('/\s+/', ' ', trim(sprintf($tpl, $sv, $loc)));
                    $key = strtolower($q);
                    if (isset($allExistingKeys[$key]) || isset($seen[$key])) continue;
                    $allExistingKeys[$key] = true;
                    $nearbyQueries[] = ['query' => $q, 'location' => $loc];
                }
            }
        }
        $nearbyQueries = array_slice($nearbyQueries, 0, 80);

        if (!empty($nearbyQueries)) {
            if (is_callable($onStatus)) {
                $onStatus([
                    'message' => 'Expanding to nearby cities to meet target...',
                    'phase' => 'nearby_expansion',
                    'progress' => min(97, max(1, (int) round((count($allResults) / max(1, $limit)) * 100))),
                ]);
            }

            $nearbyChunks = array_chunk($nearbyQueries, $queryConcurrency);
            foreach ($nearbyChunks as $ncIdx => $queryChunk) {
                if (count($allResults) >= $hardLimit) break;
                $remaining = $hardLimit - count($allResults);
                $perQueryDiscoveryLimit = min(120, max(20, (int) ceil(($remaining * 1.3) / max(1, count($queryChunk)))));

                $chunkDiscoveries = [];
                if (count($primarySources) === 1 && $primarySources[0] === 'serper') {
                    $chunkDiscoveries = customFetcherDiscoverSerperPlacesChunk($queryChunk, $perQueryDiscoveryLimit);
                } elseif (count($primarySources) === 1 && $primarySources[0] === 'no_key') {
                    $chunkDiscoveries = customFetcherDiscoverNoKeyChunk($queryChunk, $perQueryDiscoveryLimit, customFetcherNoKeyProviderTimeout(), customFetcherNoKeyProviderRetries(), customFetcherNoKeyBlockBackoffMs());
                } else {
                    foreach ($queryChunk as $queryData) {
                        $discovered = customFetcherDiscoverBySources($queryData['query'] ?? '', $perQueryDiscoveryLimit, $primarySources);
                        $chunkDiscoveries[] = ['query' => $queryData, 'discovered' => $discovered];
                    }
                }

                foreach ($chunkDiscoveries as $queryResult) {
                    if (count($allResults) >= $hardLimit) break;
                    $queryLocation = $queryResult['query']['location'] ?? $location;
                    $discovered = $queryResult['discovered'] ?? [];
                    if (empty($discovered)) continue;

                    $fresh = [];
                    foreach ($discovered as $lead) {
                        if (!is_array($lead) || empty($lead['name'])) continue;
                        $dedupeKey = buildBusinessDedupeKey($lead, $queryLocation);
                        if (isset($seen[$dedupeKey])) continue;
                        $seen[$dedupeKey] = true;
                        $fresh[] = $lead;
                    }
                    if (empty($fresh)) continue;

                    if ($quickProbeEnabled && $quickProbeRemaining > 0) {
                        $probeCandidates = 0;
                        foreach ($fresh as $pl) {
                            if (trim((string) ($pl['email'] ?? '')) === '' && trim((string) ($pl['url'] ?? '')) !== '') $probeCandidates++;
                        }
                        if ($probeCandidates > 0) {
                            $probeBudget = min($quickProbeRemaining, $probeCandidates, $quickProbePerPass);
                            $fresh = customFetcherQuickEmailProbeLeads($fresh, $quickProbeTimeout, $quickProbeConcurrency, $probeBudget);
                            $quickProbeRemaining -= $probeBudget;
                        }
                    }

                    $fresh = customFetcherPrepareDiscoveredLeads($fresh, $service, $location, (string) $queryLocation, (string) ($queryResult['query']['query'] ?? ''), $filtersActive, count($allResults), $targetCount, $hardLimit);
                    if (empty($fresh)) continue;

                    foreach ($fresh as $lead) {
                        if (!customFetcherMatchesWithOptionalPlatformRelaxation($lead, $filters, $relaxPlatformFiltering)) continue;
                        if (!isset($lead['enrichment']) || !is_array($lead['enrichment'])) {
                            $lead['enrichment'] = customFetcherBuildPendingEnrichment($lead);
                        }
                        $lead['enrichmentStatus'] = 'pending';
                        $allResults[] = $lead;
                        $idx = count($allResults) - 1;
                        $leadId = (string) ($lead['id'] ?? '');
                        if ($leadId !== '') $resultIndexById[$leadId] = $idx;
                        $batchToEmit[] = $lead;
                        if ($quickProbeEnabled && $deferQuickProbe && trim((string) ($lead['email'] ?? '')) === '' && trim((string) ($lead['url'] ?? '')) !== '') {
                            $deferredProbeQueue[] = $lead;
                        }
                        if (count($batchToEmit) >= $emitBatchSize && is_callable($onBatch)) {
                            $onBatch($batchToEmit, count($allResults), $limit);
                            $batchToEmit = [];
                        }
                        if (count($allResults) >= $hardLimit) break;
                    }
                }

                if (count($allResults) >= $targetCount && $ncIdx > 0) break;
            }

            if ($deferQuickProbe) {
                $flushDeferredProbeUpdates(true);
            }
        }
    }

    if ($deferQuickProbe) {
        $flushDeferredProbeUpdates(false);
    }

    // === FINAL EMAIL SWEEP: re-probe leads still missing email ===
    $missingEmail = [];
    foreach ($allResults as $finalIdx => $finalLead) {
        $fe = trim((string) ($finalLead['email'] ?? ''));
        $fu = trim((string) ($finalLead['url'] ?? ''));
        if ($fe === '' && $fu !== '') {
            $missingEmail[] = $finalLead;
        }
    }
    if (!empty($missingEmail)) {
        $sweepBudget = min(count($missingEmail), 300);
        $sweepTimeout = max(($quickProbeEnabled ? $quickProbeTimeout : 5), 5);
        $sweepConcurrency = $quickProbeEnabled ? $quickProbeConcurrency : 20;
        if (is_callable($onStatus)) {
            $onStatus([
                'message' => 'Final email sweep: re-probing ' . $sweepBudget . ' leads...',
                'phase' => 'email_sweep',
                'progress' => 97,
            ]);
        }
        $sweepResults = customFetcherQuickEmailProbeLeads($missingEmail, $sweepTimeout, $sweepConcurrency, $sweepBudget);
        $sweepUpdates = [];
        foreach ($sweepResults as $sweepLead) {
            $sweepId = (string) ($sweepLead['id'] ?? '');
            if ($sweepId === '') continue;
            foreach ($allResults as $srIdx => &$srLead) {
                if (($srLead['id'] ?? '') === $sweepId) {
                    $newEmail = trim((string) ($sweepLead['email'] ?? ''));
                    if ($newEmail !== '' && trim((string) ($srLead['email'] ?? '')) === '') {
                        $srLead['email'] = $newEmail;
                        if (isset($sweepLead['enrichment'])) {
                            $srLead['enrichment'] = $sweepLead['enrichment'];
                        }
                        $sweepUpdates[] = $srLead;
                    }
                    break;
                }
            }
            unset($srLead);
        }
        if (!empty($sweepUpdates) && is_callable($onBatch)) {
            $onBatch($sweepUpdates, count($allResults), $limit);
        }
    }

    if (!empty($batchToEmit) && is_callable($onBatch)) {
        $onBatch($batchToEmit, count($allResults), $limit);
    }

    return array_slice($allResults, 0, $hardLimit);
}

function streamCustomOneShotSearch($service, $location, $limit, $filters, $filtersActive, $targetCount)
{
    $engineMode = customFetcherEngineMode();
    $useNoKeyOutscraper = customFetcherUseNoKeyOutscraperStyle();
    $sources = customFetcherResolveSources();
    if (empty($sources)) {
        sendSSE('error', ['error' => 'Custom fetcher has no available discovery sources.']);
        return;
    }
    $streamSources = $useNoKeyOutscraper
        ? ['no_key']
        : $sources;
    $inlineEnrichment = customFetcherInlineEnrichmentEnabled();

    $locations = customFetcherBuildLocations($location, $limit, $filtersActive);
    $variants = customFetcherBuildServiceVariants($service, $limit, $filtersActive);
    $queries = customFetcherBuildQueries($variants, $locations, $limit, $filtersActive);

    sendSSE('start', [
        'query' => "$service in $location",
        'limit' => $limit,
        'targetCount' => $targetCount,
        'sources' => array_map(function ($s) {
            if ($s === 'serper')
                return 'Serper';
            if ($s === 'google')
                return 'Google CSE';
            if ($s === 'bing')
                return 'Bing Web';
            if ($s === 'no_key')
                return 'No-Key Web';
            return strtoupper($s);
        }, $streamSources),
        'estimatedSources' => count($streamSources),
        'locationCount' => count($locations),
        'variantCount' => count($variants),
        'estimatedQueries' => count($queries),
        'enrichmentEnabled' => false,
        'enrichmentSessionId' => null,
        'inlineEnrichment' => $inlineEnrichment,
        'engineMode' => $engineMode,
        'noKeyOutscraperStyle' => $useNoKeyOutscraper,
    ]);

    try {
        $results = customFetcherSearchAndEnrich(
            $service,
            $location,
            $limit,
            $filters,
            $filtersActive,
            $targetCount,
            function ($status) {
                sendSSE('status', $status);
            },
            function ($batch, $total, $requested) {
                $progress = min(100, (int) round(($total / max(1, $requested)) * 100));
                sendSSE('results', [
                    'leads' => $batch,
                    'total' => $total,
                    'progress' => $progress,
                    'source' => 'Custom One-Shot Fetcher',
                ]);
            }
        );

        sendSSE('complete', [
            'total' => count($results),
            'requested' => $limit,
            'targetCount' => $targetCount,
            'coverage' => round((count($results) / max(1, $limit)) * 100, 2),
            'sources' => ['Custom One-Shot Fetcher'],
            'query' => [
                'service' => $service,
                'location' => $location,
                'limit' => $limit,
            ],
            'enrichmentSessionId' => null,
            'enrichmentEnabled' => false,
            'message' => "Custom one-shot search complete. Found " . count($results) . " leads.",
        ]);
    } catch (Exception $e) {
        sendSSE('error', ['error' => $e->getMessage()]);
    }
}

function searchCustomOneShotNonStream($service, $location, $limit, $filters, $filtersActive, $targetCount = null)
{
    return customFetcherSearchAndEnrich(
        $service,
        $location,
        $limit,
        $filters,
        $filtersActive,
        $targetCount
    );
}

function customFetcherIsLikelyBusinessWebsite($url)
{
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    if ($host === '')
        return false;
    $blocked = [
        'facebook.com',
        'linkedin.com',
        'instagram.com',
        'youtube.com',
        'tiktok.com',
        'yelp.com',
        'mapquest.com',
        'yellowpages.com',
        'bbb.org',
        'manta.com',
        'google.com',
        'bing.com',
        'maps.google.com',
        'duckduckgo.com',
    ];
    foreach ($blocked as $domain) {
        if ($host === $domain || customFetcherEndsWith($host, '.' . $domain)) {
            return false;
        }
    }
    return true;
}

function customFetcherEndsWith($haystack, $needle)
{
    $haystack = (string) $haystack;
    $needle = (string) $needle;
    if ($needle === '')
        return true;
    $len = strlen($needle);
    if ($len > strlen($haystack))
        return false;
    return substr($haystack, -$len) === $needle;
}

function customFetcherDiscoverWebsiteForBusiness($businessName, $location = '')
{
    $query = trim($businessName . ' ' . $location . ' official website');
    if ($query === '')
        return '';

    $sources = customFetcherResolveSources();
    if (in_array('serper', $sources, true)) {
        $rows = customFetcherSearchSerperOrganic($query, 10);
        foreach ($rows as $row) {
            $candidate = trim((string) ($row['url'] ?? ''));
            if ($candidate !== '' && customFetcherIsLikelyBusinessWebsite($candidate))
                return $candidate;
        }
    }

    if (in_array('google', $sources, true)) {
        $rows = customFetcherSearchGoogleCustom($query, 10);
        foreach ($rows as $row) {
            $candidate = trim((string) ($row['url'] ?? ''));
            if ($candidate !== '' && customFetcherIsLikelyBusinessWebsite($candidate))
                return $candidate;
        }
    }
    if (in_array('bing', $sources, true)) {
        $rows = customFetcherSearchBingWeb($query, 10);
        foreach ($rows as $row) {
            $candidate = trim((string) ($row['url'] ?? ''));
            if ($candidate !== '' && customFetcherIsLikelyBusinessWebsite($candidate))
                return $candidate;
        }
    }
    // Manual fallback only: try no-key discovery as a last resort.
    $rows = customFetcherSearchNoKey($query, 10);
    foreach ($rows as $row) {
        $candidate = trim((string) ($row['url'] ?? ''));
        if ($candidate !== '' && customFetcherIsLikelyBusinessWebsite($candidate))
            return $candidate;
    }

    return '';
}

function customFetcherEnrichSingle($url, $businessName = '', $location = '')
{
    $url = trim((string) $url);
    $businessName = trim((string) $businessName);
    $location = trim((string) $location);

    if ($url === '' && $businessName !== '') {
        $url = customFetcherDiscoverWebsiteForBusiness($businessName, $location);
    }

    $cacheKey = 'custom_manual_enrich_' . md5($url . '|' . $businessName . '|' . $location);
    $cached = getCache($cacheKey);
    if (is_array($cached)) {
        return array_merge(['cached' => true], $cached);
    }

    $lead = [
        'id' => generateId('cstm_'),
        'name' => $businessName !== '' ? $businessName : 'Unknown Business',
        'url' => $url,
        'snippet' => '',
        'displayLink' => parse_url($url, PHP_URL_HOST) ?? '',
        'address' => $location,
        'phone' => '',
        'email' => '',
        'rating' => null,
        'reviews' => null,
        'source' => 'Custom One-Shot Fetcher',
        'sources' => ['Custom One-Shot Fetcher'],
        'websiteAnalysis' => customFetcherQuickWebsiteCheck($url),
    ];

    $enriched = customFetcherEnrichLeads([$lead], customFetcherContactTimeout(), max(1, min(3, customFetcherEnrichConcurrency())));
    $resultLead = !empty($enriched) ? $enriched[0] : $lead;
    $socials = $resultLead['enrichment']['socials'] ?? [];
    $profiles = [];
    foreach ($socials as $platform => $link) {
        $profiles[$platform] = ['url' => $link];
    }

    $payload = [
        'success' => true,
        'cached' => false,
        'url' => $url,
        'emails' => $resultLead['enrichment']['emails'] ?? [],
        'phones' => $resultLead['enrichment']['phones'] ?? [],
        'profiles' => $profiles,
        'sources' => ['Custom One-Shot Fetcher'],
        'hasWebsite' => !empty($url),
        'intelligence' => null,
        'lead' => $resultLead,
    ];

    setCache($cacheKey, $payload, 43200);
    return $payload;
}
