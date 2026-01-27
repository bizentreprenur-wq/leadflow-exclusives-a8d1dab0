<?php
/**
 * Email Reply Webhook Handler
 * Detects incoming replies, classifies sentiment/intent, and pauses sequences
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/database.php';

// Handle CORS
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? 'process';

switch ($action) {
    case 'process':
        handleIncomingReply();
        break;
    case 'get-replies':
        handleGetReplies();
        break;
    case 'update-status':
        handleUpdateStatus();
        break;
    case 'pause-sequence':
        handlePauseSequence();
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Process incoming email reply (webhook from email provider)
 */
function handleIncomingReply() {
    // Accept both POST and webhook data
    $input = getJsonInput();
    
    // Parse reply data (format varies by provider)
    $replyData = parseReplyData($input);
    
    if (!$replyData) {
        sendError('Invalid reply data');
    }
    
    // Classify the reply
    $classification = classifyReply($replyData['body'], $replyData['subject']);
    
    // Store the reply
    $db = getDB();
    
    try {
        // Find the original send/campaign
        $originalSend = $db->fetchOne(
            "SELECT es.*, ec.user_id, ec.id as campaign_id 
             FROM email_sends es 
             LEFT JOIN email_campaigns ec ON es.campaign_id = ec.id 
             WHERE es.recipient_email = ? 
             ORDER BY es.sent_at DESC LIMIT 1",
            [$replyData['from_email']]
        );
        
        $userId = $originalSend ? $originalSend['user_id'] : null;
        $campaignId = $originalSend ? $originalSend['campaign_id'] : null;
        
        // Insert the reply
        $db->insert(
            "INSERT INTO email_replies (
                user_id, campaign_id, original_send_id,
                from_email, from_name, subject, body_preview,
                sentiment, intent, urgency_level,
                received_at, is_read, requires_action
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, ?)",
            [
                $userId,
                $campaignId,
                $originalSend ? $originalSend['id'] : null,
                $replyData['from_email'],
                $replyData['from_name'] ?? '',
                $replyData['subject'] ?? '',
                substr($replyData['body'] ?? '', 0, 500),
                $classification['sentiment'],
                $classification['intent'],
                $classification['urgency'],
                $classification['requires_action'] ? 1 : 0,
            ]
        );
        
        $replyId = $db->lastInsertId();
        
        // If positive or scheduling intent, pause the sequence
        if (in_array($classification['intent'], ['interested', 'scheduling', 'question']) 
            || $classification['sentiment'] === 'positive') {
            
            pauseSequenceForLead($db, $replyData['from_email'], $campaignId);
        }
        
        // Auto-pause if it's an unsubscribe request
        if ($classification['intent'] === 'unsubscribe') {
            markLeadAsUnsubscribed($db, $replyData['from_email'], $userId);
        }
        
        sendJson([
            'success' => true,
            'reply_id' => $replyId,
            'classification' => $classification,
            'sequence_paused' => in_array($classification['intent'], ['interested', 'scheduling', 'question']),
        ]);
        
    } catch (Exception $e) {
        error_log("Reply processing failed: " . $e->getMessage());
        sendError('Failed to process reply', 500);
    }
}

/**
 * Get replies for authenticated user
 */
function handleGetReplies() {
    $user = requireAuth();
    $db = getDB();
    
    $filter = $_GET['filter'] ?? 'all'; // all, unread, action_required
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $since = $_GET['since'] ?? null;
    
    $whereClause = "WHERE user_id = ?";
    $params = [$user['id']];
    
    if ($filter === 'unread') {
        $whereClause .= " AND is_read = 0";
    } else if ($filter === 'action_required') {
        $whereClause .= " AND requires_action = 1";
    }
    
    if ($since) {
        $whereClause .= " AND received_at > ?";
        $params[] = $since;
    }
    
    $replies = $db->fetchAll(
        "SELECT * FROM email_replies 
         $whereClause 
         ORDER BY received_at DESC 
         LIMIT ?",
        array_merge($params, [$limit])
    );
    
    // Get counts
    $counts = $db->fetchOne(
        "SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
            SUM(CASE WHEN requires_action = 1 THEN 1 ELSE 0 END) as action_required,
            SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
            SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative
         FROM email_replies 
         WHERE user_id = ?",
        [$user['id']]
    );
    
    sendJson([
        'success' => true,
        'replies' => $replies,
        'counts' => $counts,
        'timestamp' => date('c'),
    ]);
}

/**
 * Update reply status (read, action taken, etc.)
 */
function handleUpdateStatus() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    $input = getJsonInput();
    $db = getDB();
    
    $replyId = (int)($input['reply_id'] ?? 0);
    $isRead = isset($input['is_read']) ? (int)$input['is_read'] : null;
    $requiresAction = isset($input['requires_action']) ? (int)$input['requires_action'] : null;
    
    if (!$replyId) {
        sendError('Reply ID required');
    }
    
    // Verify ownership
    $reply = $db->fetchOne(
        "SELECT id FROM email_replies WHERE id = ? AND user_id = ?",
        [$replyId, $user['id']]
    );
    
    if (!$reply) {
        sendError('Reply not found', 404);
    }
    
    $updates = [];
    $params = [];
    
    if ($isRead !== null) {
        $updates[] = "is_read = ?";
        $params[] = $isRead;
    }
    
    if ($requiresAction !== null) {
        $updates[] = "requires_action = ?";
        $params[] = $requiresAction;
    }
    
    if (empty($updates)) {
        sendError('No updates provided');
    }
    
    $params[] = $replyId;
    
    $db->update(
        "UPDATE email_replies SET " . implode(', ', $updates) . " WHERE id = ?",
        $params
    );
    
    sendJson(['success' => true]);
}

/**
 * Manually pause sequence for a lead
 */
function handlePauseSequence() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    $input = getJsonInput();
    $db = getDB();
    
    $email = sanitizeInput($input['email'] ?? '', 255);
    $campaignId = (int)($input['campaign_id'] ?? 0);
    
    if (!$email) {
        sendError('Email required');
    }
    
    pauseSequenceForLead($db, $email, $campaignId ?: null);
    
    sendJson([
        'success' => true,
        'message' => "Sequence paused for $email",
    ]);
}

/**
 * Parse reply data from various email providers
 */
function parseReplyData($input) {
    // SendGrid inbound parse format
    if (isset($input['from']) && isset($input['text'])) {
        return [
            'from_email' => extractEmail($input['from']),
            'from_name' => extractName($input['from']),
            'subject' => $input['subject'] ?? '',
            'body' => $input['text'] ?? $input['html'] ?? '',
        ];
    }
    
    // Mailgun format
    if (isset($input['sender']) && isset($input['body-plain'])) {
        return [
            'from_email' => $input['sender'],
            'from_name' => $input['from'] ?? '',
            'subject' => $input['subject'] ?? '',
            'body' => $input['body-plain'] ?? $input['body-html'] ?? '',
        ];
    }
    
    // Generic/manual format
    if (isset($input['from_email'])) {
        return $input;
    }
    
    return null;
}

/**
 * AI-powered reply classification
 */
function classifyReply($body, $subject = '') {
    $text = strtolower($subject . ' ' . $body);
    
    // Sentiment detection
    $positiveSignals = ['interested', 'yes', 'sounds great', 'let\'s talk', 'tell me more', 
                        'schedule', 'meet', 'call', 'love', 'perfect', 'awesome', 'great'];
    $negativeSignals = ['not interested', 'no thanks', 'unsubscribe', 'remove', 'stop', 
                        'don\'t contact', 'spam', 'not for us', 'pass', 'decline'];
    
    $positiveCount = 0;
    $negativeCount = 0;
    
    foreach ($positiveSignals as $signal) {
        if (strpos($text, $signal) !== false) $positiveCount++;
    }
    foreach ($negativeSignals as $signal) {
        if (strpos($text, $signal) !== false) $negativeCount++;
    }
    
    $sentiment = 'neutral';
    if ($positiveCount > $negativeCount) $sentiment = 'positive';
    if ($negativeCount > $positiveCount) $sentiment = 'negative';
    
    // Intent detection
    $intent = 'general';
    
    if (preg_match('/schedule|meeting|call|chat|zoom|calendar|available|time/i', $text)) {
        $intent = 'scheduling';
    } else if (preg_match('/interested|tell me more|learn more|curious|want to/i', $text)) {
        $intent = 'interested';
    } else if (preg_match('/question|how|what|why|explain|clarify/i', $text)) {
        $intent = 'question';
    } else if (preg_match('/price|cost|budget|afford|expensive|cheap/i', $text)) {
        $intent = 'pricing';
    } else if (preg_match('/not now|later|busy|timing|next quarter|next year/i', $text)) {
        $intent = 'timing';
    } else if (preg_match('/already have|competitor|using|alternative/i', $text)) {
        $intent = 'objection';
    } else if (preg_match('/unsubscribe|remove|stop|opt.?out/i', $text)) {
        $intent = 'unsubscribe';
    }
    
    // Urgency level
    $urgency = 'cold';
    if ($intent === 'scheduling' || ($intent === 'interested' && $sentiment === 'positive')) {
        $urgency = 'hot';
    } else if ($intent === 'question' || $intent === 'pricing') {
        $urgency = 'warm';
    }
    
    return [
        'sentiment' => $sentiment,
        'intent' => $intent,
        'urgency' => $urgency,
        'requires_action' => $urgency === 'hot' || $intent === 'question',
        'confidence' => min(100, 60 + ($positiveCount + $negativeCount) * 10),
    ];
}

/**
 * Pause drip sequence for a lead
 */
function pauseSequenceForLead($db, $email, $campaignId = null) {
    $where = "recipient_email = ? AND status IN ('pending', 'scheduled')";
    $params = [$email];
    
    if ($campaignId) {
        $where .= " AND campaign_id = ?";
        $params[] = $campaignId;
    }
    
    $db->update(
        "UPDATE email_sends SET status = 'paused', paused_at = NOW() WHERE $where",
        $params
    );
    
    // Log the pause
    error_log("Sequence paused for $email" . ($campaignId ? " (campaign $campaignId)" : ""));
}

/**
 * Mark lead as unsubscribed
 */
function markLeadAsUnsubscribed($db, $email, $userId) {
    // Add to unsubscribe list
    $db->insert(
        "INSERT IGNORE INTO email_unsubscribes (user_id, email, unsubscribed_at, reason) 
         VALUES (?, ?, NOW(), 'reply_request')",
        [$userId, $email]
    );
    
    // Cancel all pending sends
    $db->update(
        "UPDATE email_sends SET status = 'cancelled', cancelled_at = NOW() 
         WHERE recipient_email = ? AND status IN ('pending', 'scheduled')",
        [$email]
    );
}

/**
 * Extract email from "Name <email>" format
 */
function extractEmail($from) {
    if (preg_match('/<([^>]+)>/', $from, $matches)) {
        return $matches[1];
    }
    return trim($from);
}

/**
 * Extract name from "Name <email>" format
 */
function extractName($from) {
    if (preg_match('/^([^<]+)</', $from, $matches)) {
        return trim($matches[1]);
    }
    return '';
}
