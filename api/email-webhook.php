<?php
/**
 * Email Delivery Webhook Endpoint
 * Receives delivery notifications from email providers (SendGrid, Mailgun, Amazon SES, etc.)
 * 
 * Webhook URLs to configure in your email provider:
 * - SendGrid: https://bamlead.com/api/email-webhook.php?provider=sendgrid
 * - Mailgun: https://bamlead.com/api/email-webhook.php?provider=mailgun
 * - Amazon SES: https://bamlead.com/api/email-webhook.php?provider=ses
 */

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config.php';

// Set headers
header('Content-Type: application/json');
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$provider = $_GET['provider'] ?? 'generic';
$action = $_GET['action'] ?? 'webhook';
$db = getDB();

try {
    switch ($action) {
        case 'webhook':
            handleWebhook($db, $provider);
            break;
            
        case 'events':
            // Authenticated endpoint to get recent events for polling
            require_once __DIR__ . '/includes/auth.php';
            $user = authenticateRequest();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Unauthorized']);
                exit();
            }
            handleGetEvents($db, $user);
            break;
            
        case 'stats':
            // Authenticated endpoint to get delivery stats
            require_once __DIR__ . '/includes/auth.php';
            $user = authenticateRequest();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Unauthorized']);
                exit();
            }
            handleGetStats($db, $user);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Email webhook error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

/**
 * Handle incoming webhook from email provider
 */
function handleWebhook($db, $provider) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $rawPayload = file_get_contents('php://input');
    $payload = json_decode($rawPayload, true);
    
    if (!$payload) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
        return;
    }
    
    // Verify webhook signature based on provider
    if (!verifyWebhookSignature($provider, $rawPayload)) {
        error_log("Webhook signature verification failed for provider: $provider");
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid signature']);
        return;
    }
    
    // Parse events based on provider format
    $events = parseWebhookEvents($provider, $payload);
    
    $processed = 0;
    foreach ($events as $event) {
        if (processWebhookEvent($db, $event, $provider, $rawPayload)) {
            $processed++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Processed $processed events",
        'processed' => $processed
    ]);
}

/**
 * Verify webhook signature based on provider
 */
function verifyWebhookSignature($provider, $rawPayload) {
    switch ($provider) {
        case 'sendgrid':
            // SendGrid uses Signed Event Webhook with public key verification
            $signature = $_SERVER['HTTP_X_TWILIO_EMAIL_EVENT_WEBHOOK_SIGNATURE'] ?? '';
            $timestamp = $_SERVER['HTTP_X_TWILIO_EMAIL_EVENT_WEBHOOK_TIMESTAMP'] ?? '';
            
            if (!defined('SENDGRID_WEBHOOK_KEY') || empty(SENDGRID_WEBHOOK_KEY)) {
                // No key configured, allow for testing
                return true;
            }
            
            // Verify signature
            $signedPayload = $timestamp . $rawPayload;
            $expectedSignature = base64_encode(hash_hmac('sha256', $signedPayload, SENDGRID_WEBHOOK_KEY, true));
            return hash_equals($expectedSignature, $signature);
            
        case 'mailgun':
            // Mailgun uses HMAC-SHA256
            $signature = $_POST['signature'] ?? [];
            $timestamp = $signature['timestamp'] ?? '';
            $token = $signature['token'] ?? '';
            $sig = $signature['signature'] ?? '';
            
            if (!defined('MAILGUN_WEBHOOK_KEY') || empty(MAILGUN_WEBHOOK_KEY)) {
                return true;
            }
            
            $expectedSignature = hash_hmac('sha256', $timestamp . $token, MAILGUN_WEBHOOK_KEY);
            return hash_equals($expectedSignature, $sig);
            
        case 'ses':
            // Amazon SES uses SNS message signing
            // For simplicity, we'll trust requests from AWS IP ranges
            // In production, verify the SNS message signature
            return true;
            
        default:
            // Generic/testing - no verification
            return true;
    }
}

/**
 * Parse webhook events based on provider format
 */
function parseWebhookEvents($provider, $payload) {
    $events = [];
    
    switch ($provider) {
        case 'sendgrid':
            // SendGrid sends array of events
            foreach ($payload as $event) {
                $trackingId = extractTrackingId($event['email'] ?? '', $event);
                $events[] = [
                    'tracking_id' => $trackingId,
                    'event_type' => mapEventType($provider, $event['event'] ?? ''),
                    'recipient_email' => $event['email'] ?? '',
                    'timestamp' => date('Y-m-d H:i:s', $event['timestamp'] ?? time()),
                    'ip_address' => $event['ip'] ?? null,
                    'user_agent' => $event['useragent'] ?? null,
                    'click_url' => $event['url'] ?? null,
                    'bounce_type' => $event['bounce_classification'] ?? null,
                    'bounce_reason' => $event['reason'] ?? null,
                ];
            }
            break;
            
        case 'mailgun':
            // Mailgun sends event-data object
            $eventData = $payload['event-data'] ?? $payload;
            $trackingId = extractTrackingId($eventData['recipient'] ?? '', $eventData);
            $events[] = [
                'tracking_id' => $trackingId,
                'event_type' => mapEventType($provider, $eventData['event'] ?? ''),
                'recipient_email' => $eventData['recipient'] ?? '',
                'timestamp' => date('Y-m-d H:i:s', $eventData['timestamp'] ?? time()),
                'ip_address' => $eventData['ip'] ?? null,
                'user_agent' => $eventData['client-info']['user-agent'] ?? null,
                'click_url' => $eventData['url'] ?? null,
                'bounce_type' => $eventData['severity'] ?? null,
                'bounce_reason' => $eventData['delivery-status']['message'] ?? null,
            ];
            break;
            
        case 'ses':
            // Amazon SES via SNS
            $message = json_decode($payload['Message'] ?? '{}', true) ?: $payload;
            $notificationType = $message['notificationType'] ?? $message['eventType'] ?? '';
            $mail = $message['mail'] ?? [];
            $recipients = $mail['destination'] ?? [];
            
            foreach ($recipients as $recipient) {
                $trackingId = extractTrackingId($recipient, $message);
                $events[] = [
                    'tracking_id' => $trackingId,
                    'event_type' => mapEventType($provider, $notificationType),
                    'recipient_email' => $recipient,
                    'timestamp' => date('Y-m-d H:i:s', strtotime($mail['timestamp'] ?? 'now')),
                    'ip_address' => null,
                    'user_agent' => null,
                    'click_url' => null,
                    'bounce_type' => $message['bounce']['bounceType'] ?? null,
                    'bounce_reason' => $message['bounce']['bounceSubType'] ?? null,
                ];
            }
            break;
            
        default:
            // Generic format
            $trackingId = $payload['tracking_id'] ?? $payload['tid'] ?? '';
            $events[] = [
                'tracking_id' => $trackingId,
                'event_type' => mapEventType($provider, $payload['event'] ?? $payload['type'] ?? ''),
                'recipient_email' => $payload['email'] ?? $payload['recipient'] ?? '',
                'timestamp' => date('Y-m-d H:i:s', $payload['timestamp'] ?? time()),
                'ip_address' => $payload['ip'] ?? null,
                'user_agent' => $payload['user_agent'] ?? null,
                'click_url' => $payload['url'] ?? null,
                'bounce_type' => $payload['bounce_type'] ?? null,
                'bounce_reason' => $payload['bounce_reason'] ?? null,
            ];
    }
    
    return $events;
}

/**
 * Extract tracking ID from email or payload
 */
function extractTrackingId($email, $payload) {
    // Check for tracking_id in various locations
    if (!empty($payload['tracking_id'])) {
        return $payload['tracking_id'];
    }
    
    // Check custom headers
    $headers = $payload['headers'] ?? $payload['message-headers'] ?? [];
    foreach ($headers as $header) {
        if (is_array($header) && strtolower($header[0] ?? '') === 'x-tracking-id') {
            return $header[1] ?? '';
        }
    }
    
    // Check URL parameters for click events
    if (!empty($payload['url'])) {
        parse_str(parse_url($payload['url'], PHP_URL_QUERY) ?? '', $params);
        if (!empty($params['tid'])) {
            return $params['tid'];
        }
    }
    
    return '';
}

/**
 * Map provider-specific event types to our standard types
 */
function mapEventType($provider, $eventType) {
    $eventType = strtolower($eventType);
    
    $mapping = [
        // SendGrid events
        'delivered' => 'delivered',
        'open' => 'opened',
        'click' => 'clicked',
        'bounce' => 'bounced',
        'dropped' => 'dropped',
        'spamreport' => 'spam_report',
        'unsubscribe' => 'unsubscribe',
        'deferred' => 'deferred',
        
        // Mailgun events
        'accepted' => 'delivered',
        'opened' => 'opened',
        'clicked' => 'clicked',
        'failed' => 'bounced',
        'rejected' => 'dropped',
        'complained' => 'spam_report',
        'unsubscribed' => 'unsubscribe',
        
        // SES events
        'delivery' => 'delivered',
        'send' => 'delivered',
        'complaint' => 'spam_report',
    ];
    
    return $mapping[$eventType] ?? 'delivered';
}

/**
 * Process a single webhook event
 */
function processWebhookEvent($db, $event, $provider, $rawPayload) {
    if (empty($event['tracking_id']) && empty($event['recipient_email'])) {
        error_log("Webhook event missing tracking_id and recipient_email");
        return false;
    }
    
    // Find the email send record
    $emailSend = null;
    
    if (!empty($event['tracking_id'])) {
        $emailSend = $db->fetchOne(
            "SELECT id, user_id, campaign_id, status FROM email_sends WHERE tracking_id = ?",
            [$event['tracking_id']]
        );
    }
    
    if (!$emailSend && !empty($event['recipient_email'])) {
        // Fallback: find by recipient email (most recent)
        $emailSend = $db->fetchOne(
            "SELECT id, user_id, campaign_id, status FROM email_sends 
             WHERE recipient_email = ? AND sent_at IS NOT NULL 
             ORDER BY sent_at DESC LIMIT 1",
            [$event['recipient_email']]
        );
    }
    
    // Store the webhook event
    $db->insert(
        "INSERT INTO email_webhook_events 
         (tracking_id, email_send_id, event_type, provider, recipient_email, timestamp, ip_address, user_agent, click_url, bounce_type, bounce_reason, raw_payload, processed) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $event['tracking_id'] ?? '',
            $emailSend['id'] ?? null,
            $event['event_type'],
            $provider,
            $event['recipient_email'] ?? '',
            $event['timestamp'],
            $event['ip_address'],
            $event['user_agent'],
            $event['click_url'],
            $event['bounce_type'],
            $event['bounce_reason'],
            $rawPayload,
            true
        ]
    );
    
    if (!$emailSend) {
        error_log("No matching email_send found for tracking_id: " . ($event['tracking_id'] ?? 'none'));
        return true; // Still store the event
    }
    
    // Update email_sends status based on event type
    $newStatus = mapEventToStatus($event['event_type'], $emailSend['status']);
    $updateFields = ["status = ?", "webhook_notified = TRUE", "delivery_provider = ?"];
    $updateValues = [$newStatus, $provider];
    
    // Add timestamp fields based on event type
    switch ($event['event_type']) {
        case 'delivered':
            // Don't have a delivered_at column, but could add one
            break;
        case 'opened':
            $updateFields[] = "opened_at = COALESCE(opened_at, ?)";
            $updateValues[] = $event['timestamp'];
            break;
        case 'clicked':
            $updateFields[] = "clicked_at = COALESCE(clicked_at, ?)";
            $updateValues[] = $event['timestamp'];
            break;
        case 'bounced':
        case 'dropped':
            $updateFields[] = "bounced_at = ?";
            $updateFields[] = "error_message = ?";
            $updateValues[] = $event['timestamp'];
            $updateValues[] = $event['bounce_reason'] ?? 'Bounced';
            break;
    }
    
    $updateValues[] = $emailSend['id'];
    
    $db->update(
        "UPDATE email_sends SET " . implode(', ', $updateFields) . " WHERE id = ?",
        $updateValues
    );
    
    // Update campaign stats if applicable
    if ($emailSend['campaign_id']) {
        updateCampaignStats($db, $emailSend['campaign_id'], $event['event_type']);
    }
    
    return true;
}

/**
 * Map event type to email_sends status
 */
function mapEventToStatus($eventType, $currentStatus) {
    // Status hierarchy: pending < sent < delivered < opened < clicked
    // Bounced/failed are terminal states
    $statusHierarchy = [
        'pending' => 0,
        'sent' => 1,
        'delivered' => 2,
        'opened' => 3,
        'clicked' => 4,
        'replied' => 5,
        'bounced' => -1,
        'failed' => -1,
    ];
    
    $eventToStatus = [
        'delivered' => 'delivered',
        'opened' => 'opened',
        'clicked' => 'clicked',
        'bounced' => 'bounced',
        'dropped' => 'failed',
        'spam_report' => 'bounced',
        'unsubscribe' => 'bounced',
        'deferred' => 'sent', // Still attempting delivery
    ];
    
    $newStatus = $eventToStatus[$eventType] ?? $currentStatus;
    
    // Only upgrade status (don't downgrade from opened to delivered, etc.)
    $currentLevel = $statusHierarchy[$currentStatus] ?? 0;
    $newLevel = $statusHierarchy[$newStatus] ?? 0;
    
    if ($newLevel < 0) {
        // Terminal states (bounced/failed) always apply
        return $newStatus;
    }
    
    return $newLevel > $currentLevel ? $newStatus : $currentStatus;
}

/**
 * Update campaign statistics
 */
function updateCampaignStats($db, $campaignId, $eventType) {
    $columnMap = [
        'opened' => 'opened_count',
        'clicked' => 'clicked_count',
        'bounced' => 'bounced_count',
        'spam_report' => 'bounced_count',
    ];
    
    $column = $columnMap[$eventType] ?? null;
    if ($column) {
        $db->update(
            "UPDATE email_campaigns SET $column = $column + 1 WHERE id = ?",
            [$campaignId]
        );
    }
}

/**
 * Get recent webhook events for polling (authenticated)
 */
function handleGetEvents($db, $user) {
    $since = $_GET['since'] ?? date('Y-m-d H:i:s', strtotime('-5 minutes'));
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    
    $events = $db->fetchAll(
        "SELECT 
            e.id,
            e.event_type,
            e.recipient_email,
            e.timestamp,
            e.click_url,
            e.bounce_reason,
            es.business_name,
            es.subject
         FROM email_webhook_events e
         JOIN email_sends es ON e.email_send_id = es.id
         WHERE es.user_id = ? AND e.created_at >= ?
         ORDER BY e.created_at DESC
         LIMIT ?",
        [$user['id'], $since, $limit]
    );
    
    echo json_encode([
        'success' => true,
        'events' => $events ?: [],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Get delivery statistics (authenticated)
 */
function handleGetStats($db, $user) {
    $period = (int)($_GET['period'] ?? 7); // Days
    $startDate = date('Y-m-d', strtotime("-$period days"));
    
    // Overall stats
    $stats = $db->fetchOne(
        "SELECT 
            COUNT(*) as total_sent,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
            SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
            SUM(CASE WHEN status = 'bounced' OR status = 'failed' THEN 1 ELSE 0 END) as bounced,
            ROUND(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as delivery_rate,
            ROUND(SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN status != 'pending' THEN 1 ELSE 0 END), 0), 2) as open_rate,
            ROUND(SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END), 0), 2) as click_rate
         FROM email_sends
         WHERE user_id = ? AND sent_at >= ?",
        [$user['id'], $startDate]
    );
    
    // Daily breakdown
    $daily = $db->fetchAll(
        "SELECT 
            DATE(sent_at) as date,
            COUNT(*) as sent,
            SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
            SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked
         FROM email_sends
         WHERE user_id = ? AND sent_at >= ?
         GROUP BY DATE(sent_at)
         ORDER BY date DESC",
        [$user['id'], $startDate]
    );
    
    // Recent events
    $recentEvents = $db->fetchAll(
        "SELECT 
            e.event_type,
            e.recipient_email,
            e.timestamp,
            es.business_name
         FROM email_webhook_events e
         JOIN email_sends es ON e.email_send_id = es.id
         WHERE es.user_id = ?
         ORDER BY e.created_at DESC
         LIMIT 10",
        [$user['id']]
    );
    
    echo json_encode([
        'success' => true,
        'stats' => $stats ?: [],
        'daily' => $daily ?: [],
        'recent_events' => $recentEvents ?: []
    ]);
}
