<?php
/**
 * Calling.io Voice API Endpoint
 * Handles AI voice agent configuration, call initiation, and real-time conversation
 * 
 * This integrates with calling.io for AI-powered outbound voice calls
 */

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Calling.io API base URL
define('CALLING_IO_API_BASE', 'https://api.calling.io/v1');

$action = $_GET['action'] ?? '';
$db = getDB();

// Public webhook endpoint (no auth required)
if ($action === 'webhook') {
    handleWebhook($db);
    exit();
}

// All other endpoints require authentication
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

enforceRateLimit($user, 'calling');

try {
    switch ($action) {
        case 'get_config':
            handleGetConfig($db, $user);
            break;
            
        case 'save_config':
            handleSaveConfig($db, $user);
            break;
            
        case 'provision_number':
            handleProvisionNumber($db, $user);
            break;
            
        case 'start_session':
            handleStartSession($db, $user);
            break;
            
        case 'end_session':
            handleEndSession($db, $user);
            break;
            
        case 'initiate_call':
            handleInitiateCall($db, $user);
            break;
            
        case 'hangup_call':
            handleHangupCall($db, $user);
            break;
            
        case 'call_status':
            handleCallStatus($db, $user);
            break;
            
        case 'save_call_log':
            handleSaveCallLog($db, $user);
            break;
            
        case 'get_call_logs':
            handleGetCallLogs($db, $user);
            break;
            
        case 'check_addon':
            handleCheckAddon($db, $user);
            break;
            
        case 'purchase_addon':
            handlePurchaseAddon($db, $user);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Calling.io API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Get user's calling.io configuration
 */
function handleGetConfig($db, $user) {
    $stmt = $db->prepare("SELECT * FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($config) {
        echo json_encode([
            'success' => true,
            'config' => [
                'agent_id' => $config['agent_id'] ?? '',
                'phone_number' => $config['phone_number'] ?? '',
                'voice_id' => $config['voice_id'] ?? 'professional-female',
                'language' => $config['language'] ?? 'en-US',
                'greeting_message' => $config['greeting_message'] ?? '',
                'system_prompt' => $config['system_prompt'] ?? '',
                'enabled' => (bool)$config['enabled'],
                'provisioned' => (bool)$config['provisioned'],
                'addon_active' => (bool)$config['addon_active']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'config' => null
        ]);
    }
}

/**
 * Save calling.io configuration
 */
function handleSaveConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if config exists
    $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        $stmt = $db->prepare("
            UPDATE calling_config SET 
                agent_id = ?,
                voice_id = ?,
                language = ?,
                greeting_message = ?,
                system_prompt = ?,
                enabled = ?,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $input['agent_id'] ?? '',
            $input['voice_id'] ?? 'professional-female',
            $input['language'] ?? 'en-US',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0,
            $user['id']
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO calling_config 
            (user_id, agent_id, voice_id, language, greeting_message, system_prompt, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $input['agent_id'] ?? '',
            $input['voice_id'] ?? 'professional-female',
            $input['language'] ?? 'en-US',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0
        ]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Configuration saved']);
}

/**
 * Provision a phone number for the user via calling.io API
 */
function handleProvisionNumber($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $countryCode = $input['country_code'] ?? 'US';
    $areaCode = $input['area_code'] ?? '';
    
    // Check if user already has a number
    $stmt = $db->prepare("SELECT phone_number FROM calling_config WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing && $existing['phone_number']) {
        echo json_encode([
            'success' => false,
            'error' => 'You already have a phone number provisioned: ' . $existing['phone_number']
        ]);
        return;
    }
    
    // Check subscription status - Autopilot gets free number
    $stmt = $db->prepare("SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$user['id']]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isAutopilot = $subscription && $subscription['plan'] === 'autopilot';
    
    // For non-autopilot users, check if they've purchased the add-on
    if (!$isAutopilot) {
        $stmt = $db->prepare("SELECT addon_active FROM calling_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config || !$config['addon_active']) {
            echo json_encode([
                'success' => false,
                'error' => 'AI Calling add-on ($8/mo) required for phone number provisioning'
            ]);
            return;
        }
    }
    
    // Call calling.io API to provision number
    $callingApiKey = defined('CALLING_IO_API_KEY') ? CALLING_IO_API_KEY : '';
    
    if (!$callingApiKey) {
        // Simulate provisioning for development/demo
        $phoneNumber = '+1' . rand(200, 999) . rand(100, 999) . rand(1000, 9999);
        
        // Update or insert config with new number
        $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $stmt = $db->prepare("UPDATE calling_config SET phone_number = ?, provisioned = 1, updated_at = NOW() WHERE user_id = ?");
            $stmt->execute([$phoneNumber, $user['id']]);
        } else {
            $stmt = $db->prepare("INSERT INTO calling_config (user_id, phone_number, provisioned, addon_active) VALUES (?, ?, 1, ?)");
            $stmt->execute([$user['id'], $phoneNumber, $isAutopilot ? 1 : 0]);
        }
        
        echo json_encode([
            'success' => true,
            'phone_number' => $phoneNumber,
            'message' => 'Phone number provisioned successfully'
        ]);
        return;
    }
    
    // Real API call to calling.io
    $ch = curl_init(CALLING_IO_API_BASE . '/phone-numbers/provision');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'country_code' => $countryCode,
            'area_code' => $areaCode,
            'capabilities' => ['voice', 'sms']
        ]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $callingApiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        $data = json_decode($response, true);
        $phoneNumber = $data['phone_number'] ?? '';
        
        // Update config with new number
        $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $stmt = $db->prepare("UPDATE calling_config SET phone_number = ?, provisioned = 1, updated_at = NOW() WHERE user_id = ?");
            $stmt->execute([$phoneNumber, $user['id']]);
        } else {
            $stmt = $db->prepare("INSERT INTO calling_config (user_id, phone_number, provisioned, addon_active) VALUES (?, ?, 1, ?)");
            $stmt->execute([$user['id'], $phoneNumber, $isAutopilot ? 1 : 0]);
        }
        
        echo json_encode([
            'success' => true,
            'phone_number' => $phoneNumber,
            'message' => 'Phone number provisioned successfully'
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'error' => $error['message'] ?? 'Failed to provision phone number'
        ]);
    }
}

/**
 * Start a real-time voice session - returns WebSocket/WebRTC credentials
 */
function handleStartSession($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $script = $input['script'] ?? '';
    $leadData = $input['lead'] ?? [];
    
    // Get user's calling config
    $stmt = $db->prepare("SELECT * FROM calling_config WHERE user_id = ? AND enabled = 1");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        echo json_encode(['success' => false, 'error' => 'AI Calling not configured or disabled']);
        return;
    }
    
    if (!$config['phone_number']) {
        echo json_encode(['success' => false, 'error' => 'No phone number provisioned']);
        return;
    }
    
    $callingApiKey = defined('CALLING_IO_API_KEY') ? CALLING_IO_API_KEY : '';
    
    if (!$callingApiKey) {
        // Return simulated session for development
        $sessionToken = bin2hex(random_bytes(32));
        
        echo json_encode([
            'success' => true,
            'session' => [
                'token' => $sessionToken,
                'websocket_url' => 'wss://api.calling.io/v1/realtime',
                'ice_servers' => [
                    ['urls' => 'stun:stun.l.google.com:19302'],
                    ['urls' => 'stun:stun1.l.google.com:19302']
                ],
                'agent_id' => $config['agent_id'] ?: 'demo-agent',
                'expires_at' => time() + 3600
            ],
            'simulated' => true
        ]);
        return;
    }
    
    // Real API call to calling.io to create session
    $ch = curl_init(CALLING_IO_API_BASE . '/sessions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'agent_id' => $config['agent_id'],
            'from_number' => $config['phone_number'],
            'voice_id' => $config['voice_id'],
            'language' => $config['language'],
            'system_prompt' => $config['system_prompt'],
            'custom_script' => $script,
            'lead_context' => $leadData
        ]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $callingApiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        $data = json_decode($response, true);
        
        echo json_encode([
            'success' => true,
            'session' => [
                'token' => $data['session_token'] ?? '',
                'websocket_url' => $data['websocket_url'] ?? 'wss://api.calling.io/v1/realtime',
                'ice_servers' => $data['ice_servers'] ?? [],
                'agent_id' => $data['agent_id'] ?? $config['agent_id'],
                'expires_at' => $data['expires_at'] ?? time() + 3600
            ]
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'error' => $error['message'] ?? 'Failed to start session'
        ]);
    }
}

/**
 * End a real-time session
 */
function handleEndSession($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $sessionToken = $input['session_token'] ?? '';
    
    $callingApiKey = defined('CALLING_IO_API_KEY') ? CALLING_IO_API_KEY : '';
    
    if (!$callingApiKey) {
        // Simulated end
        echo json_encode(['success' => true, 'message' => 'Session ended']);
        return;
    }
    
    $ch = curl_init(CALLING_IO_API_BASE . '/sessions/' . $sessionToken . '/end');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $callingApiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10
    ]);
    
    curl_exec($ch);
    curl_close($ch);
    
    echo json_encode(['success' => true, 'message' => 'Session ended']);
}

/**
 * Initiate an outbound call via calling.io
 */
function handleInitiateCall($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $destinationNumber = $input['destination_number'] ?? '';
    $script = $input['script'] ?? '';
    $leadData = $input['lead'] ?? [];
    
    if (!$destinationNumber) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Destination number required']);
        return;
    }
    
    // Get user's config
    $stmt = $db->prepare("SELECT * FROM calling_config WHERE user_id = ? AND enabled = 1");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        echo json_encode(['success' => false, 'error' => 'AI Calling not configured or disabled']);
        return;
    }
    
    $callingApiKey = defined('CALLING_IO_API_KEY') ? CALLING_IO_API_KEY : '';
    
    if (!$callingApiKey) {
        // Simulated call for development
        $callId = 'call_' . bin2hex(random_bytes(16));
        $sessionToken = bin2hex(random_bytes(32));
        
        // Store the call record
        $stmt = $db->prepare("
            INSERT INTO call_logs 
            (user_id, lead_id, lead_name, lead_phone, agent_id, outcome, notes, created_at)
            VALUES (?, ?, ?, ?, ?, 'initiated', ?, NOW())
        ");
        $stmt->execute([
            $user['id'],
            $leadData['id'] ?? null,
            $leadData['name'] ?? null,
            $destinationNumber,
            $config['agent_id'] ?: 'demo-agent',
            json_encode(['script_used' => true])
        ]);
        
        $callLogId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'call' => [
                'id' => $callId,
                'call_log_id' => $callLogId,
                'session_token' => $sessionToken,
                'websocket_url' => 'wss://api.calling.io/v1/realtime',
                'status' => 'initiating'
            ],
            'simulated' => true
        ]);
        return;
    }
    
    // Real API call to calling.io
    $ch = curl_init(CALLING_IO_API_BASE . '/calls');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'agent_id' => $config['agent_id'],
            'from_number' => $config['phone_number'],
            'to_number' => $destinationNumber,
            'voice_id' => $config['voice_id'],
            'language' => $config['language'],
            'system_prompt' => $config['system_prompt'],
            'custom_script' => $script,
            'lead_context' => $leadData,
            'webhook_url' => FRONTEND_URL . '/api/calling.php?action=webhook&user_id=' . $user['id']
        ]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $callingApiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        $data = json_decode($response, true);
        
        // Store the call record
        $stmt = $db->prepare("
            INSERT INTO call_logs 
            (user_id, lead_id, lead_name, lead_phone, agent_id, outcome, notes, created_at)
            VALUES (?, ?, ?, ?, ?, 'initiated', ?, NOW())
        ");
        $stmt->execute([
            $user['id'],
            $leadData['id'] ?? null,
            $leadData['name'] ?? null,
            $destinationNumber,
            $config['agent_id'],
            json_encode(['call_id' => $data['call_id'] ?? ''])
        ]);
        
        $callLogId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'call' => [
                'id' => $data['call_id'] ?? '',
                'call_log_id' => $callLogId,
                'session_token' => $data['session_token'] ?? '',
                'websocket_url' => $data['websocket_url'] ?? 'wss://api.calling.io/v1/realtime',
                'status' => $data['status'] ?? 'initiating'
            ]
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'error' => $error['message'] ?? 'Failed to initiate call'
        ]);
    }
}

/**
 * Hang up an active call
 */
function handleHangupCall($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $callId = $input['call_id'] ?? '';
    
    $callingApiKey = defined('CALLING_IO_API_KEY') ? CALLING_IO_API_KEY : '';
    
    if (!$callingApiKey) {
        echo json_encode(['success' => true, 'message' => 'Call ended']);
        return;
    }
    
    $ch = curl_init(CALLING_IO_API_BASE . '/calls/' . $callId . '/hangup');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $callingApiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10
    ]);
    
    curl_exec($ch);
    curl_close($ch);
    
    echo json_encode(['success' => true, 'message' => 'Call ended']);
}

/**
 * Get call status
 */
function handleCallStatus($db, $user) {
    $callId = $_GET['call_id'] ?? '';
    
    $callingApiKey = defined('CALLING_IO_API_KEY') ? CALLING_IO_API_KEY : '';
    
    if (!$callingApiKey) {
        // Simulated status
        echo json_encode([
            'success' => true,
            'status' => 'connected',
            'duration_seconds' => rand(10, 120),
            'simulated' => true
        ]);
        return;
    }
    
    $ch = curl_init(CALLING_IO_API_BASE . '/calls/' . $callId . '/status');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $callingApiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo json_encode([
            'success' => true,
            'status' => $data['status'] ?? 'unknown',
            'duration_seconds' => $data['duration_seconds'] ?? 0
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to get call status']);
    }
}

/**
 * Save call log with outcome
 */
function handleSaveCallLog($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $db->prepare("
        INSERT INTO call_logs 
        (user_id, lead_id, lead_name, lead_phone, agent_id, duration_seconds, outcome, notes, transcript, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $user['id'],
        $input['lead_id'] ?? null,
        $input['lead_name'] ?? null,
        $input['lead_phone'] ?? null,
        $input['agent_id'] ?? 'unknown',
        $input['duration_seconds'] ?? 0,
        $input['outcome'] ?? 'completed',
        $input['notes'] ?? null,
        isset($input['transcript']) ? json_encode($input['transcript']) : null
    ]);
    
    echo json_encode([
        'success' => true,
        'call_log_id' => $db->lastInsertId()
    ]);
}

/**
 * Get call logs for user
 */
function handleGetCallLogs($db, $user) {
    $limit = min(intval($_GET['limit'] ?? 50), 100);
    $offset = max(intval($_GET['offset'] ?? 0), 0);
    
    $stmt = $db->prepare("
        SELECT id, lead_id, lead_name, lead_phone, agent_id, duration_seconds, outcome, notes, created_at
        FROM call_logs 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$user['id'], $limit, $offset]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $stmt = $db->prepare("SELECT COUNT(*) FROM call_logs WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $total = $stmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'total' => intval($total),
        'limit' => $limit,
        'offset' => $offset
    ]);
}

/**
 * Check if user has AI Calling add-on
 */
function handleCheckAddon($db, $user) {
    // Check if user has Autopilot (includes calling)
    $stmt = $db->prepare("SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$user['id']]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isAutopilot = $subscription && $subscription['plan'] === 'autopilot';
    
    if ($isAutopilot) {
        echo json_encode([
            'success' => true,
            'has_addon' => true,
            'included_with_plan' => true,
            'plan' => 'autopilot'
        ]);
        return;
    }
    
    // Check for explicit add-on
    $stmt = $db->prepare("SELECT addon_active FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'has_addon' => $config && $config['addon_active'],
        'included_with_plan' => false,
        'plan' => $subscription['plan'] ?? 'free',
        'addon_price' => 8.00
    ]);
}

/**
 * Purchase AI Calling add-on
 */
function handlePurchaseAddon($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    // In production, this would create a Stripe subscription for the add-on
    // For now, we'll simulate activation
    
    $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $exists = $stmt->fetch();
    
    if ($exists) {
        $stmt = $db->prepare("UPDATE calling_config SET addon_active = 1, updated_at = NOW() WHERE user_id = ?");
        $stmt->execute([$user['id']]);
    } else {
        $stmt = $db->prepare("INSERT INTO calling_config (user_id, addon_active) VALUES (?, 1)");
        $stmt->execute([$user['id']]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'AI Calling add-on activated',
        'addon_active' => true
    ]);
}

/**
 * Handle calling.io webhook events
 */
function handleWebhook($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['event'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid webhook payload']);
        return;
    }
    
    $event = $input['event'];
    $callId = $input['call_id'] ?? '';
    $userId = $_GET['user_id'] ?? null;
    
    error_log("Calling.io webhook: " . $event . " for call " . $callId);
    
    switch ($event) {
        case 'call.started':
            // Call has started ringing
            break;
            
        case 'call.answered':
            // Call was answered
            break;
            
        case 'call.ended':
            // Call ended - update call log
            if ($userId && $callId) {
                $duration = $input['duration_seconds'] ?? 0;
                $transcript = $input['transcript'] ?? [];
                
                $stmt = $db->prepare("
                    UPDATE call_logs 
                    SET duration_seconds = ?, 
                        transcript = ?,
                        outcome = CASE WHEN outcome = 'initiated' THEN 'completed' ELSE outcome END
                    WHERE user_id = ? AND notes LIKE ?
                ");
                $stmt->execute([
                    $duration,
                    json_encode($transcript),
                    $userId,
                    '%' . $callId . '%'
                ]);
            }
            break;
            
        case 'call.failed':
            // Call failed
            if ($userId && $callId) {
                $stmt = $db->prepare("
                    UPDATE call_logs 
                    SET outcome = 'other',
                        notes = JSON_SET(COALESCE(notes, '{}'), '$.error', ?)
                    WHERE user_id = ? AND notes LIKE ?
                ");
                $stmt->execute([
                    $input['error'] ?? 'Call failed',
                    $userId,
                    '%' . $callId . '%'
                ]);
            }
            break;
    }
    
    echo json_encode(['success' => true]);
}
