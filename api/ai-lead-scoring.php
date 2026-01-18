<?php
/**
 * AI-Powered Lead Scoring and Insights API
 * Uses OpenAI to analyze leads and provide intelligent recommendations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

// Verify user is authenticated
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$leads = $input['leads'] ?? [];
$analysisType = $input['type'] ?? 'score';

if (empty($leads)) {
    http_response_code(400);
    echo json_encode(['error' => 'No leads provided']);
    exit;
}

// Check if OpenAI is configured
if (empty(OPENAI_API_KEY) || OPENAI_API_KEY === 'sk-YOUR_OPENAI_KEY_HERE') {
    // Fallback to rule-based scoring
    $results = ruleBasedScoring($leads);
    echo json_encode([
        'success' => true,
        'results' => $results,
        'method' => 'rule_based'
    ]);
    exit;
}

switch ($analysisType) {
    case 'score':
        $results = aiLeadScoring($leads);
        break;
    case 'prioritize':
        $results = aiLeadPrioritization($leads);
        break;
    case 'insights':
        $results = aiLeadInsights($leads);
        break;
    case 'email_angle':
        $results = aiEmailAngle($leads);
        break;
    default:
        $results = aiLeadScoring($leads);
}

echo json_encode([
    'success' => true,
    'results' => $results,
    'method' => 'ai_powered'
]);

/**
 * AI-powered lead scoring
 */
function aiLeadScoring($leads) {
    $prompt = "You are a sales intelligence AI. Analyze these business leads and score them from 0-100 based on conversion potential. Consider:\n";
    $prompt .= "- Website quality and platform\n";
    $prompt .= "- Business type and industry\n";
    $prompt .= "- Contact information completeness\n";
    $prompt .= "- Location and market potential\n\n";
    $prompt .= "Return JSON array with: id, score (0-100), priority (high/medium/low), reasoning (brief)\n\n";
    $prompt .= "Leads:\n" . json_encode(array_slice($leads, 0, 20)); // Limit to 20 leads
    
    $response = callOpenAI($prompt);
    
    if (!$response) {
        return ruleBasedScoring($leads);
    }
    
    return $response;
}

/**
 * AI-powered lead prioritization
 */
function aiLeadPrioritization($leads) {
    $prompt = "You are a sales strategist. Prioritize these leads for outreach. Group them into:\n";
    $prompt .= "1. HOT: Contact immediately, high conversion probability\n";
    $prompt .= "2. WARM: Good potential, follow up within 48 hours\n";
    $prompt .= "3. NURTURE: Long-term prospects, add to drip campaign\n\n";
    $prompt .= "Return JSON: { hot: [...ids], warm: [...ids], nurture: [...ids], insights: string }\n\n";
    $prompt .= "Leads:\n" . json_encode(array_slice($leads, 0, 20));
    
    $response = callOpenAI($prompt);
    
    if (!$response) {
        return fallbackPrioritization($leads);
    }
    
    return $response;
}

/**
 * AI-powered lead insights
 */
function aiLeadInsights($leads) {
    $prompt = "Analyze these business leads and provide actionable insights:\n\n";
    $prompt .= "1. Common patterns (industries, website issues, locations)\n";
    $prompt .= "2. Best outreach times and methods\n";
    $prompt .= "3. Potential pain points to address\n";
    $prompt .= "4. Recommended talking points\n\n";
    $prompt .= "Return JSON: { patterns: [], recommendations: [], painPoints: [], talkingPoints: [] }\n\n";
    $prompt .= "Leads:\n" . json_encode(array_slice($leads, 0, 20));
    
    return callOpenAI($prompt);
}

/**
 * AI-powered email angle suggestions
 */
function aiEmailAngle($leads) {
    $prompt = "You are an expert email marketer. For each lead, suggest the best email approach:\n\n";
    $prompt .= "Consider: their website quality, industry, and potential pain points.\n";
    $prompt .= "Return JSON array with: id, subject_line, opening_hook, cta, tone (professional/casual/urgent)\n\n";
    $prompt .= "Leads:\n" . json_encode(array_slice($leads, 0, 10));
    
    return callOpenAI($prompt);
}

/**
 * Call OpenAI API
 */
function callOpenAI($prompt) {
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    
    $data = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => 'You are a B2B sales intelligence AI. Always respond with valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 2000,
        'response_format' => ['type' => 'json_object']
    ];
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENAI_API_KEY,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return null;
    }
    
    $result = json_decode($response, true);
    $content = $result['choices'][0]['message']['content'] ?? null;
    
    if ($content) {
        return json_decode($content, true);
    }
    
    return null;
}

/**
 * Rule-based scoring fallback
 */
function ruleBasedScoring($leads) {
    $scored = [];
    
    foreach ($leads as $lead) {
        $score = 50; // Base score
        
        // Has website
        if (!empty($lead['website'])) $score += 10;
        
        // Has email
        if (!empty($lead['email'])) $score += 15;
        
        // Has phone
        if (!empty($lead['phone'])) $score += 10;
        
        // Website needs upgrade (good prospect)
        if (!empty($lead['websiteAnalysis']['needsUpgrade'])) $score += 10;
        
        // Has low mobile score
        if (isset($lead['websiteAnalysis']['mobileScore']) && $lead['websiteAnalysis']['mobileScore'] < 70) $score += 5;
        
        // Has issues
        if (!empty($lead['websiteAnalysis']['issues'])) {
            $score += min(count($lead['websiteAnalysis']['issues']) * 3, 15);
        }
        
        // Determine priority
        $priority = 'low';
        if ($score >= 80) $priority = 'high';
        elseif ($score >= 60) $priority = 'medium';
        
        $scored[] = [
            'id' => $lead['id'] ?? uniqid(),
            'name' => $lead['name'] ?? $lead['business_name'] ?? 'Unknown',
            'score' => min($score, 100),
            'priority' => $priority,
            'reasoning' => generateReasoning($lead, $score, $priority)
        ];
    }
    
    // Sort by score descending
    usort($scored, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    return $scored;
}

function generateReasoning($lead, $score, $priority) {
    $reasons = [];
    
    if (!empty($lead['website'])) $reasons[] = 'Has website';
    if (!empty($lead['email'])) $reasons[] = 'Email available';
    if (!empty($lead['phone'])) $reasons[] = 'Phone available';
    if (!empty($lead['websiteAnalysis']['needsUpgrade'])) $reasons[] = 'Website needs upgrade';
    if (!empty($lead['websiteAnalysis']['issues'])) $reasons[] = count($lead['websiteAnalysis']['issues']) . ' website issues';
    
    return implode(', ', $reasons) ?: 'Basic lead information';
}

function fallbackPrioritization($leads) {
    $scored = ruleBasedScoring($leads);
    
    $hot = array_filter($scored, fn($l) => $l['priority'] === 'high');
    $warm = array_filter($scored, fn($l) => $l['priority'] === 'medium');
    $nurture = array_filter($scored, fn($l) => $l['priority'] === 'low');
    
    return [
        'hot' => array_values(array_map(fn($l) => $l['id'], $hot)),
        'warm' => array_values(array_map(fn($l) => $l['id'], $warm)),
        'nurture' => array_values(array_map(fn($l) => $l['id'], $nurture)),
        'insights' => 'Leads prioritized based on contact completeness and website quality.',
        'scored' => $scored
    ];
}
