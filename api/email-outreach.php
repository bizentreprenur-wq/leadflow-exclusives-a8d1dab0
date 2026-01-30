<?php
/**
 * Email Outreach API Endpoint
 * Handles email templates, campaigns, and sending
 */

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/email.php';
require_once __DIR__ . '/config.php';

require_once __DIR__ . '/includes/functions.php';

// Set proper headers
header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? '';

// Allow SMTP test endpoints without authentication (user provides their own credentials)
$publicActions = ['test_smtp', 'send_test'];
$user = null;

if (!in_array($action, $publicActions)) {
    // Authenticate user for protected endpoints
    $user = authenticateRequest();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
}

$db = getDB();

try {
    switch ($action) {
        // ===== TEMPLATE ENDPOINTS =====
        case 'templates':
            handleTemplates($db, $user);
            break;
            
        case 'template':
            handleTemplate($db, $user);
            break;
            
        // ===== CAMPAIGN ENDPOINTS =====
        case 'campaigns':
            handleCampaigns($db, $user);
            break;
            
        case 'campaign':
            handleCampaign($db, $user);
            break;
            
        // ===== SEND ENDPOINTS =====
        case 'send':
            handleSendEmail($db, $user);
            break;
            
        case 'send-bulk':
            handleSendBulk($db, $user);
            break;
            
        case 'sends':
            handleSends($db, $user);
            break;
            
        // ===== TRACKING ENDPOINTS =====
        // Note: These are rate-limited but not authenticated to allow email client tracking
        case 'track-open':
            rateLimitTracking();
            handleTrackOpen($db);
            break;
            
        case 'track-click':
            rateLimitTracking();
            handleTrackClick($db);
            break;
            
        case 'stats':
            handleStats($db, $user);
            break;
            
        // ===== SCHEDULED EMAILS =====
        case 'scheduled':
            handleScheduledEmails($db, $user);
            break;
            
        case 'cancel-scheduled':
            handleCancelScheduled($db, $user);
            break;
            
        case 'process-scheduled':
            // Require IP whitelist + cron secret key for processing scheduled emails
            if (!isAllowedCronIP()) {
                error_log("Process-scheduled denied - IP not whitelisted: " . getClientIP());
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Forbidden - IP not allowed']);
                exit();
            }
            
            // Only accept header-based authentication (URL parameter removed for security)
            $cronKey = $_SERVER['HTTP_X_CRON_SECRET'] ?? '';
            if (!defined('CRON_SECRET_KEY') || empty($cronKey) || !hash_equals(CRON_SECRET_KEY, $cronKey)) {
                error_log("Process-scheduled denied - invalid key from IP: " . getClientIP());
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Forbidden']);
                exit();
            }
            handleProcessScheduled($db);
            break;
            
        // ===== SMTP TEST ENDPOINTS =====
        case 'test_smtp':
            handleTestSMTP($db, $user);
            break;
            
        case 'send_test':
            handleSendTestEmail($db, $user);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Email outreach error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

// ===== TEMPLATE HANDLERS =====

function handleTemplates($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all templates for user
        $templates = $db->fetchAll(
            "SELECT * FROM email_templates WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
            [$user['id']]
        );
        echo json_encode(['success' => true, 'templates' => $templates ?: []]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

function handleTemplate($db, $user) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Template ID required']);
            return;
        }
        
        $template = $db->fetchOne(
            "SELECT * FROM email_templates WHERE id = ? AND user_id = ?",
            [$id, $user['id']]
        );
        
        if (!$template) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Template not found']);
            return;
        }
        
        echo json_encode(['success' => true, 'template' => $template]);
        
    } elseif ($method === 'POST') {
        // Create new template
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name']) || empty($data['subject']) || empty($data['body_html'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name, subject, and body are required']);
            return;
        }
        
        $id = $db->insert(
            "INSERT INTO email_templates (user_id, name, subject, body_html, body_text, is_default) VALUES (?, ?, ?, ?, ?, ?)",
            [
                $user['id'],
                $data['name'],
                $data['subject'],
                $data['body_html'],
                $data['body_text'] ?? strip_tags($data['body_html']),
                $data['is_default'] ?? false
            ]
        );
        
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Template created']);
        
    } elseif ($method === 'PUT') {
        // Update template
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Template ID required']);
            return;
        }
        
        // Verify ownership
        $template = $db->fetchOne(
            "SELECT id FROM email_templates WHERE id = ? AND user_id = ?",
            [$id, $user['id']]
        );
        
        if (!$template) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Template not found']);
            return;
        }
        
        $db->update(
            "UPDATE email_templates SET name = ?, subject = ?, body_html = ?, body_text = ?, is_default = ? WHERE id = ?",
            [
                $data['name'],
                $data['subject'],
                $data['body_html'],
                $data['body_text'] ?? strip_tags($data['body_html']),
                $data['is_default'] ?? false,
                $id
            ]
        );
        
        echo json_encode(['success' => true, 'message' => 'Template updated']);
        
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Template ID required']);
            return;
        }
        
        $db->delete(
            "DELETE FROM email_templates WHERE id = ? AND user_id = ?",
            [$id, $user['id']]
        );
        
        echo json_encode(['success' => true, 'message' => 'Template deleted']);
    }
}

// ===== CAMPAIGN HANDLERS =====

function handleCampaigns($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $campaigns = $db->fetchAll(
            "SELECT c.*, t.name as template_name 
             FROM email_campaigns c 
             LEFT JOIN email_templates t ON c.template_id = t.id 
             WHERE c.user_id = ? 
             ORDER BY c.created_at DESC",
            [$user['id']]
        );
        echo json_encode(['success' => true, 'campaigns' => $campaigns ?: []]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

function handleCampaign($db, $user) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name']) || empty($data['template_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name and template_id required']);
            return;
        }
        
        $id = $db->insert(
            "INSERT INTO email_campaigns (user_id, name, template_id, status, scheduled_at) VALUES (?, ?, ?, ?, ?)",
            [
                $user['id'],
                $data['name'],
                $data['template_id'],
                $data['status'] ?? 'draft',
                $data['scheduled_at'] ?? null
            ]
        );
        
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Campaign created']);
    }
}

// ===== SEND HANDLERS =====

function handleSendEmail($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['to']) || empty($data['subject']) || empty($data['body_html'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'to, subject, and body_html are required']);
        return;
    }
    
    // Generate tracking ID
    $trackingId = bin2hex(random_bytes(32));
    
    // Personalize the email
    $subject = personalizeContent($data['subject'], $data['personalization'] ?? []);
    $bodyHtml = personalizeContent($data['body_html'], $data['personalization'] ?? []);
    
    // Add tracking pixel if enabled
    if ($data['track_opens'] ?? true) {
        $trackingPixel = '<img src="' . FRONTEND_URL . '/api/email-outreach.php?action=track-open&tid=' . $trackingId . '" width="1" height="1" style="display:none" />';
        $bodyHtml = str_replace('</body>', $trackingPixel . '</body>', $bodyHtml);
    }
    
    // Record the send
    $sendId = $db->insert(
        "INSERT INTO email_sends (user_id, lead_id, template_id, campaign_id, recipient_email, recipient_name, business_name, subject, body_html, tracking_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
        [
            $user['id'],
            $data['lead_id'] ?? null,
            $data['template_id'] ?? null,
            $data['campaign_id'] ?? null,
            $data['to'],
            $data['recipient_name'] ?? null,
            $data['business_name'] ?? null,
            $subject,
            $bodyHtml,
            $trackingId
        ]
    );
    
    // Send the email (prefer per-request SMTP settings if provided)
    $textBody = $data['body_text'] ?? strip_tags($bodyHtml);
    $smtpOverride = isset($data['smtp_override']) && is_array($data['smtp_override']) ? $data['smtp_override'] : null;
    $sent = $smtpOverride
        ? sendEmailWithCustomSMTP($data['to'], $subject, $bodyHtml, $textBody, $smtpOverride)
        : sendEmail($data['to'], $subject, $bodyHtml, $textBody);
    
    if ($sent) {
        $db->update(
            "UPDATE email_sends SET status = 'sent', sent_at = NOW() WHERE id = ?",
            [$sendId]
        );
        
        // Update campaign stats if applicable
        if (!empty($data['campaign_id'])) {
            $db->update(
                "UPDATE email_campaigns SET sent_count = sent_count + 1 WHERE id = ?",
                [$data['campaign_id']]
            );
        }
        
        echo json_encode(['success' => true, 'message' => 'Email sent', 'send_id' => $sendId, 'tracking_id' => $trackingId]);
    } else {
        $db->update(
            "UPDATE email_sends SET status = 'failed', error_message = 'SMTP error' WHERE id = ?",
            [$sendId]
        );
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to send email']);
    }
}

function handleSendBulk($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Support both template_id and custom subject/body
    $hasTemplate = !empty($data['template_id']);
    $hasCustomContent = !empty($data['custom_subject']) && !empty($data['custom_body']);
    
    if (empty($data['leads']) || (!$hasTemplate && !$hasCustomContent)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'leads and either template_id or custom_subject/custom_body are required']);
        return;
    }
    
    // Get the template if provided
    $template = null;
    if ($hasTemplate) {
        $template = $db->fetchOne(
            "SELECT * FROM email_templates WHERE id = ? AND user_id = ?",
            [$data['template_id'], $user['id']]
        );
        
        if (!$template) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Template not found']);
            return;
        }
    }
    
    // Use custom content or template
    $emailSubject = $data['custom_subject'] ?? ($template['subject'] ?? '');
    $emailBodyHtml = $data['custom_body'] ?? ($template['body_html'] ?? '');
    $emailBodyText = $template['body_text'] ?? strip_tags($emailBodyHtml);
    
    // Get send mode and drip config
    $sendMode = $data['send_mode'] ?? 'instant';
    $dripConfig = $data['drip_config'] ?? null;
    $scheduledFor = $data['scheduled_for'] ?? null;
    
    $results = [
        'total' => count($data['leads']),
        'sent' => 0,
        'failed' => 0,
        'skipped' => 0,
        'scheduled' => 0,
        'details' => []
    ];
    
    // For drip sending, we queue emails with scheduled times
    $emailsPerHour = $dripConfig['emailsPerHour'] ?? 20;
    $delayMinutes = $dripConfig['delayMinutes'] ?? 3;
    
    // Rate limiting - max 100 emails per request for drip, 50 for instant
    $maxPerRequest = ($sendMode === 'drip' || $sendMode === 'scheduled') ? 100 : 50;
    $leads = array_slice($data['leads'], 0, $maxPerRequest);
    
    $currentTime = new DateTime();
    $emailIndex = 0;
    
    foreach ($leads as $lead) {
        if (empty($lead['email'])) {
            $results['skipped']++;
            $results['details'][] = ['business' => $lead['business_name'] ?? 'Unknown', 'status' => 'skipped', 'reason' => 'No email'];
            continue;
        }
        
        // Prepare personalization data
        $personalization = [
            'business_name' => $lead['business_name'] ?? '',
            'first_name' => extractFirstName($lead['contact_name'] ?? $lead['business_name'] ?? ''),
            'website' => $lead['website'] ?? '',
            'platform' => $lead['platform'] ?? 'Unknown',
            'issues' => is_array($lead['issues'] ?? null) ? implode(', ', $lead['issues']) : ($lead['issues'] ?? ''),
            'phone' => $lead['phone'] ?? '',
            'email' => $lead['email'] ?? '',
        ];
        
        // Generate tracking ID
        $trackingId = bin2hex(random_bytes(32));
        
        // Personalize content
        $subject = personalizeContent($emailSubject, $personalization);
        $bodyHtml = personalizeContent($emailBodyHtml, $personalization);
        
        // Add tracking pixel
        $trackingPixel = '<img src="' . FRONTEND_URL . '/api/email-outreach.php?action=track-open&tid=' . $trackingId . '" width="1" height="1" style="display:none" />';
        if (strpos($bodyHtml, '</body>') !== false) {
            $bodyHtml = str_replace('</body>', $trackingPixel . '</body>', $bodyHtml);
        } else {
            $bodyHtml .= $trackingPixel;
        }
        
        // Calculate send time for drip mode
        $sendAt = null;
        $status = 'pending';
        
        if ($sendMode === 'drip') {
            // Stagger emails: add delay based on position
            $minutesToAdd = floor($emailIndex * (60 / $emailsPerHour));
            $sendAtTime = clone $currentTime;
            $sendAtTime->add(new DateInterval('PT' . $minutesToAdd . 'M'));
            $sendAt = $sendAtTime->format('Y-m-d H:i:s');
            $status = 'scheduled';
        } elseif ($sendMode === 'scheduled' && $scheduledFor) {
            $sendAt = date('Y-m-d H:i:s', strtotime($scheduledFor));
            $status = 'scheduled';
        }
        
        // Record the send
        $sendId = $db->insert(
            "INSERT INTO email_sends (user_id, lead_id, template_id, campaign_id, recipient_email, recipient_name, business_name, subject, body_html, tracking_id, status, scheduled_for) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $user['id'],
                $lead['id'] ?? null,
                $data['template_id'] ?? null,
                $data['campaign_id'] ?? null,
                $lead['email'],
                $lead['contact_name'] ?? null,
                $lead['business_name'] ?? null,
                $subject,
                $bodyHtml,
                $trackingId,
                $status,
                $sendAt
            ]
        );
        
        // For instant mode, send immediately
        if ($sendMode === 'instant') {
            $textBody = personalizeContent($emailBodyText, $personalization);
            $smtpOverride = isset($data['smtp_override']) && is_array($data['smtp_override']) ? $data['smtp_override'] : null;
            $sent = $smtpOverride
                ? sendEmailWithCustomSMTP($lead['email'], $subject, $bodyHtml, $textBody, $smtpOverride)
                : sendEmail($lead['email'], $subject, $bodyHtml, $textBody);
            
            if ($sent) {
                $db->update(
                    "UPDATE email_sends SET status = 'sent', sent_at = NOW() WHERE id = ?",
                    [$sendId]
                );
                $results['sent']++;
                $results['details'][] = ['business' => $lead['business_name'] ?? 'Unknown', 'email' => $lead['email'], 'status' => 'sent'];
            } else {
                $db->update(
                    "UPDATE email_sends SET status = 'failed', error_message = 'SMTP error' WHERE id = ?",
                    [$sendId]
                );
                $results['failed']++;
                $results['details'][] = ['business' => $lead['business_name'] ?? 'Unknown', 'email' => $lead['email'], 'status' => 'failed'];
            }
            
            // Small delay to avoid rate limiting
            usleep(100000); // 100ms delay
        } else {
            // For drip/scheduled, count as scheduled
            $results['scheduled']++;
            $results['details'][] = [
                'business' => $lead['business_name'] ?? 'Unknown', 
                'email' => $lead['email'], 
                'status' => 'scheduled',
                'scheduled_for' => $sendAt
            ];
        }
        
        $emailIndex++;
    }
    
    // For drip mode, also return estimated completion time
    if ($sendMode === 'drip' && count($leads) > 0) {
        $totalMinutes = floor(count($leads) * (60 / $emailsPerHour));
        $completionTime = clone $currentTime;
        $completionTime->add(new DateInterval('PT' . $totalMinutes . 'M'));
        $results['estimated_completion'] = $completionTime->format('Y-m-d H:i:s');
    }
    
    // Update sent count to include scheduled for reporting
    if ($sendMode !== 'instant') {
        $results['sent'] = $results['scheduled'];
    }
    
    echo json_encode(['success' => true, 'results' => $results]);
}

function handleSends($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        $status = $_GET['status'] ?? null;
        
        $params = [$user['id']];
        $whereClause = "WHERE user_id = ?";
        
        if ($status) {
            $whereClause .= " AND status = ?";
            $params[] = $status;
        }
        
        $sends = $db->fetchAll(
            "SELECT * FROM email_sends $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?",
            array_merge($params, [$limit, $offset])
        );
        
        $total = $db->fetchOne(
            "SELECT COUNT(*) as count FROM email_sends $whereClause",
            $params
        );
        
        echo json_encode([
            'success' => true,
            'sends' => $sends ?: [],
            'total' => $total['count'] ?? 0
        ]);
    }
}

// ===== TRACKING HANDLERS =====

function handleTrackOpen($db) {
    $trackingId = $_GET['tid'] ?? '';
    
    // Validate tracking ID format (must be 64-char hex string)
    if (!preg_match('/^[a-f0-9]{64}$/i', $trackingId)) {
        // Return transparent GIF anyway to not break email display
        header('Content-Type: image/gif');
        echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        exit();
    }
    
    // Verify tracking ID exists before updating
    $exists = $db->fetchOne(
        "SELECT id, campaign_id FROM email_sends WHERE tracking_id = ? AND status IN ('sent', 'delivered') LIMIT 1",
        [$trackingId]
    );
    
    if ($exists) {
        $db->update(
            "UPDATE email_sends SET status = 'opened', opened_at = COALESCE(opened_at, NOW()) WHERE id = ?",
            [$exists['id']]
        );
        
        // Update campaign stats
        if ($exists['campaign_id']) {
            $db->update(
                "UPDATE email_campaigns SET opened_count = opened_count + 1 WHERE id = ?",
                [$exists['campaign_id']]
            );
        }
    }
    
    // Return 1x1 transparent GIF
    header('Content-Type: image/gif');
    echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    exit();
}

function handleTrackClick($db) {
    $trackingId = $_GET['tid'] ?? '';
    $url = $_GET['url'] ?? '';
    
    // Validate tracking ID format
    if (!preg_match('/^[a-f0-9]{64}$/i', $trackingId)) {
        http_response_code(400);
        exit('Invalid request');
    }
    
    // Validate redirect URL to prevent open redirect vulnerability
    if (!empty($url)) {
        $parsed = parse_url($url);
        if ($parsed === false || !isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'], true)) {
            http_response_code(400);
            exit('Invalid URL');
        }
    }
    
    // Verify tracking ID exists before updating
    $exists = $db->fetchOne(
        "SELECT id FROM email_sends WHERE tracking_id = ? AND status IN ('sent', 'delivered', 'opened') LIMIT 1",
        [$trackingId]
    );
    
    if ($exists) {
        $db->update(
            "UPDATE email_sends SET clicked_at = COALESCE(clicked_at, NOW()), status = 'clicked' WHERE id = ? AND status NOT IN ('replied', 'bounced', 'failed')",
            [$exists['id']]
        );
    }
    
    if (!empty($url)) {
        header('Location: ' . $url);
    }
    exit();
}

function handleStats($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $period = $_GET['period'] ?? '30'; // days
    
    // Overall stats
    $stats = $db->fetchOne(
        "SELECT 
            COUNT(*) as total_sent,
            SUM(CASE WHEN status = 'opened' OR status = 'clicked' OR status = 'replied' THEN 1 ELSE 0 END) as total_opened,
            SUM(CASE WHEN status = 'clicked' OR status = 'replied' THEN 1 ELSE 0 END) as total_clicked,
            SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as total_replied,
            SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as total_bounced,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed
         FROM email_sends 
         WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
        [$user['id'], $period]
    );
    
    // Daily stats for chart
    $dailyStats = $db->fetchAll(
        "SELECT 
            DATE(created_at) as date,
            COUNT(*) as sent,
            SUM(CASE WHEN status IN ('opened', 'clicked', 'replied') THEN 1 ELSE 0 END) as opened
         FROM email_sends 
         WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC",
        [$user['id'], $period]
    );
    
    // Calculate rates
    $totalSent = intval($stats['total_sent'] ?? 0);
    $openRate = $totalSent > 0 ? round(($stats['total_opened'] / $totalSent) * 100, 1) : 0;
    $clickRate = $totalSent > 0 ? round(($stats['total_clicked'] / $totalSent) * 100, 1) : 0;
    $replyRate = $totalSent > 0 ? round(($stats['total_replied'] / $totalSent) * 100, 1) : 0;
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_sent' => $totalSent,
            'total_opened' => intval($stats['total_opened'] ?? 0),
            'total_clicked' => intval($stats['total_clicked'] ?? 0),
            'total_replied' => intval($stats['total_replied'] ?? 0),
            'total_bounced' => intval($stats['total_bounced'] ?? 0),
            'total_failed' => intval($stats['total_failed'] ?? 0),
            'open_rate' => $openRate,
            'click_rate' => $clickRate,
            'reply_rate' => $replyRate,
        ],
        'daily' => $dailyStats ?: []
    ]);
}

// ===== SCHEDULED EMAIL HANDLERS =====

function handleScheduledEmails($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $emails = $db->fetchAll(
        "SELECT id, recipient_email, recipient_name, business_name, subject, scheduled_for, created_at
         FROM email_sends 
         WHERE user_id = ? AND status = 'scheduled' AND scheduled_for IS NOT NULL
         ORDER BY scheduled_for ASC",
        [$user['id']]
    );
    
    echo json_encode(['success' => true, 'emails' => $emails ?: []]);
}

function handleCancelScheduled($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID required']);
        return;
    }
    
    // Verify ownership and status
    $email = $db->fetchOne(
        "SELECT id FROM email_sends WHERE id = ? AND user_id = ? AND status = 'scheduled'",
        [$id, $user['id']]
    );
    
    if (!$email) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Scheduled email not found']);
        return;
    }
    
    $db->update(
        "UPDATE email_sends SET status = 'cancelled' WHERE id = ?",
        [$id]
    );
    
    echo json_encode(['success' => true, 'message' => 'Scheduled email cancelled']);
}

function handleProcessScheduled($db) {
    // This is called by a cron job - no user auth needed
    // Process emails that are scheduled for now or earlier
    
    $pendingEmails = $db->fetchAll(
        "SELECT es.*, et.body_text as template_body_text
         FROM email_sends es
         LEFT JOIN email_templates et ON es.template_id = et.id
         WHERE es.status = 'scheduled' 
         AND es.scheduled_for <= NOW()
         ORDER BY es.scheduled_for ASC
         LIMIT 20",
        []
    );
    
    if (!$pendingEmails || count($pendingEmails) === 0) {
        echo json_encode(['success' => true, 'processed' => 0, 'message' => 'No emails to process']);
        return;
    }
    
    $processed = 0;
    $failed = 0;
    
    foreach ($pendingEmails as $email) {
        $textBody = $email['template_body_text'] ?? strip_tags($email['body_html']);
        $sent = sendEmail($email['recipient_email'], $email['subject'], $email['body_html'], $textBody);
        
        if ($sent) {
            $db->update(
                "UPDATE email_sends SET status = 'sent', sent_at = NOW() WHERE id = ?",
                [$email['id']]
            );
            $processed++;
        } else {
            $db->update(
                "UPDATE email_sends SET status = 'failed', error_message = 'SMTP error during scheduled send' WHERE id = ?",
                [$email['id']]
            );
            $failed++;
        }
        
        // Small delay between sends
        usleep(200000); // 200ms
    }
    
    echo json_encode([
        'success' => true, 
        'processed' => $processed, 
        'failed' => $failed,
        'message' => "Processed $processed emails, $failed failed"
    ]);
}

// ===== HELPER FUNCTIONS =====

function personalizeContent($content, $data) {
    $tokens = [
        '{{business_name}}' => $data['business_name'] ?? '',
        '{{first_name}}' => $data['first_name'] ?? 'there',
        '{{website}}' => $data['website'] ?? '',
        '{{platform}}' => $data['platform'] ?? 'Unknown',
        '{{issues}}' => $data['issues'] ?? '',
        '{{phone}}' => $data['phone'] ?? '',
        '{{email}}' => $data['email'] ?? '',
    ];
    
    return str_replace(array_keys($tokens), array_values($tokens), $content);
}

function extractFirstName($businessName) {
    // Try to extract a first name from business name
    // This is a simple heuristic - in production you'd want something more sophisticated
    $words = explode(' ', trim($businessName));
    $firstWord = $words[0] ?? '';
    
    // If it looks like a person's name (capitalized, not a common business word)
    $businessWords = ['the', 'inc', 'llc', 'corp', 'company', 'co', 'services', 'solutions'];
    if (strlen($firstWord) > 2 && !in_array(strtolower($firstWord), $businessWords)) {
        return $firstWord;
    }
    
    return 'there';
}

/**
 * Rate limit tracking endpoints to prevent abuse
 * Allows 100 requests per minute per IP
 */
function rateLimitTracking() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $cacheKey = 'tracking_' . md5($ip) . '_' . date('YmdHi');
    
    // Simple in-memory rate limiting using APCu if available, or file-based
    if (function_exists('apcu_exists')) {
        $count = apcu_fetch($cacheKey) ?: 0;
        if ($count >= 100) {
            http_response_code(429);
            echo json_encode(['error' => 'Rate limit exceeded']);
            exit();
        }
        apcu_store($cacheKey, $count + 1, 60);
    }
    // If APCu not available, allow through but log for monitoring
}

// ===== SMTP TEST HANDLERS =====

/**
 * Test SMTP connection using configured or provided credentials
 */
function handleTestSMTP($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $host = $data['host'] ?? (defined('SMTP_HOST') ? SMTP_HOST : '');
    $port = $data['port'] ?? (defined('SMTP_PORT') ? SMTP_PORT : '465');
    $username = $data['username'] ?? (defined('SMTP_USER') ? SMTP_USER : '');
    $password = $data['password'] ?? (defined('SMTP_PASS') ? SMTP_PASS : '');
    $secure = $data['secure'] ?? (defined('SMTP_SECURE') ? SMTP_SECURE : 'ssl');
    if (is_bool($secure)) {
        $secure = $secure ? ((int)$port === 465 ? 'ssl' : 'tls') : '';
    }
    
    if (empty($host) || empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'SMTP host, username, and password are required']);
        return;
    }
    
    // Prefer a real SMTP auth test via PHPMailer (ensures credentials are valid)
    $autoloadPath = __DIR__ . '/vendor/autoload.php';
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer') && file_exists($autoloadPath)) {
        require_once $autoloadPath;
    }

    if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->Port = (int)$port;
            $mail->SMTPAuth = true;
            $mail->Username = $username;
            $mail->Password = $password;

            $secureLower = strtolower((string)$secure);
            if ($secureLower === 'ssl' || $secureLower === 'smtps' || (int)$port === 465) {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($secureLower === 'tls' || $secureLower === 'starttls') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = '';
            }

            $mail->SMTPAutoTLS = !($mail->SMTPSecure === \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS || (int)$port === 465);
            $mail->Timeout = 10;
            $mail->SMTPDebug = 0;

            if ($mail->smtpConnect()) {
                $mail->smtpClose();
                echo json_encode([
                    'success' => true,
                    'message' => 'SMTP authentication successful',
                ]);
                return;
            }

            echo json_encode([
                'success' => false,
                'error' => $mail->ErrorInfo ?: 'SMTP authentication failed',
            ]);
            return;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'SMTP test failed: ' . $e->getMessage()]);
            return;
        }
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'SMTP auth test unavailable (PHPMailer missing).',
    ]);
}

/**
 * Send a test email to verify SMTP is working
 */
function handleSendTestEmail($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Support both field naming conventions
    $toEmail = $data['to_email'] ?? $data['test_email'] ?? '';
    
    if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid email address is required']);
        return;
    }
    
    // Build test email content
    $subject = '✅ BamLead SMTP Test - ' . date('Y-m-d H:i:s');
    $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #14b8a6, #0ea5e9); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
                .info-box { background: #f0fdfa; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0f2f1; }
                .info-row:last-child { border-bottom: none; }
                .label { color: #64748b; }
                .value { font-weight: 600; color: #0f172a; }
                .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 BamLead SMTP Test</h1>
                </div>
                <div class="content">
                    <span class="success-badge">✓ Email Delivered Successfully</span>
                    <h2>Your SMTP Configuration Works!</h2>
                    <p>This test email confirms that your email outreach system is properly configured and ready to send emails.</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span class="label">Sent To:</span>
                            <span class="value">' . htmlspecialchars($toEmail) . '</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Sent At:</span>
                            <span class="value">' . date('F j, Y g:i A T') . '</span>
                        </div>
                        <div class="info-row">
                            <span class="label">SMTP Server:</span>
                            <span class="value">' . (defined('SMTP_HOST') ? SMTP_HOST : 'System Default') . '</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span>
                            <span class="value" style="color: #10b981;">Operational ✓</span>
                        </div>
                    </div>
                    
                    <p>You can now confidently send emails to your leads. Happy prospecting! 🚀</p>
                </div>
                <div class="footer">
                    <p>Sent with ❤️ by BamLead Email Outreach System</p>
                </div>
            </div>
        </body>
        </html>
    ';
    
    $textBody = "BamLead SMTP Test - SUCCESS!\n\nYour email configuration is working properly.\n\nSent to: $toEmail\nTime: " . date('Y-m-d H:i:s T') . "\n\nYou can now send emails to your leads!";
    
    // Send the test email (prefer per-request SMTP settings if provided)
    $smtpOverride = isset($data['smtp_override']) && is_array($data['smtp_override']) ? $data['smtp_override'] : null;
    $sent = $smtpOverride
        ? sendEmailWithCustomSMTP($toEmail, $subject, $htmlBody, $textBody, $smtpOverride)
        : sendEmail($toEmail, $subject, $htmlBody, $textBody);
    
    if ($sent) {
        // Log the successful test if possible (email_sends table may not exist in some installs).
        try {
            $userId = is_array($user) && isset($user['id']) ? $user['id'] : null;
            if ($userId !== null) {
                $db->insert(
                    "INSERT INTO email_sends (user_id, recipient_email, subject, body_html, status, sent_at) VALUES (?, ?, ?, ?, 'sent', NOW())",
                    [$userId, $toEmail, $subject, $htmlBody]
                );
            }
        } catch (Exception $e) {
            error_log("Email test log insert failed: " . $e->getMessage());
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Test email sent successfully',
            'to' => $toEmail,
            'sent_at' => date('Y-m-d H:i:s')
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to send test email. Please check your SMTP configuration.',
            'smtp_configured' => defined('SMTP_HOST') && !empty(SMTP_HOST)
        ]);
    }
}
