<?php
/**
 * BamLead Unified Scraper
 * 
 * Replaces scrape-website-contacts.php and scrape-social-contacts.php with a single,
 * faster endpoint that runs website scraping + social profile discovery in parallel
 * using curl_multi for maximum speed.
 * 
 * Usage:
 *   POST { "url": "https://example.com" }                              — single website scrape
 *   POST { "url": "https://example.com", "business_name": "Acme", "location": "Houston, TX" }
 *                                                                       — website + social combined
 *   POST { "urls": [...], "businesses": [{ "url", "name", "location" }] } — batch mode
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

$startTime = microtime(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $url = isset($_GET['url']) ? trim($_GET['url']) : '';
    $businessName = isset($_GET['business_name']) ? trim($_GET['business_name']) : '';
    $location = isset($_GET['location']) ? trim($_GET['location']) : '';
    $businesses = !empty($url) ? [['url' => $url, 'name' => $businessName, 'location' => $location]] : [];
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $url = isset($input['url']) ? trim($input['url']) : '';
    $businessName = isset($input['business_name']) ? trim($input['business_name']) : '';
    $location = isset($input['location']) ? trim($input['location']) : '';
    $urls = isset($input['urls']) && is_array($input['urls']) ? $input['urls'] : [];
    $businesses = isset($input['businesses']) && is_array($input['businesses']) ? $input['businesses'] : [];
    
    // Single URL mode
    if (!empty($url) && empty($businesses)) {
        $businesses = [['url' => $url, 'name' => $businessName, 'location' => $location]];
    }
    // Legacy URLs array mode
    if (!empty($urls) && empty($businesses)) {
        foreach ($urls as $u) {
            $businesses[] = ['url' => trim($u), 'name' => '', 'location' => ''];
        }
    }
} else {
    sendError('Method not allowed', 405);
}

if (empty($businesses)) {
    sendError('URL, urls array, or businesses array is required');
}

// Limit batch size
$maxBatch = 15;
$businesses = array_slice($businesses, 0, $maxBatch);

$serperKey = defined('SERPER_API_KEY') ? SERPER_API_KEY : '';
$results = [];

foreach ($businesses as $biz) {
    $bizUrl = trim($biz['url'] ?? '');
    $bizName = trim($biz['name'] ?? '');
    $bizLocation = trim($biz['location'] ?? '');
    $bizKey = !empty($bizUrl) ? $bizUrl : $bizName;

    if (empty($bizUrl) && empty($bizName)) {
        continue;
    }

    // Normalize URL
    if (!empty($bizUrl) && !preg_match('/^https?:\/\//', $bizUrl)) {
        $bizUrl = 'https://' . $bizUrl;
    }
    if (!empty($bizUrl) && !filter_var($bizUrl, FILTER_VALIDATE_URL)) {
        $results[$bizKey] = [
            'success' => false,
            'error' => 'Invalid URL format',
            'emails' => [], 'phones' => [], 'profiles' => [], 'sources' => [],
            'hasWebsite' => false
        ];
        continue;
    }

    // Check cache
    $cacheKey = "bamlead_scraper_" . md5($bizUrl . '_' . $bizName . '_' . $bizLocation);
    $cached = getCache($cacheKey);
    if ($cached !== null) {
        $cachedEmails = is_array($cached) ? ($cached['emails'] ?? []) : [];
        $cachedPhones = is_array($cached) ? ($cached['phones'] ?? []) : [];
        if (!empty($cachedEmails) || !empty($cachedPhones)) {
            $results[$bizKey] = array_merge(['success' => true, 'cached' => true], $cached);
            continue;
        }
    }

    try {
        $contactData = bamleadUnifiedScrape($bizUrl, $bizName, $bizLocation, $serperKey);
        
        // Cache: longer for hits, shorter for misses
        $hasContacts = !empty($contactData['emails']) || !empty($contactData['phones']);
        $cacheTtl = $hasContacts ? 86400 : 600; // 24h vs 10min
        setCache($cacheKey, $contactData, $cacheTtl);

        $results[$bizKey] = array_merge([
            'success' => true,
            'cached' => false,
            'url' => $bizUrl
        ], $contactData);
    } catch (Exception $e) {
        $results[$bizKey] = [
            'success' => false,
            'error' => DEBUG_MODE ? $e->getMessage() : 'Scrape failed',
            'emails' => [], 'phones' => [], 'profiles' => [], 'sources' => [],
            'hasWebsite' => false
        ];
    }
}

$elapsed = round((microtime(true) - $startTime) * 1000);

// Single vs batch response
if (count($businesses) === 1) {
    $singleResult = reset($results);
    $singleResult['elapsed_ms'] = $elapsed;
    sendJson($singleResult);
} else {
    sendJson([
        'success' => true,
        'results' => $results,
        'count' => count($results),
        'elapsed_ms' => $elapsed
    ]);
}

// ─── Core unified scraper ───────────────────────────────────────────────────

/**
 * Runs website contact scraping + social profile discovery in parallel via curl_multi.
 */
function bamleadUnifiedScrape($url, $businessName, $location, $serperKey) {
    $allEmails = [];
    $allPhones = [];
    $profiles = [];
    $sources = [];
    $hasWebsite = false;

    // ── Phase 1: Parallel homepage fetch + social Serper queries ──────────
    $mh = curl_multi_init();
    $handles = [];
    $handleMeta = [];

    $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    // 1a) Website homepage
    if (!empty($url)) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => $ua,
            CURLOPT_ENCODING => '', // accept gzip/deflate
        ]);
        $key = 'homepage';
        curl_multi_add_handle($mh, $ch);
        $handles[$key] = $ch;
        $handleMeta[$key] = ['type' => 'website', 'url' => $url];
    }

    // 1b) Social Serper queries (parallel with homepage)
    $socialPlatforms = ['facebook', 'linkedin', 'instagram', 'yelp'];
    $searchName = !empty($businessName) ? $businessName : '';

    // Try to extract business name from URL if not provided
    if (empty($searchName) && !empty($url)) {
        $host = parse_url($url, PHP_URL_HOST);
        if ($host) {
            $searchName = preg_replace('/^www\./', '', $host);
            $searchName = preg_replace('/\.(com|net|org|biz|io|co|us)$/', '', $searchName);
            $searchName = str_replace(['-', '_', '.'], ' ', $searchName);
        }
    }

    if (!empty($serperKey) && !empty($searchName)) {
        foreach ($socialPlatforms as $platform) {
            $siteFilter = $platform . '.com';
            if ($platform === 'linkedin') $siteFilter = 'linkedin.com/company';

            $query = $searchName . ' ' . $location . ' site:' . $siteFilter;
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://google.serper.dev/search',
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode(['q' => $query, 'num' => 3]),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . $serperKey,
                    'Content-Type: application/json'
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_CONNECTTIMEOUT => 3,
            ]);
            $key = 'social_' . $platform;
            curl_multi_add_handle($mh, $ch);
            $handles[$key] = $ch;
            $handleMeta[$key] = ['type' => 'social', 'platform' => $platform];
        }

        // Also query directories in parallel
        $directories = [
            'yellowpages' => 'yellowpages.com',
            'bbb' => 'bbb.org',
            'manta' => 'manta.com',
        ];
        foreach ($directories as $dirKey => $dirDomain) {
            $query = $searchName . ' ' . $location . ' site:' . $dirDomain;
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://google.serper.dev/search',
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode(['q' => $query, 'num' => 2]),
                CURLOPT_HTTPHEADER => [
                    'X-API-KEY: ' . $serperKey,
                    'Content-Type: application/json'
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_CONNECTTIMEOUT => 3,
            ]);
            $key = 'dir_' . $dirKey;
            curl_multi_add_handle($mh, $ch);
            $handles[$key] = $ch;
            $handleMeta[$key] = ['type' => 'directory', 'name' => $dirKey];
        }
    }

    // Execute all Phase 1 requests in parallel
    $running = null;
    do {
        curl_multi_exec($mh, $running);
        curl_multi_select($mh, 0.1);
    } while ($running > 0);

    // Collect Phase 1 results
    $contactPageUrls = [];
    $socialProfileUrls = [];
    $directoryPageUrls = [];

    foreach ($handles as $key => $ch) {
        $response = curl_multi_getcontent($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);

        $meta = $handleMeta[$key];

        if ($meta['type'] === 'website') {
            if ($httpCode === 200 && !empty($response)) {
                $hasWebsite = true;
                // Extract contacts from homepage
                $pageEmails = extractEmails($response);
                $pagePhones = extractPhoneNumbers($response);
                if (preg_match_all('/tel:([+\d\-\(\)\s\.]+)/', $response, $telMatches)) {
                    $pagePhones = array_merge($pagePhones, $telMatches[1]);
                }
                if (!empty($pageEmails)) {
                    $allEmails = array_merge($allEmails, $pageEmails);
                    $sources[] = 'Website (homepage)';
                }
                if (!empty($pagePhones)) {
                    $allPhones = array_merge($allPhones, $pagePhones);
                }

                // Discover contact page links for Phase 2
                $parsed = parse_url($url);
                $baseUrl = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
                if (preg_match_all('/<a[^>]+href=["\']([^"\']+)["\']/i', $response, $linkMatches)) {
                    foreach ($linkMatches[1] as $href) {
                        $href = trim(html_entity_decode((string)$href, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                        if (preg_match('/^(mailto:|tel:|javascript:|#)/i', $href)) continue;
                        if (!preg_match('/(contact|about|team|support|get[-_ ]?in[-_ ]?touch|reach|location)/i', $href)) continue;

                        if (preg_match('/^https?:\/\//i', $href)) {
                            $candidate = $href;
                        } elseif (strpos($href, '/') === 0) {
                            $candidate = $baseUrl . $href;
                        } else {
                            $candidate = $baseUrl . '/' . ltrim($href, '/');
                        }
                        $contactPageUrls[] = $candidate;
                    }
                }

                // Also add common contact paths
                foreach (['/contact', '/contact-us', '/about', '/about-us'] as $path) {
                    $contactPageUrls[] = $baseUrl . $path;
                }
                $contactPageUrls = array_unique(array_slice($contactPageUrls, 0, 6));
            }
        } elseif ($meta['type'] === 'social') {
            if ($httpCode === 200 && !empty($response)) {
                $data = json_decode($response, true);
                $platform = $meta['platform'];
                if (!empty($data['organic'])) {
                    foreach ($data['organic'] as $result) {
                        $link = $result['link'] ?? '';
                        $snippet = $result['snippet'] ?? '';
                        $title = $result['title'] ?? '';

                        // Validate it's a real profile
                        if (!isLikelySocialProfile($platform, $link)) continue;

                        $profiles[$platform] = [
                            'url' => $link,
                            'title' => $title,
                            'snippet' => $snippet
                        ];

                        // Extract contacts from snippets
                        $snippetEmails = extractEmails($snippet . ' ' . $title);
                        $snippetPhones = extractPhoneNumbers($snippet);
                        if (!empty($snippetEmails)) {
                            $allEmails = array_merge($allEmails, $snippetEmails);
                            $sources[] = ucfirst($platform) . ' (snippet)';
                        }
                        if (!empty($snippetPhones)) {
                            $allPhones = array_merge($allPhones, $snippetPhones);
                        }

                        // Queue profile page for Phase 2 scraping
                        $socialProfileUrls[$platform] = $link;
                        break; // Take first valid match
                    }
                }
            }
        } elseif ($meta['type'] === 'directory') {
            if ($httpCode === 200 && !empty($response)) {
                $data = json_decode($response, true);
                if (!empty($data['organic'][0])) {
                    $listing = $data['organic'][0];
                    $snippet = $listing['snippet'] ?? '';
                    $dirEmails = extractEmails($snippet);
                    $dirPhones = extractPhoneNumbers($snippet);
                    if (!empty($dirEmails)) {
                        $allEmails = array_merge($allEmails, $dirEmails);
                        $sources[] = ucfirst($meta['name']);
                    }
                    if (!empty($dirPhones)) {
                        $allPhones = array_merge($allPhones, $dirPhones);
                    }
                    $directoryPageUrls[] = $listing['link'] ?? '';
                }
            }
        }
    }

    // ── Phase 2: Parallel scrape contact pages + social profiles + directories ──
    // Only proceed if we need more contacts
    $needMore = empty($allEmails);
    $phase2Urls = [];

    if ($needMore) {
        // Contact pages from the website
        foreach ($contactPageUrls as $cpUrl) {
            $phase2Urls['contact_' . md5($cpUrl)] = ['type' => 'contact', 'url' => $cpUrl];
        }
    }

    // Social profile pages (always try for additional contacts)
    foreach ($socialProfileUrls as $platform => $profileUrl) {
        $phase2Urls['profile_' . $platform] = ['type' => 'profile', 'url' => $profileUrl, 'platform' => $platform];
    }

    // Directory pages
    if ($needMore) {
        foreach ($directoryPageUrls as $dirUrl) {
            if (!empty($dirUrl)) {
                $phase2Urls['dirpage_' . md5($dirUrl)] = ['type' => 'dirpage', 'url' => $dirUrl];
            }
        }
    }

    if (!empty($phase2Urls)) {
        // Limit Phase 2 to 8 parallel requests
        $phase2Urls = array_slice($phase2Urls, 0, 8, true);
        $handles2 = [];

        foreach ($phase2Urls as $key => $info) {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $info['url'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT => $ua,
                CURLOPT_ENCODING => '',
            ]);
            curl_multi_add_handle($mh, $ch);
            $handles2[$key] = $ch;
        }

        $running = null;
        do {
            curl_multi_exec($mh, $running);
            curl_multi_select($mh, 0.1);
        } while ($running > 0);

        foreach ($handles2 as $key => $ch) {
            $response = curl_multi_getcontent($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);

            if ($httpCode !== 200 || empty($response)) continue;

            $info = $phase2Urls[$key];
            $pageEmails = extractEmails($response);
            $pagePhones = extractPhoneNumbers($response);

            // Also check tel: and mailto: links
            if (preg_match_all('/tel:([+\d\-\(\)\s\.]+)/', $response, $telMatches)) {
                $pagePhones = array_merge($pagePhones, $telMatches[1]);
            }

            if (!empty($pageEmails)) {
                $allEmails = array_merge($allEmails, $pageEmails);
                if ($info['type'] === 'contact') {
                    $sources[] = 'Website (contact page)';
                } elseif ($info['type'] === 'profile') {
                    $sources[] = ucfirst($info['platform']) . ' (profile)';
                } elseif ($info['type'] === 'dirpage') {
                    $sources[] = 'Directory listing';
                }
            }
            if (!empty($pagePhones)) {
                $allPhones = array_merge($allPhones, $pagePhones);
            }

            // Platform-specific JSON extractions
            if ($info['type'] === 'profile') {
                $platform = $info['platform'] ?? '';
                if ($platform === 'facebook') {
                    if (preg_match('/"email":"([^"]+@[^"]+)"/', $response, $m)) {
                        $allEmails[] = strtolower($m[1]);
                    }
                    if (preg_match('/"phone":"([^"]+)"/', $response, $m)) {
                        $allPhones[] = $m[1];
                    }
                }
                if ($platform === 'linkedin') {
                    if (preg_match('/"email"\s*:\s*"([^"]+@[^"]+)"/', $response, $m)) {
                        $allEmails[] = strtolower($m[1]);
                    }
                }
                if ($platform === 'yelp') {
                    if (preg_match('/biz-phone[^>]*>([^<]+)/', $response, $m)) {
                        $allPhones[] = trim($m[1]);
                    }
                }
            }
        }
    }

    curl_multi_close($mh);

    // ── Dedupe & clean ──────────────────────────────────────────────────────
    $allEmails = array_values(array_unique($allEmails));
    $allPhones = array_values(array_unique(array_map(function($p) {
        return preg_replace('/[^\d+]/', '', $p);
    }, $allPhones)));

    // Filter valid phones (10+ digits)
    $allPhones = array_values(array_filter($allPhones, function($p) {
        $digits = preg_replace('/\D/', '', $p);
        return strlen($digits) >= 10;
    }));

    // Limit
    $allEmails = array_slice($allEmails, 0, 10);
    $allPhones = array_slice($allPhones, 0, 5);
    $sources = array_values(array_unique($sources));

    return [
        'emails' => $allEmails,
        'phones' => $allPhones,
        'profiles' => $profiles,
        'sources' => $sources,
        'hasWebsite' => $hasWebsite,
    ];
}

/**
 * Check if a URL is a likely valid social profile (not a search/generic page)
 */
function isLikelySocialProfile($platform, $url) {
    if (empty($url)) return false;
    $path = strtolower((string)parse_url((string)$url, PHP_URL_PATH));

    $blocked = ['/search', '/groups/', '/events/', '/watch', '/marketplace', '/reel',
                '/share', '/feed', '/jobs', '/learning', '/school', '/pulse',
                '/explore', '/p/', '/stories'];
    foreach ($blocked as $fragment) {
        if (strpos($path, $fragment) !== false) return false;
    }

    // Must have a non-empty path
    $trimmedPath = trim($path, '/');
    return !empty($trimmedPath);
}
