<?php
/**
 * Quick Email Probe Diagnostic
 * Tests if the email extraction pipeline works on a given URL.
 * Usage: GET /api/probe-test.php?url=https://example.com
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/custom_fetcher.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$url = $_GET['url'] ?? '';
if (empty($url)) {
    echo json_encode([
        'success' => false,
        'error' => 'Pass ?url=https://example.com',
        'diagnostics' => [
            'quick_email_probe_enabled' => defined('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE') ? CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE : 'NOT DEFINED',
            'defer_probe' => defined('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE') ? CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE : 'NOT DEFINED',
            'timeout_sec' => defined('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC') ? CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC : 'NOT DEFINED',
            'concurrency' => defined('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY') ? CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY : 'NOT DEFINED',
            'extractEmails_exists' => function_exists('extractEmails'),
            'customFetcherPageUrls_exists' => function_exists('customFetcherPageUrls'),
            'customFetcherEnrichSingle_exists' => function_exists('customFetcherEnrichSingle'),
            'quickEmailProbe_exists' => function_exists('quickEmailProbe'),
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// Run the actual probe
$start = microtime(true);
$result = customFetcherEnrichSingle($url, '', '');
$elapsed = round((microtime(true) - $start) * 1000);

echo json_encode([
    'success' => true,
    'url' => $url,
    'elapsed_ms' => $elapsed,
    'emails_found' => $result['emails'] ?? [],
    'phones_found' => $result['phone'] ?? [],
    'social_profiles' => $result['profiles'] ?? [],
    'pages_crawled' => $result['pages_crawled'] ?? 'unknown',
    'diagnostics' => [
        'quick_email_probe_enabled' => CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE,
        'extractEmails_exists' => function_exists('extractEmails'),
        'customFetcherPageUrls_exists' => function_exists('customFetcherPageUrls'),
        'quickEmailProbe_exists' => function_exists('quickEmailProbe'),
    ]
], JSON_PRETTY_PRINT);
