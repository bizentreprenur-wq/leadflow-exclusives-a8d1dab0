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

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Authenticate user
$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = $user['id'];
$action = $_GET['action'] ?? '';

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
    $pdo = getDbConnection();
    
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
    
    // Get user's phone number from calling config
    $stmt = $pdo->prepare("SELECT phone_number FROM calling_config WHERE user_id = ? AND provisioned = 1");
    $stmt->execute([$userId]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config || empty($config['phone_number'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No phone number provisioned. Please set up AI Calling first.']);
        return;
    }
    
    // TODO: Integrate with calling.io SMS API
    // For now, store the message and simulate sending
    
    $messageId = uniqid('sms_');
    
    // Store the message
    $stmt = $pdo->prepare("
        INSERT INTO sms_messages (id, user_id, lead_id, lead_phone, lead_name, business_name, direction, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'outbound', ?, 'sent', NOW())
    ");
    $stmt->execute([$messageId, $userId, $leadId, $leadPhone, $leadName, $businessName, $message]);
    
    echo json_encode([
        'success' => true,
        'message_id' => $messageId
    ]);
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
 * Sanitize input
 */
function sanitize_input($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}
