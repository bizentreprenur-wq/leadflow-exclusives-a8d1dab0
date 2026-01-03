<?php
/**
 * Configuration file for BamLead Search API
 * 
 * INSTRUCTIONS:
 * 1. Copy the entire hostinger-backend folder to your Hostinger hosting
 * 2. Replace the placeholder values with your actual API keys
 * 3. Get a Google Custom Search API key from: https://console.cloud.google.com/
 * 4. Create a Custom Search Engine at: https://programmablesearchengine.google.com/
 * 5. Update ALLOWED_ORIGINS with your production domain
 */

// =====================================
// GOOGLE CUSTOM SEARCH API
// =====================================
// Get your API key from: https://console.cloud.google.com/apis/credentials
// Create Search Engine at: https://programmablesearchengine.google.com/
define('GOOGLE_API_KEY', '');
define('GOOGLE_SEARCH_ENGINE_ID', '');

// =====================================
// BING SEARCH API (Optional)
// =====================================
// Get from: https://portal.azure.com/ -> Cognitive Services -> Bing Search
define('BING_API_KEY', '');

// =====================================
// CORS SETTINGS
// =====================================
// Add your frontend domains here
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'https://your-lovable-app.lovable.app',
    // Add your production domain here
    // 'https://yourdomain.com',
]);

// =====================================
// RATE LIMITING
// =====================================
// Requests per minute per IP
define('RATE_LIMIT', 30);

// =====================================
// CACHE SETTINGS
// =====================================
// Cache duration for search results (in seconds)
define('CACHE_DURATION', 300); // 5 minutes

// Enable file-based caching
define('ENABLE_CACHE', true);
define('CACHE_DIR', __DIR__ . '/cache');

// =====================================
// WEBSITE ANALYSIS SETTINGS
// =====================================
// Timeout for analyzing websites (in seconds)
define('WEBSITE_TIMEOUT', 10);

// Maximum page size to download (in bytes)
define('MAX_PAGE_SIZE', 2 * 1024 * 1024); // 2MB

// =====================================
// SEARCH SETTINGS
// =====================================
// Number of results per search (max 10 for Google, 50 for Bing)
define('RESULTS_PER_PAGE', 10);

// =====================================
// DEBUG MODE
// =====================================
// Set to true to enable detailed error messages (disable in production!)
define('DEBUG_MODE', false);
