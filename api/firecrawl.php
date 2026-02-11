<?php
/**
 * Firecrawl API Integration
 * 
 * Scrapes websites for contact information, social profiles, and tech stack.
 * Used for lead enrichment after initial Serper discovery.
 * 
 * Endpoints:
 * - POST /firecrawl.php?action=scrape - Scrape a single URL
 * - POST /firecrawl.php?action=batch - Queue batch enrichment
 * - GET /firecrawl.php?action=status&session_id=xxx - Get enrichment status
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/database.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? $_POST['action'] ?? 'scrape';

switch ($action) {
    case 'scrape':
        handleScrape();
        break;
    case 'batch':
        handleBatchEnrichment();
        break;
    case 'status':
        handleEnrichmentStatus();
        break;
    case 'process':
        processEnrichmentQueue();
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Scrape a single URL using Firecrawl
 */
function handleScrape() {
    $input = getJsonInput();
    $url = trim($input['url'] ?? '');
    $searchType = $input['searchType'] ?? 'gmb'; // 'gmb' or 'platform'
    
    if (empty($url)) {
        sendError('URL is required');
    }
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        sendError('Invalid URL format');
    }
    
    // Check cache first
    $cacheKey = "firecrawl_" . md5($url . $searchType);
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        sendJson([
            'success' => true,
            'data' => $cached,
            'cached' => true
        ]);
    }
    
    try {
        $result = firecrawlScrape($url, $searchType);
        
        // Cache for 24 hours
        setCache($cacheKey, $result, 86400);
        
        sendJson([
            'success' => true,
            'data' => $result,
            'cached' => false
        ]);
    } catch (Exception $e) {
        sendJson([
            'success' => false,
            'error' => DEBUG_MODE ? $e->getMessage() : 'Failed to scrape website',
            'data' => getEmptyEnrichmentData()
        ]);
    }
}

/**
 * Queue batch of URLs for background enrichment
 */
function handleBatchEnrichment() {
    $input = getJsonInput();
    $leads = $input['leads'] ?? [];
    $sessionId = $input['sessionId'] ?? uniqid('enrich_');
    $searchType = $input['searchType'] ?? 'gmb';
    
    if (empty($leads) || !is_array($leads)) {
        sendError('Leads array is required');
    }
    
    $pdo = getDbConnection();
    
    // Ensure enrichment queue table exists
    ensureEnrichmentQueueTable($pdo);
    
    $queued = 0;
    $skipped = 0;
    
    foreach ($leads as $lead) {
        $url = trim($lead['website'] ?? $lead['url'] ?? '');
        $leadId = $lead['id'] ?? $lead['leadId'] ?? uniqid('lead_');
        
        if (empty($url)) {
            $skipped++;
            continue;
        }
        
        // Ensure URL has protocol
        if (!preg_match('/^https?:\/\//', $url)) {
            $url = 'https://' . $url;
        }
        
        // Check if already queued or completed
        $existing = $pdo->prepare("SELECT status FROM enrichment_queue WHERE lead_id = ? AND session_id = ?");
        $existing->execute([$leadId, $sessionId]);
        
        if ($existing->fetch()) {
            $skipped++;
            continue;
        }
        
        // Check cache - if cached, mark as completed immediately
        $cacheKey = "firecrawl_" . md5($url . $searchType);
        $cached = getCache($cacheKey);
        
        if ($cached !== null) {
            // Insert as completed with cached data
            $stmt = $pdo->prepare("
                INSERT INTO enrichment_queue (lead_id, session_id, url, search_type, status, result_data, completed_at)
                VALUES (?, ?, ?, ?, 'completed', ?, NOW())
            ");
            $stmt->execute([$leadId, $sessionId, $url, $searchType, json_encode($cached)]);
            $queued++;
            continue;
        }
        
        // Queue for processing
        $stmt = $pdo->prepare("
            INSERT INTO enrichment_queue (lead_id, session_id, url, search_type, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$leadId, $sessionId, $url, $searchType]);
        $queued++;
    }
    
    // Trigger background processing (async if possible)
    triggerBackgroundProcessing($sessionId);
    
    sendJson([
        'success' => true,
        'sessionId' => $sessionId,
        'queued' => $queued,
        'skipped' => $skipped,
        'message' => "Enrichment started for $queued leads"
    ]);
}

/**
 * Get enrichment status for a session
 */
function handleEnrichmentStatus() {
    $sessionId = $_GET['session_id'] ?? '';
    
    if (empty($sessionId)) {
        sendError('Session ID is required');
    }
    
    $pdo = getDbConnection();
    
    // Get counts by status
    $stmt = $pdo->prepare("
        SELECT 
            status,
            COUNT(*) as count
        FROM enrichment_queue
        WHERE session_id = ?
        GROUP BY status
    ");
    $stmt->execute([$sessionId]);
    $counts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $pending = $counts['pending'] ?? 0;
    $processing = $counts['processing'] ?? 0;
    $completed = $counts['completed'] ?? 0;
    $failed = $counts['failed'] ?? 0;
    $total = $pending + $processing + $completed + $failed;
    
    // Get completed results
    $stmt = $pdo->prepare("
        SELECT lead_id, result_data
        FROM enrichment_queue
        WHERE session_id = ? AND status = 'completed' AND result_data IS NOT NULL
        ORDER BY completed_at DESC
    ");
    $stmt->execute([$sessionId]);
    $completedResults = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data = json_decode($row['result_data'], true);
        if ($data) {
            $completedResults[$row['lead_id']] = $data;
        }
    }
    
    sendJson([
        'success' => true,
        'sessionId' => $sessionId,
        'status' => [
            'pending' => $pending,
            'processing' => $processing,
            'completed' => $completed,
            'failed' => $failed,
            'total' => $total
        ],
        'progress' => $total > 0 ? round(($completed + $failed) / $total * 100) : 100,
        'isComplete' => ($pending === 0 && $processing === 0),
        'results' => $completedResults
    ]);
}

/**
 * Process pending items in the enrichment queue
 */
function processEnrichmentQueue() {
    $sessionId = $_GET['session_id'] ?? '';
    $pdo = getDbConnection();
    
    $batchSize = defined('ENRICHMENT_BATCH_SIZE') ? ENRICHMENT_BATCH_SIZE : 12;
    $maxSeconds = defined('ENRICHMENT_PROCESS_MAX_SECONDS') ? max(5, (int)ENRICHMENT_PROCESS_MAX_SECONDS) : 45;
    
    $processed = 0;
    $failed = 0;
    $maxRetries = defined('FIRECRAWL_MAX_RETRIES') ? FIRECRAWL_MAX_RETRIES : 3;
    $startTime = time();
    $hadItems = false;
    
    while (true) {
        // Stop if we've exceeded the time budget.
        if ((time() - $startTime) >= $maxSeconds) {
            break;
        }

        // Get pending items
        $whereSession = '';
        $params = ['pending', $batchSize];
        if ($sessionId) {
            $whereSession = ' AND session_id = ?';
            array_splice($params, 1, 0, $sessionId);
        }
        
        $stmt = $pdo->prepare("
            SELECT id, lead_id, url, search_type, session_id, retry_count
            FROM enrichment_queue
            WHERE status = ?{$whereSession}
            ORDER BY created_at ASC
            LIMIT ?
        ");
        $stmt->execute($params);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($items)) {
            break;
        }

        $hadItems = true;
    
        foreach ($items as $item) {
            // Mark as processing
            $updateStmt = $pdo->prepare("UPDATE enrichment_queue SET status = 'processing', started_at = NOW() WHERE id = ?");
            $updateStmt->execute([$item['id']]);
            
            try {
                $result = firecrawlScrape($item['url'], $item['search_type']);
                
                // Cache the result
                $cacheKey = "firecrawl_" . md5($item['url'] . $item['search_type']);
                setCache($cacheKey, $result, 86400);
                
                // Mark as completed
                $updateStmt = $pdo->prepare("
                    UPDATE enrichment_queue 
                    SET status = 'completed', result_data = ?, completed_at = NOW(), error_message = NULL
                    WHERE id = ?
                ");
                $updateStmt->execute([json_encode($result), $item['id']]);
                $processed++;
                
            } catch (Exception $e) {
                $retryCount = ($item['retry_count'] ?? 0) + 1;
                
                if ($retryCount < $maxRetries && isRetryableError($e->getMessage())) {
                    // Queue for retry with exponential backoff
                    $updateStmt = $pdo->prepare("
                        UPDATE enrichment_queue 
                        SET status = 'pending', retry_count = ?, error_message = ?, started_at = NULL
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$retryCount, $e->getMessage(), $item['id']]);
                    // Exponential backoff: 1s, 2s, 4s, 8s max
                    $backoffMs = min(8000, (int)(pow(2, $retryCount) * 500));
                    usleep($backoffMs * 1000);
                } else {
                    // Mark as failed
                    $updateStmt = $pdo->prepare("
                        UPDATE enrichment_queue 
                        SET status = 'failed', error_message = ?, completed_at = NOW()
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$e->getMessage(), $item['id']]);
                    $failed++;
                }
            }
            
            // Small delay to respect rate limits (reduced for throughput)
            $delay = defined('FIRECRAWL_RETRY_DELAY_MS') ? FIRECRAWL_RETRY_DELAY_MS : 500;
            if ($delay > 0) {
                usleep($delay * 1000);
            }

            if ((time() - $startTime) >= $maxSeconds) {
                break 2;
            }
        }
    }
    
    if (!$hadItems && $processed === 0 && $failed === 0) {
        sendJson([
            'success' => true,
            'processed' => 0,
            'message' => 'No pending items to process'
        ]);
    }
    
    sendJson([
        'success' => true,
        'processed' => $processed,
        'failed' => $failed,
        'message' => "Processed $processed items, $failed failed"
    ]);
}

/**
 * Make a Firecrawl API scrape request
 */
function firecrawlScrape($url, $searchType = 'gmb') {
    $apiKey = defined('FIRECRAWL_API_KEY') ? FIRECRAWL_API_KEY : '';
    
    if (empty($apiKey) || $apiKey === 'YOUR_FIRECRAWL_API_KEY_HERE') {
        throw new Exception('Firecrawl API key not configured');
    }
    
    $timeout = defined('FIRECRAWL_TIMEOUT') ? FIRECRAWL_TIMEOUT : 30;
    
    // Configure formats based on search type
    $formats = ['markdown', 'links'];
    
    // For Option A (Super AI), we want more comprehensive data
    if ($searchType === 'gmb') {
        $formats[] = 'json';
    }
    
    $payload = [
        'url' => $url,
        'formats' => $formats,
        'onlyMainContent' => false, // We want contact pages too
        'waitFor' => 2000, // Wait for JS to load
    ];
    
    // Add JSON extraction schema for structured data
    if ($searchType === 'gmb') {
        $payload['jsonOptions'] = [
            'prompt' => 'Extract business contact information including: email addresses, phone numbers, social media profiles (Facebook, LinkedIn, Instagram, Twitter, YouTube), team member names and titles, company description, and any technology stack indicators.'
        ];
    }
    
    $ch = curl_init('https://api.firecrawl.dev/v1/scrape');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    if ($httpCode === 429) {
        throw new Exception("Rate limited - retry later");
    }
    
    if ($httpCode >= 400) {
        throw new Exception("HTTP error: $httpCode");
    }
    
    $data = json_decode($response, true);
    
    if (!$data || !isset($data['success']) || !$data['success']) {
        $errorMsg = $data['error'] ?? 'Unknown Firecrawl error';
        throw new Exception($errorMsg);
    }
    
    // Extract and normalize the data
    $normalized = normalizeFirecrawlResult($data['data'] ?? $data, $url, $searchType);

    // Gap-filling pass: scrape common contact pages when Firecrawl misses email/phone.
    return fillContactGapsFromWebsiteScrape($normalized, $url);
}

/**
 * Normalize Firecrawl result into our standard format
 */
function normalizeFirecrawlResult($data, $url, $searchType) {
    $markdown = $data['markdown'] ?? '';
    $links = $data['links'] ?? [];
    $jsonData = $data['json'] ?? $data['llm_extraction'] ?? [];
    $metadata = $data['metadata'] ?? [];
    
    // Extract emails from markdown content
    $emails = [];
    if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $markdown, $emailMatches)) {
        $emails = array_unique($emailMatches[0]);
        // Filter out common fake/tracking emails
        $emails = array_filter($emails, function($email) {
            $excludePatterns = ['example.com', 'test.com', 'sentry.io', 'wixpress.com', 'email.com', 'domain.com'];
            foreach ($excludePatterns as $pattern) {
                if (stripos($email, $pattern) !== false) return false;
            }
            return true;
        });
        $emails = array_values($emails);
    }
    
    // Also check JSON extraction for emails
    if (!empty($jsonData['email'])) {
        $emails = array_merge($emails, (array)$jsonData['email']);
    }
    if (!empty($jsonData['emails'])) {
        $emails = array_merge($emails, (array)$jsonData['emails']);
    }
    $emails = array_values(array_unique(array_filter($emails)));
    
    // Extract phones from markdown
    $phones = [];
    if (preg_match_all('/(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/', $markdown, $phoneMatches)) {
        $phones = array_unique($phoneMatches[0]);
        $phones = array_slice(array_values($phones), 0, 5); // Limit to 5
    }
    
    // Also check JSON extraction
    if (!empty($jsonData['phone'])) {
        $phones = array_merge($phones, (array)$jsonData['phone']);
    }
    if (!empty($jsonData['phones'])) {
        $phones = array_merge($phones, (array)$jsonData['phones']);
    }
    $phones = array_values(array_unique(array_filter($phones)));
    
    // Extract social profiles from links
    $socials = extractSocialProfiles($links, $markdown);
    
    // Also check JSON extraction for socials
    if (!empty($jsonData['social_profiles'])) {
        $socials = array_merge($socials, (array)$jsonData['social_profiles']);
    }
    
    // Extract tech stack
    $techStack = detectTechStackFromMarkdown($markdown);
    
    // Extract decision makers from JSON
    $decisionMakers = [];
    if (!empty($jsonData['team_members'])) {
        $decisionMakers = (array)$jsonData['team_members'];
    }
    if (!empty($jsonData['team'])) {
        $decisionMakers = array_merge($decisionMakers, (array)$jsonData['team']);
    }
    
    // Build result based on search type
    $result = [
        'url' => $url,
        'emails' => $emails,
        'phones' => $phones,
        'socials' => $socials,
        'hasEmail' => !empty($emails),
        'hasPhone' => !empty($phones),
        'hasSocials' => !empty($socials),
        'scrapedAt' => date('c'),
    ];
    
    // Add extra data for Option A (Super AI Business Search)
    if ($searchType === 'gmb') {
        $result['techStack'] = $techStack;
        $result['decisionMakers'] = $decisionMakers;
        $result['description'] = $jsonData['company_description'] ?? $metadata['description'] ?? '';
        $result['title'] = $metadata['title'] ?? '';
    }
    
    // Add extra data for Option B (Agency Lead Finder)
    if ($searchType === 'platform') {
        $result['techStack'] = $techStack;
        $result['issues'] = detectIssuesFromMarkdown($markdown);
    }
    
    return $result;
}

/**
 * Fill missing contact fields using the built-in website contact scraper.
 * Only merges missing data and keeps existing Firecrawl fields intact.
 */
function fillContactGapsFromWebsiteScrape($enrichment, $url) {
    $emails = isset($enrichment['emails']) && is_array($enrichment['emails']) ? $enrichment['emails'] : [];
    $phones = isset($enrichment['phones']) && is_array($enrichment['phones']) ? $enrichment['phones'] : [];

    if (!empty($emails) && !empty($phones)) {
        return $enrichment;
    }

    try {
        $fallback = scrapeWebsiteForContacts($url, 6);
    } catch (Exception $e) {
        error_log("Firecrawl fallback scrape error: " . $e->getMessage());
        return $enrichment;
    }

    $fallbackEmails = isset($fallback['emails']) && is_array($fallback['emails']) ? $fallback['emails'] : [];
    $fallbackPhones = isset($fallback['phones']) && is_array($fallback['phones']) ? $fallback['phones'] : [];

    if (!empty($fallbackEmails)) {
        $emails = array_values(array_unique(array_merge($emails, $fallbackEmails)));
    }
    if (!empty($fallbackPhones)) {
        $phones = array_values(array_unique(array_merge($phones, $fallbackPhones)));
    }

    $enrichment['emails'] = array_slice($emails, 0, 5);
    $enrichment['phones'] = array_slice($phones, 0, 3);
    $enrichment['hasEmail'] = !empty($enrichment['emails']);
    $enrichment['hasPhone'] = !empty($enrichment['phones']);

    return $enrichment;
}

/**
 * Extract social media profiles from links and content
 */
function extractSocialProfiles($links, $markdown) {
    $socials = [];
    $patterns = [
        'facebook' => '/(?:facebook\.com|fb\.com)\/([^\/\s\?"]+)/i',
        'instagram' => '/instagram\.com\/([^\/\s\?"]+)/i',
        'twitter' => '/(?:twitter\.com|x\.com)\/([^\/\s\?"]+)/i',
        'linkedin' => '/linkedin\.com\/(?:company|in)\/([^\/\s\?"]+)/i',
        'youtube' => '/youtube\.com\/(?:channel|c|user|@)\/([^\/\s\?"]+)/i',
        'tiktok' => '/tiktok\.com\/@?([^\/\s\?"]+)/i',
    ];
    
    $allContent = $markdown . ' ' . implode(' ', $links);
    
    foreach ($patterns as $platform => $pattern) {
        if (preg_match($pattern, $allContent, $match)) {
            $handle = $match[1];
            // Skip generic handles
            if (!in_array(strtolower($handle), ['share', 'sharer', 'intent', 'home', 'login', 'signup'])) {
                $socials[$platform] = $match[0];
            }
        }
    }
    
    return $socials;
}

/**
 * Detect technology stack from markdown content
 */
function detectTechStackFromMarkdown($markdown) {
    $techStack = [];
    $markdownLower = strtolower($markdown);
    
    $technologies = [
        'WordPress' => ['wordpress', 'wp-content', 'wp-includes'],
        'Wix' => ['wix.com', 'wixsite', 'wixstatic'],
        'Squarespace' => ['squarespace', 'sqsp'],
        'Shopify' => ['shopify', 'myshopify'],
        'Webflow' => ['webflow'],
        'React' => ['react', '_next', 'nextjs'],
        'Vue' => ['vue', 'nuxt'],
        'Angular' => ['angular', 'ng-'],
        'jQuery' => ['jquery'],
        'Bootstrap' => ['bootstrap'],
        'Tailwind' => ['tailwind'],
        'Google Analytics' => ['google-analytics', 'gtag', 'googletagmanager'],
        'Facebook Pixel' => ['fbq(', 'facebook.com/tr'],
        'HubSpot' => ['hubspot', 'hs-scripts'],
        'Mailchimp' => ['mailchimp'],
        'Intercom' => ['intercom'],
        'Zendesk' => ['zendesk'],
        'Drift' => ['drift'],
        'Calendly' => ['calendly'],
        'Stripe' => ['stripe'],
        'PayPal' => ['paypal'],
    ];
    
    foreach ($technologies as $name => $indicators) {
        foreach ($indicators as $indicator) {
            if (strpos($markdownLower, $indicator) !== false) {
                $techStack[] = $name;
                break;
            }
        }
    }
    
    return array_unique($techStack);
}

/**
 * Detect website issues from markdown (for Option B)
 */
function detectIssuesFromMarkdown($markdown) {
    $issues = [];
    $markdownLower = strtolower($markdown);
    
    // Check for missing elements that would appear in markdown
    if (strlen($markdown) < 500) {
        $issues[] = 'Very thin content';
    }
    
    // Check for outdated indicators
    if (strpos($markdownLower, 'flash') !== false || strpos($markdownLower, '.swf') !== false) {
        $issues[] = 'Uses Flash (deprecated)';
    }
    
    if (preg_match('/copyright\s*©?\s*(19[89]\d|200[0-9]|201[0-5])/i', $markdown)) {
        $issues[] = 'Outdated copyright date';
    }
    
    // No clear CTA
    if (!preg_match('/(get\s*started|contact\s*us|call\s*now|book\s*now|schedule|request\s*quote)/i', $markdown)) {
        $issues[] = 'No clear call-to-action';
    }
    
    return $issues;
}

/**
 * Check if error is retryable
 */
function isRetryableError($message) {
    $retryable = ['rate limit', 'timeout', 'timed out', '429', '503', '502', 'temporarily'];
    $msgLower = strtolower($message);
    
    foreach ($retryable as $pattern) {
        if (strpos($msgLower, $pattern) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Get empty enrichment data structure
 */
function getEmptyEnrichmentData() {
    return [
        'emails' => [],
        'phones' => [],
        'socials' => [],
        'hasEmail' => false,
        'hasPhone' => false,
        'hasSocials' => false,
        'techStack' => [],
        'decisionMakers' => [],
        'issues' => [],
    ];
}

/**
 * Ensure enrichment queue table exists
 */
function ensureEnrichmentQueueTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS enrichment_queue (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lead_id VARCHAR(100) NOT NULL,
            session_id VARCHAR(100) NOT NULL,
            url VARCHAR(500) NOT NULL,
            search_type ENUM('gmb', 'platform') DEFAULT 'gmb',
            status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
            retry_count INT DEFAULT 0,
            result_data JSON,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            INDEX idx_session_status (session_id, status),
            INDEX idx_status_created (status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

/**
 * Trigger background processing (non-blocking if possible)
 */
function triggerBackgroundProcessing($sessionId) {
    // Try to trigger async processing via a non-blocking request
    $processUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") 
                  . "://{$_SERVER['HTTP_HOST']}/api/firecrawl.php?action=process&session_id=" . urlencode($sessionId);
    
    // Use fsockopen for non-blocking request (fire and forget)
    $parts = parse_url($processUrl);
    $port = $parts['port'] ?? ($parts['scheme'] === 'https' ? 443 : 80);
    $fp = @fsockopen(
        ($parts['scheme'] === 'https' ? 'ssl://' : '') . $parts['host'],
        $port,
        $errno, $errstr, 1
    );
    
    if ($fp) {
        $path = $parts['path'] . (isset($parts['query']) ? '?' . $parts['query'] : '');
        $hostHeader = $parts['host'];
        if (!empty($parts['port']) && !in_array((int)$parts['port'], [80, 443], true)) {
            $hostHeader .= ':' . $parts['port'];
        }
        $out = "GET $path HTTP/1.1\r\n";
        $out .= "Host: {$hostHeader}\r\n";
        $out .= "Connection: Close\r\n\r\n";
        fwrite($fp, $out);
        fclose($fp);
    }
    // If async trigger fails, processing will happen on next status poll
}
