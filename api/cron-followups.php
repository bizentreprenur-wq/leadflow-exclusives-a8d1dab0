<?php
/**
 * Cron Job: Process scheduled follow-ups
 * 
 * Run every minute: * * * * * curl -s https://bamlead.com/api/cron-followups.php?key=YOUR_CRON_KEY
 * 
 * Handles:
 *  - Sending scheduled SMS follow-ups via Twilio
 *  - Marking callback reminders as ready (frontend polls these)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/database.php';

// Verify cron secret
$key = $_GET['key'] ?? '';
if ($key !== CRON_SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

$db = getDB();
$now = date('Y-m-d H:i:s');
$processed = 0;

// Fetch pending follow-ups that are due
$stmt = $db->prepare("SELECT * FROM call_followups WHERE status = 'pending' AND scheduled_for <= ? ORDER BY scheduled_for ASC LIMIT 50");
$stmt->execute([$now]);
$followups = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($followups as $fu) {
    try {
        if ($fu['followup_type'] === 'sms' && $fu['sms_message'] && $fu['lead_phone']) {
            // Send SMS via Twilio
            $sent = sendFollowupSMS($db, $fu);
            $newStatus = $sent ? 'sent' : 'failed';
        } elseif ($fu['followup_type'] === 'callback') {
            // For callbacks, just mark as completed — the frontend polls pending callbacks
            // and shows them as reminders in the UI
            $newStatus = 'completed';
        } else {
            $newStatus = 'failed';
        }

        $stmt2 = $db->prepare("UPDATE call_followups SET status = ?, executed_at = NOW() WHERE id = ?");
        $stmt2->execute([$newStatus, $fu['id']]);
        $processed++;

    } catch (Exception $e) {
        error_log("Follow-up processing error (ID {$fu['id']}): " . $e->getMessage());
        $stmt2 = $db->prepare("UPDATE call_followups SET status = 'failed', notes = CONCAT(COALESCE(notes,''), ' | Error: " . addslashes($e->getMessage()) . "') WHERE id = ?");
        $stmt2->execute([$fu['id']]);
    }
}

echo json_encode(['success' => true, 'processed' => $processed, 'total_pending' => count($followups)]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendFollowupSMS($db, $followup) {
    $sid   = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
    $token = defined('TWILIO_AUTH_TOKEN') ? TWILIO_AUTH_TOKEN : '';
    if (!$sid || !$token) {
        error_log("Twilio not configured — skipping SMS follow-up ID {$followup['id']}");
        return false;
    }

    // Get user's phone number
    $stmt = $db->prepare("SELECT phone_number FROM calling_config WHERE user_id = ?");
    $stmt->execute([$followup['user_id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    $from = $config['phone_number'] ?? '';

    if (!$from) {
        error_log("No from-number for user {$followup['user_id']} — skipping SMS follow-up");
        return false;
    }

    $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_USERPWD => "$sid:$token",
        CURLOPT_POSTFIELDS => http_build_query([
            'To'   => $followup['lead_phone'],
            'From' => $from,
            'Body' => $followup['sms_message'],
        ]),
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        // Also log it in sms_messages if that table exists
        $msgId = 'fu_' . $followup['id'] . '_' . time();
        try {
            $stmt = $db->prepare("INSERT INTO sms_messages (id, user_id, lead_id, lead_phone, lead_name, direction, message, status, created_at) VALUES (?,?,?,?,?,'outbound',?,'sent',NOW())");
            $stmt->execute([$msgId, $followup['user_id'], $followup['lead_id'], $followup['lead_phone'], $followup['lead_name'], $followup['sms_message']]);
        } catch (Exception $e) {
            // sms_messages table might not exist — non-critical
        }
        return true;
    }

    error_log("Twilio SMS failed (HTTP $httpCode): $response");
    return false;
}
