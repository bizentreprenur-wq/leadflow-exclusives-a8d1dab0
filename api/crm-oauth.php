<?php
/**
 * CRM OAuth2 Hub - Unified OAuth for HubSpot, Salesforce, and Pipedrive
 * Handles authorization, token exchange, and status checks
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/database.php';

// CRM OAuth configurations
$CRM_CONFIGS = [
    'hubspot' => [
        'client_id' => defined('HUBSPOT_CLIENT_ID') ? HUBSPOT_CLIENT_ID : '',
        'client_secret' => defined('HUBSPOT_CLIENT_SECRET') ? HUBSPOT_CLIENT_SECRET : '',
        'auth_url' => 'https://app.hubspot.com/oauth/authorize',
        'token_url' => 'https://api.hubapi.com/oauth/v1/token',
        'scopes' => 'crm.objects.contacts.write crm.objects.contacts.read crm.objects.companies.write crm.objects.companies.read',
        'redirect_uri' => FRONTEND_URL . '/api/crm-oauth-callback.php?provider=hubspot',
    ],
    'salesforce' => [
        'client_id' => defined('SALESFORCE_CLIENT_ID') ? SALESFORCE_CLIENT_ID : '',
        'client_secret' => defined('SALESFORCE_CLIENT_SECRET') ? SALESFORCE_CLIENT_SECRET : '',
        'auth_url' => 'https://login.salesforce.com/services/oauth2/authorize',
        'token_url' => 'https://login.salesforce.com/services/oauth2/token',
        'scopes' => 'api refresh_token',
        'redirect_uri' => FRONTEND_URL . '/api/crm-oauth-callback.php?provider=salesforce',
    ],
    'pipedrive' => [
        'client_id' => defined('PIPEDRIVE_CLIENT_ID') ? PIPEDRIVE_CLIENT_ID : '',
        'client_secret' => defined('PIPEDRIVE_CLIENT_SECRET') ? PIPEDRIVE_CLIENT_SECRET : '',
        'auth_url' => 'https://oauth.pipedrive.com/oauth/authorize',
        'token_url' => 'https://oauth.pipedrive.com/oauth/token',
        'scopes' => '',
        'redirect_uri' => FRONTEND_URL . '/api/crm-oauth-callback.php?provider=pipedrive',
    ],
];

// Verify user is authenticated
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$action = $_GET['action'] ?? 'status';
$provider = $_GET['provider'] ?? '';

// Validate provider
if ($provider && !isset($CRM_CONFIGS[$provider])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid CRM provider', 'valid_providers' => array_keys($CRM_CONFIGS)]);
    exit;
}

switch ($action) {
    case 'auth':
        if (!$provider) {
            http_response_code(400);
            echo json_encode(['error' => 'Provider required']);
            exit;
        }
        
        $config = $CRM_CONFIGS[$provider];
        
        // Check if OAuth is configured for this provider
        if (empty($config['client_id']) || empty($config['client_secret'])) {
            http_response_code(503);
            echo json_encode([
                'error' => "{$provider} OAuth not configured",
                'message' => "Please add {$provider} OAuth credentials to config.php",
                'requires_api_key' => true
            ]);
            exit;
        }
        
        // Generate state for CSRF protection
        $state = bin2hex(random_bytes(16));
        $_SESSION["crm_{$provider}_state"] = $state;
        $_SESSION["crm_{$provider}_user_id"] = $user['id'];
        
        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => $config['scopes'],
            'state' => $state,
        ]);
        
        $authUrl = $config['auth_url'] . '?' . $params;
        
        echo json_encode([
            'success' => true,
            'auth_url' => $authUrl,
            'provider' => $provider
        ]);
        break;
        
    case 'status':
        // Get status of all CRM connections
        try {
            $db = getDB();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare('
                SELECT hubspot_token, salesforce_token, salesforce_instance_url, pipedrive_token, pipedrive_api_domain
                FROM users WHERE id = ?
            ');
            $stmt->execute([$user['id']]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $connections = [];
            foreach ($CRM_CONFIGS as $key => $config) {
                $tokenField = "{$key}_token";
                $isConfigured = !empty($config['client_id']) && !empty($config['client_secret']);
                $isConnected = !empty($userData[$tokenField] ?? null);
                
                $connections[$key] = [
                    'configured' => $isConfigured,
                    'connected' => $isConnected,
                    'requires_api_key' => !$isConfigured,
                ];
                
                // Add instance URL for Salesforce
                if ($key === 'salesforce' && $isConnected) {
                    $connections[$key]['instance_url'] = $userData['salesforce_instance_url'] ?? null;
                }
                if ($key === 'pipedrive' && $isConnected) {
                    $connections[$key]['api_domain'] = $userData['pipedrive_api_domain'] ?? null;
                }
            }
            
            echo json_encode([
                'success' => true,
                'connections' => $connections
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error']);
        }
        break;
        
    case 'disconnect':
        if (!$provider) {
            http_response_code(400);
            echo json_encode(['error' => 'Provider required']);
            exit;
        }
        
        try {
            $db = getDB();
            $pdo = $db->getConnection();
            
            $tokenField = "{$provider}_token";
            $refreshField = "{$provider}_refresh_token";
            
            $sql = "UPDATE users SET {$tokenField} = NULL, {$refreshField} = NULL";
            if ($provider === 'salesforce') {
                $sql .= ", salesforce_instance_url = NULL";
            }
            if ($provider === 'pipedrive') {
                $sql .= ", pipedrive_api_domain = NULL";
            }
            $sql .= " WHERE id = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user['id']]);
            
            echo json_encode([
                'success' => true,
                'message' => ucfirst($provider) . ' disconnected'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to disconnect']);
        }
        break;
        
    case 'save_api_key':
        // For CRMs that use API keys instead of OAuth
        if (!$provider) {
            http_response_code(400);
            echo json_encode(['error' => 'Provider required']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $apiKey = $input['api_key'] ?? '';
        $instanceUrl = $input['instance_url'] ?? null;
        
        if (empty($apiKey)) {
            http_response_code(400);
            echo json_encode(['error' => 'API key required']);
            exit;
        }
        
        try {
            $db = getDB();
            $pdo = $db->getConnection();
            
            $tokenField = "{$provider}_token";
            
            $sql = "UPDATE users SET {$tokenField} = ?";
            $params = [$apiKey];
            
            if ($provider === 'salesforce' && $instanceUrl) {
                $sql .= ", salesforce_instance_url = ?";
                $params[] = $instanceUrl;
            }
            if ($provider === 'pipedrive' && $instanceUrl) {
                $sql .= ", pipedrive_api_domain = ?";
                $params[] = $instanceUrl;
            }
            
            $sql .= " WHERE id = ?";
            $params[] = $user['id'];
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode([
                'success' => true,
                'message' => ucfirst($provider) . ' API key saved'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save API key']);
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}
