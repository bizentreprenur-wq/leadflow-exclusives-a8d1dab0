<?php
/**
 * Telnyx Voice API Endpoint
 * Handles configuration, call initiation, and call control
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
            handleTestConnection($user);
            break;
            
        case 'get_phone_numbers':
            handleGetPhoneNumbers($db, $user);
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
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Telnyx API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Get user's Telnyx configuration
 */
function handleGetConfig($db, $user) {
    $stmt = $db->prepare("SELECT * FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($config) {
        // Don't send the full API key back, just mask it
        $maskedKey = $config['api_key'] ? '****' . substr($config['api_key'], -4) : '';
        
        echo json_encode([
            'success' => true,
            'config' => [
                'api_key' => $maskedKey,
                'connection_id' => $config['connection_id'] ?? '',
                'phone_number' => $config['phone_number'] ?? '',
                'voice' => $config['voice'] ?? 'Polly.Brian',
                'greeting_message' => $config['greeting_message'] ?? '',
                'system_prompt' => $config['system_prompt'] ?? '',
                'enabled' => (bool)$config['enabled']
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
 * Save Telnyx configuration
 */
function handleSaveConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if config exists
    $stmt = $db->prepare("SELECT id, api_key FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Only update API key if a new one is provided (not masked)
    $apiKey = $input['api_key'] ?? '';
    if (strpos($apiKey, '****') === 0 && $existing) {
        $apiKey = $existing['api_key']; // Keep existing key
    }
    
    if ($existing) {
        $stmt = $db->prepare("
            UPDATE telnyx_config SET 
                api_key = ?,
                connection_id = ?,
                phone_number = ?,
                voice = ?,
                greeting_message = ?,
                system_prompt = ?,
                enabled = ?,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $apiKey,
            $input['connection_id'] ?? '',
            $input['phone_number'] ?? '',
            $input['voice'] ?? 'Polly.Brian',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0,
            $user['id']
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO telnyx_config 
            (user_id, api_key, connection_id, phone_number, voice, greeting_message, system_prompt, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $apiKey,
            $input['connection_id'] ?? '',
            $input['phone_number'] ?? '',
            $input['voice'] ?? 'Polly.Brian',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0
        ]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Configuration saved']);
}

/**
 * Test Telnyx API connection
 */
function handleTestConnection($user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $apiKey = $input['api_key'] ?? '';
    
    if (!$apiKey || strpos($apiKey, '****') === 0) {
        // If masked key, fetch from database
        global $db;
        $stmt = $db->prepare("SELECT api_key FROM telnyx_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        $apiKey = $config['api_key'] ?? '';
    }
    
    if (!$apiKey) {
        echo json_encode(['success' => false, 'error' => 'No API key provided']);
        return;
    }
    
    // Test the API key by fetching account info
    $ch = curl_init('https://api.telnyx.com/v2/balance');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        $balance = $data['data']['balance'] ?? 'N/A';
        echo json_encode([
            'success' => true,
            'message' => "Connected! Account balance: $" . number_format($balance, 2)
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid API key or connection failed (HTTP ' . $httpCode . ')'
        ]);
    }
}

/**
 * Get phone numbers from Telnyx account
 */
function handleGetPhoneNumbers($db, $user) {
    $stmt = $db->prepare("SELECT api_key FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || !$config['api_key']) {
        echo json_encode(['success' => false, 'error' => 'No API key configured']);
        return;
    }
    
    $ch = curl_init('https://api.telnyx.com/v2/phone_numbers');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['api_key'],
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        $phoneNumbers = [];
        
        foreach ($data['data'] ?? [] as $number) {
            $phoneNumbers[] = $number['phone_number'];
        }
        
        echo json_encode([
            'success' => true,
            'phone_numbers' => $phoneNumbers
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to fetch phone numbers'
        ]);
    }
}

/**
 * Initiate an outbound call
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
    
    // Get user's Telnyx config
    $stmt = $db->prepare("SELECT * FROM telnyx_config WHERE user_id = ? AND enabled = 1");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        echo json_encode(['success' => false, 'error' => 'Telnyx not configured or disabled']);
        return;
    }
    
    // Webhook URL for call events
    $webhookUrl = FRONTEND_URL . '/api/telnyx.php?action=webhook&user_id=' . $user['id'];
    
    // Create the call via Telnyx API
    $callData = [
        'connection_id' => $config['connection_id'],
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
    
    $ch = curl_init('https://api.telnyx.com/v2/calls');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($callData),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['api_key'],
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        $data = json_decode($response, true);
        $callControlId = $data['data']['call_control_id'] ?? '';
        $callLegId = $data['data']['call_leg_id'] ?? '';
        
        // Store the active call
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
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'error' => $error['errors'][0]['detail'] ?? 'Failed to initiate call'
        ]);
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
    
    // Get user's API key
    $stmt = $db->prepare("SELECT api_key FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        echo json_encode(['success' => false, 'error' => 'Telnyx not configured']);
        return;
    }
    
    $ch = curl_init("https://api.telnyx.com/v2/calls/{$callControlId}/actions/hangup");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['api_key'],
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Update call status
    $stmt = $db->prepare("UPDATE telnyx_active_calls SET status = 'ended', ended_at = NOW() WHERE call_control_id = ?");
    $stmt->execute([$callControlId]);
    
    echo json_encode(['success' => $httpCode === 200]);
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
    
    // Log the webhook for debugging
    error_log("Telnyx webhook: $eventType - " . json_encode($payload));
    
    // Decode client state if present
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
            // Start the AI conversation
            if ($userId) {
                startAIConversation($db, $userId, $callControlId);
            }
            break;
            
        case 'call.transcription':
            // Handle real-time transcription (fallback mode)
            $transcript = $payload['transcription_data']['transcript'] ?? '';
            if ($transcript && $callControlId) {
                appendTranscript($db, $callControlId, 'user', $transcript);
            }
            break;

        case 'call.ai_gather.partial_results':
            // Real-time updates from Telnyx AI conversation
            $messageHistory = $payload['message_history'] ?? [];
            if ($messageHistory && $callControlId) {
                // Store the latest message history as transcript
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
            // Updated message history from AI conversation
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
            // AI conversation completed — save final results
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
            // Save to call logs
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
    // Get current transcript
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
 * This handles TTS + STT + LLM in one API call — cheapest option
 */
function startAIConversation($db, $userId, $callControlId) {
    // Get user config
    $stmt = $db->prepare("SELECT * FROM telnyx_config WHERE user_id = ?");
    $stmt->execute([$userId]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) return;

    // Get lead context from active call
    $stmt = $db->prepare("SELECT lead_name, destination_number FROM telnyx_active_calls WHERE call_control_id = ?");
    $stmt->execute([$callControlId]);
    $callInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    $leadName = $callInfo['lead_name'] ?? 'the contact';

    // Build system instructions from user config + lead context
    $systemPrompt = $config['system_prompt'] ?: 'You are a professional AI sales assistant. Be friendly, concise, and helpful.';
    $greeting = $config['greeting_message'] ?: "Hi, this is an AI assistant calling on behalf of a business. How can I help you today?";

    // Use Telnyx gather_using_ai — handles TTS, STT, and LLM natively
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

    $ch = curl_init("https://api.telnyx.com/v2/calls/{$callControlId}/actions/gather_using_ai");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($gatherPayload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['api_key'],
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 201) {
        $data = json_decode($response, true);
        $conversationId = $data['data']['conversation_id'] ?? '';
        
        // Store conversation ID for tracking
        $stmt = $db->prepare("UPDATE telnyx_active_calls SET status = 'speaking' WHERE call_control_id = ?");
        $stmt->execute([$callControlId]);
        
        appendTranscript($db, $callControlId, 'agent', $greeting);
        error_log("Telnyx AI Gather started: conversation_id=$conversationId");
    } else {
        error_log("Telnyx AI Gather failed ($httpCode): $response");
        // Fallback: just speak the greeting without AI
        speakText($config['api_key'], $callControlId, $greeting, $config['voice'] ?: 'Telnyx.Kokoro');
        appendTranscript($db, $callControlId, 'agent', $greeting);
        updateCallStatus($db, $callControlId, 'speaking');
    }
}

/**
 * processAIResponse is no longer needed — Telnyx gather_using_ai handles
 * the entire conversation loop (STT + LLM + TTS) natively.
 * Keeping as a fallback for manual transcription mode.
 */
function processAIResponse($db, $userId, $callControlId, $userText) {
    // Fallback: if gather_using_ai isn't active, just log the transcript
    error_log("Fallback processAIResponse called for $callControlId: $userText");
    appendTranscript($db, $callControlId, 'user', $userText);
}

/**
 * Use Telnyx TTS to speak text
 */
function speakText($apiKey, $callControlId, $text, $voice = 'Polly.Brian') {
    $ch = curl_init("https://api.telnyx.com/v2/calls/{$callControlId}/actions/speak");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'payload' => $text,
            'voice' => $voice,
            'language' => 'en-US'
        ]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 10
    ]);
    
    curl_exec($ch);
    curl_close($ch);
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
    
    // Determine outcome based on transcript
    $transcript = $call['transcript'] ? json_decode($call['transcript'], true) : [];
    $outcome = 'completed';
    if (count($transcript) === 0) {
        $outcome = 'no_answer';
    }
    
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
