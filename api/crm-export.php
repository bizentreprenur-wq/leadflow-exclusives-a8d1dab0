<?php
/**
 * CRM Lead Export API
 * Exports leads to HubSpot, Salesforce, Pipedrive using stored OAuth tokens
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
require_once __DIR__ . '/includes/database.php';

// Verify user is authenticated
$user = authenticateRequest();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$provider = $input['provider'] ?? '';
$leads = $input['leads'] ?? [];

if (empty($provider)) {
    http_response_code(400);
    echo json_encode(['error' => 'Provider required']);
    exit;
}

if (empty($leads)) {
    http_response_code(400);
    echo json_encode(['error' => 'No leads to export']);
    exit;
}

// Get user's CRM tokens
$db = getDB();
$pdo = $db->getConnection();
$stmt = $pdo->prepare('
    SELECT hubspot_token, salesforce_token, salesforce_instance_url, 
           pipedrive_token, pipedrive_api_domain
    FROM users WHERE id = ?
');
$stmt->execute([$user['id']]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

$tokenField = "{$provider}_token";
$accessToken = $userData[$tokenField] ?? null;

if (empty($accessToken)) {
    http_response_code(403);
    echo json_encode([
        'error' => ucfirst($provider) . ' not connected',
        'needs_auth' => true
    ]);
    exit;
}

$results = ['success' => 0, 'failed' => 0, 'errors' => []];

// Export based on provider
switch ($provider) {
    case 'hubspot':
        $results = exportToHubSpot($leads, $accessToken);
        break;
    case 'salesforce':
        $instanceUrl = $userData['salesforce_instance_url'] ?? null;
        $results = exportToSalesforce($leads, $accessToken, $instanceUrl);
        break;
    case 'pipedrive':
        $apiDomain = $userData['pipedrive_api_domain'] ?? 'api.pipedrive.com';
        $results = exportToPipedrive($leads, $accessToken, $apiDomain);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unsupported provider']);
        exit;
}

echo json_encode([
    'success' => true,
    'results' => $results,
    'message' => "Exported {$results['success']} leads to " . ucfirst($provider)
]);

/**
 * Export leads to HubSpot
 */
function exportToHubSpot($leads, $accessToken) {
    $results = ['success' => 0, 'failed' => 0, 'errors' => []];
    
    foreach ($leads as $lead) {
        // First create company
        $companyData = [
            'properties' => [
                'name' => $lead['name'] ?? $lead['business_name'] ?? 'Unknown',
                'phone' => $lead['phone'] ?? '',
                'website' => $lead['website'] ?? '',
                'address' => $lead['address'] ?? '',
                'description' => 'Imported from BamLead. ' . 
                    ($lead['ai_insights'] ?? ''),
            ]
        ];
        
        $ch = curl_init('https://api.hubapi.com/crm/v3/objects/companies');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($companyData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            $results['success']++;
            
            // If email exists, create contact and associate
            if (!empty($lead['email'])) {
                $companyId = json_decode($response, true)['id'] ?? null;
                if ($companyId) {
                    createHubSpotContact($lead, $accessToken, $companyId);
                }
            }
        } else {
            $results['failed']++;
            $error = json_decode($response, true);
            $results['errors'][] = [
                'lead' => $lead['name'] ?? 'Unknown',
                'error' => $error['message'] ?? 'Unknown error'
            ];
        }
    }
    
    return $results;
}

function createHubSpotContact($lead, $accessToken, $companyId) {
    $contactData = [
        'properties' => [
            'email' => $lead['email'],
            'firstname' => $lead['name'] ?? $lead['business_name'] ?? '',
            'phone' => $lead['phone'] ?? '',
        ],
        'associations' => [
            [
                'to' => ['id' => $companyId],
                'types' => [['associationCategory' => 'HUBSPOT_DEFINED', 'associationTypeId' => 2]]
            ]
        ]
    ];
    
    $ch = curl_init('https://api.hubapi.com/crm/v3/objects/contacts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($contactData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Export leads to Salesforce
 */
function exportToSalesforce($leads, $accessToken, $instanceUrl) {
    $results = ['success' => 0, 'failed' => 0, 'errors' => []];
    
    if (empty($instanceUrl)) {
        $results['errors'][] = 'Salesforce instance URL not configured';
        return $results;
    }
    
    foreach ($leads as $lead) {
        $leadData = [
            'Company' => $lead['name'] ?? $lead['business_name'] ?? 'Unknown',
            'LastName' => $lead['name'] ?? 'Lead',
            'Phone' => $lead['phone'] ?? '',
            'Website' => $lead['website'] ?? '',
            'Street' => $lead['address'] ?? '',
            'Email' => $lead['email'] ?? '',
            'Description' => 'Imported from BamLead. ' . ($lead['ai_insights'] ?? ''),
            'LeadSource' => 'BamLead',
        ];
        
        $ch = curl_init($instanceUrl . '/services/data/v58.0/sobjects/Lead');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            $results['success']++;
        } else {
            $results['failed']++;
            $error = json_decode($response, true);
            $results['errors'][] = [
                'lead' => $lead['name'] ?? 'Unknown',
                'error' => $error[0]['message'] ?? 'Unknown error'
            ];
        }
    }
    
    return $results;
}

/**
 * Export leads to Pipedrive
 */
function exportToPipedrive($leads, $accessToken, $apiDomain) {
    $results = ['success' => 0, 'failed' => 0, 'errors' => []];
    
    foreach ($leads as $lead) {
        // Create organization first
        $orgData = [
            'name' => $lead['name'] ?? $lead['business_name'] ?? 'Unknown',
            'address' => $lead['address'] ?? '',
            'visible_to' => 3, // Entire company
        ];
        
        $ch = curl_init("https://{$apiDomain}/v1/organizations");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orgData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $responseData = json_decode($response, true);
        
        if ($httpCode === 200 || $httpCode === 201) {
            $results['success']++;
            
            // Create person if email exists
            $orgId = $responseData['data']['id'] ?? null;
            if (!empty($lead['email']) && $orgId) {
                createPipedrivePerson($lead, $accessToken, $apiDomain, $orgId);
            }
        } else {
            $results['failed']++;
            $results['errors'][] = [
                'lead' => $lead['name'] ?? 'Unknown',
                'error' => $responseData['error'] ?? 'Unknown error'
            ];
        }
    }
    
    return $results;
}

function createPipedrivePerson($lead, $accessToken, $apiDomain, $orgId) {
    $personData = [
        'name' => $lead['name'] ?? $lead['business_name'] ?? 'Unknown',
        'email' => [$lead['email']],
        'phone' => !empty($lead['phone']) ? [$lead['phone']] : [],
        'org_id' => $orgId,
        'visible_to' => 3,
    ];
    
    $ch = curl_init("https://{$apiDomain}/v1/persons");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($personData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_exec($ch);
    curl_close($ch);
}
