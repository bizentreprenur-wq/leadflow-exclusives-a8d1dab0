<?php
/**
 * Google Calendar Events API
 * Create, list, and manage calendar events
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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

// Get user's calendar tokens
$db = getDB();
$pdo = $db->getConnection();
$stmt = $pdo->prepare('SELECT google_calendar_token, google_calendar_refresh_token FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

if (empty($userData['google_calendar_token'])) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Google Calendar not connected',
        'needs_auth' => true
    ]);
    exit;
}

$accessToken = $userData['google_calendar_token'];

// Helper function to refresh token if expired
function refreshAccessToken($refreshToken, $userId) {
    global $pdo;
    
    $tokenUrl = 'https://oauth2.googleapis.com/token';
    $tokenData = [
        'client_id' => GOOGLE_DRIVE_CLIENT_ID,
        'client_secret' => GOOGLE_DRIVE_CLIENT_SECRET,
        'refresh_token' => $refreshToken,
        'grant_type' => 'refresh_token'
    ];
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $tokens = json_decode($response, true);
    if (!empty($tokens['access_token'])) {
        $stmt = $pdo->prepare('UPDATE users SET google_calendar_token = ? WHERE id = ?');
        $stmt->execute([$tokens['access_token'], $userId]);
        return $tokens['access_token'];
    }
    
    return null;
}

// Helper function to make Google API requests
function googleCalendarRequest($endpoint, $method = 'GET', $data = null, $accessToken) {
    global $userData, $user;
    
    $url = 'https://www.googleapis.com/calendar/v3' . $endpoint;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // If token expired, try to refresh
    if ($httpCode === 401 && !empty($userData['google_calendar_refresh_token'])) {
        $newToken = refreshAccessToken($userData['google_calendar_refresh_token'], $user['id']);
        if ($newToken) {
            return googleCalendarRequest($endpoint, $method, $data, $newToken);
        }
    }
    
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        // List upcoming events
        $timeMin = urlencode(date('c'));
        $result = googleCalendarRequest("/calendars/primary/events?timeMin=$timeMin&maxResults=20&singleEvents=true&orderBy=startTime", 'GET', null, $accessToken);
        
        if ($result['code'] === 200) {
            echo json_encode([
                'success' => true,
                'events' => $result['body']['items'] ?? []
            ]);
        } else {
            http_response_code($result['code']);
            echo json_encode(['error' => 'Failed to fetch events', 'details' => $result['body']]);
        }
        break;
        
    case 'create':
        // Create a new event
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['summary']) || empty($input['start']) || empty($input['end'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: summary, start, end']);
            exit;
        }
        
        $eventData = [
            'summary' => $input['summary'],
            'description' => $input['description'] ?? '',
            'start' => [
                'dateTime' => $input['start'],
                'timeZone' => $input['timezone'] ?? 'UTC'
            ],
            'end' => [
                'dateTime' => $input['end'],
                'timeZone' => $input['timezone'] ?? 'UTC'
            ]
        ];
        
        // Add attendees if provided
        if (!empty($input['attendees'])) {
            $eventData['attendees'] = array_map(function($email) {
                return ['email' => $email];
            }, $input['attendees']);
        }
        
        // Add meet link if requested
        if (!empty($input['addMeet'])) {
            $eventData['conferenceData'] = [
                'createRequest' => [
                    'requestId' => uniqid(),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet']
                ]
            ];
        }
        
        $endpoint = '/calendars/primary/events';
        if (!empty($input['addMeet'])) {
            $endpoint .= '?conferenceDataVersion=1';
        }
        
        $result = googleCalendarRequest($endpoint, 'POST', $eventData, $accessToken);
        
        if ($result['code'] === 200 || $result['code'] === 201) {
            echo json_encode([
                'success' => true,
                'event' => $result['body'],
                'htmlLink' => $result['body']['htmlLink'] ?? null,
                'meetLink' => $result['body']['hangoutLink'] ?? null
            ]);
        } else {
            http_response_code($result['code']);
            echo json_encode(['error' => 'Failed to create event', 'details' => $result['body']]);
        }
        break;
        
    case 'delete':
        // Delete an event
        $eventId = $_GET['eventId'] ?? '';
        if (empty($eventId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID required']);
            exit;
        }
        
        $result = googleCalendarRequest("/calendars/primary/events/$eventId", 'DELETE', null, $accessToken);
        
        if ($result['code'] === 204 || $result['code'] === 200) {
            echo json_encode(['success' => true, 'message' => 'Event deleted']);
        } else {
            http_response_code($result['code']);
            echo json_encode(['error' => 'Failed to delete event']);
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}
