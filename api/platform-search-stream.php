<?php
/**
 * Platform Search API Endpoint - STREAMING VERSION
 * SSE streaming for Agency Lead Finder (Option B)
 * Mirrors gmb-search-stream.php pattern for progressive delivery
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/ratelimit.php';

// SSE headers
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');
setCorsHeaders();

// Disable output buffering for streaming
if (ob_get_level()) ob_end_clean();
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', false);

set_time_limit(600); // 10 minutes max
ini_set('memory_limit', '512M');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendSSEMsg('error', ['error' => 'Method not allowed']);
    exit();
}

$user = getCurrentUser();
if ($user) {
    enforceRateLimit($user, 'search');
}

$input = getJsonInput();
if (!$input) {
    sendSSEMsg('error', ['error' => 'Invalid JSON input']);
    exit();
}

$service = sanitizeInput($input['service'] ?? '');
$location = sanitizeInput($input['location'] ?? '');
$platforms = isset($input['platforms']) && is_array($input['platforms']) ? $input['platforms'] : [];
$limit = isset($input['limit']) ? min(2000, max(10, intval($input['limit']))) : 100;

if (empty($service)) {
    sendSSEMsg('error', ['error' => 'Service type is required']);
    exit();
}
if (empty($location)) {
    sendSSEMsg('error', ['error' => 'Location is required']);
    exit();
}
if (empty($platforms)) {
    sendSSEMsg('error', ['error' => 'At least one platform must be selected']);
    exit();
}

$platforms = array_map(function($p) {
    return sanitizeInput($p, 50);
}, array_slice($platforms, 0, 20));

streamPlatformSearch($service, $location, $platforms, $limit);

/**
 * Send SSE message
 */
function sendSSEMsg($event, $data) {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    if (function_exists('ob_flush')) {
        @ob_flush();
    }
    flush();
}

/**
 * Stream platform search results progressively
 */
function streamPlatformSearch($service, $location, $platforms, $limit) {
    $hasSerper = defined('SERPER_API_KEY') && !empty(SERPER_API_KEY);
    $hasSerpApi = defined('SERPAPI_KEY') && !empty(SERPAPI_KEY);
    $hasGoogleApi = !empty(GOOGLE_API_KEY) && !empty(GOOGLE_SEARCH_ENGINE_ID);
    $hasBingApi = !empty(BING_API_KEY);

    if (!$hasSerper && !$hasSerpApi && !$hasGoogleApi && !$hasBingApi) {
        sendSSEMsg('error', ['error' => 'No search API configured. Please set SERPER_API_KEY, SERPAPI_KEY, GOOGLE_API_KEY, or BING_API_KEY.']);
        return;
    }

    $platformQueries = buildPlatformQueries($platforms);
    $queryGroups = array_chunk($platformQueries, 3);

    // Synonym expansion
    $serviceVariants = expandServiceSynonyms($service);
    if (empty($serviceVariants)) {
        $serviceVariants = [$service];
    } elseif (!in_array($service, $serviceVariants, true)) {
        array_unshift($serviceVariants, $service);
    }
    $serviceVariantCap = 5;
    if ($limit >= 250) $serviceVariantCap = 10;
    if ($limit >= 500) $serviceVariantCap = 15;
    if ($limit >= 1000) $serviceVariantCap = 20;
    if ($limit >= 2000) $serviceVariantCap = 30;
    $serviceVariants = array_slice(array_values(array_unique($serviceVariants)), 0, $serviceVariantCap);

    // Location expansion
    $locationVariants = array_merge([$location], buildLocationExpansions($location));
    $locationVariantCap = 12;
    if ($limit >= 250) $locationVariantCap = 20;
    if ($limit >= 500) $locationVariantCap = 28;
    $locationVariants = array_slice(array_values(array_unique($locationVariants)), 0, $locationVariantCap);

    // Build search combos
    $searchCombos = [];
    foreach ($locationVariants as $locVariant) {
        foreach ($serviceVariants as $serviceVariant) {
            $comboKey = strtolower(trim($serviceVariant)) . '|' . strtolower(trim($locVariant));
            if (!isset($searchCombos[$comboKey])) {
                $searchCombos[$comboKey] = [
                    'service' => $serviceVariant,
                    'location' => $locVariant,
                ];
            }
        }
    }
    $comboCap = 30;
    if ($limit >= 250) $comboCap = 60;
    if ($limit >= 500) $comboCap = 90;
    if ($limit >= 1000) $comboCap = 140;
    if ($limit >= 2000) $comboCap = 200;
    $searchCombos = array_slice(array_values($searchCombos), 0, $comboCap);

    sendSSEMsg('start', [
        'query' => "$service in $location",
        'limit' => $limit,
        'platforms' => $platforms,
        'synonymsUsed' => $serviceVariants,
        'locationsExpanded' => count($locationVariants),
    ]);

    $unique = [];
    $seen = [];
    $totalResults = 0;

    $addAndStream = function($results) use (&$unique, &$seen, &$totalResults, $limit) {
        foreach ($results as $result) {
            if ($totalResults >= $limit) return;
            
            $domain = parse_url($result['url'] ?? '', PHP_URL_HOST);
            if (!$domain || isset($seen[$domain])) continue;
            $seen[$domain] = true;

            // Quick website check + contact extraction
            $result['websiteAnalysis'] = quickWebsiteCheckPlatform($result['url']);
            if (empty($result['email'])) {
                $result['email'] = extractEmailFromSnippetPlatform($result['snippet'] ?? '');
            }
            // Inline email extraction from website if still missing
            if (empty($result['email']) && !empty($result['url'])) {
                $result['email'] = inlineExtractEmailPlatform($result['url']);
            }
            if (empty($result['phone'])) {
                $result['phone'] = extractPhoneFromSnippetPlatform($result['snippet'] ?? '');
            }
            $result['contactCompleteness'] = (!empty($result['email']) && !empty($result['phone'])) ? 'full' : 'partial';

            $unique[] = $result;
            $totalResults++;

            $progress = min(100, round(($totalResults / max(1, $limit)) * 100));
            sendSSEMsg('results', [
                'leads' => [$result],
                'total' => $totalResults,
                'progress' => $progress,
                'source' => $result['source'] ?? 'search',
            ]);
        }
    };

    foreach ($searchCombos as $comboIdx => $combo) {
        if ($totalResults >= $limit) break;

        $comboService = $combo['service'];
        $comboLocation = $combo['location'];

        if ($comboIdx > 0 && $comboIdx % 5 === 0) {
            sendSSEMsg('status', [
                'message' => "Expanding search... ({$totalResults}/{$limit} found)",
                'progress' => min(95, round(($totalResults / max(1, $limit)) * 100)),
                'synonymsUsed' => $serviceVariants,
            ]);
        }

        foreach ($queryGroups as $group) {
            if ($totalResults >= $limit) break 2;
            $remaining = $limit - $totalResults;

            if ($hasSerpApi) {
                try {
                    $addAndStream(searchSerpApiPlatform($comboService, $comboLocation, $group, $remaining));
                } catch (Exception $e) {
                    if (isSerpApiCreditsErrorPlatform($e->getMessage()) && $hasSerper) {
                        $addAndStream(searchSerperPlatform($comboService, $comboLocation, $group, $remaining));
                    }
                }
            } elseif ($hasSerper) {
                $addAndStream(searchSerperPlatform($comboService, $comboLocation, $group, $remaining));
            } elseif ($hasGoogleApi) {
                $addAndStream(searchGooglePlatform($comboService, $comboLocation, $group, $remaining));
            }

            if ($hasBingApi && $totalResults < $limit) {
                $addAndStream(searchBingPlatform($comboService, $comboLocation, $group, $limit - $totalResults));
            }
        }
    }

    // Prioritize: full contact first, then partial
    $fullContact = [];
    $partial = [];
    foreach ($unique as $r) {
        if ($r['contactCompleteness'] === 'full') {
            $fullContact[] = $r;
        } else {
            $partial[] = $r;
        }
    }

    sendSSEMsg('complete', [
        'total' => $totalResults,
        'requested' => $limit,
        'coverage' => round(($totalResults / max(1, $limit)) * 100, 2),
        'fullContact' => count($fullContact),
        'partialContact' => count($partial),
        'synonymsUsed' => $serviceVariants,
        'query' => [
            'service' => $service,
            'location' => $location,
            'platforms' => $platforms,
        ],
    ]);
}

// ===================== Helper functions (scoped to this file) =====================

function quickWebsiteCheckPlatform($url) {
    $host = parse_url($url, PHP_URL_HOST) ?? '';
    $hostLower = strtolower($host);
    $platform = null;
    $needsUpgrade = false;
    $issues = [];
    
    if (strpos($hostLower, 'wix') !== false || strpos($hostLower, 'wixsite') !== false) {
        $platform = 'wix'; $needsUpgrade = true; $issues[] = 'Using Wix template';
    } elseif (strpos($hostLower, 'squarespace') !== false) {
        $platform = 'squarespace'; $needsUpgrade = true; $issues[] = 'Using Squarespace template';
    } elseif (strpos($hostLower, 'weebly') !== false) {
        $platform = 'weebly'; $needsUpgrade = true; $issues[] = 'Using Weebly template';
    } elseif (strpos($hostLower, 'godaddy') !== false) {
        $platform = 'godaddy'; $needsUpgrade = true; $issues[] = 'Using GoDaddy builder';
    } elseif (strpos($hostLower, 'wordpress.com') !== false) {
        $platform = 'wordpress.com'; $needsUpgrade = true; $issues[] = 'Using free WordPress.com';
    } elseif (strpos($hostLower, 'shopify') !== false) {
        $platform = 'shopify';
    } elseif (strpos($hostLower, 'blogger') !== false || strpos($hostLower, 'blogspot') !== false) {
        $platform = 'blogger'; $needsUpgrade = true; $issues[] = 'Using Blogger';
    } elseif (strpos($hostLower, 'facebook.com') !== false) {
        $platform = 'facebook'; $needsUpgrade = true; $issues[] = 'Only Facebook presence';
    }
    
    return [
        'hasWebsite' => true,
        'platform' => $platform,
        'needsUpgrade' => $needsUpgrade,
        'issues' => $issues,
        'mobileScore' => null,
        'loadTime' => null,
    ];
}

function extractEmailFromSnippetPlatform($text) {
    if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
        $email = strtolower($matches[0]);
        $exclude = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.'];
        foreach ($exclude as $p) {
            if (strpos($email, $p) !== false) return null;
        }
        return $email;
    }
    return null;
}

function extractPhoneFromSnippetPlatform($text) {
    if (preg_match('/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $text, $matches)) {
        return $matches[0];
    }
    return null;
}

/**
 * Inline email extraction for platform search — scrapes homepage + /contact page
 */
function inlineExtractEmailPlatform($url) {
    if (empty($url)) return null;
    if (!preg_match('/^https?:\/\//', $url)) $url = 'https://' . $url;
    
    $cacheKey = "scrape_contacts_" . md5($url);
    $cached = getCache($cacheKey);
    if ($cached !== null && !empty($cached['emails'])) {
        return $cached['emails'][0] ?? null;
    }
    
    try {
        $parsed = parse_url($url);
        if (!$parsed || empty($parsed['host'])) return null;
        $baseUrl = ($parsed['scheme'] ?? 'https') . '://' . $parsed['host'];
        
        $result = curlRequest($baseUrl, [
            CURLOPT_TIMEOUT => 3, CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_SSL_VERIFYPEER => false, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 2,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ], 3);
        
        if ($result['httpCode'] === 200 && !empty($result['response'])) {
            $emails = extractEmails($result['response']);
            if (!empty($emails)) {
                setCache($cacheKey, ['emails' => $emails, 'phones' => [], 'hasWebsite' => true], 86400);
                return $emails[0];
            }
            $contactResult = curlRequest($baseUrl . '/contact', [
                CURLOPT_TIMEOUT => 2, CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_SSL_VERIFYPEER => false, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 2,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ], 2);
            if ($contactResult['httpCode'] === 200 && !empty($contactResult['response'])) {
                $contactEmails = extractEmails($contactResult['response']);
                if (!empty($contactEmails)) {
                    setCache($cacheKey, ['emails' => $contactEmails, 'phones' => [], 'hasWebsite' => true], 86400);
                    return $contactEmails[0];
                }
            }
        }
    } catch (Exception $e) {}
    return null;
}

function isSerpApiCreditsErrorPlatform($message) {
    $msg = strtolower($message);
    $needles = ['run out of searches','no searches left','no more searches','insufficient credits','exceeded your plan','exceeded plan','payment required','quota'];
    foreach ($needles as $needle) {
        if (strpos($msg, $needle) !== false) return true;
    }
    return false;
}

function searchSerperPlatform($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    $resultsPerPage = min(100, $limit);
    $maxPages = min(ceil($limit / $resultsPerPage), 10);
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) break;
        
        $payload = [
            'q' => $baseQuery,
            'num' => min($resultsPerPage, $limit - count($results)),
            'gl' => 'us', 'hl' => 'en'
        ];
        if ($page > 0) $payload['page'] = $page + 1;
        
        $response = curlRequest('https://google.serper.dev/search', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['X-API-KEY: ' . SERPER_API_KEY, 'Content-Type: application/json']
        ]);
        
        if ($response['httpCode'] !== 200) {
            if ($page === 0) throw new Exception('Serper error: HTTP ' . $response['httpCode']);
            break;
        }
        
        $data = json_decode($response['response'], true);
        if (!isset($data['organic']) || empty($data['organic'])) break;
        
        foreach ($data['organic'] as $item) {
            if (count($results) >= $limit) break 2;
            $results[] = [
                'id' => generateId('srpr_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => parse_url($item['link'] ?? '', PHP_URL_HOST) ?: '',
                'source' => 'serper',
                'phone' => extractPhoneFromSnippetPlatform($item['snippet'] ?? ''),
                'address' => '',
            ];
        }
    }
    return $results;
}

function searchSerpApiPlatform($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    $resultsPerPage = 10;
    $maxPages = min(ceil($limit / $resultsPerPage), 50);
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) break;
        
        $params = [
            'api_key' => SERPAPI_KEY, 'engine' => 'google',
            'q' => $baseQuery, 'num' => min($resultsPerPage, $limit - count($results))
        ];
        if ($page > 0) $params['start'] = $page * $resultsPerPage;
        
        $url = "https://serpapi.com/search.json?" . http_build_query($params);
        $response = curlRequest($url, [
            CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ], 30);
        
        if ($response['httpCode'] !== 200) {
            if ($page === 0) throw new Exception('SerpAPI error: HTTP ' . $response['httpCode']);
            break;
        }
        
        $data = json_decode($response['response'], true);
        if (!isset($data['organic_results']) || empty($data['organic_results'])) break;
        
        foreach ($data['organic_results'] as $item) {
            if (count($results) >= $limit) break 2;
            $results[] = [
                'id' => generateId('serp_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => $item['displayed_link'] ?? parse_url($item['link'] ?? '', PHP_URL_HOST) ?: '',
                'source' => 'serpapi',
                'phone' => extractPhoneFromSnippetPlatform($item['snippet'] ?? ''),
                'address' => $item['address'] ?? '',
            ];
        }
    }
    return $results;
}

function searchGooglePlatform($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    $resultsPerPage = 10;
    $maxPages = min(ceil($limit / $resultsPerPage), 10);
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) break;
        $params = [
            'key' => GOOGLE_API_KEY, 'cx' => GOOGLE_SEARCH_ENGINE_ID,
            'q' => $baseQuery, 'num' => $resultsPerPage
        ];
        if ($page > 0) $params['start'] = ($page * $resultsPerPage) + 1;
        $url = "https://www.googleapis.com/customsearch/v1?" . http_build_query($params);
        $response = curlRequest($url);
        if ($response['httpCode'] !== 200) break;
        $data = json_decode($response['response'], true);
        if (!isset($data['items']) || empty($data['items'])) break;
        foreach ($data['items'] as $item) {
            if (count($results) >= $limit) break 2;
            $results[] = [
                'id' => generateId('goog_'),
                'name' => $item['title'] ?? 'Unknown Business',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => $item['displayLink'] ?? '',
                'source' => 'google',
            ];
        }
    }
    return $results;
}

function searchBingPlatform($service, $location, $platformQueries, $limit = 100) {
    $results = [];
    $baseQuery = "$service $location";
    if (!empty($platformQueries)) {
        $baseQuery .= ' (' . implode(' OR ', array_slice($platformQueries, 0, 3)) . ')';
    }
    
    $resultsPerPage = 50;
    $maxPages = min(ceil($limit / $resultsPerPage), 20);
    
    for ($page = 0; $page < $maxPages; $page++) {
        if (count($results) >= $limit) break;
        $params = [
            'q' => $baseQuery,
            'count' => min($resultsPerPage, $limit - count($results)),
            'responseFilter' => 'Webpages',
        ];
        if ($page > 0) $params['offset'] = $page * $resultsPerPage;
        $url = "https://api.bing.microsoft.com/v7.0/search?" . http_build_query($params);
        $response = curlRequest($url, [
            CURLOPT_HTTPHEADER => ['Ocp-Apim-Subscription-Key: ' . BING_API_KEY]
        ]);
        if ($response['httpCode'] !== 200) break;
        $data = json_decode($response['response'], true);
        if (!isset($data['webPages']['value']) || empty($data['webPages']['value'])) break;
        foreach ($data['webPages']['value'] as $item) {
            if (count($results) >= $limit) break 2;
            $results[] = [
                'id' => generateId('bing_'),
                'name' => $item['name'] ?? 'Unknown Business',
                'url' => $item['url'] ?? '',
                'snippet' => $item['snippet'] ?? '',
                'displayLink' => parse_url($item['url'] ?? '', PHP_URL_HOST) ?: '',
                'source' => 'bing',
            ];
        }
    }
    return $results;
}

/**
 * Build search query modifiers for platforms
 */
function buildPlatformQueries($platforms) {
    $modifiers = [];
    $platformIndicators = [
        'wordpress' => 'site:*.wordpress.com OR "powered by wordpress" OR "wp-content"',
        'wix' => 'site:*.wix.com OR site:*.wixsite.com OR "built with wix"',
        'weebly' => 'site:*.weebly.com OR "powered by weebly"',
        'godaddy' => '"godaddy website" OR site:*.godaddysites.com',
        'squarespace' => 'site:*.squarespace.com OR "powered by squarespace"',
        'joomla' => '"powered by joomla" OR "joomla!"',
        'drupal' => '"powered by drupal"',
        'webcom' => 'site:*.web.com',
        'jimdo' => 'site:*.jimdofree.com OR site:*.jimdo.com',
        'opencart' => '"powered by opencart"',
        'prestashop' => '"powered by prestashop"',
        'magento' => '"powered by magento"',
        'zencart' => '"powered by zen cart"',
        'oscommerce' => '"powered by oscommerce"',
        'customhtml' => 'inurl:".html" OR inurl:".htm"',
        'customphp' => 'inurl:".php"',
        'gmb' => 'site:google.com/maps OR site:maps.google.com OR "google.com/maps/place"',
        // Free business directories - Major platforms
        'yelp' => 'site:yelp.com',
        'bbb' => 'site:bbb.org',
        'yellowpages' => 'site:yellowpages.com',
        'manta' => 'site:manta.com',
        'angi' => 'site:angi.com OR site:angieslist.com',
        'thumbtack' => 'site:thumbtack.com',
        'homeadvisor' => 'site:homeadvisor.com',
        // Map directories
        'mapquest' => 'site:mapquest.com',
        'foursquare' => 'site:foursquare.com',
        // Classic directories
        'superpages' => 'site:superpages.com',
        'citysearch' => 'site:citysearch.com',
        'whitepages' => 'site:whitepages.com',
        'dexknows' => 'site:dexknows.com',
        'local' => 'site:local.com',
        // Business directories
        'chamberofcommerce' => 'site:chamberofcommerce.com',
        'merchantcircle' => 'site:merchantcircle.com',
        'brownbook' => 'site:brownbook.net',
        'hotfrog' => 'site:hotfrog.com',
        'spoke' => 'site:spoke.com',
        'buzzfile' => 'site:buzzfile.com',
        'dandb' => 'site:dandb.com OR site:dnb.com',
        // Service directories
        'bark' => 'site:bark.com',
        'expertise' => 'site:expertise.com',
        'thervo' => 'site:thervo.com',
        'porch' => 'site:porch.com',
        'networx' => 'site:networx.com',
        'houzz' => 'site:houzz.com',
        'buildzoom' => 'site:buildzoom.com',
        // USA aggregators
        'searchusa' => 'site:searchusa.com',
        'showmelocal' => 'site:showmelocal.com',
        'cylex' => 'site:cylex-usa.com',
        'americantowns' => 'site:americantowns.com',
        // Health directories
        'healthgrades' => 'site:healthgrades.com',
        'zocdoc' => 'site:zocdoc.com',
        'vitals' => 'site:vitals.com',
        // Legal directories
        'avvo' => 'site:avvo.com',
        'justia' => 'site:justia.com',
        'findlaw' => 'site:findlaw.com',
        // Food directories
        'tripadvisor' => 'site:tripadvisor.com',
        'opentable' => 'site:opentable.com',
    ];
    foreach ($platforms as $platform) {
        $key = strtolower($platform);
        if (isset($platformIndicators[$key])) {
            $modifiers[] = $platformIndicators[$key];
        }
    }
    return $modifiers;
}
