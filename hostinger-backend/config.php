<?php
/**
 * Configuration file for GMB Search API
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to your Hostinger hosting
 * 2. Replace the placeholder values with your actual API keys
 * 3. Get a Google Custom Search API key from: https://console.cloud.google.com/
 * 4. Create a Custom Search Engine at: https://programmablesearchengine.google.com/
 */

// Google Custom Search API credentials
// Leave empty to use mock data for testing
define('GOOGLE_API_KEY', '');
define('GOOGLE_SEARCH_ENGINE_ID', '');

// CORS settings - update with your frontend domain
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-lovable-app.lovable.app',
    // Add your production domain here
]);

// Rate limiting (requests per minute per IP)
define('RATE_LIMIT', 30);

// Cache duration in seconds (for search results)
define('CACHE_DURATION', 300); // 5 minutes
