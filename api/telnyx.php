<?php
/**
 * Telnyx Voice API Endpoint
 * Uses a SINGLE global TELNYX_API_KEY from config.php
 * Handles config, auto-provisioning, call initiation, and webhooks
 */

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

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

enforceRateLimit($user, 'telnyx');

try {
    switch ($action) {
        case 'get_config':
            handleGetConfig($db, $user);
            break;
        case 'save_config':
            handleSaveConfig($db, $user);
            break;
        case 'test_connection':
            handleTestConnection();
            break;
        case 'provision_number':
            handleProvisionNumber($db, $user);
            break;
        case 'release_number':
            handleReleaseNumber($db, $user);
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
        case 'get_transcript':
            handleGetTranscript($db, $user);
            break;
        case 'check_addon':
            handleCheckAddon($db, $user);
            break;
        case 'purchase_addon':
            handlePurchaseAddon($db, $user);
            break;
        case 'save_call_log':
            handleSaveCallLog($db, $user);
            break;
        case 'get_call_logs':
            handleGetCallLogs($db, $user);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Telnyx API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ─── Helper: get global Telnyx API key ───
function getTelnyxApiKey() {
    if (!defined('TELNYX_API_KEY') || !TELNYX_API_KEY) {
        throw new Exception('TELNYX_API_KEY not configured on server');
    }
    return TELNYX_API_KEY;
}

function getTelnyxConnectionId() {
    if (!defined('TELNYX_CONNECTION_ID') || !TELNYX_CONNECTION_ID) {
        throw new Exception('TELNYX_CONNECTION_ID not configured on server');
    }
    return TELNYX_CONNECTION_ID;
}

// ─── Telnyx API helper ───
function telnyxRequest($method, $endpoint, $body = null) {
    $apiKey = getTelnyxApiKey();
    $url = 'https://api.telnyx.com/v2' . $endpoint;
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body ?? []));
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'data' => json_decode($response, true), 'raw' => $response];
}

/**
 * Get user's Telnyx configuration (no API key exposed)
 */
function handleGetConfig($db, $user) {
    $stmt = $db->prepare("SELECT * FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($config) {
        echo json_encode([
            'success' => true,
            'config' => [
                'phone_number' => $config['phone_number'] ?? '',
                'voice' => $config['voice'] ?? 'Telnyx.Kokoro',
                'greeting_message' => $config['greeting_message'] ?? '',
                'system_prompt' => $config['system_prompt'] ?? '',
                'enabled' => (bool)$config['enabled'],
                'provisioned' => (bool)$config['provisioned'],
                'provision_status' => $config['provision_status'] ?? 'none'
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'config' => null]);
    }
}

/**
 * Save voice agent settings (greeting, prompt, voice — no API key)
 */
function handleSaveConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $db->prepare("SELECT id FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        $stmt = $db->prepare("
            UPDATE telnyx_config SET 
                voice = ?,
                greeting_message = ?,
                system_prompt = ?,
                enabled = ?,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $input['voice'] ?? 'Telnyx.Kokoro',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0,
            $user['id']
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO telnyx_config 
            (user_id, voice, greeting_message, system_prompt, enabled)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $input['voice'] ?? 'Telnyx.Kokoro',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0
        ]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Configuration saved']);
}

/**
 * Test Telnyx API connection (uses global key)
 */
function handleTestConnection() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    try {
        $result = telnyxRequest('GET', '/balance');
        
        if ($result['code'] === 200) {
            $balance = $result['data']['data']['balance'] ?? 'N/A';
            echo json_encode([
                'success' => true,
                'message' => "Connected! Account balance: $" . number_format($balance, 2)
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Connection failed (HTTP ' . $result['code'] . ')'
            ]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/**
 * Auto-provision a phone number for a customer
 * Flow: Search available numbers → Order one → Assign to user
 */
function handleProvisionNumber($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if user already has a number
    $stmt = $db->prepare("SELECT phone_number, provision_status FROM telnyx_config WHERE user_id = ? AND provision_status = 'active'");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing && $existing['phone_number']) {
        echo json_encode([
            'success' => true,
            'phone_number' => $existing['phone_number'],
            'message' => 'You already have a provisioned number'
        ]);
        return;
    }
    
    // Verify payment: Autopilot gets it free, others need $8/mo add-on
    $stmt = $db->prepare("SELECT plan, status FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$user['id']]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isAutopilot = $subscription && $subscription['plan'] === 'autopilot';
    
    if (!$isAutopilot) {
        // Check calling_config for addon_active OR check Stripe for active AI Calling subscription
        $addonActive = false;
        
        // Method 1: Check calling_config table
        $stmt = $db->prepare("SELECT addon_active FROM calling_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $callingConfig = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($callingConfig && $callingConfig['addon_active']) {
            $addonActive = true;
        }
        
        // Method 2: Check Stripe for ai_calling addon subscription
        if (!$addonActive && defined('STRIPE_SECRET_KEY') && STRIPE_SECRET_KEY) {
            require_once __DIR__ . '/includes/stripe.php';
            $stripeAddon = checkStripeAddonActive($user['id'], 'ai_calling');
            if ($stripeAddon) {
                $addonActive = true;
                // Cache the result in calling_config
                $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
                $stmt->execute([$user['id']]);
                if ($stmt->fetch()) {
                    $db->prepare("UPDATE calling_config SET addon_active = 1 WHERE user_id = ?")->execute([$user['id']]);
                } else {
                    $db->prepare("INSERT INTO calling_config (user_id, addon_active) VALUES (?, 1)")->execute([$user['id']]);
                }
            }
        }
        
        if (!$addonActive) {
            http_response_code(402);
            echo json_encode([
                'success' => false,
                'error' => 'AI Calling add-on ($8/mo) required. Purchase the add-on first.',
                'requires_addon' => true
            ]);
            return;
        }
    }
    
    try {
        $countryCode = $input['country_code'] ?? 'US';
        $areaCode = $input['area_code'] ?? null;
        
        // Step 1: Search for available phone numbers
        $searchParams = '?filter[country_code]=' . $countryCode . '&filter[limit]=5&filter[features][]=voice&filter[features][]=sms';
        if ($areaCode) {
            $searchParams .= '&filter[national_destination_code]=' . $areaCode;
        }
        
        $searchResult = telnyxRequest('GET', '/available_phone_numbers' . $searchParams);
        
        if ($searchResult['code'] !== 200 || empty($searchResult['data']['data'])) {
            echo json_encode(['success' => false, 'error' => 'No phone numbers available in that area. Try a different area code.']);
            return;
        }
        
        // Pick the first available number
        $availableNumber = $searchResult['data']['data'][0];
        $phoneNumber = $availableNumber['phone_number'];
        
        // Step 2: Create a number order
        $orderResult = telnyxRequest('POST', '/number_orders', [
            'phone_numbers' => [
                ['phone_number' => $phoneNumber]
            ],
            'connection_id' => getTelnyxConnectionId(),
            'messaging_profile_id' => defined('TELNYX_MESSAGING_PROFILE_ID') ? TELNYX_MESSAGING_PROFILE_ID : null
        ]);
        
        if ($orderResult['code'] !== 200 && $orderResult['code'] !== 201) {
            $errorMsg = $orderResult['data']['errors'][0]['detail'] ?? 'Failed to order phone number';
            echo json_encode(['success' => false, 'error' => $errorMsg]);
            return;
        }
        
        $orderData = $orderResult['data']['data'] ?? [];
        $phoneNumberId = $orderData['phone_numbers'][0]['id'] ?? '';
        $orderStatus = $orderData['status'] ?? 'pending';
        
        // Step 3: Store in database
        $stmt = $db->prepare("SELECT id FROM telnyx_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $existingConfig = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingConfig) {
            $stmt = $db->prepare("
                UPDATE telnyx_config SET 
                    phone_number = ?,
                    phone_number_id = ?,
                    provisioned = 1,
                    provision_status = ?,
                    provisioned_at = NOW(),
                    enabled = 1,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([
                $phoneNumber,
                $phoneNumberId,
                ($orderStatus === 'success') ? 'active' : 'pending',
                $user['id']
            ]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO telnyx_config 
                (user_id, phone_number, phone_number_id, provisioned, provision_status, provisioned_at, enabled)
                VALUES (?, ?, ?, 1, ?, NOW(), 1)
            ");
            $stmt->execute([
                $user['id'],
                $phoneNumber,
                $phoneNumberId,
                ($orderStatus === 'success') ? 'active' : 'pending'
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'phone_number' => $phoneNumber,
            'status' => $orderStatus,
            'message' => 'Phone number provisioned successfully!'
        ]);
        
    } catch (Exception $e) {
        // Mark as failed
        $stmt = $db->prepare("
            UPDATE telnyx_config SET provision_status = 'failed', updated_at = NOW() WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);
        
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/**
 * Release a provisioned phone number
 */
function handleReleaseNumber($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $stmt = $db->prepare("SELECT phone_number_id FROM telnyx_config WHERE user_id = ? AND provision_status = 'active'");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || !$config['phone_number_id']) {
        echo json_encode(['success' => false, 'error' => 'No active phone number to release']);
        return;
    }
    
    try {
        // Release the number via Telnyx API
        $result = telnyxRequest('DELETE', '/phone_numbers/' . $config['phone_number_id']);
        
        $stmt = $db->prepare("
            UPDATE telnyx_config SET 
                phone_number = NULL,
                phone_number_id = NULL,
                provisioned = 0,
                provision_status = 'released',
                enabled = 0,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Phone number released']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/**
 * Initiate an outbound call (uses global API key)
 */
function handleInitiateCall($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $destinationNumber = $input['destination_number'] ?? '';
    
    if (!$destinationNumber) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Destination number required']);
        return;
    }
    
    // Get user's config (for their phone number and voice settings)
    $stmt = $db->prepare("SELECT * FROM telnyx_config WHERE user_id = ? AND enabled = 1 AND provision_status = 'active'");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || !$config['phone_number']) {
        echo json_encode(['success' => false, 'error' => 'No phone number provisioned. Activate AI Calling first.']);
        return;
    }
    
    $webhookUrl = FRONTEND_URL . '/api/telnyx.php?action=webhook&user_id=' . $user['id'];
    
    $callData = [
        'connection_id' => getTelnyxConnectionId(),
        'to' => $destinationNumber,
        'from' => $config['phone_number'],
        'webhook_url' => $webhookUrl,
        'webhook_url_method' => 'POST',
        'answering_machine_detection' => 'detect',
        'client_state' => base64_encode(json_encode([
            'user_id' => $user['id'],
            'lead_id' => $input['lead_id'] ?? null,
            'lead_name' => $input['lead_name'] ?? null
        ]))
    ];
    
    $result = telnyxRequest('POST', '/calls', $callData);
    
    if ($result['code'] === 200 || $result['code'] === 201) {
        $callControlId = $result['data']['data']['call_control_id'] ?? '';
        $callLegId = $result['data']['data']['call_leg_id'] ?? '';
        
        $stmt = $db->prepare("
            INSERT INTO telnyx_active_calls 
            (user_id, call_control_id, call_leg_id, destination_number, lead_id, lead_name, status, started_at)
            VALUES (?, ?, ?, ?, ?, ?, 'initiated', NOW())
        ");
        $stmt->execute([
            $user['id'],
            $callControlId,
            $callLegId,
            $destinationNumber,
            $input['lead_id'] ?? null,
            $input['lead_name'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'call_control_id' => $callControlId,
            'call_leg_id' => $callLegId
        ]);
    } else {
        $error = $result['data']['errors'][0]['detail'] ?? 'Failed to initiate call';
        echo json_encode(['success' => false, 'error' => $error]);
    }
}

/**
 * Hang up a call
 */
function handleHangupCall($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $callControlId = $input['call_control_id'] ?? '';
    
    if (!$callControlId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Call control ID required']);
        return;
    }
    
    $result = telnyxRequest('POST', "/calls/{$callControlId}/actions/hangup");
    
    $stmt = $db->prepare("UPDATE telnyx_active_calls SET status = 'ended', ended_at = NOW() WHERE call_control_id = ?");
    $stmt->execute([$callControlId]);
    
    echo json_encode(['success' => $result['code'] === 200]);
}

/**
 * Get call status
 */
function handleCallStatus($db, $user) {
    $callControlId = $_GET['call_control_id'] ?? '';
    
    if (!$callControlId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Call control ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT status, TIMESTAMPDIFF(SECOND, started_at, COALESCE(ended_at, NOW())) as duration_seconds
        FROM telnyx_active_calls 
        WHERE user_id = ? AND call_control_id = ?
    ");
    $stmt->execute([$user['id'], $callControlId]);
    $call = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($call) {
        echo json_encode([
            'success' => true,
            'status' => $call['status'],
            'duration_seconds' => intval($call['duration_seconds'])
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Call not found']);
    }
}

/**
 * Get call transcript
 */
function handleGetTranscript($db, $user) {
    $callControlId = $_GET['call_control_id'] ?? '';
    
    if (!$callControlId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Call control ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT transcript 
        FROM telnyx_active_calls 
        WHERE user_id = ? AND call_control_id = ?
    ");
    $stmt->execute([$user['id'], $callControlId]);
    $call = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($call) {
        echo json_encode([
            'success' => true,
            'transcript' => $call['transcript'] ? json_decode($call['transcript'], true) : []
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Call not found']);
    }
}

/**
 * Handle Telnyx webhook events
 */
function handleWebhook($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['data'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid webhook payload']);
        return;
    }
    
    $eventType = $input['data']['event_type'] ?? '';
    $payload = $input['data']['payload'] ?? [];
    $callControlId = $payload['call_control_id'] ?? '';
    
    error_log("Telnyx webhook: $eventType - " . json_encode($payload));
    
    $clientState = [];
    if (!empty($payload['client_state'])) {
        $clientState = json_decode(base64_decode($payload['client_state']), true) ?? [];
    }
    
    $userId = $clientState['user_id'] ?? $_GET['user_id'] ?? null;
    
    switch ($eventType) {
        case 'call.initiated':
            updateCallStatus($db, $callControlId, 'initiated');
            break;
            
        case 'call.ringing':
            updateCallStatus($db, $callControlId, 'ringing');
            break;
            
        case 'call.answered':
            updateCallStatus($db, $callControlId, 'answered');
            if ($userId) {
                startAIConversation($db, $userId, $callControlId);
            }
            break;
            
        case 'call.transcription':
            $transcript = $payload['transcription_data']['transcript'] ?? '';
            if ($transcript && $callControlId) {
                appendTranscript($db, $callControlId, 'user', $transcript);
            }
            break;

        case 'call.ai_gather.partial_results':
            $messageHistory = $payload['message_history'] ?? [];
            if ($messageHistory && $callControlId) {
                $transcript = [];
                foreach ($messageHistory as $msg) {
                    $transcript[] = [
                        'role' => ($msg['role'] === 'assistant') ? 'agent' : 'user',
                        'text' => $msg['content'] ?? '',
                        'timestamp' => time()
                    ];
                }
                $stmt = $db->prepare("UPDATE telnyx_active_calls SET transcript = ? WHERE call_control_id = ?");
                $stmt->execute([json_encode($transcript), $callControlId]);
            }
            updateCallStatus($db, $callControlId, 'speaking');
            break;

        case 'call.ai_gather.message_history_updated':
            $messageHistory = $payload['message_history'] ?? [];
            if ($messageHistory && $callControlId) {
                $transcript = [];
                foreach ($messageHistory as $msg) {
                    $transcript[] = [
                        'role' => ($msg['role'] === 'assistant') ? 'agent' : 'user',
                        'text' => $msg['content'] ?? '',
                        'timestamp' => time()
                    ];
                }
                $stmt = $db->prepare("UPDATE telnyx_active_calls SET transcript = ? WHERE call_control_id = ?");
                $stmt->execute([json_encode($transcript), $callControlId]);
            }
            break;

        case 'call.ai_gather.ended':
            $messageHistory = $payload['message_history'] ?? [];
            if ($messageHistory && $callControlId) {
                $transcript = [];
                foreach ($messageHistory as $msg) {
                    $transcript[] = [
                        'role' => ($msg['role'] === 'assistant') ? 'agent' : 'user',
                        'text' => $msg['content'] ?? '',
                        'timestamp' => time()
                    ];
                }
                $stmt = $db->prepare("UPDATE telnyx_active_calls SET transcript = ? WHERE call_control_id = ?");
                $stmt->execute([json_encode($transcript), $callControlId]);
            }
            updateCallStatus($db, $callControlId, 'listening');
            break;
            
        case 'call.speak.ended':
            updateCallStatus($db, $callControlId, 'listening');
            break;
            
        case 'call.hangup':
        case 'call.machine.detection.ended':
            updateCallStatus($db, $callControlId, 'ended');
            if ($callControlId) {
                saveCallToLogs($db, $callControlId);
            }
            break;
    }
    
    echo json_encode(['success' => true]);
}

/**
 * Update call status in database
 */
function updateCallStatus($db, $callControlId, $status) {
    $stmt = $db->prepare("UPDATE telnyx_active_calls SET status = ? WHERE call_control_id = ?");
    $stmt->execute([$status, $callControlId]);
    
    if ($status === 'ended') {
        $stmt = $db->prepare("UPDATE telnyx_active_calls SET ended_at = NOW() WHERE call_control_id = ?");
        $stmt->execute([$callControlId]);
    }
}

/**
 * Append to call transcript
 */
function appendTranscript($db, $callControlId, $role, $text) {
    $stmt = $db->prepare("SELECT transcript FROM telnyx_active_calls WHERE call_control_id = ?");
    $stmt->execute([$callControlId]);
    $call = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $transcript = $call['transcript'] ? json_decode($call['transcript'], true) : [];
    $transcript[] = [
        'role' => $role,
        'text' => $text,
        'timestamp' => time()
    ];
    
    $stmt = $db->prepare("UPDATE telnyx_active_calls SET transcript = ? WHERE call_control_id = ?");
    $stmt->execute([json_encode($transcript), $callControlId]);
}

/**
 * Start AI conversation using Telnyx's native gather_using_ai
 */
function startAIConversation($db, $userId, $callControlId) {
    $stmt = $db->prepare("SELECT * FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$userId]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) return;

    $stmt = $db->prepare("SELECT lead_name, destination_number FROM telnyx_active_calls WHERE call_control_id = ?");
    $stmt->execute([$callControlId]);
    $callInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    $leadName = $callInfo['lead_name'] ?? 'the contact';

    $systemPrompt = $config['system_prompt'] ?: 'You are a professional AI sales assistant. Be friendly, concise, and helpful.';
    $greeting = $config['greeting_message'] ?: "Hi, this is an AI assistant calling on behalf of a business. How can I help you today?";

    $gatherPayload = [
        'assistant' => [
            'instructions' => $systemPrompt . "\n\nYou are calling " . $leadName . ". Start with this greeting: " . $greeting,
            'greeting' => $greeting,
        ],
        'voice' => $config['voice'] ?: 'Telnyx.Kokoro',
        'language' => 'en',
        'send_partial_results' => true,
        'send_message_history_updates' => true,
        'client_state' => base64_encode(json_encode([
            'user_id' => $userId,
            'mode' => 'ai_calling'
        ]))
    ];

    $result = telnyxRequest('POST', "/calls/{$callControlId}/actions/gather_using_ai", $gatherPayload);

    if ($result['code'] === 200 || $result['code'] === 201) {
        $conversationId = $result['data']['data']['conversation_id'] ?? '';
        
        $stmt = $db->prepare("UPDATE telnyx_active_calls SET status = 'speaking' WHERE call_control_id = ?");
        $stmt->execute([$callControlId]);
        
        appendTranscript($db, $callControlId, 'agent', $greeting);
        error_log("Telnyx AI Gather started: conversation_id=$conversationId");
    } else {
        error_log("Telnyx AI Gather failed ({$result['code']}): {$result['raw']}");
        // Fallback: just speak the greeting
        speakText($callControlId, $greeting, $config['voice'] ?: 'Telnyx.Kokoro');
        appendTranscript($db, $callControlId, 'agent', $greeting);
        updateCallStatus($db, $callControlId, 'speaking');
    }
}

/**
 * Use Telnyx TTS to speak text (uses global key)
 */
function speakText($callControlId, $text, $voice = 'Telnyx.Kokoro') {
    telnyxRequest('POST', "/calls/{$callControlId}/actions/speak", [
        'payload' => $text,
        'voice' => $voice,
        'language' => 'en-US'
    ]);
}

/**
 * Save completed call to call_logs table
 */
function saveCallToLogs($db, $callControlId) {
    $stmt = $db->prepare("SELECT * FROM telnyx_active_calls WHERE call_control_id = ?");
    $stmt->execute([$callControlId]);
    $call = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$call) return;
    
    $duration = 0;
    if ($call['started_at'] && $call['ended_at']) {
        $start = new DateTime($call['started_at']);
        $end = new DateTime($call['ended_at']);
        $duration = $end->getTimestamp() - $start->getTimestamp();
    }
    
    $transcript = $call['transcript'] ? json_decode($call['transcript'], true) : [];
    $outcome = count($transcript) === 0 ? 'no_answer' : 'completed';
    
    $stmt = $db->prepare("
        INSERT INTO call_logs (user_id, lead_id, lead_name, lead_phone, agent_id, duration_seconds, outcome, transcript)
        VALUES (?, ?, ?, ?, 'telnyx', ?, ?, ?)
    ");
    $stmt->execute([
        $call['user_id'],
        $call['lead_id'],
        $call['lead_name'],
        $call['destination_number'],
        $duration,
        $outcome,
        $call['transcript']
    ]);
}

/**
 * Check if user has AI Calling add-on
 */
function handleCheckAddon($db, $user) {
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
 * Purchase AI Calling add-on ($8/mo)
 */
function handlePurchaseAddon($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
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
 * Save a call log
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
        VALUES (?, ?, ?, ?, 'telnyx', ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $user['id'],
        $input['lead_id'] ?? null,
        $input['lead_name'] ?? null,
        $input['lead_phone'] ?? null,
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
