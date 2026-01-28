<?php
/**
 * Advanced Business Intelligence API Endpoint
 * Generates comprehensive 11-category intelligence for each business lead
 * Uses FREE APIs: Google PageSpeed, BuiltWith Free, RDAP, Direct HTML Analysis
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/free-apis.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Auth optional
$user = getCurrentUser();

$input = getJsonInput();
if (!$input) {
    sendError('Invalid JSON input');
}

$leads = $input['leads'] ?? [];
$options = $input['options'] ?? [];
$usePageSpeed = $options['usePageSpeed'] ?? false; // Optional: slower but more accurate
$enrichContacts = $options['enrichContacts'] ?? true;

if (empty($leads)) {
    sendError('No leads provided');
}

// Limit processing
$maxLeads = 100;
$leads = array_slice($leads, 0, $maxLeads);

try {
    set_time_limit(300); // 5 min for analysis
    ini_set('memory_limit', '512M');
    
    $enrichedLeads = [];
    
    foreach ($leads as $lead) {
        $enrichedLead = enrichLeadWithIntelligence($lead, $usePageSpeed, $enrichContacts);
        $enrichedLeads[] = $enrichedLead;
    }
    
    sendJson([
        'success' => true,
        'data' => $enrichedLeads,
        'count' => count($enrichedLeads),
        'analyzedAt' => date('c'),
        'apiUsed' => [
            'pageSpeed' => $usePageSpeed,
            'builtWith' => true,
            'directAnalysis' => true,
            'rdap' => true
        ]
    ]);
} catch (Exception $e) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred during analysis', 500);
    }
}

/**
 * Enrich a lead with comprehensive business intelligence
 * Now uses FREE APIs for enhanced data
 */
function enrichLeadWithIntelligence($lead, $usePageSpeed = false, $enrichContacts = true) {
    $websiteUrl = $lead['url'] ?? $lead['website'] ?? '';
    $name = $lead['name'] ?? '';
    $phone = $lead['phone'] ?? '';
    $email = $lead['email'] ?? null;
    $address = $lead['address'] ?? '';
    $rating = $lead['rating'] ?? null;
    $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
    $snippet = $lead['snippet'] ?? '';
    
    // === FREE API DATA COLLECTION ===
    
    // 1. Direct HTML Analysis (Free - instant)
    $websiteData = [];
    $htmlContent = '';
    $freeApiData = null;
    
    if (!empty($websiteUrl)) {
        // Basic website analysis
        $websiteData = analyzeWebsiteComprehensive($websiteUrl);
        $htmlContent = $websiteData['html'] ?? '';
        
        // Enhanced free API analysis
        $freeApiData = analyzeWebsiteDirectly($websiteUrl);
        
        // Merge free API data into websiteData
        if ($freeApiData) {
            $websiteData['socialProfiles'] = $freeApiData['socialProfiles'] ?? [];
            $websiteData['extractedContacts'] = $freeApiData['contactInfo'] ?? [];
            $websiteData['detectedTech'] = $freeApiData['techSignals'] ?? [];
            $websiteData['metaTags'] = $freeApiData['metaTags'] ?? [];
            $websiteData['conversionElements'] = $freeApiData['conversionElements'] ?? [];
            $websiteData['complianceSignals'] = $freeApiData['complianceSignals'] ?? [];
        }
    }
    
    // 2. Google PageSpeed Insights (Free - 25k/day, slower)
    $pageSpeedData = null;
    if ($usePageSpeed && !empty($websiteUrl)) {
        $pageSpeedData = getPageSpeedInsights($websiteUrl);
        if ($pageSpeedData) {
            $websiteData['pageSpeedScores'] = $pageSpeedData['scores'] ?? [];
            $websiteData['coreWebVitals'] = $pageSpeedData['coreWebVitals'] ?? [];
            $websiteData['mobileData'] = $pageSpeedData['mobile'] ?? [];
            $websiteData['pageSpeedIssues'] = $pageSpeedData['issues'] ?? [];
        }
    }
    
    // 3. Domain Age via RDAP (Free)
    $domainAge = null;
    if (!empty($websiteUrl)) {
        $domainAge = getDomainAge($websiteUrl);
        if ($domainAge) {
            $websiteData['domainAge'] = $domainAge;
        }
    }
    
    // 4. Extract additional contact info from website
    $extractedEmail = $email;
    $extractedPhones = [];
    if ($enrichContacts && $freeApiData) {
        $contactInfo = $freeApiData['contactInfo'] ?? [];
        if (empty($extractedEmail) && !empty($contactInfo['emails'])) {
            $extractedEmail = $contactInfo['emails'][0];
        }
        if (!empty($contactInfo['phones'])) {
            $extractedPhones = $contactInfo['phones'];
        }
    }
    
    // Fallback email extraction from HTML
    if (empty($extractedEmail) && !empty($htmlContent)) {
        $extractedEmail = extractEmailFromHtml($htmlContent, $name);
    }
    
    // Build the 11 intelligence categories
    $intelligence = [
        'id' => $lead['id'] ?? generateId('bi_'),
        'name' => $name,
        'address' => $address,
        'phone' => $phone ?: ($extractedPhones[0] ?? ''),
        'email' => $extractedEmail,
        'website' => $websiteUrl,
        'source' => $lead['source'] ?? 'gmb',
        'sources' => $lead['sources'] ?? [],
        'rating' => $rating,
        'reviewCount' => intval($reviews),
        'snippet' => $snippet,
        
        // Social profiles from website
        'socialProfiles' => $freeApiData['socialProfiles'] ?? [],
        
        // Additional contact info
        'additionalContacts' => [
            'emails' => $freeApiData['contactInfo']['emails'] ?? [],
            'phones' => $freeApiData['contactInfo']['phones'] ?? [],
            'address' => $freeApiData['contactInfo']['address'] ?? null,
        ],
        
        // 1. Business Identity
        'businessIdentity' => buildBusinessIdentity($lead, $websiteData, $snippet),
        
        // 2. Website Health (enhanced with PageSpeed if available)
        'websiteHealth' => buildWebsiteHealthEnhanced($websiteUrl, $websiteData, $pageSpeedData, $domainAge),
        
        // 3. Online Visibility
        'onlineVisibility' => buildOnlineVisibility($lead, $websiteData),
        
        // 4. Reputation
        'reputation' => buildReputationData($lead),
        
        // 5. Opportunity Analysis
        'opportunityAnalysis' => buildOpportunityAnalysis($websiteData, $lead),
        
        // 6. Tech Stack (enhanced with detection)
        'techStack' => buildTechStackEnhanced($websiteData, $htmlContent, $freeApiData),
        
        // 7. Intent Signals
        'intentSignals' => buildIntentSignals($lead, $websiteData),
        
        // 8. Competitor Analysis
        'competitorAnalysis' => buildCompetitorAnalysis($lead, $address),
        
        // 9. Outreach Intelligence
        'outreachIntelligence' => buildOutreachIntelligence($lead, $websiteData),
        
        // 10. Compliance (enhanced)
        'compliance' => buildComplianceEnhanced($websiteData, $htmlContent, $freeApiData),
        
        // 11. AI Summary
        'aiSummary' => buildAISummary($lead, $websiteData),
        
        // Scorecards
        'scorecards' => buildScorecards($lead, $websiteData),
        
        'analyzedAt' => date('c'),
        'dataQualityScore' => calculateDataQuality($lead, $websiteData),
        
        // Data sources used
        'dataSources' => [
            'directAnalysis' => true,
            'pageSpeed' => $pageSpeedData !== null,
            'domainAge' => $domainAge !== null,
            'contactEnrichment' => !empty($freeApiData['contactInfo']),
        ],
    ];
    
    return $intelligence;
}

/**
 * Analyze website comprehensively
 */
function analyzeWebsiteComprehensive($url) {
    if (empty($url)) {
        return ['hasWebsite' => false];
    }
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    $result = curlRequest($url, [
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
    ], 15);
    
    if ($result['httpCode'] !== 200) {
        return [
            'hasWebsite' => false,
            'httpCode' => $result['httpCode'],
            'error' => $result['error']
        ];
    }
    
    $html = $result['response'];
    $htmlLower = strtolower($html);
    
    return [
        'hasWebsite' => true,
        'html' => $html,
        'htmlLower' => $htmlLower,
        'platform' => detectPlatform($html),
        'issues' => detectIssues($html),
        'hasMeta' => strpos($htmlLower, 'meta name="description"') !== false,
        'hasTitle' => strpos($htmlLower, '<title>') !== false,
        'hasH1' => strpos($htmlLower, '<h1') !== false,
        'hasViewport' => strpos($htmlLower, 'viewport') !== false,
        'hasSsl' => strpos($url, 'https://') === 0,
        'hasAnalytics' => strpos($htmlLower, 'google-analytics') !== false || strpos($htmlLower, 'gtag') !== false,
        'hasGTM' => strpos($htmlLower, 'googletagmanager') !== false,
        'hasFBPixel' => strpos($htmlLower, 'facebook.com/tr') !== false || strpos($htmlLower, 'fbq(') !== false,
        'hasForms' => strpos($htmlLower, '<form') !== false,
        'hasCTA' => preg_match('/(get\s*(started|quote)|call\s*now|contact\s*us|book\s*now)/i', $html),
        'hasChat' => strpos($htmlLower, 'livechat') !== false || strpos($htmlLower, 'intercom') !== false || strpos($htmlLower, 'drift') !== false || strpos($htmlLower, 'zendesk') !== false,
        'hasBooking' => strpos($htmlLower, 'calendly') !== false || strpos($htmlLower, 'acuity') !== false || strpos($htmlLower, 'booking') !== false,
        'hasPrivacyPolicy' => strpos($htmlLower, 'privacy') !== false,
        'hasCookieConsent' => strpos($htmlLower, 'cookie') !== false && (strpos($htmlLower, 'consent') !== false || strpos($htmlLower, 'accept') !== false),
        'hasSitemap' => false, // Would need separate request
        'hasRobotsTxt' => false, // Would need separate request
        'hasStructuredData' => strpos($htmlLower, 'application/ld+json') !== false,
        'hasCanonical' => strpos($htmlLower, 'rel="canonical"') !== false || strpos($htmlLower, "rel='canonical'") !== false,
        'hasAltTags' => preg_match('/<img[^>]+alt=["\'][^"\']+["\']/', $html),
        'pageSize' => strlen($html),
    ];
}

/**
 * Build Business Identity (Category 1)
 */
function buildBusinessIdentity($lead, $websiteData, $snippet) {
    $name = $lead['name'] ?? '';
    
    // Detect entity type from name
    $ownershipType = 'unknown';
    if (stripos($name, 'LLC') !== false) $ownershipType = 'llc';
    elseif (stripos($name, 'Inc') !== false || stripos($name, 'Corp') !== false) $ownershipType = 'corporation';
    elseif (stripos($name, 'LLP') !== false || stripos($name, 'Partners') !== false) $ownershipType = 'partnership';
    
    // Estimate company size from snippet/reviews
    $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
    $employeeRange = 'unknown';
    if ($reviews > 500) $employeeRange = '50-200';
    elseif ($reviews > 100) $employeeRange = '10-50';
    elseif ($reviews > 20) $employeeRange = '5-10';
    else $employeeRange = '1-5';
    
    // Detect industry from snippet
    $industry = detectIndustryFromSnippet($snippet);
    
    // Extract service areas from address
    $serviceAreas = [];
    $address = $lead['address'] ?? '';
    if ($address) {
        // Extract city/state
        preg_match('/([A-Za-z\s]+),\s*([A-Z]{2})/', $address, $matches);
        if ($matches) {
            $serviceAreas[] = trim($matches[1]);
            $serviceAreas[] = trim($matches[2]);
        }
    }
    
    return [
        'legalName' => $name,
        'dba' => null,
        'entityStatus' => 'active',
        'naicsCode' => $industry['naics'] ?? null,
        'naicsDescription' => $industry['description'] ?? null,
        'sicCode' => null,
        'sicDescription' => null,
        'employeeCount' => null,
        'employeeRange' => $employeeRange,
        'revenueEstimate' => null,
        'revenueRange' => null,
        'fundingHistory' => [],
        'isFranchise' => detectFranchise($name),
        'parentCompany' => null,
        'subsidiaries' => [],
        'operatingMarkets' => [],
        'serviceAreas' => $serviceAreas,
        'isPublic' => false,
        'ownershipType' => $ownershipType,
        'yearEstablished' => null,
    ];
}

/**
 * Build Website Health (Category 2)
 */
function buildWebsiteHealth($url, $websiteData) {
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    
    if (!$hasWebsite) {
        return [
            'hasWebsite' => false,
            'url' => null,
            'cms' => null,
            'hostingProvider' => null,
            'domainAge' => null,
            'domainAuthority' => null,
            'isMobileResponsive' => false,
            'mobileScore' => 0,
            'pageSpeedScore' => 0,
            'loadTime' => null,
            'seoQuality' => ['score' => 0, 'hasMetaDescription' => false, 'hasTitleTag' => false, 'hasH1Tag' => false, 'hasStructuredData' => false, 'hasCanonicalTag' => false, 'issues' => ['No website found']],
            'technicalHealth' => ['score' => 0, 'hasSsl' => false, 'hasSitemap' => false, 'hasRobotsTxt' => false, 'issues' => ['No website found']],
            'trackingInfrastructure' => ['hasGoogleAnalytics' => false, 'hasGoogleTagManager' => false, 'hasFacebookPixel' => false, 'hasOtherPixels' => [], 'issues' => ['No tracking infrastructure']],
            'accessibility' => ['score' => 0, 'hasAltTags' => false, 'hasAriaLabels' => false, 'issues' => []],
            'conversionReadiness' => ['hasForms' => false, 'hasCTAs' => false, 'hasChat' => false, 'hasBookingSystem' => false, 'conversionScore' => 0, 'issues' => ['No conversion elements']],
        ];
    }
    
    // Calculate scores
    $seoScore = 0;
    if ($websiteData['hasMeta'] ?? false) $seoScore += 20;
    if ($websiteData['hasTitle'] ?? false) $seoScore += 20;
    if ($websiteData['hasH1'] ?? false) $seoScore += 20;
    if ($websiteData['hasStructuredData'] ?? false) $seoScore += 20;
    if ($websiteData['hasCanonical'] ?? false) $seoScore += 20;
    
    $techScore = 0;
    if ($websiteData['hasSsl'] ?? false) $techScore += 40;
    if ($websiteData['hasViewport'] ?? false) $techScore += 30;
    if (($websiteData['pageSize'] ?? 0) < 500000) $techScore += 30;
    
    $mobileScore = ($websiteData['hasViewport'] ?? false) ? 65 : 25;
    
    $conversionScore = 0;
    if ($websiteData['hasForms'] ?? false) $conversionScore += 25;
    if ($websiteData['hasCTA'] ?? false) $conversionScore += 25;
    if ($websiteData['hasChat'] ?? false) $conversionScore += 25;
    if ($websiteData['hasBooking'] ?? false) $conversionScore += 25;
    
    // Build issues
    $seoIssues = $websiteData['issues'] ?? [];
    $techIssues = [];
    $trackingIssues = [];
    $conversionIssues = [];
    
    if (!($websiteData['hasAnalytics'] ?? false)) $trackingIssues[] = 'No Google Analytics';
    if (!($websiteData['hasFBPixel'] ?? false)) $trackingIssues[] = 'No Facebook Pixel';
    if (!($websiteData['hasForms'] ?? false)) $conversionIssues[] = 'No contact forms';
    if (!($websiteData['hasCTA'] ?? false)) $conversionIssues[] = 'No clear CTAs';
    if (!($websiteData['hasBooking'] ?? false)) $conversionIssues[] = 'No booking system';
    
    return [
        'hasWebsite' => true,
        'url' => $url,
        'cms' => $websiteData['platform'] ?? null,
        'hostingProvider' => null,
        'domainAge' => null,
        'domainAuthority' => null,
        'isMobileResponsive' => $websiteData['hasViewport'] ?? false,
        'mobileScore' => $mobileScore,
        'pageSpeedScore' => null,
        'loadTime' => null,
        'seoQuality' => [
            'score' => $seoScore,
            'hasMetaDescription' => $websiteData['hasMeta'] ?? false,
            'hasTitleTag' => $websiteData['hasTitle'] ?? false,
            'hasH1Tag' => $websiteData['hasH1'] ?? false,
            'hasStructuredData' => $websiteData['hasStructuredData'] ?? false,
            'hasCanonicalTag' => $websiteData['hasCanonical'] ?? false,
            'issues' => array_filter($seoIssues, function($i) {
                return stripos($i, 'meta') !== false || stripos($i, 'title') !== false || stripos($i, 'seo') !== false;
            }),
        ],
        'technicalHealth' => [
            'score' => $techScore,
            'hasSsl' => $websiteData['hasSsl'] ?? false,
            'hasSitemap' => false,
            'hasRobotsTxt' => false,
            'issues' => $techIssues,
        ],
        'trackingInfrastructure' => [
            'hasGoogleAnalytics' => $websiteData['hasAnalytics'] ?? false,
            'hasGoogleTagManager' => $websiteData['hasGTM'] ?? false,
            'hasFacebookPixel' => $websiteData['hasFBPixel'] ?? false,
            'hasOtherPixels' => [],
            'issues' => $trackingIssues,
        ],
        'accessibility' => [
            'score' => null,
            'hasAltTags' => $websiteData['hasAltTags'] ?? false,
            'hasAriaLabels' => false,
            'issues' => [],
        ],
        'conversionReadiness' => [
            'hasForms' => $websiteData['hasForms'] ?? false,
            'hasCTAs' => $websiteData['hasCTA'] ?? false,
            'hasChat' => $websiteData['hasChat'] ?? false,
            'hasBookingSystem' => $websiteData['hasBooking'] ?? false,
            'conversionScore' => $conversionScore,
            'issues' => $conversionIssues,
        ],
    ];
}

/**
 * Build Online Visibility (Category 3)
 */
function buildOnlineVisibility($lead, $websiteData) {
    $sources = $lead['sources'] ?? [];
    $hasGBP = in_array('Google Maps', $sources) || ($lead['source'] ?? '') === 'gmb';
    
    $visibilityScore = 0;
    if ($hasGBP) $visibilityScore += 40;
    if (in_array('Yelp', $sources)) $visibilityScore += 20;
    if (in_array('Bing Places', $sources)) $visibilityScore += 15;
    if (($websiteData['hasWebsite'] ?? false)) $visibilityScore += 25;
    
    return [
        'visibilityScore' => min(100, $visibilityScore),
        'searchRankings' => [],
        'businessListings' => [
            'hasGoogleBusinessProfile' => $hasGBP,
            'gbpOptimizationScore' => $hasGBP ? 70 : null,
            'directoryListings' => $sources,
            'completenessScore' => null,
            'issues' => $hasGBP ? [] : ['No Google Business Profile detected'],
        ],
        'citationConsistency' => null,
        'backlinkProfile' => [
            'totalBacklinks' => null,
            'domainAuthority' => null,
            'referringDomains' => null,
            'healthScore' => null,
        ],
    ];
}

/**
 * Build Reputation Data (Category 4)
 */
function buildReputationData($lead) {
    $rating = $lead['rating'] ?? null;
    $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
    
    // Estimate sentiment from rating
    $positive = 0; $neutral = 0; $negative = 0;
    if ($rating !== null) {
        if ($rating >= 4.5) { $positive = 80; $neutral = 15; $negative = 5; }
        elseif ($rating >= 4.0) { $positive = 65; $neutral = 25; $negative = 10; }
        elseif ($rating >= 3.5) { $positive = 50; $neutral = 30; $negative = 20; }
        elseif ($rating >= 3.0) { $positive = 35; $neutral = 30; $negative = 35; }
        else { $positive = 20; $neutral = 20; $negative = 60; }
    }
    
    return [
        'overallRating' => $rating,
        'totalReviews' => $reviews,
        'reviewsByPlatform' => $rating !== null ? [
            ['platform' => 'Google', 'rating' => $rating, 'reviewCount' => $reviews, 'url' => null]
        ] : [],
        'ratingDistribution' => null,
        'reviewVelocity' => null,
        'sentimentBreakdown' => [
            'positive' => $positive,
            'neutral' => $neutral,
            'negative' => $negative,
            'topPositiveThemes' => [],
            'topNegativeThemes' => [],
        ],
        'complaintPatterns' => [],
        'responsePractices' => [
            'responseRate' => null,
            'avgResponseTime' => null,
            'ownerResponsesCount' => null,
        ],
    ];
}

/**
 * Build Opportunity Analysis (Category 5)
 */
function buildOpportunityAnalysis($websiteData, $lead) {
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    $issues = $websiteData['issues'] ?? [];
    
    // Calculate opportunity score
    $opportunityScore = 0;
    $recommendedServices = [];
    $gapAnalysis = ['seoGaps' => [], 'contentGaps' => [], 'conversionGaps' => [], 'listingsGaps' => [], 'technologyGaps' => []];
    
    if (!$hasWebsite) {
        $opportunityScore += 50;
        $recommendedServices[] = [
            'service' => 'Website Development',
            'priority' => 'high',
            'estimatedValue' => 3000,
            'reasoning' => 'Business has no website - immediate opportunity for digital presence'
        ];
        $gapAnalysis['technologyGaps'][] = 'No website';
    } else {
        // SEO gaps
        if (!($websiteData['hasMeta'] ?? false)) {
            $gapAnalysis['seoGaps'][] = 'Missing meta descriptions';
            $opportunityScore += 10;
        }
        if (!($websiteData['hasStructuredData'] ?? false)) {
            $gapAnalysis['seoGaps'][] = 'No structured data';
            $opportunityScore += 5;
        }
        
        // Conversion gaps
        if (!($websiteData['hasForms'] ?? false)) {
            $gapAnalysis['conversionGaps'][] = 'No contact forms';
            $opportunityScore += 15;
        }
        if (!($websiteData['hasBooking'] ?? false)) {
            $gapAnalysis['conversionGaps'][] = 'No online booking';
            $opportunityScore += 10;
        }
        if (!($websiteData['hasCTA'] ?? false)) {
            $gapAnalysis['conversionGaps'][] = 'Weak call-to-actions';
            $opportunityScore += 10;
        }
        
        // Tech gaps
        if (!($websiteData['hasAnalytics'] ?? false)) {
            $gapAnalysis['technologyGaps'][] = 'No analytics tracking';
            $opportunityScore += 10;
            $recommendedServices[] = [
                'service' => 'Analytics Setup',
                'priority' => 'medium',
                'estimatedValue' => 500,
                'reasoning' => 'No tracking infrastructure to measure performance'
            ];
        }
        
        // Check for outdated platform
        $platform = $websiteData['platform'] ?? '';
        if (in_array($platform, ['Wix', 'Weebly', 'GoDaddy', 'wordpress.com', 'Blogger'])) {
            $opportunityScore += 15;
            $recommendedServices[] = [
                'service' => 'Website Redesign',
                'priority' => 'medium',
                'estimatedValue' => 2500,
                'reasoning' => "Using {$platform} which has limitations for growth"
            ];
        }
    }
    
    // Check issues for SEO/reputation services
    foreach ($issues as $issue) {
        if (stripos($issue, 'seo') !== false || stripos($issue, 'meta') !== false) {
            $recommendedServices[] = [
                'service' => 'SEO Optimization',
                'priority' => 'high',
                'estimatedValue' => 1500,
                'reasoning' => $issue
            ];
            break;
        }
    }
    
    // Determine priority level
    $priorityLevel = 'nurture';
    if ($opportunityScore >= 60) $priorityLevel = 'critical';
    elseif ($opportunityScore >= 45) $priorityLevel = 'high';
    elseif ($opportunityScore >= 30) $priorityLevel = 'medium';
    elseif ($opportunityScore >= 15) $priorityLevel = 'low';
    
    $urgencyScore = min(100, $opportunityScore + 20);
    
    return [
        'opportunityScore' => min(100, $opportunityScore),
        'gapAnalysis' => $gapAnalysis,
        'recommendedServices' => array_slice($recommendedServices, 0, 5),
        'estimatedROIUplift' => null,
        'urgencyScore' => $urgencyScore,
        'priorityLevel' => $priorityLevel,
    ];
}

/**
 * Build Tech Stack (Category 6)
 */
function buildTechStack($websiteData, $htmlContent) {
    $htmlLower = strtolower($htmlContent);
    
    $analytics = [];
    $marketing = [];
    $crm = [];
    $adPlatforms = [];
    $chatTools = [];
    $detected = [];
    
    // Analytics
    if (strpos($htmlLower, 'google-analytics') !== false || strpos($htmlLower, 'gtag') !== false) {
        $analytics[] = 'Google Analytics';
    }
    if ($websiteData['hasGTM'] ?? false) {
        $analytics[] = 'Google Tag Manager';
    }
    if (strpos($htmlLower, 'hotjar') !== false) {
        $analytics[] = 'Hotjar';
    }
    if (strpos($htmlLower, 'clarity') !== false) {
        $analytics[] = 'Microsoft Clarity';
    }
    
    // Marketing
    if (strpos($htmlLower, 'mailchimp') !== false) {
        $marketing[] = 'Mailchimp';
    }
    if (strpos($htmlLower, 'hubspot') !== false) {
        $marketing[] = 'HubSpot';
        $crm[] = 'HubSpot CRM';
    }
    if (strpos($htmlLower, 'klaviyo') !== false) {
        $marketing[] = 'Klaviyo';
    }
    
    // Ad platforms
    if ($websiteData['hasFBPixel'] ?? false) {
        $adPlatforms[] = 'Facebook Ads';
    }
    if (strpos($htmlLower, 'adsbygoogle') !== false || strpos($htmlLower, 'googlesyndication') !== false) {
        $adPlatforms[] = 'Google Ads';
    }
    if (strpos($htmlLower, 'tiktok') !== false) {
        $adPlatforms[] = 'TikTok Ads';
    }
    
    // Chat tools
    if (strpos($htmlLower, 'intercom') !== false) {
        $chatTools[] = 'Intercom';
    }
    if (strpos($htmlLower, 'drift') !== false) {
        $chatTools[] = 'Drift';
    }
    if (strpos($htmlLower, 'zendesk') !== false) {
        $chatTools[] = 'Zendesk';
    }
    if (strpos($htmlLower, 'livechat') !== false) {
        $chatTools[] = 'LiveChat';
    }
    if (strpos($htmlLower, 'tidio') !== false) {
        $chatTools[] = 'Tidio';
    }
    
    // Platform
    $platform = $websiteData['platform'] ?? null;
    if ($platform) {
        $detected[] = $platform;
    }
    
    // jQuery detection
    if (strpos($htmlLower, 'jquery') !== false) {
        $detected[] = 'jQuery';
    }
    
    // React/Vue/Angular
    if (strpos($htmlLower, 'react') !== false || strpos($htmlLower, '__next') !== false) {
        $detected[] = 'React';
    }
    if (strpos($htmlLower, 'vue') !== false) {
        $detected[] = 'Vue.js';
    }
    
    return [
        'analytics' => $analytics,
        'marketingAutomation' => $marketing,
        'crmTools' => $crm,
        'adPlatforms' => $adPlatforms,
        'ecommerceplatform' => in_array($platform, ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce']) ? $platform : null,
        'chatTools' => $chatTools,
        'cloudProviders' => [],
        'apiIntegrations' => [],
        'detectedTechnologies' => $detected,
    ];
}

/**
 * Build Intent Signals (Category 7)
 */
function buildIntentSignals($lead, $websiteData) {
    $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    
    // Calculate intent score based on available signals
    $intentScore = 30; // Base
    
    // Businesses without website have higher intent for web services
    if (!$hasWebsite) {
        $intentScore += 30;
    }
    
    // Active businesses (high reviews) may be growing
    if ($reviews > 100) {
        $intentScore += 15;
    }
    
    // Missing tracking = opportunity
    if ($hasWebsite && !($websiteData['hasAnalytics'] ?? false)) {
        $intentScore += 10;
    }
    
    $signals = [];
    if (!$hasWebsite) {
        $signals[] = 'No digital presence - likely seeking solutions';
    }
    if ($reviews > 50) {
        $signals[] = 'Active customer base indicates growth';
    }
    
    return [
        'intentScore' => min(100, $intentScore),
        'hiringActivity' => [
            'isHiring' => false,
            'roles' => [],
            'urgency' => null,
        ],
        'fundingSignals' => [],
        'websiteActivitySignals' => $signals,
        'marketingActivitySignals' => [],
        'reviewSurges' => false,
        'competitorShifts' => [],
        'seasonalSignals' => [],
        'predictedPurchaseLikelihood' => min(100, $intentScore + 10),
    ];
}

/**
 * Build Competitor Analysis (Category 8)
 */
function buildCompetitorAnalysis($lead, $address) {
    // Would require additional API calls to find competitors
    // For now, return empty structure
    return [
        'directCompetitors' => [],
        'competitiveGaps' => [],
        'marketShareIndicator' => null,
        'performanceBenchmarks' => [],
        'differentiationOpportunities' => [],
    ];
}

/**
 * Build Outreach Intelligence (Category 9)
 */
function buildOutreachIntelligence($lead, $websiteData) {
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    $phone = $lead['phone'] ?? null;
    $email = $lead['email'] ?? null;
    
    // Determine best channel
    $channel = 'email';
    if ($phone && !$email) {
        $channel = 'phone';
    } elseif ($phone && $email) {
        $channel = 'multi-channel';
    }
    
    // Build messaging hooks based on gaps
    $hooks = [];
    if (!$hasWebsite) {
        $hooks[] = 'I noticed your business isn\'t showing up online as much as it could be...';
        $hooks[] = 'Businesses like yours are losing customers to competitors with websites';
    } elseif (!($websiteData['hasAnalytics'] ?? false)) {
        $hooks[] = 'Are you tracking how visitors use your website?';
    }
    if (!($websiteData['hasBooking'] ?? false)) {
        $hooks[] = 'Imagine if customers could book appointments 24/7...';
    }
    
    // Subject line ideas
    $subjects = [];
    $name = $lead['name'] ?? 'your business';
    $subjects[] = "Quick question about {$name}";
    $subjects[] = "Noticed something about your online presence";
    if (!$hasWebsite) {
        $subjects[] = "{$name} + a professional website = more customers";
    }
    
    // Predicted objections
    $objections = [
        [
            'objection' => 'We already have a marketing person',
            'likelihood' => 30,
            'rebuttal' => 'That\'s great! We often partner with in-house teams to handle specialized work.'
        ],
        [
            'objection' => 'We don\'t have the budget right now',
            'likelihood' => 50,
            'rebuttal' => 'I understand. We offer flexible payment plans and can start with a smaller project.'
        ],
        [
            'objection' => 'We tried this before and it didn\'t work',
            'likelihood' => 25,
            'rebuttal' => 'What happened? I\'d love to understand so we can avoid those issues.'
        ],
    ];
    
    $contactPriority = 50;
    if ($phone) $contactPriority += 20;
    if ($email) $contactPriority += 20;
    if (!$hasWebsite) $contactPriority += 10;
    
    return [
        'decisionMakers' => [],
        'contactPriorityScore' => min(100, $contactPriority),
        'suggestedApproach' => [
            'recommendedChannel' => $channel,
            'bestTimeToContact' => 'Tuesday-Thursday, 10am-2pm',
            'messagingHooks' => $hooks,
            'toneRecommendation' => 'friendly-professional',
            'subjectLineIdeas' => $subjects,
        ],
        'objectionPredictions' => $objections,
        'engagementLikelihood' => min(100, $contactPriority + 5),
        'personalizedTriggers' => $hooks,
    ];
}

/**
 * Build Compliance Data (Category 10)
 */
function buildComplianceData($websiteData, $htmlContent) {
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    
    if (!$hasWebsite) {
        return [
            'privacyCompliance' => ['hasCookieConsent' => false, 'hasPrivacyPolicy' => false, 'gdprCompliant' => null, 'ccpaCompliant' => null, 'issues' => []],
            'accessibilityCompliance' => ['wcagLevel' => null, 'adaCompliant' => null, 'issues' => []],
            'securityIndicators' => ['sslValid' => false, 'securityHeaders' => false, 'trustScore' => null, 'issues' => []],
            'industryRegulations' => [],
            'riskFlags' => [],
        ];
    }
    
    $privacyIssues = [];
    $securityIssues = [];
    
    if (!($websiteData['hasPrivacyPolicy'] ?? false)) {
        $privacyIssues[] = 'No privacy policy found';
    }
    if (!($websiteData['hasCookieConsent'] ?? false)) {
        $privacyIssues[] = 'No cookie consent mechanism';
    }
    if (!($websiteData['hasSsl'] ?? false)) {
        $securityIssues[] = 'Not using HTTPS';
    }
    
    return [
        'privacyCompliance' => [
            'hasCookieConsent' => $websiteData['hasCookieConsent'] ?? false,
            'hasPrivacyPolicy' => $websiteData['hasPrivacyPolicy'] ?? false,
            'gdprCompliant' => null,
            'ccpaCompliant' => null,
            'issues' => $privacyIssues,
        ],
        'accessibilityCompliance' => [
            'wcagLevel' => null,
            'adaCompliant' => null,
            'issues' => [],
        ],
        'securityIndicators' => [
            'sslValid' => $websiteData['hasSsl'] ?? false,
            'securityHeaders' => false,
            'trustScore' => null,
            'issues' => $securityIssues,
        ],
        'industryRegulations' => [],
        'riskFlags' => [],
    ];
}

/**
 * Build AI Summary (Category 11)
 */
function buildAISummary($lead, $websiteData) {
    $name = $lead['name'] ?? 'This business';
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    $rating = $lead['rating'] ?? null;
    $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
    
    // Generate insight summary
    $summary = '';
    $strengths = [];
    $weaknesses = [];
    $opportunities = [];
    $threats = [];
    
    if (!$hasWebsite) {
        $summary = "{$name} has no website, representing a significant digital gap. ";
        $weaknesses[] = 'No online presence';
        $opportunities[] = 'Website development';
        $opportunities[] = 'Digital marketing foundation';
    } else {
        $platform = $websiteData['platform'] ?? 'Custom';
        $summary = "{$name} has a website built on {$platform}. ";
        $strengths[] = 'Has web presence';
        
        if (!($websiteData['hasAnalytics'] ?? false)) {
            $weaknesses[] = 'No analytics tracking';
            $opportunities[] = 'Analytics & data setup';
        }
        if (!($websiteData['hasBooking'] ?? false)) {
            $opportunities[] = 'Online booking system';
        }
    }
    
    if ($rating && $rating >= 4.0) {
        $summary .= "Strong reputation with {$rating} stars from {$reviews} reviews. ";
        $strengths[] = 'Good customer reputation';
    } elseif ($rating && $rating < 3.5) {
        $summary .= "Reputation could use improvement at {$rating} stars. ";
        $weaknesses[] = 'Below-average reviews';
        $threats[] = 'Reputation damage';
    }
    
    if ($reviews > 100) {
        $strengths[] = 'Active customer base';
    }
    
    // Classification
    $classification = 'cold';
    $priorityScore = 30;
    
    if (!$hasWebsite) {
        $classification = 'hot';
        $priorityScore = 85;
    } elseif (!($websiteData['hasAnalytics'] ?? false) || !($websiteData['hasBooking'] ?? false)) {
        $classification = 'warm';
        $priorityScore = 60;
    }
    
    // Pitch angle
    $pitchAngle = '';
    if (!$hasWebsite) {
        $pitchAngle = "Focus on the cost of missed opportunities - customers can't find them online.";
    } else {
        $issues = $websiteData['issues'] ?? [];
        if (!empty($issues)) {
            $pitchAngle = "Address the specific issues: " . implode(', ', array_slice($issues, 0, 2));
        } else {
            $pitchAngle = "Position as growth partner to take them to the next level.";
        }
    }
    
    // Talking points
    $talkingPoints = [];
    if (!$hasWebsite) {
        $talkingPoints[] = 'Customers are searching for services like yours online right now';
        $talkingPoints[] = 'Your competitors with websites are capturing leads you should be getting';
    }
    if ($rating && $rating >= 4.0) {
        $talkingPoints[] = 'Your great reviews should be featured prominently online';
    }
    
    return [
        'insightSummary' => trim($summary),
        'strengths' => $strengths,
        'weaknesses' => $weaknesses,
        'opportunities' => $opportunities,
        'threats' => $threats,
        'outreachTalkingPoints' => $talkingPoints,
        'suggestedPitchAngle' => $pitchAngle,
        'competitiveComparison' => null,
        'priorityScore' => $priorityScore,
        'classificationLabel' => $classification,
    ];
}

/**
 * Build Scorecards
 */
function buildScorecards($lead, $websiteData) {
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    $rating = $lead['rating'] ?? 0;
    $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
    
    // Opportunity score
    $opportunityScore = !$hasWebsite ? 85 : 50;
    if ($hasWebsite && !($websiteData['hasAnalytics'] ?? false)) $opportunityScore += 15;
    if ($hasWebsite && !($websiteData['hasBooking'] ?? false)) $opportunityScore += 10;
    
    // Visibility score
    $visibilityScore = 40; // Base for being found
    if ($hasWebsite) $visibilityScore += 30;
    if ($reviews > 50) $visibilityScore += 15;
    if ($reviews > 100) $visibilityScore += 15;
    
    // Reputation score
    $reputationScore = 50;
    if ($rating >= 4.5) $reputationScore = 90;
    elseif ($rating >= 4.0) $reputationScore = 75;
    elseif ($rating >= 3.5) $reputationScore = 60;
    elseif ($rating >= 3.0) $reputationScore = 45;
    elseif ($rating > 0) $reputationScore = 30;
    
    // Intent score
    $intentScore = !$hasWebsite ? 75 : 45;
    if ($reviews > 100) $intentScore += 10;
    
    // Competitive index
    $competitiveIndex = 50; // Default
    
    // Overall score (weighted average)
    $overallScore = round(
        ($opportunityScore * 0.30) +
        ($visibilityScore * 0.15) +
        ($reputationScore * 0.20) +
        ($intentScore * 0.25) +
        ($competitiveIndex * 0.10)
    );
    
    return [
        'opportunityScore' => min(100, $opportunityScore),
        'visibilityScore' => min(100, $visibilityScore),
        'reputationScore' => min(100, $reputationScore),
        'intentScore' => min(100, $intentScore),
        'competitiveIndex' => $competitiveIndex,
        'overallScore' => min(100, $overallScore),
    ];
}

/**
 * Calculate data quality score
 */
function calculateDataQuality($lead, $websiteData) {
    $score = 0;
    
    if (!empty($lead['name'])) $score += 15;
    if (!empty($lead['phone'])) $score += 20;
    if (!empty($lead['email'])) $score += 20;
    if (!empty($lead['address'])) $score += 10;
    if (!empty($lead['rating'])) $score += 10;
    if (($websiteData['hasWebsite'] ?? false)) $score += 25;
    
    return min(100, $score);
}

/**
 * Detect industry from snippet
 */
function detectIndustryFromSnippet($snippet) {
    $snippetLower = strtolower($snippet);
    
    $industries = [
        ['keywords' => ['restaurant', 'food', 'dining', 'cafe', 'coffee'], 'naics' => '722511', 'description' => 'Full-Service Restaurants'],
        ['keywords' => ['plumber', 'plumbing'], 'naics' => '238220', 'description' => 'Plumbing, Heating, and Air-Conditioning Contractors'],
        ['keywords' => ['electric', 'electrical'], 'naics' => '238210', 'description' => 'Electrical Contractors'],
        ['keywords' => ['lawyer', 'attorney', 'legal', 'law firm'], 'naics' => '541110', 'description' => 'Offices of Lawyers'],
        ['keywords' => ['doctor', 'physician', 'medical', 'clinic'], 'naics' => '621111', 'description' => 'Offices of Physicians'],
        ['keywords' => ['dentist', 'dental'], 'naics' => '621210', 'description' => 'Offices of Dentists'],
        ['keywords' => ['mechanic', 'auto repair', 'car repair'], 'naics' => '811111', 'description' => 'General Automotive Repair'],
        ['keywords' => ['salon', 'hair', 'beauty'], 'naics' => '812111', 'description' => 'Barber Shops'],
        ['keywords' => ['real estate', 'realtor'], 'naics' => '531210', 'description' => 'Offices of Real Estate Agents'],
        ['keywords' => ['insurance'], 'naics' => '524210', 'description' => 'Insurance Agencies and Brokerages'],
    ];
    
    foreach ($industries as $ind) {
        foreach ($ind['keywords'] as $keyword) {
            if (strpos($snippetLower, $keyword) !== false) {
                return $ind;
            }
        }
    }
    
    return ['naics' => null, 'description' => null];
}

/**
 * Detect if business is a franchise
 */
function detectFranchise($name) {
    $franchises = [
        'mcdonald', 'subway', 'starbucks', 'dunkin', 'burger king', 'wendy',
        'taco bell', 'kfc', 'pizza hut', 'domino', 'papa john',
        'anytime fitness', 'planet fitness', 'orangetheory',
        're/max', 'century 21', 'coldwell banker', 'keller williams',
        'h&r block', 'jackson hewitt',
        'servpro', 'mr. handyman', 'molly maid',
        'ace hardware', 'true value',
    ];
    
    $nameLower = strtolower($name);
    foreach ($franchises as $franchise) {
        if (strpos($nameLower, $franchise) !== false) {
            return true;
        }
    }
    
    return false;
}

/**
 * Extract email from HTML content
 */
function extractEmailFromHtml($html, $businessName) {
    if (empty($html)) return null;
    
    // Look for mailto links first
    if (preg_match('/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/', $html, $matches)) {
        return strtolower($matches[1]);
    }
    
    // Look for email patterns
    if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $html, $matches)) {
        $email = strtolower($matches[0]);
        
        // Filter out common non-business emails
        $exclude = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.', 'noreply', 'no-reply', 'wix.com', 'squarespace.com', 'wordpress.com'];
        foreach ($exclude as $pattern) {
            if (strpos($email, $pattern) !== false) {
                return null;
            }
        }
        
        return $email;
    }
    
    return null;
}

/**
 * Build Website Health Enhanced (with PageSpeed & Domain Age)
 */
function buildWebsiteHealthEnhanced($url, $websiteData, $pageSpeedData, $domainAge) {
    $hasWebsite = $websiteData['hasWebsite'] ?? false;
    
    if (!$hasWebsite) {
        return [
            'hasWebsite' => false,
            'url' => null,
            'cms' => null,
            'hostingProvider' => null,
            'domainAge' => null,
            'domainAuthority' => null,
            'isMobileResponsive' => false,
            'mobileScore' => 0,
            'pageSpeedScore' => 0,
            'loadTime' => null,
            'seoQuality' => ['score' => 0, 'issues' => ['No website found']],
            'technicalHealth' => ['score' => 0, 'issues' => ['No website found']],
            'trackingInfrastructure' => ['hasGoogleAnalytics' => false],
            'accessibility' => ['score' => 0],
            'conversionReadiness' => ['conversionScore' => 0],
        ];
    }
    
    // Use PageSpeed data if available
    $performanceScore = $pageSpeedData['scores']['performance'] ?? null;
    $seoScore = $pageSpeedData['scores']['seo'] ?? null;
    $accessibilityScore = $pageSpeedData['scores']['accessibility'] ?? null;
    $bestPracticesScore = $pageSpeedData['scores']['bestPractices'] ?? null;
    
    // Calculate scores from basic analysis if PageSpeed not available
    if ($seoScore === null) {
        $seoScore = 0;
        if ($websiteData['hasMeta'] ?? false) $seoScore += 20;
        if ($websiteData['hasTitle'] ?? false) $seoScore += 20;
        if ($websiteData['hasH1'] ?? false) $seoScore += 20;
        if ($websiteData['hasStructuredData'] ?? false) $seoScore += 20;
        if ($websiteData['hasCanonical'] ?? false) $seoScore += 20;
    }
    
    $techScore = 0;
    if ($websiteData['hasSsl'] ?? false) $techScore += 40;
    if ($websiteData['hasViewport'] ?? false) $techScore += 30;
    if (($websiteData['pageSize'] ?? 0) < 500000) $techScore += 30;
    
    $mobileScore = $websiteData['hasViewport'] ?? false ? 65 : 25;
    if ($pageSpeedData && ($pageSpeedData['mobile']['responsive'] ?? false)) {
        $mobileScore = 85;
    }
    
    $conversionScore = 0;
    $conversionElements = $websiteData['conversionElements'] ?? [];
    if ($websiteData['hasForms'] ?? $conversionElements['hasForms'] ?? false) $conversionScore += 25;
    if ($websiteData['hasCTA'] ?? $conversionElements['hasCTA'] ?? false) $conversionScore += 25;
    if ($websiteData['hasChat'] ?? $conversionElements['hasChat'] ?? false) $conversionScore += 25;
    if ($websiteData['hasBooking'] ?? $conversionElements['hasBooking'] ?? false) $conversionScore += 25;
    
    // Domain age info
    $domainAgeYears = $domainAge['ageYears'] ?? null;
    $isEstablished = $domainAge['isEstablished'] ?? false;
    
    return [
        'hasWebsite' => true,
        'url' => $url,
        'cms' => $websiteData['platform'] ?? $websiteData['detectedTech']['cms'] ?? null,
        'hostingProvider' => null,
        'domainAge' => $domainAgeYears ? "{$domainAgeYears} years" : null,
        'domainAgeYears' => $domainAgeYears,
        'isEstablishedDomain' => $isEstablished,
        'registrationDate' => $domainAge['registrationDate'] ?? null,
        'domainAuthority' => null,
        'isMobileResponsive' => $websiteData['hasViewport'] ?? false,
        'mobileScore' => $mobileScore,
        'pageSpeedScore' => $performanceScore,
        'coreWebVitals' => $pageSpeedData['coreWebVitals'] ?? null,
        'seoQuality' => [
            'score' => $seoScore,
            'hasMetaDescription' => $websiteData['hasMeta'] ?? false,
            'hasTitleTag' => $websiteData['hasTitle'] ?? false,
            'hasH1Tag' => $websiteData['hasH1'] ?? false,
            'hasStructuredData' => $websiteData['hasStructuredData'] ?? false,
            'hasCanonicalTag' => $websiteData['hasCanonical'] ?? false,
            'issues' => $websiteData['metaTags']['seoIssues'] ?? [],
        ],
        'technicalHealth' => [
            'score' => $techScore,
            'hasSsl' => $websiteData['hasSsl'] ?? false,
            'hasSitemap' => false,
            'hasRobotsTxt' => false,
            'pageSpeedIssues' => $pageSpeedData['issues'] ?? [],
        ],
        'trackingInfrastructure' => [
            'hasGoogleAnalytics' => $websiteData['hasAnalytics'] ?? $websiteData['detectedTech']['hasGoogleAnalytics'] ?? false,
            'hasGoogleTagManager' => $websiteData['hasGTM'] ?? $websiteData['detectedTech']['hasGTM'] ?? false,
            'hasFacebookPixel' => $websiteData['hasFBPixel'] ?? $websiteData['detectedTech']['hasFacebookPixel'] ?? false,
            'hasHotjar' => $websiteData['detectedTech']['hasHotjar'] ?? false,
        ],
        'accessibility' => [
            'score' => $accessibilityScore,
            'hasAltTags' => $websiteData['hasAltTags'] ?? false,
        ],
        'conversionReadiness' => [
            'hasForms' => $websiteData['hasForms'] ?? $conversionElements['hasForms'] ?? false,
            'hasContactForm' => $conversionElements['hasContactForm'] ?? false,
            'hasCTAs' => $websiteData['hasCTA'] ?? $conversionElements['hasCTA'] ?? false,
            'hasChat' => $websiteData['hasChat'] ?? $conversionElements['hasChat'] ?? false,
            'hasBookingSystem' => $websiteData['hasBooking'] ?? $conversionElements['hasBooking'] ?? false,
            'hasPhoneClick' => $conversionElements['hasPhoneClick'] ?? false,
            'hasEmailClick' => $conversionElements['hasEmailClick'] ?? false,
            'hasNewsletter' => $conversionElements['hasNewsletter'] ?? false,
            'conversionScore' => $conversionScore,
        ],
    ];
}

/**
 * Build Tech Stack Enhanced with detection
 */
function buildTechStackEnhanced($websiteData, $htmlContent, $freeApiData) {
    $detectedTech = $websiteData['detectedTech'] ?? $freeApiData['techSignals'] ?? [];
    
    $cms = $websiteData['platform'] ?? $detectedTech['cms'] ?? 'Unknown';
    
    return [
        'cms' => $cms,
        'analytics' => [
            'hasGoogleAnalytics' => $websiteData['hasAnalytics'] ?? $detectedTech['hasGoogleAnalytics'] ?? false,
            'hasGTM' => $websiteData['hasGTM'] ?? $detectedTech['hasGTM'] ?? false,
            'hasFacebookPixel' => $websiteData['hasFBPixel'] ?? $detectedTech['hasFacebookPixel'] ?? false,
            'hasHotjar' => $detectedTech['hasHotjar'] ?? false,
        ],
        'marketing' => [
            'hasLiveChat' => $websiteData['hasChat'] ?? $detectedTech['hasLiveChat'] ?? false,
            'hasBookingSystem' => $websiteData['hasBooking'] ?? false,
        ],
        'ecommerce' => [
            'hasShopify' => $detectedTech['hasShopify'] ?? false,
            'hasStripe' => $detectedTech['hasStripe'] ?? false,
            'hasWooCommerce' => ($cms === 'WordPress' && (strpos($htmlContent ?? '', 'woocommerce') !== false)),
        ],
        'frameworks' => [
            'hasReact' => $detectedTech['hasReact'] ?? false,
            'hasWordPress' => $detectedTech['hasWordPress'] ?? ($cms === 'WordPress'),
            'hasWix' => $detectedTech['hasWix'] ?? ($cms === 'Wix'),
            'hasSquarespace' => $detectedTech['hasSquarespace'] ?? ($cms === 'Squarespace'),
        ],
        'security' => [
            'hasSSL' => $websiteData['hasSsl'] ?? true,
        ],
    ];
}

/**
 * Build Compliance Enhanced
 */
function buildComplianceEnhanced($websiteData, $htmlContent, $freeApiData) {
    $complianceSignals = $websiteData['complianceSignals'] ?? $freeApiData['complianceSignals'] ?? [];
    
    $hasPrivacy = $websiteData['hasPrivacyPolicy'] ?? $complianceSignals['hasPrivacyPolicy'] ?? false;
    $hasCookies = $websiteData['hasCookieConsent'] ?? $complianceSignals['hasCookieNotice'] ?? false;
    $hasTerms = $complianceSignals['hasTerms'] ?? false;
    $hasAccessibility = $complianceSignals['hasAccessibility'] ?? false;
    $hasTrustBadges = $complianceSignals['hasTrustBadges'] ?? false;
    
    // Calculate trust score
    $trustScore = 0;
    if ($websiteData['hasSsl'] ?? false) $trustScore += 30;
    if ($hasPrivacy) $trustScore += 20;
    if ($hasCookies) $trustScore += 15;
    if ($hasTerms) $trustScore += 15;
    if ($hasTrustBadges) $trustScore += 20;
    
    $issues = [];
    if (!$hasPrivacy) $issues[] = 'Missing privacy policy';
    if (!$hasCookies) $issues[] = 'No cookie consent notice';
    if (!$hasTerms) $issues[] = 'No terms of service';
    
    return [
        'privacyCompliance' => [
            'hasPrivacyPolicy' => $hasPrivacy,
            'hasCookieConsent' => $hasCookies,
            'hasTermsOfService' => $hasTerms,
            'complianceScore' => $trustScore,
        ],
        'adaAccessibility' => [
            'hasAccessibilityStatement' => $hasAccessibility,
            'riskLevel' => $hasAccessibility ? 'low' : 'medium',
        ],
        'securityIndicators' => [
            'hasSsl' => $websiteData['hasSsl'] ?? true,
            'hasTrustBadges' => $hasTrustBadges,
        ],
        'trustScore' => min(100, $trustScore),
        'issues' => $issues,
    ];
}
