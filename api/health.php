<?php
/**
 * Health Check Endpoint
 * Returns JSON status to verify API is reachable and configured correctly
 * Deployed: 2026-01-18 v5
 * GitHub sync test - verifying connection
 */

require_once __DIR__ . '/includes/functions.php';
header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$checks = [
    'api' => true,
    'php_version' => PHP_VERSION,
    'timestamp' => date('c'),
];

// Check if includes exist
$checks['includes_exists'] = file_exists(__DIR__ . '/includes/functions.php');
$checks['auth_exists'] = file_exists(__DIR__ . '/includes/auth.php');
$checks['database_exists'] = file_exists(__DIR__ . '/includes/database.php');

// Check if config exists
$checks['config_exists'] = file_exists(__DIR__ . '/config.php');

// Try to load database connection
if ($checks['config_exists'] && $checks['database_exists']) {
    try {
        require_once __DIR__ . '/config.php';
        require_once __DIR__ . '/includes/database.php';

        $db = getDB();
        $pdo = $db->getConnection();
        $checks['database_connected'] = $pdo instanceof PDO;
    } catch (Exception $e) {
        $checks['database_connected'] = false;
        $checks['database_error'] = $e->getMessage();
    }
} else {
    $checks['database_connected'] = false;
}

// Overall status
$allGood = $checks['includes_exists'] && $checks['auth_exists'] && $checks['database_exists'] && $checks['config_exists'] && $checks['database_connected'];

echo json_encode([
    'status' => $allGood ? 'ok' : 'degraded',
    'version' => '1.0.3',
    'deployed' => '2026-01-18T00:00:00Z',
    'checks' => $checks,
], JSON_PRETTY_PRINT);
