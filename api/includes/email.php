<?php
/**
 * Email Helper Functions for BamLead
 * Uses PHPMailer or native mail() function
 * Includes detailed logging for debugging
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/database.php';

// Email log file path
define('EMAIL_LOG_FILE', __DIR__ . '/../logs/email.log');

/**
 * Log email events for debugging
 */
function logEmail($level, $message, $context = []) {
    $logDir = dirname(EMAIL_LOG_FILE);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $contextStr = !empty($context) ? ' | ' . json_encode($context) : '';
    $logLine = "[{$timestamp}] [{$level}] {$message}{$contextStr}\n";
    
    file_put_contents(EMAIL_LOG_FILE, $logLine, FILE_APPEND | LOCK_EX);
}

/**
 * Send an email using PHP's mail function or SMTP
 */
function sendEmail($to, $subject, $htmlBody, $textBody = '') {
    logEmail('INFO', 'Attempting to send email', [
        'to' => $to,
        'subject' => $subject,
        'smtp_configured' => defined('SMTP_HOST') && SMTP_HOST ? 'yes' : 'no',
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
    // If PHPMailer is not installed, fall back to native mail
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        logEmail('WARN', 'PHPMailer not installed, falling back to native mail()', [
            'to' => $to,
            'hint' => 'Run: composer require phpmailer/phpmailer'
        ]);
        return sendEmailNative($to, $subject, $htmlBody);
    }
    
    logEmail('INFO', 'Using PHPMailer SMTP', [
        'to' => $to,
        'host' => SMTP_HOST,
        'port' => SMTP_PORT,
        'user' => SMTP_USER,
        'secure' => SMTP_SECURE
    ]);
    
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port = SMTP_PORT;
        
        // Enable debug output for logging
        $mail->SMTPDebug = 0; // Set to 2 for verbose debug
        
        $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
        $mail->addAddress($to);
        
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);
        
        $mail->send();
        
        logEmail('SUCCESS', 'SMTP email sent successfully', ['to' => $to, 'subject' => $subject]);
        return true;
    } catch (Exception $e) {
        logEmail('ERROR', 'SMTP email failed', [
            'to' => $to,
            'error' => $mail->ErrorInfo,
            'exception' => $e->getMessage(),
            'host' => SMTP_HOST,
            'port' => SMTP_PORT
        ]);
        error_log("Email error: " . $mail->ErrorInfo);
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
    $templates = [
        'verify_email' => '
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; padding: 20px 0; }
                    .logo { font-size: 28px; font-weight: bold; color: #14b8a6; }
                    .content { background: #f8fafc; border-radius: 8px; padding: 30px; margin: 20px 0; }
                    .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; }
                    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">BamLead</div>
                    </div>
                    <div class="content">
                        <h2>Verify your email address</h2>
                        <p>Hi {{name}},</p>
                        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="{{verify_url}}" class="button">Verify Email</a>
                        </p>
                        <p>This link will expire in {{expires}}.</p>
                        <p>If you didn\'t create an account, you can safely ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ' . date('Y') . ' BamLead. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ',
        'reset_password' => '
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; padding: 20px 0; }
                    .logo { font-size: 28px; font-weight: bold; color: #14b8a6; }
                    .content { background: #f8fafc; border-radius: 8px; padding: 30px; margin: 20px 0; }
                    .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; }
                    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">BamLead</div>
                    </div>
                    <div class="content">
                        <h2>Reset your password</h2>
                        <p>Hi {{name}},</p>
                        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="{{reset_url}}" class="button">Reset Password</a>
                        </p>
                        <p>This link will expire in {{expires}}.</p>
                        <div class="warning">
                            <strong>Didn\'t request this?</strong><br>
                            If you didn\'t request a password reset, please ignore this email or contact support if you have concerns.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ' . date('Y') . ' BamLead. All rights reserved.</p>
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
