<?php
/**
 * User Branding API
 * Handles saving and loading user-specific branding settings (logo, company name, colors)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/auth.php';

// Authenticate user
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = $user['id'];
$action = $_GET['action'] ?? $_POST['action'] ?? 'get';

try {
    $db = getDatabase();
    
    // Check if table exists, provide migration hint if not
    try {
        $db->query("SELECT 1 FROM user_branding LIMIT 1");
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'user_branding table not found',
            'migration_needed' => true,
            'migration_file' => 'api/database/user_branding.sql'
        ]);
        exit;
    }
    
    switch ($action) {
        case 'get':
            // Fetch user branding
            $branding = $db->fetch(
                "SELECT logo_url, company_name, primary_color, email_signature, footer_text 
                 FROM user_branding WHERE user_id = ?",
                [$userId]
            );
            
            echo json_encode([
                'success' => true,
                'branding' => $branding ?: [
                    'logo_url' => null,
                    'company_name' => null,
                    'primary_color' => '#0ea5e9',
                    'email_signature' => null,
                    'footer_text' => null
                ]
            ]);
            break;
            
        case 'save':
            // Get input
            $input = json_decode(file_get_contents('php://input'), true);
            
            $logoUrl = $input['logo_url'] ?? null;
            $companyName = $input['company_name'] ?? null;
            $primaryColor = $input['primary_color'] ?? '#0ea5e9';
            $emailSignature = $input['email_signature'] ?? null;
            $footerText = $input['footer_text'] ?? null;
            
            // Validate logo size (base64 can be large)
            if ($logoUrl && strlen($logoUrl) > 5 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Logo too large (max 5MB)']);
                exit;
            }
            
            // Upsert branding
            $existing = $db->fetch("SELECT id FROM user_branding WHERE user_id = ?", [$userId]);
            
            if ($existing) {
                $db->query(
                    "UPDATE user_branding SET 
                        logo_url = ?, 
                        company_name = ?, 
                        primary_color = ?,
                        email_signature = ?,
                        footer_text = ?,
                        updated_at = NOW()
                     WHERE user_id = ?",
                    [$logoUrl, $companyName, $primaryColor, $emailSignature, $footerText, $userId]
                );
            } else {
                $db->insert(
                    "INSERT INTO user_branding (user_id, logo_url, company_name, primary_color, email_signature, footer_text) 
                     VALUES (?, ?, ?, ?, ?, ?)",
                    [$userId, $logoUrl, $companyName, $primaryColor, $emailSignature, $footerText]
                );
            }
            
            echo json_encode(['success' => true, 'message' => 'Branding saved']);
            break;
            
        case 'delete':
            // Remove logo only
            $db->query(
                "UPDATE user_branding SET logo_url = NULL, updated_at = NOW() WHERE user_id = ?",
                [$userId]
            );
            echo json_encode(['success' => true, 'message' => 'Logo removed']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
