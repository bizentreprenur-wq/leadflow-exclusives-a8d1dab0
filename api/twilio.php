<?php
/**
 * Twilio Voice & SMS API Endpoint
 * Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from config.php
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

// Public webhook endpoints (no auth required)
if ($action === 'voice_webhook' || $action === 'status_webhook' || $action === 'sms_webhook') {
    handleWebhook($db, $action);
    exit();
}

// All other endpoints require authentication
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

enforceRateLimit($user, 'twilio');

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
    error_log("Twilio API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ─── Helper: get Twilio credentials ───
function getTwilioAccountSid() {
    if (!defined('TWILIO_ACCOUNT_SID') || !TWILIO_ACCOUNT_SID) {
        throw new Exception('TWILIO_ACCOUNT_SID not configured on server');
    }
    $sid = trim((string) TWILIO_ACCOUNT_SID);
    if (!preg_match('/^AC[a-zA-Z0-9]{32}$/', $sid)) {
        throw new Exception('TWILIO_ACCOUNT_SID must be a valid Account SID (AC...)');
    }
    return $sid;
}

function getTwilioAuthToken() {
    if (!defined('TWILIO_AUTH_TOKEN') || !TWILIO_AUTH_TOKEN) {
        throw new Exception('TWILIO_AUTH_TOKEN not configured on server');
    }
    return TWILIO_AUTH_TOKEN;
}

function twilioWebhookBaseUrl() {
    if (defined('TWILIO_WEBHOOK_BASE_URL') && trim((string) TWILIO_WEBHOOK_BASE_URL) !== '') {
        return rtrim((string) TWILIO_WEBHOOK_BASE_URL, '/');
    }

    if (defined('FRONTEND_URL') && trim((string) FRONTEND_URL) !== '') {
        return rtrim((string) FRONTEND_URL, '/');
    }

    $host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? ($_SERVER['HTTP_HOST'] ?? '');
    if ($host !== '') {
        $proto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
        return $proto . '://' . $host;
    }

    return 'https://bamlead.com';
}

// ─── Twilio API helper ───
function twilioRequest($method, $endpoint, $body = null) {
    $accountSid = getTwilioAccountSid();
    $authToken = getTwilioAuthToken();
    $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $accountSid . $endpoint;
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => $accountSid . ':' . $authToken,
        CURLOPT_TIMEOUT => 30
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($body));
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    } elseif ($method === 'GET' && $body) {
        $url .= '?' . http_build_query($body);
        curl_setopt($ch, CURLOPT_URL, $url);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'data' => json_decode($response, true), 'raw' => $response];
}

/**
 * Get user's Twilio configuration
 */
function handleGetConfig($db, $user) {
    $stmt = $db->prepare("SELECT * FROM twilio_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($config) {
        echo json_encode([
            'success' => true,
            'config' => [
                'phone_number' => $config['phone_number'] ?? '',
                'voice' => $config['voice'] ?? 'Polly.Joanna',
                'greeting_message' => $config['greeting_message'] ?? '',
                'system_prompt' => $config['system_prompt'] ?? '',
                'enabled' => (bool)($config['enabled'] ?? 0),
                'provisioned' => (bool)($config['provisioned'] ?? 0),
                'provision_status' => $config['provision_status'] ?? 'none'
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'config' => null]);
    }
}

/**
 * Save voice agent settings
 */
function handleSaveConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    
    $stmt = $db->prepare("SELECT id FROM twilio_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        $stmt = $db->prepare("
            UPDATE twilio_config SET 
                voice = ?,
                greeting_message = ?,
                system_prompt = ?,
                enabled = ?,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $input['voice'] ?? 'Polly.Joanna',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            !empty($input['enabled']) ? 1 : 0,
            $user['id']
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO twilio_config 
            (user_id, voice, greeting_message, system_prompt, enabled)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $input['voice'] ?? 'Polly.Joanna',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            !empty($input['enabled']) ? 1 : 0
        ]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Configuration saved']);
}

/**
 * Test Twilio API connection
 */
function handleTestConnection() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    try {
        $result = twilioRequest('GET', '.json');
        
        if ($result['code'] === 200) {
            $friendlyName = $result['data']['friendly_name'] ?? 'N/A';
            $status = $result['data']['status'] ?? 'unknown';
            echo json_encode([
                'success' => true,
                'message' => "Connected! Account: $friendlyName (Status: $status)"
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
 * Auto-provision a phone number via Twilio
 */
function handleProvisionNumber($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if user already has a number
    $stmt = $db->prepare("SELECT phone_number, provision_status FROM twilio_config WHERE user_id = ? AND provision_status = 'active'");
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
        $addonActive = false;
        
        $stmt = $db->prepare("SELECT addon_active FROM calling_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $callingConfig = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($callingConfig && $callingConfig['addon_active']) {
            $addonActive = true;
        }
        
        if (!$addonActive && defined('STRIPE_SECRET_KEY') && STRIPE_SECRET_KEY) {
            require_once __DIR__ . '/includes/stripe.php';
            $stripeAddon = checkStripeAddonActive($user['id'], 'ai_calling');
            if ($stripeAddon) {
                $addonActive = true;
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
        $searchParams = [
            'VoiceEnabled' => 'true',
            'SmsEnabled' => 'true',
        ];
        if ($areaCode) {
            $searchParams['AreaCode'] = $areaCode;
        }
        
        $searchResult = twilioRequest('GET', '/AvailablePhoneNumbers/' . $countryCode . '/Local.json', $searchParams);
        
        if ($searchResult['code'] !== 200 || empty($searchResult['data']['available_phone_numbers'])) {
            echo json_encode(['success' => false, 'error' => 'No phone numbers available in that area. Try a different area code.']);
            return;
        }
        
        $availableNumber = $searchResult['data']['available_phone_numbers'][0];
        $phoneNumber = $availableNumber['phone_number'];
        
        // Step 2: Purchase the number
        $webhookBase = twilioWebhookBaseUrl() . '/api/twilio.php';
        
        $orderResult = twilioRequest('POST', '/IncomingPhoneNumbers.json', [
            'PhoneNumber' => $phoneNumber,
            'VoiceUrl' => $webhookBase . '?action=voice_webhook&user_id=' . $user['id'],
            'VoiceMethod' => 'POST',
            'StatusCallback' => $webhookBase . '?action=status_webhook&user_id=' . $user['id'],
            'StatusCallbackMethod' => 'POST',
            'SmsUrl' => $webhookBase . '?action=sms_webhook&user_id=' . $user['id'],
            'SmsMethod' => 'POST',
        ]);
        
        if ($orderResult['code'] !== 200 && $orderResult['code'] !== 201) {
            $errorMsg = $orderResult['data']['message'] ?? 'Failed to purchase phone number';
            echo json_encode(['success' => false, 'error' => $errorMsg]);
            return;
        }
        
        $phoneNumberSid = $orderResult['data']['sid'] ?? '';
        
        // Step 3: Store in database
        $stmt = $db->prepare("SELECT id FROM twilio_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $existingConfig = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingConfig) {
            $stmt = $db->prepare("
                UPDATE twilio_config SET 
                    phone_number = ?,
                    phone_number_sid = ?,
                    provisioned = 1,
                    provision_status = 'active',
                    provisioned_at = NOW(),
                    enabled = 1,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$phoneNumber, $phoneNumberSid, $user['id']]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO twilio_config 
                (user_id, phone_number, phone_number_sid, provisioned, provision_status, provisioned_at, enabled)
                VALUES (?, ?, ?, 1, 'active', NOW(), 1)
            ");
            $stmt->execute([$user['id'], $phoneNumber, $phoneNumberSid]);
        }

        $stmt = $db->prepare("
            INSERT INTO calling_config (user_id, phone_number, provisioned, updated_at)
            VALUES (?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
                phone_number = VALUES(phone_number),
                provisioned = 1,
                updated_at = NOW()
        ");
        $stmt->execute([$user['id'], $phoneNumber]);
        
        echo json_encode([
            'success' => true,
            'phone_number' => $phoneNumber,
            'status' => 'active',
            'message' => 'Phone number provisioned successfully!'
        ]);
        
    } catch (Exception $e) {
        $stmt = $db->prepare("UPDATE twilio_config SET provision_status = 'failed', updated_at = NOW() WHERE user_id = ?");
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
    
    $stmt = $db->prepare("SELECT phone_number_sid FROM twilio_config WHERE user_id = ? AND provision_status = 'active'");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || !$config['phone_number_sid']) {
        echo json_encode(['success' => false, 'error' => 'No active phone number to release']);
        return;
    }
    
    try {
        twilioRequest('DELETE', '/IncomingPhoneNumbers/' . $config['phone_number_sid'] . '.json');
        
        $stmt = $db->prepare("
            UPDATE twilio_config SET 
                phone_number = NULL,
                phone_number_sid = NULL,
                provisioned = 0,
                provision_status = 'released',
                enabled = 0,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);

        $stmt = $db->prepare("
            UPDATE calling_config SET
                phone_number = NULL,
                provisioned = 0,
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
 * Initiate an outbound call via Twilio
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
    
    $stmt = $db->prepare("SELECT * FROM twilio_config WHERE user_id = ? AND enabled = 1 AND provision_status = 'active'");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || !$config['phone_number']) {
        echo json_encode(['success' => false, 'error' => 'No phone number provisioned. Activate AI Calling first.']);
        return;
    }
    
    $webhookBase = twilioWebhookBaseUrl() . '/api/twilio.php';
    
    $callData = [
        'To' => $destinationNumber,
        'From' => $config['phone_number'],
        'Url' => $webhookBase . '?action=voice_webhook&user_id=' . $user['id'],
        'StatusCallback' => $webhookBase . '?action=status_webhook&user_id=' . $user['id'],
        'StatusCallbackEvent' => 'initiated ringing answered completed',
        'StatusCallbackMethod' => 'POST',
        'MachineDetection' => 'DetectMessageEnd',
        'Record' => 'true',
    ];
    
    $result = twilioRequest('POST', '/Calls.json', $callData);
    
    if ($result['code'] === 200 || $result['code'] === 201) {
        $callSid = $result['data']['sid'] ?? '';
        
        $stmt = $db->prepare("
            INSERT INTO twilio_active_calls 
            (user_id, call_sid, destination_number, lead_id, lead_name, status, started_at)
            VALUES (?, ?, ?, ?, ?, 'initiated', NOW())
        ");
        $stmt->execute([
            $user['id'],
            $callSid,
            $destinationNumber,
            $input['lead_id'] ?? null,
            $input['lead_name'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'call_sid' => $callSid,
        ]);
    } else {
        $error = $result['data']['message'] ?? 'Failed to initiate call';
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
    $callSid = $input['call_sid'] ?? '';
    
    if (!$callSid) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Call SID required']);
        return;
    }
    
    $result = twilioRequest('POST', '/Calls/' . $callSid . '.json', [
        'Status' => 'completed'
    ]);
    
    $stmt = $db->prepare("UPDATE twilio_active_calls SET status = 'completed', ended_at = NOW() WHERE call_sid = ?");
    $stmt->execute([$callSid]);
    
    echo json_encode(['success' => $result['code'] === 200 || $result['code'] === 204]);
}

/**
 * Get call status
 */
function handleCallStatus($db, $user) {
    $callSid = $_GET['call_sid'] ?? '';
    
    if (!$callSid) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Call SID required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT status, TIMESTAMPDIFF(SECOND, started_at, COALESCE(ended_at, NOW())) as duration_seconds
        FROM twilio_active_calls 
        WHERE user_id = ? AND call_sid = ?
    ");
    $stmt->execute([$user['id'], $callSid]);
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
    $callSid = $_GET['call_sid'] ?? '';
    
    if (!$callSid) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Call SID required']);
        return;
    }
    
    $stmt = $db->prepare("SELECT transcript FROM twilio_active_calls WHERE user_id = ? AND call_sid = ?");
    $stmt->execute([$user['id'], $callSid]);
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
 * Handle Twilio webhook events
 */
function handleWebhook($db, $action) {
    $userId = $_GET['user_id'] ?? null;
    
    if ($action === 'voice_webhook') {
        // Twilio expects TwiML response
        header('Content-Type: text/xml');
        
        // Get user's greeting config
        $greeting = 'Hello, this is BamLead calling. Please hold for further instructions.';
        if ($userId) {
            $stmt = $db->prepare("SELECT greeting_message FROM twilio_config WHERE user_id = ?");
            $stmt->execute([$userId]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($config && $config['greeting_message']) {
                $greeting = $config['greeting_message'];
            }
        }
        
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<Response>';
        echo '<Say voice="Polly.Joanna">' . htmlspecialchars($greeting) . '</Say>';
        echo '<Pause length="2"/>';
        echo '<Say voice="Polly.Joanna">Thank you for your time. Goodbye.</Say>';
        echo '</Response>';
        return;
    }
    
    if ($action === 'status_webhook') {
        $callSid = $_POST['CallSid'] ?? '';
        $callStatus = $_POST['CallStatus'] ?? '';
        $duration = $_POST['CallDuration'] ?? 0;
        
        if ($callSid) {
            $statusMap = [
                'queued' => 'initiated',
                'ringing' => 'ringing',
                'in-progress' => 'in-progress',
                'completed' => 'completed',
                'busy' => 'busy',
                'no-answer' => 'no-answer',
                'failed' => 'failed',
                'canceled' => 'canceled',
            ];
            
            $dbStatus = $statusMap[$callStatus] ?? $callStatus;
            
            $stmt = $db->prepare("UPDATE twilio_active_calls SET status = ?, duration_seconds = ? WHERE call_sid = ?");
            $stmt->execute([$dbStatus, intval($duration), $callSid]);
            
            if (in_array($callStatus, ['completed', 'busy', 'no-answer', 'failed', 'canceled'])) {
                $stmt = $db->prepare("UPDATE twilio_active_calls SET ended_at = NOW() WHERE call_sid = ?");
                $stmt->execute([$callSid]);
                
                saveCallToLogs($db, $callSid);
            }
        }
        
        echo json_encode(['success' => true]);
        return;
    }
    
    if ($action === 'sms_webhook') {
        // Handle inbound SMS from Twilio
        $fromNumber = $_POST['From'] ?? '';
        $toNumber = $_POST['To'] ?? '';
        $messageBody = $_POST['Body'] ?? '';
        $messageSid = $_POST['MessageSid'] ?? uniqid('sms_in_');
        
        if ($fromNumber && $messageBody) {
            // Find user by phone number
            $stmt = $db->prepare("SELECT user_id FROM twilio_config WHERE phone_number = ?");
            $stmt->execute([$toNumber]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($config) {
                $ownerId = $config['user_id'];
                
                // Find lead by phone
                $stmt = $db->prepare("
                    SELECT lead_id, lead_name FROM sms_messages 
                    WHERE user_id = ? AND lead_phone = ? 
                    ORDER BY created_at DESC LIMIT 1
                ");
                $stmt->execute([$ownerId, $fromNumber]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $stmt = $db->prepare("
                    INSERT INTO sms_messages (id, user_id, lead_id, lead_phone, lead_name, direction, message, status, external_id, `read`, created_at)
                    VALUES (?, ?, ?, ?, ?, 'inbound', ?, 'received', ?, 0, NOW())
                ");
                $stmt->execute([
                    uniqid('sms_'), 
                    $ownerId, 
                    $existing['lead_id'] ?? null, 
                    $fromNumber, 
                    $existing['lead_name'] ?? '', 
                    $messageBody, 
                    $messageSid
                ]);
            }
        }
        
        // Twilio expects TwiML for SMS webhooks too
        header('Content-Type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
        return;
    }
}

/**
 * Save completed call to call_logs table
 */
function saveCallToLogs($db, $callSid) {
    $stmt = $db->prepare("SELECT * FROM twilio_active_calls WHERE call_sid = ?");
    $stmt->execute([$callSid]);
    $call = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$call) return;
    
    $duration = $call['duration_seconds'] ?: 0;
    $transcript = $call['transcript'] ? json_decode($call['transcript'], true) : [];
    
    $outcomeMap = [
        'completed' => 'completed',
        'busy' => 'no_answer',
        'no-answer' => 'no_answer',
        'failed' => 'other',
        'canceled' => 'other',
    ];
    $outcome = $outcomeMap[$call['status']] ?? 'completed';
    if ($call['status'] === 'completed' && empty($transcript)) {
        $outcome = $duration < 10 ? 'no_answer' : 'completed';
    }
    
    $stmt = $db->prepare("
        INSERT INTO call_logs (user_id, lead_id, lead_name, lead_phone, agent_id, duration_seconds, outcome, transcript)
        VALUES (?, ?, ?, ?, 'twilio', ?, ?, ?)
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
        VALUES (?, ?, ?, ?, 'twilio', ?, ?, ?, ?, NOW())
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
