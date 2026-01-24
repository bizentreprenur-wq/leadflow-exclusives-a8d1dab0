<?php
/**
 * Email Configuration Diagnostic Endpoint
 * 
 * Checks email setup without sending emails.
 * Returns configuration status for debugging.
 * 
 * Usage: GET /api/email-diagnostic.php?key=YOUR_CRON_SECRET_KEY
 */

require_once __DIR__ . '/includes/functions.php';

// Set JSON response headers
header('Content-Type: application/json');
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Security: Verify CRON_SECRET_KEY
$providedKey = $_GET['key'] ?? ($_SERVER['HTTP_X_CRON_SECRET'] ?? '');
$expectedKey = defined('CRON_SECRET_KEY') ? CRON_SECRET_KEY : '';

if (empty($expectedKey) || !hash_equals($expectedKey, $providedKey)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing secret key']);
    exit;
}

// Gather diagnostic information
$diagnostics = [
    'timestamp' => date('Y-m-d H:i:s T'),
    'php_version' => phpversion(),
    'checks' => []
];

// Check 1: Config loaded
$diagnostics['checks']['config_loaded'] = [
    'status' => defined('MAIL_FROM_ADDRESS') ? 'pass' : 'fail',
    'message' => defined('MAIL_FROM_ADDRESS') ? 'Config loaded successfully' : 'Config not loaded or MAIL_FROM_ADDRESS not defined'
];

// Check 2: SMTP configuration
$smtpConfigured = defined('SMTP_HOST') && SMTP_HOST && defined('SMTP_USER') && SMTP_USER;
$diagnostics['checks']['smtp_configured'] = [
    'status' => $smtpConfigured ? 'pass' : 'warn',
    'message' => $smtpConfigured ? 'SMTP configured' : 'SMTP not configured - will use native mail()',
    'details' => $smtpConfigured ? [
        'host' => SMTP_HOST,
        'port' => defined('SMTP_PORT') ? SMTP_PORT : 'not set',
        'user' => SMTP_USER,
        'secure' => defined('SMTP_SECURE') ? SMTP_SECURE : 'not set',
        'password_set' => defined('SMTP_PASS') && SMTP_PASS ? 'yes' : 'NO - MISSING!'
    ] : null
];

// Check 3: PHPMailer installed
$phpMailerInstalled = class_exists('PHPMailer\PHPMailer\PHPMailer');
if (!$phpMailerInstalled) {
    // Try to load via composer autoload
    $autoloadPath = __DIR__ . '/vendor/autoload.php';
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        $phpMailerInstalled = class_exists('PHPMailer\PHPMailer\PHPMailer');
    }
}
$diagnostics['checks']['phpmailer_installed'] = [
    'status' => $phpMailerInstalled ? 'pass' : 'warn',
    'message' => $phpMailerInstalled ? 'PHPMailer is installed' : 'PHPMailer NOT installed - using native mail()',
    'fix' => $phpMailerInstalled ? null : 'Run: cd api && composer require phpmailer/phpmailer'
];

// Check 4: Mail from configuration
$diagnostics['checks']['mail_from'] = [
    'status' => defined('MAIL_FROM_ADDRESS') && filter_var(MAIL_FROM_ADDRESS, FILTER_VALIDATE_EMAIL) ? 'pass' : 'fail',
    'from_address' => defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : 'not set',
    'from_name' => defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'not set'
];

// Check 5: Frontend URL for verification links
$diagnostics['checks']['frontend_url'] = [
    'status' => defined('FRONTEND_URL') && FRONTEND_URL ? 'pass' : 'fail',
    'value' => defined('FRONTEND_URL') ? FRONTEND_URL : 'not set',
    'message' => defined('FRONTEND_URL') && FRONTEND_URL ? 'Frontend URL configured' : 'FRONTEND_URL not set - verification links will be broken!'
];

// Check 6: Verification tokens table
try {
    require_once __DIR__ . '/includes/database.php';
    $db = getDB();
    $tableCheck = $db->fetchOne("SHOW TABLES LIKE 'verification_tokens'");
    $diagnostics['checks']['verification_tokens_table'] = [
        'status' => $tableCheck ? 'pass' : 'fail',
        'message' => $tableCheck ? 'Table exists' : 'Table missing - run api/database/verification_tokens.sql'
    ];
} catch (Exception $e) {
    $diagnostics['checks']['verification_tokens_table'] = [
        'status' => 'fail',
        'message' => 'Database error: ' . $e->getMessage()
    ];
}

// Check 7: Email log directory
$logDir = __DIR__ . '/logs';
$logFile = $logDir . '/email.log';
$diagnostics['checks']['log_directory'] = [
    'status' => is_writable($logDir) || is_writable(dirname($logDir)) ? 'pass' : 'warn',
    'path' => $logDir,
    'writable' => is_writable($logDir) ? 'yes' : 'no',
    'log_exists' => file_exists($logFile) ? 'yes' : 'no'
];

// Check 8: SMTP connectivity test (if configured)
if ($smtpConfigured) {
    $smtpTest = @fsockopen(SMTP_HOST, SMTP_PORT, $errno, $errstr, 5);
    $diagnostics['checks']['smtp_connectivity'] = [
        'status' => $smtpTest ? 'pass' : 'fail',
        'message' => $smtpTest ? 'Can connect to SMTP server' : "Cannot connect: {$errstr} ({$errno})",
        'host' => SMTP_HOST,
        'port' => SMTP_PORT
    ];
    if ($smtpTest) {
        fclose($smtpTest);
    }
}

// Check 9: Recent email log entries
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    $logLines = array_filter(explode("\n", $logContent));
    $recentLogs = array_slice($logLines, -10); // Last 10 entries
    $diagnostics['recent_logs'] = $recentLogs;
}

// Overall status
$hasFailure = false;
foreach ($diagnostics['checks'] as $check) {
    if ($check['status'] === 'fail') {
        $hasFailure = true;
        break;
    }
}

$diagnostics['overall_status'] = $hasFailure ? 'issues_found' : 'ok';
$diagnostics['success'] = true;

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
