<?php
/**
 * Cron Job Handler for Processing Scheduled Emails
 * 
 * This script should be set up as a cron job on Hostinger to run every minute:
 * 
 * Cron command (preferred - runs via CLI, no HTTP auth needed):
 * * * * * * /usr/bin/php /home/u497238762/public_html/api/cron-email.php >> /home/u497238762/logs/email-cron.log 2>&1
 * 
 * Or via curl with header authentication ONLY:
 * * * * * * curl -s -H "X-Cron-Secret: YOUR_CRON_SECRET_KEY" "https://bamlead.com/api/cron-email.php"
 * 
 * NOTE: URL parameter authentication has been removed for security
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/email.php';
require_once __DIR__ . '/includes/functions.php';

function cronNormalizeSmtpConfig($config) {
    if (!is_array($config)) return null;
    $normalized = [
        'host' => trim((string)($config['host'] ?? '')),
        'port' => (string)($config['port'] ?? ''),
        'username' => trim((string)($config['username'] ?? '')),
        'password' => (string)($config['password'] ?? ''),
        'fromEmail' => trim((string)($config['fromEmail'] ?? $config['from_email'] ?? '')),
        'fromName' => trim((string)($config['fromName'] ?? $config['from_name'] ?? '')),
        'secure' => $config['secure'] ?? true,
    ];
    if ($normalized['host'] === '' || $normalized['username'] === '' || $normalized['password'] === '') {
        return null;
    }
    return $normalized;
}

function cronUnknownSmtpColumnError($exception) {
    $message = strtolower((string)($exception instanceof Throwable ? $exception->getMessage() : $exception));
    return strpos($message, 'unknown column') !== false && strpos($message, 'smtp_config') !== false;
}

function cronEnsureUserSmtpFallbackTable($db) {
    $db->query(
        "CREATE TABLE IF NOT EXISTS user_smtp_configs (
            user_id INT NOT NULL PRIMARY KEY,
            smtp_config TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cronLoadUserSmtpConfig($db, $userId) {
    try {
        $row = $db->fetchOne("SELECT smtp_config FROM users WHERE id = ?", [$userId]);
        if ($row && !empty($row['smtp_config'])) {
            $config = json_decode((string)$row['smtp_config'], true);
            $normalized = cronNormalizeSmtpConfig($config);
            if ($normalized) return $normalized;
        }
    } catch (Exception $e) {
        if (!cronUnknownSmtpColumnError($e)) {
            throw $e;
        }
    }

    try {
        cronEnsureUserSmtpFallbackTable($db);
        $row = $db->fetchOne("SELECT smtp_config FROM user_smtp_configs WHERE user_id = ?", [$userId]);
        if ($row && !empty($row['smtp_config'])) {
            $config = json_decode((string)$row['smtp_config'], true);
            $normalized = cronNormalizeSmtpConfig($config);
            if ($normalized) return $normalized;
        }
    } catch (Exception $e) {
        error_log('Cron SMTP fallback load failed: ' . $e->getMessage());
    }

    return null;
}

// Security: Check IP whitelist AND cron key if called via HTTP
if (php_sapi_name() !== 'cli') {
    // Check IP whitelist first
    if (!isAllowedCronIP()) {
        error_log("Cron email access denied - IP not whitelisted: " . getClientIP());
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden - IP not allowed']);
        exit();
    }
    
    // Only accept header-based authentication (URL parameter removed for security)
    $cronKey = $_SERVER['HTTP_X_CRON_SECRET'] ?? '';
    if (!defined('CRON_SECRET_KEY') || empty($cronKey) || !hash_equals(CRON_SECRET_KEY, $cronKey)) {
        error_log("Cron email access denied - invalid key from IP: " . getClientIP());
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit();
    }
}

header('Content-Type: application/json');

try {
    $db = getDB();
    $workerBatchLimit = defined('EMAIL_DRIP_WORKER_BATCH_SIZE') ? max(1, (int)EMAIL_DRIP_WORKER_BATCH_SIZE) : 60;
    $interSendDelayUs = defined('EMAIL_DRIP_INTER_SEND_DELAY_US') ? max(0, (int)EMAIL_DRIP_INTER_SEND_DELAY_US) : 50000;
    
    // Get emails due for sending (include smtp_config for per-user SMTP).
    // Include legacy/transient queue states so stalled rows can recover.
    $pendingEmails = $db->fetchAll(
        "SELECT es.*, es.smtp_config, et.body_text as template_body_text
         FROM email_sends es
         LEFT JOIN email_templates et ON es.template_id = et.id
         WHERE (es.status IN ('scheduled', 'pending', 'sending') OR es.status = '')
           AND es.sent_at IS NULL
           AND es.scheduled_for IS NOT NULL
           AND es.scheduled_for <= NOW()
         ORDER BY es.scheduled_for ASC
         LIMIT {$workerBatchLimit}",
        []
    );
    
    if (!$pendingEmails || count($pendingEmails) === 0) {
        echo json_encode(['success' => true, 'processed' => 0, 'message' => 'No emails to process']);
        exit();
    }
    
    $processed = 0;
    $failed = 0;
    $details = [];
    
    $smtpByUser = [];
    foreach ($pendingEmails as $email) {
        // Claim row before sending to avoid duplicate sends from concurrent workers.
        // Use "pending" claim status to remain compatible with older enum definitions.
        $claimed = $db->update(
            "UPDATE email_sends
             SET status = 'pending', error_message = NULL
             WHERE id = ?
               AND sent_at IS NULL
               AND (status IN ('scheduled', 'pending', 'sending') OR status = '')",
            [$email['id']]
        );
        if ($claimed < 1) {
            continue;
        }

        $textBody = $email['template_body_text'] ?? strip_tags($email['body_html']);
        
        // Use per-email SMTP config if stored; otherwise load this user's saved SMTP config.
        $smtpOverride = null;
        if (!empty($email['smtp_config'])) {
            $smtpOverride = cronNormalizeSmtpConfig(json_decode((string)$email['smtp_config'], true));
        }
        $uid = (int)($email['user_id'] ?? 0);
        if (!$smtpOverride && $uid > 0) {
            if (!array_key_exists($uid, $smtpByUser)) {
                $smtpByUser[$uid] = cronLoadUserSmtpConfig($db, $uid);
            }
            $smtpOverride = $smtpByUser[$uid];
        }

        if (!$smtpOverride) {
            $db->update(
                "UPDATE email_sends SET status = 'failed', error_message = 'No SMTP config saved for this user' WHERE id = ?",
                [$email['id']]
            );
            $failed++;
            $details[] = [
                'id' => $email['id'],
                'email' => $email['recipient_email'],
                'status' => 'failed',
                'reason' => 'Missing user SMTP config'
            ];
            continue;
        }

        $sent = sendEmailWithCustomSMTP($email['recipient_email'], $email['subject'], $email['body_html'], $textBody, $smtpOverride);
        
        if ($sent) {
            $db->update(
                "UPDATE email_sends SET status = 'sent', sent_at = NOW() WHERE id = ?",
                [$email['id']]
            );
            $processed++;
            $details[] = [
                'id' => $email['id'],
                'email' => $email['recipient_email'],
                'status' => 'sent'
            ];
        } else {
            $db->update(
                "UPDATE email_sends SET status = 'failed', error_message = 'SMTP error during cron send' WHERE id = ?",
                [$email['id']]
            );
            $failed++;
            $details[] = [
                'id' => $email['id'],
                'email' => $email['recipient_email'],
                'status' => 'failed'
            ];
        }
        
        // Small delay between sends to avoid rate limiting (tunable via config).
        if ($interSendDelayUs > 0) {
            usleep($interSendDelayUs);
        }
    }
    
    // Log results
    $logMessage = date('Y-m-d H:i:s') . " - Processed: $processed, Failed: $failed\n";
    error_log($logMessage);
    
    echo json_encode([
        'success' => true,
        'processed' => $processed,
        'failed' => $failed,
        'timestamp' => date('Y-m-d H:i:s'),
        'details' => $details
    ]);
    
} catch (Exception $e) {
    error_log("Cron email error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
