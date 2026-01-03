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
 * 6. Configure your MySQL database credentials below
 */

// =====================================
// DATABASE CONFIGURATION (Hostinger MySQL)
// =====================================
// Find these in Hostinger hPanel -> Databases -> MySQL Databases
define('DB_HOST', 'localhost'); // Usually 'localhost' on Hostinger
define('DB_NAME', 'your_database_name'); // Your database name
define('DB_USER', 'your_database_user'); // Your database username
define('DB_PASS', 'your_database_password'); // Your database password

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
// EMAIL SETTINGS
// =====================================
// Basic email settings (uses PHP mail() function)
define('MAIL_FROM_ADDRESS', 'noreply@yourdomain.com');
define('MAIL_FROM_NAME', 'BamLead');

// SMTP Settings (optional - for better deliverability)
// Leave SMTP_HOST empty to use PHP's mail() function
define('SMTP_HOST', ''); // e.g., 'smtp.gmail.com' or your Hostinger SMTP
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_SECURE', 'tls'); // 'tls' or 'ssl'

// Frontend URL (for email links)
define('FRONTEND_URL', 'https://yourdomain.com'); // UPDATE THIS!

// =====================================
// STRIPE SETTINGS
// =====================================
// Get from: https://dashboard.stripe.com/apikeys
define('STRIPE_SECRET_KEY', ''); // sk_test_... or sk_live_...
define('STRIPE_PUBLISHABLE_KEY', ''); // pk_test_... or pk_live_...
define('STRIPE_WEBHOOK_SECRET', ''); // whsec_... from webhook settings

// Stripe Price IDs (create these in Stripe Dashboard -> Products)
define('STRIPE_PRICES', [
    'basic' => [
        'monthly' => '', // price_... for Basic Monthly $49
        'yearly' => '',  // price_... for Basic Yearly $470 (20% off)
    ],
    'pro' => [
        'monthly' => '', // price_... for Pro Monthly $99
        'yearly' => '',  // price_... for Pro Yearly $950 (20% off)
    ],
    'agency' => [
        'monthly' => '', // price_... for Agency Monthly $249
        'yearly' => '',  // price_... for Agency Yearly $2390 (20% off)
    ],
]);

// =====================================
// OPENAI API (For AI Features)
// =====================================
// Get from: https://platform.openai.com/api-keys
define('OPENAI_API_KEY', '');

// =====================================
// JWT SECRET (For Token Authentication)
// =====================================
// Generate a random string: https://randomkeygen.com/
define('JWT_SECRET', 'change-this-to-a-random-secret-key-at-least-32-characters');

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
// SESSION SETTINGS
// =====================================
define('SESSION_LIFETIME', 604800); // 7 days in seconds

// =====================================
// SUBSCRIPTION SETTINGS
// =====================================
define('TRIAL_DAYS', 14);
define('FREE_SEARCHES_PER_DAY', 5);
define('PAID_SEARCHES_PER_DAY', 100);

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
