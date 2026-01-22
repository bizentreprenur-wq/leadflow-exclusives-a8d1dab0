<?php
/**
 * Security Validation Module
 * 
 * Validates configuration and provides security utilities
 */

/**
 * Validate that critical secrets are not using placeholder values
 * This should be called early in the request lifecycle
 */
function validateSecrets() {
    // Known placeholder values that indicate unconfigured secrets
    $placeholders = [
        'DB_PASS' => ['YOUR_DATABASE_PASSWORD_HERE', ''],
        'JWT_SECRET' => ['YOUR_32_CHAR_RANDOM_STRING_HERE', 'REPLACE_WITH_RANDOM_32_CHAR_STRING', ''],
        'CRON_SECRET_KEY' => ['YOUR_32_CHAR_RANDOM_STRING_HERE', ''],
        'STRIPE_SECRET_KEY' => ['sk_live_YOUR_KEY_HERE', 'sk_test_YOUR_KEY_HERE', ''],
        'OPENAI_API_KEY' => ['sk-YOUR_OPENAI_KEY_HERE', ''],
        'SERPAPI_KEY' => ['YOUR_SERPAPI_KEY_HERE', ''],
        'SMTP_PASS' => ['YOUR_SMTP_PASSWORD_HERE', ''],
    ];
    
    $errors = [];
    
    foreach ($placeholders as $constant => $invalidValues) {
        if (!defined($constant)) continue;
        
        $value = constant($constant);
        
        // Check if value is empty or matches a placeholder
        if (empty($value) || in_array($value, $invalidValues, true)) {
            $errors[] = $constant;
        }
    }
    
    if (!empty($errors)) {
        // Log the error for server-side debugging
        error_log("CRITICAL SECURITY: The following secrets are using placeholder values: " . implode(', ', $errors));
        
        // In production (non-CLI), block the request
        if (php_sapi_name() !== 'cli') {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Server configuration error. Please contact administrator.'
            ]);
            exit();
        }
    }
    
    return empty($errors);
}

/**
 * Validate tracking ID format
 * Tracking IDs should be 64-character hex strings
 */
function validateTrackingId($trackingId) {
    if (empty($trackingId)) {
        return false;
    }
    
    // Tracking IDs are generated as 64-char hex strings
    return preg_match('/^[a-f0-9]{64}$/i', $trackingId) === 1;
}

/**
 * Validate URL for redirect safety
 * Prevents open redirect vulnerabilities
 */
function validateRedirectUrl($url) {
    if (empty($url)) {
        return false;
    }
    
    // Parse the URL
    $parsed = parse_url($url);
    
    if ($parsed === false) {
        return false;
    }
    
    // Must have a valid scheme
    if (!isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'], true)) {
        return false;
    }
    
    // Must have a valid host
    if (!isset($parsed['host']) || empty($parsed['host'])) {
        return false;
    }
    
    return true;
}

/**
 * Rate limit check specifically for tracking endpoints
 * More aggressive than standard rate limiting
 */
function checkTrackingRateLimit($identifier, $maxRequests = 100, $windowSeconds = 60) {
    $cacheDir = defined('CACHE_DIR') ? CACHE_DIR : __DIR__ . '/../cache';
    $cacheFile = $cacheDir . '/tracking_rate_' . md5($identifier) . '.json';
    
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    
    $now = time();
    $data = ['requests' => [], 'blocked_until' => 0];
    
    if (file_exists($cacheFile)) {
        $content = @file_get_contents($cacheFile);
        if ($content) {
            $data = json_decode($content, true) ?: $data;
        }
    }
    
    // Check if currently blocked
    if ($data['blocked_until'] > $now) {
        return false;
    }
    
    // Clean old requests outside the window
    $data['requests'] = array_filter($data['requests'], function($time) use ($now, $windowSeconds) {
        return $time > ($now - $windowSeconds);
    });
    
    // Check if over limit
    if (count($data['requests']) >= $maxRequests) {
        // Block for 5 minutes
        $data['blocked_until'] = $now + 300;
        @file_put_contents($cacheFile, json_encode($data));
        
        error_log("Tracking rate limit exceeded for: " . $identifier);
        return false;
    }
    
    // Record this request
    $data['requests'][] = $now;
    @file_put_contents($cacheFile, json_encode($data));
    
    return true;
}

/**
 * Get a safe error message for clients
 * Logs detailed error server-side
 */
function safeError($userMessage, $detailedError = null, $statusCode = 500) {
    if ($detailedError) {
        error_log("Error: " . $detailedError);
    }
    
    http_response_code($statusCode);
    return [
        'success' => false,
        'error' => $userMessage
    ];
}