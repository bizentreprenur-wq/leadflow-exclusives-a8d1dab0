<?php
/**
 * Voice Calling API Endpoint
 * Handles AI voice agent configuration, call initiation, and real-time conversation
 * 
 * Uses Twilio for outbound voice calls, inbound webhooks, and follow-up scheduling
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
if ($action === 'webhook' || $action === 'voice_webhook' || $action === 'status_callback') {
    handleTwilioWebhook($db, $action);
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
        case 'get_followups':
            handleGetFollowups($db, $user);
            break;
        case 'schedule_followup':
            handleScheduleFollowup($db, $user);
            break;
        case 'cancel_followup':
            handleCancelFollowup($db, $user);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Voice Calling API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ─── Twilio helpers ──────────────────────────────────────────────────────────

function twilioRequest($method, $url, $data = []) {
    $sid  = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    $token = defined('TWILIO_AUTH_TOKEN') ? TWILIO_AUTH_TOKEN : '';
    if (!$sid || !$token) return ['error' => 'Twilio not configured', 'simulated' => true];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => "$sid:$token",
        CURLOPT_TIMEOUT => 30,
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($response, true);
    $decoded['_http_code'] = $httpCode;
    return $decoded;
}

function twilioBaseUrl() {
    $sid = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    return "https://api.twilio.com/2010-04-01/Accounts/$sid";
}

// ─── Config ──────────────────────────────────────────────────────────────────

function handleGetConfig($db, $user) {
    $stmt = $db->prepare("SELECT * FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($config) {
        echo json_encode([
            'success' => true,
            'config' => [
                'agent_id'          => $config['agent_id'] ?? '',
                'phone_number'      => $config['phone_number'] ?? '',
                'voice_id'          => $config['voice_id'] ?? 'Polly.Joanna',
                'language'          => $config['language'] ?? 'en-US',
                'greeting_message'  => $config['greeting_message'] ?? '',
                'system_prompt'     => $config['system_prompt'] ?? '',
                'enabled'           => (bool)$config['enabled'],
                'provisioned'       => (bool)$config['provisioned'],
                'addon_active'      => (bool)$config['addon_active']
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'config' => null]);
    }
}

function handleSaveConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $stmt = $db->prepare("
            UPDATE calling_config SET agent_id=?, voice_id=?, language=?, greeting_message=?, system_prompt=?, enabled=?, updated_at=NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $input['agent_id'] ?? '',
            $input['voice_id'] ?? 'Polly.Joanna',
            $input['language'] ?? 'en-US',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0,
            $user['id']
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO calling_config (user_id, agent_id, voice_id, language, greeting_message, system_prompt, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $input['agent_id'] ?? '',
            $input['voice_id'] ?? 'Polly.Joanna',
            $input['language'] ?? 'en-US',
            $input['greeting_message'] ?? '',
            $input['system_prompt'] ?? '',
            $input['enabled'] ? 1 : 0
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Configuration saved']);
}

// ─── Provisioning (Twilio) ───────────────────────────────────────────────────

function handleProvisionNumber($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $countryCode = $input['country_code'] ?? 'US';
    $areaCode    = $input['area_code'] ?? '';

    // Already has a number?
    $stmt = $db->prepare("SELECT phone_number FROM calling_config WHERE user_id = ? AND phone_number IS NOT NULL AND phone_number != ''");
    $stmt->execute([$user['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($existing && $existing['phone_number']) {
        echo json_encode(['success' => false, 'error' => 'You already have a phone number: ' . $existing['phone_number']]);
        return;
    }

    // Check subscription / add-on
    $stmt = $db->prepare("SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$user['id']]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
    $isAutopilot = $subscription && $subscription['plan'] === 'autopilot';

    if (!$isAutopilot) {
        $stmt = $db->prepare("SELECT addon_active FROM calling_config WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $cfg = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cfg || !$cfg['addon_active']) {
            echo json_encode(['success' => false, 'error' => 'AI Calling add-on ($8/mo) required']);
            return;
        }
    }

    $sid = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    $token = defined('TWILIO_AUTH_TOKEN') ? TWILIO_AUTH_TOKEN : '';

    if (!$sid || !$token) {
        // Simulate for development
        $phoneNumber = '+1' . rand(200,999) . rand(100,999) . rand(1000,9999);
        upsertCallingConfig($db, $user['id'], $phoneNumber, $isAutopilot);
        echo json_encode(['success' => true, 'phone_number' => $phoneNumber, 'message' => 'Phone number provisioned (simulated)']);
        return;
    }

    // Search available numbers via Twilio
    $searchUrl = twilioBaseUrl() . "/AvailablePhoneNumbers/$countryCode/Local.json?VoiceEnabled=true&SmsEnabled=true&Limit=1";
    if ($areaCode) $searchUrl .= "&AreaCode=$areaCode";

    $available = twilioRequest('GET', $searchUrl);
    $numbers = $available['available_phone_numbers'] ?? [];

    if (empty($numbers)) {
        echo json_encode(['success' => false, 'error' => 'No phone numbers available for the requested area']);
        return;
    }

    // Purchase the number
    $buyUrl = twilioBaseUrl() . "/IncomingPhoneNumbers.json";
    $result = twilioRequest('POST', $buyUrl, [
        'PhoneNumber' => $numbers[0]['phone_number'],
        'VoiceUrl'    => FRONTEND_URL . '/api/calling.php?action=voice_webhook',
        'SmsUrl'      => FRONTEND_URL . '/api/sms.php?action=webhook',
        'StatusCallback' => FRONTEND_URL . '/api/calling.php?action=status_callback',
    ]);

    if (isset($result['sid'])) {
        $phoneNumber = $result['phone_number'];
        upsertCallingConfig($db, $user['id'], $phoneNumber, $isAutopilot, $result['sid']);
        echo json_encode(['success' => true, 'phone_number' => $phoneNumber, 'message' => 'Phone number provisioned successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => $result['message'] ?? 'Failed to provision number']);
    }
}

function upsertCallingConfig($db, $userId, $phoneNumber, $isAutopilot, $phoneNumberSid = null) {
    $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
    $stmt->execute([$userId]);
    if ($stmt->fetch()) {
        $stmt = $db->prepare("UPDATE calling_config SET phone_number=?, provisioned=1, updated_at=NOW() WHERE user_id=?");
        $stmt->execute([$phoneNumber, $userId]);
    } else {
        $stmt = $db->prepare("INSERT INTO calling_config (user_id, phone_number, provisioned, addon_active) VALUES (?, ?, 1, ?)");
        $stmt->execute([$userId, $phoneNumber, $isAutopilot ? 1 : 0]);
    }

    // Store in twilio_config as well
    $stmt = $db->prepare("INSERT INTO twilio_config (user_id, phone_number, phone_number_sid, enabled, provisioned, provision_status)
        VALUES (?, ?, ?, 1, 1, 'active')
        ON DUPLICATE KEY UPDATE phone_number=VALUES(phone_number), phone_number_sid=VALUES(phone_number_sid), enabled=1, provisioned=1, provision_status='active'");
    $stmt->execute([$userId, $phoneNumber, $phoneNumberSid]);
}

// ─── Call initiation (Twilio) ────────────────────────────────────────────────

function handleStartSession($db, $user) {
    // For Twilio we don't need a persistent session — calls are per-request
    echo json_encode([
        'success' => true,
        'session' => [
            'token'      => bin2hex(random_bytes(32)),
            'agent_id'   => 'twilio-agent',
            'expires_at' => time() + 3600
        ]
    ]);
}

function handleEndSession($db, $user) {
    echo json_encode(['success' => true, 'message' => 'Session ended']);
}

function handleInitiateCall($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $destinationNumber = $input['destination_number'] ?? '';
    $leadData = $input['lead'] ?? [];

    if (!$destinationNumber) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Destination number required']);
        return;
    }

    $stmt = $db->prepare("SELECT * FROM calling_config WHERE user_id = ? AND enabled = 1");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$config) {
        echo json_encode(['success' => false, 'error' => 'AI Calling not configured or disabled']);
        return;
    }

    $sid = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    $token = defined('TWILIO_AUTH_TOKEN') ? TWILIO_AUTH_TOKEN : '';

    if (!$sid || !$token) {
        // Simulated call
        $callSid = 'CA' . bin2hex(random_bytes(16));
        $stmt = $db->prepare("INSERT INTO call_logs (user_id, lead_id, lead_name, lead_phone, agent_id, outcome, notes, created_at) VALUES (?,?,?,?,?,'initiated',?,NOW())");
        $stmt->execute([$user['id'], $leadData['id']??null, $leadData['name']??null, $destinationNumber, 'twilio-agent', json_encode(['call_sid'=>$callSid])]);
        $callLogId = $db->lastInsertId();

        // Insert into twilio_active_calls
        $stmt = $db->prepare("INSERT INTO twilio_active_calls (user_id, call_sid, destination_number, lead_id, lead_name, status) VALUES (?,?,?,?,?,'initiated')");
        $stmt->execute([$user['id'], $callSid, $destinationNumber, $leadData['id']??null, $leadData['name']??null]);

        echo json_encode(['success' => true, 'call' => ['id' => $callSid, 'call_log_id' => $callLogId, 'status' => 'initiating'], 'simulated' => true]);
        return;
    }

    // Real Twilio call
    $greeting = $config['greeting_message'] ?: 'Hello, this is BamLead calling. How can I help you today?';
    $callUrl = twilioBaseUrl() . "/Calls.json";
    $result = twilioRequest('POST', $callUrl, [
        'To'   => $destinationNumber,
        'From' => $config['phone_number'],
        'Twiml' => '<Response><Say voice="' . htmlspecialchars($config['voice_id'] ?: 'Polly.Joanna') . '">' . htmlspecialchars($greeting) . '</Say><Pause length="60"/></Response>',
        'StatusCallback'       => FRONTEND_URL . '/api/calling.php?action=status_callback&user_id=' . $user['id'],
        'StatusCallbackEvent'  => 'initiated ringing answered completed',
        'StatusCallbackMethod' => 'POST',
    ]);

    if (isset($result['sid'])) {
        $callSid = $result['sid'];

        $stmt = $db->prepare("INSERT INTO call_logs (user_id, lead_id, lead_name, lead_phone, agent_id, outcome, notes, created_at) VALUES (?,?,?,?,?,'initiated',?,NOW())");
        $stmt->execute([$user['id'], $leadData['id']??null, $leadData['name']??null, $destinationNumber, 'twilio-agent', json_encode(['call_sid'=>$callSid])]);
        $callLogId = $db->lastInsertId();

        $stmt = $db->prepare("INSERT INTO twilio_active_calls (user_id, call_sid, destination_number, lead_id, lead_name, status) VALUES (?,?,?,?,?,'initiated')");
        $stmt->execute([$user['id'], $callSid, $destinationNumber, $leadData['id']??null, $leadData['name']??null]);

        echo json_encode(['success' => true, 'call' => ['id' => $callSid, 'call_log_id' => $callLogId, 'status' => $result['status'] ?? 'queued']]);
    } else {
        echo json_encode(['success' => false, 'error' => $result['message'] ?? 'Failed to initiate call']);
    }
}

function handleHangupCall($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $callSid = $input['call_id'] ?? $input['call_sid'] ?? '';

    $sid = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    if ($sid && $callSid) {
        twilioRequest('POST', twilioBaseUrl() . "/Calls/$callSid.json", ['Status' => 'completed']);
    }

    // Mark active call as ended
    $stmt = $db->prepare("UPDATE twilio_active_calls SET status='completed', ended_at=NOW() WHERE call_sid=? AND user_id=?");
    $stmt->execute([$callSid, $user['id']]);

    echo json_encode(['success' => true, 'message' => 'Call ended']);
}

function handleCallStatus($db, $user) {
    $callSid = $_GET['call_id'] ?? $_GET['call_sid'] ?? '';

    $sid = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    if (!$sid || !$callSid) {
        echo json_encode(['success' => true, 'status' => 'connected', 'duration_seconds' => rand(10,120), 'simulated' => true]);
        return;
    }

    $result = twilioRequest('GET', twilioBaseUrl() . "/Calls/$callSid.json");
    echo json_encode([
        'success' => true,
        'status'           => $result['status'] ?? 'unknown',
        'duration_seconds' => intval($result['duration'] ?? 0)
    ]);
}

// ─── Call logs ───────────────────────────────────────────────────────────────

function handleSaveCallLog($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare("INSERT INTO call_logs (user_id, lead_id, lead_name, lead_phone, agent_id, duration_seconds, outcome, notes, transcript, created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())");
    $stmt->execute([
        $user['id'],
        $input['lead_id'] ?? null,
        $input['lead_name'] ?? null,
        $input['lead_phone'] ?? null,
        $input['agent_id'] ?? 'twilio-agent',
        $input['duration_seconds'] ?? 0,
        $input['outcome'] ?? 'completed',
        $input['notes'] ?? null,
        isset($input['transcript']) ? json_encode($input['transcript']) : null
    ]);

    $callLogId = $db->lastInsertId();

    // ── Auto-schedule follow-up on missed-call outcomes ──
    $outcome = $input['outcome'] ?? 'completed';
    if (in_array($outcome, ['no_answer', 'callback_requested'])) {
        autoScheduleFollowup($db, $user['id'], $input, $outcome, $callLogId);
    }

    echo json_encode(['success' => true, 'call_log_id' => $callLogId]);
}

function handleGetCallLogs($db, $user) {
    $limit  = min(intval($_GET['limit'] ?? 50), 100);
    $offset = max(intval($_GET['offset'] ?? 0), 0);

    $stmt = $db->prepare("SELECT id, lead_id, lead_name, lead_phone, agent_id, duration_seconds, outcome, notes, created_at FROM call_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute([$user['id'], $limit, $offset]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $db->prepare("SELECT COUNT(*) FROM call_logs WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $total = $stmt->fetchColumn();

    echo json_encode(['success' => true, 'logs' => $logs, 'total' => intval($total), 'limit' => $limit, 'offset' => $offset]);
}

// ─── Add-on checks ───────────────────────────────────────────────────────────

function handleCheckAddon($db, $user) {
    $stmt = $db->prepare("SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$user['id']]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
    $isAutopilot = $subscription && $subscription['plan'] === 'autopilot';

    if ($isAutopilot) {
        echo json_encode(['success' => true, 'has_addon' => true, 'included_with_plan' => true, 'plan' => 'autopilot']);
        return;
    }

    $stmt = $db->prepare("SELECT addon_active FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'has_addon' => $config && $config['addon_active'], 'included_with_plan' => false, 'plan' => $subscription['plan'] ?? 'free', 'addon_price' => 8.00]);
}

function handlePurchaseAddon($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $stmt = $db->prepare("SELECT id FROM calling_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    if ($stmt->fetch()) {
        $stmt = $db->prepare("UPDATE calling_config SET addon_active = 1, updated_at = NOW() WHERE user_id = ?");
        $stmt->execute([$user['id']]);
    } else {
        $stmt = $db->prepare("INSERT INTO calling_config (user_id, addon_active) VALUES (?, 1)");
        $stmt->execute([$user['id']]);
    }

    echo json_encode(['success' => true, 'message' => 'AI Calling add-on activated', 'addon_active' => true]);
}

// ─── Follow-up scheduling ────────────────────────────────────────────────────

/**
 * Auto-schedule a follow-up callback + SMS after a missed call
 */
function autoScheduleFollowup($db, $userId, $input, $outcome, $callLogId) {
    $leadPhone = $input['lead_phone'] ?? '';
    $leadName  = $input['lead_name'] ?? 'Lead';
    $leadId    = $input['lead_id'] ?? null;

    if (!$leadPhone) return;

    // Schedule callback in 2 hours
    $callbackAt = date('Y-m-d H:i:s', strtotime('+2 hours'));
    $stmt = $db->prepare("INSERT INTO call_followups (user_id, lead_id, lead_name, lead_phone, call_log_id, followup_type, scheduled_for, status, notes) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $userId, $leadId, $leadName, $leadPhone, $callLogId,
        'callback', $callbackAt, 'pending',
        $outcome === 'no_answer' ? 'Auto-scheduled: no answer on first attempt' : 'Auto-scheduled: callback was requested'
    ]);

    // Schedule SMS follow-up in 15 minutes
    $smsAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
    $smsMessage = $outcome === 'no_answer'
        ? "Hi $leadName, we tried reaching you just now. Would you like to schedule a quick call? Reply YES to confirm."
        : "Hi $leadName, thanks for your interest! We'll call you back shortly. Reply with a preferred time if you'd like.";

    $stmt = $db->prepare("INSERT INTO call_followups (user_id, lead_id, lead_name, lead_phone, call_log_id, followup_type, scheduled_for, status, notes, sms_message) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $userId, $leadId, $leadName, $leadPhone, $callLogId,
        'sms', $smsAt, 'pending',
        'Auto-scheduled SMS follow-up after ' . $outcome,
        $smsMessage
    ]);
}

function handleGetFollowups($db, $user) {
    $status = $_GET['status'] ?? 'pending';
    $limit  = min(intval($_GET['limit'] ?? 50), 200);

    $stmt = $db->prepare("SELECT * FROM call_followups WHERE user_id = ? AND status = ? ORDER BY scheduled_for ASC LIMIT ?");
    $stmt->execute([$user['id'], $status, $limit]);
    $followups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'followups' => $followups]);
}

function handleScheduleFollowup($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $stmt = $db->prepare("INSERT INTO call_followups (user_id, lead_id, lead_name, lead_phone, call_log_id, followup_type, scheduled_for, status, notes, sms_message) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $user['id'],
        $input['lead_id'] ?? null,
        $input['lead_name'] ?? null,
        $input['lead_phone'] ?? '',
        $input['call_log_id'] ?? null,
        $input['followup_type'] ?? 'callback',
        $input['scheduled_for'] ?? date('Y-m-d H:i:s', strtotime('+1 hour')),
        'pending',
        $input['notes'] ?? null,
        $input['sms_message'] ?? null
    ]);

    echo json_encode(['success' => true, 'followup_id' => $db->lastInsertId()]);
}

function handleCancelFollowup($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $followupId = $input['followup_id'] ?? 0;

    $stmt = $db->prepare("UPDATE call_followups SET status = 'cancelled' WHERE id = ? AND user_id = ?");
    $stmt->execute([$followupId, $user['id']]);

    echo json_encode(['success' => true, 'message' => 'Follow-up cancelled']);
}

// ─── Twilio Webhooks ─────────────────────────────────────────────────────────

function handleTwilioWebhook($db, $action) {
    if ($action === 'voice_webhook') {
        // Return TwiML for inbound calls
        header('Content-Type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<Response>';
        echo '<Say voice="Polly.Joanna">Hello, this is BamLead. Please hold for further instructions.</Say>';
        echo '<Pause length="60"/>';
        echo '</Response>';
        return;
    }

    if ($action === 'status_callback') {
        // Twilio status callback — update call state
        $callSid  = $_POST['CallSid'] ?? '';
        $status   = $_POST['CallStatus'] ?? '';
        $duration = intval($_POST['CallDuration'] ?? 0);
        $userId   = $_GET['user_id'] ?? null;

        error_log("Twilio status callback: $status for $callSid (user $userId)");

        if ($callSid) {
            // Map Twilio status
            $dbStatus = $status; // initiated, ringing, in-progress, completed, busy, no-answer, failed, canceled
            $stmt = $db->prepare("UPDATE twilio_active_calls SET status=?, duration_seconds=?, ended_at=IF(?='completed' OR ?='failed' OR ?='busy' OR ?='no-answer' OR ?='canceled', NOW(), ended_at) WHERE call_sid=?");
            $stmt->execute([$dbStatus, $duration, $status, $status, $status, $status, $status, $callSid]);

            // Update call_logs outcome for terminal statuses
            if (in_array($status, ['completed', 'busy', 'no-answer', 'failed', 'canceled'])) {
                $outcomeMap = [
                    'completed'  => 'completed',
                    'busy'       => 'no_answer',
                    'no-answer'  => 'no_answer',
                    'failed'     => 'other',
                    'canceled'   => 'other',
                ];
                $outcome = $outcomeMap[$status] ?? 'other';

                $stmt = $db->prepare("UPDATE call_logs SET duration_seconds=?, outcome=CASE WHEN outcome='initiated' THEN ? ELSE outcome END WHERE notes LIKE ? AND user_id=?");
                $stmt->execute([$duration, $outcome, '%'.$callSid.'%', $userId]);

                // Auto-schedule follow-up for missed calls
                if (in_array($status, ['busy', 'no-answer']) && $userId) {
                    $stmt = $db->prepare("SELECT lead_id, lead_name, lead_phone FROM twilio_active_calls WHERE call_sid=?");
                    $stmt->execute([$callSid]);
                    $call = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($call) {
                        $stmt2 = $db->prepare("SELECT id FROM call_logs WHERE notes LIKE ? AND user_id=? ORDER BY id DESC LIMIT 1");
                        $stmt2->execute(['%'.$callSid.'%', $userId]);
                        $logRow = $stmt2->fetch(PDO::FETCH_ASSOC);
                        autoScheduleFollowup($db, $userId, [
                            'lead_id'    => $call['lead_id'],
                            'lead_name'  => $call['lead_name'],
                            'lead_phone' => $call['destination_number'] ?? $call['lead_phone'] ?? '',
                        ], 'no_answer', $logRow ? $logRow['id'] : null);
                    }
                }
            }
        }

        echo json_encode(['success' => true]);
        return;
    }

    // Generic webhook
    echo json_encode(['success' => true]);
}
