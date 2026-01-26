<?php
/**
 * Email Helper Functions for BamLead
 * Uses PHPMailer or native mail() function
 * Includes detailed logging for debugging
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/database.php';

// Load Composer autoloader if present (needed for PHPMailer)
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
}

// Email log file path
define('EMAIL_LOG_FILE', __DIR__ . '/../logs/email.log');

/**
 * Log email events for debugging
 */
function logEmail($level, $message, $context = []) {
    $logDir = dirname(EMAIL_LOG_FILE);
    if (!is_dir($logDir)) {
        // Best-effort: hosting environments may block writes in /api
        @mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $contextStr = !empty($context) ? ' | ' . json_encode($context) : '';
    $logLine = "[{$timestamp}] [{$level}] {$message}{$contextStr}\n";

    // If the log directory/file isn't writable (common on Hostinger unless permissions are set),
    // fall back to the PHP error log. Logging must never break email sending.
    $dirWritable = is_dir($logDir) && is_writable($logDir);
    $fileWritable = file_exists(EMAIL_LOG_FILE) && is_writable(EMAIL_LOG_FILE);
    if (!$dirWritable && !$fileWritable) {
        error_log('[EMAIL_LOG_FALLBACK] ' . trim($logLine));
        return false;
    }

    $ok = @file_put_contents(EMAIL_LOG_FILE, $logLine, FILE_APPEND | LOCK_EX);
    if ($ok === false) {
        error_log('[EMAIL_LOG_WRITE_FAIL] ' . trim($logLine));
        return false;
    }
    return true;
}

/**
 * Send an email using PHP's mail function or SMTP
 */
function sendEmail($to, $subject, $htmlBody, $textBody = '') {
    logEmail('INFO', 'Attempting to send email', [
        'to' => $to,
        'subject' => $subject,
        'smtp_configured' => defined('SMTP_HOST') && SMTP_HOST ? 'yes' : 'no',
        'composer_autoload_present' => file_exists(__DIR__ . '/../vendor/autoload.php') ? 'yes' : 'no',
        'phpmailer_available' => class_exists('PHPMailer\PHPMailer\PHPMailer') ? 'yes' : 'no'
    ]);
    
    // Check if we should use SMTP (PHPMailer)
    if (defined('SMTP_HOST') && SMTP_HOST) {
        return sendEmailSMTP($to, $subject, $htmlBody, $textBody);
    }

    return sendEmailNative($to, $subject, $htmlBody);
}

/**
 * Send HTML email using PHP's native mail() with the correct headers.
 */
function sendEmailNative($to, $subject, $htmlBody) {
    logEmail('INFO', 'Using native mail() function', ['to' => $to]);
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_ADDRESS . '>',
        'Reply-To: ' . MAIL_FROM_ADDRESS,
        'X-Mailer: PHP/' . phpversion()
    ];

    $headerString = implode("\r\n", $headers);
    
    $result = @mail($to, $subject, $htmlBody, $headerString);
    
    if ($result) {
        logEmail('SUCCESS', 'Native mail() sent successfully', ['to' => $to]);
    } else {
        $lastError = error_get_last();
        logEmail('ERROR', 'Native mail() failed', [
            'to' => $to,
            'error' => $lastError['message'] ?? 'Unknown error',
            'from' => MAIL_FROM_ADDRESS
        ]);
    }
    
    return $result;
}

/**
 * Send email via SMTP (requires PHPMailer)
 */
function sendEmailSMTP($to, $subject, $htmlBody, $textBody = '') {
    // Attempt to load PHPMailer via Composer autoload (in case this file was loaded before autoload)
    $autoloadPath = __DIR__ . '/../vendor/autoload.php';
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer') && file_exists($autoloadPath)) {
        require_once $autoloadPath;
    }

    // If PHPMailer is not installed, fall back to native mail
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        logEmail('WARN', 'PHPMailer not installed, falling back to native mail()', [
            'to' => $to,
            'hint' => 'Run: composer require phpmailer/phpmailer'
        ]);
        return sendEmailNative($to, $subject, $htmlBody);
    }

    // Validate SMTP configuration (avoid undefined constants / half-configured SMTP)
    $smtpHost = defined('SMTP_HOST') ? trim((string) SMTP_HOST) : '';
    $smtpPort = defined('SMTP_PORT') ? (int) SMTP_PORT : 587;
    // Normalize to avoid edge-case mailbox validation issues
    $smtpUser = defined('SMTP_USER') ? strtolower(trim((string) SMTP_USER)) : '';
    $smtpPass = defined('SMTP_PASS') ? (string) SMTP_PASS : '';
    $smtpSecure = defined('SMTP_SECURE') ? strtolower(trim((string) SMTP_SECURE)) : '';

    if (!$smtpHost || !$smtpUser || !$smtpPass) {
        logEmail('ERROR', 'SMTP configuration incomplete', [
            'to' => $to,
            'host_set' => $smtpHost ? 'yes' : 'no',
            'user_set' => $smtpUser ? 'yes' : 'no',
            'pass_set' => $smtpPass ? 'yes' : 'no',
            'port' => $smtpPort,
            'secure' => $smtpSecure ?: 'not set',
        ]);
        return false;
    }
    
    logEmail('INFO', 'Using PHPMailer SMTP', [
        'to' => $to,
        'host' => $smtpHost,
        'port' => $smtpPort,
        'user' => $smtpUser,
        'secure' => $smtpSecure ?: 'not set'
    ]);
    
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->SMTPAuth = true;
        $mail->Username = $smtpUser;
        $mail->Password = $smtpPass;

        // Map common values to PHPMailer encryption constants (more robust than raw strings)
        if ($smtpSecure === 'ssl' || $smtpSecure === 'smtps') {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($smtpSecure === 'tls' || $smtpSecure === 'starttls') {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPSecure = '';
        }

        $mail->Port = $smtpPort;
        // For implicit TLS (port 465 / SMTPS), do not attempt STARTTLS upgrades.
        $mail->SMTPAutoTLS = !($smtpPort === 465 || $mail->SMTPSecure === \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS);
        $mail->Timeout = 10;
        $mail->CharSet = 'UTF-8';
        
        // Enable safe SMTP debug logging when SMTP_DEBUG is true.
        // This logs server responses only (no credentials or client commands).
        if (defined('SMTP_DEBUG') && SMTP_DEBUG) {
            $mail->SMTPDebug = \PHPMailer\PHPMailer\SMTP::DEBUG_SERVER;
            $mail->Debugoutput = function ($str, $level) {
                $line = trim((string) $str);
                if ($line === '') {
                    return;
                }
                if (stripos($line, 'SERVER -> CLIENT:') === 0 || stripos($line, 'SMTP NOTICE:') === 0 || stripos($line, 'CONNECTION:') === 0) {
                    logEmail('DEBUG', 'SMTP: ' . $line, ['level' => $level]);
                }
            };
        } elseif (defined('DEBUG_MODE') && DEBUG_MODE) {
            $mail->SMTPDebug = \PHPMailer\PHPMailer\SMTP::DEBUG_SERVER;
            $mail->Debugoutput = function ($str, $level) {
                logEmail('DEBUG', 'SMTP: ' . trim((string) $str), ['level' => $level]);
            };
        } else {
            $mail->SMTPDebug = 0;
        }
        
        $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
        $mail->addAddress($to);
        
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);
        
        try {
            $mail->send();
        } catch (Exception $e) {
            // Common on shared hosting: TLS peer verification failures.
            // Retry once with relaxed SSL settings (still encrypted, but skips cert chain validation).
            $combined = strtolower(($mail->ErrorInfo ?? '') . ' ' . ($e->getMessage() ?? ''));
            $looksLikeTls = (strpos($combined, 'ssl') !== false) ||
                            (strpos($combined, 'tls') !== false) ||
                            (strpos($combined, 'certificate') !== false) ||
                            (strpos($combined, 'stream_socket_client') !== false);

            if ($looksLikeTls) {
                logEmail('WARN', 'SMTP send failed; retrying with relaxed SSL verification', [
                    'to' => $to,
                    'host' => $smtpHost,
                    'port' => $smtpPort,
                    'secure' => $smtpSecure ?: 'not set'
                ]);

                $mail->SMTPOptions = [
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true,
                    ],
                ];

                // One retry
                $mail->send();
            } else {
                throw $e;
            }
        }
        
        logEmail('SUCCESS', 'SMTP email sent successfully', ['to' => $to, 'subject' => $subject]);
        return true;
    } catch (Exception $e) {
        logEmail('ERROR', 'SMTP email failed', [
            'to' => $to,
            'error' => $mail->ErrorInfo,
            'exception' => $e->getMessage(),
            'host' => $smtpHost,
            'port' => $smtpPort,
            'secure' => $smtpSecure ?: 'not set'
        ]);
        error_log("Email error: " . ($mail->ErrorInfo ?: 'unknown') . " | exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Generate a verification token
 */
function generateVerificationToken($userId, $type, $expiresInHours = 24) {
    $db = getDB();
    
    // Delete any existing tokens of this type for this user
    $db->delete(
        "DELETE FROM verification_tokens WHERE user_id = ? AND type = ?",
        [$userId, $type]
    );
    
    // Generate new token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiresInHours} hours"));
    
    $db->insert(
        "INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)",
        [$userId, $token, $type, $expiresAt]
    );
    
    return $token;
}

/**
 * Validate a verification token
 */
function validateToken($token, $type) {
    $db = getDB();
    
    $result = $db->fetchOne(
        "SELECT vt.*, u.email, u.name FROM verification_tokens vt 
         JOIN users u ON vt.user_id = u.id
         WHERE vt.token = ? AND vt.type = ? AND vt.expires_at > NOW() AND vt.used_at IS NULL",
        [$token, $type]
    );
    
    return $result;
}

/**
 * Mark a token as used
 */
function markTokenUsed($token) {
    $db = getDB();
    return $db->update(
        "UPDATE verification_tokens SET used_at = NOW() WHERE token = ?",
        [$token]
    );
}

/**
 * Send verification email
 */
function sendVerificationEmail($userId, $email, $name) {
    $token = generateVerificationToken($userId, 'email_verification', 24);
    $verifyUrl = FRONTEND_URL . '/verify-email?token=' . $token;
    
    $subject = 'Verify your BamLead account';
    $html = getEmailTemplate('verify_email', [
        'name' => $name ?: 'there',
        'verify_url' => $verifyUrl,
        'expires' => '24 hours'
    ]);
    
    return sendEmail($email, $subject, $html);
}

/**
 * Send password reset email
 */
function sendPasswordResetEmail($userId, $email, $name) {
    $token = generateVerificationToken($userId, 'password_reset', 1);
    $resetUrl = FRONTEND_URL . '/reset-password?token=' . $token;
    
    $subject = 'Reset your BamLead password';
    $html = getEmailTemplate('reset_password', [
        'name' => $name ?: 'there',
        'reset_url' => $resetUrl,
        'expires' => '1 hour'
    ]);
    
    return sendEmail($email, $subject, $html);
}

/**
 * Get email template
 */
function getEmailTemplate($template, $vars = []) {
    // Use a public logo URL for email clients that block data URIs (e.g., Gmail).
    $logoBase64 = 'data:image/png;base64,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';
    $logoUrl = '';
    if (defined('MAIL_LOGO_URL') && MAIL_LOGO_URL) {
        $logoUrl = (string) MAIL_LOGO_URL;
    } elseif (defined('FRONTEND_URL') && FRONTEND_URL) {
        $logoUrl = rtrim((string) FRONTEND_URL, '/') . '/favicon.png';
    }
    $logoSrc = $logoUrl ?: $logoBase64;
    
    $templates = [
        'verify_email' => '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f1f5f9; }
                    .wrapper { padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
                    .header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
                    .logo-container { display: inline-block; margin-bottom: 15px; }
                    .logo-img { width: 60px; height: 60px; border-radius: 12px; }
                    .logo-text { font-size: 32px; font-weight: bold; color: #14b8a6; margin: 0; letter-spacing: -1px; }
                    .content { padding: 40px 30px; }
                    .content h2 { color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 24px; }
                    .content p { color: #475569; margin-bottom: 16px; }
                    .button-container { text-align: center; margin: 35px 0; }
                    .button { display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff !important; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4); }
                    .button:hover { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #92400e; font-size: 14px; }
                    .footer { text-align: center; padding: 25px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
                    .footer p { color: #64748b; font-size: 13px; margin: 0; }
                    .footer a { color: #14b8a6; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <div class="logo-container">
                                <img src="' . $logoSrc . '" alt="BamLead Logo" class="logo-img" />
                            </div>
                            <div class="logo-text">BamLead</div>
                        </div>
                        <div class="content">
                            <h2>Verify your email address</h2>
                            <p>Hi {{name}},</p>
                            <p>Thanks for signing up for BamLead! To complete your registration and start generating leads, please verify your email address by clicking the button below:</p>
                            <div class="button-container">
                                <a href="{{verify_url}}" class="button">Verify Email</a>
                            </div>
                            <p style="font-size: 14px; color: #64748b;">This link will expire in {{expires}}.</p>
                            <div class="warning">
                                <strong>Didn\'t sign up?</strong> If you didn\'t create an account, you can safely ignore this email.
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; ' . date('Y') . ' BamLead. All rights reserved.</p>
                            <p style="margin-top: 8px;"><a href="https://bamlead.com">bamlead.com</a></p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        ',
        'reset_password' => '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f1f5f9; }
                    .wrapper { padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
                    .header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
                    .logo-container { display: inline-block; margin-bottom: 15px; }
                    .logo-img { width: 60px; height: 60px; border-radius: 12px; }
                    .logo-text { font-size: 32px; font-weight: bold; color: #14b8a6; margin: 0; letter-spacing: -1px; }
                    .content { padding: 40px 30px; }
                    .content h2 { color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 24px; }
                    .content p { color: #475569; margin-bottom: 16px; }
                    .button-container { text-align: center; margin: 35px 0; }
                    .button { display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff !important; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4); }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #92400e; font-size: 14px; }
                    .footer { text-align: center; padding: 25px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
                    .footer p { color: #64748b; font-size: 13px; margin: 0; }
                    .footer a { color: #14b8a6; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <div class="logo-container">
                                <img src="' . $logoSrc . '" alt="BamLead Logo" class="logo-img" />
                            </div>
                            <div class="logo-text">BamLead</div>
                        </div>
                        <div class="content">
                            <h2>Reset your password</h2>
                            <p>Hi {{name}},</p>
                            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                            <div class="button-container">
                                <a href="{{reset_url}}" class="button">Reset Password</a>
                            </div>
                            <p style="font-size: 14px; color: #64748b;">This link will expire in {{expires}}.</p>
                            <div class="warning">
                                <strong>Didn\'t request this?</strong> If you didn\'t request a password reset, please ignore this email or contact support if you have concerns.
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; ' . date('Y') . ' BamLead. All rights reserved.</p>
                            <p style="margin-top: 8px;"><a href="https://bamlead.com">bamlead.com</a></p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        '
    ];
    
    $html = $templates[$template] ?? '';
    
    foreach ($vars as $key => $value) {
        $html = str_replace('{{' . $key . '}}', htmlspecialchars($value), $html);
    }
    
    return $html;
}
