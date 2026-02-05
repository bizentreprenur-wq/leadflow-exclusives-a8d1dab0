<?php
/**
 * Firecrawl Helper Functions
 * Used for parallel enrichment during SSE streaming
 */

/**
 * Queue a single lead for Firecrawl enrichment (non-blocking)
 * Returns immediately, enrichment happens in background
 */
function queueFirecrawlEnrichment($leadId, $url, $sessionId, $searchType = 'gmb') {
    if (empty($url)) {
        return false;
    }
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    
    try {
        $pdo = getDbConnection();
        
        // Ensure table exists
        ensureEnrichmentQueueTableExists($pdo);
        
        // Check cache first
        $cacheKey = "firecrawl_" . md5($url . $searchType);
        $cached = getCache($cacheKey);
        
        if ($cached !== null) {
            // Insert as already completed with cached data
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO enrichment_queue (lead_id, session_id, url, search_type, status, result_data, completed_at)
                VALUES (?, ?, ?, ?, 'completed', ?, NOW())
            ");
            $stmt->execute([$leadId, $sessionId, $url, $searchType, json_encode($cached)]);
            return 'cached';
        }
        
        // Queue for processing
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO enrichment_queue (lead_id, session_id, url, search_type, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$leadId, $sessionId, $url, $searchType]);
        
        return 'queued';
    } catch (Exception $e) {
        error_log("Firecrawl queue error: " . $e->getMessage());
        return false;
    }
}

/**
 * Process pending enrichment items and return results
 * Called periodically during SSE streaming
 */
function processEnrichmentBatch($sessionId, $batchSize = 3) {
    $apiKey = defined('FIRECRAWL_API_KEY') ? FIRECRAWL_API_KEY : '';
    
    if (empty($apiKey) || $apiKey === 'YOUR_FIRECRAWL_API_KEY_HERE') {
        return ['processed' => 0, 'results' => []];
    }
    
    try {
        $pdo = getDbConnection();
        
        // Get pending items for this session
        $stmt = $pdo->prepare("
            SELECT id, lead_id, url, search_type
            FROM enrichment_queue
            WHERE session_id = ? AND status = 'pending'
            ORDER BY created_at ASC
            LIMIT ?
        ");
        $stmt->execute([$sessionId, $batchSize]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($items)) {
            return ['processed' => 0, 'results' => []];
        }
        
        $results = [];
        $processed = 0;
        
        foreach ($items as $item) {
            // Mark as processing
            $updateStmt = $pdo->prepare("UPDATE enrichment_queue SET status = 'processing', started_at = NOW() WHERE id = ?");
            $updateStmt->execute([$item['id']]);
            
            try {
                $enrichmentData = callFirecrawlApi($item['url'], $item['search_type'], $apiKey);
                
                // Cache the result
                $cacheKey = "firecrawl_" . md5($item['url'] . $item['search_type']);
                setCache($cacheKey, $enrichmentData, 86400);
                
                // Mark as completed
                $updateStmt = $pdo->prepare("
                    UPDATE enrichment_queue 
                    SET status = 'completed', result_data = ?, completed_at = NOW()
                    WHERE id = ?
                ");
                $updateStmt->execute([json_encode($enrichmentData), $item['id']]);
                
                $results[] = [
                    'leadId' => $item['lead_id'],
                    'data' => $enrichmentData
                ];
                $processed++;
                
            } catch (Exception $e) {
                $retryable = isRetryableFirecrawlError($e->getMessage());
                
                if ($retryable) {
                    // Reset to pending for retry
                    $updateStmt = $pdo->prepare("
                        UPDATE enrichment_queue 
                        SET status = 'pending', retry_count = retry_count + 1, error_message = ?
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$e->getMessage(), $item['id']]);
                } else {
                    // Mark as failed
                    $updateStmt = $pdo->prepare("
                        UPDATE enrichment_queue 
                        SET status = 'failed', error_message = ?, completed_at = NOW()
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$e->getMessage(), $item['id']]);
                }
            }
        }
        
        return ['processed' => $processed, 'results' => $results];
        
    } catch (Exception $e) {
        error_log("Enrichment batch error: " . $e->getMessage());
        return ['processed' => 0, 'results' => []];
    }
}

/**
 * Get already completed enrichment results for a session
 */
function getCompletedEnrichments($sessionId, $afterId = 0) {
    try {
        $pdo = getDbConnection();
        
        $stmt = $pdo->prepare("
            SELECT id, lead_id, result_data
            FROM enrichment_queue
            WHERE session_id = ? AND status = 'completed' AND result_data IS NOT NULL AND id > ?
            ORDER BY completed_at ASC
            LIMIT 20
        ");
        $stmt->execute([$sessionId, $afterId]);
        
        $results = [];
        $maxId = $afterId;
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $data = json_decode($row['result_data'], true);
            if ($data) {
                $results[] = [
                    'leadId' => $row['lead_id'],
                    'data' => $data
                ];
            }
            $maxId = max($maxId, (int)$row['id']);
        }
        
        return ['results' => $results, 'lastId' => $maxId];
        
    } catch (Exception $e) {
        return ['results' => [], 'lastId' => $afterId];
    }
}

/**
 * Call Firecrawl API directly
 */
function callFirecrawlApi($url, $searchType, $apiKey) {
    $timeout = defined('FIRECRAWL_TIMEOUT') ? FIRECRAWL_TIMEOUT : 20;
    
    $payload = [
        'url' => $url,
        'formats' => ['markdown', 'links'],
        'onlyMainContent' => false,
        'waitFor' => 1500,
    ];
    
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
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    if ($httpCode === 429) {
        throw new Exception("Rate limited");
    }
    
    if ($httpCode >= 400) {
        throw new Exception("HTTP error: $httpCode");
    }
    
    $data = json_decode($response, true);
    
    if (!$data || !isset($data['success']) || !$data['success']) {
        $errorMsg = $data['error'] ?? 'Unknown Firecrawl error';
        throw new Exception($errorMsg);
    }
    
    return normalizeFirecrawlData($data['data'] ?? $data, $url, $searchType);
}

/**
 * Normalize Firecrawl response to standard format
 */
function normalizeFirecrawlData($data, $url, $searchType) {
    $markdown = $data['markdown'] ?? '';
    $links = $data['links'] ?? [];
    $metadata = $data['metadata'] ?? [];
    
    // Extract emails
    $emails = [];
    if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $markdown, $emailMatches)) {
        $emails = array_unique($emailMatches[0]);
        $emails = array_filter($emails, function($email) {
            $excludePatterns = ['example.com', 'test.com', 'sentry.io', 'wixpress.com', 'email.com', 'domain.com', 'noreply', 'no-reply'];
            foreach ($excludePatterns as $pattern) {
                if (stripos($email, $pattern) !== false) return false;
            }
            return true;
        });
        $emails = array_values(array_slice($emails, 0, 5));
    }
    
    // Extract phones
    $phones = [];
    if (preg_match_all('/(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/', $markdown, $phoneMatches)) {
        $phones = array_unique($phoneMatches[0]);
        $phones = array_values(array_slice($phones, 0, 3));
    }
    
    // Extract social profiles
    $socials = [];
    $socialPatterns = [
        'facebook' => '/(?:facebook\.com|fb\.com)\/([^\/\s\?"]+)/i',
        'instagram' => '/instagram\.com\/([^\/\s\?"]+)/i',
        'twitter' => '/(?:twitter\.com|x\.com)\/([^\/\s\?"]+)/i',
        'linkedin' => '/linkedin\.com\/(?:company|in)\/([^\/\s\?"]+)/i',
        'youtube' => '/youtube\.com\/(?:channel|c|user|@)\/([^\/\s\?"]+)/i',
    ];
    
    $allContent = $markdown . ' ' . implode(' ', $links);
    foreach ($socialPatterns as $platform => $pattern) {
        if (preg_match($pattern, $allContent, $match)) {
            $handle = $match[1];
            if (!in_array(strtolower($handle), ['share', 'sharer', 'intent', 'home', 'login', 'signup'])) {
                $socials[$platform] = $match[0];
            }
        }
    }
    
    return [
        'url' => $url,
        'emails' => $emails,
        'phones' => $phones,
        'socials' => $socials,
        'hasEmail' => !empty($emails),
        'hasPhone' => !empty($phones),
        'hasSocials' => !empty($socials),
        'scrapedAt' => date('c'),
    ];
}

/**
 * Check if error is retryable
 */
function isRetryableFirecrawlError($message) {
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
 * Ensure enrichment queue table exists
 */
function ensureEnrichmentQueueTableExists($pdo) {
    static $checked = false;
    if ($checked) return;
    
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
            INDEX idx_status_created (status, created_at),
            UNIQUE KEY unique_lead_session (lead_id, session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    $checked = true;
}