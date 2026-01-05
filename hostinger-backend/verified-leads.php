<?php
/**
 * Verified Leads API Endpoint
 * Handles CRUD operations for verified leads
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Require authentication
$user = requireAuth();
if (!$user) {
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();
    
    switch ($method) {
        case 'GET':
            handleGet($db, $user);
            break;
        case 'POST':
            handlePost($db, $user);
            break;
        case 'PUT':
            handlePut($db, $user);
            break;
        case 'DELETE':
            handleDelete($db, $user);
            break;
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Verified Leads Error: " . $e->getMessage());
    if (DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred', 500);
    }
}

/**
 * GET - List verified leads
 */
function handleGet($db, $user) {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 50;
    $offset = ($page - 1) * $limit;
    $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
    $emailValid = isset($_GET['email_valid']) ? $_GET['email_valid'] === 'true' : null;
    
    // Build query
    $where = ['user_id = ?'];
    $params = [$user['id']];
    
    if ($status && in_array($status, ['pending', 'sent', 'replied', 'converted', 'bounced'])) {
        $where[] = 'outreach_status = ?';
        $params[] = $status;
    }
    
    if ($emailValid !== null) {
        $where[] = 'email_valid = ?';
        $params[] = $emailValid ? 1 : 0;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM verified_leads WHERE $whereClause";
    $total = $db->fetchOne($countSql, $params)['total'];
    
    // Get leads
    $sql = "SELECT * FROM verified_leads WHERE $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $leads = $db->fetchAll($sql, $params);
    
    // Parse JSON fields
    foreach ($leads as &$lead) {
        if ($lead['issues']) {
            $lead['issues'] = json_decode($lead['issues'], true);
        }
    }
    
    sendJson([
        'success' => true,
        'data' => [
            'leads' => $leads,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => ceil($total / $limit)
            ]
        ]
    ]);
}

/**
 * POST - Save verified leads (single or bulk)
 */
function handlePost($db, $user) {
    $input = getJsonInput();
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    // Handle bulk save
    if (isset($input['leads']) && is_array($input['leads'])) {
        $leads = $input['leads'];
    } else {
        $leads = [$input];
    }
    
    $saved = 0;
    $errors = [];
    
    foreach ($leads as $leadData) {
        if (empty($leadData['email']) || empty($leadData['business_name'])) {
            $errors[] = 'Lead missing required fields (email, business_name)';
            continue;
        }
        
        $leadId = $leadData['lead_id'] ?? $leadData['id'] ?? uniqid('lead_');
        
        try {
            $sql = "INSERT INTO verified_leads 
                    (user_id, lead_id, business_name, email, contact_name, phone, website, 
                     address, platform, verified, email_valid, lead_score, ai_drafted_message, 
                     verification_status, issues, source_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    business_name = VALUES(business_name),
                    email = VALUES(email),
                    contact_name = VALUES(contact_name),
                    phone = VALUES(phone),
                    website = VALUES(website),
                    address = VALUES(address),
                    platform = VALUES(platform),
                    verified = VALUES(verified),
                    email_valid = VALUES(email_valid),
                    lead_score = VALUES(lead_score),
                    ai_drafted_message = VALUES(ai_drafted_message),
                    verification_status = VALUES(verification_status),
                    issues = VALUES(issues),
                    updated_at = CURRENT_TIMESTAMP";
            
            $db->query($sql, [
                $user['id'],
                $leadId,
                sanitizeInput($leadData['business_name']),
                sanitizeInput($leadData['email']),
                sanitizeInput($leadData['contact_name'] ?? null),
                sanitizeInput($leadData['phone'] ?? null),
                sanitizeInput($leadData['website'] ?? null),
                sanitizeInput($leadData['address'] ?? null),
                sanitizeInput($leadData['platform'] ?? null),
                isset($leadData['verified']) ? ($leadData['verified'] ? 1 : 0) : 1,
                isset($leadData['emailValid']) ? ($leadData['emailValid'] ? 1 : 0) : 0,
                intval($leadData['leadScore'] ?? $leadData['lead_score'] ?? 0),
                $leadData['aiDraftedMessage'] ?? $leadData['ai_drafted_message'] ?? null,
                $leadData['verificationStatus'] ?? $leadData['verification_status'] ?? 'verified',
                json_encode($leadData['issues'] ?? []),
                $leadData['source_type'] ?? 'gmb'
            ]);
            
            $saved++;
        } catch (Exception $e) {
            $errors[] = "Failed to save lead {$leadData['business_name']}: " . $e->getMessage();
        }
    }
    
    // Track usage
    if ($saved > 0) {
        trackUsage($db, $user['id'], 'verify', $saved);
    }
    
    sendJson([
        'success' => true,
        'data' => [
            'saved' => $saved,
            'errors' => $errors
        ]
    ]);
}

/**
 * PUT - Update lead status
 */
function handlePut($db, $user) {
    $input = getJsonInput();
    if (!$input || empty($input['id'])) {
        sendError('Lead ID required');
    }
    
    $id = intval($input['id']);
    
    // Verify ownership
    $lead = $db->fetchOne(
        "SELECT id FROM verified_leads WHERE id = ? AND user_id = ?",
        [$id, $user['id']]
    );
    
    if (!$lead) {
        sendError('Lead not found', 404);
    }
    
    $updates = [];
    $params = [];
    
    $allowedFields = [
        'outreach_status', 'email_valid', 'lead_score', 
        'ai_drafted_message', 'verification_status', 'sent_at'
    ];
    
    foreach ($allowedFields as $field) {
        $camelCase = lcfirst(str_replace('_', '', ucwords($field, '_')));
        if (isset($input[$field]) || isset($input[$camelCase])) {
            $value = $input[$field] ?? $input[$camelCase];
            $updates[] = "$field = ?";
            
            if ($field === 'email_valid') {
                $params[] = $value ? 1 : 0;
            } elseif ($field === 'sent_at' && $value === 'now') {
                $updates[count($updates) - 1] = "$field = CURRENT_TIMESTAMP";
                array_pop($params);
            } else {
                $params[] = $value;
            }
        }
    }
    
    if (empty($updates)) {
        sendError('No valid fields to update');
    }
    
    $params[] = $id;
    $params[] = $user['id'];
    
    $sql = "UPDATE verified_leads SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?";
    $db->update($sql, $params);
    
    sendJson([
        'success' => true,
        'message' => 'Lead updated successfully'
    ]);
}

/**
 * DELETE - Remove leads
 */
function handleDelete($db, $user) {
    $input = getJsonInput();
    
    if (isset($input['ids']) && is_array($input['ids'])) {
        // Bulk delete
        $ids = array_map('intval', $input['ids']);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $params = array_merge($ids, [$user['id']]);
        
        $deleted = $db->delete(
            "DELETE FROM verified_leads WHERE id IN ($placeholders) AND user_id = ?",
            $params
        );
    } elseif (isset($input['id'])) {
        // Single delete
        $deleted = $db->delete(
            "DELETE FROM verified_leads WHERE id = ? AND user_id = ?",
            [intval($input['id']), $user['id']]
        );
    } else {
        sendError('Lead ID(s) required');
    }
    
    sendJson([
        'success' => true,
        'data' => ['deleted' => $deleted]
    ]);
}

/**
 * Track usage
 */
function trackUsage($db, $userId, $actionType, $credits = 1) {
    try {
        $db->insert(
            "INSERT INTO usage_tracking (user_id, action_type, credits_used) VALUES (?, ?, ?)",
            [$userId, $actionType, $credits]
        );
    } catch (Exception $e) {
        error_log("Usage tracking failed: " . $e->getMessage());
    }
}
