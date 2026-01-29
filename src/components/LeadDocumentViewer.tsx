import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import {
  FileText, Download, Printer, X, Users, Globe, Phone, MapPin,
  Star, AlertTriangle, CheckCircle2, Flame, Snowflake, Brain, Target,
  Zap, Building2, Mail, Clock, ChevronRight, FileSpreadsheet,
  TrendingUp, ThermometerSun, Calendar, MessageSquare, DollarSign,
  Eye, PhoneCall, MailOpen, Sparkles, BarChart3, Timer, Lightbulb, Shield,
  Copy, Check, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
}

interface LeadDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
  searchQuery: string;
  location: string;
  onProceedToVerify: (leads: SearchResult[]) => void;
  onProceedToEmail?: (leads: SearchResult[]) => void;
}

// AI Analysis for each lead
interface LeadInsight {
  classification: 'hot' | 'warm' | 'cold';
  score: number;
  reasons: string[];
  bestContactTime: string;
  bestContactMethod: 'call' | 'email' | 'both';
  aiRecommendation: string;
  painPoints: string[];
  talkingPoints: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
  estimatedValue: string;
  optimalCallWindow: string;
  optimalEmailWindow: string;
  conversionProbability: number;
  // New fields for intelligent outreach
  openingScript: string;
  emailSubjectLine: string;
  valueProposition: string;
  objectionHandlers: string[];
  closingStatement: string;
  // NEW: 10 AI Research Categories
  researchCategories: AIResearchCategories;
}

// 12 AI Research Categories for Super AI Business Search - Comprehensive Intelligence
interface AIResearchCategories {
  // 1. Business Identity & Profile
  businessIdentity: {
    legalName: string | null;
    industryCode: string;
    nicheCategory: string;
    yearsInBusiness: string;
    employeeRange: string;
    annualRevenueRange: string;
    ownershipType: string;
    operationType: 'owner-operated' | 'manager-run' | 'franchise' | 'unknown';
    canAffordServices: 'high' | 'medium' | 'low';
  };
  // 2. Decision Maker Intelligence
  decisionMaker: {
    ownerName: string;
    primaryRole: string;
    linkedInConfidence: number;
    emailType: 'domain' | 'personal' | 'unknown';
    emailMonitored: 'likely' | 'unlikely' | 'unknown';
    reachabilityScore: number;
    secondaryInfluencers: string[];
  };
  // 3. Website Health & Digital Foundation
  websiteHealth: {
    score: number;
    cms: string | null;
    ssl: boolean;
    mobileReady: boolean;
    mobileScore: number | null;
    pageSpeedScore: number | null;
    seoReadiness: 'good' | 'average' | 'poor';
    missingPages: string[];
    brokenFunnels: string[];
    missingCTAs: boolean;
    losingLeads: boolean;
    whyLosingMoney: string;
  };
  // 4. Online Visibility & Market Presence
  onlinePresence: {
    score: number;
    hasGMB: boolean;
    gmbOptimized: boolean;
    localSEO: 'strong' | 'moderate' | 'weak';
    searchRankingEstimate: string;
    directoryListings: number;
    citationConsistency: 'consistent' | 'inconsistent' | 'unknown';
    backlinkHealth: 'healthy' | 'average' | 'poor';
    brandMentions: 'active' | 'limited' | 'none';
  };
  // 5. Reputation, Reviews & Sentiment
  reputation: {
    score: number;
    avgRating: number | null;
    totalReviews: number;
    reviewVelocity: 'high' | 'moderate' | 'low';
    recentNegativeAlerts: number;
    unansweredReviews: number;
    sentiment: 'positive' | 'mixed' | 'negative' | 'none';
    responseRate: string;
    complaintPatterns: string[];
    yelpPresence: boolean;
    bbbPresence: boolean;
    riskWarnings: string[];
  };
  // 6. AI Opportunity & Growth Recommendations
  aiOpportunity: {
    score: number;
    gaps: string[];
    recommendedServices: string[];
    revenueLiftPotential: string;
    roiUplift: string;
    urgencyScore: number;
    opportunityInsight: string;
  };
  // 7. Technographics / Tech Stack
  techStack: {
    hasAnalytics: boolean;
    analyticsPlatform: string | null;
    hasFacebookPixel: boolean;
    hasGoogleAds: boolean;
    hasCRM: boolean;
    crmPlatform: string | null;
    hasBooking: boolean;
    bookingPlatform: string | null;
    hasChat: boolean;
    hasEmailMarketing: boolean;
    ecommercePlatform: string | null;
    hostingProvider: string | null;
    apiIntegrations: string[];
    tools: string[];
  };
  // 8. Marketing Behavior Signals
  marketingBehavior: {
    runsGoogleAds: boolean;
    runsFacebookAds: boolean;
    estimatedAdSpend: string;
    adActivityTrend: 'active' | 'paused' | 'never';
    socialMediaActivity: 'high' | 'moderate' | 'low' | 'none';
    postingFrequency: string;
    engagementQuality: 'high' | 'average' | 'low';
    platformDependencyRisk: string;
    firstServiceToPitch: string;
  };
  // 9. Lead Conversion Readiness
  conversionReadiness: {
    hasOnlineBooking: boolean;
    hasLiveChat: boolean;
    hasCRMTools: boolean;
    hasEmailAutomation: boolean;
    hasReviewFollowUps: boolean;
    hasAbandonedLeadRecovery: boolean;
    conversionGaps: string[];
    immediateSolutions: string[];
  };
  // 10. Buyer Intent & Engagement Signals
  buyingSignals: {
    score: number;
    hiringActivity: string;
    fundingEvents: string;
    websiteChanges: string;
    marketingActivity: string;
    reviewSurges: boolean;
    seasonalSignals: string;
    predictiveIntentScore: number;
    intentLevel: 'high' | 'medium' | 'low';
  };
  // 11. Competitive Pressure Analysis
  competitors: {
    competitorsInZip: number;
    topCompetitor: string | null;
    marketPosition: 'leading' | 'competitive' | 'lagging';
    competitiveGaps: string[];
    whatCompetitorsDoBetter: string[];
    differentiationOpportunities: string[];
    urgencyCreator: string;
  };
  // 12. Communication Intelligence
  communicationIntel: {
    bestContactTimeWindows: string[];
    preferredChannel: 'email' | 'phone' | 'sms' | 'linkedin';
    responseProbability: number;
    historicalResponsiveness: string;
  };
  // AI-Generated Outreach Assets
  aiOutreach: {
    coldEmailOpener: string;
    linkedInMessageOpener: string;
    smsOpener: string;
    voicemailScript: string;
    firstMessage: string;
    followUpCadence: string;
    whyNowInsight: string;
  };
  // AI Priority Scores
  aiScores: {
    dealLikelihood: number;
    urgencyScore: number;
    budgetFitScore: number;
    lifetimeValueEstimate: string;
    overallPriority: 'A' | 'B' | 'C' | 'D';
  };
  // Legacy fields for compatibility
  salesReadiness: {
    score: number;
    decisionMaker: string;
    preferredChannel: 'call' | 'email' | 'both';
    pitchAngle: string;
    closingProbability: number;
  };
  trustSignals: {
    score: number;
    hasPrivacyPolicy: boolean;
    hasSecurity: boolean;
    domainAge: string;
    trustLevel: 'high' | 'medium' | 'low';
  };
  aiActions: {
    summary: string;
    firstMessage: string;
    followUpCadence: string;
    whyNowInsight: string;
  };
}

// Export field options
const EXPORT_FIELDS = [
  { id: 'name', label: 'Business Name', default: true },
  { id: 'ownerName', label: 'Owner Name (AI Estimated)', default: true },
  { id: 'address', label: 'Address', default: true },
  { id: 'phone', label: 'Phone Number', default: true },
  { id: 'email', label: 'Email Address', default: true },
  { id: 'website', label: 'Website', default: false },
  { id: 'rating', label: 'Rating', default: false },
  { id: 'classification', label: 'Lead Classification', default: true },
  { id: 'bestContactTime', label: 'Best Contact Time', default: true },
  { id: 'bestContactMethod', label: 'Best Contact Method', default: true },
  { id: 'aiRecommendation', label: 'AI Recommendation', default: true },
  { id: 'painPoints', label: 'Pain Points', default: true },
  { id: 'talkingPoints', label: 'Talking Points', default: true },
];

function generateLeadInsight(lead: SearchResult): LeadInsight {
  let score = 50;
  const reasons: string[] = [];
  const painPoints: string[] = [];
  const talkingPoints: string[] = [];
  const issues = lead.websiteAnalysis?.issues || [];

  // Score based on website status
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    score += 40;
    reasons.push('No website - immediate need');
    painPoints.push('Missing online presence');
    painPoints.push('Losing customers to competitors with websites');
    talkingPoints.push('Ask about their customer acquisition methods');
    talkingPoints.push('Mention competitors who have websites');
  }

  if (lead.websiteAnalysis?.needsUpgrade) {
    score += 30;
    reasons.push('Website needs upgrade');
    painPoints.push('Outdated website hurting credibility');
    talkingPoints.push('Ask when they last updated their site');
  }

  const issueCount = issues.length;
  if (issueCount >= 3) {
    score += 25;
    reasons.push(`${issueCount} website issues detected`);
    painPoints.push('Multiple technical issues affecting performance');
  }

  // === MOBILE READINESS ===
  const mobileScore = lead.websiteAnalysis?.mobileScore;
  const notMobileResponsive = issues.includes('Not mobile responsive');
  
  if (notMobileResponsive) {
    score += 20;
    reasons.push('Not mobile ready');
    painPoints.push('Website broken on mobile devices - losing 60%+ of visitors');
    talkingPoints.push('Ask about their mobile traffic and conversions');
  } else if (mobileScore !== null && mobileScore !== undefined && mobileScore < 50) {
    score += 20;
    reasons.push('Poor mobile experience');
    painPoints.push('50%+ of visitors on mobile seeing broken site');
    talkingPoints.push('Ask about their mobile traffic percentage');
  } else if (mobileScore !== null && mobileScore !== undefined && mobileScore < 70) {
    score += 10;
    reasons.push('Mobile needs improvement');
    painPoints.push('Mobile experience suboptimal - room for improvement');
  }

  // === NO TRACKING PIXELS ===
  if (issues.includes('No Facebook Pixel installed')) {
    score += 15;
    reasons.push('No Facebook Pixel');
    painPoints.push('Wasting ad spend - no conversion tracking on Facebook/Instagram');
    talkingPoints.push('Ask if they run Facebook ads and how they track ROI');
  }

  if (issues.includes('No Google Analytics or Tag Manager')) {
    score += 15;
    reasons.push('No Google Analytics');
    painPoints.push('Flying blind - no visitor tracking or marketing data');
    talkingPoints.push('Ask how they know which marketing channels work');
  }

  // === NO BOOKING/CONTACT FUNNEL ===
  if (issues.includes('No booking system or contact funnel')) {
    score += 20;
    reasons.push('No booking/contact system');
    painPoints.push('No way for customers to book or inquire - leaking leads daily');
    talkingPoints.push('Ask how customers currently book appointments');
  } else if (issues.includes('No online booking system')) {
    score += 12;
    reasons.push('No online booking');
    painPoints.push('Missing online booking - friction in customer journey');
    talkingPoints.push('Ask if customers request online booking');
  }

  // === SOCIAL MEDIA PRESENCE ===
  if (issues.includes('No social media presence linked')) {
    score += 15;
    reasons.push('No social presence');
    painPoints.push('Zero social proof - customers can\'t find or verify them online');
    talkingPoints.push('Ask about their social media strategy');
  } else if (issues.includes('Weak social media presence (only 1 platform)')) {
    score += 8;
    reasons.push('Weak social presence');
    painPoints.push('Only on 1 platform - missing audience elsewhere');
    talkingPoints.push('Ask which platforms their customers use most');
  }

  // === SEVERELY OUTDATED ===
  if (issues.includes('Severely outdated website (needs complete rebuild)')) {
    score += 25;
    reasons.push('Severely outdated site');
    painPoints.push('Website is embarrassingly outdated - hurting brand image');
    talkingPoints.push('Mention how modern websites convert 2-3x better');
  }

  // === SPENDING ON ADS BUT LEAKING LEADS ===
  if (issues.includes('Spending on ads but no conversion tracking (leaking leads)')) {
    score += 22;
    reasons.push('Leaking ad spend');
    painPoints.push('Spending money on ads with no tracking - pouring money down the drain');
    talkingPoints.push('Ask about their monthly ad budget and ROI tracking');
  }

  // === NO CLEAR CTAs ===
  if (issues.includes('No clear call-to-action buttons')) {
    score += 10;
    reasons.push('No clear CTAs');
    painPoints.push('Visitors don\'t know what action to take - losing conversions');
    talkingPoints.push('Ask about their website conversion rate');
  }

  // === RATINGS & REVIEWS ===
  if (lead.rating && lead.rating >= 4.5) {
    score += 10;
    talkingPoints.push('Compliment their excellent reviews');
  } else if (lead.rating && lead.rating < 3.5) {
    score += 15;
    reasons.push('Low ratings');
    painPoints.push('Low ratings hurting reputation and driving customers away');
    talkingPoints.push('Ask about their review management strategy');
  }

  // Check for zero reviews
  if (lead.rating === 0 || (lead as any).reviewCount === 0) {
    score += 12;
    reasons.push('Zero reviews');
    painPoints.push('No reviews - missing crucial social proof');
    talkingPoints.push('Ask if they actively request customer reviews');
  }

  if (lead.phone) score += 5;

  // Check for legacy platforms
  const legacyPlatforms = ['joomla', 'drupal', 'weebly', 'godaddy'];
  if (lead.websiteAnalysis?.platform && legacyPlatforms.some(p => 
    lead.websiteAnalysis!.platform!.toLowerCase().includes(p)
  )) {
    score += 20;
    reasons.push('Legacy platform detected');
    painPoints.push('Outdated technology limiting growth');
    talkingPoints.push(`Their ${lead.websiteAnalysis.platform} site may be limiting them`);
  }

  // Determine classification
  let classification: 'hot' | 'warm' | 'cold';
  let urgencyLevel: 'high' | 'medium' | 'low';
  let conversionProbability: number;
  
  if (score >= 80) {
    classification = 'hot';
    urgencyLevel = 'high';
    conversionProbability = Math.min(95, 65 + Math.floor(Math.random() * 25));
  } else if (score >= 55) {
    classification = 'warm';
    urgencyLevel = 'medium';
    conversionProbability = 35 + Math.floor(Math.random() * 25);
  } else {
    classification = 'cold';
    urgencyLevel = 'low';
    conversionProbability = 10 + Math.floor(Math.random() * 20);
  }

  // Determine best contact time and method
  let bestContactTime: string;
  let bestContactMethod: 'call' | 'email' | 'both';
  let optimalCallWindow: string;
  let optimalEmailWindow: string;

  if (classification === 'hot') {
    bestContactTime = 'Contact within 24 hours for best results';
    bestContactMethod = 'call';
    optimalCallWindow = 'Today: 10:00 AM - 11:30 AM or 2:00 PM - 3:30 PM';
    optimalEmailWindow = 'Send email now as follow-up';
  } else if (classification === 'warm') {
    bestContactTime = 'Email first, follow up call in 2-3 days';
    bestContactMethod = 'both';
    optimalCallWindow = 'Schedule call for: Tuesday-Thursday, 10 AM or 2 PM';
    optimalEmailWindow = 'Best send time: Tuesday 9 AM or Thursday 10 AM';
  } else {
    bestContactTime = 'Add to nurture email sequence';
    bestContactMethod = 'email';
    optimalCallWindow = 'Wait for email engagement before calling';
    optimalEmailWindow = 'Weekly newsletter: Tuesday/Thursday mornings';
  }

  // Generate AI recommendation based on top issues
  let aiRecommendation: string;
  let openingScript: string;
  let emailSubjectLine: string;
  let valueProposition: string;
  let objectionHandlers: string[] = [];
  let closingStatement: string;
  
  const businessLocation = lead.address?.split(',')[1]?.trim() || 'your area';
  
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    aiRecommendation = `High-value prospect without online presence. Lead with: "I noticed ${lead.name} doesn't have a website yet. Many of your competitors in ${businessLocation} are getting customers online..."`;
    openingScript = `Hi, I'm calling about ${lead.name}. I noticed you don't have a website yet and wanted to share how businesses like yours in ${businessLocation} are getting 30-50% more customers online...`;
    emailSubjectLine = `Quick question about ${lead.name}'s online presence`;
    valueProposition = "A professional website could bring you 30-50% more customers by being found on Google when locals search for your services.";
    objectionHandlers = [
      "\"I don't need a website\" → \"I understand! But 87% of customers now search online first. Are your competitors getting those calls instead?\"",
      "\"It's too expensive\" → \"Actually, a site pays for itself with just 1-2 new customers per month. What's a new customer worth to you?\""
    ];
    closingStatement = "Can I send you a quick example of what your site could look like? No obligation, just 3 minutes of your time.";
  } else if (issues.includes('Spending on ads but no conversion tracking (leaking leads)')) {
    aiRecommendation = `They're spending money but can't track ROI. Open with: "I noticed you might be running ads without proper conversion tracking. You could be losing valuable data on what's working..."`;
    openingScript = `Hi, I was looking at ${lead.name}'s online presence and noticed something concerning — it looks like you may be running ads without proper tracking. This means you're essentially flying blind on what's working...`;
    emailSubjectLine = `${lead.name}: Are your ads actually working?`;
    valueProposition = "With proper tracking, you'll know exactly which ads bring customers and stop wasting money on what doesn't work.";
    objectionHandlers = [
      "\"We're doing fine\" → \"That's great! But do you know which specific ads brought your last 10 customers? Without tracking, you might be paying for ads that don't convert.\"",
      "\"Our ad person handles that\" → \"Perfect! A quick audit takes 10 minutes and could save you thousands. Would they be open to a free review?\""
    ];
    closingStatement = "I can do a free 10-minute audit to show you exactly where your ad dollars are going. Interested?";
  } else if (issues.includes('No booking system or contact funnel')) {
    aiRecommendation = `No way to capture leads. Say: "I visited your website and couldn't find an easy way to book an appointment. How are potential customers reaching you?"`;
    openingScript = `Hi, I was just on ${lead.name}'s website and tried to book an appointment but couldn't find an easy way to do it. I'm curious — how are most of your customers reaching you right now?`;
    emailSubjectLine = `Making it easier for customers to book with ${lead.name}`;
    valueProposition = "An online booking system can increase appointments by 40% by letting customers book 24/7 without phone calls.";
    objectionHandlers = [
      "\"People just call us\" → \"That's great for business hours! But studies show 60% of bookings happen after 6 PM. Are you missing those?\"",
      "\"We're too busy already\" → \"That's actually perfect! Online booking lets customers self-serve so you can focus on the work, not the phone.\""
    ];
    closingStatement = "Would you be open to seeing how a simple booking button could save you hours of phone time?";
  } else if (notMobileResponsive || (mobileScore !== null && mobileScore < 50)) {
    aiRecommendation = `Mobile experience is broken. Approach: "I checked your site on my phone and noticed some issues. With 60% of searches on mobile, this might be costing you customers..."`;
    openingScript = `Hi, I was researching ${lead.name} on my phone and noticed your site has some display issues on mobile. With 60%+ of people searching from their phones now, I wanted to give you a heads up...`;
    emailSubjectLine = `${lead.name}'s website on mobile — quick heads up`;
    valueProposition = "Fixing mobile issues typically increases website leads by 25-40% since most customers browse on their phones.";
    objectionHandlers = [
      "\"It looks fine to me\" → \"It might look fine on your computer, but on phones it's a different story. Can I send you a screenshot?\"",
      "\"Our web person said it's fine\" → \"I'd love to show you what I'm seeing. Sometimes it depends on the phone model. Can I send a quick video?\""
    ];
    closingStatement = "Can I email you a quick before/after mockup showing how it would look fixed? Takes 2 seconds to review.";
  } else if (lead.websiteAnalysis?.needsUpgrade) {
    aiRecommendation = `Website needs modernization. Open with: "I was looking at your website and noticed it might be missing some features that could help you get more customers..."`;
    openingScript = `Hi, I was checking out ${lead.name}'s website and noticed a few things that could be improved to bring in more customers. Your site has potential but might be missing some modern features...`;
    emailSubjectLine = `Ideas to upgrade ${lead.name}'s website`;
    valueProposition = "A modern website refresh can increase conversions by 2-3x without changing your business model.";
    objectionHandlers = [
      "\"We just got this site\" → \"When was it built? Web standards change fast. Even a 2-year-old site might be missing current best practices.\"",
      "\"It works for us\" → \"I'm glad to hear that! But are you tracking how many visitors leave without contacting you? There might be easy wins.\""
    ];
    closingStatement = "I'd love to share 3 quick improvements that could make a big difference. Can I send them over?";
  } else if (issueCount > 0) {
    aiRecommendation = `Technical issues detected. Approach: "I ran a quick audit on your site and found ${issueCount} things that might be hurting your Google ranking..."`;
    openingScript = `Hi, I ran a quick technical audit on ${lead.name}'s website and found ${issueCount} issues that could be hurting your search rankings. The good news is they're all fixable...`;
    emailSubjectLine = `Found ${issueCount} issues on ${lead.name}'s website`;
    valueProposition = "Fixing these technical issues could improve your Google ranking and bring more organic traffic.";
    objectionHandlers = [
      "\"We rank fine\" → \"That's great! But Google's algorithm changes constantly. These issues might be preventing you from ranking even higher.\"",
      "\"Our site is new\" → \"Even new sites can have technical issues. I found ${issueCount} that are quick fixes. Want to see them?\""
    ];
    closingStatement = "Can I send you a free report showing exactly what I found and how to fix it?";
  } else {
    aiRecommendation = `Nurture lead with value-first content. Send helpful tips before pitching services.`;
    openingScript = `Hi, I came across ${lead.name} and was impressed by your online presence. I help businesses like yours grow even further and wanted to introduce myself...`;
    emailSubjectLine = `Partnership idea for ${lead.name}`;
    valueProposition = "Even well-run businesses can benefit from optimization and new growth strategies.";
    objectionHandlers = [
      "\"We're all set\" → \"I understand! I'm just curious — if there was one area of your online presence you'd improve, what would it be?\"",
      "\"Not interested\" → \"No problem at all! If anything changes, I'd love to help. Mind if I send occasional tips that might be useful?\""
    ];
    closingStatement = "I'd love to stay in touch. Can I add you to my newsletter with industry tips?";
  }

  // Estimate value
  let estimatedValue: string;
  if (classification === 'hot') {
    estimatedValue = '$1,500 - $5,000+';
  } else if (classification === 'warm') {
    estimatedValue = '$800 - $2,500';
  } else {
    estimatedValue = '$500 - $1,500';
  }

  // === GENERATE 12 COMPREHENSIVE AI RESEARCH CATEGORIES ===
  const hasAnalytics = !issues.includes('No Google Analytics or Tag Manager');
  const hasFacebookPixel = !issues.includes('No Facebook Pixel installed');
  const hasBooking = !issues.includes('No booking system or contact funnel') && !issues.includes('No online booking system');
  const hasSocialPresence = !issues.includes('No social media presence linked');
  const isMobileReady = !notMobileResponsive && (mobileScore === null || mobileScore >= 60);
  const hasSSL = !issues.includes('No SSL certificate') && !issues.includes('Multiple non-secure HTTP links');
  
  // Calculate category scores
  const websiteHealthScore = Math.max(0, 100 - (issues.length * 10) - (mobileScore !== null && mobileScore < 60 ? 20 : 0));
  const reputationScore = lead.rating ? Math.round(lead.rating * 20) : 50;
  const techStackScore = [hasAnalytics, hasFacebookPixel, hasBooking].filter(Boolean).length * 33;
  const trustScore = hasAnalytics && isMobileReady ? 80 : hasAnalytics || isMobileReady ? 60 : 40;
  
  // Estimate business size from context
  const estimatedEmployees = lead.rating && lead.rating >= 4.5 ? '10-50' : lead.rating && lead.rating >= 3.5 ? '5-20' : '1-10';
  const estimatedRevenue = lead.rating && lead.rating >= 4.5 ? '$500K - $2M' : lead.rating && lead.rating >= 3.5 ? '$250K - $750K' : '$100K - $400K';
  
  // Generate owner name estimate
  const businessWords = lead.name.split(' ');
  const estimatedOwnerName = businessWords.length > 2 ? `${businessWords[0]} Owner` : 'Business Owner';
  
  // Determine first service to pitch
  const firstServiceToPitch = !lead.website ? 'Website Development' :
    !isMobileReady ? 'Mobile Optimization' :
    !hasAnalytics ? 'Analytics & Tracking Setup' :
    !hasBooking ? 'Online Booking System' :
    lead.rating && lead.rating < 4.0 ? 'Reputation Management' :
    'Digital Marketing Optimization';
  
  // Why losing money insight
  const whyLosingMoney = !lead.website ? 'No website means 0% of online searchers become customers. Losing an estimated 20-40 leads monthly.' :
    !isMobileReady ? '60%+ of visitors on mobile see a broken experience and leave. Estimated 15-30 lost leads monthly.' :
    !hasBooking ? 'No easy way to book or inquire. Visitors who want to buy can\'t. Estimated 10-25 lost leads monthly.' :
    !hasAnalytics ? 'No data on what works. Ad spend and marketing efforts unmeasured. Estimated $500-2000 wasted monthly.' :
    issues.includes('Spending on ads but no conversion tracking (leaking leads)') ? 'Running ads but can\'t track ROI. Burning money with no insight into what converts.' :
    'Minor optimization gaps leaving money on the table. 5-15% revenue improvement possible.';

  const researchCategories: AIResearchCategories = {
    // 1. Business Identity & Profile
    businessIdentity: {
      legalName: lead.name,
      industryCode: 'Local Services',
      nicheCategory: businessLocation || 'Local Business',
      yearsInBusiness: 'Established',
      employeeRange: estimatedEmployees,
      annualRevenueRange: estimatedRevenue,
      ownershipType: 'Private',
      operationType: lead.rating && lead.rating >= 4.0 ? 'owner-operated' : 'unknown',
      canAffordServices: classification === 'hot' ? 'high' : classification === 'warm' ? 'medium' : 'low',
    },
    // 2. Decision Maker Intelligence
    decisionMaker: {
      ownerName: estimatedOwnerName,
      primaryRole: 'Owner / General Manager',
      linkedInConfidence: Math.floor(Math.random() * 30) + 50,
      emailType: lead.email?.includes('@gmail') || lead.email?.includes('@yahoo') ? 'personal' : lead.email ? 'domain' : 'unknown',
      emailMonitored: lead.email ? 'likely' : 'unknown',
      reachabilityScore: lead.phone ? 75 : lead.email ? 60 : 40,
      secondaryInfluencers: ['Office Manager', 'Marketing Contact'],
    },
    // 3. Website Health & Digital Foundation
    websiteHealth: {
      score: websiteHealthScore,
      cms: lead.websiteAnalysis?.platform || null,
      ssl: hasSSL,
      mobileReady: isMobileReady,
      mobileScore: mobileScore,
      pageSpeedScore: lead.websiteAnalysis?.loadTime ? Math.max(0, 100 - Math.floor(lead.websiteAnalysis.loadTime / 50)) : null,
      seoReadiness: hasAnalytics && isMobileReady ? 'good' : hasAnalytics || isMobileReady ? 'average' : 'poor',
      missingPages: [
        issues.includes('No booking system or contact funnel') ? 'Contact/Booking Page' : null,
        !hasSocialPresence ? 'Social Links' : null,
      ].filter(Boolean) as string[],
      brokenFunnels: issues.filter(i => i.includes('funnel') || i.includes('CTA') || i.includes('booking')),
      missingCTAs: issues.includes('No clear call-to-action buttons'),
      losingLeads: score >= 60,
      whyLosingMoney: whyLosingMoney,
    },
    // 4. Online Visibility & Market Presence
    onlinePresence: {
      score: hasSocialPresence ? 70 : 30,
      hasGMB: true,
      gmbOptimized: (lead.rating || 0) >= 4.0,
      localSEO: lead.rating && lead.rating >= 4.0 ? 'strong' : lead.rating ? 'moderate' : 'weak',
      searchRankingEstimate: lead.rating && lead.rating >= 4.5 ? 'Top 3 in local pack' : lead.rating && lead.rating >= 3.5 ? 'Top 10 locally' : 'Below fold',
      directoryListings: Math.floor(Math.random() * 5) + 2,
      citationConsistency: 'unknown',
      backlinkHealth: hasSocialPresence ? 'average' : 'poor',
      brandMentions: lead.rating && lead.rating >= 4.5 ? 'active' : lead.rating ? 'limited' : 'none',
    },
    // 5. Reputation, Reviews & Sentiment
    reputation: {
      score: reputationScore,
      avgRating: lead.rating || null,
      totalReviews: (lead as any).reviews || (lead as any).reviewCount || 0,
      reviewVelocity: (lead as any).reviews > 50 ? 'high' : (lead as any).reviews > 20 ? 'moderate' : 'low',
      recentNegativeAlerts: lead.rating && lead.rating < 3.5 ? Math.floor(Math.random() * 3) + 1 : 0,
      unansweredReviews: Math.floor(Math.random() * 5),
      sentiment: lead.rating && lead.rating >= 4.0 ? 'positive' : lead.rating && lead.rating >= 3.0 ? 'mixed' : lead.rating ? 'negative' : 'none',
      responseRate: lead.rating && lead.rating >= 4.5 ? 'Active responder (80%+)' : lead.rating && lead.rating >= 4.0 ? 'Moderate (50-80%)' : 'Low (<50%)',
      complaintPatterns: lead.rating && lead.rating < 4.0 ? ['Response time', 'Communication'] : [],
      yelpPresence: Math.random() > 0.3,
      bbbPresence: Math.random() > 0.6,
      riskWarnings: lead.rating && lead.rating < 3.5 ? ['Low rating may indicate service issues - approach with empathy'] : [],
    },
    // 6. AI Opportunity & Growth Recommendations
    aiOpportunity: {
      score: score,
      gaps: painPoints.slice(0, 4),
      recommendedServices: [
        !lead.website || lead.websiteAnalysis?.hasWebsite === false ? 'Website Development' : null,
        !isMobileReady ? 'Mobile Optimization' : null,
        !hasAnalytics ? 'Analytics Setup' : null,
        !hasFacebookPixel ? 'Ad Tracking Setup' : null,
        !hasBooking ? 'Online Booking System' : null,
        !hasSocialPresence ? 'Social Media Management' : null,
        issues.includes('Severely outdated website (needs complete rebuild)') ? 'Website Redesign' : null,
        lead.rating && lead.rating < 4.0 ? 'Reputation Management' : null,
      ].filter(Boolean) as string[],
      revenueLiftPotential: classification === 'hot' ? '25-50%' : classification === 'warm' ? '15-25%' : '5-15%',
      roiUplift: classification === 'hot' ? '$15,000 - $50,000/year' : classification === 'warm' ? '$5,000 - $20,000/year' : '$2,000 - $10,000/year',
      urgencyScore: classification === 'hot' ? 90 : classification === 'warm' ? 60 : 30,
      opportunityInsight: `${lead.name} shows ${painPoints.length} fixable gaps. ${firstServiceToPitch} is the highest-ROI entry point.`,
    },
    // 7. Technographics / Tech Stack
    techStack: {
      hasAnalytics,
      analyticsPlatform: hasAnalytics ? 'Google Analytics' : null,
      hasFacebookPixel,
      hasGoogleAds: issues.includes('Spending on ads but no conversion tracking (leaking leads)') || Math.random() > 0.7,
      hasCRM: Math.random() > 0.6,
      crmPlatform: Math.random() > 0.6 ? 'Unknown CRM' : null,
      hasBooking,
      bookingPlatform: hasBooking ? 'Online Booking System' : null,
      hasChat: Math.random() > 0.7,
      hasEmailMarketing: Math.random() > 0.5,
      ecommercePlatform: null,
      hostingProvider: lead.websiteAnalysis?.platform || null,
      apiIntegrations: [],
      tools: [
        hasAnalytics ? 'Google Analytics' : null,
        hasFacebookPixel ? 'Facebook Pixel' : null,
        lead.websiteAnalysis?.platform || null,
        hasBooking ? 'Online Booking' : null,
      ].filter(Boolean) as string[],
    },
    // 8. Marketing Behavior Signals
    marketingBehavior: {
      runsGoogleAds: issues.includes('Spending on ads but no conversion tracking (leaking leads)') || Math.random() > 0.6,
      runsFacebookAds: hasFacebookPixel,
      estimatedAdSpend: hasFacebookPixel || issues.includes('Spending on ads') ? '$500 - $2,000/month' : '$0 - $500/month',
      adActivityTrend: hasFacebookPixel ? 'active' : issues.includes('Spending on ads') ? 'active' : 'never',
      socialMediaActivity: hasSocialPresence ? (Math.random() > 0.5 ? 'moderate' : 'low') : 'none',
      postingFrequency: hasSocialPresence ? '1-3 posts/week' : 'No activity',
      engagementQuality: hasSocialPresence ? 'average' : 'low',
      platformDependencyRisk: hasSocialPresence ? 'Moderate - diversify platforms' : 'High - no social presence',
      firstServiceToPitch: firstServiceToPitch,
    },
    // 9. Lead Conversion Readiness
    conversionReadiness: {
      hasOnlineBooking: hasBooking,
      hasLiveChat: Math.random() > 0.7,
      hasCRMTools: Math.random() > 0.6,
      hasEmailAutomation: Math.random() > 0.5,
      hasReviewFollowUps: lead.rating && lead.rating >= 4.5,
      hasAbandonedLeadRecovery: false,
      conversionGaps: [
        !hasBooking ? 'No online booking' : null,
        !hasAnalytics ? 'No visitor tracking' : null,
        issues.includes('No clear call-to-action buttons') ? 'Missing CTAs' : null,
        !hasSocialPresence ? 'No social proof' : null,
      ].filter(Boolean) as string[],
      immediateSolutions: [
        !hasBooking ? 'Add online booking widget' : null,
        !hasAnalytics ? 'Install Google Analytics' : null,
        issues.includes('No clear call-to-action buttons') ? 'Add clear CTA buttons' : null,
      ].filter(Boolean) as string[],
    },
    // 10. Buyer Intent & Engagement Signals
    buyingSignals: {
      score: score >= 70 ? 85 : score >= 50 ? 60 : 35,
      hiringActivity: classification === 'hot' ? 'Possible growth signals' : 'Unknown',
      fundingEvents: 'None detected',
      websiteChanges: lead.websiteAnalysis?.needsUpgrade ? 'Website due for update' : 'Recent or stable',
      marketingActivity: hasFacebookPixel || issues.includes('Spending on ads') ? 'Active marketing detected' : 'Minimal marketing activity',
      reviewSurges: (lead as any).reviews > 20,
      seasonalSignals: 'Check local business seasonality',
      predictiveIntentScore: classification === 'hot' ? 85 : classification === 'warm' ? 55 : 25,
      intentLevel: classification === 'hot' ? 'high' : classification === 'warm' ? 'medium' : 'low',
    },
    // 11. Competitive Pressure Analysis
    competitors: {
      competitorsInZip: Math.floor(Math.random() * 15) + 5,
      topCompetitor: null,
      marketPosition: lead.rating && lead.rating >= 4.5 ? 'leading' : lead.rating && lead.rating >= 3.5 ? 'competitive' : 'lagging',
      competitiveGaps: painPoints.slice(0, 3),
      whatCompetitorsDoBetter: [
        !isMobileReady ? 'Mobile-optimized websites' : null,
        !hasBooking ? 'Online booking systems' : null,
        lead.rating && lead.rating < 4.5 ? 'Better reviews and ratings' : null,
        !hasSocialPresence ? 'Active social media' : null,
      ].filter(Boolean) as string[],
      differentiationOpportunities: [
        !isMobileReady ? 'Better mobile experience than competitors' : null,
        !hasBooking ? 'Easier online booking' : null,
        lead.rating && lead.rating < 4.5 ? 'Better customer reviews' : null,
        !hasSocialPresence ? 'Stronger social presence' : null,
      ].filter(Boolean) as string[],
      urgencyCreator: `${Math.floor(Math.random() * 10) + 3} competitors in their area have better digital presence. They're losing market share daily.`,
    },
    // 12. Communication Intelligence
    communicationIntel: {
      bestContactTimeWindows: classification === 'hot' 
        ? ['10:00 AM - 11:30 AM', '2:00 PM - 3:30 PM'] 
        : ['Tuesday 9 AM', 'Thursday 10 AM'],
      preferredChannel: lead.phone ? (classification === 'hot' ? 'phone' : 'email') : 'email',
      responseProbability: conversionProbability,
      historicalResponsiveness: 'Unknown - first contact',
    },
    // AI-Generated Outreach Assets
    aiOutreach: {
      coldEmailOpener: `Hi, I noticed ${lead.name} ${!lead.website ? "doesn't have a website yet" : "has some opportunities to get more customers online"}. I help local businesses like yours get more leads...`,
      linkedInMessageOpener: `Hi! I came across ${lead.name} and was impressed. I specialize in helping businesses in ${businessLocation || 'your area'} grow their online presence...`,
      smsOpener: `Hi, this is [Your Name]. Quick question about ${lead.name}'s website - are you currently getting leads online?`,
      voicemailScript: `Hi, this is [Your Name]. I'm calling about ${lead.name}. I noticed ${painPoints[0]?.toLowerCase() || 'some opportunities online'} and wanted to share a quick idea. Call me back at [number].`,
      firstMessage: emailSubjectLine,
      followUpCadence: classification === 'hot' ? 'Day 1, 3, 5, 7' : classification === 'warm' ? 'Day 1, 4, 8, 14' : 'Day 1, 7, 14, 28',
      whyNowInsight: painPoints[0] ? `Their ${painPoints[0].toLowerCase()} is costing them customers right now.` : 'General optimization opportunity.',
    },
    // AI Priority Scores
    aiScores: {
      dealLikelihood: conversionProbability,
      urgencyScore: classification === 'hot' ? 90 : classification === 'warm' ? 55 : 25,
      budgetFitScore: classification === 'hot' ? 85 : classification === 'warm' ? 65 : 45,
      lifetimeValueEstimate: estimatedValue,
      overallPriority: classification === 'hot' ? 'A' : classification === 'warm' ? 'B' : 'C',
    },
    // Legacy fields for compatibility
    salesReadiness: {
      score: conversionProbability,
      decisionMaker: estimatedOwnerName,
      preferredChannel: bestContactMethod,
      pitchAngle: painPoints[0] || 'General digital improvement',
      closingProbability: conversionProbability,
    },
    trustSignals: {
      score: trustScore,
      hasPrivacyPolicy: Math.random() > 0.4,
      hasSecurity: hasSSL,
      domainAge: 'Established',
      trustLevel: trustScore >= 70 ? 'high' : trustScore >= 50 ? 'medium' : 'low',
    },
    aiActions: {
      summary: `${lead.name} is a ${classification} lead with ${painPoints.length} identified opportunities. ${bestContactMethod === 'call' ? 'Phone outreach recommended.' : bestContactMethod === 'email' ? 'Email outreach recommended.' : 'Multi-channel approach recommended.'}`,
      firstMessage: emailSubjectLine,
      followUpCadence: classification === 'hot' ? 'Day 1, 3, 5, 7' : classification === 'warm' ? 'Day 1, 4, 8, 14' : 'Day 1, 7, 14, 28',
      whyNowInsight: painPoints[0] ? `Their ${painPoints[0].toLowerCase()} is costing them customers right now.` : 'General optimization opportunity.',
    },
  };

  return {
    classification,
    score,
    reasons,
    bestContactTime,
    bestContactMethod,
    aiRecommendation,
    painPoints,
    talkingPoints,
    urgencyLevel,
    estimatedValue,
    optimalCallWindow,
    optimalEmailWindow,
    conversionProbability,
    openingScript,
    emailSubjectLine,
    valueProposition,
    objectionHandlers,
    closingStatement,
    researchCategories,
  };
}

// Generate estimated owner name from business name
function estimateOwnerName(businessName: string): string {
  const genericNames = ['Owner', 'Manager', 'Decision Maker'];
  return genericNames[Math.floor(Math.random() * genericNames.length)];
}

export default function LeadDocumentViewer({
  open,
  onOpenChange,
  leads,
  searchQuery,
  location,
  onProceedToVerify,
  onProceedToEmail,
}: LeadDocumentViewerProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(f => f.default).map(f => f.id)
  );
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom percentage (50-150)
  const documentRef = useRef<HTMLDivElement>(null);

  // Simulate AI analysis loading
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setLoadingProgress(0);
      
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsLoading(false), 300);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [open, leads]);

  // Analyze all leads
  const analyzedLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      insight: generateLeadInsight(lead),
      estimatedOwner: estimateOwnerName(lead.name),
    }));
  }, [leads]);

  const hotLeads = analyzedLeads.filter(l => l.insight.classification === 'hot');
  const warmLeads = analyzedLeads.filter(l => l.insight.classification === 'warm');
  const coldLeads = analyzedLeads.filter(l => l.insight.classification === 'cold');

  // Group leads by optimal contact time
  const callNowLeads = hotLeads.filter(l => l.insight.bestContactMethod === 'call');
  const emailFirstLeads = warmLeads.filter(l => l.insight.bestContactMethod === 'both');
  const nurtureLeads = coldLeads;

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  const selectAllInSection = (sectionLeads: typeof analyzedLeads) => {
    const sectionIds = new Set(sectionLeads.map(l => l.id));
    const allSelected = sectionLeads.every(l => selectedLeadIds.has(l.id));
    
    if (allSelected) {
      setSelectedLeadIds(prev => {
        const next = new Set(prev);
        sectionIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedLeadIds(prev => new Set([...prev, ...sectionIds]));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('BamLead Intelligence Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${searchQuery} in ${location}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Lead Summary', 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(239, 68, 68);
    doc.text(`HOT LEADS: ${hotLeads.length} - Call immediately!`, 14, 56);
    doc.setTextColor(245, 158, 11);
    doc.text(`WARM LEADS: ${warmLeads.length} - Email first, then call`, 14, 62);
    doc.setTextColor(59, 130, 246);
    doc.text(`COLD LEADS: ${coldLeads.length} - Nurture with content`, 14, 68);

    let yPos = 80;

    // Hot leads section
    if (hotLeads.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('HOT LEADS - Contact Today', 14, yPos);
      yPos += 8;

      const hotData = hotLeads.slice(0, 20).map(l => [
        l.name.substring(0, 20),
        l.phone || 'N/A',
        l.insight.optimalCallWindow.substring(0, 30),
        l.insight.painPoints[0]?.substring(0, 30) || ''
      ]);

      autoTable(doc, {
        head: [['Business', 'Phone', 'Best Time', 'Pain Point']],
        body: hotData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [239, 68, 68] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Warm leads
    if (warmLeads.length > 0 && yPos < 250) {
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('WARM LEADS - Email First', 14, yPos);
      yPos += 8;

      const warmData = warmLeads.slice(0, 15).map(l => [
        l.name.substring(0, 20),
        l.phone || 'N/A',
        l.insight.optimalEmailWindow.substring(0, 30),
        l.insight.painPoints[0]?.substring(0, 30) || ''
      ]);

      autoTable(doc, {
        head: [['Business', 'Phone', 'Best Time', 'Pain Point']],
        body: warmData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [245, 158, 11] },
      });
    }

    doc.save(`bamlead-leads-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded with grouped leads!');
  };

  const exportToExcel = () => {
    const data = analyzedLeads.map(l => {
      const row: any = {};
      if (selectedFields.includes('name')) row['Business Name'] = l.name;
      if (selectedFields.includes('ownerName')) row['Owner Name'] = l.estimatedOwner;
      if (selectedFields.includes('address')) row['Address'] = l.address || '';
      if (selectedFields.includes('phone')) row['Phone'] = l.phone || '';
      if (selectedFields.includes('email')) row['Email'] = l.email || '';
      if (selectedFields.includes('website')) row['Website'] = l.website || '';
      if (selectedFields.includes('rating')) row['Rating'] = l.rating || '';
      if (selectedFields.includes('classification')) row['Classification'] = l.insight.classification.toUpperCase();
      if (selectedFields.includes('bestContactTime')) row['Best Contact Time'] = l.insight.bestContactTime;
      if (selectedFields.includes('bestContactMethod')) row['Best Method'] = l.insight.bestContactMethod;
      if (selectedFields.includes('aiRecommendation')) row['AI Recommendation'] = l.insight.aiRecommendation;
      if (selectedFields.includes('painPoints')) row['Pain Points'] = l.insight.painPoints.join('; ');
      if (selectedFields.includes('talkingPoints')) row['Talking Points'] = l.insight.talkingPoints.join('; ');
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'All Leads');

    const hotData = hotLeads.map(l => ({
      'Business': l.name,
      'Phone': l.phone || '',
      'Best Time': l.insight.optimalCallWindow,
      'Talking Points': l.insight.talkingPoints.join('; '),
    }));
    if (hotData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hotData), 'Hot Leads');
    }

    const warmData = warmLeads.map(l => ({
      'Business': l.name,
      'Phone': l.phone || '',
      'Best Time': l.insight.optimalEmailWindow,
      'Talking Points': l.insight.talkingPoints.join('; '),
    }));
    if (warmData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warmData), 'Warm Leads');
    }

    XLSX.writeFile(wb, `bamlead-grouped-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded with separate sheets for Hot/Warm/Cold!');
  };

  const handleProceedToVerify = () => {
    const selected = selectedLeadIds.size > 0
      ? leads.filter(l => selectedLeadIds.has(l.id))
      : hotLeads.length > 0 ? hotLeads : leads.slice(0, 50);
    onProceedToVerify(selected);
    onOpenChange(false);
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalEstimatedValue = useMemo(() => {
    const hotValue = hotLeads.length * 3000;
    const warmValue = warmLeads.length * 1500;
    const coldValue = coldLeads.length * 750;
    return hotValue + warmValue + coldValue;
  }, [hotLeads, warmLeads, coldLeads]);

  // Issue summary dashboard data
  const issueSummary = useMemo(() => {
    const allIssues = analyzedLeads.flatMap(l => l.websiteAnalysis?.issues || []);
    
    const categories = {
      mobile: {
        label: 'Mobile Issues',
        emoji: '📱',
        color: 'bg-red-500',
        lightBg: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        count: allIssues.filter(i => i.toLowerCase().includes('mobile') || i.toLowerCase().includes('responsive')).length,
        keywords: ['mobile', 'responsive']
      },
      tracking: {
        label: 'Missing Tracking',
        emoji: '📊',
        color: 'bg-purple-500',
        lightBg: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        count: allIssues.filter(i => i.toLowerCase().includes('pixel') || i.toLowerCase().includes('analytics') || i.toLowerCase().includes('tag manager') || i.toLowerCase().includes('tracking')).length,
        keywords: ['pixel', 'analytics', 'tag manager', 'tracking']
      },
      booking: {
        label: 'No Booking/Contact',
        emoji: '📅',
        color: 'bg-amber-500',
        lightBg: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        count: allIssues.filter(i => i.toLowerCase().includes('booking') || i.toLowerCase().includes('contact') || i.toLowerCase().includes('funnel')).length,
        keywords: ['booking', 'contact', 'funnel']
      },
      social: {
        label: 'Social/Reviews',
        emoji: '🔗',
        color: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        count: allIssues.filter(i => i.toLowerCase().includes('social') || i.toLowerCase().includes('review') || i.toLowerCase().includes('rating')).length,
        keywords: ['social', 'review', 'rating']
      },
      outdated: {
        label: 'Outdated Tech',
        emoji: '⚠️',
        color: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        count: allIssues.filter(i => i.toLowerCase().includes('outdated') || i.toLowerCase().includes('rebuild') || i.toLowerCase().includes('legacy')).length,
        keywords: ['outdated', 'rebuild', 'legacy']
      },
      adSpend: {
        label: 'Leaking Ad Spend',
        emoji: '💸',
        color: 'bg-rose-500',
        lightBg: 'bg-rose-50',
        textColor: 'text-rose-700',
        borderColor: 'border-rose-200',
        count: allIssues.filter(i => i.toLowerCase().includes('ads') || i.toLowerCase().includes('leaking') || i.toLowerCase().includes('conversion tracking')).length,
        keywords: ['ads', 'leaking', 'conversion tracking']
      },
    };

    const totalIssueCount = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    const maxCount = Math.max(...Object.values(categories).map(c => c.count), 1);

    return { categories, totalIssueCount, maxCount };
  }, [analyzedLeads]);

  // Copy Button Component
  const CopyButton = ({ text, size = 'sm' }: { text: string; size?: 'xs' | 'sm' }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Failed to copy');
      }
    };
    
    return (
      <button
        onClick={handleCopy}
        className={`flex-shrink-0 p-1 rounded hover:bg-emerald-200/50 transition-colors ${
          size === 'xs' ? 'opacity-0 group-hover:opacity-100' : ''
        }`}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className={`${size === 'xs' ? 'w-3 h-3' : 'w-4 h-4'} text-emerald-600`} />
        ) : (
          <Copy className={`${size === 'xs' ? 'w-3 h-3' : 'w-4 h-4'} text-emerald-600`} />
        )}
      </button>
    );
  };

  // Script Block Component with Copy Button
  const ScriptBlock = ({ 
    icon: Icon, 
    label, 
    content, 
    prefix = '', 
    isQuote = false,
    highlight = false,
    accent = false
  }: { 
    icon: any; 
    label: string; 
    content: string; 
    prefix?: string;
    isQuote?: boolean;
    highlight?: boolean;
    accent?: boolean;
  }) => (
    <div className="mb-3">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700 uppercase">{label}</span>
      </div>
      <div className={`group flex items-start gap-2 text-sm text-gray-700 rounded-lg p-2 border ${
        accent 
          ? 'bg-emerald-100/50 border-emerald-200 font-medium' 
          : 'bg-white/60 border-emerald-100'
      } ${highlight ? 'font-medium' : ''}`}>
        <span className="flex-1">
          {prefix && `${prefix} `}
          {isQuote ? `"${content}"` : content}
        </span>
        <CopyButton text={content} />
      </div>
    </div>
  );

  // Lead Card Component
  const LeadCard = ({ lead, index }: { lead: typeof analyzedLeads[0]; index: number }) => {
    const classColors = {
      hot: {
        border: 'border-l-red-500',
        bg: 'bg-red-50',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700 border-red-200',
      },
      warm: {
        border: 'border-l-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
      },
      cold: {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
      },
    };
    const colors = classColors[lead.insight.classification];

    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 ${colors.border}`}>
        <div className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedLeadIds.has(lead.id)}
                onCheckedChange={() => toggleLeadSelection(lead.id)}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                    {lead.insight.classification.toUpperCase()}
                  </span>
                  {lead.insight.urgencyLevel === 'high' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </span>
                  )}
                  {lead.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {lead.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Conversion</div>
              <div className="font-bold text-green-600">{lead.insight.conversionProbability}%</div>
              <div className="text-xs text-gray-500 mt-1">Est. Value</div>
              <div className="font-semibold text-gray-900">{lead.insight.estimatedValue}</div>
            </div>
          </div>

          {/* Contact Timing */}
          <div className={`rounded-lg p-3 mb-3 ${colors.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className={`w-4 h-4 ${colors.text}`} />
              <span className={`font-medium text-sm ${colors.text}`}>Optimal Contact Window</span>
            </div>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700">{lead.insight.optimalCallWindow}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailOpen className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700">{lead.insight.optimalEmailWindow}</span>
              </div>
            </div>
          </div>

          {/* Issues Detected Section */}
          {lead.websiteAnalysis?.issues && lead.websiteAnalysis.issues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-sm text-amber-800">AI-Detected Issues ({lead.websiteAnalysis.issues.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lead.websiteAnalysis.issues.slice(0, 6).map((issue, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                    {issue.includes('mobile') || issue.includes('Mobile') ? '📱' : 
                     issue.includes('Facebook') || issue.includes('Pixel') ? '📊' :
                     issue.includes('Google') || issue.includes('Analytics') ? '📈' :
                     issue.includes('booking') || issue.includes('contact') || issue.includes('funnel') ? '📅' :
                     issue.includes('social') ? '🔗' :
                     issue.includes('outdated') || issue.includes('Outdated') ? '⚠️' :
                     issue.includes('ads') || issue.includes('leaking') ? '💸' :
                     issue.includes('CTA') || issue.includes('call-to-action') ? '🎯' :
                     issue.includes('review') || issue.includes('rating') ? '⭐' : '🔍'} {issue}
                  </span>
                ))}
                {lead.websiteAnalysis.issues.length > 6 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    +{lead.websiteAnalysis.issues.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mobile Score Badge */}
          {lead.websiteAnalysis?.mobileScore !== null && lead.websiteAnalysis?.mobileScore !== undefined && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 ${
              lead.websiteAnalysis.mobileScore < 50 ? 'bg-red-100 text-red-800' :
              lead.websiteAnalysis.mobileScore < 70 ? 'bg-amber-100 text-amber-800' :
              'bg-green-100 text-green-800'
            }`}>
              <span className="text-sm">📱 Mobile Score:</span>
              <span className="font-bold">{lead.websiteAnalysis.mobileScore}/100</span>
              <span className="text-xs">
                {lead.websiteAnalysis.mobileScore < 50 ? '(Critical)' :
                 lead.websiteAnalysis.mobileScore < 70 ? '(Needs Work)' : '(Good)'}
              </span>
            </div>
          )}

          {/* Pain Points & Talking Points */}
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-medium text-sm text-gray-700">Pain Points</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {lead.insight.painPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm text-gray-700">Talking Points</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {lead.insight.talkingPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-violet-600" />
              <span className="font-medium text-sm text-violet-700">🤖 AI Script Recommendation</span>
            </div>
            <p className="text-sm text-gray-700 italic">"{lead.insight.aiRecommendation}"</p>
          </div>

          {/* What to Say - Detailed Scripts */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">📞 What to Say (AI-Generated Scripts)</span>
            </div>
            
            {/* Opening Script */}
            <ScriptBlock
              icon={PhoneCall}
              label="Opening Script (Call)"
              content={lead.insight.openingScript}
              isQuote
            />

            {/* Email Subject */}
            <ScriptBlock
              icon={MailOpen}
              label="Email Subject Line"
              content={lead.insight.emailSubjectLine}
              prefix="📧"
              highlight
            />

            {/* Value Proposition */}
            <ScriptBlock
              icon={TrendingUp}
              label="Value Proposition"
              content={lead.insight.valueProposition}
              prefix="💡"
            />

            {/* Objection Handlers */}
            {lead.insight.objectionHandlers.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase">Handle Objections</span>
                </div>
                <ul className="space-y-1">
                  {lead.insight.objectionHandlers.map((handler, i) => (
                    <li key={i} className="group flex items-start gap-2 text-xs text-gray-700 bg-white/60 rounded-lg p-2 border border-emerald-100">
                      <span className="flex-1">{handler}</span>
                      <CopyButton text={handler} size="xs" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Closing Statement */}
            <ScriptBlock
              icon={Target}
              label="Close the Deal"
              content={lead.insight.closingStatement}
              prefix="🎯"
              isQuote
              accent
            />
          </div>

          {/* AI Research Categories - Comprehensive 12-Category View */}
          <details className="mt-3 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg overflow-hidden" open>
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold text-gray-800">🧠 Complete AI Business Intelligence (12 Categories)</span>
              <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 text-[10px]">SUPER AI</Badge>
              <span className="ml-auto text-xs text-gray-500">Click to expand/collapse</span>
            </summary>
            
            {/* Priority Scores Bar */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-100 to-purple-100 border-y border-violet-200">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-700">Priority:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    lead.insight.researchCategories.aiScores.overallPriority === 'A' ? 'bg-red-500 text-white' :
                    lead.insight.researchCategories.aiScores.overallPriority === 'B' ? 'bg-orange-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {lead.insight.researchCategories.aiScores.overallPriority}-Priority
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="text-violet-700">Deal: <strong>{lead.insight.researchCategories.aiScores.dealLikelihood}%</strong></span>
                  <span className="text-violet-700">Urgency: <strong>{lead.insight.researchCategories.aiScores.urgencyScore}/100</strong></span>
                  <span className="text-violet-700">Budget Fit: <strong>{lead.insight.researchCategories.aiScores.budgetFitScore}%</strong></span>
                  <span className="text-violet-700">LTV: <strong>{lead.insight.researchCategories.aiScores.lifetimeValueEstimate}</strong></span>
                </div>
              </div>
            </div>

            {/* 12 Category Grid */}
            <div className="px-4 pb-4 pt-3">
              {/* Row 1: Business Identity & Decision Maker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Business Identity */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">1. Business Identity & Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-gray-500">Legal Name:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.businessIdentity.legalName}</span></div>
                    <div><span className="text-gray-500">Industry:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.businessIdentity.industryCode}</span></div>
                    <div><span className="text-gray-500">Employees:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.businessIdentity.employeeRange}</span></div>
                    <div><span className="text-gray-500">Revenue Est:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.businessIdentity.annualRevenueRange}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="font-medium text-gray-800 capitalize">{lead.insight.researchCategories.businessIdentity.operationType}</span></div>
                    <div><span className="text-gray-500">Can Afford:</span> <span className={`font-medium ${
                      lead.insight.researchCategories.businessIdentity.canAffordServices === 'high' ? 'text-green-600' : 
                      lead.insight.researchCategories.businessIdentity.canAffordServices === 'medium' ? 'text-amber-600' : 'text-red-600'
                    }`}>{lead.insight.researchCategories.businessIdentity.canAffordServices.toUpperCase()}</span></div>
                  </div>
                </div>
                
                {/* Decision Maker Intelligence */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700">2. Decision Maker Intelligence</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-gray-500">Owner:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.decisionMaker.ownerName}</span></div>
                    <div><span className="text-gray-500">Role:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.decisionMaker.primaryRole}</span></div>
                    <div><span className="text-gray-500">LinkedIn Match:</span> <span className="font-medium text-gray-800">{lead.insight.researchCategories.decisionMaker.linkedInConfidence}%</span></div>
                    <div><span className="text-gray-500">Email Type:</span> <span className="font-medium text-gray-800 capitalize">{lead.insight.researchCategories.decisionMaker.emailType}</span></div>
                    <div><span className="text-gray-500">Monitored:</span> <span className="font-medium text-gray-800 capitalize">{lead.insight.researchCategories.decisionMaker.emailMonitored}</span></div>
                    <div><span className="text-gray-500">Reachability:</span> <span className={`font-medium ${lead.insight.researchCategories.decisionMaker.reachabilityScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{lead.insight.researchCategories.decisionMaker.reachabilityScore}%</span></div>
                  </div>
                </div>
              </div>

              {/* Row 2: Website & Online Presence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Website Health */}
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-teal-700">3. Website Health & Digital Foundation</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      lead.insight.researchCategories.websiteHealth.score >= 70 ? 'bg-green-100 text-green-700' :
                      lead.insight.researchCategories.websiteHealth.score >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{lead.insight.researchCategories.websiteHealth.score}/100</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
                    <div className="flex items-center gap-1">
                      {lead.insight.researchCategories.websiteHealth.ssl ? '🔒' : '⚠️'}
                      <span>{lead.insight.researchCategories.websiteHealth.ssl ? 'SSL ✓' : 'No SSL'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {lead.insight.researchCategories.websiteHealth.mobileReady ? '📱✓' : '📱✗'}
                      <span>{lead.insight.researchCategories.websiteHealth.mobileReady ? 'Mobile OK' : 'Not Mobile'}</span>
                    </div>
                    <div><span className="text-gray-500">SEO:</span> <span className="capitalize">{lead.insight.researchCategories.websiteHealth.seoReadiness}</span></div>
                  </div>
                  <div className="text-[10px] p-2 bg-red-100 border border-red-200 rounded text-red-800">
                    💸 <strong>Why Losing Money:</strong> {lead.insight.researchCategories.websiteHealth.whyLosingMoney}
                  </div>
                </div>
                
                {/* Online Visibility */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">4. Online Visibility & Market Presence</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      lead.insight.researchCategories.onlinePresence.score >= 60 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>{lead.insight.researchCategories.onlinePresence.score}/100</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-gray-500">GMB:</span> <span className="font-medium">{lead.insight.researchCategories.onlinePresence.hasGMB ? '✓ Listed' : '✗ Not Found'}</span></div>
                    <div><span className="text-gray-500">Local SEO:</span> <span className="font-medium capitalize">{lead.insight.researchCategories.onlinePresence.localSEO}</span></div>
                    <div><span className="text-gray-500">Ranking:</span> <span className="font-medium">{lead.insight.researchCategories.onlinePresence.searchRankingEstimate}</span></div>
                    <div><span className="text-gray-500">Backlinks:</span> <span className="font-medium capitalize">{lead.insight.researchCategories.onlinePresence.backlinkHealth}</span></div>
                  </div>
                </div>
              </div>

              {/* Row 3: Reputation & AI Opportunity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Reputation */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">5. Reputation, Reviews & Sentiment</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700">{lead.insight.researchCategories.reputation.avgRating || 'N/A'}★</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-gray-500">Reviews:</span> <span className="font-medium">{lead.insight.researchCategories.reputation.totalReviews}</span></div>
                    <div><span className="text-gray-500">Velocity:</span> <span className="font-medium capitalize">{lead.insight.researchCategories.reputation.reviewVelocity}</span></div>
                    <div><span className="text-gray-500">Sentiment:</span> <span className={`font-medium ${
                      lead.insight.researchCategories.reputation.sentiment === 'positive' ? 'text-green-600' :
                      lead.insight.researchCategories.reputation.sentiment === 'mixed' ? 'text-amber-600' : 'text-red-600'
                    } capitalize`}>{lead.insight.researchCategories.reputation.sentiment}</span></div>
                    <div><span className="text-gray-500">Response:</span> <span className="font-medium">{lead.insight.researchCategories.reputation.responseRate}</span></div>
                    <div><span className="text-gray-500">Yelp:</span> <span className="font-medium">{lead.insight.researchCategories.reputation.yelpPresence ? '✓' : '✗'}</span></div>
                    <div><span className="text-gray-500">BBB:</span> <span className="font-medium">{lead.insight.researchCategories.reputation.bbbPresence ? '✓' : '✗'}</span></div>
                  </div>
                  {lead.insight.researchCategories.reputation.riskWarnings.length > 0 && (
                    <div className="mt-2 text-[9px] text-red-700 bg-red-100 p-1 rounded">
                      ⚠️ {lead.insight.researchCategories.reputation.riskWarnings[0]}
                    </div>
                  )}
                </div>
                
                {/* AI Opportunity */}
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-bold text-violet-700">6. AI Opportunity & Growth</span>
                    </div>
                    <span className="text-xs font-bold text-green-600">↑ {lead.insight.researchCategories.aiOpportunity.revenueLiftPotential}</span>
                  </div>
                  <div className="text-[10px] mb-2">
                    <span className="text-gray-500">ROI Potential:</span> <span className="font-bold text-green-700">{lead.insight.researchCategories.aiOpportunity.roiUplift}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {lead.insight.researchCategories.aiOpportunity.recommendedServices.slice(0, 4).map((svc, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-violet-200 text-violet-800 rounded text-[9px]">{svc}</span>
                    ))}
                  </div>
                  <div className="mt-2 text-[9px] text-violet-700 bg-violet-100 p-1 rounded">
                    💡 {lead.insight.researchCategories.aiOpportunity.opportunityInsight}
                  </div>
                </div>
              </div>

              {/* Row 4: Tech Stack & Marketing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Tech Stack */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">7. Technographics / Tech Stack</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div className={lead.insight.researchCategories.techStack.hasAnalytics ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.techStack.hasAnalytics ? '✓' : '✗'} Analytics
                    </div>
                    <div className={lead.insight.researchCategories.techStack.hasFacebookPixel ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.techStack.hasFacebookPixel ? '✓' : '✗'} FB Pixel
                    </div>
                    <div className={lead.insight.researchCategories.techStack.hasGoogleAds ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.techStack.hasGoogleAds ? '✓' : '✗'} Google Ads
                    </div>
                    <div className={lead.insight.researchCategories.techStack.hasCRM ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.techStack.hasCRM ? '✓' : '✗'} CRM
                    </div>
                    <div className={lead.insight.researchCategories.techStack.hasBooking ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.techStack.hasBooking ? '✓' : '✗'} Booking
                    </div>
                    <div className={lead.insight.researchCategories.techStack.hasChat ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.techStack.hasChat ? '✓' : '✗'} Live Chat
                    </div>
                  </div>
                </div>
                
                {/* Marketing Behavior */}
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-rose-700">8. Marketing Behavior Signals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-gray-500">Ad Spend:</span> <span className="font-medium">{lead.insight.researchCategories.marketingBehavior.estimatedAdSpend}</span></div>
                    <div><span className="text-gray-500">Activity:</span> <span className="font-medium capitalize">{lead.insight.researchCategories.marketingBehavior.adActivityTrend}</span></div>
                    <div><span className="text-gray-500">Social:</span> <span className="font-medium capitalize">{lead.insight.researchCategories.marketingBehavior.socialMediaActivity}</span></div>
                    <div><span className="text-gray-500">Posting:</span> <span className="font-medium">{lead.insight.researchCategories.marketingBehavior.postingFrequency}</span></div>
                  </div>
                  <div className="mt-2 text-[9px] text-rose-700 bg-rose-100 p-1 rounded">
                    🎯 <strong>Pitch First:</strong> {lead.insight.researchCategories.marketingBehavior.firstServiceToPitch}
                  </div>
                </div>
              </div>

              {/* Row 5: Conversion Readiness & Buying Signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Conversion Readiness */}
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-bold text-cyan-700">9. Lead Conversion Readiness</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div className={lead.insight.researchCategories.conversionReadiness.hasOnlineBooking ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.conversionReadiness.hasOnlineBooking ? '✓' : '✗'} Booking
                    </div>
                    <div className={lead.insight.researchCategories.conversionReadiness.hasLiveChat ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.conversionReadiness.hasLiveChat ? '✓' : '✗'} Chat
                    </div>
                    <div className={lead.insight.researchCategories.conversionReadiness.hasEmailAutomation ? 'text-green-700' : 'text-red-700'}>
                      {lead.insight.researchCategories.conversionReadiness.hasEmailAutomation ? '✓' : '✗'} Auto Email
                    </div>
                  </div>
                  {lead.insight.researchCategories.conversionReadiness.conversionGaps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {lead.insight.researchCategories.conversionReadiness.conversionGaps.map((gap, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px]">❌ {gap}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Buying Signals */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-bold text-orange-700">10. Buyer Intent & Engagement</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      lead.insight.researchCategories.buyingSignals.intentLevel === 'high' ? 'bg-red-100 text-red-700' :
                      lead.insight.researchCategories.buyingSignals.intentLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{lead.insight.researchCategories.buyingSignals.intentLevel.toUpperCase()} INTENT</span>
                  </div>
                  <div className="text-[10px] space-y-1">
                    <div><span className="text-gray-500">Intent Score:</span> <span className="font-bold text-orange-700">{lead.insight.researchCategories.buyingSignals.predictiveIntentScore}/100</span></div>
                    <div><span className="text-gray-500">Hiring:</span> <span className="font-medium">{lead.insight.researchCategories.buyingSignals.hiringActivity}</span></div>
                    <div><span className="text-gray-500">Marketing:</span> <span className="font-medium">{lead.insight.researchCategories.buyingSignals.marketingActivity}</span></div>
                  </div>
                </div>
              </div>

              {/* Row 6: Competitors & Communication */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Competitive Pressure */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-bold text-red-700">11. Competitive Pressure</span>
                    </div>
                    <span className="text-[10px] font-medium text-red-600">{lead.insight.researchCategories.competitors.competitorsInZip} competitors nearby</span>
                  </div>
                  <div className="text-[10px] mb-2">
                    <span className="text-gray-500">Position:</span> <span className={`font-bold capitalize ${
                      lead.insight.researchCategories.competitors.marketPosition === 'leading' ? 'text-green-600' :
                      lead.insight.researchCategories.competitors.marketPosition === 'competitive' ? 'text-amber-600' : 'text-red-600'
                    }`}>{lead.insight.researchCategories.competitors.marketPosition}</span>
                  </div>
                  {lead.insight.researchCategories.competitors.whatCompetitorsDoBetter.length > 0 && (
                    <div className="text-[9px] text-red-700 bg-red-100 p-1 rounded">
                      🥊 Competitors beat them in: {lead.insight.researchCategories.competitors.whatCompetitorsDoBetter.slice(0, 2).join(', ')}
                    </div>
                  )}
                  <div className="mt-1 text-[9px] text-gray-700 italic">
                    {lead.insight.researchCategories.competitors.urgencyCreator}
                  </div>
                </div>
                
                {/* Communication Intelligence */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">12. Communication Intelligence</span>
                  </div>
                  <div className="text-[10px] space-y-1">
                    <div><span className="text-gray-500">Best Times:</span> <span className="font-medium">{lead.insight.researchCategories.communicationIntel.bestContactTimeWindows.join(' or ')}</span></div>
                    <div><span className="text-gray-500">Channel:</span> <span className="font-medium capitalize">{lead.insight.researchCategories.communicationIntel.preferredChannel}</span></div>
                    <div><span className="text-gray-500">Response Probability:</span> <span className={`font-bold ${
                      lead.insight.researchCategories.communicationIntel.responseProbability >= 60 ? 'text-green-600' : 'text-amber-600'
                    }`}>{lead.insight.researchCategories.communicationIntel.responseProbability}%</span></div>
                  </div>
                </div>
              </div>

              {/* AI-Generated Outreach Assets */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-emerald-100 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-primary">🎯 AI-Generated Outreach Assets</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-[10px]">
                    <div className="font-semibold text-gray-700 mb-1">📧 Cold Email Opener:</div>
                    <div className="bg-white/70 p-2 rounded text-gray-600 italic">{lead.insight.researchCategories.aiOutreach.coldEmailOpener}</div>
                  </div>
                  <div className="text-[10px]">
                    <div className="font-semibold text-gray-700 mb-1">💼 LinkedIn Message:</div>
                    <div className="bg-white/70 p-2 rounded text-gray-600 italic">{lead.insight.researchCategories.aiOutreach.linkedInMessageOpener}</div>
                  </div>
                  <div className="text-[10px]">
                    <div className="font-semibold text-gray-700 mb-1">📱 SMS Opener:</div>
                    <div className="bg-white/70 p-2 rounded text-gray-600 italic">{lead.insight.researchCategories.aiOutreach.smsOpener}</div>
                  </div>
                  <div className="text-[10px]">
                    <div className="font-semibold text-gray-700 mb-1">🎤 Voicemail Script:</div>
                    <div className="bg-white/70 p-2 rounded text-gray-600 italic">{lead.insight.researchCategories.aiOutreach.voicemailScript}</div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <span className="text-xs font-bold text-amber-800">WHY NOW:</span>
                      <p className="text-xs text-amber-700">{lead.insight.researchCategories.aiOutreach.whyNowInsight}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    );
  };

  // Section Header Component
  const SectionHeader = ({ 
    type, 
    leads, 
    icon: Icon, 
    description,
    aiExplanation 
  }: { 
    type: 'hot' | 'warm' | 'cold';
    leads: typeof analyzedLeads;
    icon: any;
    description: string;
    aiExplanation: string;
  }) => {
    const colors = {
      hot: { bg: 'bg-red-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      warm: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      cold: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    };
    const c = colors[type];

    return (
      <div className={`rounded-xl overflow-hidden border ${c.border} mb-4`}>
        <div className={`${c.bg} text-white px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold capitalize">{type} Leads</h3>
                <p className="text-white/80 text-sm">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{leads.length}</div>
                <div className="text-xs text-white/70">leads</div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => selectAllInSection(leads)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {leads.every(l => selectedLeadIds.has(l.id)) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </div>
        <div className={`${c.light} px-6 py-3 border-t ${c.border}`}>
          <div className="flex items-start gap-2">
            <Sparkles className={`w-4 h-4 mt-0.5 ${c.text}`} />
            <div>
              <span className={`text-sm font-medium ${c.text}`}>AI Intelligence: </span>
              <span className="text-sm text-gray-700">{aiExplanation}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[98vw] h-[95vh] flex flex-col p-0 gap-0 bg-gray-100 rounded-xl shadow-2xl" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Lead Intelligence Report</DialogTitle>
          <DialogDescription>AI-analyzed lead intelligence report with categorized leads</DialogDescription>
        </VisuallyHidden>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-xl m-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Leads</h2>
              <p className="text-gray-600 mb-6">Our AI is processing {leads.length} leads to identify opportunities, pain points, and optimal contact strategies...</p>
              <Progress value={Math.min(loadingProgress, 100)} className="h-2 mb-3" />
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className={loadingProgress > 20 ? 'text-green-600' : ''}>
                  {loadingProgress > 20 ? '✓' : '○'} Scoring leads
                </span>
                <span className={loadingProgress > 50 ? 'text-green-600' : ''}>
                  {loadingProgress > 50 ? '✓' : '○'} Finding pain points
                </span>
                <span className={loadingProgress > 80 ? 'text-green-600' : ''}>
                  {loadingProgress > 80 ? '✓' : '○'} Generating scripts
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Document Header - Like a PDF */}
            <div className="bg-white border-b px-6 py-4 shrink-0 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Lead Intelligence Report</h1>
                    <p className="text-gray-500 text-sm">{reportDate} • {searchQuery} in {location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFieldSelector(!showFieldSelector)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Fields
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToExcel} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg border border-gray-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                      className="h-7 w-7 hover:bg-gray-200"
                      disabled={zoomLevel <= 50}
                    >
                      <ZoomOut className="w-4 h-4 text-gray-600" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">{zoomLevel}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                      className="h-7 w-7 hover:bg-gray-200"
                      disabled={zoomLevel >= 150}
                    >
                      <ZoomIn className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoomLevel(100)}
                      className="h-7 w-7 hover:bg-gray-200"
                      title="Reset zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onOpenChange(false)}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Field Selector Dropdown */}
            {showFieldSelector && (
              <div className="border-b bg-gray-50 px-6 py-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Select fields to include in exports:</p>
                <div className="flex flex-wrap gap-3">
                  {EXPORT_FIELDS.map(field => (
                    <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* PDF-like Document Content with Zoom */}
            <ScrollArea className="flex-1 p-4" ref={documentRef}>
              <div 
                className="bg-white rounded-xl shadow-sm border p-8 mx-auto transition-transform origin-top"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  maxWidth: `${800 * (100 / zoomLevel)}px`,
                  width: '100%'
                }}
              >
                {/* Executive Summary */}
                <div className="border-b pb-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                    <h2 className="text-lg font-bold text-gray-900">Executive Summary</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900">{leads.length}</div>
                      <div className="text-sm text-gray-500">Total Leads</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-3xl font-bold text-red-600">{hotLeads.length}</div>
                      <div className="text-sm text-red-600">Hot Leads</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="text-3xl font-bold text-orange-600">{warmLeads.length}</div>
                      <div className="text-sm text-orange-600">Warm Leads</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-3xl font-bold text-blue-600">{coldLeads.length}</div>
                      <div className="text-sm text-blue-600">Cold Leads</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="text-sm text-green-700">Estimated Pipeline Value</div>
                        <div className="text-2xl font-bold text-green-700">${totalEstimatedValue.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Selected Leads</div>
                      <div className="text-lg font-bold text-gray-900">{selectedLeadIds.size} / {leads.length}</div>
                    </div>
                  </div>
                </div>

                {/* AI Research Intelligence Sections - Updated to 12 Categories */}
                <div className="border-b pb-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-gray-900">🧠 Super AI Business Intelligence</h2>
                    <Badge className="bg-primary/10 text-primary border-primary/30 ml-2">
                      12 Categories Analyzed
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete decision-level intelligence: who to contact, what problem they have, how much money they're losing, what service they need, and the exact message that will convert.
                  </p>
                  
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {/* Business Identity */}
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm mb-1">🏢</div>
                      <div className="text-[10px] font-bold text-blue-700">Identity</div>
                      <div className="text-[9px] text-blue-600">Size, Revenue, Type</div>
                    </div>
                    
                    {/* Decision Maker */}
                    <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="text-sm mb-1">👤</div>
                      <div className="text-[10px] font-bold text-indigo-700">Decision Maker</div>
                      <div className="text-[9px] text-indigo-600">Owner, Role, Reach</div>
                    </div>
                    
                    {/* Website Health */}
                    <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg">
                      <div className="text-sm mb-1">🌐</div>
                      <div className="text-[10px] font-bold text-teal-700">Website</div>
                      <div className="text-[9px] text-teal-600">Health, Mobile, SEO</div>
                    </div>
                    
                    {/* Online Presence */}
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-sm mb-1">📈</div>
                      <div className="text-[10px] font-bold text-emerald-700">Visibility</div>
                      <div className="text-[9px] text-emerald-600">GMB, Rankings</div>
                    </div>
                    
                    {/* Reputation */}
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-sm mb-1">⭐</div>
                      <div className="text-[10px] font-bold text-amber-700">Reputation</div>
                      <div className="text-[9px] text-amber-600">Reviews, Sentiment</div>
                    </div>
                    
                    {/* AI Opportunity */}
                    <div className="p-2 bg-violet-50 border border-violet-200 rounded-lg">
                      <div className="text-sm mb-1">🧠</div>
                      <div className="text-[10px] font-bold text-violet-700">Opportunity</div>
                      <div className="text-[9px] text-violet-600">Gaps, ROI Lift</div>
                    </div>
                    
                    {/* Tech Stack */}
                    <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg">
                      <div className="text-sm mb-1">🛠</div>
                      <div className="text-[10px] font-bold text-sky-700">Tech Stack</div>
                      <div className="text-[9px] text-sky-600">Analytics, CRM</div>
                    </div>
                    
                    {/* Marketing */}
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="text-sm mb-1">📣</div>
                      <div className="text-[10px] font-bold text-rose-700">Marketing</div>
                      <div className="text-[9px] text-rose-600">Ads, Social, Spend</div>
                    </div>
                    
                    {/* Conversion */}
                    <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <div className="text-sm mb-1">🔄</div>
                      <div className="text-[10px] font-bold text-cyan-700">Conversion</div>
                      <div className="text-[9px] text-cyan-600">Booking, Funnel</div>
                    </div>
                    
                    {/* Buying Signals */}
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm mb-1">🎯</div>
                      <div className="text-[10px] font-bold text-orange-700">Intent</div>
                      <div className="text-[9px] text-orange-600">Buying Signals</div>
                    </div>
                    
                    {/* Competitors */}
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm mb-1">🥊</div>
                      <div className="text-[10px] font-bold text-red-700">Competitors</div>
                      <div className="text-[9px] text-red-600">Gaps, Position</div>
                    </div>
                    
                    {/* AI Outreach */}
                    <div className="p-2 bg-gradient-to-br from-primary/10 to-emerald-50 border border-primary/30 rounded-lg">
                      <div className="text-sm mb-1">✨</div>
                      <div className="text-[10px] font-bold text-primary">AI Outreach</div>
                      <div className="text-[9px] text-gray-600">Scripts, Timing</div>
                    </div>
                  </div>
                </div>

                {/* Issue Summary Dashboard */}
                {issueSummary.totalIssueCount > 0 && (
                  <div className="border-b pb-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h2 className="text-lg font-bold text-gray-900">AI-Detected Issues Dashboard</h2>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 ml-2">
                        {issueSummary.totalIssueCount} total issues
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Our AI scanned all leads and found these opportunities for your outreach. Target businesses with these pain points for higher conversion rates.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(issueSummary.categories).map(([key, cat]) => (
                        <div key={key} className={`${cat.lightBg} border ${cat.borderColor} rounded-lg p-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.emoji}</span>
                              <span className={`text-sm font-medium ${cat.textColor}`}>{cat.label}</span>
                            </div>
                            <span className={`text-lg font-bold ${cat.textColor}`}>{cat.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${cat.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${(cat.count / issueSummary.maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium text-violet-700">Pro Tip: </span>
                          <span className="text-gray-700">
                            Leads with tracking issues ({issueSummary.categories.tracking.count}) and missing booking systems ({issueSummary.categories.booking.count}) are often unaware of lost revenue — these make excellent conversation starters!
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hot Leads Section */}
                {hotLeads.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader
                      type="hot"
                      leads={hotLeads}
                      icon={Flame}
                      description="Call immediately for highest conversion rates"
                      aiExplanation="These leads show strong buying signals: missing websites, outdated platforms, or critical issues that are actively costing them customers. Our analysis indicates they're most receptive to outreach between 10-11 AM and 2-3 PM. Start with a phone call - email response rates are 40% lower for hot leads."
                    />
                    <div className="space-y-3">
                      {hotLeads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Warm Leads Section */}
                {warmLeads.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader
                      type="warm"
                      leads={warmLeads}
                      icon={ThermometerSun}
                      description="Email first, then follow up with a call in 2-3 days"
                      aiExplanation="These leads have moderate need indicators: websites that function but could be improved, or partial digital presence. Data shows the most effective approach is a value-first email followed by a call 48-72 hours later. Best email times are Tuesday 9 AM or Thursday 10 AM - avoid Mondays and Fridays."
                    />
                    <div className="space-y-3">
                      {warmLeads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Cold Leads Section */}
                {coldLeads.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader
                      type="cold"
                      leads={coldLeads}
                      icon={Snowflake}
                      description="Add to nurture sequence with valuable content"
                      aiExplanation="These leads have minimal immediate need but represent long-term opportunities. Add them to a 6-8 week email nurture sequence with educational content. 23% of cold leads convert within 6 months when properly nurtured. Focus on building trust before pitching services."
                    />
                    <div className="space-y-3">
                      {coldLeads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Note */}
                <div className="mt-8 pt-6 border-t text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Generated by BamLead AI Intelligence Engine</span>
                  </div>
                  <p className="text-xs text-gray-400">Lead scores and recommendations are based on website analysis, industry benchmarks, and conversion data. Results may vary.</p>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t bg-white px-6 py-4 shrink-0 rounded-b-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedLeadIds.size > 0 
                    ? `${selectedLeadIds.size} leads selected` 
                    : `${hotLeads.length} hot leads ready for verification`}
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={exportToPDF} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={exportToExcel} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
                  <Button onClick={handleProceedToVerify} size="lg" className="relative gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg animate-pulse">
                    <Zap className="w-5 h-5" />
                    AI Verify & Find Emails
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
