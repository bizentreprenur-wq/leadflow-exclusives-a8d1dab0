<?php
/**
 * Search Leads API Endpoint
 * Handles CRUD operations for search leads (persisted per customer)
 * Leads are stored for 30 days for consistency across the system
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/audit.php';

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
        case 'DELETE':
            handleDelete($db, $user);
            break;
        default:
            auditFailure('invalid_method', 'leads', $user['id'], 'Method not allowed: ' . $method);
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Search Leads Error: " . $e->getMessage());
    auditFailure('search_leads_error', 'leads', $user['id'], $e->getMessage());
    if (DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred', 500);
    }
}

/**
 * GET - List search leads for the current user
 */
function handleGet($db, $user) {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(500, max(1, intval($_GET['limit']))) : 100;
    $offset = ($page - 1) * $limit;
    $sessionId = isset($_GET['session_id']) ? sanitizeInput($_GET['session_id']) : null;
    $sourceType = isset($_GET['source_type']) ? sanitizeInput($_GET['source_type']) : null;
    $aiClassification = isset($_GET['ai_classification']) ? sanitizeInput($_GET['ai_classification']) : null;
    
    // Build query
    $where = ['user_id = ?'];
    $params = [$user['id']];
    
    // Filter by search session if provided
    if ($sessionId) {
        $where[] = 'search_session_id = ?';
        $params[] = $sessionId;
    }
    
    // Filter by source type (gmb/platform)
    if ($sourceType && in_array($sourceType, ['gmb', 'platform'])) {
        $where[] = 'source_type = ?';
        $params[] = $sourceType;
    }
    
    // Filter by AI classification
    if ($aiClassification && in_array($aiClassification, ['hot', 'warm', 'cold'])) {
        $where[] = 'ai_classification = ?';
        $params[] = $aiClassification;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM search_leads WHERE $whereClause";
    $total = $db->fetchOne($countSql, $params)['total'];
    
    // Get leads (order by score, then hot/warm/cold, then created_at)
    $sql = "SELECT * FROM search_leads 
            WHERE $whereClause 
            ORDER BY 
                CASE ai_classification 
                    WHEN 'hot' THEN 1 
                    WHEN 'warm' THEN 2 
                    WHEN 'cold' THEN 3 
                    ELSE 4 
                END,
                lead_score DESC,
                created_at DESC 
            LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $leads = $db->fetchAll($sql, $params);
    
    // Parse JSON fields
    foreach ($leads as &$lead) {
        if ($lead['pain_points']) {
            $lead['pain_points'] = json_decode($lead['pain_points'], true);
        }
        if ($lead['website_analysis']) {
            $lead['website_analysis'] = json_decode($lead['website_analysis'], true);
        }
    }
    
    // Get latest search metadata
    $latestSearch = $db->fetchOne(
        "SELECT search_query, search_location, search_session_id, source_type, created_at 
         FROM search_leads 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1",
        [$user['id']]
    );
    
    sendJson([
        'success' => true,
        'data' => [
            'leads' => $leads,
            'latestSearch' => $latestSearch ? [
                'query' => $latestSearch['search_query'],
                'location' => $latestSearch['search_location'],
                'sessionId' => $latestSearch['search_session_id'],
                'sourceType' => $latestSearch['source_type'],
                'createdAt' => $latestSearch['created_at']
            ] : null,
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
 * POST - Save search leads (bulk save after search)
 */
function handlePost($db, $user) {
    $input = getJsonInput();
    if (!$input) {
        sendError('Invalid JSON input');
    }
    
    // Validate required fields
    if (!isset($input['leads']) || !is_array($input['leads'])) {
        sendError('Leads array is required');
    }
    
    $leads = $input['leads'];
    $searchQuery = sanitizeInput($input['searchQuery'] ?? '');
    $searchLocation = sanitizeInput($input['searchLocation'] ?? '');
    $searchSessionId = sanitizeInput($input['searchSessionId'] ?? uniqid('search_'));
    $sourceType = isset($input['sourceType']) && in_array($input['sourceType'], ['gmb', 'platform']) 
                  ? $input['sourceType'] 
                  : 'gmb';
    
    // Optional: Clear previous leads from this user before saving new ones
    // This ensures consistency - user always sees their latest search
    $clearPrevious = isset($input['clearPrevious']) ? (bool)$input['clearPrevious'] : false;
    
    if ($clearPrevious) {
        $db->delete("DELETE FROM search_leads WHERE user_id = ?", [$user['id']]);
    }
    
    $saved = 0;
    $updated = 0;
    $errors = [];
    
    foreach ($leads as $leadData) {
        if (empty($leadData['name']) && empty($leadData['business_name'])) {
            $errors[] = 'Lead missing required field (name or business_name)';
            continue;
        }
        
        $leadId = $leadData['id'] ?? $leadData['lead_id'] ?? uniqid('lead_');
        $businessName = $leadData['name'] ?? $leadData['business_name'] ?? 'Unknown';
        
        try {
            $sql = "INSERT INTO search_leads 
                    (user_id, lead_id, business_name, address, phone, website, email, rating,
                     source_type, platform, ai_classification, lead_score, success_probability,
                     recommended_action, call_score, email_score, urgency, pain_points, ready_to_call,
                     website_analysis, search_query, search_location, search_session_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    business_name = VALUES(business_name),
                    address = VALUES(address),
                    phone = VALUES(phone),
                    website = VALUES(website),
                    email = VALUES(email),
                    rating = VALUES(rating),
                    platform = VALUES(platform),
                    ai_classification = VALUES(ai_classification),
                    lead_score = VALUES(lead_score),
                    success_probability = VALUES(success_probability),
                    recommended_action = VALUES(recommended_action),
                    call_score = VALUES(call_score),
                    email_score = VALUES(email_score),
                    urgency = VALUES(urgency),
                    pain_points = VALUES(pain_points),
                    ready_to_call = VALUES(ready_to_call),
                    website_analysis = VALUES(website_analysis),
                    search_query = VALUES(search_query),
                    search_location = VALUES(search_location),
                    search_session_id = VALUES(search_session_id),
                    updated_at = CURRENT_TIMESTAMP";
            
            $result = $db->query($sql, [
                $user['id'],
                $leadId,
                sanitizeInput($businessName),
                sanitizeInput($leadData['address'] ?? null),
                sanitizeInput($leadData['phone'] ?? null),
                sanitizeInput($leadData['website'] ?? $leadData['url'] ?? null),
                sanitizeInput($leadData['email'] ?? null),
                isset($leadData['rating']) ? floatval($leadData['rating']) : null,
                $sourceType,
                sanitizeInput($leadData['platform'] ?? ($leadData['websiteAnalysis']['platform'] ?? null)),
                $leadData['aiClassification'] ?? null,
                intval($leadData['leadScore'] ?? 0),
                intval($leadData['successProbability'] ?? 0),
                $leadData['recommendedAction'] ?? null,
                intval($leadData['callScore'] ?? 0),
                intval($leadData['emailScore'] ?? 0),
                $leadData['urgency'] ?? null,
                isset($leadData['painPoints']) ? json_encode($leadData['painPoints']) : null,
                isset($leadData['readyToCall']) ? ($leadData['readyToCall'] ? 1 : 0) : 0,
                isset($leadData['websiteAnalysis']) ? json_encode($leadData['websiteAnalysis']) : null,
                $searchQuery,
                $searchLocation,
                $searchSessionId
            ]);
            
            $saved++;
        } catch (Exception $e) {
            $errors[] = "Failed to save lead {$businessName}: " . $e->getMessage();
        }
    }
    
    // Track usage
    if ($saved > 0) {
        trackUsage($db, $user['id'], 'search', $saved);
    }
    
    sendJson([
        'success' => true,
        'data' => [
            'saved' => $saved,
            'updated' => $updated,
            'searchSessionId' => $searchSessionId,
            'errors' => $errors
        ]
    ]);
}

/**
 * DELETE - Remove search leads (by session or all)
 */
function handleDelete($db, $user) {
    $input = getJsonInput();
    
    $deleted = 0;
    
    if (isset($input['sessionId'])) {
        // Delete leads from a specific session
        $deleted = $db->delete(
            "DELETE FROM search_leads WHERE user_id = ? AND search_session_id = ?",
            [$user['id'], sanitizeInput($input['sessionId'])]
        );
    } elseif (isset($input['leadIds']) && is_array($input['leadIds'])) {
        // Delete specific leads
        $ids = array_map('sanitizeInput', $input['leadIds']);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $params = array_merge([$user['id']], $ids);
        
        $deleted = $db->delete(
            "DELETE FROM search_leads WHERE user_id = ? AND lead_id IN ($placeholders)",
            $params
        );
    } elseif (isset($input['clearAll']) && $input['clearAll']) {
        // Delete all leads for this user
        $deleted = $db->delete(
            "DELETE FROM search_leads WHERE user_id = ?",
            [$user['id']]
        );
    } else {
        sendError('Specify sessionId, leadIds array, or clearAll: true');
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
