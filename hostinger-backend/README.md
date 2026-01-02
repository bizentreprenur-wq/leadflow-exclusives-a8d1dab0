# GMB Search Backend for Hostinger

This PHP backend powers the Google My Business search functionality.

## Setup Instructions

### 1. Upload Files to Hostinger

Upload the entire `hostinger-backend` folder to your Hostinger hosting via:
- File Manager in hPanel
- FTP client (FileZilla, etc.)

Your folder structure should look like:
```
public_html/
├── api/
│   └── gmb-search.php
├── config.php
└── .htaccess
```

### 2. Configure API Keys

Edit `config.php` and add your Google API credentials:

1. **Get Google Custom Search API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Custom Search API"
   - Create credentials → API Key

2. **Create Custom Search Engine:**
   - Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Create a new search engine
   - Set "Search the entire web" option
   - Copy the Search Engine ID (cx parameter)

3. **Update config.php:**
```php
define('GOOGLE_API_KEY', 'your-api-key-here');
define('GOOGLE_SEARCH_ENGINE_ID', 'your-search-engine-id');
```

### 3. Update Frontend API URL

In your Lovable app, update the API endpoint in `src/lib/api/gmb.ts`:

```typescript
const API_BASE_URL = 'https://yourdomain.com/api';
```

### 4. Test the API

You can test the API with curl:

```bash
curl -X POST https://yourdomain.com/api/gmb-search.php \
  -H "Content-Type: application/json" \
  -d '{"service": "plumber", "location": "Austin, TX"}'
```

## Features

- ✅ Searches for businesses by service type and location
- ✅ Analyzes websites for platform detection (WordPress, Wix, etc.)
- ✅ Identifies website issues (mobile responsiveness, SEO, etc.)
- ✅ Flags businesses that need website upgrades
- ✅ Returns mock data when API keys not configured (for testing)

## API Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "gmb_abc123",
      "name": "Business Name",
      "url": "https://business-website.com",
      "snippet": "Description from search results",
      "displayLink": "business-website.com",
      "websiteAnalysis": {
        "hasWebsite": true,
        "platform": "WordPress",
        "needsUpgrade": true,
        "issues": ["Not mobile responsive", "Missing meta description"],
        "mobileScore": null
      }
    }
  ],
  "query": {
    "service": "plumber",
    "location": "Austin, TX"
  }
}
```

## Security Notes

- The `config.php` file is protected from direct access via `.htaccess`
- Input is sanitized and length-limited
- CORS headers allow cross-origin requests from your frontend
