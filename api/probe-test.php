<?php
/**
 * Quick Email Probe Diagnostic
 * Tests if the email extraction pipeline works on a given URL.
 * Usage: GET /api/probe-test.php?url=https://example.com
 * No-URL: GET /api/probe-test.php  (shows config + function availability)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// Capture any warnings/notices
$phpErrors = [];
set_error_handler(function($errno, $errstr, $errfile, $errline) use (&$phpErrors) {
    $phpErrors[] = "$errstr in $errfile:$errline";
    return true;
});

header('Content-Type: application/json');

// Try loading dependencies one by one to find where it breaks
$loadStatus = [];

try {
    require_once __DIR__ . '/config.php';
    $loadStatus['config'] = 'ok';
} catch (Throwable $e) {
    $loadStatus['config'] = 'FAIL: ' . $e->getMessage();
}

try {
    require_once __DIR__ . '/includes/functions.php';
    $loadStatus['functions'] = 'ok';
} catch (Throwable $e) {
    $loadStatus['functions'] = 'FAIL: ' . $e->getMessage();
}

if (function_exists('setCorsHeaders')) { setCorsHeaders(); }
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    require_once __DIR__ . '/includes/custom_fetcher.php';
    $loadStatus['custom_fetcher'] = 'ok';
} catch (Throwable $e) {
    $loadStatus['custom_fetcher'] = 'FAIL: ' . $e->getMessage();
}

$functionChecks = [
    'extractEmails' => function_exists('extractEmails'),
    'customFetcherPageUrls' => function_exists('customFetcherPageUrls'),
    'customFetcherEnrichSingle' => function_exists('customFetcherEnrichSingle'),
    'quickEmailProbe' => function_exists('quickEmailProbe'),
    'customFetcherQuickEmailProbe' => function_exists('customFetcherQuickEmailProbe'),
    'setCorsHeaders' => function_exists('setCorsHeaders'),
    'sanitizeInput' => function_exists('sanitizeInput'),
    'customFetcherEnabled' => function_exists('customFetcherEnabled'),
];

$configChecks = [
    'ENABLE_CUSTOM_ONE_SHOT_FETCHER' => defined('ENABLE_CUSTOM_ONE_SHOT_FETCHER') ? ENABLE_CUSTOM_ONE_SHOT_FETCHER : 'NOT DEFINED',
    'CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE' => defined('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE') ? CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE : 'NOT DEFINED',
    'CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE' => defined('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE') ? CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE : 'NOT DEFINED',
    'CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC' => defined('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC') ? CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC : 'NOT DEFINED',
    'CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY' => defined('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY') ? CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY : 'NOT DEFINED',
    'CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY' => defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY') ? CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY : 'NOT DEFINED',
];

$url = $_GET['url'] ?? '';

if (empty($url)) {
    echo json_encode([
        'success' => true,
        'message' => 'Probe diagnostic — pass ?url=https://example.com to test extraction',
        'load_status' => $loadStatus,
        'functions_available' => $functionChecks,
        'config_values' => $configChecks,
        'php_errors' => $phpErrors,
        'php_version' => phpversion(),
        'curl_available' => function_exists('curl_init'),
        'allow_url_fopen' => ini_get('allow_url_fopen'),
    ], JSON_PRETTY_PRINT);
    exit;
}

// Run actual probe
try {
    if (!function_exists('customFetcherEnrichSingle')) {
        throw new Exception('customFetcherEnrichSingle() not found — custom_fetcher.php is outdated or failed to load');
    }

    $start = microtime(true);
    $result = customFetcherEnrichSingle($url, '', '');
    $elapsed = round((microtime(true) - $start) * 1000);

    echo json_encode([
        'success' => true,
        'url' => $url,
        'elapsed_ms' => $elapsed,
        'emails_found' => $result['emails'] ?? [],
        'phones_found' => $result['phone'] ?? [],
        'social_profiles' => array_keys($result['profiles'] ?? []),
        'sources' => $result['sources'] ?? [],
        'pages_crawled' => $result['pages_crawled'] ?? 'unknown',
        'functions_available' => $functionChecks,
        'config_values' => $configChecks,
        'php_errors' => $phpErrors,
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile() . ':' . $e->getLine(),
        'trace' => array_slice(explode("\n", $e->getTraceAsString()), 0, 10),
        'load_status' => $loadStatus,
        'functions_available' => $functionChecks,
        'config_values' => $configChecks,
        'php_errors' => $phpErrors,
    ], JSON_PRETTY_PRINT);
}
