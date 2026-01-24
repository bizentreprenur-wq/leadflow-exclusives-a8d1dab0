<?php
/**
 * Password Reset & Email Verification API Endpoint
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/email.php';

// Handle CORS
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'forgot-password':
        handleForgotPassword();
        break;
    case 'reset-password':
        handleResetPassword();
        break;
    case 'verify-email':
        handleVerifyEmail();
        break;
    case 'resend-verification':
        handleResendVerification();
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Request password reset
 */
function handleForgotPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $input = getJsonInput();
    $email = sanitizeInput($input['email'] ?? '', 255);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email address');
    }
    
    $db = getDB();
    $user = $db->fetchOne("SELECT id, name, email FROM users WHERE email = ?", [strtolower($email)]);
    
    // Always return success to prevent email enumeration
    if ($user) {
        sendPasswordResetEmail($user['id'], $user['email'], $user['name']);
    }
    
    sendJson([
        'success' => true,
        'message' => 'If an account exists with that email, you will receive a password reset link.'
    ]);
}

/**
 * Reset password with token
 */
function handleResetPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $input = getJsonInput();
    $token = sanitizeInput($input['token'] ?? '', 64);
    $password = $input['password'] ?? '';
    
    if (!$token) {
        sendError('Token is required');
    }
    
    if (strlen($password) < 8) {
        sendError('Password must be at least 8 characters');
    }
    
    // Validate token
    $tokenData = validateToken($token, 'password_reset');
    
    if (!$tokenData) {
        sendError('Invalid or expired reset link', 400);
    }
    
    $db = getDB();
    
    // Update password
    $db->update(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [hashPassword($password), $tokenData['user_id']]
    );
    
    // Mark token as used
    markTokenUsed($token);
    
    // Clear all sessions for this user (security measure)
    $db->delete("DELETE FROM sessions WHERE user_id = ?", [$tokenData['user_id']]);
    
    sendJson([
        'success' => true,
        'message' => 'Password reset successfully. Please sign in with your new password.'
    ]);
}

/**
 * Verify email with token
 */
function handleVerifyEmail() {
    $token = sanitizeInput($_GET['token'] ?? '', 64);
    
    if (!$token) {
        sendError('Token is required');
    }
    
    $tokenData = validateToken($token, 'email_verification');
    
    if (!$tokenData) {
        sendError('Invalid or expired verification link', 400);
    }
    
    $db = getDB();
    
    // Mark email as verified
    $db->update(
        "UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?",
        [$tokenData['user_id']]
    );
    
    // Mark token as used
    markTokenUsed($token);
    
    sendJson([
        'success' => true,
        'message' => 'Email verified successfully!'
    ]);
}

/**
 * Resend verification email
 */
function handleResendVerification() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    
    if ($user['email_verified']) {
        sendError('Email is already verified');
    }
    
    $sent = sendVerificationEmail($user['id'], $user['email'], $user['name']);
    
    if (!$sent) {
        // Provide a safe, actionable hint (no secrets) to speed up debugging
        $smtpConfigured = (defined('SMTP_HOST') && SMTP_HOST) && (defined('SMTP_USER') && SMTP_USER);
        $smtpPassSet = defined('SMTP_PASS') && SMTP_PASS;
        $phpmailerAvailable = class_exists('PHPMailer\\PHPMailer\\PHPMailer');

        $hint = '';
        if (!$smtpConfigured) {
            $hint = ' SMTP is not configured on the server (SMTP_HOST/SMTP_USER missing).';
        } elseif (!$smtpPassSet) {
            $hint = ' SMTP_PASS is missing on the server.';
        } elseif (!$phpmailerAvailable) {
            $hint = ' PHPMailer is not available on the server (run composer install in /api).';
        } else {
            $hint = ' SMTP rejected the send; check credentials, port (465 SSL or 587 TLS), and that the From address is allowed by the mailbox.';
        }

        sendError('Failed to send verification email.' . $hint . ' You can run /api/email-diagnostic.php?key=CRON_SECRET_KEY to see detailed status.', 500);
    }
    
    sendJson([
        'success' => true,
        'message' => 'Verification email sent!'
    ]);
}
