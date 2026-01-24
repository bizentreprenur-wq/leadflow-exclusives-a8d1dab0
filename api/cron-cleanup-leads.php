<?php
/**
 * Cron Job: Cleanup Expired Search Leads
 * Deletes search leads older than 30 days
 * 
 * Set up in Hostinger cPanel → Cron Jobs:
 * Run daily: 0 2 * * * php /path/to/api/cron-cleanup-leads.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/database.php';

// Only allow CLI execution or with secret key
$isCliExecution = php_sapi_name() === 'cli';
$hasSecretKey = isset($_GET['key']) && $_GET['key'] === (defined('CRON_SECRET_KEY') ? CRON_SECRET_KEY : 'bamlead_cron_2024');

if (!$isCliExecution && !$hasSecretKey) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

try {
    $db = getDB();
    $startTime = microtime(true);
    
    // Delete search leads older than 30 days
    $deletedSearchLeads = $db->delete(
        "DELETE FROM search_leads WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    
    // Also clean up any orphaned verified leads older than 90 days that were never used
    $deletedVerifiedLeads = $db->delete(
        "DELETE FROM verified_leads WHERE 
         created_at < DATE_SUB(NOW(), INTERVAL 90 DAY) 
         AND outreach_status = 'pending'
         AND sent_at IS NULL"
    );
    
    // Clean up old usage tracking records (keep 90 days)
    $deletedUsageRecords = $db->delete(
        "DELETE FROM usage_tracking WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)"
    );
    
    $duration = round(microtime(true) - $startTime, 3);
    
    $result = [
        'success' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'deleted' => [
            'search_leads' => $deletedSearchLeads,
            'verified_leads' => $deletedVerifiedLeads,
            'usage_tracking' => $deletedUsageRecords
        ],
        'duration_seconds' => $duration
    ];
    
    // Log cleanup results
    error_log("[BamLead Cleanup] " . json_encode($result));
    
    // Output result
    if ($isCliExecution) {
        echo "BamLead Cleanup Results:\n";
        echo "- Search leads deleted: $deletedSearchLeads\n";
        echo "- Verified leads deleted: $deletedVerifiedLeads\n";
        echo "- Usage records deleted: $deletedUsageRecords\n";
        echo "- Duration: {$duration}s\n";
    } else {
        header('Content-Type: application/json');
        echo json_encode($result, JSON_PRETTY_PRINT);
    }
    
} catch (Exception $e) {
    error_log("[BamLead Cleanup Error] " . $e->getMessage());
    
    if ($isCliExecution) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
