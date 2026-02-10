<?php
/**
 * Scrape Social Media Profiles for Contact Information
 * 
 * Scrapes public social media pages (Facebook, Instagram, LinkedIn, etc.)
 * to extract visible contact information (email, phone) from the public landing pages.
 * Does NOT log into accounts - only reads publicly visible data.
 * 
 * Usage: POST { "business_name": "Acme Corp", "location": "Houston, TX" }
 * Returns: { success: true, contacts: { emails: [], phones: [], profiles: {} } }
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getJsonInput();
$businessName = isset($input['business_name']) ? sanitizeInput($input['business_name'], 200) : '';
$location = isset($input['location']) ? sanitizeInput($input['location'], 200) : '';

if (empty($businessName)) {
    sendError('Business name is required');
}

// Check cache first
$cacheKey = "social_contacts_" . md5($businessName . '_' . $location);
$cached = getCache($cacheKey);

if ($cached !== null) {
    sendJson(array_merge(['success' => true, 'cached' => true], $cached));
}

$contacts = [
    'emails' => [],
    'phones' => [],
    'profiles' => [],
    'sources' => []
];

// Social platforms to search for contact info
$platforms = [
    'facebook' => [
        'search_url' => 'https://www.google.com/search?q=' . urlencode($businessName . ' ' . $location . ' site:facebook.com'),
        'profile_patterns' => [
            '/facebook\.com\/([a-zA-Z0-9\.\-]+)\/?/'
        ],
        'name' => 'Facebook'
    ],
    'linkedin' => [
        'search_url' => 'https://www.google.com/search?q=' . urlencode($businessName . ' ' . $location . ' site:linkedin.com/company'),
        'profile_patterns' => [
            '/linkedin\.com\/company\/([a-zA-Z0-9\-]+)\/?/'
        ],
        'name' => 'LinkedIn'
    ],
    'instagram' => [
        'search_url' => 'https://www.google.com/search?q=' . urlencode($businessName . ' site:instagram.com'),
        'profile_patterns' => [
            '/instagram\.com\/([a-zA-Z0-9\._]+)\/?/'
        ],
        'name' => 'Instagram'
    ],
    'yelp' => [
        'search_url' => 'https://www.google.com/search?q=' . urlencode($businessName . ' ' . $location . ' site:yelp.com'),
        'profile_patterns' => [
            '/yelp\.com\/biz\/([a-zA-Z0-9\-]+)/'
        ],
        'name' => 'Yelp'
    ],
];

$searchQuery = $businessName . ' ' . $location;

// Use Serper for better search results if available
$serperKey = defined('SERPER_API_KEY') ? SERPER_API_KEY : '';

foreach ($platforms as $platformKey => $platform) {
    try {
        $profileUrl = null;
        
        // Try to find the profile URL using Serper or direct search
        if (!empty($serperKey)) {
            // Use Serper to find the social profile
            $serperResult = curlRequest('https://google.serper.dev/search', [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode([
                    'q' => $businessName . ' ' . $location . ' site:' . $platformKey . '.com',
                    'num' => 3
                ]),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . $serperKey,
                    'Content-Type: application/json'
                ],
            ], 10);
            
            if ($serperResult['httpCode'] === 200 && !empty($serperResult['response'])) {
                $serperData = json_decode($serperResult['response'], true);
                if (!empty($serperData['organic'])) {
                    foreach ($serperData['organic'] as $result) {
                        $link = $result['link'] ?? '';
                        if (!isLikelyProfileLink($platformKey, $link)) {
                            continue;
                        }
                        // Check if this is a real profile link
                        foreach ($platform['profile_patterns'] as $pattern) {
                            if (preg_match($pattern, $link, $matches)) {
                                $profileUrl = $link;
                                $contacts['profiles'][$platformKey] = [
                                    'url' => $profileUrl,
                                    'username' => $matches[1] ?? null,
                                    'title' => $result['title'] ?? '',
                                    'snippet' => $result['snippet'] ?? ''
                                ];
                                
                                // Extract any contact info from the snippet
                                $snippet = $result['snippet'] ?? '';
                                $snippetEmails = extractEmails($snippet);
                                $snippetPhones = extractPhoneNumbers($snippet);
                                
                                if (!empty($snippetEmails)) {
                                    $contacts['emails'] = array_merge($contacts['emails'], $snippetEmails);
                                    $contacts['sources'][] = $platform['name'] . ' (search snippet)';
                                }
                                if (!empty($snippetPhones)) {
                                    $contacts['phones'] = array_merge($contacts['phones'], $snippetPhones);
                                }
                                
                                break 2;
                            }
                        }
                    }
                }
            }
        }
        
        // If we found a profile URL, try to scrape it for contact info
        if ($profileUrl) {
            $scraped = scrapePublicProfilePage($profileUrl, $platformKey);
            if (!empty($scraped['emails'])) {
                $contacts['emails'] = array_merge($contacts['emails'], $scraped['emails']);
                $contacts['sources'][] = $platform['name'] . ' (profile page)';
            }
            if (!empty($scraped['phones'])) {
                $contacts['phones'] = array_merge($contacts['phones'], $scraped['phones']);
            }
        }
        
    } catch (Exception $e) {
        // Log but continue with other platforms
        error_log("Social scrape error for {$platformKey}: " . $e->getMessage());
    }
    
    // Small delay between platforms
    usleep(200000); // 200ms
}

// Also try to find business directory listings
$directoryPlatforms = [
    'yellowpages' => 'site:yellowpages.com',
    'bbb' => 'site:bbb.org',
    'manta' => 'site:manta.com',
];

foreach ($directoryPlatforms as $dirKey => $siteFilter) {
    if (!empty($serperKey)) {
        try {
            $dirResult = curlRequest('https://google.serper.dev/search', [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode([
                    'q' => $businessName . ' ' . $location . ' ' . $siteFilter,
                    'num' => 2
                ]),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . $serperKey,
                    'Content-Type: application/json'
                ],
            ], 8);
            
            if ($dirResult['httpCode'] === 200 && !empty($dirResult['response'])) {
                $dirData = json_decode($dirResult['response'], true);
                if (!empty($dirData['organic'][0])) {
                    $listing = $dirData['organic'][0];
                    $snippet = $listing['snippet'] ?? '';
                    
                    // Extract contact from snippets
                    $dirEmails = extractEmails($snippet);
                    $dirPhones = extractPhoneNumbers($snippet);
                    
                    if (!empty($dirEmails)) {
                        $contacts['emails'] = array_merge($contacts['emails'], $dirEmails);
                        $contacts['sources'][] = ucfirst($dirKey);
                    }
                    if (!empty($dirPhones)) {
                        $contacts['phones'] = array_merge($contacts['phones'], $dirPhones);
                    }
                    
                    // Optionally scrape the page
                    $dirUrl = $listing['link'] ?? '';
                    if (!empty($dirUrl)) {
                        $dirScraped = scrapeWebsiteForContacts($dirUrl, 6);
                        if (!empty($dirScraped['emails'])) {
                            $contacts['emails'] = array_merge($contacts['emails'], $dirScraped['emails']);
                        }
                        if (!empty($dirScraped['phones'])) {
                            $contacts['phones'] = array_merge($contacts['phones'], $dirScraped['phones']);
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Continue
        }
        
        usleep(150000);
    }
}

// Dedupe and clean results
$contacts['emails'] = array_values(array_unique($contacts['emails']));
$contacts['phones'] = array_values(array_unique(array_map(function($p) {
    return preg_replace('/[^\d+]/', '', $p);
}, $contacts['phones'])));

// Filter valid phones
$contacts['phones'] = array_values(array_filter($contacts['phones'], function($p) {
    $digits = preg_replace('/\D/', '', $p);
    return strlen($digits) >= 10;
}));

// Limit results
$contacts['emails'] = array_slice($contacts['emails'], 0, 5);
$contacts['phones'] = array_slice($contacts['phones'], 0, 3);
$contacts['sources'] = array_values(array_unique($contacts['sources']));

// Cache for 12 hours
setCache($cacheKey, $contacts, 43200);

sendJson([
    'success' => true,
    'cached' => false,
    'business_name' => $businessName,
    'location' => $location,
    'contacts' => $contacts
]);

/**
 * Scrape a public social profile page for contact information
 * Does NOT log in - only reads publicly visible content
 */
function scrapePublicProfilePage($url, $platform) {
    $result = [
        'emails' => [],
        'phones' => []
    ];
    
    try {
        $response = curlRequest($url, [
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ], 8);
        
        if ($response['httpCode'] !== 200 || empty($response['response'])) {
            return $result;
        }
        
        $html = $response['response'];
        
        // Extract emails
        $result['emails'] = extractEmails($html);
        
        // Extract phones
        $result['phones'] = extractPhoneNumbers($html);
        
        // Platform-specific extractions
        if ($platform === 'facebook') {
            // Look for About section content, contact info in footer
            if (preg_match('/"email":"([^"]+@[^"]+)"/', $html, $emailMatch)) {
                $result['emails'][] = strtolower($emailMatch[1]);
            }
            if (preg_match('/"phone":"([^"]+)"/', $html, $phoneMatch)) {
                $result['phones'][] = $phoneMatch[1];
            }
        }
        
        if ($platform === 'linkedin') {
            // LinkedIn company pages sometimes show email/phone in structured data
            if (preg_match('/"email"\s*:\s*"([^"]+@[^"]+)"/', $html, $emailMatch)) {
                $result['emails'][] = strtolower($emailMatch[1]);
            }
        }
        
        if ($platform === 'yelp') {
            // Yelp often shows phone prominently
            if (preg_match('/biz-phone[^>]*>([^<]+)/', $html, $phoneMatch)) {
                $result['phones'][] = trim($phoneMatch[1]);
            }
        }
        
        // Also check for mailto: and tel: links
        if (preg_match_all('/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/', $html, $mailtoMatches)) {
            $result['emails'] = array_merge($result['emails'], array_map('strtolower', $mailtoMatches[1]));
        }
        
        if (preg_match_all('/tel:([+\d\-\(\)\s\.]+)/', $html, $telMatches)) {
            $result['phones'] = array_merge($result['phones'], $telMatches[1]);
        }
        
    } catch (Exception $e) {
        error_log("Profile scrape error: " . $e->getMessage());
    }
    
    // Dedupe
    $result['emails'] = array_values(array_unique($result['emails']));
    $result['phones'] = array_values(array_unique($result['phones']));
    
    return $result;
}

function isLikelyProfileLink($platform, $url) {
    $path = strtolower((string)parse_url((string)$url, PHP_URL_PATH));
    $query = strtolower((string)parse_url((string)$url, PHP_URL_QUERY));
    $joined = trim($path . ' ' . $query);

    if ($platform === 'facebook') {
        $blocked = ['/search', '/groups', '/events', '/watch', '/marketplace', '/reel', '/share'];
        foreach ($blocked as $fragment) {
            if (strpos($joined, $fragment) !== false) {
                return false;
            }
        }
    }

    if ($platform === 'linkedin') {
        $blocked = ['/search', '/feed', '/jobs', '/learning', '/school', '/pulse'];
        foreach ($blocked as $fragment) {
            if (strpos($joined, $fragment) !== false) {
                return false;
            }
        }
    }

    return true;
}
