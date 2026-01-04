<?php
/**
 * Email Outreach API Endpoint
 * Handles email templates, campaigns, and sending
 */

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/email.php';
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Authenticate user
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

$action = $_GET['action'] ?? '';
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
        case 'track-open':
            handleTrackOpen($db);
            break;
            
        case 'track-click':
            handleTrackClick($db);
            break;
            
        case 'stats':
            handleStats($db, $user);
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
    
    // Send the email
    $textBody = $data['body_text'] ?? strip_tags($bodyHtml);
    $sent = sendEmail($data['to'], $subject, $bodyHtml, $textBody);
    
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
    
    if (empty($data['leads']) || empty($data['template_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'leads and template_id are required']);
        return;
    }
    
    // Get the template
    $template = $db->fetchOne(
        "SELECT * FROM email_templates WHERE id = ? AND user_id = ?",
        [$data['template_id'], $user['id']]
    );
    
    if (!$template) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Template not found']);
        return;
    }
    
    $results = [
        'total' => count($data['leads']),
        'sent' => 0,
        'failed' => 0,
        'skipped' => 0,
        'details' => []
    ];
    
    // Rate limiting - max 50 emails per request
    $maxPerRequest = 50;
    $leads = array_slice($data['leads'], 0, $maxPerRequest);
    
    foreach ($leads as $lead) {
        if (empty($lead['email'])) {
            $results['skipped']++;
            $results['details'][] = ['business' => $lead['business_name'] ?? 'Unknown', 'status' => 'skipped', 'reason' => 'No email'];
            continue;
        }
        
        // Prepare personalization data
        $personalization = [
            'business_name' => $lead['business_name'] ?? '',
            'first_name' => extractFirstName($lead['business_name'] ?? ''),
            'website' => $lead['website'] ?? '',
            'platform' => $lead['platform'] ?? 'Unknown',
            'issues' => is_array($lead['issues'] ?? null) ? implode(', ', $lead['issues']) : ($lead['issues'] ?? ''),
            'phone' => $lead['phone'] ?? '',
            'email' => $lead['email'] ?? '',
        ];
        
        // Generate tracking ID
        $trackingId = bin2hex(random_bytes(32));
        
        // Personalize content
        $subject = personalizeContent($template['subject'], $personalization);
        $bodyHtml = personalizeContent($template['body_html'], $personalization);
        
        // Add tracking pixel
        $trackingPixel = '<img src="' . FRONTEND_URL . '/api/email-outreach.php?action=track-open&tid=' . $trackingId . '" width="1" height="1" style="display:none" />';
        $bodyHtml = str_replace('</body>', $trackingPixel . '</body>', $bodyHtml);
        
        // Record the send
        $sendId = $db->insert(
            "INSERT INTO email_sends (user_id, lead_id, template_id, campaign_id, recipient_email, recipient_name, business_name, subject, body_html, tracking_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
            [
                $user['id'],
                $lead['id'] ?? null,
                $template['id'],
                $data['campaign_id'] ?? null,
                $lead['email'],
                $lead['contact_name'] ?? null,
                $lead['business_name'] ?? null,
                $subject,
                $bodyHtml,
                $trackingId
            ]
        );
        
        // Send the email
        $textBody = personalizeContent($template['body_text'] ?? '', $personalization);
        $sent = sendEmail($lead['email'], $subject, $bodyHtml, $textBody);
        
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
    $trackingId = $_GET['tid'] ?? null;
    
    if ($trackingId) {
        $db->update(
            "UPDATE email_sends SET status = 'opened', opened_at = COALESCE(opened_at, NOW()) WHERE tracking_id = ? AND status IN ('sent', 'delivered')",
            [$trackingId]
        );
        
        // Update campaign stats
        $send = $db->fetchOne("SELECT campaign_id FROM email_sends WHERE tracking_id = ?", [$trackingId]);
        if ($send && $send['campaign_id']) {
            $db->update(
                "UPDATE email_campaigns SET opened_count = opened_count + 1 WHERE id = ?",
                [$send['campaign_id']]
            );
        }
    }
    
    // Return 1x1 transparent GIF
    header('Content-Type: image/gif');
    echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    exit();
}

function handleTrackClick($db) {
    $trackingId = $_GET['tid'] ?? null;
    $url = $_GET['url'] ?? null;
    
    if ($trackingId) {
        $db->update(
            "UPDATE email_sends SET clicked_at = COALESCE(clicked_at, NOW()) WHERE tracking_id = ? AND status IN ('sent', 'delivered', 'opened')",
            [$trackingId]
        );
        
        // Update status to clicked if not already
        $db->update(
            "UPDATE email_sends SET status = 'clicked' WHERE tracking_id = ? AND status NOT IN ('replied', 'bounced', 'failed')",
            [$trackingId]
        );
    }
    
    if ($url) {
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
