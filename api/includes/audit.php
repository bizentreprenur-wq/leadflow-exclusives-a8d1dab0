<?php
/**
 * Audit Logging Helper for BamLead
 * Provides centralized audit trail functionality
 */

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/functions.php';

/**
 * Log an audit event
 * 
 * @param string $action The action being performed (e.g., 'login', 'lead_save')
 * @param string $category The category of action (auth, search, leads, email, etc.)
 * @param array $options Additional options:
 *   - user_id: User performing the action (null for unauthenticated)
 *   - entity_type: Type of entity affected (lead, template, campaign)
 *   - entity_id: ID of the affected entity
 *   - request_data: Sanitized request data (passwords will be removed)
 *   - metadata: Additional context
 *   - status: 'success', 'failure', or 'pending'
 *   - error_message: Error description if failed
 *   - duration_ms: Request duration in milliseconds
 *   - response_status: HTTP response code
 */
function auditLog($action, $category = 'system', $options = []) {
    try {
        $db = getDB();
        
        // Get client information
        $ip = getClientIP();
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) 
            ? substr($_SERVER['HTTP_USER_AGENT'], 0, 512) 
            : null;
        $requestMethod = $_SERVER['REQUEST_METHOD'] ?? null;
        $requestPath = isset($_SERVER['REQUEST_URI']) 
            ? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) 
            : null;
        
        // Sanitize request data - remove sensitive fields
        $requestData = null;
        if (!empty($options['request_data'])) {
            $requestData = sanitizeAuditData($options['request_data']);
        }
        
        // Prepare metadata
        $metadata = null;
        if (!empty($options['metadata'])) {
            $metadata = json_encode($options['metadata']);
        }
        
        $db->insert(
            "INSERT INTO audit_logs (
                user_id, action, category, entity_type, entity_id,
                ip_address, user_agent, request_method, request_path,
                request_data, response_status, metadata, status, error_message, duration_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $options['user_id'] ?? null,
                $action,
                $category,
                $options['entity_type'] ?? null,
                $options['entity_id'] ?? null,
                $ip,
                $userAgent,
                $requestMethod,
                $requestPath,
                $requestData ? json_encode($requestData) : null,
                $options['response_status'] ?? null,
                $metadata,
                $options['status'] ?? 'success',
                $options['error_message'] ?? null,
                $options['duration_ms'] ?? null
            ]
        );
        
        return true;
    } catch (Exception $e) {
        // Log to error log but don't fail the main request
        error_log("Audit logging failed: " . $e->getMessage());
        return false;
    }
}

/**
 * Shorthand for logging successful actions
 */
function auditSuccess($action, $category, $userId = null, $options = []) {
    $options['user_id'] = $userId;
    $options['status'] = 'success';
    return auditLog($action, $category, $options);
}

/**
 * Shorthand for logging failed actions
 */
function auditFailure($action, $category, $userId = null, $errorMessage = '', $options = []) {
    $options['user_id'] = $userId;
    $options['status'] = 'failure';
    $options['error_message'] = $errorMessage;
    return auditLog($action, $category, $options);
}

/**
 * Remove sensitive data from audit logs
 */
function sanitizeAuditData($data) {
    if (!is_array($data)) {
        return $data;
    }
    
    $sensitiveFields = [
        'password', 'password_hash', 'token', 'secret', 'api_key', 
        'apikey', 'access_token', 'refresh_token', 'private_key',
        'credit_card', 'card_number', 'cvv', 'ssn', 'secret_key',
        'authorization', 'auth_token', 'session_token', 'current_password',
        'new_password', 'confirm_password', 'client_secret'
    ];
    
    $sanitized = [];
    foreach ($data as $key => $value) {
        $keyLower = strtolower($key);
        
        // Check if key contains any sensitive field name
        $isSensitive = false;
        foreach ($sensitiveFields as $sensitive) {
            if (strpos($keyLower, $sensitive) !== false) {
                $isSensitive = true;
                break;
            }
        }
        
        if ($isSensitive) {
            $sanitized[$key] = '[REDACTED]';
        } elseif (is_array($value)) {
            $sanitized[$key] = sanitizeAuditData($value);
        } else {
            // Truncate very long values
            if (is_string($value) && strlen($value) > 500) {
                $sanitized[$key] = substr($value, 0, 500) . '...[truncated]';
            } else {
                $sanitized[$key] = $value;
            }
        }
    }
    
    return $sanitized;
}

/**
 * Get audit logs with filtering
 */
function getAuditLogs($filters = [], $page = 1, $limit = 50) {
    $db = getDB();
    
    $where = ['1=1'];
    $params = [];
    
    if (!empty($filters['user_id'])) {
        $where[] = 'user_id = ?';
        $params[] = $filters['user_id'];
    }
    
    if (!empty($filters['action'])) {
        $where[] = 'action = ?';
        $params[] = $filters['action'];
    }
    
    if (!empty($filters['category'])) {
        $where[] = 'category = ?';
        $params[] = $filters['category'];
    }
    
    if (!empty($filters['ip_address'])) {
        $where[] = 'ip_address = ?';
        $params[] = $filters['ip_address'];
    }
    
    if (!empty($filters['status'])) {
        $where[] = 'status = ?';
        $params[] = $filters['status'];
    }
    
    if (!empty($filters['entity_type'])) {
        $where[] = 'entity_type = ?';
        $params[] = $filters['entity_type'];
    }
    
    if (!empty($filters['entity_id'])) {
        $where[] = 'entity_id = ?';
        $params[] = $filters['entity_id'];
    }
    
    if (!empty($filters['date_from'])) {
        $where[] = 'created_at >= ?';
        $params[] = $filters['date_from'];
    }
    
    if (!empty($filters['date_to'])) {
        $where[] = 'created_at <= ?';
        $params[] = $filters['date_to'];
    }
    
    if (!empty($filters['search'])) {
        $where[] = '(action LIKE ? OR entity_id LIKE ? OR ip_address LIKE ? OR error_message LIKE ?)';
        $searchTerm = '%' . $filters['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get total count
    $countResult = $db->fetchOne(
        "SELECT COUNT(*) as total FROM audit_logs WHERE $whereClause",
        $params
    );
    $total = $countResult['total'] ?? 0;
    
    // Get paginated results
    $offset = ($page - 1) * $limit;
    $params[] = $limit;
    $params[] = $offset;
    
    $logs = $db->fetchAll(
        "SELECT al.*, u.email as user_email, u.name as user_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE $whereClause
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?",
        $params
    );
    
    // Parse JSON fields
    foreach ($logs as &$log) {
        if (!empty($log['request_data'])) {
            $log['request_data'] = json_decode($log['request_data'], true);
        }
        if (!empty($log['metadata'])) {
            $log['metadata'] = json_decode($log['metadata'], true);
        }
    }
    
    return [
        'logs' => $logs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ];
}

/**
 * Get audit statistics
 */
function getAuditStats($userId = null, $days = 30) {
    $db = getDB();
    
    $userFilter = $userId ? 'AND user_id = ?' : '';
    $params = $userId ? [$days, $userId] : [$days];
    
    // Actions by category
    $byCategory = $db->fetchAll(
        "SELECT category, COUNT(*) as count, 
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
         FROM audit_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter
         GROUP BY category
         ORDER BY count DESC",
        $params
    );
    
    // Top actions
    $topActions = $db->fetchAll(
        "SELECT action, category, COUNT(*) as count
         FROM audit_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter
         GROUP BY action, category
         ORDER BY count DESC
         LIMIT 20",
        $params
    );
    
    // Daily activity
    $dailyActivity = $db->fetchAll(
        "SELECT DATE(created_at) as date, COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT ip_address) as unique_ips
         FROM audit_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter
         GROUP BY DATE(created_at)
         ORDER BY date DESC",
        $params
    );
    
    // Top IPs (for security monitoring)
    $topIPs = $db->fetchAll(
        "SELECT ip_address, COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
         FROM audit_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter
         GROUP BY ip_address
         ORDER BY count DESC
         LIMIT 20",
        $params
    );
    
    // Failed actions (security alerts)
    $failedActions = $db->fetchAll(
        "SELECT action, category, ip_address, error_message, created_at
         FROM audit_logs 
         WHERE status = 'failure' 
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter
         ORDER BY created_at DESC
         LIMIT 50",
        $params
    );
    
    // Total counts
    $totals = $db->fetchOne(
        "SELECT 
            COUNT(*) as total_actions,
            COUNT(DISTINCT user_id) as total_users,
            COUNT(DISTINCT ip_address) as total_ips,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
            SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
         FROM audit_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) $userFilter",
        $params
    );
    
    return [
        'totals' => $totals,
        'by_category' => $byCategory,
        'top_actions' => $topActions,
        'daily_activity' => $dailyActivity,
        'top_ips' => $topIPs,
        'failed_actions' => $failedActions
    ];
}

/**
 * Clean up old audit logs
 * @param int $retentionDays Number of days to keep logs (default 365)
 */
function cleanupAuditLogs($retentionDays = 365) {
    try {
        $db = getDB();
        $deleted = $db->delete(
            "DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$retentionDays]
        );
        return $deleted;
    } catch (Exception $e) {
        error_log("Audit log cleanup failed: " . $e->getMessage());
        return false;
    }
}
