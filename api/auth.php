<?php
/**
 * Authentication API Endpoint
 * Handles login, register, logout, and session validation
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/audit.php';

// Handle CORS
setCorsHeaders();
handlePreflight();

// Get the action from query parameter
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        handleRegister();
        break;
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'me':
        handleGetCurrentUser();
        break;
    case 'refresh':
        handleRefreshSession();
        break;
    default:
        auditFailure('invalid_action', 'auth', null, 'Invalid action requested: ' . $action);
        sendError('Invalid action', 400);
}

/**
 * Handle user registration
 */
function handleRegister() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $input = getJsonInput();
    
    $email = sanitizeInput($input['email'] ?? '', 255);
    $password = $input['password'] ?? '';
    $name = sanitizeInput($input['name'] ?? '', 100);
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        auditFailure('register', 'auth', null, 'Invalid email format', [
            'request_data' => ['email' => $email]
        ]);
        sendError('Invalid email address');
    }
    
    // Validate password
    if (strlen($password) < 8) {
        auditFailure('register', 'auth', null, 'Password too short', [
            'request_data' => ['email' => $email]
        ]);
        sendError('Password must be at least 8 characters');
    }
    
    // Create user
    $result = createUser($email, $password, $name);
    
    if (!$result['success']) {
        auditFailure('register', 'auth', null, $result['error'], [
            'request_data' => ['email' => $email, 'name' => $name]
        ]);
        sendError($result['error']);
    }
    
    // Auto login after registration
    $loginResult = authenticateUser($email, $password);
    
    // Log successful registration
    auditSuccess('register', 'auth', $loginResult['user']['id'] ?? null, [
        'entity_type' => 'user',
        'entity_id' => $loginResult['user']['id'] ?? null,
        'metadata' => ['email' => $email, 'name' => $name]
    ]);
    
    sendJson([
        'success' => true,
        'message' => 'Account created successfully',
        'user' => $loginResult['user'] ?? null,
        'token' => $loginResult['token'] ?? null,
        'expires_at' => $loginResult['expires_at'] ?? null
    ], 201);
}

/**
 * Handle user login
 */
function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $input = getJsonInput();
    
    $email = sanitizeInput($input['email'] ?? '', 255);
    $password = $input['password'] ?? '';
    
    if (!$email || !$password) {
        auditFailure('login', 'auth', null, 'Missing credentials');
        sendError('Email and password are required');
    }
    
    $result = authenticateUser($email, $password);
    
    if (!$result['success']) {
        auditFailure('login_failed', 'auth', null, $result['error'], [
            'request_data' => ['email' => $email],
            'metadata' => ['reason' => $result['error']]
        ]);
        sendError($result['error'], 401);
    }
    
    // Log successful login
    auditSuccess('login', 'auth', $result['user']['id'], [
        'entity_type' => 'user',
        'entity_id' => $result['user']['id'],
        'metadata' => ['email' => $email]
    ]);
    
    sendJson([
        'success' => true,
        'user' => $result['user'],
        'token' => $result['token'],
        'expires_at' => $result['expires_at']
    ]);
}

/**
 * Handle user logout
 */
function handleLogout() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = getCurrentUser();
    $userId = $user ? $user['id'] : null;
    
    $result = logoutUser();
    
    auditSuccess('logout', 'auth', $userId);
    
    sendJson([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

/**
 * Get current authenticated user
 */
function handleGetCurrentUser() {
    $user = getCurrentUser();
    
    if (!$user) {
        sendError('Not authenticated', 401);
    }
    
    // Check subscription status
    $hasAccess = hasActiveSubscription($user);
    
    sendJson([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'subscription_status' => $user['subscription_status'],
            'subscription_plan' => $user['subscription_plan'],
            'trial_ends_at' => $user['trial_ends_at'],
            'subscription_ends_at' => $user['subscription_ends_at'],
            'is_owner' => (bool)$user['is_owner'],
            'has_active_subscription' => $hasAccess,
            'created_at' => $user['created_at'],
            'email_verified' => (bool)$user['email_verified'],
            'email_verified_at' => $user['email_verified_at'] ?? null
        ]
    ]);
}

/**
 * Refresh session token
 */
function handleRefreshSession() {
    $user = getCurrentUser();
    
    if (!$user) {
        auditFailure('session_refresh', 'auth', null, 'Not authenticated');
        sendError('Not authenticated', 401);
    }
    
    // Create new session
    $db = getDB();
    $newToken = generateToken();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Delete old session
    $oldToken = $_SESSION['session_token'] ?? null;
    if ($oldToken) {
        $db->delete("DELETE FROM sessions WHERE id = ?", [$oldToken]);
    }
    
    // Create new session
    $db->insert(
        "INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)",
        [
            $newToken,
            $user['id'],
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $expiresAt
        ]
    );
    
    $_SESSION['session_token'] = $newToken;
    
    auditSuccess('session_refresh', 'auth', $user['id']);
    
    sendJson([
        'success' => true,
        'token' => $newToken,
        'expires_at' => $expiresAt
    ]);
}
