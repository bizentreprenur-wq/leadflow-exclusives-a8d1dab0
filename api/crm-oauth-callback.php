<?php
/**
 * CRM OAuth2 Callback Handler
 * Exchanges authorization codes for access tokens
 */

session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/database.php';

$provider = $_GET['provider'] ?? '';

// CRM configurations
$CRM_CONFIGS = [
    'hubspot' => [
        'client_id' => defined('HUBSPOT_CLIENT_ID') ? HUBSPOT_CLIENT_ID : '',
        'client_secret' => defined('HUBSPOT_CLIENT_SECRET') ? HUBSPOT_CLIENT_SECRET : '',
        'token_url' => 'https://api.hubapi.com/oauth/v1/token',
        'redirect_uri' => FRONTEND_URL . '/api/crm-oauth-callback.php?provider=hubspot',
    ],
    'salesforce' => [
        'client_id' => defined('SALESFORCE_CLIENT_ID') ? SALESFORCE_CLIENT_ID : '',
        'client_secret' => defined('SALESFORCE_CLIENT_SECRET') ? SALESFORCE_CLIENT_SECRET : '',
        'token_url' => 'https://login.salesforce.com/services/oauth2/token',
        'redirect_uri' => FRONTEND_URL . '/api/crm-oauth-callback.php?provider=salesforce',
    ],
    'pipedrive' => [
        'client_id' => defined('PIPEDRIVE_CLIENT_ID') ? PIPEDRIVE_CLIENT_ID : '',
        'client_secret' => defined('PIPEDRIVE_CLIENT_SECRET') ? PIPEDRIVE_CLIENT_SECRET : '',
        'token_url' => 'https://oauth.pipedrive.com/oauth/token',
        'redirect_uri' => FRONTEND_URL . '/api/crm-oauth-callback.php?provider=pipedrive',
    ],
];

if (!isset($CRM_CONFIGS[$provider])) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=invalid_provider');
    exit;
}

$config = $CRM_CONFIGS[$provider];

// Verify state
$state = $_GET['state'] ?? '';
$storedState = $_SESSION["crm_{$provider}_state"] ?? '';
$userId = $_SESSION["crm_{$provider}_user_id"] ?? null;

if (empty($state) || $state !== $storedState || !$userId) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=invalid_state&provider=' . $provider);
    exit;
}

// Check for error from provider
if (!empty($_GET['error'])) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=' . urlencode($_GET['error']) . '&provider=' . $provider);
    exit;
}

$code = $_GET['code'] ?? '';
if (empty($code)) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=no_code&provider=' . $provider);
    exit;
}

// Exchange code for tokens
$tokenData = [
    'client_id' => $config['client_id'],
    'client_secret' => $config['client_secret'],
    'code' => $code,
    'grant_type' => 'authorization_code',
    'redirect_uri' => $config['redirect_uri'],
];

$ch = curl_init($config['token_url']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=token_exchange_failed&provider=' . $provider);
    exit;
}

$tokens = json_decode($response, true);
if (empty($tokens['access_token'])) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=no_access_token&provider=' . $provider);
    exit;
}

// Store tokens in database
try {
    $db = getDB();
    $pdo = $db->getConnection();
    
    $tokenField = "{$provider}_token";
    $refreshField = "{$provider}_refresh_token";
    
    $sql = "UPDATE users SET {$tokenField} = ?, {$refreshField} = ?";
    $params = [
        $tokens['access_token'],
        $tokens['refresh_token'] ?? null,
    ];
    
    // Store instance URL for Salesforce
    if ($provider === 'salesforce' && !empty($tokens['instance_url'])) {
        $sql .= ", salesforce_instance_url = ?";
        $params[] = $tokens['instance_url'];
    }
    
    // Store API domain for Pipedrive
    if ($provider === 'pipedrive' && !empty($tokens['api_domain'])) {
        $sql .= ", pipedrive_api_domain = ?";
        $params[] = $tokens['api_domain'];
    }
    
    $sql .= " WHERE id = ?";
    $params[] = $userId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Clear session state
    unset($_SESSION["crm_{$provider}_state"]);
    unset($_SESSION["crm_{$provider}_user_id"]);
    
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_connected=' . $provider);
} catch (Exception $e) {
    header('Location: ' . FRONTEND_URL . '/dashboard?crm_error=database_error&provider=' . $provider);
}
