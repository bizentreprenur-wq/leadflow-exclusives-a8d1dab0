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
define('DB_HOST', 'localhost');
define('DB_NAME', 'u497238762_bamlead');
define('DB_USER', 'u497238762_bamlead');
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE'); // <-- REPLACE THIS

// =====================================
// SERPER.DEV (Optional - Faster/cheaper Google Search API)
// =====================================
// Get from: https://serper.dev/
define('SERPER_API_KEY', 'YOUR_SERPER_API_KEY_HERE'); // <-- OPTIONAL
// Legacy pipeline setting (ignored by custom one-shot fetcher).
if (!defined('ENABLE_SERPER_PARALLEL')) {
    define('ENABLE_SERPER_PARALLEL', true);
}

// =====================================
// SERPAPI (Legacy pipeline only; not used by custom one-shot fetcher)
// =====================================
// Get from: https://serpapi.com/manage-api-key
define('SERPAPI_KEY', 'YOUR_SERPAPI_KEY_HERE'); // <-- REPLACE THIS

// =====================================
// GOOGLE CUSTOM SEARCH API (Optional)
// =====================================
define('GOOGLE_API_KEY', '');
define('GOOGLE_SEARCH_ENGINE_ID', '');

// =====================================
// BING SEARCH API (Optional)
// =====================================
define('BING_API_KEY', '');

// =====================================
// FIRECRAWL (Website Enrichment)
// =====================================
define('FIRECRAWL_API_KEY', 'YOUR_FIRECRAWL_API_KEY_HERE'); // <-- REPLACE THIS
define('FIRECRAWL_TIMEOUT', 30);
define('FIRECRAWL_MAX_RETRIES', 3);
define('FIRECRAWL_RETRY_DELAY_MS', 1000);
// Enrichment queue settings
define('ENRICHMENT_BATCH_SIZE', 5);
define('ENRICHMENT_MAX_CONCURRENT', 5);

// =====================================
// EMAIL SETTINGS
// =====================================
define('MAIL_FROM_ADDRESS', 'noreply@bamlead.com');
define('MAIL_FROM_NAME', 'BamLead');
define('MAIL_LOGO_URL', 'https://bamlead.com/favicon.png');

// SMTP Settings (for email verification)
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'noreply@bamlead.com');
define('SMTP_PASS', 'YOUR_NOREPLY_EMAIL_PASSWORD'); // <-- REPLACE THIS
define('SMTP_SECURE', 'ssl');
define('SMTP_DEBUG', false);

// Frontend URL (for email links)
define('FRONTEND_URL', 'https://bamlead.com');

// =====================================
// STRIPE SETTINGS
// =====================================
// Get from: https://dashboard.stripe.com/apikeys
define('STRIPE_SECRET_KEY', 'sk_live_YOUR_KEY_HERE'); // <-- REPLACE THIS
define('STRIPE_PUBLISHABLE_KEY', 'pk_live_YOUR_KEY_HERE'); // <-- REPLACE THIS
define('STRIPE_WEBHOOK_SECRET', 'whsec_YOUR_SECRET_HERE'); // <-- REPLACE THIS

// Stripe Price IDs (create in Stripe Dashboard -> Products)
define('STRIPE_PRICES', [
    'basic' => [
        'monthly' => 'price_BASIC_MONTHLY', // <-- REPLACE
        'yearly' => 'price_BASIC_YEARLY',
    ],
    'pro' => [
        'monthly' => 'price_PRO_MONTHLY', // <-- REPLACE
        'yearly' => 'price_PRO_YEARLY',
    ],
    'agency' => [
        'monthly' => 'price_AGENCY_MONTHLY', // <-- REPLACE
        'yearly' => 'price_AGENCY_YEARLY',
    ],
]);

// =====================================
// OPENAI API (For AI Features)
// =====================================
define('OPENAI_API_KEY', 'sk-YOUR_OPENAI_KEY_HERE'); // <-- REPLACE THIS

// =====================================
// GOOGLE DRIVE API (For Export Features)
// =====================================
// Get from: https://console.cloud.google.com/apis/credentials
// Create OAuth 2.0 Client ID for Web application
define('GOOGLE_DRIVE_CLIENT_ID', ''); // <-- REPLACE THIS
define('GOOGLE_DRIVE_CLIENT_SECRET', ''); // <-- REPLACE THIS
define('GOOGLE_DRIVE_REDIRECT_URI', 'https://bamlead.com/api/google-drive-callback.php');

// =====================================
// JWT SECRET (For Token Authentication)
// =====================================
// Generate at: https://randomkeygen.com/
define('JWT_SECRET', 'REPLACE_WITH_RANDOM_32_CHAR_STRING'); // <-- REPLACE THIS

// =====================================
// CORS SETTINGS
// =====================================
define('ALLOWED_ORIGINS', [
    'https://bamlead.com',
    'https://www.bamlead.com',
    'http://localhost:5173',
    'http://localhost:8080',
]);

// =====================================
// RATE LIMITING
// =====================================
// Requests per minute per IP
define('RATE_LIMIT', 30);

// =====================================
// CUSTOM ONE-SHOT FETCHER (Primary Search Pipeline)
// =====================================
if (!defined('ENABLE_CUSTOM_ONE_SHOT_FETCHER')) {
    define('ENABLE_CUSTOM_ONE_SHOT_FETCHER', true);
}
if (!defined('ENABLE_LEGACY_SERPER_PIPELINE')) {
    define('ENABLE_LEGACY_SERPER_PIPELINE', false);
}
if (!defined('ENABLE_LEGACY_BAMLEAD_SCRAPER')) {
    define('ENABLE_LEGACY_BAMLEAD_SCRAPER', false);
}
if (!defined('ENABLE_LEGACY_FIRECRAWL_ENRICHMENT')) {
    define('ENABLE_LEGACY_FIRECRAWL_ENRICHMENT', false);
}
if (!defined('CUSTOM_FETCH_DISCOVERY_SOURCES')) {
    define('CUSTOM_FETCH_DISCOVERY_SOURCES', ['serper']);
}
if (!defined('CUSTOM_FETCH_ENGINE_MODE')) {
    define('CUSTOM_FETCH_ENGINE_MODE', 'current');
}
if (!defined('ENABLE_NO_KEY_OUTSCRAPER_STYLE')) {
    define('ENABLE_NO_KEY_OUTSCRAPER_STYLE', false);
}
if (!defined('CUSTOM_FETCH_ENRICH_CONCURRENCY')) {
    define('CUSTOM_FETCH_ENRICH_CONCURRENCY', 5);
}
if (!defined('CUSTOM_FETCH_CONTACT_TIMEOUT_SEC')) {
    define('CUSTOM_FETCH_CONTACT_TIMEOUT_SEC', 7);
}
if (!defined('CUSTOM_FETCH_TARGET_RATIO')) {
    define('CUSTOM_FETCH_TARGET_RATIO', 0.90);
}
if (!defined('CUSTOM_FETCH_ENABLE_INLINE_ENRICHMENT')) {
    define('CUSTOM_FETCH_ENABLE_INLINE_ENRICHMENT', false);
}
if (!defined('CUSTOM_FETCH_SERPER_ORGANIC_TOPUP')) {
    define('CUSTOM_FETCH_SERPER_ORGANIC_TOPUP', false);
}
if (!defined('CUSTOM_FETCH_SERPER_INCLUDE_MAPS')) {
    define('CUSTOM_FETCH_SERPER_INCLUDE_MAPS', true);
}
if (!defined('CUSTOM_FETCH_ENABLE_LOW_COVERAGE_TOPUP')) {
    define('CUSTOM_FETCH_ENABLE_LOW_COVERAGE_TOPUP', true);
}
if (!defined('CUSTOM_FETCH_LOW_COVERAGE_THRESHOLD')) {
    define('CUSTOM_FETCH_LOW_COVERAGE_THRESHOLD', 0.85);
}
if (!defined('CUSTOM_FETCH_MAX_TOPUP_QUERIES')) {
    define('CUSTOM_FETCH_MAX_TOPUP_QUERIES', 48);
}
if (!defined('CUSTOM_FETCH_DISCOVERY_TIMEOUT_SEC')) {
    define('CUSTOM_FETCH_DISCOVERY_TIMEOUT_SEC', 6);
}
if (!defined('CUSTOM_FETCH_STREAM_EMIT_BATCH_SIZE')) {
    define('CUSTOM_FETCH_STREAM_EMIT_BATCH_SIZE', 8);
}
if (!defined('CUSTOM_FETCH_QUERY_CONCURRENCY')) {
    define('CUSTOM_FETCH_QUERY_CONCURRENCY', 8);
}
if (!defined('CUSTOM_FETCH_ENABLE_PLATFORM_RELAXATION')) {
    define('CUSTOM_FETCH_ENABLE_PLATFORM_RELAXATION', true);
}
if (!defined('CUSTOM_FETCH_PLATFORM_RELAX_THRESHOLD')) {
    define('CUSTOM_FETCH_PLATFORM_RELAX_THRESHOLD', 0.20);
}
if (!defined('CUSTOM_FETCH_PLATFORM_RELAX_AFTER_QUERY_RATIO')) {
    define('CUSTOM_FETCH_PLATFORM_RELAX_AFTER_QUERY_RATIO', 0.35);
}
if (!defined('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE')) {
    define('CUSTOM_FETCH_ENABLE_QUICK_EMAIL_PROBE', true);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_TIMEOUT_SEC', 1);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_CONCURRENCY', 20);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_QUERY', 140);
}
if (!defined('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_PASS')) {
    define('CUSTOM_FETCH_QUICK_EMAIL_MAX_PER_PASS', 6);
}
if (!defined('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE')) {
    define('CUSTOM_FETCH_DEFER_QUICK_EMAIL_PROBE', true);
}
if (!defined('CUSTOM_FETCH_TOPUP_USE_NO_KEY_FALLBACK')) {
    define('CUSTOM_FETCH_TOPUP_USE_NO_KEY_FALLBACK', false);
}
if (!defined('NO_KEY_DISCOVERY_CONCURRENCY')) {
    define('NO_KEY_DISCOVERY_CONCURRENCY', 12);
}
if (!defined('NO_KEY_PROVIDER_TIMEOUT_SEC')) {
    define('NO_KEY_PROVIDER_TIMEOUT_SEC', 2);
}
if (!defined('NO_KEY_PROVIDER_RETRIES')) {
    define('NO_KEY_PROVIDER_RETRIES', 0);
}
if (!defined('NO_KEY_TOPUP_MAX_PASSES')) {
    define('NO_KEY_TOPUP_MAX_PASSES', 0);
}
if (!defined('NO_KEY_TOPUP_MAX_QUERIES')) {
    define('NO_KEY_TOPUP_MAX_QUERIES', 8);
}
if (!defined('NO_KEY_STREAM_EMIT_BATCH_SIZE')) {
    define('NO_KEY_STREAM_EMIT_BATCH_SIZE', 2);
}
if (!defined('NO_KEY_BLOCK_BACKOFF_MS')) {
    define('NO_KEY_BLOCK_BACKOFF_MS', 250);
}
if (!defined('NO_KEY_TARGET_RATIO')) {
    define('NO_KEY_TARGET_RATIO', 0.40);
}
if (!defined('NO_KEY_MAX_SEED_QUERIES')) {
    define('NO_KEY_MAX_SEED_QUERIES', 5);
}
if (!defined('NO_KEY_ENABLE_TOPUP')) {
    define('NO_KEY_ENABLE_TOPUP', false);
}
if (!defined('NO_KEY_DEFER_QUICK_PROBE')) {
    define('NO_KEY_DEFER_QUICK_PROBE', true);
}
if (!defined('NO_KEY_MAX_EMPTY_SEED_CHUNKS')) {
    define('NO_KEY_MAX_EMPTY_SEED_CHUNKS', 1);
}
if (!defined('NO_KEY_MAX_EMPTY_TOPUP_CHUNKS')) {
    define('NO_KEY_MAX_EMPTY_TOPUP_CHUNKS', 1);
}

// =====================================
// CACHE SETTINGS
// =====================================
// Cache duration for search results (in seconds)
define('CACHE_DURATION', 300); // 5 minutes

// Enable file-based caching
define('ENABLE_CACHE', true);
define('CACHE_DIR', __DIR__ . '/cache');

// =====================================
// CRON & DIAGNOSTICS SECURITY
// =====================================
// Secret key for cron job authentication (use X-Cron-Secret header)
// Generate at: https://randomkeygen.com/
define('CRON_SECRET_KEY', 'REPLACE_WITH_RANDOM_32_CHAR_STRING'); // <-- REPLACE THIS

// IP whitelist for cron endpoints (optional but recommended)
// Add your server's IP address and any allowed cron service IPs
// To find your server IP: curl ifconfig.me
define('CRON_ALLOWED_IPS', [
    '127.0.0.1',      // Localhost
    '::1',            // IPv6 localhost
    // 'YOUR_SERVER_IP', // <-- Add your Hostinger server IP here
]);

// =====================================
// EMAIL DRIP THROUGHPUT SETTINGS
// =====================================
if (!defined('EMAIL_DRIP_DEFAULT_PER_HOUR')) {
    define('EMAIL_DRIP_DEFAULT_PER_HOUR', 300);
}
if (!defined('EMAIL_DRIP_MAX_PER_REQUEST')) {
    define('EMAIL_DRIP_MAX_PER_REQUEST', 1000);
}
if (!defined('EMAIL_INSTANT_MAX_PER_REQUEST')) {
    define('EMAIL_INSTANT_MAX_PER_REQUEST', 50);
}
if (!defined('EMAIL_DRIP_WORKER_BATCH_SIZE')) {
    define('EMAIL_DRIP_WORKER_BATCH_SIZE', 60);
}
if (!defined('EMAIL_DRIP_KICKOFF_BATCH_SIZE')) {
    define('EMAIL_DRIP_KICKOFF_BATCH_SIZE', 20);
}
if (!defined('EMAIL_DRIP_PROCESS_MY_MAX_LIMIT')) {
    define('EMAIL_DRIP_PROCESS_MY_MAX_LIMIT', 300);
}
if (!defined('EMAIL_DRIP_INTER_SEND_DELAY_US')) {
    define('EMAIL_DRIP_INTER_SEND_DELAY_US', 0); // 0ms (fastest)
}
if (!defined('EMAIL_DRIP_PROCESS_MY_MAX_LOOKAHEAD_SEC')) {
    define('EMAIL_DRIP_PROCESS_MY_MAX_LOOKAHEAD_SEC', 21600); // 6 hours
}

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
// Contact fallback scraper tuning (used by Firecrawl gap fill + BamLead extraction fallback)
if (!defined('CONTACT_SCRAPE_TIMEOUT')) {
    define('CONTACT_SCRAPE_TIMEOUT', 8);
}
if (!defined('CONTACT_SCRAPE_MAX_PAGES')) {
    define('CONTACT_SCRAPE_MAX_PAGES', 8);
}
if (!defined('CONTACT_SCRAPE_MAX_QUEUE')) {
    define('CONTACT_SCRAPE_MAX_QUEUE', 24);
}
if (!defined('CONTACT_SCRAPE_EARLY_STOP_EMAILS')) {
    define('CONTACT_SCRAPE_EARLY_STOP_EMAILS', 2);
}

// =====================================
// SEARCH SETTINGS
// =====================================
// Number of results per search (max 10 for Google, 50 for Bing)
if (!defined('RESULTS_PER_PAGE')) {
    define('RESULTS_PER_PAGE', 200);
}
// Legacy SerpAPI throttling (ignored by custom one-shot fetcher)
// Lower = faster, higher = safer vs rate limits. 150000 = 150ms.
if (!defined('SERPAPI_THROTTLE_US')) {
    define('SERPAPI_THROTTLE_US', 80000);
}
// Legacy SerpAPI request timeouts/retries (ignored by custom one-shot fetcher)
if (!defined('SERPAPI_CONNECT_TIMEOUT_SEC')) {
    define('SERPAPI_CONNECT_TIMEOUT_SEC', 15);
}
if (!defined('SERPAPI_TIMEOUT_SEC')) {
    define('SERPAPI_TIMEOUT_SEC', 60);
}
if (!defined('SERPAPI_REQUEST_RETRIES')) {
    define('SERPAPI_REQUEST_RETRIES', 2);
}
// Over-fetch multiplier when filters are active (helps hit target counts)
if (!defined('FILTER_OVERFETCH_MULTIPLIER')) {
    define('FILTER_OVERFETCH_MULTIPLIER', 3);
}
// Minimum acceptable ratio of requested leads before fallback broadening kicks in
if (!defined('SEARCH_FILL_TARGET_RATIO')) {
    define('SEARCH_FILL_TARGET_RATIO', 0.95);
}
// Max number of supplemental query variants used for top-up passes
if (!defined('SEARCH_QUERY_VARIANT_MAX')) {
    define('SEARCH_QUERY_VARIANT_MAX', 8);
}
// Auto-expand locations when results are below the requested limit
if (!defined('ENABLE_LOCATION_EXPANSION')) {
    define('ENABLE_LOCATION_EXPANSION', true);
}
// Maximum number of extra location variants to try
if (!defined('LOCATION_EXPANSION_MAX')) {
    define('LOCATION_EXPANSION_MAX', 15);
}
// Enable radius-style nearby city expansion (used by Option A and Option B)
if (!defined('ENABLE_RADIUS_LOCATION_EXPANSION')) {
    define('ENABLE_RADIUS_LOCATION_EXPANSION', true);
}
// Approximate radius in miles for nearby city expansion
if (!defined('LOCATION_EXPANSION_RADIUS_MILES')) {
    define('LOCATION_EXPANSION_RADIUS_MILES', 40);
}
// Allow widening to state-level searches (broader, less targeted)
if (!defined('LOCATION_EXPANSION_INCLUDE_STATE')) {
    define('LOCATION_EXPANSION_INCLUDE_STATE', false);
}
// Allow widening to country-level searches (very broad)
if (!defined('LOCATION_EXPANSION_INCLUDE_COUNTRY')) {
    define('LOCATION_EXPANSION_INCLUDE_COUNTRY', false);
}

define('TWILIO_ACCOUNT_SID', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
define('TWILIO_AUTH_TOKEN', 'your_auth_token_here');
// Optional but recommended in production: public base URL Twilio should call.
// Example: https://bamlead.com
// Twilio callback paths used by BamLead:
//   /api/twilio.php?action=voice_webhook
//   /api/twilio.php?action=status_webhook
//   /api/twilio.php?action=sms_webhook
define('TWILIO_WEBHOOK_BASE_URL', 'https://bamlead.com');
// Optional/documentary only. BamLead uses provisioned numbers stored in twilio_config.
define('TWILIO_PHONE_NUMBER', '');

// =====================================
// DEBUG MODE
// =====================================
// Set to true to enable detailed error messages (disable in production!)
define('DEBUG_MODE', false);
