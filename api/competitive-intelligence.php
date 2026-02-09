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
