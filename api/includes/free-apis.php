<?php
/**
 * Free API Integrations for Business Intelligence
 * Uses completely free APIs to enrich lead data
 */

/**
 * Google PageSpeed Insights API (Free - 25,000 queries/day)
 * Provides: Performance scores, Core Web Vitals, mobile responsiveness
 */
function getPageSpeedInsights($url) {
    if (empty($url)) return null;
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    $apiKey = defined('GOOGLE_API_KEY') && !empty(GOOGLE_API_KEY) ? GOOGLE_API_KEY : null;
    
    $endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    $params = [
        'url' => $url,
        'category' => ['performance', 'accessibility', 'best-practices', 'seo'],
        'strategy' => 'mobile'
    ];
    
    if ($apiKey) {
        $params['key'] = $apiKey;
    }
    
    $queryString = http_build_query($params);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $endpoint . '?' . $queryString,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60, // PageSpeed can be slow
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json']
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return null;
    }
    
    $data = json_decode($response, true);
    if (!$data || !isset($data['lighthouseResult'])) {
        return null;
    }
    
    $lighthouse = $data['lighthouseResult'];
    $categories = $lighthouse['categories'] ?? [];
    $audits = $lighthouse['audits'] ?? [];
    
    return [
        'scores' => [
            'performance' => round(($categories['performance']['score'] ?? 0) * 100),
            'accessibility' => round(($categories['accessibility']['score'] ?? 0) * 100),
            'bestPractices' => round(($categories['best-practices']['score'] ?? 0) * 100),
            'seo' => round(($categories['seo']['score'] ?? 0) * 100)
        ],
        'coreWebVitals' => [
            'lcp' => $audits['largest-contentful-paint']['displayValue'] ?? null,
            'fid' => $audits['max-potential-fid']['displayValue'] ?? null,
            'cls' => $audits['cumulative-layout-shift']['displayValue'] ?? null,
            'fcp' => $audits['first-contentful-paint']['displayValue'] ?? null,
            'ttfb' => $audits['server-response-time']['displayValue'] ?? null
        ],
        'mobile' => [
            'responsive' => ($audits['viewport']['score'] ?? 0) === 1,
            'tapTargets' => ($audits['tap-targets']['score'] ?? 0) >= 0.9,
            'fontSizes' => ($audits['font-size']['score'] ?? 0) >= 0.9
        ],
        'issues' => extractPageSpeedIssues($audits)
    ];
}

/**
 * Extract actionable issues from PageSpeed audits
 */
function extractPageSpeedIssues($audits) {
    $issues = [];
    $importantAudits = [
        'render-blocking-resources' => 'Render-blocking resources detected',
        'unused-css-rules' => 'Unused CSS found',
        'unused-javascript' => 'Unused JavaScript found',
        'modern-image-formats' => 'Images not in modern format',
        'uses-optimized-images' => 'Images not optimized',
        'uses-text-compression' => 'Text compression not enabled',
        'uses-responsive-images' => 'Images not responsive',
        'dom-size' => 'Large DOM size',
        'redirects' => 'Multiple redirects detected',
        'uses-http2' => 'Not using HTTP/2'
    ];
    
    foreach ($importantAudits as $auditId => $description) {
        if (isset($audits[$auditId]) && ($audits[$auditId]['score'] ?? 1) < 0.9) {
            $issues[] = [
                'id' => $auditId,
                'title' => $audits[$auditId]['title'] ?? $description,
                'score' => $audits[$auditId]['score'] ?? 0
            ];
        }
    }
    
    return array_slice($issues, 0, 5); // Top 5 issues
}

/**
 * BuiltWith Free API (Free tier - 1 lookup/domain)
 * Provides: CMS, frameworks, analytics, hosting detection
 */
function getBuiltWithTech($domain) {
    if (empty($domain)) return null;
    
    // Clean domain
    $domain = preg_replace('/^https?:\/\//', '', $domain);
    $domain = preg_replace('/\/.*$/', '', $domain);
    $domain = preg_replace('/^www\./', '', $domain);
    
    // BuiltWith free API endpoint
    $endpoint = "https://api.builtwith.com/free1/api.json";
    $params = [
        'KEY' => '00000000-0000-0000-0000-000000000000', // Free tier key
        'LOOKUP' => $domain
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $endpoint . '?' . http_build_query($params),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return null;
    }
    
    $data = json_decode($response, true);
    if (!$data) {
        return null;
    }
    
    return parseTechStack($data);
}

/**
 * Parse BuiltWith response into structured tech stack
 */
function parseTechStack($data) {
    $techStack = [
        'cms' => [],
        'analytics' => [],
        'marketing' => [],
        'ecommerce' => [],
        'hosting' => [],
        'frameworks' => [],
        'cdns' => [],
        'other' => []
    ];
    
    $groups = $data['groups'] ?? [];
    
    foreach ($groups as $group) {
        $category = strtolower($group['name'] ?? '');
        $techs = $group['categories'] ?? [];
        
        foreach ($techs as $tech) {
            $techName = $tech['name'] ?? '';
            if (empty($techName)) continue;
            
            if (stripos($category, 'cms') !== false || stripos($category, 'content') !== false) {
                $techStack['cms'][] = $techName;
            } elseif (stripos($category, 'analytics') !== false) {
                $techStack['analytics'][] = $techName;
            } elseif (stripos($category, 'marketing') !== false || stripos($category, 'email') !== false) {
                $techStack['marketing'][] = $techName;
            } elseif (stripos($category, 'ecommerce') !== false || stripos($category, 'payment') !== false) {
                $techStack['ecommerce'][] = $techName;
            } elseif (stripos($category, 'hosting') !== false || stripos($category, 'server') !== false) {
                $techStack['hosting'][] = $techName;
            } elseif (stripos($category, 'javascript') !== false || stripos($category, 'framework') !== false) {
                $techStack['frameworks'][] = $techName;
            } elseif (stripos($category, 'cdn') !== false) {
                $techStack['cdns'][] = $techName;
            } else {
                $techStack['other'][] = $techName;
            }
        }
    }
    
    return $techStack;
}

/**
 * Analyze website HTML directly (Free - no API needed)
 * Detects: Social links, contact info, tech signals, meta tags
 */
function analyzeWebsiteDirectly($url) {
    if (empty($url)) return null;
    
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; BamLeadBot/1.0)',
        CURLOPT_HTTPHEADER => ['Accept: text/html']
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    
    if ($httpCode < 200 || $httpCode >= 400 || !$html) {
        return null;
    }
    
    return [
        'socialProfiles' => extractSocialProfiles($html),
        'contactInfo' => extractContactInfo($html),
        'techSignals' => detectTechSignals($html),
        'metaTags' => extractMetaTags($html),
        'conversionElements' => detectConversionElements($html),
        'complianceSignals' => detectComplianceSignals($html),
        'finalUrl' => $finalUrl
    ];
}

/**
 * Extract social media profile URLs from HTML
 */
function extractSocialProfiles($html) {
    $profiles = [];
    
    $patterns = [
        'linkedin' => '/href=["\']([^"\']*linkedin\.com\/(?:company|in)\/[^"\']*)["\']/',
        'facebook' => '/href=["\']([^"\']*facebook\.com\/[^"\']*)["\']/',
        'twitter' => '/href=["\']([^"\']*(?:twitter|x)\.com\/[^"\']*)["\']/',
        'instagram' => '/href=["\']([^"\']*instagram\.com\/[^"\']*)["\']/',
        'youtube' => '/href=["\']([^"\']*youtube\.com\/(?:channel|c|user|@)[^"\']*)["\']/',
        'tiktok' => '/href=["\']([^"\']*tiktok\.com\/@[^"\']*)["\']/'
    ];
    
    foreach ($patterns as $platform => $pattern) {
        if (preg_match($pattern, $html, $matches)) {
            $profiles[$platform] = $matches[1];
        }
    }
    
    return $profiles;
}

/**
 * Extract contact information from HTML
 */
function extractContactInfo($html) {
    $contact = [];
    
    // Email patterns
    if (preg_match_all('/[\w.+-]+@[\w-]+\.[\w.-]+/', $html, $emails)) {
        $validEmails = array_filter($emails[0], function($e) {
            return !preg_match('/(example|test|sample|wix|squarespace|wordpress)/', $e);
        });
        $contact['emails'] = array_unique(array_slice($validEmails, 0, 3));
    }
    
    // Phone patterns (US format)
    if (preg_match_all('/(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/', $html, $phones)) {
        $contact['phones'] = array_unique(array_slice($phones[0], 0, 2));
    }
    
    // Address detection (simplified)
    if (preg_match('/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[,.\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/', $html, $address)) {
        $contact['address'] = $address[0];
    }
    
    return $contact;
}

/**
 * Detect technology signals from HTML
 */
function detectTechSignals($html) {
    $signals = [
        'hasGoogleAnalytics' => (bool) preg_match('/gtag|google-analytics|googletagmanager|UA-\d+|G-[A-Z0-9]+/', $html),
        'hasGTM' => (bool) preg_match('/googletagmanager\.com\/gtm/', $html),
        'hasFacebookPixel' => (bool) preg_match('/connect\.facebook\.net|fbq\(/', $html),
        'hasHotjar' => (bool) preg_match('/hotjar\.com|hj\./', $html),
        'hasLiveChat' => (bool) preg_match('/intercom|drift|tawk|zendesk|livechat|crisp|hubspot/i', $html),
        'hasWordPress' => (bool) preg_match('/wp-content|wp-includes|wordpress/i', $html),
        'hasShopify' => (bool) preg_match('/cdn\.shopify\.com|shopify/i', $html),
        'hasWix' => (bool) preg_match('/wix\.com|wixstatic/i', $html),
        'hasSquarespace' => (bool) preg_match('/squarespace\.com|sqsp/i', $html),
        'hasReact' => (bool) preg_match('/__NEXT_DATA__|react|_next\//i', $html),
        'hasStripe' => (bool) preg_match('/stripe\.com|js\.stripe/', $html),
        'hasSSL' => true // Already checked via HTTPS
    ];
    
    // Determine CMS
    if ($signals['hasWordPress']) $signals['cms'] = 'WordPress';
    elseif ($signals['hasShopify']) $signals['cms'] = 'Shopify';
    elseif ($signals['hasWix']) $signals['cms'] = 'Wix';
    elseif ($signals['hasSquarespace']) $signals['cms'] = 'Squarespace';
    else $signals['cms'] = 'Unknown/Custom';
    
    return $signals;
}

/**
 * Extract meta tags for SEO analysis
 */
function extractMetaTags($html) {
    $meta = [
        'title' => '',
        'description' => '',
        'keywords' => '',
        'ogTitle' => '',
        'ogDescription' => '',
        'ogImage' => '',
        'canonical' => '',
        'robots' => ''
    ];
    
    // Title
    if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
        $meta['title'] = trim(html_entity_decode($m[1]));
    }
    
    // Meta description
    if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']|<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']/i', $html, $m)) {
        $meta['description'] = trim(html_entity_decode($m[1] ?: $m[2]));
    }
    
    // OG tags
    if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['ogTitle'] = trim(html_entity_decode($m[1]));
    }
    if (preg_match('/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['ogDescription'] = trim(html_entity_decode($m[1]));
    }
    
    // Canonical
    if (preg_match('/<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['canonical'] = $m[1];
    }
    
    // Check for SEO issues
    $meta['seoIssues'] = [];
    if (empty($meta['title'])) $meta['seoIssues'][] = 'Missing title tag';
    elseif (strlen($meta['title']) > 60) $meta['seoIssues'][] = 'Title too long';
    elseif (strlen($meta['title']) < 30) $meta['seoIssues'][] = 'Title too short';
    
    if (empty($meta['description'])) $meta['seoIssues'][] = 'Missing meta description';
    elseif (strlen($meta['description']) > 160) $meta['seoIssues'][] = 'Description too long';
    elseif (strlen($meta['description']) < 70) $meta['seoIssues'][] = 'Description too short';
    
    if (empty($meta['canonical'])) $meta['seoIssues'][] = 'Missing canonical tag';
    
    return $meta;
}

/**
 * Detect conversion elements on the page
 */
function detectConversionElements($html) {
    return [
        'hasForms' => (bool) preg_match('/<form[^>]*>/i', $html),
        'hasContactForm' => (bool) preg_match('/contact|inquiry|quote|book|schedule/i', $html) && preg_match('/<form/i', $html),
        'hasCTA' => (bool) preg_match('/<button|type=["\']submit["\']|class=["\'][^"\']*(?:cta|btn-primary|action)[^"\']*["\']/i', $html),
        'hasPhoneClick' => (bool) preg_match('/href=["\']tel:/i', $html),
        'hasEmailClick' => (bool) preg_match('/href=["\']mailto:/i', $html),
        'hasChat' => (bool) preg_match('/intercom|drift|tawk|zendesk|livechat|crisp|hubspot/i', $html),
        'hasBooking' => (bool) preg_match('/calendly|acuity|booksy|booking|schedule|appointment/i', $html),
        'hasNewsletter' => (bool) preg_match('/newsletter|subscribe|mailchimp|klaviyo/i', $html)
    ];
}

/**
 * Detect compliance and trust signals
 */
function detectComplianceSignals($html) {
    return [
        'hasPrivacyPolicy' => (bool) preg_match('/privacy\s*policy|privacy-policy/i', $html),
        'hasTerms' => (bool) preg_match('/terms\s*(of\s*service|&\s*conditions)|terms-of-service/i', $html),
        'hasCookieNotice' => (bool) preg_match('/cookie\s*(policy|consent|notice)|gdpr|ccpa/i', $html),
        'hasSSL' => true, // We're fetching via HTTPS
        'hasAccessibility' => (bool) preg_match('/accessibility|ada\s*complian/i', $html),
        'hasTrustBadges' => (bool) preg_match('/bbb|better\s*business|trustpilot|verified|secure|mcafee|norton/i', $html)
    ];
}

/**
 * Get WHOIS domain age (Free via RDAP)
 */
function getDomainAge($domain) {
    $domain = preg_replace('/^https?:\/\//', '', $domain);
    $domain = preg_replace('/\/.*$/', '', $domain);
    $domain = preg_replace('/^www\./', '', $domain);
    
    // Use RDAP (free, replaces WHOIS)
    $endpoint = "https://rdap.org/domain/{$domain}";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return null;
    }
    
    $data = json_decode($response, true);
    
    // Look for registration date in events
    $events = $data['events'] ?? [];
    foreach ($events as $event) {
        if (($event['eventAction'] ?? '') === 'registration') {
            $regDate = $event['eventDate'] ?? null;
            if ($regDate) {
                $regTime = strtotime($regDate);
                $ageYears = round((time() - $regTime) / (365.25 * 24 * 60 * 60), 1);
                return [
                    'registrationDate' => $regDate,
                    'ageYears' => $ageYears,
                    'isEstablished' => $ageYears >= 2
                ];
            }
        }
    }
    
    return null;
}

/**
 * Combine all free API data into comprehensive intelligence
 */
function getComprehensiveIntelligence($lead) {
    $url = $lead['url'] ?? $lead['website'] ?? null;
    
    $intelligence = [
        'pageSpeed' => null,
        'techStack' => null,
        'websiteAnalysis' => null,
        'domainAge' => null
    ];
    
    if (!$url) {
        return $intelligence;
    }
    
    // Run analyses in sequence (could be parallelized with async in production)
    $intelligence['websiteAnalysis'] = analyzeWebsiteDirectly($url);
    $intelligence['pageSpeed'] = getPageSpeedInsights($url);
    
    // Domain-level lookups
    $domain = preg_replace('/^https?:\/\//', '', $url);
    $domain = preg_replace('/\/.*$/', '', $domain);
    $domain = preg_replace('/^www\./', '', $domain);
    
    $intelligence['domainAge'] = getDomainAge($domain);
    
    // BuiltWith has rate limits, so only call if needed
    if (!$intelligence['websiteAnalysis']['techSignals']['cms'] || 
        $intelligence['websiteAnalysis']['techSignals']['cms'] === 'Unknown/Custom') {
        $intelligence['techStack'] = getBuiltWithTech($domain);
    }
    
    return $intelligence;
}
