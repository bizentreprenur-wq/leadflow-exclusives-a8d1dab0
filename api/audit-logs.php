<?php
/**
 * Audit Logs API Endpoint
 * Provides access to audit logs for administrators
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/ratelimit.php';
header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/audit.php';

// All endpoints require admin access
$user = requireAdmin();

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        handleList($user);
        break;
    case 'stats':
        handleStats($user);
        break;
    case 'export':
        handleExport($user);
        break;
    case 'user-activity':
        handleUserActivity($user);
        break;
    case 'security-alerts':
        handleSecurityAlerts($user);
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * List audit logs with filtering
 */
function handleList($user) {
    $page = intval($_GET['page'] ?? 1);
    $limit = min(intval($_GET['limit'] ?? 50), 200);
    
    $filters = [
        'user_id' => $_GET['user_id'] ?? null,
        'action' => $_GET['action_filter'] ?? null,
        'category' => $_GET['category'] ?? null,
        'ip_address' => $_GET['ip'] ?? null,
        'status' => $_GET['status'] ?? null,
        'entity_type' => $_GET['entity_type'] ?? null,
        'entity_id' => $_GET['entity_id'] ?? null,
        'date_from' => $_GET['date_from'] ?? null,
        'date_to' => $_GET['date_to'] ?? null,
        'search' => $_GET['search'] ?? null,
    ];
    
    // Remove empty filters
    $filters = array_filter($filters, fn($v) => $v !== null && $v !== '');
    
    $result = getAuditLogs($filters, $page, $limit);
    
    // Log this admin action
    auditSuccess('audit_logs_view', 'admin', $user['id'], [
        'metadata' => ['filters' => $filters, 'page' => $page]
    ]);
    
    sendJson([
        'success' => true,
        'data' => $result['logs'],
        'pagination' => $result['pagination']
    ]);
}

/**
 * Get audit statistics
 */
function handleStats($user) {
    $days = min(intval($_GET['days'] ?? 30), 365);
    $userId = $_GET['user_id'] ?? null;
    
    $stats = getAuditStats($userId, $days);
    
    auditSuccess('audit_stats_view', 'admin', $user['id'], [
        'metadata' => ['days' => $days, 'target_user' => $userId]
    ]);
    
    sendJson([
        'success' => true,
        'data' => $stats
    ]);
}

/**
 * Export audit logs as CSV
 */
function handleExport($user) {
    $days = min(intval($_GET['days'] ?? 30), 365);
    
    $filters = [
        'date_from' => date('Y-m-d H:i:s', strtotime("-$days days"))
    ];
    
    if (!empty($_GET['category'])) {
        $filters['category'] = $_GET['category'];
    }
    
    // Get all logs (no pagination for export)
    $db = getDB();
    
    $where = ['created_at >= ?'];
    $params = [$filters['date_from']];
    
    if (!empty($filters['category'])) {
        $where[] = 'category = ?';
        $params[] = $filters['category'];
    }
    
    $whereClause = implode(' AND ', $where);
    
    $logs = $db->fetchAll(
        "SELECT al.*, u.email as user_email
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE $whereClause
         ORDER BY al.created_at DESC
         LIMIT 10000",
        $params
    );
    
    // Log export action
    auditSuccess('audit_logs_export', 'admin', $user['id'], [
        'metadata' => ['days' => $days, 'count' => count($logs)]
    ]);
    
    // Generate CSV
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="audit_logs_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Header row
    fputcsv($output, [
        'ID', 'Timestamp', 'User Email', 'Action', 'Category', 
        'Entity Type', 'Entity ID', 'IP Address', 'Status', 
        'Error Message', 'Duration (ms)', 'Request Method', 'Request Path'
    ]);
    
    foreach ($logs as $log) {
        fputcsv($output, [
            $log['id'],
            $log['created_at'],
            $log['user_email'] ?? 'Anonymous',
            $log['action'],
            $log['category'],
            $log['entity_type'] ?? '',
            $log['entity_id'] ?? '',
            $log['ip_address'],
            $log['status'],
            $log['error_message'] ?? '',
            $log['duration_ms'] ?? '',
            $log['request_method'] ?? '',
            $log['request_path'] ?? ''
        ]);
    }
    
    fclose($output);
    exit;
}

/**
 * Get user-specific activity
 */
function handleUserActivity($user) {
    $targetUserId = $_GET['user_id'] ?? null;
    
    if (!$targetUserId) {
        sendError('User ID required', 400);
    }
    
    $page = intval($_GET['page'] ?? 1);
    $limit = min(intval($_GET['limit'] ?? 50), 200);
    
    $result = getAuditLogs(['user_id' => $targetUserId], $page, $limit);
    
    // Get user info
    $db = getDB();
    $targetUser = $db->fetchOne(
        "SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?",
        [$targetUserId]
    );
    
    auditSuccess('user_activity_view', 'admin', $user['id'], [
        'entity_type' => 'user',
        'entity_id' => $targetUserId
    ]);
    
    sendJson([
        'success' => true,
        'user' => $targetUser,
        'data' => $result['logs'],
        'pagination' => $result['pagination']
    ]);
}

/**
 * Get security alerts (failed actions, suspicious IPs)
 */
function handleSecurityAlerts($user) {
    $db = getDB();
    $days = min(intval($_GET['days'] ?? 7), 30);
    
    // Failed logins by IP
    $failedLogins = $db->fetchAll(
        "SELECT ip_address, COUNT(*) as attempts, 
                MAX(created_at) as last_attempt,
                GROUP_CONCAT(DISTINCT user_id) as user_ids
         FROM audit_logs 
         WHERE action = 'login_failed' 
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY ip_address
         HAVING attempts >= 3
         ORDER BY attempts DESC
         LIMIT 50",
        [$days]
    );
    
    // IPs with many failures
    $suspiciousIPs = $db->fetchAll(
        "SELECT ip_address, COUNT(*) as failure_count,
                GROUP_CONCAT(DISTINCT action) as failed_actions
         FROM audit_logs 
         WHERE status = 'failure'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY ip_address
         HAVING failure_count >= 5
         ORDER BY failure_count DESC
         LIMIT 50",
        [$days]
    );
    
    // Recent security-related failures
    $recentFailures = $db->fetchAll(
        "SELECT al.*, u.email as user_email
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.status = 'failure'
         AND al.category IN ('auth', 'admin', 'payment')
         AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY al.created_at DESC
         LIMIT 100",
        [$days]
    );
    
    // Rate limit violations
    $rateLimits = $db->fetchAll(
        "SELECT ip_address, COUNT(*) as count, MAX(created_at) as last_attempt
         FROM audit_logs 
         WHERE action = 'rate_limit_exceeded'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY ip_address
         ORDER BY count DESC
         LIMIT 50",
        [$days]
    );
    
    auditSuccess('security_alerts_view', 'admin', $user['id'], [
        'metadata' => ['days' => $days]
    ]);
    
    sendJson([
        'success' => true,
        'data' => [
            'failed_logins' => $failedLogins,
            'suspicious_ips' => $suspiciousIPs,
            'recent_failures' => $recentFailures,
            'rate_limit_violations' => $rateLimits
        ]
    ]);
}
