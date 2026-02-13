<?php
/**
 * Cron: Autonomous AI Agent Processing
 * Run every 5 min: */5 * * * * curl -s https://bamlead.com/api/cron-ai-agents.php?key=YOUR_CRON_KEY
 *
 * For Autopilot users: auto-dials leads, routes through agents, sends follow-ups
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/database.php';

$key = $_GET['key'] ?? '';
if ($key !== CRON_SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

$db = getDB();
$processed = 0;

// Get Autopilot users with enabled agents and provisioned numbers
$stmt = $db->prepare("
    SELECT u.id as user_id, cc.phone_number, s.plan
    FROM users u
    JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' AND LOWER(s.plan) = 'autopilot'
    JOIN calling_config cc ON cc.user_id = u.id AND cc.enabled = 1 AND cc.phone_number IS NOT NULL
    LIMIT 20
");
$stmt->execute();
$autopilotUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($autopilotUsers as $apUser) {
    // Get leads that haven't been called yet (from verified_leads or leads table)
    $stmt = $db->prepare("
        SELECT vl.id, vl.phone, vl.business_name
        FROM verified_leads vl
        WHERE vl.user_id = ? AND vl.phone IS NOT NULL AND vl.phone != ''
        AND vl.id NOT IN (SELECT COALESCE(lead_id,0) FROM ai_call_sessions WHERE user_id = ?)
        LIMIT 5
    ");
    $stmt->execute([$apUser['user_id'], $apUser['user_id']]);
    $leads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($leads as $lead) {
        // Initiate call via Twilio
        $sid = TWILIO_ACCOUNT_SID;
        $token = TWILIO_AUTH_TOKEN;
        if (!$sid || !$token) continue;

        $greeting = "Hi, this is BamLead calling on behalf of one of our clients. Do you have a moment to chat?";

        $callUrl = "https://api.twilio.com/2010-04-01/Accounts/$sid/Calls.json";
        $ch = curl_init($callUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => "$sid:$token",
            CURLOPT_POSTFIELDS => http_build_query([
                'To' => $lead['phone'],
                'From' => $apUser['phone_number'],
                'Twiml' => '<Response><Say voice="Polly.Joanna">' . htmlspecialchars($greeting) . '</Say><Pause length="60"/></Response>',
                'StatusCallback' => FRONTEND_URL . '/api/calling.php?action=status_callback&user_id=' . $apUser['user_id'],
                'StatusCallbackEvent' => 'initiated ringing answered completed',
            ]),
            CURLOPT_TIMEOUT => 15,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['sid'])) {
            // Log the session
            $stmt2 = $db->prepare("INSERT INTO ai_call_sessions (user_id, call_sid, lead_id, lead_phone, agent_role, tier_mode) VALUES (?,?,?,?,'qualifier','autopilot')");
            $stmt2->execute([$apUser['user_id'], $result['sid'], $lead['id'], $lead['phone']]);
            $processed++;
        }
    }
}

echo json_encode(['success' => true, 'processed' => $processed]);
