<?php
/**
 * Email Test Endpoint
 * 
 * Protected endpoint to test email delivery and HTML rendering.
 * Requires CRON_SECRET_KEY + IP whitelist for access.
 * 
 * Usage:
 *   GET /api/email-test.php?key=YOUR_CRON_SECRET_KEY&to=test@example.com
 *   
 * Headers alternative:
 *   X-Cron-Secret: YOUR_CRON_SECRET_KEY
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/email.php';

// Set JSON response headers
header('Content-Type: application/json');
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
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

// Security: Verify IP whitelist
if (!isAllowedCronIP()) {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'error' => 'IP not whitelisted',
        'ip' => getClientIP()
    ]);
    exit;
}

// Get recipient email (required)
$to = $_GET['to'] ?? '';
if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Valid "to" email parameter required']);
    exit;
}

// Build test HTML email
$timestamp = date('Y-m-d H:i:s T');
$htmlBody = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #14b8a6; }
        .logo { font-size: 28px; font-weight: bold; color: #14b8a6; }
        .content { background: #f8fafc; border-radius: 8px; padding: 30px; margin: 20px 0; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; }
        .info { background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 12px; margin: 10px 0; font-size: 14px; }
        .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
        code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎉 BamLead Email Test</div>
        </div>
        <div class="content">
            <h2>Email Delivery Test Successful!</h2>
            <div class="success">
                <strong>✅ HTML rendering is working correctly</strong><br>
                If you can see styled content with colors and formatting, your email configuration is correct.
            </div>
            <div class="info">
                <strong>Timestamp:</strong> <code>{$timestamp}</code>
            </div>
            <div class="info">
                <strong>Recipient:</strong> <code>{$to}</code>
            </div>
            <div class="info">
                <strong>SMTP Configured:</strong> <code>SMTP_HOST</code>
            </div>
            <p>This test email confirms that:</p>
            <ul>
                <li>✅ Email sending is functional</li>
                <li>✅ HTML Content-Type headers are set correctly</li>
                <li>✅ CSS styles are being applied</li>
                <li>✅ Your mail server accepted the message</li>
            </ul>
        </div>
        <div class="footer">
            <p>This is an automated test email from BamLead.</p>
            <p>&copy; 2026 BamLead. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;

// Attempt to send the email
$subject = 'BamLead Email Test - ' . $timestamp;
$startTime = microtime(true);

try {
    $result = sendEmail($to, $subject, $htmlBody);
    $duration = round((microtime(true) - $startTime) * 1000, 2);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Test email sent successfully',
            'details' => [
                'to' => $to,
                'subject' => $subject,
                'timestamp' => $timestamp,
                'duration_ms' => $duration,
                'smtp_configured' => defined('SMTP_HOST') && SMTP_HOST ? true : false,
                'from' => defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : 'not configured'
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Email send returned false',
            'details' => [
                'to' => $to,
                'duration_ms' => $duration,
                'smtp_configured' => defined('SMTP_HOST') && SMTP_HOST ? true : false
            ]
        ]);
    }
} catch (Exception $e) {
    $duration = round((microtime(true) - $startTime) * 1000, 2);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => [
            'to' => $to,
            'duration_ms' => $duration,
            'smtp_configured' => defined('SMTP_HOST') && SMTP_HOST ? true : false
        ]
    ]);
}
