<?php
/**
 * AI Agents API — manages per-user agent configs, intent routing, and stats
 */
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/ratelimit.php';
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? '';
$db = getDB();

$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

enforceRateLimit($user, 'ai_agents');

try {
    switch ($action) {
        case 'get_config':     handleGetAgentConfig($db, $user); break;
        case 'save_config':    handleSaveAgentConfig($db, $user); break;
        case 'get_stats':      handleGetAgentStats($db, $user); break;
        case 'route_intent':   handleRouteIntent($db, $user); break;
        case 'log_session':    handleLogSession($db, $user); break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("AI Agents API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ─── Get all agent configs for user ──────────────────────────────────────────
function handleGetAgentConfig($db, $user) {
    $stmt = $db->prepare("SELECT * FROM ai_agents_config WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get user tier
    $tier = getUserTier($db, $user['id']);

    // Default agents if none configured
    $roles = ['qualifier', 'closer', 'scheduler'];
    $agentMap = [];
    foreach ($configs as $c) {
        $c['keywords'] = json_decode($c['keywords'] ?? '[]', true);
        $agentMap[$c['agent_role']] = $c;
    }

    $result = [];
    foreach ($roles as $role) {
        $result[$role] = $agentMap[$role] ?? [
            'agent_role' => $role,
            'enabled' => true,
            'system_prompt' => getDefaultPrompt($role),
            'greeting_message' => getDefaultGreeting($role),
            'keywords' => getDefaultKeywords($role),
        ];
    }

    echo json_encode(['success' => true, 'agents' => $result, 'tier' => $tier]);
}

// ─── Save agent config ──────────────────────────────────────────────────────
function handleSaveAgentConfig($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'POST required']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $role = $input['agent_role'] ?? '';
    if (!in_array($role, ['qualifier', 'closer', 'scheduler'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid agent role']);
        return;
    }

    $stmt = $db->prepare("
        INSERT INTO ai_agents_config (user_id, agent_role, enabled, system_prompt, greeting_message, keywords)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE enabled=VALUES(enabled), system_prompt=VALUES(system_prompt),
            greeting_message=VALUES(greeting_message), keywords=VALUES(keywords), updated_at=NOW()
    ");
    $stmt->execute([
        $user['id'],
        $role,
        $input['enabled'] ? 1 : 0,
        $input['system_prompt'] ?? '',
        $input['greeting_message'] ?? '',
        json_encode($input['keywords'] ?? []),
    ]);

    echo json_encode(['success' => true]);
}

// ─── Route intent to correct agent ──────────────────────────────────────────
function handleRouteIntent($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'POST required']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $text = strtolower(trim($input['text'] ?? ''));
    $callSid = $input['call_sid'] ?? '';

    // Load user's agent configs
    $stmt = $db->prepare("SELECT * FROM ai_agents_config WHERE user_id = ? AND enabled = 1");
    $stmt->execute([$user['id']]);
    $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $tier = getUserTier($db, $user['id']);

    // Intent detection (rule-based, no OpenAI)
    $intent = detectIntent($text);
    $agentRole = mapIntentToAgent($intent);

    // Find matching agent config
    $agentConfig = null;
    foreach ($agents as $a) {
        if ($a['agent_role'] === $agentRole) {
            $agentConfig = $a;
            break;
        }
    }

    // Generate response based on tier
    $response = generateAgentResponse($agentConfig, $text, $intent, $tier);

    echo json_encode([
        'success' => true,
        'agent_role' => $agentRole,
        'intent' => $intent,
        'response' => $response,
        'tier_mode' => $tier === 'autopilot' ? 'autopilot' : ($tier === 'pro' ? 'copilot' : 'manual'),
        'requires_approval' => $tier !== 'autopilot',
    ]);
}

// ─── Log completed call session ─────────────────────────────────────────────
function handleLogSession($db, $user) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'POST required']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $tier = getUserTier($db, $user['id']);

    $stmt = $db->prepare("
        INSERT INTO ai_call_sessions (user_id, call_sid, lead_id, lead_phone, agent_role, intent_detected, transcript, outcome, confidence_score, duration_seconds, tier_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $input['call_sid'] ?? '',
        $input['lead_id'] ?? null,
        $input['lead_phone'] ?? '',
        $input['agent_role'] ?? 'qualifier',
        $input['intent'] ?? '',
        json_encode($input['transcript'] ?? []),
        $input['outcome'] ?? 'qualified',
        $input['confidence_score'] ?? 0,
        $input['duration_seconds'] ?? 0,
        $tier === 'autopilot' ? 'autopilot' : ($tier === 'pro' ? 'copilot' : 'manual'),
    ]);

    // Update daily stats
    $today = date('Y-m-d');
    $stmt = $db->prepare("
        INSERT INTO ai_agent_stats (user_id, agent_role, stat_date, calls_handled, leads_qualified, leads_converted)
        VALUES (?, ?, ?, 1, ?, ?)
        ON DUPLICATE KEY UPDATE calls_handled = calls_handled + 1,
            leads_qualified = leads_qualified + VALUES(leads_qualified),
            leads_converted = leads_converted + VALUES(leads_converted)
    ");
    $isQualified = in_array($input['outcome'] ?? '', ['qualified', 'proposal_sent', 'appointment_booked']) ? 1 : 0;
    $isConverted = in_array($input['outcome'] ?? '', ['proposal_sent', 'appointment_booked']) ? 1 : 0;
    $stmt->execute([$user['id'], $input['agent_role'] ?? 'qualifier', $today, $isQualified, $isConverted]);

    echo json_encode(['success' => true]);
}

// ─── Get agent stats ────────────────────────────────────────────────────────
function handleGetAgentStats($db, $user) {
    $days = min((int)($_GET['days'] ?? 30), 90);
    $since = date('Y-m-d', strtotime("-{$days} days"));

    $stmt = $db->prepare("
        SELECT agent_role,
            SUM(calls_handled) as total_calls,
            SUM(leads_qualified) as total_qualified,
            SUM(leads_converted) as total_converted,
            AVG(avg_duration_seconds) as avg_duration,
            AVG(success_rate) as avg_success_rate
        FROM ai_agent_stats
        WHERE user_id = ? AND stat_date >= ?
        GROUP BY agent_role
    ");
    $stmt->execute([$user['id'], $since]);
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'stats' => $stats]);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUserTier($db, $userId) {
    $stmt = $db->prepare("SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$userId]);
    $sub = $stmt->fetch(PDO::FETCH_ASSOC);
    return $sub ? strtolower($sub['plan']) : 'basic';
}

function detectIntent($text) {
    $intents = [
        'proposal'    => ['proposal', 'pricing', 'quote', 'cost', 'price', 'package', 'contract'],
        'appointment' => ['schedule', 'book', 'meeting', 'calendar', 'appointment', 'available', 'time slot'],
        'objection'   => ['expensive', 'too much', 'not sure', 'competitor', 'think about', 'budget'],
        'interest'    => ['interested', 'tell me more', 'how does', 'what do you', 'learn more'],
        'not_interested' => ['not interested', 'no thanks', 'stop calling', 'remove me', 'do not call'],
    ];

    foreach ($intents as $intent => $keywords) {
        foreach ($keywords as $kw) {
            if (strpos($text, $kw) !== false) return $intent;
        }
    }
    return 'general';
}

function mapIntentToAgent($intent) {
    $map = [
        'interest'        => 'qualifier',
        'general'         => 'qualifier',
        'objection'       => 'closer',
        'proposal'        => 'closer',
        'appointment'     => 'scheduler',
        'not_interested'  => 'qualifier',
    ];
    return $map[$intent] ?? 'qualifier';
}

function generateAgentResponse($config, $text, $intent, $tier) {
    // Rule-based responses (no OpenAI)
    $responses = [
        'qualifier' => [
            'interest'    => "That's great to hear! Could you tell me a bit about what you're looking for?",
            'general'     => "Hi there! I'd love to learn more about your business needs. What's your biggest challenge right now?",
            'not_interested' => "I understand. Thank you for your time. Have a great day!",
        ],
        'closer' => [
            'objection'  => "I completely understand your concern. Let me show you how this pays for itself within the first month.",
            'proposal'   => "Absolutely! I'll prepare a custom proposal based on what we discussed. You'll have it in your inbox shortly.",
        ],
        'scheduler' => [
            'appointment' => "Perfect! Let me check availability. What day and time works best for you?",
        ],
    ];

    $role = mapIntentToAgent($intent);
    return $responses[$role][$intent] ?? "Thank you for sharing that. Let me connect you with the right person.";
}

function getDefaultPrompt($role) {
    $prompts = [
        'qualifier' => 'You are a friendly lead qualifier. Ask about their needs, budget range, and timeline. Be conversational and helpful.',
        'closer'    => 'You are a persuasive closer. Handle objections with empathy, highlight ROI, and guide toward a proposal or demo.',
        'scheduler' => 'You are an efficient scheduler. Confirm appointment details, sync with calendar, and send confirmations.',
    ];
    return $prompts[$role] ?? '';
}

function getDefaultGreeting($role) {
    $greetings = [
        'qualifier' => 'Hi! Thanks for your interest. I have a few quick questions to help us serve you better.',
        'closer'    => 'Great speaking with you! Based on what I heard, I think we have a perfect solution.',
        'scheduler' => 'Let me help you find the perfect time for a meeting.',
    ];
    return $greetings[$role] ?? '';
}

function getDefaultKeywords($role) {
    $kw = [
        'qualifier' => ['interested', 'tell me more', 'what do you offer', 'how does it work'],
        'closer'    => ['pricing', 'proposal', 'too expensive', 'competitor'],
        'scheduler' => ['book', 'schedule', 'calendar', 'meeting', 'appointment'],
    ];
    return $kw[$role] ?? [];
}
