<?php
/**
 * SMS API Endpoint
 * Handles bi-directional SMS messaging for Autopilot tier
 * 
 * Actions:
 * - send: Send an SMS to a lead
 * - conversations: Get SMS conversations
 * - messages: Get messages for a conversation
 * - ai_reply: Get AI-generated reply suggestion
 * - mark_read: Mark messages as read
 * - stats: Get SMS statistics
 * - templates: Get SMS templates
 * - schedule: Schedule an SMS for later
 * - enable_auto: Enable autonomous SMS for leads
 */

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? '';
$db = getDB();

// Public webhook endpoint (no auth required)
if ($action === 'webhook') {
    handleSMSWebhook($db);
    exit();
}

// Authenticate user
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = $user['id'];

// Check if user has Autopilot plan (required for SMS)
function checkAutopilotAccess($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT s.plan FROM subscriptions s 
        WHERE s.user_id = ? AND s.status = 'active' 
        ORDER BY s.created_at DESC LIMIT 1
    ");
    $stmt->execute([$userId]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $subscription && strtolower($subscription['plan']) === 'autopilot';
}

try {
    $pdo = $db;
    // Verify Autopilot access for all SMS actions
    if (!checkAutopilotAccess($pdo, $userId)) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'error' => 'SMS messaging requires Autopilot plan ($249/mo)',
            'upgrade_required' => true
        ]);
        exit;
    }
    
    switch ($action) {
        case 'send':
            handleSendSMS($pdo, $userId);
            break;
            
        case 'conversations':
            handleGetConversations($pdo, $userId);
            break;
            
        case 'messages':
            handleGetMessages($pdo, $userId);
            break;
            
        case 'ai_reply':
            handleAIReply($pdo, $userId);
            break;
            
        case 'mark_read':
            handleMarkRead($pdo, $userId);
            break;
            
        case 'stats':
            handleGetStats($pdo, $userId);
            break;
            
        case 'templates':
            handleGetTemplates($pdo, $userId);
            break;
            
        case 'schedule':
            handleScheduleSMS($pdo, $userId);
            break;
            
        case 'enable_auto':
            handleEnableAutoSMS($pdo, $userId);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    error_log("SMS API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

/**
 * Send an SMS message
 */
function handleSendSMS($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $leadPhone = sanitize_input($input['lead_phone'] ?? '');
    $message = sanitize_input($input['message'] ?? '');
    $leadId = $input['lead_id'] ?? null;
    $leadName = sanitize_input($input['lead_name'] ?? '');
    $businessName = sanitize_input($input['business_name'] ?? '');
    
    if (empty($leadPhone) || empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Phone number and message are required']);
        return;
    }
    
    // Get user's Telnyx config (phone number + API key)
    $stmt = $pdo->prepare("SELECT api_key, phone_number FROM telnyx_config WHERE user_id = ? AND enabled = 1");
    $stmt->execute([$userId]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || empty($config['phone_number']) || empty($config['api_key'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No Telnyx phone number configured. Please set up AI Calling first.']);
        return;
    }
    
    // Send SMS via Telnyx Messaging API
    $ch = curl_init('https://api.telnyx.com/v2/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'from' => $config['phone_number'],
            'to' => $leadPhone,
            'text' => $message,
            'type' => 'SMS',
            'webhook_url' => (defined('FRONTEND_URL') ? FRONTEND_URL : 'https://bamlead.com') . '/api/sms.php?action=webhook',
            'webhook_failover_url' => (defined('FRONTEND_URL') ? FRONTEND_URL : 'https://bamlead.com') . '/api/sms.php?action=webhook'
        ]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['api_key'],
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $responseData = json_decode($response, true);
    
    if ($httpCode === 200 || $httpCode === 201 || $httpCode === 202) {
        $externalId = $responseData['data']['id'] ?? uniqid('sms_');
        
        // Store the message
        $stmt = $pdo->prepare("
            INSERT INTO sms_messages (id, user_id, lead_id, lead_phone, lead_name, business_name, direction, message, status, external_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'outbound', ?, 'sent', ?, NOW())
        ");
        $stmt->execute([uniqid('sms_'), $userId, $leadId, $leadPhone, $leadName, $businessName, $message, $externalId]);
        
        echo json_encode([
            'success' => true,
            'message_id' => $externalId
        ]);
    } else {
        $errorMsg = $responseData['errors'][0]['detail'] ?? 'Failed to send SMS';
        error_log("Telnyx SMS send failed ($httpCode): $response");
        echo json_encode([
            'success' => false,
            'error' => $errorMsg
        ]);
    }
}

/**
 * Get SMS conversations
 */
function handleGetConversations($pdo, $userId) {
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    
    // Get unique conversations grouped by lead
    $stmt = $pdo->prepare("
        SELECT 
            lead_id,
            lead_phone,
            MAX(lead_name) as lead_name,
            MAX(business_name) as business_name,
            MAX(message) as last_message,
            MAX(created_at) as last_message_at,
            SUM(CASE WHEN direction = 'inbound' AND `read` = 0 THEN 1 ELSE 0 END) as unread_count,
            COUNT(*) as message_count
        FROM sms_messages 
        WHERE user_id = ?
        GROUP BY lead_id, lead_phone
        ORDER BY last_message_at DESC
        LIMIT ?
    ");
    $stmt->execute([$userId, $limit]);
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add sentiment analysis (simplified)
    foreach ($conversations as &$conv) {
        $conv['sentiment'] = analyzeSentiment($conv['last_message']);
        $conv['messages'] = []; // Will be loaded separately
    }
    
    echo json_encode([
        'success' => true,
        'conversations' => $conversations
    ]);
}

/**
 * Get messages for a conversation
 */
function handleGetMessages($pdo, $userId) {
    $leadId = $_GET['lead_id'] ?? null;
    
    if (!$leadId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Lead ID required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT id, lead_id, lead_phone, lead_name, direction, message, status, created_at, `read`
        FROM sms_messages 
        WHERE user_id = ? AND lead_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$userId, $leadId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Generate AI suggested reply based on last message
    $aiReply = null;
    if (!empty($messages)) {
        $lastMessage = end($messages);
        if ($lastMessage['direction'] === 'inbound') {
            $aiReply = generateAISuggestion($lastMessage['message'], $lastMessage['lead_name'] ?? '');
        }
    }
    
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'ai_suggested_reply' => $aiReply
    ]);
}

/**
 * Get AI-generated reply suggestion
 */
function handleAIReply($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $leadId = $input['lead_id'] ?? null;
    $context = $input['context'] ?? [];
    
    // Get last messages for context
    $stmt = $pdo->prepare("
        SELECT message, direction FROM sms_messages 
        WHERE user_id = ? AND lead_id = ?
        ORDER BY created_at DESC LIMIT 5
    ");
    $stmt->execute([$userId, $leadId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $lastMessage = $messages[0]['message'] ?? '';
    $leadName = $context['lead_name'] ?? '';
    
    $suggestion = generateAISuggestion($lastMessage, $leadName, $context);
    
    echo json_encode([
        'success' => true,
        'suggested_reply' => $suggestion,
        'tone' => 'professional'
    ]);
}

/**
 * Mark messages as read
 */
function handleMarkRead($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $leadId = $input['lead_id'] ?? null;
    
    $stmt = $pdo->prepare("
        UPDATE sms_messages 
        SET `read` = 1 
        WHERE user_id = ? AND lead_id = ? AND direction = 'inbound'
    ");
    $stmt->execute([$userId, $leadId]);
    
    echo json_encode(['success' => true]);
}

/**
 * Get SMS statistics
 */
function handleGetStats($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT 
            SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as total_sent,
            SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as total_received,
            COUNT(DISTINCT CASE WHEN direction = 'inbound' THEN lead_id END) as unique_responders,
            COUNT(DISTINCT lead_id) as total_leads
        FROM sms_messages 
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $responseRate = $stats['total_sent'] > 0 
        ? round(($stats['total_received'] / $stats['total_sent']) * 100, 1) 
        : 0;
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_sent' => (int)$stats['total_sent'],
            'total_received' => (int)$stats['total_received'],
            'response_rate' => $responseRate,
            'avg_response_time_minutes' => 45, // Placeholder
            'positive_responses' => (int)($stats['total_received'] * 0.6), // Estimate
            'appointments_booked' => (int)($stats['total_received'] * 0.2) // Estimate
        ]
    ]);
}

/**
 * Get SMS templates
 */
function handleGetTemplates($pdo, $userId) {
    // Return default templates (could be customized per user in future)
    $templates = [
        [
            'id' => 'follow_up_1',
            'name' => 'Post-Call Follow Up',
            'category' => 'follow_up',
            'message' => 'Hi {name}, great speaking with you! As discussed, I wanted to share more info about how we can help {business}. When works best for a quick follow-up call?',
            'variables' => ['name', 'business']
        ],
        [
            'id' => 'appointment_1',
            'name' => 'Appointment Reminder',
            'category' => 'appointment',
            'message' => 'Hi {name}, just a friendly reminder about our call scheduled for {date} at {time}. Looking forward to speaking with you!',
            'variables' => ['name', 'date', 'time']
        ],
        [
            'id' => 'thank_you_1',
            'name' => 'Thank You',
            'category' => 'thank_you',
            'message' => "Thanks for your time today, {name}! I'll send over the proposal we discussed. Feel free to text me if you have any questions.",
            'variables' => ['name']
        ],
        [
            'id' => 'intro_1',
            'name' => 'Introduction',
            'category' => 'intro',
            'message' => 'Hi {name}, this is {sender} from {company}. I noticed {business} and wanted to share how we\'ve helped similar businesses grow. Got a quick minute to chat?',
            'variables' => ['name', 'sender', 'company', 'business']
        ],
        [
            'id' => 'missed_call_1',
            'name' => 'Missed Call Follow Up',
            'category' => 'follow_up',
            'message' => 'Hi {name}, I tried reaching you earlier regarding {topic}. Would love to connect when you have a moment. What time works best?',
            'variables' => ['name', 'topic']
        ]
    ];
    
    echo json_encode([
        'success' => true,
        'templates' => $templates
    ]);
}

/**
 * Schedule an SMS for later
 */
function handleScheduleSMS($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $leadPhone = sanitize_input($input['lead_phone'] ?? '');
    $message = sanitize_input($input['message'] ?? '');
    $scheduledFor = sanitize_input($input['scheduled_for'] ?? '');
    $leadId = $input['lead_id'] ?? null;
    
    if (empty($leadPhone) || empty($message) || empty($scheduledFor)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Phone, message, and scheduled_for are required']);
        return;
    }
    
    $scheduledId = uniqid('sched_');
    
    // Store scheduled SMS
    $stmt = $pdo->prepare("
        INSERT INTO sms_scheduled (id, user_id, lead_id, lead_phone, message, scheduled_for, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");
    $stmt->execute([$scheduledId, $userId, $leadId, $leadPhone, $message, $scheduledFor]);
    
    echo json_encode([
        'success' => true,
        'scheduled_id' => $scheduledId
    ]);
}

/**
 * Enable autonomous SMS for leads
 */
function handleEnableAutoSMS($pdo, $userId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $leadIds = $input['lead_ids'] ?? [];
    
    if (empty($leadIds)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Lead IDs required']);
        return;
    }
    
    $enabledCount = 0;
    foreach ($leadIds as $leadId) {
        // Mark lead for autonomous SMS handling
        $stmt = $pdo->prepare("
            INSERT INTO sms_auto_enabled (user_id, lead_id, enabled_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE enabled_at = NOW()
        ");
        $stmt->execute([$userId, $leadId]);
        $enabledCount++;
    }
    
    echo json_encode([
        'success' => true,
        'enabled_count' => $enabledCount
    ]);
}

/**
 * Analyze sentiment of a message
 */
function analyzeSentiment($message) {
    $message = strtolower($message);
    
    $positiveWords = ['interested', 'yes', 'great', 'love', 'perfect', 'sounds good', 'let\'s do it', 'schedule', 'available'];
    $negativeWords = ['no', 'not interested', 'stop', 'unsubscribe', 'remove', 'busy', 'don\'t'];
    
    foreach ($positiveWords as $word) {
        if (strpos($message, $word) !== false) {
            return 'interested';
        }
    }
    
    foreach ($negativeWords as $word) {
        if (strpos($message, $word) !== false) {
            return 'negative';
        }
    }
    
    return 'neutral';
}

/**
 * Generate AI suggestion for reply
 */
function generateAISuggestion($lastMessage, $leadName, $context = []) {
    $name = explode(' ', $leadName)[0] ?: 'there';
    $message = strtolower($lastMessage);
    
    if (strpos($message, 'interested') !== false || strpos($message, 'yes') !== false) {
        return "Great to hear from you, {$name}! I'd love to schedule a quick call to discuss how we can help. What time works best for you this week?";
    }
    
    if (strpos($message, 'busy') !== false || strpos($message, 'later') !== false) {
        return "No problem at all, {$name}! I'll follow up next week. Feel free to reach out if anything comes up. 👍";
    }
    
    if (strpos($message, 'price') !== false || strpos($message, 'cost') !== false || strpos($message, 'how much') !== false) {
        return "Great question, {$name}! Our pricing is customized based on your specific needs. Can we hop on a quick 10-minute call so I can understand your situation better and give you an accurate quote?";
    }
    
    if (strpos($message, '?') !== false) {
        return "Thanks for your question, {$name}! Let me get you the info you need. Would it be easier to jump on a quick call, or should I send over some details via text?";
    }
    
    return "Hi {$name}, following up on our conversation. When would be a good time to connect this week?";
}

/**
 * Handle inbound SMS webhook from Telnyx
 */
function handleSMSWebhook($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['data'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid webhook payload']);
        return;
    }
    
    $eventType = $input['data']['event_type'] ?? '';
    $payload = $input['data']['payload'] ?? [];
    
    error_log("Telnyx SMS webhook: $eventType - " . json_encode($payload));
    
    switch ($eventType) {
        case 'message.received':
            // Inbound SMS from a lead
            $fromNumber = $payload['from']['phone_number'] ?? '';
            $toNumber = $payload['to'][0]['phone_number'] ?? '';
            $messageText = $payload['text'] ?? '';
            $externalId = $payload['id'] ?? uniqid('sms_in_');
            
            if (empty($fromNumber) || empty($messageText)) break;
            
            // Find the user who owns this Telnyx number
            $stmt = $db->prepare("SELECT user_id FROM telnyx_config WHERE phone_number = ?");
            $stmt->execute([$toNumber]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$config) {
                error_log("SMS webhook: No user found for number $toNumber");
                break;
            }
            
            $userId = $config['user_id'];
            
            // Try to find the lead by phone number
            $stmt = $db->prepare("
                SELECT lead_id, lead_name FROM sms_messages 
                WHERE user_id = ? AND lead_phone = ? 
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$userId, $fromNumber]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $leadId = $existing['lead_id'] ?? null;
            $leadName = $existing['lead_name'] ?? '';
            
            // Store inbound message
            $stmt = $db->prepare("
                INSERT INTO sms_messages (id, user_id, lead_id, lead_phone, lead_name, direction, message, status, external_id, `read`, created_at)
                VALUES (?, ?, ?, ?, ?, 'inbound', ?, 'received', ?, 0, NOW())
            ");
            $stmt->execute([uniqid('sms_'), $userId, $leadId, $fromNumber, $leadName, $messageText, $externalId]);
            
            // Check if auto-SMS is enabled for this lead
            if ($leadId) {
                $stmt = $db->prepare("SELECT id FROM sms_auto_enabled WHERE user_id = ? AND lead_id = ?");
                $stmt->execute([$userId, $leadId]);
                if ($stmt->fetch()) {
                    // Auto-reply with AI suggestion
                    $aiReply = generateAISuggestion($messageText, $leadName);
                    
                    // Get API key to send reply
                    $stmt = $db->prepare("SELECT api_key, phone_number FROM telnyx_config WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    $telnyxConfig = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($telnyxConfig && $telnyxConfig['api_key']) {
                        // Send auto-reply via Telnyx
                        $ch = curl_init('https://api.telnyx.com/v2/messages');
                        curl_setopt_array($ch, [
                            CURLOPT_RETURNTRANSFER => true,
                            CURLOPT_POST => true,
                            CURLOPT_POSTFIELDS => json_encode([
                                'from' => $telnyxConfig['phone_number'],
                                'to' => $fromNumber,
                                'text' => $aiReply,
                                'type' => 'SMS'
                            ]),
                            CURLOPT_HTTPHEADER => [
                                'Authorization: Bearer ' . $telnyxConfig['api_key'],
                                'Content-Type: application/json'
                            ],
                            CURLOPT_TIMEOUT => 15
                        ]);
                        
                        $response = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);
                        
                        if ($httpCode === 200 || $httpCode === 201 || $httpCode === 202) {
                            $responseData = json_decode($response, true);
                            $replyId = $responseData['data']['id'] ?? uniqid('sms_auto_');
                            
                            $stmt = $db->prepare("
                                INSERT INTO sms_messages (id, user_id, lead_id, lead_phone, lead_name, direction, message, status, external_id, created_at)
                                VALUES (?, ?, ?, ?, ?, 'outbound', ?, 'sent', ?, NOW())
                            ");
                            $stmt->execute([uniqid('sms_'), $userId, $leadId, $fromNumber, $leadName, $aiReply, $replyId]);
                        }
                    }
                }
            }
            break;
            
        case 'message.sent':
        case 'message.delivered':
            // Update delivery status
            $externalId = $payload['id'] ?? '';
            $status = ($eventType === 'message.delivered') ? 'delivered' : 'sent';
            if ($externalId) {
                $stmt = $db->prepare("UPDATE sms_messages SET status = ?, delivered_at = NOW() WHERE external_id = ?");
                $stmt->execute([$status, $externalId]);
            }
            break;
            
        case 'message.failed':
            $externalId = $payload['id'] ?? '';
            if ($externalId) {
                $stmt = $db->prepare("UPDATE sms_messages SET status = 'failed' WHERE external_id = ?");
                $stmt->execute([$externalId]);
            }
            break;
    }
    
    echo json_encode(['success' => true]);
}
