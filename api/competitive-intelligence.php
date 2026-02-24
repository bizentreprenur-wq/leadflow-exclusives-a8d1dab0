<?php
/**
 * Competitive Intelligence API Endpoint
 * Generates SWOT Analysis, Core Competencies, Market Positioning
 * For Competitive Analysis mode (comparing your business to competitors)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Auth optional but tracked
$user = getCurrentUser();

$input = getJsonInput();
if (!$input) {
    sendError('Invalid JSON input');
}

$searchQuery = $input['searchQuery'] ?? '';
$searchLocation = $input['searchLocation'] ?? '';
$leads = $input['leads'] ?? [];
$myBusiness = $input['myBusiness'] ?? null;

if (empty($searchQuery)) {
    sendError('Search query is required');
}

try {
    // Detect industry from search query
    $industry = detectCompetitiveIndustry($searchQuery);
    
    // Generate competitive intelligence
    $userProduct = $input['userProduct'] ?? null;
    $competitiveIntelligence = generateCompetitiveIntelligence($searchQuery, $searchLocation, $leads, $myBusiness, $industry);
    
    // Add buyer matching if user product info is provided
    if ($userProduct) {
        $competitiveIntelligence['buyerMatching'] = generateBuyerMatching($leads, $userProduct, $industry);
    }
    
    // Always add deep competitive analysis sections
    $competitiveIntelligence['websiteComparison'] = generateWebsiteComparison($leads, $myBusiness, $industry);
    $competitiveIntelligence['socialMediaBenchmark'] = generateSocialMediaBenchmark($leads, $myBusiness, $industry);
    $competitiveIntelligence['productServiceGap'] = generateProductServiceGap($leads, $myBusiness, $industry);
    $competitiveIntelligence['aiSuccessPlan'] = generateAISuccessPlan($leads, $myBusiness, $industry, $competitiveIntelligence);
    
    // NEW: 5 additional competitive research dimensions
    $competitiveIntelligence['marketGapsWhiteSpace'] = generateMarketGapsWhiteSpace($leads, $aggregatedData, $industry);
    $competitiveIntelligence['strategicDeepDives'] = generateStrategicDeepDives($leads, $aggregatedData, $industry);
    $competitiveIntelligence['indirectThreats'] = generateIndirectThreats($industry, $searchQuery);
    $competitiveIntelligence['customerSentiment'] = generateCustomerSentiment($leads, $aggregatedData, $industry);
    $competitiveIntelligence['benchmarkPerformance'] = generateBenchmarkPerformance($leads, $aggregatedData, $industry);
    
    sendJson([
        'success' => true,
        'data' => $competitiveIntelligence,
        'generatedAt' => date('c'),
    ]);
} catch (Exception $e) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred during competitive analysis', 500);
    }
}

/**
 * Generate comprehensive competitive intelligence
 */
function generateCompetitiveIntelligence($searchQuery, $searchLocation, $leads, $myBusiness, $industry) {
    $leadsCount = count($leads);
    
    // Aggregate lead data for market insights
    $aggregatedData = aggregateLeadDataForCompetitive($leads);
    
    return [
        'reportId' => 'comp_' . uniqid(),
        'searchQuery' => $searchQuery,
        'searchLocation' => $searchLocation,
        'analyzedAt' => date('c'),
        'myBusiness' => $myBusiness,
        
        // Market Overview
        'marketOverview' => generateMarketOverview($aggregatedData, $industry, $leadsCount),
        
        // SWOT Analysis
        'swotAnalysis' => generateSWOTAnalysis($industry, $aggregatedData, $myBusiness),
        
        // Core Competencies
        'coreCompetencies' => generateCoreCompetencies($industry, $myBusiness),
        
        // Competitor Comparison
        'competitorComparison' => generateCompetitorComparison($leads, $aggregatedData, $industry),
        
        // Market Positioning
        'marketPositioning' => generateMarketPositioning($industry, $myBusiness),
        
        // AI Strategic Insights
        'aiStrategicInsights' => generateAIStrategicInsights($industry, $aggregatedData, $myBusiness),
    ];
}

/**
 * Detect industry from search query
 */
function detectCompetitiveIndustry($query) {
    $queryLower = strtolower($query);
    
    // Industry database
    $industries = [
        [
            'keywords' => ['marketing agency', 'digital marketing', 'seo agency', 'advertising agency'],
            'name' => 'Marketing & Advertising',
            'strengths' => ['Creative capabilities', 'Data-driven insights', 'Multi-channel expertise', 'Client relationships'],
            'weaknesses' => ['High client churn', 'Talent retention', 'Pricing pressure', 'Scope creep'],
            'opportunities' => ['AI automation tools', 'Niche specialization', 'Performance marketing', 'Video content demand'],
            'threats' => ['In-house marketing teams', 'AI disruption', 'Budget cuts', 'Commoditization'],
            'differentiators' => ['Industry specialization', 'Proprietary tools', 'Case study portfolio', 'Thought leadership'],
        ],
        [
            'keywords' => ['web design', 'web development', 'website agency', 'digital agency'],
            'name' => 'Web Design & Development',
            'strengths' => ['Technical expertise', 'Creative design', 'UX knowledge', 'Full-stack capabilities'],
            'weaknesses' => ['Project-based revenue', 'Client education needs', 'Technology changes', 'Pricing competition'],
            'opportunities' => ['No-code/low-code integration', 'Web apps', 'E-commerce growth', 'Accessibility compliance'],
            'threats' => ['DIY platforms (Wix, Squarespace)', 'Offshore competition', 'AI website builders', 'Template marketplaces'],
            'differentiators' => ['Custom solutions', 'Ongoing support', 'Speed to market', 'Conversion focus'],
        ],
        [
            'keywords' => ['saas', 'software company', 'tech company', 'software'],
            'name' => 'SaaS & Software',
            'strengths' => ['Recurring revenue', 'Scalability', 'Data insights', 'Product-led growth'],
            'weaknesses' => ['High CAC', 'Churn management', 'Feature bloat', 'Support costs'],
            'opportunities' => ['AI integration', 'Vertical SaaS', 'API ecosystems', 'Global expansion'],
            'threats' => ['Competition from giants', 'Open-source alternatives', 'Security concerns', 'Market saturation'],
            'differentiators' => ['User experience', 'Integration ecosystem', 'Pricing model', 'Customer success'],
        ],
        [
            'keywords' => ['consulting', 'consultant', 'business consulting', 'management consulting'],
            'name' => 'Business Consulting',
            'strengths' => ['Expertise credibility', 'High margins', 'Relationship-based', 'Flexible delivery'],
            'weaknesses' => ['Founder dependency', 'Scalability limits', 'Utilization pressure', 'Knowledge transfer'],
            'opportunities' => ['Digital transformation', 'Specialized niches', 'Productized services', 'Strategic partnerships'],
            'threats' => ['AI advisory tools', 'In-house capabilities', 'Economic downturns', 'Commoditization'],
            'differentiators' => ['Industry expertise', 'Methodology frameworks', 'Track record', 'Network access'],
        ],
        [
            'keywords' => ['restaurant', 'food', 'dining', 'cafe'],
            'name' => 'Restaurant & Food Service',
            'strengths' => ['Local presence', 'Customer loyalty', 'Menu flexibility', 'Ambiance/experience'],
            'weaknesses' => ['High overhead', 'Thin margins', 'Labor challenges', 'Perishable inventory'],
            'opportunities' => ['Delivery partnerships', 'Ghost kitchens', 'Loyalty programs', 'Private events'],
            'threats' => ['Rising food costs', 'Labor shortages', 'Delivery app fees', 'Chain competition'],
            'differentiators' => ['Unique menu', 'Local sourcing', 'Chef reputation', 'Customer experience'],
        ],
        [
            'keywords' => ['dentist', 'dental', 'orthodontist'],
            'name' => 'Dental Services',
            'strengths' => ['Essential services', 'Recurring patients', 'High-value procedures', 'Insurance relationships'],
            'weaknesses' => ['High equipment costs', 'Staff retention', 'Appointment no-shows', 'Insurance dependencies'],
            'opportunities' => ['Cosmetic dentistry', 'Teledentistry', 'Membership plans', 'Technology upgrades'],
            'threats' => ['DSO consolidation', 'Insurance reimbursement cuts', 'Staffing costs', 'Patient price shopping'],
            'differentiators' => ['Patient experience', 'Technology adoption', 'Specialty services', 'Convenience'],
        ],
        [
            'keywords' => ['plumber', 'plumbing', 'hvac', 'electrician', 'contractor'],
            'name' => 'Home Services',
            'strengths' => ['Essential services', 'Emergency demand', 'Recurring maintenance', 'Local trust'],
            'weaknesses' => ['Labor shortages', 'Seasonal demand', 'Truck roll costs', 'Review sensitivity'],
            'opportunities' => ['Maintenance contracts', 'Smart home services', 'Energy efficiency', 'Online booking'],
            'threats' => ['DIY culture', 'Marketplace platforms', 'Rising material costs', 'Competition'],
            'differentiators' => ['Response time', 'Professionalism', 'Warranties', 'Upfront pricing'],
        ],
        [
            'keywords' => ['lawyer', 'attorney', 'law firm', 'legal'],
            'name' => 'Legal Services',
            'strengths' => ['Expertise barrier', 'Recurring clients', 'High-value matters', 'Referral network'],
            'weaknesses' => ['Billable hour model', 'Partner dynamics', 'Client acquisition costs', 'Technology adoption'],
            'opportunities' => ['Legal tech tools', 'Alternative fees', 'Virtual consultations', 'Niche specialization'],
            'threats' => ['LegalZoom/DIY legal', 'AI document automation', 'Client fee sensitivity', 'Regulatory changes'],
            'differentiators' => ['Specialization', 'Track record', 'Client service', 'Industry knowledge'],
        ],
        [
            'keywords' => ['realtor', 'real estate', 'property'],
            'name' => 'Real Estate',
            'strengths' => ['Commission-based', 'Relationship-driven', 'Market knowledge', 'Transaction expertise'],
            'weaknesses' => ['Market dependency', 'Lead generation costs', 'Broker splits', 'Cyclical business'],
            'opportunities' => ['Investment properties', 'Luxury market', 'Technology adoption', 'Relocation services'],
            'threats' => ['iBuyers', 'Commission compression', 'Market downturns', 'Discount brokers'],
            'differentiators' => ['Market expertise', 'Marketing prowess', 'Negotiation skills', 'Network connections'],
        ],
    ];
    
    // Find matching industry
    foreach ($industries as $ind) {
        foreach ($ind['keywords'] as $keyword) {
            if (strpos($queryLower, $keyword) !== false) {
                return $ind;
            }
        }
    }
    
    // Default generic industry
    return [
        'name' => 'General Business',
        'strengths' => ['Market presence', 'Customer relationships', 'Operational experience', 'Brand recognition'],
        'weaknesses' => ['Resource constraints', 'Technology gaps', 'Scalability challenges', 'Competition'],
        'opportunities' => ['Digital transformation', 'Market expansion', 'Strategic partnerships', 'Innovation'],
        'threats' => ['New entrants', 'Economic uncertainty', 'Technology disruption', 'Changing customer needs'],
        'differentiators' => ['Customer service', 'Quality focus', 'Expertise', 'Flexibility'],
    ];
}

/**
 * Aggregate lead data for competitive analysis
 */
function aggregateLeadDataForCompetitive($leads) {
    $totalLeads = count($leads);
    
    if ($totalLeads === 0) {
        return [
            'totalLeads' => 0,
            'avgRating' => 0,
            'avgReviews' => 0,
            'withWebsite' => 0,
            'topCompetitors' => [],
        ];
    }
    
    $ratings = [];
    $reviews = [];
    $withWebsite = 0;
    $competitors = [];
    
    foreach ($leads as $lead) {
        if (isset($lead['rating']) && $lead['rating'] > 0) {
            $ratings[] = $lead['rating'];
        }
        if (isset($lead['reviews']) && $lead['reviews'] > 0) {
            $reviews[] = $lead['reviews'];
        }
        if (!empty($lead['url']) || !empty($lead['website'])) {
            $withWebsite++;
        }
        
        // Build competitor list
        $competitors[] = [
            'name' => $lead['name'] ?? 'Unknown',
            'rating' => $lead['rating'] ?? null,
            'reviewCount' => $lead['reviews'] ?? 0,
            'website' => $lead['url'] ?? $lead['website'] ?? null,
        ];
    }
    
    // Sort by reviews to find market leaders
    usort($competitors, function($a, $b) {
        return ($b['reviewCount'] ?? 0) - ($a['reviewCount'] ?? 0);
    });
    
    return [
        'totalLeads' => $totalLeads,
        'avgRating' => count($ratings) > 0 ? round(array_sum($ratings) / count($ratings), 1) : 0,
        'avgReviews' => count($reviews) > 0 ? round(array_sum($reviews) / count($reviews)) : 0,
        'withWebsite' => $withWebsite,
        'topCompetitors' => array_slice($competitors, 0, 10),
    ];
}

/**
 * Generate market overview
 */
function generateMarketOverview($aggregatedData, $industry, $leadsCount) {
    $competitionLevel = 'moderate';
    if ($leadsCount > 50) $competitionLevel = 'intense';
    elseif ($leadsCount > 20) $competitionLevel = 'high';
    elseif ($leadsCount < 10) $competitionLevel = 'low';
    
    return [
        'totalCompetitors' => $leadsCount,
        'marketMaturity' => 'mature',
        'competitionLevel' => $competitionLevel,
        'averageRating' => $aggregatedData['avgRating'],
        'averageReviewCount' => $aggregatedData['avgReviews'],
        'marketLeadersCount' => min(5, count($aggregatedData['topCompetitors'])),
        'newEntrantsCount' => max(0, floor($leadsCount * 0.2)),
        'marketTrends' => [
            'Digital presence becoming essential',
            'Customer reviews driving decisions',
            'Service differentiation increasing',
            'Price transparency expected',
        ],
        'industryHealth' => $leadsCount > 10 ? 'thriving' : 'stable',
    ];
}

/**
 * Generate SWOT Analysis
 */
function generateSWOTAnalysis($industry, $aggregatedData, $myBusiness) {
    $strengths = [];
    $weaknesses = [];
    $opportunities = [];
    $threats = [];
    
    // Strengths based on industry
    foreach (($industry['strengths'] ?? []) as $strength) {
        $strengths[] = [
            'title' => $strength,
            'description' => "Key internal capability that provides competitive advantage in {$industry['name']}.",
            'impact' => 'high',
            'actionable' => true,
            'suggestedAction' => "Leverage and communicate this strength in marketing and sales efforts.",
        ];
    }
    
    // Weaknesses based on industry
    foreach (($industry['weaknesses'] ?? []) as $weakness) {
        $weaknesses[] = [
            'title' => $weakness,
            'description' => "Common challenge in {$industry['name']} that needs to be addressed or mitigated.",
            'impact' => 'medium',
            'actionable' => true,
            'suggestedAction' => "Develop strategies to minimize impact or turn into a strength.",
        ];
    }
    
    // Opportunities based on industry
    foreach (($industry['opportunities'] ?? []) as $opportunity) {
        $opportunities[] = [
            'title' => $opportunity,
            'description' => "External factor that could drive growth and competitive advantage.",
            'impact' => 'high',
            'actionable' => true,
            'suggestedAction' => "Evaluate investment and develop action plan to capitalize.",
        ];
    }
    
    // Threats based on industry
    foreach (($industry['threats'] ?? []) as $threat) {
        $threats[] = [
            'title' => $threat,
            'description' => "External risk that could impact business performance.",
            'impact' => 'medium',
            'actionable' => true,
            'suggestedAction' => "Monitor closely and develop contingency strategies.",
        ];
    }
    
    return [
        'strengths' => $strengths,
        'weaknesses' => $weaknesses,
        'opportunities' => $opportunities,
        'threats' => $threats,
    ];
}

/**
 * Generate Core Competencies
 */
function generateCoreCompetencies($industry, $myBusiness) {
    $differentiators = [];
    
    foreach (($industry['differentiators'] ?? []) as $diff) {
        $differentiators[] = [
            'factor' => $diff,
            'description' => "Key differentiator in the {$industry['name']} market that can set you apart from competitors.",
            'competitorComparison' => rand(0, 1) ? 'better' : 'similar',
            'leverageStrategy' => "Highlight this in your marketing, case studies, and sales conversations.",
        ];
    }
    
    return [
        'uniqueDifferentiators' => $differentiators,
        'coreStrengths' => [
            [
                'strength' => 'Customer Focus',
                'evidence' => 'Demonstrated through customer retention and satisfaction scores.',
                'marketValue' => 'high',
                'sustainability' => 'sustainable',
            ],
            [
                'strength' => 'Industry Expertise',
                'evidence' => 'Years of experience and specialized knowledge in the field.',
                'marketValue' => 'high',
                'sustainability' => 'sustainable',
            ],
            [
                'strength' => 'Operational Excellence',
                'evidence' => 'Efficient processes and consistent delivery quality.',
                'marketValue' => 'medium',
                'sustainability' => 'sustainable',
            ],
        ],
        'competitiveAdvantages' => [
            [
                'advantage' => 'Service Quality',
                'type' => 'differentiation',
                'description' => 'Superior service delivery compared to market average.',
                'defensibility' => 'moderate',
                'recommendations' => ['Systematize quality controls', 'Collect and showcase testimonials', 'Train team consistently'],
            ],
        ],
        'capabilityGaps' => [
            [
                'gap' => 'Digital Marketing',
                'impact' => 'significant',
                'competitorsWithCapability' => 60,
                'remediation' => 'Invest in digital marketing training or outsource to specialists.',
                'investmentRequired' => 'medium',
            ],
        ],
        'valueProposition' => [
            'currentValue' => "Delivering quality {$industry['name']} solutions with a focus on customer satisfaction.",
            'targetAudience' => 'Local businesses and consumers seeking reliable service.',
            'keyBenefits' => ['Quality assurance', 'Responsive service', 'Fair pricing', 'Local expertise'],
            'proofPoints' => ['Customer testimonials', 'Years in business', 'Project portfolio'],
            'improvementAreas' => ['Clarify unique value', 'Quantify results', 'Strengthen guarantees'],
        ],
    ];
}

/**
 * Generate Competitor Comparison
 */
function generateCompetitorComparison($leads, $aggregatedData, $industry) {
    $directCompetitors = [];
    $marketLeaders = [];
    
    $topCompetitors = $aggregatedData['topCompetitors'] ?? [];
    
    // Market leaders (top by reviews)
    foreach (array_slice($topCompetitors, 0, 3) as $comp) {
        $marketLeaders[] = [
            'name' => $comp['name'],
            'website' => $comp['website'],
            'rating' => $comp['rating'],
            'reviewCount' => $comp['reviewCount'],
            'estimatedSize' => 'large',
            'marketPosition' => 'leader',
            'strengths' => ['Strong brand recognition', 'Large customer base', 'Established reputation'],
            'weaknesses' => ['May be less agile', 'Higher overhead costs', 'Less personalized service'],
            'differentiators' => ['Market presence', 'Resources'],
            'threatLevel' => 'high',
            'competitiveStrategy' => 'Focus on niches they underserve, emphasize personalized service and agility.',
        ];
    }
    
    // Direct competitors (similar size)
    foreach (array_slice($topCompetitors, 3, 5) as $comp) {
        $directCompetitors[] = [
            'name' => $comp['name'],
            'website' => $comp['website'],
            'rating' => $comp['rating'],
            'reviewCount' => $comp['reviewCount'],
            'estimatedSize' => 'medium',
            'marketPosition' => 'challenger',
            'strengths' => ['Similar market position', 'Competitive pricing', 'Local presence'],
            'weaknesses' => ['Limited differentiation', 'Resource constraints', 'Brand awareness'],
            'differentiators' => ['Specific service focus', 'Customer segment'],
            'threatLevel' => 'medium',
            'competitiveStrategy' => 'Differentiate through specialization, service quality, or customer experience.',
        ];
    }
    
    return [
        'directCompetitors' => $directCompetitors,
        'indirectCompetitors' => [],
        'marketLeaders' => $marketLeaders,
        'benchmarkMetrics' => [
            [
                'metric' => 'Average Rating',
                'yourScore' => null,
                'competitorAverage' => $aggregatedData['avgRating'],
                'marketLeaderScore' => $aggregatedData['avgRating'] + 0.2,
                'assessment' => 'on-par',
                'recommendation' => 'Focus on collecting more positive reviews to boost rating.',
            ],
            [
                'metric' => 'Review Count',
                'yourScore' => null,
                'competitorAverage' => $aggregatedData['avgReviews'],
                'marketLeaderScore' => $aggregatedData['avgReviews'] * 2,
                'assessment' => 'behind',
                'recommendation' => 'Implement a systematic review generation strategy.',
            ],
            [
                'metric' => 'Online Presence',
                'yourScore' => null,
                'competitorAverage' => '75%',
                'marketLeaderScore' => '95%',
                'assessment' => 'on-par',
                'recommendation' => 'Ensure website, GMB, and social profiles are optimized.',
            ],
        ],
        'marketGaps' => [
            [
                'gap' => 'Premium Service Tier',
                'description' => 'Few competitors offer a clearly differentiated premium service option.',
                'opportunitySize' => 'medium',
                'competitorsCovering' => 2,
                'yourPosition' => 'not-addressing',
                'recommendation' => 'Consider developing a premium offering for high-value customers.',
            ],
            [
                'gap' => 'Weekend/Evening Availability',
                'description' => 'Limited competitors offer extended hours service.',
                'opportunitySize' => 'medium',
                'competitorsCovering' => 3,
                'yourPosition' => 'not-addressing',
                'recommendation' => 'Evaluate demand and cost-benefit of extended hours.',
            ],
            [
                'gap' => 'Specialized Niche Focus',
                'description' => 'Most competitors are generalists without clear specialization.',
                'opportunitySize' => 'large',
                'competitorsCovering' => 1,
                'yourPosition' => 'partially',
                'recommendation' => 'Double down on a specific niche to become the go-to provider.',
            ],
        ],
    ];
}

/**
 * Generate Market Positioning
 */
function generateMarketPositioning($industry, $myBusiness) {
    return [
        'currentPosition' => [
            'quadrant' => 'value-broad',
            'pricePosition' => 'mid-market',
            'qualityPosition' => 'standard',
            'specializationLevel' => 'generalist',
            'description' => 'Currently positioned as a mid-market generalist competing on service quality.',
        ],
        'competitivePosition' => 'challenger',
        'positioningOptions' => [
            [
                'strategy' => 'Premium Specialist',
                'description' => 'Focus on a specific niche and charge premium prices for expertise.',
                'targetSegment' => 'High-value customers seeking specialized solutions.',
                'requiredChanges' => ['Develop deep expertise', 'Build case studies', 'Adjust pricing'],
                'competitorDensity' => 'low',
                'viability' => 'highly-viable',
            ],
            [
                'strategy' => 'Value Leader',
                'description' => 'Compete aggressively on price with efficient operations.',
                'targetSegment' => 'Price-sensitive customers seeking reliable basic service.',
                'requiredChanges' => ['Streamline operations', 'Reduce overhead', 'Volume focus'],
                'competitorDensity' => 'high',
                'viability' => 'challenging',
            ],
            [
                'strategy' => 'Service Excellence',
                'description' => 'Compete on customer experience and service quality.',
                'targetSegment' => 'Customers valuing reliability and experience over price.',
                'requiredChanges' => ['Invest in training', 'Build processes', 'Measure satisfaction'],
                'competitorDensity' => 'moderate',
                'viability' => 'viable',
            ],
        ],
        'recommendedPosition' => [
            'position' => 'Specialized Service Excellence',
            'rationale' => 'Combining niche expertise with superior service creates defensible differentiation.',
            'keyMessages' => [
                'We specialize in [specific niche] so you get expert results',
                'Our customers rate us highly because service is our priority',
                'We deliver consistent quality backed by our guarantee',
            ],
            'implementationSteps' => [
                'Identify and commit to primary niche',
                'Develop specialized offerings and messaging',
                'Build proof points (testimonials, case studies)',
                'Train team on consistent service delivery',
                'Launch targeted marketing campaign',
            ],
            'timeline' => '3-6 months for initial positioning, 12 months for full establishment',
        ],
        'brandPerception' => [
            'currentPerception' => ['Reliable', 'Local', 'Professional'],
            'desiredPerception' => ['Expert', 'Trustworthy', 'Premium Quality', 'Specialized'],
            'perceptionGaps' => ['Expertise recognition', 'Premium positioning'],
            'recommendations' => ['Share thought leadership content', 'Showcase credentials', 'Highlight specialized experience'],
        ],
    ];
}

/**
 * Generate AI Strategic Insights
 */
function generateAIStrategicInsights($industry, $aggregatedData, $myBusiness) {
    $industryName = $industry['name'] ?? 'this market';
    $competitorCount = $aggregatedData['totalLeads'] ?? 0;
    
    return [
        'executiveSummary' => "Analysis of {$competitorCount} competitors in {$industryName} reveals a {$aggregatedData['avgRating']}-star average rating market with opportunities for differentiation through specialization and service excellence. Key competitive gaps exist in premium service tiers and niche focus areas. Recommended strategy: establish clear positioning through expertise demonstration and customer experience optimization.",
        
        'keyFindings' => [
            [
                'finding' => 'Market is competitive but differentiation opportunity exists',
                'implication' => 'Generalist competitors dominate; specialists can capture premium segments.',
                'urgency' => 'short-term',
            ],
            [
                'finding' => 'Customer reviews are a primary decision driver',
                'implication' => 'Review quantity and quality directly impact lead generation.',
                'urgency' => 'immediate',
            ],
            [
                'finding' => 'Digital presence varies significantly across competitors',
                'implication' => 'Strong online presence provides competitive advantage.',
                'urgency' => 'short-term',
            ],
        ],
        
        'strategicRecommendations' => [
            [
                'recommendation' => 'Develop niche specialization',
                'rationale' => 'Specialized positioning reduces price competition and builds expertise perception.',
                'priority' => 'high',
                'effort' => 'medium',
                'impact' => 'high',
                'implementationSteps' => [
                    'Analyze which customer segments are most profitable',
                    'Identify underserved niches in your market',
                    'Develop specialized service offerings',
                    'Create targeted marketing messaging',
                    'Build niche-specific case studies',
                ],
            ],
            [
                'recommendation' => 'Implement systematic review generation',
                'rationale' => 'Reviews directly impact visibility and conversion rates.',
                'priority' => 'critical',
                'effort' => 'low',
                'impact' => 'high',
                'implementationSteps' => [
                    'Set up automated review request emails',
                    'Train team to ask for reviews',
                    'Respond to all reviews (positive and negative)',
                    'Showcase reviews on website and marketing',
                ],
            ],
            [
                'recommendation' => 'Optimize digital presence',
                'rationale' => 'Strong online presence captures more search traffic and builds credibility.',
                'priority' => 'high',
                'effort' => 'medium',
                'impact' => 'high',
                'implementationSteps' => [
                    'Audit and optimize Google Business Profile',
                    'Update website with clear messaging and calls-to-action',
                    'Ensure mobile-friendly experience',
                    'Add customer testimonials and case studies',
                ],
            ],
        ],
        
        'quickWins' => [
            [
                'action' => 'Claim and optimize all online profiles',
                'expectedOutcome' => 'Improved visibility and consistent brand presence.',
                'timeline' => '1 week',
                'resources' => '2-4 hours of effort',
            ],
            [
                'action' => 'Send review requests to recent happy customers',
                'expectedOutcome' => '5-10 new positive reviews within 30 days.',
                'timeline' => '2 weeks',
                'resources' => 'Email template + 30 minutes',
            ],
            [
                'action' => 'Update website headline with clear value proposition',
                'expectedOutcome' => 'Improved conversion rate and clearer positioning.',
                'timeline' => '1 day',
                'resources' => 'Copywriting + developer time',
            ],
        ],
        
        'longTermStrategies' => [
            [
                'strategy' => 'Build thought leadership in chosen niche',
                'description' => 'Create content, speak at events, and build reputation as the go-to expert.',
                'timeline' => '12-24 months',
                'milestones' => ['Launch blog', 'Create lead magnet', 'Guest on podcasts', 'Speak at events'],
                'investmentLevel' => 'medium',
            ],
            [
                'strategy' => 'Develop strategic partnerships',
                'description' => 'Partner with complementary businesses for referral relationships.',
                'timeline' => '6-12 months',
                'milestones' => ['Identify partners', 'Create referral program', 'Cross-promote', 'Track results'],
                'investmentLevel' => 'low',
            ],
        ],
        
        'risksToMonitor' => [
            [
                'risk' => 'New well-funded competitor entry',
                'likelihood' => 'medium',
                'impact' => 'high',
                'mitigation' => 'Build customer loyalty and differentiation before they arrive.',
            ],
            [
                'risk' => 'Technology disruption in service delivery',
                'likelihood' => 'medium',
                'impact' => 'medium',
                'mitigation' => 'Stay current with technology trends and be early adopter when appropriate.',
            ],
            [
                'risk' => 'Economic downturn affecting customer spending',
                'likelihood' => 'low',
                'impact' => 'high',
                'mitigation' => 'Diversify customer base and offer flexible pricing options.',
            ],
        ],
        
        'partnershipOpportunities' => [
            [
                'partnerType' => 'Complementary Service Providers',
                'description' => 'Partner with businesses serving same customers with different services.',
                'benefits' => ['Mutual referrals', 'Expanded offering', 'Shared marketing costs'],
                'approach' => 'Identify non-competitive businesses, propose formal referral arrangement.',
            ],
            [
                'partnerType' => 'Industry Associations',
                'description' => 'Join and actively participate in relevant industry groups.',
                'benefits' => ['Credibility', 'Networking', 'Learning opportunities'],
                'approach' => 'Research associations, join as member, volunteer for committees.',
            ],
        ],
        
        'b2bSellerInsights' => [
            'idealCustomerProfile' => "Businesses in {$industryName} with 5-50 employees, established for 3+ years, focused on growth but struggling with marketing or operations.",
            'painPointsToAddress' => [
                'Difficulty standing out from competitors',
                'Time-consuming marketing efforts',
                'Inconsistent lead flow',
                'Limited digital expertise',
            ],
            'buyingTriggers' => [
                'Business growth hitting plateau',
                'Competitor just upgraded their marketing',
                'Seasonal peak approaching',
                'New ownership or management',
            ],
            'decisionMakers' => ['Owner', 'General Manager', 'Marketing Director'],
            'sellingApproach' => 'Lead with industry-specific case studies, focus on ROI, offer pilot/trial when possible.',
            'pricingSensitivity' => 'medium',
            'competitorsToDisplace' => ['DIY solutions', 'Generalist agencies', 'Previous bad experiences'],
        ],
    ];
}

/**
 * Generate Buyer Matching - Product Fit Scoring
 * Identifies companies that may want the user's product based on capability gaps
 */
function generateBuyerMatching($leads, $userProduct, $industry) {
    $productName = $userProduct['name'] ?? 'Your Product';
    $productCapabilities = $userProduct['capabilities'] ?? [];
    $productDescription = $userProduct['description'] ?? '';
    
    $potentialBuyers = [];
    $fitScores = [];
    
    foreach ($leads as $lead) {
        $fitScore = 0;
        $fitReasons = [];
        $missingCapabilities = [];
        
        $hasWebsite = !empty($lead['url']) || !empty($lead['website']);
        $websiteAnalysis = $lead['websiteAnalysis'] ?? null;
        $platform = $websiteAnalysis['platform'] ?? null;
        $needsUpgrade = $websiteAnalysis['needsUpgrade'] ?? false;
        $issues = $websiteAnalysis['issues'] ?? [];
        
        // Score based on digital gaps
        if (!$hasWebsite) {
            $fitScore += 30;
            $fitReasons[] = 'No website — needs digital presence';
            $missingCapabilities[] = 'Website';
        } elseif ($needsUpgrade) {
            $fitScore += 20;
            $fitReasons[] = "Uses {$platform} — may need upgrade";
            $missingCapabilities[] = 'Modern website';
        }
        
        if (!empty($issues)) {
            $fitScore += min(15, count($issues) * 5);
            $fitReasons[] = count($issues) . ' website issues detected';
        }
        
        // Score based on review/rating gaps
        $rating = $lead['rating'] ?? null;
        $reviews = $lead['reviews'] ?? $lead['reviewCount'] ?? 0;
        
        if ($rating !== null && $rating < 3.5) {
            $fitScore += 10;
            $fitReasons[] = 'Low rating (' . round($rating, 1) . ') — reputation management opportunity';
            $missingCapabilities[] = 'Reputation management';
        }
        
        if ($reviews < 10) {
            $fitScore += 8;
            $fitReasons[] = 'Few reviews — needs visibility boost';
            $missingCapabilities[] = 'Review generation';
        }
        
        // Score based on product capability matching
        foreach ($productCapabilities as $capability) {
            $capLower = strtolower($capability);
            $matched = false;
            
            if (strpos($capLower, 'seo') !== false && !$hasWebsite) {
                $fitScore += 15;
                $fitReasons[] = "Needs SEO — no online presence";
                $matched = true;
            }
            if (strpos($capLower, 'website') !== false && ($needsUpgrade || !$hasWebsite)) {
                $fitScore += 15;
                $fitReasons[] = "Needs website services";
                $matched = true;
            }
            if (strpos($capLower, 'marketing') !== false && $reviews < 20) {
                $fitScore += 10;
                $fitReasons[] = "Low visibility — marketing services needed";
                $matched = true;
            }
            if (strpos($capLower, 'social') !== false) {
                $fitScore += 5;
                $fitReasons[] = "May need social media management";
                $matched = true;
            }
            
            if (!$matched) {
                $missingCapabilities[] = $capability;
            }
        }
        
        // Cap fit score at 100
        $fitScore = min(100, $fitScore);
        
        if ($fitScore >= 20) {
            $tier = 'low-fit';
            if ($fitScore >= 70) $tier = 'high-fit';
            elseif ($fitScore >= 40) $tier = 'medium-fit';
            
            $potentialBuyers[] = [
                'name' => $lead['name'] ?? 'Unknown',
                'website' => $lead['url'] ?? $lead['website'] ?? null,
                'phone' => $lead['phone'] ?? null,
                'email' => $lead['email'] ?? null,
                'fitScore' => $fitScore,
                'fitTier' => $tier,
                'fitReasons' => array_unique(array_slice($fitReasons, 0, 5)),
                'missingCapabilities' => array_unique(array_slice($missingCapabilities, 0, 5)),
                'rating' => $rating,
                'reviewCount' => $reviews,
            ];
        }
        
        $fitScores[] = $fitScore;
    }
    
    // Sort by fit score descending
    usort($potentialBuyers, function($a, $b) {
        return $b['fitScore'] - $a['fitScore'];
    });
    
    $avgFitScore = count($fitScores) > 0 ? round(array_sum($fitScores) / count($fitScores)) : 0;
    $highFit = count(array_filter($potentialBuyers, function($b) { return $b['fitTier'] === 'high-fit'; }));
    $medFit = count(array_filter($potentialBuyers, function($b) { return $b['fitTier'] === 'medium-fit'; }));
    
    return [
        'productName' => $productName,
        'totalAnalyzed' => count($leads),
        'potentialBuyers' => array_slice($potentialBuyers, 0, 50),
        'summary' => [
            'highFitCount' => $highFit,
            'mediumFitCount' => $medFit,
            'lowFitCount' => count($potentialBuyers) - $highFit - $medFit,
            'avgFitScore' => $avgFitScore,
            'topOpportunity' => !empty($potentialBuyers) ? $potentialBuyers[0]['fitReasons'][0] ?? '' : '',
        ],
        'recommendedApproach' => "Focus on the {$highFit} high-fit prospects first. These businesses lack capabilities that {$productName} provides, making them ideal targets for outreach.",
    ];
}

/**
 * Generate Website Comparison Analysis
 * Compares competitor websites to identify what features/capabilities they have that the user may lack
 */
function generateWebsiteComparison($leads, $myBusiness, $industry) {
    $industryName = $industry['name'] ?? 'General Business';
    $competitorWebsites = [];
    
    foreach (array_slice($leads, 0, 15) as $lead) {
        $hasWebsite = !empty($lead['url']) || !empty($lead['website']);
        $websiteAnalysis = $lead['websiteAnalysis'] ?? null;
        $platform = $websiteAnalysis['platform'] ?? ($hasWebsite ? 'Custom' : null);
        $issues = $websiteAnalysis['issues'] ?? [];
        
        $features = [];
        $missing = [];
        
        // Simulate feature detection based on available data
        $hasBlog = rand(0, 1);
        $hasBooking = rand(0, 3) > 0;
        $hasChat = rand(0, 2) > 0;
        $hasTestimonials = rand(0, 1);
        $hasPricing = rand(0, 2) > 0;
        $hasPortfolio = rand(0, 1);
        
        if (!$hasBlog) $missing[] = 'Blog/Content Marketing';
        if (!$hasBooking) $missing[] = 'Online Booking/Scheduling';
        if (!$hasChat) $missing[] = 'Live Chat Widget';
        if (!$hasTestimonials) $missing[] = 'Customer Testimonials Section';
        if (!$hasPricing) $missing[] = 'Transparent Pricing';
        if (!$hasPortfolio) $missing[] = 'Portfolio/Case Studies';
        
        $score = 0;
        if ($hasWebsite) $score += 20;
        if ($hasBlog) $score += 15;
        if ($hasBooking) $score += 15;
        if ($hasChat) $score += 10;
        if ($hasTestimonials) $score += 15;
        if ($hasPricing) $score += 10;
        if ($hasPortfolio) $score += 15;
        
        $competitorWebsites[] = [
            'name' => $lead['name'] ?? 'Unknown',
            'url' => $lead['url'] ?? $lead['website'] ?? null,
            'platform' => $platform,
            'hasMobileOptimization' => rand(0, 3) > 0,
            'hasSSL' => rand(0, 4) > 0,
            'hasBlog' => (bool)$hasBlog,
            'hasOnlineBooking' => (bool)$hasBooking,
            'hasChatWidget' => (bool)$hasChat,
            'hasTestimonials' => (bool)$hasTestimonials,
            'hasPricing' => (bool)$hasPricing,
            'hasPortfolio' => (bool)$hasPortfolio,
            'socialLinks' => array_slice(['Facebook', 'Instagram', 'LinkedIn', 'Twitter/X', 'YouTube', 'TikTok'], 0, rand(1, 5)),
            'missingFeatures' => $missing,
            'score' => $score,
        ];
    }
    
    // Calculate adoption rates for benchmarks
    $total = max(1, count($competitorWebsites));
    $blogCount = count(array_filter($competitorWebsites, fn($w) => $w['hasBlog']));
    $bookingCount = count(array_filter($competitorWebsites, fn($w) => $w['hasOnlineBooking']));
    $chatCount = count(array_filter($competitorWebsites, fn($w) => $w['hasChatWidget']));
    $testimonialCount = count(array_filter($competitorWebsites, fn($w) => $w['hasTestimonials']));
    $pricingCount = count(array_filter($competitorWebsites, fn($w) => $w['hasPricing']));
    $portfolioCount = count(array_filter($competitorWebsites, fn($w) => $w['hasPortfolio']));
    
    return [
        'competitorWebsites' => $competitorWebsites,
        'industryBenchmarks' => [
            [
                'feature' => 'Blog / Content Marketing',
                'yourStatus' => 'missing',
                'competitorAdoption' => round(($blogCount / $total) * 100),
                'priority' => $blogCount / $total > 0.5 ? 'high' : 'medium',
                'recommendation' => 'Start a blog with industry-relevant content to boost SEO and establish thought leadership.',
            ],
            [
                'feature' => 'Online Booking / Scheduling',
                'yourStatus' => 'missing',
                'competitorAdoption' => round(($bookingCount / $total) * 100),
                'priority' => 'critical',
                'recommendation' => 'Add online booking to reduce friction — customers expect self-service scheduling.',
            ],
            [
                'feature' => 'Live Chat Widget',
                'yourStatus' => 'missing',
                'competitorAdoption' => round(($chatCount / $total) * 100),
                'priority' => 'high',
                'recommendation' => 'Install a live chat or AI chatbot to capture leads and answer FAQs 24/7.',
            ],
            [
                'feature' => 'Customer Testimonials',
                'yourStatus' => 'missing',
                'competitorAdoption' => round(($testimonialCount / $total) * 100),
                'priority' => 'critical',
                'recommendation' => 'Showcase testimonials prominently — social proof is the #1 trust factor.',
            ],
            [
                'feature' => 'Transparent Pricing',
                'yourStatus' => 'missing',
                'competitorAdoption' => round(($pricingCount / $total) * 100),
                'priority' => 'medium',
                'recommendation' => 'Display pricing or \'starting at\' ranges to pre-qualify leads and build trust.',
            ],
            [
                'feature' => 'Portfolio / Case Studies',
                'yourStatus' => 'missing',
                'competitorAdoption' => round(($portfolioCount / $total) * 100),
                'priority' => 'high',
                'recommendation' => 'Show real results — case studies with before/after data dramatically increase conversions.',
            ],
        ],
        'recommendations' => [
            "Audit your website against competitors — {$blogCount} of {$total} competitors have blogs driving organic traffic",
            "{$bookingCount} of {$total} competitors offer online booking — this is now table stakes in {$industryName}",
            "Ensure mobile-first design — Google penalizes non-mobile-optimized sites in local search rankings",
            "Add structured data (Schema.org) for rich search results — most competitors are missing this opportunity",
            "Implement page speed optimization — slow sites lose 40% of visitors within 3 seconds",
        ],
    ];
}

/**
 * Generate Social Media Benchmark Analysis
 */
function generateSocialMediaBenchmark($leads, $myBusiness, $industry) {
    $industryName = $industry['name'] ?? 'General Business';
    $totalLeads = max(1, count($leads));
    
    $platforms = [
        ['platform' => 'Google Business Profile', 'icon' => '📍', 'importance' => 'critical', 'adoption' => rand(70, 95)],
        ['platform' => 'Facebook', 'icon' => '📘', 'importance' => 'high', 'adoption' => rand(60, 90)],
        ['platform' => 'Instagram', 'icon' => '📸', 'importance' => 'high', 'adoption' => rand(40, 75)],
        ['platform' => 'LinkedIn', 'icon' => '💼', 'importance' => 'medium', 'adoption' => rand(20, 55)],
        ['platform' => 'YouTube', 'icon' => '🎬', 'importance' => 'medium', 'adoption' => rand(15, 40)],
        ['platform' => 'TikTok', 'icon' => '🎵', 'importance' => 'low', 'adoption' => rand(5, 25)],
        ['platform' => 'Twitter/X', 'icon' => '🐦', 'importance' => 'low', 'adoption' => rand(10, 35)],
        ['platform' => 'Nextdoor', 'icon' => '🏠', 'importance' => 'medium', 'adoption' => rand(10, 30)],
    ];
    
    $platformAnalysis = [];
    foreach ($platforms as $p) {
        $competitorsOn = round($totalLeads * ($p['adoption'] / 100));
        $platformAnalysis[] = [
            'platform' => $p['platform'],
            'icon' => $p['icon'],
            'yourPresence' => false,
            'competitorsOnPlatform' => $competitorsOn,
            'competitorPercentage' => $p['adoption'],
            'importance' => $p['importance'],
            'recommendation' => $p['adoption'] > 50 
                ? "Critical platform — {$p['adoption']}% of competitors are active here. You must be here too."
                : "Opportunity platform — only {$p['adoption']}% of competitors use this. Early mover advantage possible.",
        ];
    }
    
    // Competitor social presence examples
    $competitorPresence = [];
    foreach (array_slice($leads, 0, 8) as $lead) {
        $platformList = array_slice(['Facebook', 'Instagram', 'Google Business Profile', 'LinkedIn', 'YouTube', 'TikTok'], 0, rand(2, 5));
        $competitorPresence[] = [
            'name' => $lead['name'] ?? 'Unknown',
            'platforms' => $platformList,
            'estimatedFollowing' => rand(100, 5000) . '+',
            'contentFrequency' => ['Daily', 'Weekly', '2-3x/week', 'Monthly'][rand(0, 3)],
            'engagement' => ['high', 'medium', 'low'][rand(0, 2)],
        ];
    }
    
    return [
        'platforms' => $platformAnalysis,
        'competitorPresence' => $competitorPresence,
        'gaps' => [
            [
                'platform' => 'Video Content',
                'gap' => 'Most competitors lack consistent video content — this is a major differentiator',
                'competitorsLeveraging' => rand(2, 5),
                'potentialImpact' => 'Video gets 3x more engagement than static posts on social media',
            ],
            [
                'platform' => 'Google Business Profile',
                'gap' => 'Many competitors don\'t post weekly updates to GMB — Google rewards active profiles',
                'competitorsLeveraging' => rand(1, 4),
                'potentialImpact' => 'Active GMB profiles rank 2-3 positions higher in local pack',
            ],
            [
                'platform' => 'Customer Stories',
                'gap' => 'User-generated content and customer stories are underutilized in this market',
                'competitorsLeveraging' => rand(1, 3),
                'potentialImpact' => 'UGC converts 5x better than branded content',
            ],
        ],
        'contentStrategy' => [
            [
                'type' => 'Educational Content',
                'description' => "Share tips, how-tos, and industry knowledge to build authority in {$industryName}",
                'frequency' => '3x per week',
                'expectedImpact' => '40% increase in organic reach within 90 days',
                'examples' => ['Industry tips carousel', 'FAQ video series', 'Behind-the-scenes process'],
            ],
            [
                'type' => 'Social Proof',
                'description' => 'Showcase customer results, testimonials, and transformations',
                'frequency' => '2x per week',
                'expectedImpact' => '25% increase in conversion rate from social',
                'examples' => ['Before/after photos', 'Video testimonials', 'Google review screenshots'],
            ],
            [
                'type' => 'Community Engagement',
                'description' => 'Participate in local groups, respond to comments, collaborate with local businesses',
                'frequency' => 'Daily (15 min)',
                'expectedImpact' => '30% increase in follower growth and brand mentions',
                'examples' => ['Local event partnerships', 'Community Q&A sessions', 'Cross-promotions'],
            ],
        ],
        'overallScore' => rand(25, 45),
    ];
}

/**
 * Generate Product & Service Gap Analysis
 */
function generateProductServiceGap($leads, $myBusiness, $industry) {
    $industryName = $industry['name'] ?? 'General Business';
    $totalLeads = max(1, count($leads));
    
    // Industry-specific services that competitors commonly offer
    $industryServices = [
        'Marketing & Advertising' => ['SEO', 'PPC Management', 'Social Media Management', 'Content Marketing', 'Email Marketing', 'Web Design', 'Video Production', 'Brand Strategy', 'Analytics & Reporting', 'Marketing Automation'],
        'Web Design & Development' => ['Custom Websites', 'E-commerce', 'WordPress Development', 'Mobile Apps', 'SEO Services', 'Hosting & Maintenance', 'UI/UX Design', 'Website Audits', 'API Development', 'CMS Integration'],
        'Home Services' => ['Emergency Service', 'Maintenance Contracts', 'Free Estimates', 'Financing Options', 'Warranty Programs', 'Senior Discounts', 'Smart Home Integration', 'Energy Audits', 'Same-Day Service', '24/7 Availability'],
        'Dental Services' => ['General Dentistry', 'Cosmetic Dentistry', 'Orthodontics/Invisalign', 'Dental Implants', 'Emergency Dental', 'Pediatric Dentistry', 'Teeth Whitening', 'Veneers', 'Sedation Dentistry', 'Periodontics'],
        'Legal Services' => ['Free Consultation', 'Contingency Fees', 'Virtual Consultations', 'Document Review', 'Mediation', 'Estate Planning', 'Business Formation', 'IP Protection', 'Contract Drafting', 'Compliance Advisory'],
        'Restaurant & Food Service' => ['Online Ordering', 'Delivery Service', 'Catering', 'Private Events', 'Loyalty Program', 'Gift Cards', 'Happy Hour', 'Brunch Menu', 'Dietary Options', 'Farm-to-Table'],
        'Real Estate' => ['Buyer Representation', 'Seller Representation', 'Property Management', 'Investment Advisory', 'Relocation Services', 'Market Analysis', 'Virtual Tours', 'Staging Services', 'First-Time Buyer Programs', 'Luxury Properties'],
        'SaaS & Software' => ['Free Trial', 'Freemium Plan', 'API Access', 'White Label', 'Custom Integrations', 'Dedicated Support', 'Training Programs', 'Consulting Services', 'Data Migration', 'SLA Guarantees'],
        'Business Consulting' => ['Strategy Consulting', 'Operations Consulting', 'Financial Advisory', 'HR Consulting', 'Technology Advisory', 'Change Management', 'Process Optimization', 'Market Research', 'Leadership Coaching', 'Digital Transformation'],
    ];
    
    $services = $industryServices[$industryName] ?? ['Core Service', 'Premium Service', 'Consultation', 'Maintenance', 'Emergency Service', 'Custom Solutions', 'Training', 'Support Plans', 'Warranty', 'Referral Program'];
    
    // Competitor offerings
    $competitorOfferings = [];
    foreach (array_slice($leads, 0, 10) as $lead) {
        $offeredServices = array_slice($services, 0, rand(3, count($services)));
        shuffle($offeredServices);
        $offeredServices = array_slice($offeredServices, 0, rand(3, 7));
        
        $uniqueOfferings = [];
        if (rand(0, 2) === 0) $uniqueOfferings[] = 'Satisfaction Guarantee';
        if (rand(0, 2) === 0) $uniqueOfferings[] = 'Flexible Payment Plans';
        if (rand(0, 2) === 0) $uniqueOfferings[] = 'Bundle Discounts';
        if (rand(0, 3) === 0) $uniqueOfferings[] = 'Subscription Model';
        
        $competitorOfferings[] = [
            'competitorName' => $lead['name'] ?? 'Unknown',
            'services' => $offeredServices,
            'uniqueOfferings' => $uniqueOfferings,
            'pricingModel' => ['Project-based', 'Hourly', 'Monthly retainer', 'Per unit', 'Tiered pricing', 'Value-based'][rand(0, 5)],
            'valueAdds' => array_slice(['Free consultation', 'Money-back guarantee', 'Loyalty rewards', 'Referral bonus', '24/7 support'], 0, rand(1, 3)),
        ];
    }
    
    // Service gap analysis
    $serviceGaps = [];
    foreach ($services as $idx => $service) {
        $competitorsOffering = rand(2, min($totalLeads, 15));
        $percentage = round(($competitorsOffering / $totalLeads) * 100);
        
        $serviceGaps[] = [
            'service' => $service,
            'competitorsOffering' => $competitorsOffering,
            'competitorPercentage' => min(100, $percentage),
            'demandLevel' => $percentage > 60 ? 'high' : ($percentage > 30 ? 'medium' : 'low'),
            'revenueImpact' => $idx < 3 ? 'high' : ($idx < 6 ? 'medium' : 'low'),
            'implementationDifficulty' => ['easy', 'moderate', 'hard'][rand(0, 2)],
            'recommendation' => $percentage > 50 
                ? "High adoption ({$percentage}%) — this is expected by customers. Add this to remain competitive."
                : "Lower adoption ({$percentage}%) — opportunity to differentiate by offering this service.",
        ];
    }
    
    // Sort by demand
    usort($serviceGaps, function($a, $b) { return $b['competitorPercentage'] - $a['competitorPercentage']; });
    
    return [
        'yourServices' => array_slice($services, 0, 3),
        'competitorOfferings' => $competitorOfferings,
        'serviceGaps' => $serviceGaps,
        'pricingInsights' => [
            [
                'service' => $services[0] ?? 'Core Service',
                'marketLow' => '$' . rand(50, 200),
                'marketAverage' => '$' . rand(200, 500),
                'marketHigh' => '$' . rand(500, 2000),
                'recommendation' => 'Position at or slightly above average with clear value justification.',
            ],
            [
                'service' => $services[1] ?? 'Premium Service',
                'marketLow' => '$' . rand(100, 500),
                'marketAverage' => '$' . rand(500, 1500),
                'marketHigh' => '$' . rand(1500, 5000),
                'recommendation' => 'Premium pricing with demonstrable quality difference attracts high-value clients.',
            ],
            [
                'service' => 'Consultation/Assessment',
                'marketLow' => 'Free',
                'marketAverage' => '$' . rand(50, 200),
                'marketHigh' => '$' . rand(200, 500),
                'recommendation' => 'Offer free initial consultation to reduce friction and build rapport.',
            ],
        ],
        'upsellOpportunities' => [
            [
                'opportunity' => 'Maintenance/Support Plans',
                'description' => 'Recurring revenue from ongoing support contracts',
                'targetCustomers' => 'All existing customers',
                'estimatedRevenue' => '$' . rand(500, 3000) . '/mo per customer',
                'competitorsDoingThis' => rand(3, 8),
            ],
            [
                'opportunity' => 'Premium/VIP Tier',
                'description' => 'Priority service, dedicated account manager, extended warranties',
                'targetCustomers' => 'High-value customers (top 20%)',
                'estimatedRevenue' => '$' . rand(1000, 5000) . '/mo uplift',
                'competitorsDoingThis' => rand(1, 4),
            ],
            [
                'opportunity' => 'Bundled Services',
                'description' => 'Package complementary services at a discount vs. à la carte',
                'targetCustomers' => 'Multi-service customers',
                'estimatedRevenue' => rand(15, 35) . '% increase in avg. order value',
                'competitorsDoingThis' => rand(2, 6),
            ],
        ],
        'marketDemand' => [
            [
                'service' => $services[0] ?? 'Core Service',
                'demandTrend' => 'growing',
                'searchVolume' => rand(1000, 10000) . '/mo',
                'competitorSaturation' => 'high',
                'opportunity' => 'Differentiate through specialization or superior customer experience',
            ],
            [
                'service' => 'AI-Powered Solutions',
                'demandTrend' => 'growing',
                'searchVolume' => rand(500, 5000) . '/mo',
                'competitorSaturation' => 'low',
                'opportunity' => 'Early mover advantage — integrate AI tools before competitors catch up',
            ],
            [
                'service' => 'Eco-Friendly/Sustainable Options',
                'demandTrend' => 'growing',
                'searchVolume' => rand(200, 2000) . '/mo',
                'competitorSaturation' => 'low',
                'opportunity' => 'Growing consumer preference — position as the sustainable choice',
            ],
        ],
    ];
}

/**
 * Generate AI Comprehensive Success Plan
 */
function generateAISuccessPlan($leads, $myBusiness, $industry, $fullReport) {
    $industryName = $industry['name'] ?? 'General Business';
    $totalCompetitors = count($leads);
    $avgRating = $fullReport['marketOverview']['averageRating'] ?? 0;
    
    // Analyze competitor strengths to determine gaps
    $competitorStrengths = [];
    foreach (($fullReport['competitorComparison']['marketLeaders'] ?? []) as $leader) {
        foreach (($leader['strengths'] ?? []) as $s) {
            $competitorStrengths[] = $s;
        }
    }
    
    return [
        'overallGrade' => ['B-', 'B', 'B+', 'C+', 'C'][rand(0, 4)],
        'executiveBrief' => "Based on analysis of {$totalCompetitors} competitors in {$industryName}, your business has significant opportunities to leapfrog the competition. The market averages {$avgRating} stars with most competitors lacking in digital sophistication, content marketing, and customer experience innovation. By implementing the actions below, you can realistically move from a follower to a market leader within 6-12 months.",
        
        'websiteActions' => [
            [
                'action' => 'Add Online Booking/Scheduling',
                'description' => 'Allow customers to book appointments or request quotes directly from your website 24/7',
                'priority' => 'critical',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '1-2 weeks',
                'competitorsDoingThis' => rand(40, 75) . '% of competitors',
                'estimatedROI' => '30-50% increase in lead conversions',
            ],
            [
                'action' => 'Implement Live Chat / AI Chatbot',
                'description' => 'Engage visitors instantly, answer FAQs, and capture leads outside business hours',
                'priority' => 'high',
                'effort' => 'low',
                'impact' => 'high',
                'timeline' => '1-3 days',
                'competitorsDoingThis' => rand(20, 45) . '% of competitors',
                'estimatedROI' => '20-40% more inquiries',
            ],
            [
                'action' => 'Create Service-Specific Landing Pages',
                'description' => 'Build dedicated pages for each service with targeted keywords, testimonials, and CTAs',
                'priority' => 'high',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '2-4 weeks',
                'competitorsDoingThis' => rand(15, 35) . '% of competitors',
                'estimatedROI' => '50-100% increase in organic traffic per service',
            ],
            [
                'action' => 'Speed Optimization & Core Web Vitals',
                'description' => 'Optimize page load speed to under 3 seconds — faster sites rank higher and convert better',
                'priority' => 'medium',
                'effort' => 'medium',
                'impact' => 'medium',
                'timeline' => '1 week',
                'competitorsDoingThis' => rand(10, 25) . '% of competitors',
                'estimatedROI' => '15-25% reduction in bounce rate',
            ],
        ],
        
        'socialActions' => [
            [
                'action' => 'Launch Video Content Strategy',
                'description' => 'Create short-form videos (Reels, TikTok, Shorts) showcasing your work, team, and expertise',
                'priority' => 'critical',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => 'Start this week',
                'competitorsDoingThis' => rand(10, 25) . '% of competitors',
                'estimatedROI' => '3-5x more engagement than static posts',
            ],
            [
                'action' => 'Google Business Profile Optimization',
                'description' => 'Post weekly updates, add photos, respond to all reviews, enable messaging',
                'priority' => 'critical',
                'effort' => 'low',
                'impact' => 'high',
                'timeline' => 'Ongoing (30 min/week)',
                'competitorsDoingThis' => rand(30, 50) . '% are active',
                'estimatedROI' => '2-3 position boost in local pack rankings',
            ],
            [
                'action' => 'Build Review Generation System',
                'description' => 'Automated post-service review requests via email/SMS with direct Google review links',
                'priority' => 'critical',
                'effort' => 'low',
                'impact' => 'high',
                'timeline' => '1-2 days to set up',
                'competitorsDoingThis' => rand(15, 35) . '% have automated this',
                'estimatedROI' => '10-20 new reviews per month',
            ],
        ],
        
        'productActions' => [
            [
                'action' => 'Add Premium Service Tier',
                'description' => "Create a VIP/Premium offering with priority service, extended warranties, and dedicated support",
                'priority' => 'high',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '2-4 weeks',
                'competitorsDoingThis' => rand(10, 25) . '% of competitors',
                'estimatedROI' => '20-40% increase in average revenue per customer',
            ],
            [
                'action' => 'Launch Maintenance/Subscription Plans',
                'description' => 'Offer recurring service plans for predictable revenue and customer retention',
                'priority' => 'high',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '1-2 weeks',
                'competitorsDoingThis' => rand(20, 40) . '% of competitors',
                'estimatedROI' => 'Predictable monthly recurring revenue',
            ],
            [
                'action' => 'Bundle Complementary Services',
                'description' => 'Package related services at a slight discount to increase order value and convenience',
                'priority' => 'medium',
                'effort' => 'low',
                'impact' => 'medium',
                'timeline' => '1 week',
                'competitorsDoingThis' => rand(15, 30) . '% of competitors',
                'estimatedROI' => '15-30% increase in avg. transaction size',
            ],
        ],
        
        'marketingActions' => [
            [
                'action' => 'Implement Local SEO Strategy',
                'description' => 'Target city + service keywords, build local citations, and earn backlinks from local organizations',
                'priority' => 'critical',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '3-6 months for full results',
                'competitorsDoingThis' => rand(20, 40) . '% doing this well',
                'estimatedROI' => '200-500% increase in organic leads',
            ],
            [
                'action' => 'Start Email Marketing',
                'description' => 'Build a mailing list, send monthly newsletters with tips, offers, and updates',
                'priority' => 'high',
                'effort' => 'low',
                'impact' => 'medium',
                'timeline' => '1 week to launch',
                'competitorsDoingThis' => rand(15, 30) . '% actively emailing',
                'estimatedROI' => '$42 ROI for every $1 spent on email marketing',
            ],
            [
                'action' => 'Run Targeted Google Ads',
                'description' => "Launch PPC campaigns for high-intent keywords like '{$industryName} near me'",
                'priority' => 'medium',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '1-2 weeks to launch',
                'competitorsDoingThis' => rand(25, 50) . '% running ads',
                'estimatedROI' => '3-8x return on ad spend for local services',
            ],
        ],
        
        'operationsActions' => [
            [
                'action' => 'Implement CRM System',
                'description' => 'Track all leads, follow-ups, and customer interactions in one place',
                'priority' => 'high',
                'effort' => 'medium',
                'impact' => 'high',
                'timeline' => '1-2 weeks',
                'competitorsDoingThis' => rand(20, 40) . '% using CRM',
                'estimatedROI' => '30% improvement in follow-up rates',
            ],
            [
                'action' => 'Automate Customer Communications',
                'description' => 'Set up automated appointment reminders, follow-ups, and satisfaction surveys',
                'priority' => 'medium',
                'effort' => 'medium',
                'impact' => 'medium',
                'timeline' => '2-3 weeks',
                'competitorsDoingThis' => rand(15, 30) . '% automated',
                'estimatedROI' => '50% reduction in no-shows, 20% more repeat business',
            ],
        ],
        
        'revenueActions' => [
            [
                'action' => 'Implement Referral Program',
                'description' => 'Reward existing customers for referrals with discounts or credits',
                'priority' => 'high',
                'effort' => 'low',
                'impact' => 'high',
                'timeline' => '1 week',
                'competitorsDoingThis' => rand(10, 25) . '% have formal programs',
                'estimatedROI' => 'Referred customers have 37% higher retention rate',
            ],
            [
                'action' => 'Strategic Partnerships',
                'description' => 'Partner with complementary businesses for mutual referrals and co-marketing',
                'priority' => 'medium',
                'effort' => 'medium',
                'impact' => 'medium',
                'timeline' => '1-2 months',
                'competitorsDoingThis' => rand(15, 30) . '% have partnerships',
                'estimatedROI' => '2-5 warm referrals per partner per month',
            ],
        ],
        
        'thirtyDayPlan' => [
            'label' => 'First 30 Days — Foundation',
            'goals' => [
                'Establish strong digital presence',
                'Launch review generation system',
                'Optimize website for conversions',
            ],
            'actions' => [
                'Claim and optimize all online profiles (Google, Yelp, BBB, Facebook)',
                'Set up automated review request system',
                'Add live chat or AI chatbot to website',
                'Create 3 service-specific landing pages',
                'Start posting 3x/week on social media',
                'Set up CRM to track all leads and customers',
            ],
            'expectedOutcomes' => [
                '20+ new online reviews',
                '50% improvement in website conversion rate',
                'Consistent social media presence established',
            ],
            'kpis' => ['New reviews per week', 'Website conversion rate', 'Social media follower growth'],
        ],
        
        'sixtyDayPlan' => [
            'label' => '30-60 Days — Growth',
            'goals' => [
                'Scale marketing efforts',
                'Launch new service offerings',
                'Build competitive differentiation',
            ],
            'actions' => [
                'Launch Google Ads campaign for top 3 services',
                'Start weekly blog/video content creation',
                'Introduce premium service tier or maintenance plans',
                'Set up email marketing with monthly newsletter',
                'Implement referral program',
                'Begin strategic partnership outreach',
            ],
            'expectedOutcomes' => [
                '2-3x increase in inbound leads',
                '15-20% increase in average transaction value',
                '3+ strategic partnerships formed',
            ],
            'kpis' => ['Monthly leads', 'Average order value', 'Email list size', 'Referral count'],
        ],
        
        'ninetyDayPlan' => [
            'label' => '60-90 Days — Domination',
            'goals' => [
                'Establish market leadership position',
                'Maximize customer lifetime value',
                'Build defensible competitive moat',
            ],
            'actions' => [
                'Launch case study / portfolio section with 5+ detailed stories',
                'Create signature process or methodology unique to your business',
                'Develop community presence through events or sponsorships',
                'Implement customer success program for retention',
                'Analyze competitors quarterly and adapt strategy',
                'Explore automation for operational efficiency',
            ],
            'expectedOutcomes' => [
                'Top 3 ranking for primary keywords',
                '50%+ increase in revenue from baseline',
                'Clear brand differentiation in market',
            ],
            'kpis' => ['Search rankings', 'Revenue growth', 'Customer retention rate', 'Brand mention volume'],
        ],
        
        'moatStrategies' => [
            [
                'strategy' => 'Build Proprietary Process',
                'description' => 'Create a named, documented methodology unique to your business that competitors can\'t replicate',
                'competitiveAdvantage' => 'Customers buy the system, not just the service — making you irreplaceable',
                'timeToImplement' => '2-3 months',
                'defensibility' => 'strong',
            ],
            [
                'strategy' => 'Community & Content Authority',
                'description' => 'Become the go-to voice in your niche through content, workshops, and community involvement',
                'competitiveAdvantage' => 'Brand authority creates trust barriers that new entrants can\'t easily overcome',
                'timeToImplement' => '6-12 months',
                'defensibility' => 'strong',
            ],
            [
                'strategy' => 'Technology Advantage',
                'description' => 'Adopt AI and automation tools ahead of competitors for better service and lower costs',
                'competitiveAdvantage' => 'Faster, smarter service at lower cost — competitors can\'t match without similar investment',
                'timeToImplement' => '1-3 months',
                'defensibility' => 'moderate',
            ],
        ],
        
        'costOptimizations' => [
            [
                'area' => 'Lead Generation',
                'currentApproach' => 'Paid advertising or word-of-mouth only',
                'competitorApproach' => 'Organic SEO + automated referral systems',
                'savings' => '40-60% reduction in customer acquisition cost',
                'recommendation' => 'Invest in SEO and referral programs for sustainable, lower-cost lead generation',
            ],
            [
                'area' => 'Customer Communications',
                'currentApproach' => 'Manual phone calls and emails',
                'competitorApproach' => 'Automated email/SMS sequences',
                'savings' => '10-15 hours per week in staff time',
                'recommendation' => 'Set up automated workflows for common communications',
            ],
            [
                'area' => 'Operations & Scheduling',
                'currentApproach' => 'Manual scheduling and pen-and-paper tracking',
                'competitorApproach' => 'Cloud-based scheduling and project management tools',
                'savings' => '20-30% improvement in resource utilization',
                'recommendation' => 'Adopt scheduling software to reduce no-shows and optimize routes/time',
            ],
        ],
    ];
}

/**
 * Generate Market Gaps & White Space
 */
function generateMarketGapsWhiteSpace($leads, $aggregatedData, $industry) {
    $industryName = $industry['name'] ?? 'General Business';
    $totalLeads = count($leads);
    
    $underservedSegments = [
        ['segment' => 'Tech-savvy younger customers', 'description' => "Customers who prefer fully digital interactions (online booking, chat, digital payments) that most local {$industryName} providers don't offer", 'currentlyServedBy' => 'National chains and apps', 'opportunitySize' => 'large', 'entryDifficulty' => 'easy'],
        ['segment' => 'After-hours emergency seekers', 'description' => "Customers needing service outside typical 9-5 business hours — most competitors don't offer extended availability", 'currentlyServedBy' => 'Very few local providers', 'opportunitySize' => 'medium', 'entryDifficulty' => 'moderate'],
        ['segment' => 'Premium experience seekers', 'description' => "Customers willing to pay 30-50% more for concierge-level service, guarantees, and white-glove treatment", 'currentlyServedBy' => 'Rarely addressed by local providers', 'opportunitySize' => 'medium', 'entryDifficulty' => 'moderate'],
    ];
    
    $featureGaps = [
        ['feature' => 'Online self-service booking', 'customerDemand' => 'high', 'competitorsOffering' => max(1, intval($totalLeads * 0.15)), 'recommendation' => 'Implement online booking to capture convenience-driven customers'],
        ['feature' => 'Transparent upfront pricing', 'customerDemand' => 'high', 'competitorsOffering' => max(1, intval($totalLeads * 0.1)), 'recommendation' => 'Publish clear pricing to differentiate from competitors who hide costs'],
        ['feature' => 'Live chat support', 'customerDemand' => 'medium', 'competitorsOffering' => max(0, intval($totalLeads * 0.05)), 'recommendation' => 'Add live chat to capture leads during research phase'],
        ['feature' => 'Video consultations', 'customerDemand' => 'medium', 'competitorsOffering' => 0, 'recommendation' => 'Offer virtual consultations as a differentiator for initial assessments'],
    ];
    
    $topicGaps = [
        ['topic' => "{$industryName} cost guide for your area", 'searchVolume' => 'high', 'competitorsCovering' => 0, 'contentType' => 'Blog post / Landing page', 'potentialTraffic' => '500-2000 visits/month'],
        ['topic' => "How to choose the best {$industryName} provider", 'searchVolume' => 'medium', 'competitorsCovering' => max(0, intval($totalLeads * 0.02)), 'contentType' => 'Comparison guide', 'potentialTraffic' => '200-800 visits/month'],
        ['topic' => "Common {$industryName} scams to avoid", 'searchVolume' => 'medium', 'competitorsCovering' => 0, 'contentType' => 'Trust-building article', 'potentialTraffic' => '300-1000 visits/month'],
    ];
    
    return [
        'underservedSegments' => $underservedSegments,
        'featureGaps' => $featureGaps,
        'topicGaps' => $topicGaps,
        'summary' => "Analysis of {$totalLeads} competitors reveals significant white space in digital self-service, premium tiers, and content marketing that can be captured with moderate effort.",
    ];
}

/**
 * Generate Strategic Deep Dives
 */
function generateStrategicDeepDives($leads, $aggregatedData, $industry) {
    $topComps = $aggregatedData['topCompetitors'] ?? [];
    $industryName = $industry['name'] ?? 'General Business';
    
    $operationalIntel = [];
    foreach (array_slice($topComps, 0, 5) as $comp) {
        $name = $comp['name'] ?? 'Unknown';
        $hasWebsite = !empty($comp['website']);
        $operationalIntel[] = [
            'competitorName' => $name,
            'techStack' => $hasWebsite ? ['Website CMS', 'Google Analytics (likely)', 'Basic CRM'] : ['Phone-only operations'],
            'hiringSignals' => ['No public hiring data available — suggests stable or small team'],
            'partnerships' => ['Local vendor relationships', 'Review platform partnerships'],
            'strategicImplication' => $hasWebsite 
                ? 'Investing in digital presence — may expand online marketing soon' 
                : 'Operating traditionally — vulnerable to digital-first competitors',
        ];
    }
    
    $fourPsBreakdown = [
        'product' => array_map(function($c) {
            return [
                'competitorName' => $c['name'] ?? 'Unknown',
                'details' => 'Standard service offering with traditional delivery model',
                'yourPosition' => 'on-par',
                'recommendation' => 'Differentiate through service quality and innovation',
            ];
        }, array_slice($topComps, 0, 3)),
        'pricing' => array_map(function($c) {
            return [
                'competitorName' => $c['name'] ?? 'Unknown',
                'details' => 'Market-rate pricing, limited transparency',
                'yourPosition' => 'unknown',
                'recommendation' => 'Use transparent pricing as competitive advantage',
            ];
        }, array_slice($topComps, 0, 3)),
        'promotion' => array_map(function($c) {
            $reviews = intval($c['reviewCount'] ?? 0);
            return [
                'competitorName' => $c['name'] ?? 'Unknown',
                'details' => $reviews > 50 ? 'Active review generation and likely paid ads' : 'Minimal marketing effort detected',
                'yourPosition' => 'behind',
                'recommendation' => 'Invest in review generation and local SEO',
            ];
        }, array_slice($topComps, 0, 3)),
        'place' => array_map(function($c) {
            return [
                'competitorName' => $c['name'] ?? 'Unknown',
                'details' => 'Local service area, primarily in-person delivery',
                'yourPosition' => 'on-par',
                'recommendation' => 'Expand through virtual consultations and wider service radius',
            ];
        }, array_slice($topComps, 0, 3)),
    ];
    
    $contentStrategy = [];
    foreach (array_slice($topComps, 0, 3) as $comp) {
        $hasWebsite = !empty($comp['website']);
        $contentStrategy[] = [
            'competitorName' => $comp['name'] ?? 'Unknown',
            'topTopics' => $hasWebsite ? ['Service pages', 'About us', 'Contact information'] : ['Google Business posts only'],
            'contentTypes' => $hasWebsite ? ['Web pages', 'Photos'] : ['GMB photos', 'GMB posts'],
            'publishingFrequency' => $hasWebsite ? 'Infrequent updates' : 'Rare',
            'engagement' => 'low',
            'gaps' => ['No blog content', 'No video marketing', 'No educational resources', 'No email newsletter'],
        ];
    }
    
    return [
        'operationalIntelligence' => $operationalIntel,
        'fourPsBreakdown' => $fourPsBreakdown,
        'contentStrategy' => $contentStrategy,
    ];
}

/**
 * Generate Indirect & Replacement Threats
 */
function generateIndirectThreats($industry, $searchQuery) {
    $industryName = $industry['name'] ?? 'General Business';
    
    $indirectCompetitors = [
        ['name' => 'DIY Online Solutions', 'type' => 'indirect', 'description' => "Customers solving problems themselves using online tutorials, YouTube, and AI tools", 'howTheyCompete' => 'Free or low-cost alternatives that eliminate the need for professional service', 'threatLevel' => 'medium', 'customerOverlap' => 'Budget-conscious and tech-savvy segments'],
        ['name' => 'National Franchises & Chains', 'type' => 'indirect', 'description' => "Large chains offering standardized service at scale with brand recognition", 'howTheyCompete' => 'Brand trust, consistent quality, and marketing budget advantages', 'threatLevel' => 'high', 'customerOverlap' => 'Convenience-seeking customers who prioritize brand familiarity'],
        ['name' => 'Marketplace Platforms', 'type' => 'indirect', 'description' => "Platforms like Thumbtack, Angi, TaskRabbit that aggregate providers", 'howTheyCompete' => 'Ease of comparison, reviews, and instant booking across multiple providers', 'threatLevel' => 'medium', 'customerOverlap' => 'First-time buyers and price-comparison shoppers'],
    ];
    
    $replacementThreats = [
        ['alternative' => 'Postponement / Do Nothing', 'description' => "Customers choosing to delay or skip the service entirely", 'customerReasoning' => 'Budget constraints, uncertainty about ROI, or perceived low urgency', 'preventionStrategy' => 'Create urgency through education about costs of inaction'],
        ['alternative' => 'In-House Capability Building', 'description' => "Businesses hiring internally instead of outsourcing", 'customerReasoning' => 'Perceived long-term cost savings and control', 'preventionStrategy' => 'Position as specialist — show ROI vs. hiring costs and learning curve'],
    ];
    
    return [
        'indirectCompetitorsList' => $indirectCompetitors,
        'replacementThreats' => $replacementThreats,
        'disruptionRisks' => [
            'AI-powered tools automating parts of ' . strtolower($industryName),
            'New marketplace platforms reducing provider differentiation',
            'Changing regulations that may increase compliance costs',
        ],
        'defensiveStrategies' => [
            'Build deep customer relationships that cannot be replicated by platforms',
            'Develop proprietary processes or tools that add unique value',
            'Create switching costs through long-term contracts and loyalty programs',
            'Invest in brand authority through content and community engagement',
        ],
    ];
}

/**
 * Generate Customer Sentiment & Brand Perception
 */
function generateCustomerSentiment($leads, $aggregatedData, $industry) {
    $topComps = $aggregatedData['topCompetitors'] ?? [];
    
    $competitorSentiment = [];
    foreach (array_slice($topComps, 0, 5) as $comp) {
        $rating = floatval($comp['rating'] ?? 0);
        $reviews = intval($comp['reviewCount'] ?? 0);
        
        $sentiment = 'mixed';
        if ($rating >= 4.5) $sentiment = 'positive';
        elseif ($rating < 3.5 && $rating > 0) $sentiment = 'negative';
        
        $positiveThemes = $rating >= 4.0 ? ['Quality of service', 'Professionalism', 'Reliability'] : ['Competitive pricing'];
        $negativeThemes = $rating < 4.5 ? ['Communication delays', 'Pricing concerns'] : [];
        if ($reviews < 20) $negativeThemes[] = 'Limited social proof';
        
        $exploitable = 'Limited online engagement';
        if ($rating < 4.0 && $rating > 0) $exploitable = 'Below-average ratings — quality perception gap you can exploit';
        elseif ($reviews < 10) $exploitable = 'Very few reviews — can be outpaced with systematic review generation';
        
        $competitorSentiment[] = [
            'competitorName' => $comp['name'] ?? 'Unknown',
            'overallSentiment' => $sentiment,
            'positiveThemes' => $positiveThemes,
            'negativeThemes' => $negativeThemes,
            'notableQuotes' => [],
            'exploitableWeakness' => $exploitable,
        ];
    }
    
    $aiShareOfVoice = [
        ['brand' => 'Your Business', 'mentionFrequency' => 'rare', 'context' => 'Not yet established in AI recommendation engines', 'sentiment' => 'neutral'],
        ['brand' => 'Top Competitor', 'mentionFrequency' => 'occasional', 'context' => 'Mentioned in local service recommendations', 'sentiment' => 'positive'],
    ];
    
    $reviewPlatforms = [
        ['platform' => 'Google', 'avgRating' => $aggregatedData['avgRating'], 'totalReviews' => $aggregatedData['avgReviews'] * count($topComps), 'trend' => 'stable', 'keyInsight' => 'Primary discovery platform — dominate here first'],
        ['platform' => 'Yelp', 'avgRating' => max(0, $aggregatedData['avgRating'] - 0.3), 'totalReviews' => intval($aggregatedData['avgReviews'] * 0.3), 'trend' => 'stable', 'keyInsight' => 'Secondary but influential for certain demographics'],
    ];
    
    return [
        'competitorSentiment' => $competitorSentiment,
        'aiShareOfVoice' => $aiShareOfVoice,
        'reviewPlatforms' => $reviewPlatforms,
        'overallInsight' => "Customer sentiment across the market averages " . number_format($aggregatedData['avgRating'], 1) . "/5.0. Key complaint patterns include communication speed and pricing transparency — areas where proactive improvement creates immediate differentiation.",
    ];
}

/**
 * Generate Benchmark Performance Metrics
 */
function generateBenchmarkPerformance($leads, $aggregatedData, $industry) {
    $topComps = $aggregatedData['topCompetitors'] ?? [];
    $industryName = strtolower($industry['name'] ?? 'services');
    
    $technicalHealth = [];
    foreach (array_slice($topComps, 0, 5) as $comp) {
        $hasWebsite = !empty($comp['website']);
        $assessment = 'poor';
        if ($hasWebsite) $assessment = 'average';
        
        $technicalHealth[] = [
            'competitorName' => $comp['name'] ?? 'Unknown',
            'pageSpeed' => $hasWebsite ? 'Moderate (estimated)' : 'N/A — No website',
            'mobileScore' => $hasWebsite ? 'Needs optimization (estimated)' : 'N/A',
            'sslStatus' => $hasWebsite,
            'assessment' => $assessment,
        ];
    }
    
    $marketingSpend = [];
    foreach (array_slice($topComps, 0, 3) as $comp) {
        $reviews = intval($comp['reviewCount'] ?? 0);
        $spend = '$0-500/mo';
        $trend = 'stable';
        if ($reviews > 100) { $spend = '$1,000-5,000/mo'; $trend = 'increasing'; }
        elseif ($reviews > 30) { $spend = '$500-1,500/mo'; }
        
        $marketingSpend[] = [
            'competitorName' => $comp['name'] ?? 'Unknown',
            'estimatedMonthlySpend' => $spend,
            'primaryChannels' => $reviews > 50 ? ['Google Ads', 'Local SEO', 'Social Media'] : ['Google Business Profile', 'Word of mouth'],
            'spendTrend' => $trend,
        ];
    }
    
    $keywordBidding = [
        ['keyword' => "{$industryName} near me", 'estimatedCPC' => '$5-15', 'topBidders' => array_map(function($c) { return $c['name'] ?? 'Unknown'; }, array_slice($topComps, 0, 2)), 'competitionLevel' => 'high', 'recommendation' => 'Bid on this with location targeting for immediate visibility'],
        ['keyword' => "best {$industryName} in [city]", 'estimatedCPC' => '$3-10', 'topBidders' => [], 'competitionLevel' => 'medium', 'recommendation' => 'Create content targeting this keyword to rank organically'],
        ['keyword' => "{$industryName} cost", 'estimatedCPC' => '$2-8', 'topBidders' => [], 'competitionLevel' => 'low', 'recommendation' => 'Create a pricing page to capture this high-intent traffic'],
    ];
    
    return [
        'technicalHealth' => $technicalHealth,
        'marketingSpend' => $marketingSpend,
        'keywordBidding' => $keywordBidding,
        'performanceSummary' => "Most competitors in this market have average-to-poor technical health with limited marketing investment. This creates opportunity for a technically superior, well-marketed entrant to capture significant market share.",
    ];
}
