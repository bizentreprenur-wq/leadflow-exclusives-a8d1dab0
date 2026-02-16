<?php
/**
 * Custom Fetcher Enrichment Endpoint
 *
 * Replaces manual BamLead scraper usage for social/contact lookups.
 * Supports single and batch payloads.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/includes/custom_fetcher.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

if (!customFetcherEnabled()) {
    sendError('Custom one-shot fetcher is disabled in config.', 503);
}

$user = getCurrentUser();
if ($user) {
    enforceRateLimit($user, 'search');
}

$input = $_SERVER['REQUEST_METHOD'] === 'POST' ? getJsonInput() : $_GET;
if ($input === null) {
    sendError('Invalid JSON input');
}

$businesses = $input['businesses'] ?? null;
$url = sanitizeInput($input['url'] ?? '', 500);
$businessName = sanitizeInput($input['business_name'] ?? ($input['name'] ?? ''), 200);
$location = sanitizeInput($input['location'] ?? '', 200);

if (is_array($businesses) && !empty($businesses)) {
    $results = [];
    $count = 0;

    foreach (array_slice($businesses, 0, 25) as $biz) {
        if (!is_array($biz)) continue;
        $bizUrl = sanitizeInput($biz['url'] ?? '', 500);
        $bizName = sanitizeInput($biz['name'] ?? ($biz['business_name'] ?? ''), 200);
        $bizLocation = sanitizeInput($biz['location'] ?? '', 200);
        if ($bizUrl === '' && $bizName === '') continue;

        $enriched = customFetcherEnrichSingle($bizUrl, $bizName, $bizLocation);
        $key = $bizUrl !== '' ? $bizUrl : $bizName;
        $results[$key] = $enriched;
        $count++;
    }

    sendJson([
        'success' => true,
        'results' => $results,
        'count' => $count,
    ]);
}

if ($url === '' && $businessName === '') {
    sendError('URL or business_name is required');
}

$result = customFetcherEnrichSingle($url, $businessName, $location);
sendJson($result);

