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

        case 'send-health':
            handleSendHealthCheck($db, $user);
            break;
            
        // ===== SCHEDULED EMAILS =====
        case 'scheduled':
            handleScheduledEmails($db, $user);
            break;
            
        case 'cancel-scheduled':
            handleCancelScheduled($db, $user);
            break;

        case 'clear-queue':
            handleClearQueue($db, $user);
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

        case 'process-my-scheduled':
            handleProcessMyScheduled($db, $user);
            break;
            
        // ===== SMTP TEST ENDPOINTS =====
        case 'test_smtp':
            handleTestSMTP($db, $user);
            break;
            
        case 'send_test':
            handleSendTestEmail($db, $user);
            break;

        // ===== SMTP CONFIG PERSISTENCE =====
        case 'save_smtp_config':
            handleSaveSMTPConfig($db, $user);
            break;

        case 'load_smtp_config':
            handleLoadSMTPConfig($db, $user);
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
    
    $leadId = resolveValidLeadId($db, $user, $data['lead_id'] ?? null);

    // Record the send
    $sendId = $db->insert(
        "INSERT INTO email_sends (user_id, lead_id, template_id, campaign_id, recipient_email, recipient_name, business_name, subject, body_html, tracking_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
        [
            $user['id'],
            $leadId,
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
    $smtpOverride = resolveEffectiveSmtpOverride($db, (int)$user['id'], $data);
    if (!$smtpOverride) {
        $db->update(
            "UPDATE email_sends SET status = 'failed', error_message = 'No SMTP config saved for this user' WHERE id = ?",
            [$sendId]
        );
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'SMTP not configured. Please save your SMTP settings first.']);
        return;
    }
    $sent = sendEmailWithCustomSMTP($data['to'], $subject, $bodyHtml, $textBody, $smtpOverride);
    
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
    $effectiveSmtpOverride = resolveEffectiveSmtpOverride($db, (int)$user['id'], $data);
    
    if (!$effectiveSmtpOverride) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'SMTP not configured. Please save your SMTP settings first.']);
        return;
    }

    // For drip sending, we queue emails with scheduled times.
    // Tune via config.php to balance throughput vs deliverability.
    $defaultDripPerHour = defined('EMAIL_DRIP_DEFAULT_PER_HOUR') ? max(1, (int)EMAIL_DRIP_DEFAULT_PER_HOUR) : 80;
    $emailsPerHour = max(1, (int)($dripConfig['emailsPerHour'] ?? $defaultDripPerHour));
    
    // Rate limiting - configurable caps for drip/scheduled vs instant.
    $dripMaxPerRequest = defined('EMAIL_DRIP_MAX_PER_REQUEST') ? max(100, (int)EMAIL_DRIP_MAX_PER_REQUEST) : 1000;
    $instantMaxPerRequest = defined('EMAIL_INSTANT_MAX_PER_REQUEST') ? max(1, (int)EMAIL_INSTANT_MAX_PER_REQUEST) : 50;
    $maxPerRequest = ($sendMode === 'drip' || $sendMode === 'scheduled') ? $dripMaxPerRequest : $instantMaxPerRequest;
    $leads = array_slice($data['leads'], 0, $maxPerRequest);
    
    // Use DB server time as the scheduling anchor to avoid PHP/MySQL timezone drift.
    $dbNowRow = $db->fetchOne("SELECT NOW() AS now_ts");
    $dbNow = isset($dbNowRow['now_ts']) ? (string)$dbNowRow['now_ts'] : null;
    $currentTime = $dbNow ? new DateTime($dbNow) : new DateTime();
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
            // Stagger by seconds for smoother/high-rate drip (not minute-rounded).
            $secondsToAdd = (int) floor($emailIndex * (3600 / $emailsPerHour));
            $sendAtTime = clone $currentTime;
            if ($secondsToAdd > 0) {
                $sendAtTime->add(new DateInterval('PT' . $secondsToAdd . 'S'));
            }
            $sendAt = $sendAtTime->format('Y-m-d H:i:s');
            $status = 'scheduled';
        } elseif ($sendMode === 'scheduled' && $scheduledFor) {
            $sendAt = date('Y-m-d H:i:s', strtotime($scheduledFor));
            $status = 'scheduled';
        }
        
        $leadId = resolveValidLeadId($db, $user, $lead['id'] ?? null);

        // Store SMTP override for scheduled/drip emails so cron can use it
        $smtpConfigJson = ($status === 'scheduled') ? json_encode($effectiveSmtpOverride) : null;
        
        // Record the send
        $sendId = $db->insert(
            "INSERT INTO email_sends (user_id, lead_id, template_id, campaign_id, recipient_email, recipient_name, business_name, subject, body_html, smtp_config, tracking_id, status, scheduled_for) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $user['id'],
                $leadId,
                $data['template_id'] ?? null,
                $data['campaign_id'] ?? null,
                $lead['email'],
                $lead['contact_name'] ?? null,
                $lead['business_name'] ?? null,
                $subject,
                $bodyHtml,
                $smtpConfigJson,
                $trackingId,
                $status,
                $sendAt
            ]
        );
        
        // For instant mode, send immediately
        if ($sendMode === 'instant') {
            $textBody = personalizeContent($emailBodyText, $personalization);
            $sent = sendEmailWithCustomSMTP($lead['email'], $subject, $bodyHtml, $textBody, $effectiveSmtpOverride);
            
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
        $totalSeconds = (int) floor(count($leads) * (3600 / $emailsPerHour));
        $completionTime = clone $currentTime;
        if ($totalSeconds > 0) {
            $completionTime->add(new DateInterval('PT' . $totalSeconds . 'S'));
        }
        $results['estimated_completion'] = $completionTime->format('Y-m-d H:i:s');
    }

    // Kickoff pass: immediately process a small due-now batch so campaigns visibly start
    // even if cron is delayed/misconfigured.
    if ($sendMode !== 'instant' && $results['scheduled'] > 0) {
        try {
            $kickoffLimit = defined('EMAIL_DRIP_KICKOFF_BATCH_SIZE') ? max(1, (int)EMAIL_DRIP_KICKOFF_BATCH_SIZE) : 20;
            $dueNow = $db->fetchAll(
                "SELECT es.*, et.body_text as template_body_text
                 FROM email_sends es
                 LEFT JOIN email_templates et ON es.template_id = et.id
                 WHERE es.user_id = ?
                   AND (es.status IN ('scheduled', 'pending', 'sending') OR es.status = '')
                   AND es.sent_at IS NULL
                   AND es.scheduled_for IS NOT NULL
                   AND es.scheduled_for <= NOW()
                 ORDER BY es.scheduled_for ASC
                 LIMIT ?",
                [(int)$user['id'], $kickoffLimit]
            );

            if ($dueNow && count($dueNow) > 0) {
                $kickoff = processScheduledEmailBatch($db, $dueNow, 'SMTP error during kickoff send');
                $processedNow = (int)($kickoff['processed'] ?? 0);
                $failedNow = (int)($kickoff['failed'] ?? 0);

                $results['processed_now'] = $processedNow;
                $results['kickoff_failed'] = $failedNow;
                $results['sent'] += $processedNow;
                $results['failed'] += $failedNow;
                $results['scheduled'] = max(0, $results['scheduled'] - $processedNow - $failedNow);
            } else {
                $results['processed_now'] = 0;
                $results['kickoff_failed'] = 0;
            }
        } catch (Exception $kickoffEx) {
            error_log('[email-outreach] kickoff send failed: ' . $kickoffEx->getMessage());
            $results['processed_now'] = 0;
            $results['kickoff_failed'] = 0;
        }
    }
    
    echo json_encode(['success' => true, 'results' => $results]);
}

function resolveValidLeadId($db, $user, $leadId) {
    if (empty($leadId)) {
        return null;
    }

    $id = (int)$leadId;
    if ($id <= 0) {
        return null;
    }

    try {
        $exists = $db->fetchOne(
            "SELECT id FROM saved_leads WHERE id = ? AND user_id = ? LIMIT 1",
            [$id, $user['id']]
        );
        if ($exists && isset($exists['id'])) {
            return (int)$exists['id'];
        }
    } catch (Exception $e) {
        // If saved_leads is unavailable, skip linking to avoid FK failures.
        error_log('[email-outreach] Lead lookup failed: ' . $e->getMessage());
    }

    return null;
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

function handleSendHealthCheck($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $leads = is_array($data['leads'] ?? null) ? $data['leads'] : [];
    $requestedTotal = isset($data['total_leads']) ? max(0, (int)$data['total_leads']) : count($leads);

    $validEmailCount = 0;
    foreach ($leads as $lead) {
        $email = trim((string)($lead['email'] ?? ''));
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $validEmailCount++;
        }
    }

    $effectiveSmtp = resolveEffectiveSmtpOverride($db, (int)$user['id'], $data);
    $smtpConfigured = !empty($effectiveSmtp);

    $scheduledTotal = 0;
    $scheduledDue = 0;
    $processedRecently = 0;
    try {
        $queueStats = $db->fetchOne(
            "SELECT
                COUNT(*) AS scheduled_total,
                SUM(CASE WHEN scheduled_for IS NOT NULL AND scheduled_for <= NOW() THEN 1 ELSE 0 END) AS scheduled_due
             FROM email_sends
             WHERE user_id = ?
               AND sent_at IS NULL
               AND scheduled_for IS NOT NULL
               AND (status IN ('scheduled', 'pending', 'sending') OR status = '')",
            [(int)$user['id']]
        );
        $scheduledTotal = (int)($queueStats['scheduled_total'] ?? 0);
        $scheduledDue = (int)($queueStats['scheduled_due'] ?? 0);
    } catch (Exception $e) {
        error_log('[send-health] queue stats failed: ' . $e->getMessage());
    }

    try {
        $recentStats = $db->fetchOne(
            "SELECT COUNT(*) AS processed_recently
             FROM email_sends
             WHERE user_id = ?
               AND (
                 (status = 'sent' AND sent_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE))
                 OR (status = 'failed' AND updated_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE))
               )",
            [(int)$user['id']]
        );
        $processedRecently = (int)($recentStats['processed_recently'] ?? 0);
    } catch (Exception $e) {
        error_log('[send-health] recent processing stats failed: ' . $e->getMessage());
    }

    $workerLikelyStalled = ($scheduledDue > 0 && $processedRecently === 0);
    $hasValidRecipients = ($validEmailCount > 0);
    $readyToSend = ($smtpConfigured && $hasValidRecipients && !$workerLikelyStalled);

    $warnings = [];
    if (!$smtpConfigured) {
        $warnings[] = 'SMTP is not configured for this user.';
    }
    if (!$hasValidRecipients) {
        $warnings[] = 'No valid recipient emails found in selected leads.';
    }
    if ($workerLikelyStalled) {
        $warnings[] = 'Scheduled queue is due but sender worker may not be processing.';
    }

    echo json_encode([
        'success' => true,
        'health' => [
            'ready' => $readyToSend,
            'timestamp' => date('Y-m-d H:i:s'),
            'checks' => [
                'smtp_configured' => $smtpConfigured,
                'requested_total' => $requestedTotal,
                'valid_recipients' => $validEmailCount,
                'scheduled_total' => $scheduledTotal,
                'scheduled_due' => $scheduledDue,
                'processed_recently' => $processedRecently,
                'worker_likely_stalled' => $workerLikelyStalled,
            ],
            'warnings' => $warnings,
        ]
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
         WHERE user_id = ?
           AND sent_at IS NULL
           AND scheduled_for IS NOT NULL
           AND (status IN ('scheduled', 'pending', 'sending') OR status = '')
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
        "SELECT id FROM email_sends
         WHERE id = ?
           AND user_id = ?
           AND sent_at IS NULL
           AND (status IN ('scheduled', 'pending', 'sending') OR status = '')",
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

function handleClearQueue($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    // Delete queued items only. This keeps sent history while clearing stuck/pending drip queues.
    $deleted = $db->delete(
        "DELETE FROM email_sends
         WHERE user_id = ?
           AND (
             status IN ('scheduled', 'pending', 'sending')
             OR status = ''
           )",
        [(int)$user['id']]
    );

    echo json_encode([
        'success' => true,
        'deleted' => (int)$deleted,
        'message' => "Cleared {$deleted} queued emails"
    ]);
}

function handleProcessScheduled($db) {
    // This is called by a cron job - no user auth needed
    // Process emails that are scheduled for now or earlier
    
    $pendingEmails = $db->fetchAll(
        "SELECT es.*, et.body_text as template_body_text
         FROM email_sends es
         LEFT JOIN email_templates et ON es.template_id = et.id
         WHERE (es.status IN ('scheduled', 'pending', 'sending') OR es.status = '')
           AND es.sent_at IS NULL
           AND es.scheduled_for IS NOT NULL
           AND es.scheduled_for <= NOW()
         ORDER BY es.scheduled_for ASC
         LIMIT " . (defined('EMAIL_DRIP_WORKER_BATCH_SIZE') ? max(1, (int)EMAIL_DRIP_WORKER_BATCH_SIZE) : 60),
        []
    );

    $result = processScheduledEmailBatch($db, $pendingEmails, 'SMTP error during scheduled send');
    if (($result['processed'] + $result['failed']) === 0) {
        echo json_encode(['success' => true, 'processed' => 0, 'message' => 'No emails to process']);
        return;
    }

    echo json_encode([
        'success' => true,
        'processed' => $result['processed'],
        'failed' => $result['failed'],
        'message' => "Processed {$result['processed']} emails, {$result['failed']} failed"
    ]);
}

function handleProcessMyScheduled($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $limit = isset($data['limit']) ? (int)$data['limit'] : 30;
    $maxLimit = defined('EMAIL_DRIP_PROCESS_MY_MAX_LIMIT') ? max(20, (int)EMAIL_DRIP_PROCESS_MY_MAX_LIMIT) : 100;
    $lookaheadSec = isset($data['lookahead_sec']) ? (int)$data['lookahead_sec'] : 0;
    $maxLookaheadSec = defined('EMAIL_DRIP_PROCESS_MY_MAX_LOOKAHEAD_SEC')
        ? max(0, (int)EMAIL_DRIP_PROCESS_MY_MAX_LOOKAHEAD_SEC)
        : 7200;
    if ($limit < 1) {
        $limit = 1;
    } elseif ($limit > $maxLimit) {
        $limit = $maxLimit;
    }
    if ($lookaheadSec < 0) {
        $lookaheadSec = 0;
    } elseif ($lookaheadSec > $maxLookaheadSec) {
        $lookaheadSec = $maxLookaheadSec;
    }

    $pendingEmails = $db->fetchAll(
        "SELECT es.*, et.body_text as template_body_text
         FROM email_sends es
         LEFT JOIN email_templates et ON es.template_id = et.id
         WHERE es.user_id = ?
           AND (es.status IN ('scheduled', 'pending', 'sending') OR es.status = '')
           AND es.sent_at IS NULL
           AND es.scheduled_for IS NOT NULL
           AND (
             es.scheduled_for <= NOW()
             OR (? > 0 AND es.scheduled_for <= DATE_ADD(NOW(), INTERVAL ? SECOND))
           )
         ORDER BY es.scheduled_for ASC
         LIMIT ?",
        [(int)$user['id'], $lookaheadSec, $lookaheadSec, $limit]
    );

    $result = processScheduledEmailBatch($db, $pendingEmails ?: [], 'SMTP error during user fallback send');

    echo json_encode([
        'success' => true,
        'processed' => $result['processed'],
        'failed' => $result['failed'],
        'claimed' => $result['claimed'],
        'message' => "Processed {$result['processed']} emails, {$result['failed']} failed"
    ]);
}

function processScheduledEmailBatch($db, array $pendingEmails, $failureReason) {
    if (!$pendingEmails || count($pendingEmails) === 0) {
        return ['processed' => 0, 'failed' => 0, 'claimed' => 0];
    }

    $processed = 0;
    $failed = 0;
    $claimed = 0;
    $userSmtpCache = [];
    $smtpGroups = [];

    foreach ($pendingEmails as $email) {
        $emailId = (int)($email['id'] ?? 0);
        if ($emailId <= 0) {
            continue;
        }

        // Claim this row first to avoid duplicate processing across cron/fallback workers.
        // Use "pending" for claim to stay compatible with older status enums.
        $didClaim = $db->update(
            "UPDATE email_sends
             SET status = 'pending', error_message = NULL
             WHERE id = ?
               AND sent_at IS NULL
               AND (status IN ('scheduled', 'pending', 'sending') OR status = '')",
            [$emailId]
        );
        if ($didClaim < 1) {
            continue;
        }
        $claimed++;

        $textBody = $email['template_body_text'] ?? strip_tags($email['body_html']);
        $smtpOverride = null;
        if (!empty($email['smtp_config'])) {
            $decoded = json_decode((string)$email['smtp_config'], true);
            if (is_array($decoded)) {
                $smtpOverride = normalizeSmtpConfigPayload($decoded);
            }
        }
        if (!$smtpOverride && !empty($email['user_id'])) {
            $uid = (int)$email['user_id'];
            if (!array_key_exists($uid, $userSmtpCache)) {
                $loaded = loadUserSmtpConfigForUser($db, $uid);
                $userSmtpCache[$uid] = normalizeSmtpConfigPayload($loaded['config'] ?? null);
            }
            $smtpOverride = $userSmtpCache[$uid] ?: null;
        }

        if (!$smtpOverride) {
            $db->update(
                "UPDATE email_sends SET status = 'failed', error_message = 'No SMTP config saved for this user' WHERE id = ?",
                [$emailId]
            );
            $failed++;
            continue;
        }

        // Group by effective SMTP config so we can reuse one SMTP connection for many messages.
        $smtpKey = hash('sha256', json_encode([
            'host' => (string)($smtpOverride['host'] ?? ''),
            'port' => (string)($smtpOverride['port'] ?? ''),
            'username' => (string)($smtpOverride['username'] ?? ''),
            'password' => (string)($smtpOverride['password'] ?? ''),
            'fromEmail' => (string)($smtpOverride['fromEmail'] ?? $smtpOverride['from_email'] ?? ''),
            'fromName' => (string)($smtpOverride['fromName'] ?? $smtpOverride['from_name'] ?? ''),
            'secure' => is_bool($smtpOverride['secure'] ?? null)
                ? (($smtpOverride['secure'] ?? false) ? '1' : '0')
                : (string)($smtpOverride['secure'] ?? ''),
        ]));
        if (!isset($smtpGroups[$smtpKey])) {
            $smtpGroups[$smtpKey] = [
                'smtp' => $smtpOverride,
                'messages' => [],
            ];
        }
        $smtpGroups[$smtpKey]['messages'][] = [
            'id' => (string)$emailId,
            'to' => (string)($email['recipient_email'] ?? ''),
            'subject' => (string)($email['subject'] ?? ''),
            'html' => (string)($email['body_html'] ?? ''),
            'text' => (string)$textBody,
        ];
    }

    $interSendDelayUs = defined('EMAIL_DRIP_INTER_SEND_DELAY_US') ? max(0, (int)EMAIL_DRIP_INTER_SEND_DELAY_US) : 50000;
    foreach ($smtpGroups as $group) {
        $batchResult = sendEmailBatchWithCustomSMTP(
            $group['messages'],
            $group['smtp'],
            ['inter_send_delay_us' => $interSendDelayUs]
        );
        $messageResults = (isset($batchResult['results']) && is_array($batchResult['results']))
            ? $batchResult['results']
            : [];

        foreach ($group['messages'] as $message) {
            $emailId = (int)$message['id'];
            $rowResult = $messageResults[(string)$message['id']] ?? null;
            $sent = is_array($rowResult) && !empty($rowResult['success']);

            if ($sent) {
                $db->update(
                    "UPDATE email_sends SET status = 'sent', sent_at = NOW() WHERE id = ?",
                    [$emailId]
                );
                $processed++;
                continue;
            }

            $rowError = is_array($rowResult) ? (string)($rowResult['error'] ?? '') : '';
            $db->update(
                "UPDATE email_sends SET status = 'failed', error_message = ? WHERE id = ?",
                [$rowError !== '' ? $rowError : $failureReason, $emailId]
            );
            $failed++;
        }
    }

    return ['processed' => $processed, 'failed' => $failed, 'claimed' => $claimed];
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

function normalizeSmtpConfigPayload($config) {
    if (!is_array($config)) {
        return null;
    }

    $port = normalizeSmtpPort($config['port'] ?? null, 587);
    if ($port === null) {
        return null;
    }

    $normalized = [
        'host' => trim((string)($config['host'] ?? '')),
        'port' => (string)$port,
        'username' => trim((string)($config['username'] ?? '')),
        'password' => (string)($config['password'] ?? ''),
        'fromEmail' => trim((string)($config['fromEmail'] ?? $config['from_email'] ?? '')),
        'fromName' => trim((string)($config['fromName'] ?? $config['from_name'] ?? '')),
        'secure' => normalizeSmtpSecureMode($config['secure'] ?? true, $port) !== '',
    ];

    if ($normalized['host'] === '' || $normalized['username'] === '' || $normalized['password'] === '') {
        return null;
    }

    if ($normalized['fromEmail'] !== '' && !filter_var($normalized['fromEmail'], FILTER_VALIDATE_EMAIL)) {
        return null;
    }

    return $normalized;
}

function resolveEffectiveSmtpOverride($db, $userId, $requestData) {
    $requestOverride = normalizeSmtpConfigPayload($requestData['smtp_override'] ?? null);
    if ($requestOverride) {
        return $requestOverride;
    }

    $loaded = loadUserSmtpConfigForUser($db, (int)$userId);
    return normalizeSmtpConfigPayload($loaded['config'] ?? null);
}

function normalizeSmtpPort($rawPort, $defaultPort = 587) {
    $value = trim((string)$rawPort);
    if ($value === '') {
        $value = (string)$defaultPort;
    }
    if (!preg_match('/^\d+$/', $value)) {
        return null;
    }
    $port = (int)$value;
    if ($port < 1 || $port > 65535) {
        return null;
    }
    return $port;
}

function normalizeSmtpSecureMode($secure, $port) {
    if (is_bool($secure)) {
        if (!$secure) {
            return '';
        }
        return ((int)$port === 465) ? 'ssl' : 'tls';
    }

    $secureLower = strtolower(trim((string)$secure));
    if ($secureLower === 'ssl' || $secureLower === 'smtps') {
        return 'ssl';
    }
    if ($secureLower === 'tls' || $secureLower === 'starttls') {
        return 'tls';
    }
    return '';
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
    
    if (empty($host) || empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'SMTP host, username, and password are required']);
        return;
    }

    $normalizedPort = normalizeSmtpPort($port, 465);
    if ($normalizedPort === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid SMTP port. Use a value between 1 and 65535.']);
        return;
    }
    $port = $normalizedPort;
    $secure = normalizeSmtpSecureMode($secure, $port);
    
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
            $mail->Port = $port;
            $mail->SMTPAuth = true;
            $mail->Username = $username;
            $mail->Password = $password;

            if ($secure === 'ssl' || (int)$port === 465) {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($secure === 'tls') {
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
    
    // Send the test email using either request override or saved user SMTP config.
    $smtpOverride = null;
    if (is_array($user) && isset($user['id'])) {
        $smtpOverride = resolveEffectiveSmtpOverride($db, (int)$user['id'], $data);
    } else {
        $smtpOverride = normalizeSmtpConfigPayload($data['smtp_override'] ?? null);
    }

    if (!$smtpOverride) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'SMTP not configured. Please provide smtp_override or save SMTP settings first.',
        ]);
        return;
    }

    $sent = sendEmailWithCustomSMTP($toEmail, $subject, $htmlBody, $textBody, $smtpOverride);
    
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

// ===== SMTP CONFIG PERSISTENCE HANDLERS =====

/**
 * Save user's SMTP configuration to the database
 */
function handleSaveSMTPConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request body']);
        return;
    }

    $host = trim((string)($data['host'] ?? ''));
    $username = trim((string)($data['username'] ?? ''));
    $password = (string)($data['password'] ?? '');
    $fromEmail = trim((string)($data['fromEmail'] ?? ''));
    $fromName = trim((string)($data['fromName'] ?? ''));
    $port = normalizeSmtpPort($data['port'] ?? null, 587);

    if ($host === '' || $username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Host, username, and password are required']);
        return;
    }

    if ($port === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid SMTP port. Use a value between 1 and 65535.']);
        return;
    }

    if ($fromEmail !== '' && !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'From Email must be a valid email address']);
        return;
    }

    $config = [
        'host' => $host,
        'port' => (string)$port,
        'username' => $username,
        'password' => $password,
        'fromEmail' => $fromEmail,
        'fromName' => $fromName,
        'secure' => normalizeSmtpSecureMode($data['secure'] ?? true, $port) !== '',
    ];

    $configJson = json_encode($config);

    try {
        $storage = saveUserSmtpConfigForUser($db, (int)$user['id'], $configJson);
        echo json_encode([
            'success' => true,
            'message' => 'SMTP configuration saved to your account',
            'storage' => $storage,
        ]);
    } catch (Exception $e) {
        error_log("Save SMTP config failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save SMTP configuration']);
    }
}

/**
 * Load user's SMTP configuration from the database
 */
function handleLoadSMTPConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    try {
        $payload = loadUserSmtpConfigForUser($db, (int)$user['id']);
        if (!empty($payload['config']) && is_array($payload['config'])) {
            echo json_encode([
                'success' => true,
                'config' => $payload['config'],
                'storage' => $payload['storage'] ?? null,
            ]);
            return;
        }

        echo json_encode(['success' => true, 'config' => null]);
    } catch (Exception $e) {
        error_log("Load SMTP config failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to load SMTP configuration']);
    }
}

function isUnknownSmtpColumnError($exception) {
    $message = strtolower((string)($exception instanceof Throwable ? $exception->getMessage() : $exception));
    return strpos($message, 'unknown column') !== false && strpos($message, 'smtp_config') !== false;
}

function ensureUserSmtpConfigFallbackTable($db) {
    $db->query(
        "CREATE TABLE IF NOT EXISTS user_smtp_configs (
            user_id INT NOT NULL PRIMARY KEY,
            smtp_config TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function saveUserSmtpConfigForUser($db, $userId, $configJson) {
    try {
        $db->update(
            "UPDATE users SET smtp_config = ? WHERE id = ?",
            [$configJson, $userId]
        );
        return 'users.smtp_config';
    } catch (Exception $e) {
        if (!isUnknownSmtpColumnError($e)) {
            throw $e;
        }
    }

    ensureUserSmtpConfigFallbackTable($db);
    $db->query(
        "INSERT INTO user_smtp_configs (user_id, smtp_config)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE smtp_config = VALUES(smtp_config), updated_at = CURRENT_TIMESTAMP",
        [$userId, $configJson]
    );

    return 'user_smtp_configs.smtp_config';
}

function loadUserSmtpConfigForUser($db, $userId) {
    try {
        $row = $db->fetchOne(
            "SELECT smtp_config FROM users WHERE id = ?",
            [$userId]
        );
        if ($row && !empty($row['smtp_config'])) {
            $config = json_decode($row['smtp_config'], true);
            if (is_array($config)) {
                return [
                    'config' => $config,
                    'storage' => 'users.smtp_config',
                ];
            }
        }
    } catch (Exception $e) {
        if (!isUnknownSmtpColumnError($e)) {
            throw $e;
        }
    }

    try {
        ensureUserSmtpConfigFallbackTable($db);
        $row = $db->fetchOne(
            "SELECT smtp_config FROM user_smtp_configs WHERE user_id = ?",
            [$userId]
        );
        if ($row && !empty($row['smtp_config'])) {
            $config = json_decode($row['smtp_config'], true);
            if (is_array($config)) {
                return [
                    'config' => $config,
                    'storage' => 'user_smtp_configs.smtp_config',
                ];
            }
        }
    } catch (Exception $fallbackError) {
        error_log("SMTP fallback load failed: " . $fallbackError->getMessage());
    }

    return ['config' => null, 'storage' => null];
}
