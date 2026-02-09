<?php
/**
 * Niche Intelligence API Endpoint
 * Generates comprehensive niche-level market analysis
 * Includes: Trend Analysis, Market Dynamics, Standard Products/Services
 * Uses search context + aggregated lead data for insights
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

if (empty($searchQuery)) {
    sendError('Search query is required');
}

try {
    // Detect industry from search query
    $industry = detectNicheIndustry($searchQuery);
    
    // Generate comprehensive niche intelligence
    $nicheIntelligence = generateNicheIntelligence($searchQuery, $searchLocation, $leads, $industry);
    
    sendJson([
        'success' => true,
        'data' => $nicheIntelligence,
        'generatedAt' => date('c'),
    ]);
} catch (Exception $e) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        sendError($e->getMessage(), 500);
    } else {
        sendError('An error occurred during niche analysis', 500);
    }
}

/**
 * Generate comprehensive niche intelligence
 */
function generateNicheIntelligence($searchQuery, $searchLocation, $leads, $industry) {
    $leadsCount = count($leads);
    
    // Aggregate lead data for market insights
    $aggregatedData = aggregateLeadData($leads);
    
    // Compute digital maturity metrics (AGGREGATION ENGINE)
    $digitalMaturity = computeDigitalMaturity($leads, $aggregatedData);
    
    // Generate market patterns from aggregated data
    $marketPatterns = generateMarketPatterns($aggregatedData, $digitalMaturity, $industry);
    
    return [
        'nicheId' => 'niche_' . uniqid(),
        'searchQuery' => $searchQuery,
        'searchLocation' => $searchLocation,
        'analyzedAt' => date('c'),
        
        // Niche Identification
        'nicheIdentification' => [
            'primaryIndustry' => $industry['name'],
            'industryCode' => $industry['naics'] ?? '',
            'subCategory' => $industry['subcategory'] ?? null,
            'alternateNames' => $industry['alternateNames'] ?? [],
            'relatedNiches' => $industry['relatedNiches'] ?? [],
            'targetMarket' => $industry['targetMarket'] ?? 'B2C',
            'geographicScope' => 'local',
        ],
        
        // MARKET OVERVIEW (aggregated - shown FIRST in UI)
        'marketOverview' => [
            'totalBusinessesFound' => $leadsCount,
            'digitalMaturityScore' => $digitalMaturity['overallScore'],
            'percentWithWebsite' => $digitalMaturity['percentWithWebsite'],
            'percentOutdatedWebsite' => $digitalMaturity['percentOutdated'],
            'percentNoWebsite' => $digitalMaturity['percentNoWebsite'],
            'percentWithEmail' => $aggregatedData['totalLeads'] > 0 ? round(($aggregatedData['withEmail'] / $aggregatedData['totalLeads']) * 100) : 0,
            'percentWithPhone' => $aggregatedData['totalLeads'] > 0 ? round(($aggregatedData['withPhone'] / $aggregatedData['totalLeads']) * 100) : 0,
            'avgRating' => $aggregatedData['avgRating'],
            'avgReviewCount' => $aggregatedData['avgReviews'],
            'topCMSPlatforms' => $digitalMaturity['topCMS'],
            'websiteQualityScore' => $digitalMaturity['avgWebsiteQuality'],
            'ratingDistribution' => $aggregatedData['ratingDistribution'],
        ],
        
        // MARKET PATTERNS (derived insights)
        'marketPatterns' => $marketPatterns,
        
        // Trend Analysis
        'trendAnalysis' => generateTrendAnalysis($industry, $searchLocation),
        
        // Market Analysis
        'marketAnalysis' => generateMarketAnalysis($industry, $aggregatedData, $searchLocation),
        
        // Products and Services
        'productsAndServices' => generateProductsAndServices($industry),
        
        // Competitive Landscape
        'competitiveLandscape' => generateCompetitiveLandscape($aggregatedData, $leadsCount),
        
        // AI Insights
        'aiNicheInsights' => generateAINicheInsights($industry, $aggregatedData),
        
        // Business Sample with Intelligence Tags (NOT leads)
        'businessSample' => computeBusinessSample($leads, $digitalMaturity),
    ];
}

/**
 * Compute business sample entries with intelligence tags
 * Classifies each lead as Digitally Strong, Digitally Weak, Traditional, or Growth-oriented
 * Returns up to 100 representative businesses for display
 */
function computeBusinessSample($leads, $digitalMaturity) {
    $sample = [];
    $total = count($leads);
    if ($total === 0) return $sample;
    
    // Cap at 100 representative businesses
    $sampleLeads = $total > 100 ? array_slice($leads, 0, 100) : $leads;
    
    foreach ($sampleLeads as $lead) {
        $score = 50; // baseline
        $tags = [];
        
        $hasWebsite = !empty($lead['url']) || !empty($lead['website']);
        $wa = $lead['websiteAnalysis'] ?? null;
        $enrichment = $lead['enrichment'] ?? null;
        $rating = floatval($lead['rating'] ?? 0);
        $reviews = intval($lead['reviews'] ?? $lead['reviewCount'] ?? 0);
        $platform = $wa['platform'] ?? null;
        
        // Score components
        if ($hasWebsite) $score += 15;
        if ($wa && empty($wa['needsUpgrade'])) $score += 15;
        if ($wa && !empty($wa['needsUpgrade'])) $score -= 10;
        if ($enrichment && !empty($enrichment['socials']) && count($enrichment['socials']) > 0) $score += 10;
        if (!empty($lead['email'])) $score += 5;
        if ($reviews > 50) $score += 10;
        elseif ($reviews > 20) $score += 5;
        if ($rating >= 4.5) $score += 5;
        
        $score = max(0, min(100, $score));
        
        // Assign intelligence tags based on score and signals
        if ($score >= 75) {
            $tags[] = 'Digitally Strong';
        } elseif ($score < 40) {
            $tags[] = 'Digitally Weak';
        }
        
        // Traditional: no website OR uses outdated platform, low social
        if (!$hasWebsite || ($wa && !empty($wa['needsUpgrade']) && $score < 50)) {
            $tags[] = 'Traditional';
        }
        
        // Growth-oriented: has website + high reviews + moderate-to-good digital
        if ($hasWebsite && $reviews > 30 && $score >= 50 && $score < 85) {
            $tags[] = 'Growth-oriented';
        }
        
        // Ensure at least one tag
        if (empty($tags)) {
            $tags[] = $score >= 50 ? 'Growth-oriented' : 'Traditional';
        }
        
        $sample[] = [
            'name' => $lead['name'] ?? $lead['title'] ?? 'Unknown Business',
            'website' => $lead['url'] ?? $lead['website'] ?? null,
            'rating' => $rating > 0 ? $rating : null,
            'reviewCount' => $reviews > 0 ? $reviews : null,
            'platform' => $platform,
            'tags' => $tags,
            'digitalMaturityScore' => $score,
        ];
    }
    
    // Sort: Digitally Strong first, then Growth-oriented, Traditional, Digitally Weak
    usort($sample, function($a, $b) {
        return $b['digitalMaturityScore'] - $a['digitalMaturityScore'];
    });
    
    return $sample;
}

/**
 * Compute digital maturity metrics from lead data
 * This is the AGGREGATION ENGINE that makes niche research valuable
 */
function computeDigitalMaturity($leads, $aggregatedData) {
    $total = count($leads);
    if ($total === 0) {
        return [
            'overallScore' => 0,
            'percentWithWebsite' => 0,
            'percentOutdated' => 0,
            'percentNoWebsite' => 0,
            'topCMS' => [],
            'avgWebsiteQuality' => 0,
            'platformBreakdown' => [],
        ];
    }
    
    $withWebsite = 0;
    $noWebsite = 0;
    $outdated = 0;
    $cmsCounts = [];
    $qualityScores = [];
    $withAds = 0;
    $withSocial = 0;
    
    foreach ($leads as $lead) {
        $hasUrl = !empty($lead['url']) || !empty($lead['website']);
        if ($hasUrl) {
            $withWebsite++;
        } else {
            $noWebsite++;
        }
        
        // Check website analysis if available
        $wa = $lead['websiteAnalysis'] ?? null;
        if ($wa) {
            if (!empty($wa['needsUpgrade'])) {
                $outdated++;
            }
            if (!empty($wa['platform'])) {
                $platform = strtolower($wa['platform']);
                $cmsCounts[$platform] = ($cmsCounts[$platform] ?? 0) + 1;
            }
            // Approximate quality score
            $score = 50; // baseline
            if (!empty($wa['hasWebsite'])) $score += 20;
            if (empty($wa['needsUpgrade'])) $score += 15;
            if (empty($wa['issues']) || count($wa['issues']) === 0) $score += 15;
            $qualityScores[] = min(100, $score);
        }
        
        // Check enrichment data
        $enrichment = $lead['enrichment'] ?? null;
        if ($enrichment) {
            if (!empty($enrichment['socials']) && count($enrichment['socials']) > 0) {
                $withSocial++;
            }
        }
    }
    
    // Sort CMS by count
    arsort($cmsCounts);
    $topCMS = [];
    foreach (array_slice($cmsCounts, 0, 5, true) as $platform => $count) {
        $topCMS[] = [
            'platform' => ucfirst($platform),
            'count' => $count,
            'percentage' => round(($count / $total) * 100),
        ];
    }
    
    // Calculate overall digital maturity score (0-100)
    $websiteRate = $total > 0 ? ($withWebsite / $total) : 0;
    $modernRate = $withWebsite > 0 ? (($withWebsite - $outdated) / $withWebsite) : 0;
    $avgQuality = !empty($qualityScores) ? array_sum($qualityScores) / count($qualityScores) : 50;
    
    $overallScore = round(
        ($websiteRate * 30) +  // 30% weight: having a website
        ($modernRate * 25) +   // 25% weight: modern website  
        (($avgQuality / 100) * 25) + // 25% weight: quality score
        (min(1, $aggregatedData['avgRating'] / 5) * 20) // 20% weight: review presence
    );
    
    return [
        'overallScore' => min(100, max(0, $overallScore)),
        'percentWithWebsite' => $total > 0 ? round(($withWebsite / $total) * 100) : 0,
        'percentOutdated' => $total > 0 ? round(($outdated / $total) * 100) : 0,
        'percentNoWebsite' => $total > 0 ? round(($noWebsite / $total) * 100) : 0,
        'topCMS' => $topCMS,
        'avgWebsiteQuality' => round($avgQuality),
        'platformBreakdown' => $cmsCounts,
        'withSocialMedia' => $total > 0 ? round(($withSocial / $total) * 100) : 0,
    ];
}

/**
 * Generate market pattern insights from aggregated data
 * These are the "62% of mechanics in Houston lack a modern website" type insights
 */
function generateMarketPatterns($aggregatedData, $digitalMaturity, $industry) {
    $patterns = [];
    $total = $aggregatedData['totalLeads'];
    $industryName = strtolower($industry['name'] ?? 'businesses');
    
    if ($total === 0) {
        return $patterns;
    }
    
    // Website presence pattern
    $noWebPct = $digitalMaturity['percentNoWebsite'];
    if ($noWebPct > 10) {
        $patterns[] = [
            'insight' => "{$noWebPct}% of {$industryName} in this area have no website",
            'category' => 'digital_gap',
            'impact' => $noWebPct > 30 ? 'critical' : ($noWebPct > 15 ? 'high' : 'medium'),
            'opportunity' => 'Large addressable market for web design and digital presence services',
        ];
    }
    
    // Outdated website pattern
    $outdatedPct = $digitalMaturity['percentOutdated'];
    if ($outdatedPct > 15) {
        $patterns[] = [
            'insight' => "{$outdatedPct}% are using outdated or template-based websites",
            'category' => 'modernization',
            'impact' => $outdatedPct > 40 ? 'critical' : 'high',
            'opportunity' => 'Website redesign and modernization services in high demand',
        ];
    }
    
    // Social media adoption
    $socialPct = $digitalMaturity['withSocialMedia'];
    if ($socialPct < 50) {
        $patterns[] = [
            'insight' => "Only {$socialPct}% have active social media profiles",
            'category' => 'social_gap',
            'impact' => 'medium',
            'opportunity' => 'Social media management and content creation opportunities',
        ];
    }
    
    // Review landscape
    $avgRating = $aggregatedData['avgRating'];
    $avgReviews = $aggregatedData['avgReviews'];
    if ($avgReviews < 20) {
        $patterns[] = [
            'insight' => "Average review count is only {$avgReviews} — most competitors underinvest in reputation",
            'category' => 'reputation',
            'impact' => 'high',
            'opportunity' => 'Review generation and reputation management services',
        ];
    }
    if ($avgRating > 0 && $avgRating < 4.0) {
        $patterns[] = [
            'insight' => "Average rating is {$avgRating}/5.0 — quality gaps exist across the market",
            'category' => 'quality',
            'impact' => 'medium',
            'opportunity' => 'Service quality differentiation opportunity',
        ];
    }
    
    // CMS concentration
    if (!empty($digitalMaturity['topCMS'])) {
        $topPlatform = $digitalMaturity['topCMS'][0];
        if ($topPlatform['percentage'] > 25) {
            $patterns[] = [
                'insight' => "{$topPlatform['percentage']}% use {$topPlatform['platform']} — dominant platform in this niche",
                'category' => 'technology',
                'impact' => 'low',
                'opportunity' => "Specialization in {$topPlatform['platform']} migration or optimization",
            ];
        }
    }
    
    // Digital maturity score insight
    $maturityScore = $digitalMaturity['overallScore'];
    if ($maturityScore < 40) {
        $patterns[] = [
            'insight' => "Digital maturity score is {$maturityScore}/100 — this niche is digitally underserved",
            'category' => 'maturity',
            'impact' => 'critical',
            'opportunity' => 'Massive opportunity for digital transformation services',
        ];
    } elseif ($maturityScore < 60) {
        $patterns[] = [
            'insight' => "Digital maturity score is {$maturityScore}/100 — moderate adoption with room for growth",
            'category' => 'maturity',
            'impact' => 'medium',
            'opportunity' => 'Targeted digital upgrades and optimization services',
        ];
    }
    
    // Email availability
    $emailPct = $aggregatedData['totalLeads'] > 0 ? round(($aggregatedData['withEmail'] / $aggregatedData['totalLeads']) * 100) : 0;
    if ($emailPct < 30) {
        $patterns[] = [
            'insight' => "Only {$emailPct}% have publicly accessible email addresses",
            'category' => 'accessibility',
            'impact' => 'medium',
            'opportunity' => 'Many businesses in this niche are hard to reach digitally',
        ];
    }
    
    return $patterns;
}

/**
 * Detect industry from search query
 */
function detectNicheIndustry($query) {
    $queryLower = strtolower($query);
    
    // Industry database with comprehensive data
    $industries = [
        // Dental
        [
            'keywords' => ['dentist', 'dental', 'orthodontist', 'oral surgeon'],
            'name' => 'Dental Services',
            'naics' => '621210',
            'subcategory' => 'Healthcare',
            'targetMarket' => 'B2C',
            'alternateNames' => ['Dentistry', 'Dental Clinics', 'Oral Care'],
            'relatedNiches' => ['Orthodontics', 'Cosmetic Dentistry', 'Oral Surgery', 'Pediatric Dentistry'],
            'coreServices' => ['Cleanings & Exams', 'Fillings', 'Root Canals', 'Extractions', 'Crowns & Bridges', 'Teeth Whitening'],
            'additionalServices' => ['Invisalign', 'Veneers', 'Dental Implants', 'Emergency Care', 'Pediatric Services'],
            'emergingServices' => ['Teledentistry', 'Same-Day Crowns', 'Laser Dentistry', 'Sleep Apnea Treatment'],
            'priceRanges' => ['Cleaning: $75-200', 'Filling: $150-400', 'Crown: $800-1500', 'Implant: $3000-5000'],
            'trends' => ['Rise of cosmetic procedures', 'Teledentistry adoption', 'Focus on patient experience', 'Digital imaging technology'],
            'challenges' => ['High equipment costs', 'Insurance reimbursement', 'Staff retention', 'Patient no-shows'],
            'seasonality' => ['Peak: Back-to-school (Aug-Sep)', 'High: Year-end insurance use (Nov-Dec)', 'Low: Summer months'],
        ],
        // Plumbing
        [
            'keywords' => ['plumber', 'plumbing'],
            'name' => 'Plumbing Services',
            'naics' => '238220',
            'subcategory' => 'Home Services',
            'targetMarket' => 'Both',
            'alternateNames' => ['Plumbers', 'Plumbing Contractors', 'Pipe Specialists'],
            'relatedNiches' => ['HVAC', 'Water Heater Services', 'Drain Cleaning', 'Septic Services'],
            'coreServices' => ['Drain Cleaning', 'Pipe Repair', 'Water Heater Installation', 'Leak Detection', 'Toilet Repair', 'Faucet Installation'],
            'additionalServices' => ['Sewer Line Repair', 'Gas Line Services', 'Water Softeners', 'Bathroom Remodeling'],
            'emergingServices' => ['Smart Plumbing Systems', 'Tankless Water Heaters', 'Trenchless Sewer Repair', 'Water Filtration'],
            'priceRanges' => ['Service Call: $75-150', 'Drain Cleaning: $150-300', 'Water Heater: $1000-3000', 'Pipe Repair: $200-500'],
            'trends' => ['Eco-friendly fixtures', 'Smart home integration', 'Tankless water heaters', 'Emergency service focus'],
            'challenges' => ['Skilled labor shortage', 'After-hours demand', 'Parts inventory', 'Competition from DIY'],
            'seasonality' => ['Peak: Winter (frozen pipes)', 'High: Spring (renovations)', 'Steady: Year-round emergencies'],
        ],
        // HVAC
        [
            'keywords' => ['hvac', 'air conditioning', 'heating', 'ac repair', 'furnace'],
            'name' => 'HVAC Services',
            'naics' => '238220',
            'subcategory' => 'Home Services',
            'targetMarket' => 'Both',
            'alternateNames' => ['Heating & Cooling', 'AC Services', 'Climate Control'],
            'relatedNiches' => ['Plumbing', 'Electrical', 'Home Automation', 'Indoor Air Quality'],
            'coreServices' => ['AC Repair', 'Heating Repair', 'System Installation', 'Maintenance Plans', 'Duct Cleaning', 'Thermostat Installation'],
            'additionalServices' => ['Air Quality Testing', 'Ductwork Installation', 'Zoning Systems', 'Commercial HVAC'],
            'emergingServices' => ['Smart Thermostats', 'Heat Pumps', 'UV Air Purification', 'Energy Audits'],
            'priceRanges' => ['Service Call: $75-150', 'AC Repair: $200-1000', 'New System: $5000-15000', 'Maintenance: $150-300/yr'],
            'trends' => ['Energy efficiency', 'Smart home controls', 'Indoor air quality focus', 'Heat pump adoption'],
            'challenges' => ['Seasonal demand spikes', 'Technician shortage', 'Equipment costs', 'Financing needs'],
            'seasonality' => ['Peak: Summer (AC) & Winter (Heating)', 'Low: Spring & Fall'],
        ],
        // Auto Repair
        [
            'keywords' => ['mechanic', 'auto repair', 'car repair', 'automotive', 'auto shop'],
            'name' => 'Auto Repair & Maintenance',
            'naics' => '811111',
            'subcategory' => 'Automotive Services',
            'targetMarket' => 'B2C',
            'alternateNames' => ['Auto Mechanics', 'Car Repair Shops', 'Automotive Service'],
            'relatedNiches' => ['Tire Services', 'Auto Body', 'Oil Change', 'Transmission Repair'],
            'coreServices' => ['Oil Changes', 'Brake Service', 'Engine Diagnostics', 'Tire Rotation', 'Tune-Ups', 'Battery Replacement'],
            'additionalServices' => ['Transmission Repair', 'AC Service', 'Exhaust Work', 'Electrical Diagnosis'],
            'emergingServices' => ['EV Maintenance', 'Hybrid Repair', 'ADAS Calibration', 'Mobile Diagnostics'],
            'priceRanges' => ['Oil Change: $40-80', 'Brake Service: $200-500', 'Engine Repair: $500-3000', 'Diagnostics: $75-150'],
            'trends' => ['Electric vehicle servicing', 'Advanced diagnostics', 'Preventive maintenance focus', 'Mobile services'],
            'challenges' => ['EV transition', 'Equipment investment', 'Finding skilled techs', 'Dealership competition'],
            'seasonality' => ['Peak: Pre-summer road trips', 'High: Pre-winter prep', 'Steady: Year-round'],
        ],
        // Restaurants
        [
            'keywords' => ['restaurant', 'food', 'dining', 'cafe', 'eatery', 'bistro'],
            'name' => 'Restaurant & Food Service',
            'naics' => '722511',
            'subcategory' => 'Food & Beverage',
            'targetMarket' => 'B2C',
            'alternateNames' => ['Dining Establishments', 'Eateries', 'Food Service'],
            'relatedNiches' => ['Catering', 'Food Trucks', 'Bakeries', 'Coffee Shops'],
            'coreServices' => ['Dine-In Service', 'Takeout', 'Delivery', 'Catering', 'Private Events', 'Online Ordering'],
            'additionalServices' => ['Meal Kits', 'Gift Cards', 'Loyalty Programs', 'Party Hosting'],
            'emergingServices' => ['Ghost Kitchens', 'Subscription Meals', 'QR Code Menus', 'AI Ordering Systems'],
            'priceRanges' => ['Fast Casual: $10-20', 'Casual Dining: $15-40', 'Fine Dining: $50-150+', 'Delivery Fees: $3-8'],
            'trends' => ['Online ordering growth', 'Ghost kitchens', 'Sustainable sourcing', 'Health-conscious menus'],
            'challenges' => ['Labor costs', 'Food costs', 'Delivery app fees', 'Customer retention'],
            'seasonality' => ['Peak: Holidays & Weekends', 'High: Summer dining', 'Variable: Weather dependent'],
        ],
        // Legal
        [
            'keywords' => ['lawyer', 'attorney', 'legal', 'law firm', 'law office'],
            'name' => 'Legal Services',
            'naics' => '541110',
            'subcategory' => 'Professional Services',
            'targetMarket' => 'Both',
            'alternateNames' => ['Law Firms', 'Attorneys', 'Legal Counsel'],
            'relatedNiches' => ['Family Law', 'Personal Injury', 'Criminal Defense', 'Business Law'],
            'coreServices' => ['Consultations', 'Contract Review', 'Litigation', 'Estate Planning', 'Business Formation', 'Real Estate Closings'],
            'additionalServices' => ['Mediation', 'Document Preparation', 'Notary Services', 'Legal Research'],
            'emergingServices' => ['Virtual Consultations', 'AI Document Review', 'Subscription Legal Services', 'Online Legal Tools'],
            'priceRanges' => ['Consultation: $0-300', 'Hourly Rate: $150-500+', 'Flat Fee (Simple): $500-2000', 'Retainer: $2000-10000+'],
            'trends' => ['Virtual consultations', 'Alternative fee arrangements', 'Legal tech adoption', 'Niche specialization'],
            'challenges' => ['Client acquisition', 'Billable hour pressure', 'Technology adoption', 'Commoditization'],
            'seasonality' => ['Steady: Year-round demand', 'Peak: Tax season (Jan-Apr)', 'High: Year-end planning'],
        ],
        // Real Estate
        [
            'keywords' => ['realtor', 'real estate', 'realty', 'property', 'home sale'],
            'name' => 'Real Estate Services',
            'naics' => '531210',
            'subcategory' => 'Real Estate',
            'targetMarket' => 'B2C',
            'alternateNames' => ['Realtors', 'Property Agents', 'Real Estate Brokers'],
            'relatedNiches' => ['Property Management', 'Commercial Real Estate', 'Mortgage Services', 'Home Staging'],
            'coreServices' => ['Buyer Representation', 'Seller Representation', 'Market Analysis', 'Home Valuations', 'Negotiations', 'Contract Management'],
            'additionalServices' => ['Relocation Services', 'Investment Properties', 'First-Time Buyer Programs', 'Luxury Home Sales'],
            'emergingServices' => ['Virtual Tours', '3D Home Staging', 'AI-Powered Valuations', 'iBuyer Coordination'],
            'priceRanges' => ['Commission: 5-6% of sale', 'Buyer Agent: 2.5-3%', 'Listing Fee (Flat): $3000-5000'],
            'trends' => ['Virtual showings', 'iBuyer competition', 'Social media marketing', 'Data-driven pricing'],
            'challenges' => ['Inventory shortages', 'Commission compression', 'Market volatility', 'Lead generation costs'],
            'seasonality' => ['Peak: Spring & Summer', 'Low: Winter holidays', 'Variable: Interest rate dependent'],
        ],
        // Medical/Healthcare
        [
            'keywords' => ['doctor', 'physician', 'medical', 'clinic', 'healthcare', 'health care'],
            'name' => 'Medical & Healthcare Services',
            'naics' => '621111',
            'subcategory' => 'Healthcare',
            'targetMarket' => 'B2C',
            'alternateNames' => ['Medical Practices', 'Healthcare Providers', 'Physicians'],
            'relatedNiches' => ['Specialty Care', 'Urgent Care', 'Telemedicine', 'Wellness Centers'],
            'coreServices' => ['Primary Care', 'Preventive Care', 'Chronic Disease Management', 'Annual Physicals', 'Vaccinations', 'Lab Work'],
            'additionalServices' => ['Specialty Referrals', 'Wellness Programs', 'Weight Management', 'Mental Health Screening'],
            'emergingServices' => ['Telehealth', 'Remote Patient Monitoring', 'Concierge Medicine', 'Genetic Testing'],
            'priceRanges' => ['Office Visit: $100-300', 'Physical: $150-500', 'Telehealth: $50-100', 'Specialist: $200-500'],
            'trends' => ['Telehealth adoption', 'Value-based care', 'Patient engagement', 'Preventive focus'],
            'challenges' => ['Insurance complexity', 'Staff burnout', 'Technology costs', 'Patient retention'],
            'seasonality' => ['Peak: Flu season (Oct-Mar)', 'High: Back-to-school', 'Steady: Year-round'],
        ],
        // Roofing
        [
            'keywords' => ['roofing', 'roofer', 'roof repair', 'roof replacement'],
            'name' => 'Roofing Services',
            'naics' => '238160',
            'subcategory' => 'Home Services',
            'targetMarket' => 'Both',
            'alternateNames' => ['Roof Contractors', 'Roofing Companies', 'Roof Specialists'],
            'relatedNiches' => ['Siding', 'Gutters', 'Storm Damage Repair', 'Insulation'],
            'coreServices' => ['Roof Inspections', 'Leak Repair', 'Shingle Replacement', 'Full Roof Replacement', 'Gutter Installation', 'Storm Damage Assessment'],
            'additionalServices' => ['Skylight Installation', 'Attic Ventilation', 'Ice Dam Removal', 'Commercial Roofing'],
            'emergingServices' => ['Solar Roofing', 'Cool Roofs', 'Drone Inspections', 'Metal Roofing'],
            'priceRanges' => ['Inspection: $100-300', 'Repair: $300-1000', 'Replacement: $5000-15000+', 'Emergency: Premium rates'],
            'trends' => ['Solar integration', 'Energy-efficient materials', 'Storm chasing regulation', 'Drone technology'],
            'challenges' => ['Weather dependency', 'Insurance claims', 'Seasonal labor', 'Material costs'],
            'seasonality' => ['Peak: Late Spring-Fall', 'High: Post-storm periods', 'Low: Winter (cold climates)'],
        ],
        // Landscaping
        [
            'keywords' => ['landscaping', 'landscaper', 'lawn care', 'lawn service', 'garden'],
            'name' => 'Landscaping & Lawn Care',
            'naics' => '561730',
            'subcategory' => 'Home Services',
            'targetMarket' => 'Both',
            'alternateNames' => ['Lawn Services', 'Grounds Maintenance', 'Garden Design'],
            'relatedNiches' => ['Hardscaping', 'Irrigation', 'Tree Service', 'Snow Removal'],
            'coreServices' => ['Lawn Mowing', 'Fertilization', 'Weed Control', 'Mulching', 'Pruning', 'Seasonal Cleanup'],
            'additionalServices' => ['Landscape Design', 'Patio Installation', 'Irrigation Systems', 'Outdoor Lighting'],
            'emergingServices' => ['Smart Irrigation', 'Native Planting', 'Organic Lawn Care', 'Xeriscaping'],
            'priceRanges' => ['Weekly Mowing: $30-75', 'Seasonal Package: $200-500', 'Landscape Design: $1000-5000+', 'Hardscape: $3000-20000+'],
            'trends' => ['Sustainable landscaping', 'Smart irrigation', 'Outdoor living spaces', 'Native plants'],
            'challenges' => ['Seasonal nature', 'Labor availability', 'Equipment costs', 'Weather dependency'],
            'seasonality' => ['Peak: Spring-Fall', 'Winter: Snow removal (cold)', 'Off-season: Planning/design'],
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
        'name' => 'General Business Services',
        'naics' => '',
        'subcategory' => 'General',
        'targetMarket' => 'B2C',
        'alternateNames' => [],
        'relatedNiches' => [],
        'coreServices' => ['Consultation', 'Service Delivery', 'Customer Support'],
        'additionalServices' => [],
        'emergingServices' => ['Digital Services', 'Online Booking', 'Virtual Consultations'],
        'priceRanges' => ['Varies by service'],
        'trends' => ['Digital transformation', 'Customer experience focus', 'Online presence importance'],
        'challenges' => ['Competition', 'Customer acquisition', 'Pricing pressure'],
        'seasonality' => ['Varies by business type'],
    ];
}

/**
 * Aggregate lead data for market insights
 */
function aggregateLeadData($leads) {
    $totalLeads = count($leads);
    
    if ($totalLeads === 0) {
        return [
            'totalLeads' => 0,
            'avgRating' => 0,
            'avgReviews' => 0,
            'withWebsite' => 0,
            'withPhone' => 0,
            'withEmail' => 0,
            'topRated' => [],
            'ratingDistribution' => [],
        ];
    }
    
    $ratings = [];
    $reviews = [];
    $withWebsite = 0;
    $withPhone = 0;
    $withEmail = 0;
    
    foreach ($leads as $lead) {
        if (!empty($lead['rating'])) {
            $ratings[] = floatval($lead['rating']);
        }
        if (!empty($lead['reviews']) || !empty($lead['reviewCount'])) {
            $reviews[] = intval($lead['reviews'] ?? $lead['reviewCount'] ?? 0);
        }
        if (!empty($lead['website']) || !empty($lead['url'])) {
            $withWebsite++;
        }
        if (!empty($lead['phone'])) {
            $withPhone++;
        }
        if (!empty($lead['email'])) {
            $withEmail++;
        }
    }
    
    // Get top rated leads
    $sortedLeads = $leads;
    usort($sortedLeads, function($a, $b) {
        $ratingA = floatval($a['rating'] ?? 0);
        $ratingB = floatval($b['rating'] ?? 0);
        return $ratingB <=> $ratingA;
    });
    
    $topRated = array_slice($sortedLeads, 0, 5);
    
    // Rating distribution
    $ratingDist = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    foreach ($ratings as $r) {
        $bucket = max(1, min(5, round($r)));
        $ratingDist[$bucket]++;
    }
    
    return [
        'totalLeads' => $totalLeads,
        'avgRating' => !empty($ratings) ? round(array_sum($ratings) / count($ratings), 1) : 0,
        'avgReviews' => !empty($reviews) ? round(array_sum($reviews) / count($reviews)) : 0,
        'withWebsite' => $withWebsite,
        'withPhone' => $withPhone,
        'withEmail' => $withEmail,
        'websiteRate' => $totalLeads > 0 ? round(($withWebsite / $totalLeads) * 100) : 0,
        'topRated' => $topRated,
        'ratingDistribution' => $ratingDist,
    ];
}

/**
 * Generate trend analysis for niche
 */
function generateTrendAnalysis($industry, $location) {
    return [
        'overallTrend' => 'growing',
        'growthRate' => '4.5% YoY',
        
        'currentTrends' => array_map(function($trend) {
            return [
                'name' => $trend,
                'description' => "Industry trend affecting " . strtolower($trend),
                'impact' => 'high',
                'timeline' => 'short-term',
            ];
        }, $industry['trends'] ?? []),
        
        'emergingOpportunities' => [
            'Digital-first customer experience',
            'Online booking and scheduling',
            'Personalized service offerings',
            'Subscription and membership models',
        ],
        
        'industryThreats' => $industry['challenges'] ?? [],
        
        'seasonalPatterns' => parseSeasonality($industry['seasonality'] ?? []),
        
        'technologyTrends' => [
            ['technology' => 'Online Booking Systems', 'adoptionRate' => 'mainstream', 'relevance' => 'critical'],
            ['technology' => 'CRM Software', 'adoptionRate' => 'growing', 'relevance' => 'important'],
            ['technology' => 'Social Media Marketing', 'adoptionRate' => 'mainstream', 'relevance' => 'critical'],
            ['technology' => 'AI/Automation', 'adoptionRate' => 'early-adopter', 'relevance' => 'important'],
        ],
        
        'consumerBehaviorShifts' => [
            'Increased online research before purchase',
            'Higher expectations for response times',
            'Preference for transparent pricing',
            'Value placed on reviews and social proof',
        ],
        
        'regulatoryChanges' => [],
    ];
}

/**
 * Parse seasonality strings
 */
function parseSeasonality($seasonalityStrings) {
    $patterns = [];
    
    foreach ($seasonalityStrings as $s) {
        if (stripos($s, 'peak') !== false) {
            if (stripos($s, 'spring') !== false) {
                $patterns[] = ['season' => 'spring', 'demandLevel' => 'peak'];
            }
            if (stripos($s, 'summer') !== false) {
                $patterns[] = ['season' => 'summer', 'demandLevel' => 'peak'];
            }
            if (stripos($s, 'winter') !== false) {
                $patterns[] = ['season' => 'winter', 'demandLevel' => 'peak'];
            }
            if (stripos($s, 'fall') !== false) {
                $patterns[] = ['season' => 'fall', 'demandLevel' => 'peak'];
            }
            if (stripos($s, 'holiday') !== false) {
                $patterns[] = ['season' => 'holiday', 'demandLevel' => 'peak'];
            }
        }
    }
    
    if (empty($patterns)) {
        $patterns = [
            ['season' => 'spring', 'demandLevel' => 'high'],
            ['season' => 'summer', 'demandLevel' => 'normal'],
            ['season' => 'fall', 'demandLevel' => 'high'],
            ['season' => 'winter', 'demandLevel' => 'normal'],
        ];
    }
    
    return $patterns;
}

/**
 * Generate market analysis
 */
function generateMarketAnalysis($industry, $aggregatedData, $location) {
    return [
        'marketSize' => [
            'estimatedSize' => 'Varies by region',
            'localMarketSize' => "Based on {$aggregatedData['totalLeads']} discovered competitors",
            'numberOfCompetitors' => $aggregatedData['totalLeads'],
            'marketConcentration' => $aggregatedData['totalLeads'] > 50 ? 'fragmented' : ($aggregatedData['totalLeads'] > 20 ? 'moderate' : 'concentrated'),
        ],
        
        'competitiveIntensity' => $aggregatedData['totalLeads'] > 30 ? 'high' : 'medium',
        'barrierToEntry' => 'medium',
        
        'pricingDynamics' => [
            'typicalPriceRange' => implode(' | ', $industry['priceRanges'] ?? ['Varies']),
            'pricingModel' => 'hybrid',
            'priceElasticity' => 'medium',
            'premiumOpportunities' => [
                'Faster service/response times',
                'Extended hours/weekend availability',
                'Superior customer experience',
                'Specialized expertise',
            ],
        ],
        
        'customerSegments' => [
            [
                'name' => 'Budget-Conscious',
                'description' => 'Price-sensitive customers seeking value',
                'percentage' => 30,
                'painPoints' => ['Cost concerns', 'Value for money'],
                'valueDrivers' => ['Competitive pricing', 'Transparent costs'],
            ],
            [
                'name' => 'Convenience Seekers',
                'description' => 'Customers prioritizing ease and speed',
                'percentage' => 35,
                'painPoints' => ['Time constraints', 'Scheduling difficulties'],
                'valueDrivers' => ['Quick response', 'Flexible scheduling'],
            ],
            [
                'name' => 'Quality-First',
                'description' => 'Customers willing to pay for the best',
                'percentage' => 35,
                'painPoints' => ['Finding reliable providers', 'Quality assurance'],
                'valueDrivers' => ['Reputation', 'Reviews', 'Guarantees'],
            ],
        ],
        
        'keySuccessFactors' => [
            'Strong online presence and reviews',
            'Fast response to inquiries',
            'Consistent service quality',
            'Competitive and transparent pricing',
            'Excellent customer communication',
        ],
        
        'industryChallenges' => $industry['challenges'] ?? [],
        
        'buyingPatterns' => [
            'typicalBuyingCycle' => '1-7 days for most services',
            'decisionMakers' => ['Homeowners', 'Property managers', 'Business owners'],
            'researchBehavior' => ['Google search', 'Review checking', 'Price comparison', 'Referral asking'],
            'triggerEvents' => ['Emergency needs', 'Seasonal maintenance', 'Moving/renovating', 'Recommendations'],
        ],
        
        'marketingChannels' => [
            ['channel' => 'Google Business Profile', 'effectiveness' => 'very-effective', 'costLevel' => 'low'],
            ['channel' => 'Google Ads', 'effectiveness' => 'effective', 'costLevel' => 'high'],
            ['channel' => 'Facebook/Instagram', 'effectiveness' => 'moderate', 'costLevel' => 'medium'],
            ['channel' => 'Referral Programs', 'effectiveness' => 'very-effective', 'costLevel' => 'low'],
            ['channel' => 'Local SEO', 'effectiveness' => 'effective', 'costLevel' => 'medium'],
        ],
    ];
}

/**
 * Generate products and services for niche
 */
function generateProductsAndServices($industry) {
    return [
        'coreServices' => array_map(function($service) {
            return [
                'name' => $service,
                'description' => "Standard offering in this industry",
                'category' => 'Core',
                'demandLevel' => 'high',
                'profitMargin' => 'medium',
            ];
        }, $industry['coreServices'] ?? []),
        
        'additionalServices' => array_map(function($service) {
            return [
                'name' => $service,
                'description' => "Additional/upsell offering",
                'category' => 'Add-On',
                'demandLevel' => 'medium',
                'profitMargin' => 'high',
            ];
        }, $industry['additionalServices'] ?? []),
        
        'emergingServices' => array_map(function($service) {
            return [
                'name' => $service,
                'description' => "Emerging service opportunity",
                'category' => 'Emerging',
                'demandLevel' => 'medium',
                'profitMargin' => 'high',
            ];
        }, $industry['emergingServices'] ?? []),
        
        'commonBundles' => [
            [
                'name' => 'Starter Package',
                'includedServices' => array_slice($industry['coreServices'] ?? [], 0, 2),
                'targetCustomer' => 'Price-sensitive customers',
            ],
            [
                'name' => 'Premium Package',
                'includedServices' => array_merge(
                    array_slice($industry['coreServices'] ?? [], 0, 3),
                    array_slice($industry['additionalServices'] ?? [], 0, 2)
                ),
                'targetCustomer' => 'Quality-focused customers',
            ],
        ],
        
        'pricingBenchmarks' => array_map(function($priceRange) {
            $parts = explode(':', $priceRange);
            return [
                'service' => trim($parts[0] ?? 'Service'),
                'range' => trim($parts[1] ?? $priceRange),
            ];
        }, $industry['priceRanges'] ?? []),
    ];
}

/**
 * Generate competitive landscape
 */
function generateCompetitiveLandscape($aggregatedData, $leadsCount) {
    $topRated = $aggregatedData['topRated'] ?? [];
    
    return [
        'totalCompetitorsInArea' => $leadsCount,
        'marketLeaders' => array_map(function($lead) {
            return [
                'name' => $lead['name'] ?? 'Unknown',
                'rating' => floatval($lead['rating'] ?? 0),
                'reviewCount' => intval($lead['reviews'] ?? $lead['reviewCount'] ?? 0),
                'strengths' => ['High ratings', 'Established presence'],
                'weaknesses' => [],
                'marketShare' => 'leader',
            ];
        }, array_slice($topRated, 0, 3)),
        
        'averageRating' => $aggregatedData['avgRating'] ?? 0,
        'averageReviewCount' => $aggregatedData['avgReviews'] ?? 0,
        
        'competitiveGaps' => [
            [
                'gap' => 'Website Quality',
                'description' => (100 - ($aggregatedData['websiteRate'] ?? 0)) . '% of competitors have poor or no websites',
                'opportunitySize' => 'large',
                'difficultyToCapture' => 'easy',
            ],
            [
                'gap' => 'Online Responsiveness',
                'description' => 'Many competitors slow to respond to online inquiries',
                'opportunitySize' => 'medium',
                'difficultyToCapture' => 'easy',
            ],
            [
                'gap' => 'Review Generation',
                'description' => 'Average competitor has limited reviews',
                'opportunitySize' => 'medium',
                'difficultyToCapture' => 'moderate',
            ],
        ],
        
        'differentiationOpportunities' => [
            [
                'strategy' => 'Superior online presence',
                'description' => 'Invest in professional website and SEO',
                'investmentRequired' => 'medium',
                'potentialImpact' => 'high',
            ],
            [
                'strategy' => 'Fast response times',
                'description' => 'Respond to inquiries within 1 hour',
                'investmentRequired' => 'low',
                'potentialImpact' => 'high',
            ],
            [
                'strategy' => 'Review dominance',
                'description' => 'Systematically generate and showcase reviews',
                'investmentRequired' => 'low',
                'potentialImpact' => 'medium',
            ],
        ],
        
        'positioningSpectrum' => [
            ['position' => 'premium', 'description' => 'High-end, quality-focused', 'targetCustomer' => 'Affluent customers', 'competitorDensity' => 'underserved'],
            ['position' => 'value', 'description' => 'Competitive pricing', 'targetCustomer' => 'Price-conscious', 'competitorDensity' => 'crowded'],
            ['position' => 'specialized', 'description' => 'Niche expertise', 'targetCustomer' => 'Specific needs', 'competitorDensity' => 'underserved'],
            ['position' => 'convenience', 'description' => 'Fast, easy service', 'targetCustomer' => 'Busy professionals', 'competitorDensity' => 'moderate'],
        ],
    ];
}

/**
 * Generate AI niche insights
 */
function generateAINicheInsights($industry, $aggregatedData) {
    $industryName = $industry['name'] ?? 'this market';
    $leadsCount = $aggregatedData['totalLeads'] ?? 0;
    $websiteRate = $aggregatedData['websiteRate'] ?? 0;
    
    return [
        'executiveSummary' => "Analysis of {$leadsCount} {$industryName} businesses reveals significant digital opportunity. Only {$websiteRate}% have adequate web presence, creating clear differentiation potential for modern, digitally-savvy operators.",
        
        'topOpportunities' => [
            [
                'opportunity' => 'Digital Presence Gap',
                'reasoning' => 'Many competitors lack professional websites or online booking',
                'urgency' => 'immediate',
                'estimatedValue' => 'High - can capture market share quickly',
            ],
            [
                'opportunity' => 'Review Advantage',
                'reasoning' => 'Systematic review generation can quickly establish authority',
                'urgency' => 'short-term',
                'estimatedValue' => 'Medium - builds compound advantage over time',
            ],
            [
                'opportunity' => 'Response Time Leadership',
                'reasoning' => 'Fast response to inquiries captures high-intent customers',
                'urgency' => 'immediate',
                'estimatedValue' => 'High - direct impact on conversions',
            ],
        ],
        
        'recommendedSellingAngles' => [
            [
                'angle' => 'Digital Transformation',
                'targetPainPoint' => 'Losing customers to competitors with better online presence',
                'messagingHook' => 'Your competitors are winning customers online while you\'re invisible',
                'proofPoints' => ['X% of customers research online first', 'Top competitors have Y reviews'],
            ],
            [
                'angle' => 'Revenue Recovery',
                'targetPainPoint' => 'Missing out on leads due to poor website or no tracking',
                'messagingHook' => 'You\'re losing $X,000/month in leads you don\'t even know about',
                'proofPoints' => ['Industry average conversion rates', 'Tracking gaps identified'],
            ],
        ],
        
        'commonObjections' => [
            [
                'objection' => 'We get enough business through word of mouth',
                'frequency' => 'very-common',
                'rebuttal' => 'Word of mouth is great, but 87% of customers also check reviews and websites before calling. You\'re losing the ones who can\'t find you online.',
            ],
            [
                'objection' => 'We tried digital marketing before and it didn\'t work',
                'frequency' => 'common',
                'rebuttal' => 'That\'s exactly why we focus on measurable results. Let me show you exactly where previous efforts went wrong and how we fix it.',
            ],
            [
                'objection' => 'We don\'t have budget for marketing',
                'frequency' => 'very-common',
                'rebuttal' => 'I understand. That\'s why we start with high-ROI activities first - things that pay for themselves in the first month.',
            ],
        ],
        
        'recommendedApproach' => [
            'primaryChannel' => 'email',
            'bestTimeToReach' => 'Tuesday-Thursday, 9-11 AM or 2-4 PM',
            'communicationStyle' => 'Professional, value-focused, data-backed',
            'followUpCadence' => '4-5 touchpoints over 2 weeks',
            'averageSaleCycle' => '2-4 weeks for most services',
        ],
        
        'successFactors' => [
            ['factor' => 'Personalized outreach', 'importance' => 'critical'],
            ['factor' => 'Quick response time', 'importance' => 'critical'],
            ['factor' => 'Proof of results', 'importance' => 'important'],
            ['factor' => 'Clear pricing', 'importance' => 'important'],
            ['factor' => 'Easy next steps', 'importance' => 'helpful'],
        ],
    ];
}
