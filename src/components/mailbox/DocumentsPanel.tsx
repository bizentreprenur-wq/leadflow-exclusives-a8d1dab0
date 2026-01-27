import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FileText, Globe, MapPin, Send, Copy, Eye, Edit3, Save, X, Sparkles, Download
} from 'lucide-react';

// Full template content for editing
interface DocumentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  forLeadType: 'gmb' | 'platform' | 'both';
  fullContent: string;
}

// Helper to create content strings without template literal issues
const createContent = (lines: string[]) => lines.join('\n');

// ============================================
// GMB (Super AI) - 10 PROPOSALS
// ============================================
const GMB_PROPOSALS: DocumentTemplate[] = [
  {
    id: 'gmb-optimization',
    name: 'Google Business Profile Optimization',
    icon: '📍',
    description: 'Complete GMB setup, optimization, and management for local visibility.',
    category: 'Local SEO',
    forLeadType: 'gmb',
    fullContent: createContent([
      'GOOGLE BUSINESS PROFILE OPTIMIZATION PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'EXECUTIVE SUMMARY',
      'Your Google Business Profile is your digital storefront. We will optimize it to attract more local customers and improve your visibility in Google Maps and local search results.',
      '',
      'SERVICES INCLUDED:',
      '✓ Complete profile audit and optimization',
      '✓ Photo upload and management (up to 20 professional images)',
      '✓ Business description rewrite with local keywords',
      '✓ Service/product catalog setup',
      '✓ Q&A management and optimization',
      '✓ Review response strategy',
      '✓ Weekly post publishing (4 per month)',
      '✓ Performance tracking and monthly reports',
      '',
      'TIMELINE: 2 weeks for initial optimization, then ongoing management',
      '',
      'INVESTMENT:',
      '• One-time setup: $500',
      '• Monthly management: $299/month',
      '',
      'NEXT STEPS:',
      'Reply to this email to schedule a quick call, or sign below to get started.',
      '',
      'Signature: _______________________',
      'Date: ___________________________',
    ]),
  },
  {
    id: 'reputation-management',
    name: 'Reputation Management Package',
    icon: '⭐',
    description: 'Review generation, monitoring, and response management services.',
    category: 'Reputation',
    forLeadType: 'gmb',
    fullContent: createContent([
      'REPUTATION MANAGEMENT PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'THE PROBLEM:',
      '88% of consumers trust online reviews as much as personal recommendations. Without a system to generate and manage reviews, you are losing customers to competitors.',
      '',
      'OUR SOLUTION:',
      'We will implement a complete reputation management system that generates positive reviews and handles negative feedback professionally.',
      '',
      'WHAT IS INCLUDED:',
      '✓ Review generation campaign setup',
      '✓ Automated review request system (email + SMS)',
      '✓ 24-hour response to all reviews',
      '✓ Negative review resolution protocol',
      '✓ Monthly reputation report',
      '✓ Competitor review monitoring',
      '✓ Review widgets for your website',
      '',
      'EXPECTED RESULTS:',
      '• 3-5x increase in monthly reviews',
      '• Average rating improvement of 0.3-0.5 stars',
      '• 25% increase in customer trust',
      '',
      'INVESTMENT: $399/month',
      '',
      'GUARANTEE: If you do not see at least 10 new reviews in the first 60 days, your third month is free.',
      '',
      'Ready to build a 5-star reputation? Reply "YES" to get started.',
    ]),
  },
  {
    id: 'local-seo',
    name: 'Local SEO & Citations Package',
    icon: '🗺️',
    description: 'Local search optimization with directory citations and NAP consistency.',
    category: 'Local SEO',
    forLeadType: 'gmb',
    fullContent: createContent([
      'LOCAL SEO & CITATIONS PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'WHY LOCAL SEO MATTERS:',
      '46% of all Google searches are looking for local information. If you are not ranking in the local pack, you are invisible to half your potential customers.',
      '',
      'OUR LOCAL SEO PACKAGE INCLUDES:',
      '',
      'CITATION BUILDING:',
      '✓ 50+ directory submissions (Yelp, YP, BBB, etc.)',
      '✓ NAP consistency audit and correction',
      '✓ Industry-specific directory submissions',
      '✓ Local business association listings',
      '',
      'ON-PAGE LOCAL SEO:',
      '✓ Location page optimization',
      '✓ Local schema markup implementation',
      '✓ City/neighborhood keyword targeting',
      '✓ Mobile optimization review',
      '',
      'INVESTMENT:',
      '• Setup fee: $750 (one-time)',
      '• Monthly management: $499/month',
      '• Minimum commitment: 6 months',
      '',
      'Reply to discuss your local market dominance strategy.',
    ]),
  },
  {
    id: 'local-ads',
    name: 'Local Google Ads Campaign',
    icon: '📢',
    description: 'Targeted local advertising to drive foot traffic and calls.',
    category: 'Advertising',
    forLeadType: 'gmb',
    fullContent: createContent([
      'LOCAL GOOGLE ADS PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'GET CUSTOMERS NOW:',
      'While SEO builds long-term visibility, Google Ads puts you in front of customers actively searching for your services TODAY.',
      '',
      'CAMPAIGN STRUCTURE:',
      '✓ Search campaigns targeting local keywords',
      '✓ Local Services Ads setup (if applicable)',
      '✓ Call-only campaigns for mobile users',
      '✓ Remarketing to website visitors',
      '',
      'INVESTMENT:',
      '• Management fee: $500/month',
      '• Recommended ad spend: $1,000-3,000/month',
      '• Setup fee: $300 (waived with 6-month commitment)',
      '',
      'EXPECTED RESULTS:',
      '• Cost per lead: $15-50 (industry dependent)',
      '• 3-5x return on ad spend',
      '• Calls and form submissions within 48 hours',
      '',
      'Ready to start getting calls this week? Let us talk.',
    ]),
  },
  {
    id: 'gmb-photos',
    name: 'Professional Photo Package',
    icon: '📸',
    description: 'Professional photography for your Google Business Profile.',
    category: 'Branding',
    forLeadType: 'gmb',
    fullContent: createContent([
      'PROFESSIONAL PHOTO PACKAGE',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'FIRST IMPRESSIONS MATTER:',
      'Businesses with photos receive 42% more requests for directions and 35% more clicks to their website.',
      '',
      'PHOTO PACKAGE INCLUDES:',
      '✓ 2-hour on-site photo session',
      '✓ 25+ professionally edited photos',
      '✓ Exterior shots (storefront, signage)',
      '✓ Interior atmosphere shots',
      '✓ Team/staff photos',
      '✓ Product/service photos',
      '',
      'INVESTMENT: $450 (one-time)',
      '',
      'ADD-ONS:',
      '• Drone photography: +$200',
      '• Video walkthrough: +$350',
      '',
      'Book your session this week and receive a free social media graphics pack ($100 value).',
    ]),
  },
  {
    id: 'review-recovery',
    name: 'Negative Review Recovery',
    icon: '🔄',
    description: 'Turn negative reviews into opportunities.',
    category: 'Reputation',
    forLeadType: 'gmb',
    fullContent: createContent([
      'NEGATIVE REVIEW RECOVERY PLAN',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Current Rating: [CURRENT_RATING] stars',
      'Date: [DATE]',
      '',
      'THE SITUATION:',
      'Negative reviews are hurting your business. Every 1-star decrease in rating can mean a 5-9% drop in revenue.',
      '',
      'OUR RECOVERY STRATEGY:',
      '',
      'IMMEDIATE ACTIONS (Week 1):',
      '✓ Professional response to all negative reviews',
      '✓ Direct outreach to dissatisfied customers',
      '✓ Flag fake/spam reviews for removal',
      '',
      'ONGOING RECOVERY (Weeks 2-8):',
      '✓ Aggressive positive review generation',
      '✓ Customer satisfaction follow-up system',
      '✓ Weekly progress reports',
      '',
      'INVESTMENT:',
      '• Recovery program (8 weeks): $1,200',
      '• Ongoing protection: $249/month',
      '',
      'GUARANTEE: We will improve your rating by at least 0.5 stars in 90 days.',
    ]),
  },
  {
    id: 'maps-ranking',
    name: 'Google Maps Ranking Boost',
    icon: '📈',
    description: 'Rank higher in Google Maps for your key services.',
    category: 'Local SEO',
    forLeadType: 'gmb',
    fullContent: createContent([
      'GOOGLE MAPS RANKING BOOST',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'THE GOAL:',
      'Get your business into the Google Maps "3-pack" for your most valuable keywords.',
      '',
      'RANKING FACTORS WE WILL OPTIMIZE:',
      '',
      'RELEVANCE:',
      '✓ Category optimization',
      '✓ Service keyword integration',
      '✓ Business description enhancement',
      '',
      'PROMINENCE:',
      '✓ Citation building (50+ directories)',
      '✓ Review velocity increase',
      '✓ Local link acquisition',
      '',
      'MONTHLY ACTIVITIES:',
      '• 10 new citations',
      '• 4 GMB posts',
      '• Review generation campaign',
      '• Ranking report with heat maps',
      '',
      'INVESTMENT: $599/month',
      'Minimum commitment: 6 months',
      '',
      'Track record: 78% of clients reach the 3-pack within 6 months.',
    ]),
  },
  {
    id: 'multi-location',
    name: 'Multi-Location Management',
    icon: '🏢',
    description: 'Manage multiple Google Business Profiles efficiently.',
    category: 'Enterprise',
    forLeadType: 'gmb',
    fullContent: createContent([
      'MULTI-LOCATION MANAGEMENT PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Number of Locations: [LOCATION_COUNT]',
      'Date: [DATE]',
      '',
      'THE CHALLENGE:',
      'Managing multiple locations means multiplied complexity. Inconsistent information and fragmented reporting hurt your brand.',
      '',
      'CENTRALIZED MANAGEMENT SOLUTION:',
      '',
      'PER-LOCATION SERVICES:',
      '✓ Profile optimization and maintenance',
      '✓ Review monitoring and response',
      '✓ Weekly posts (4 per location)',
      '✓ Photo management',
      '',
      'ENTERPRISE FEATURES:',
      '✓ Centralized dashboard access',
      '✓ Brand consistency enforcement',
      '✓ Cross-location performance comparison',
      '✓ Dedicated account manager',
      '',
      'INVESTMENT (per location/month):',
      '• 2-5 locations: $199/location',
      '• 6-10 locations: $179/location',
      '• 11-25 locations: $149/location',
      '• 26+ locations: Custom pricing',
    ]),
  },
  {
    id: 'gmb-emergency',
    name: 'GMB Emergency Recovery',
    icon: '🚨',
    description: 'Recover suspended or hacked Google Business Profile.',
    category: 'Emergency',
    forLeadType: 'gmb',
    fullContent: createContent([
      'GMB EMERGENCY RECOVERY SERVICE',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Issue Type: [ISSUE_TYPE]',
      'Date: [DATE]',
      '',
      'YOUR SITUATION:',
      'A suspended or compromised Google Business Profile means you are invisible to local customers. Every day costs you money.',
      '',
      'EMERGENCY SERVICES:',
      '',
      'SUSPENSION RECOVERY:',
      '✓ Root cause analysis',
      '✓ Violation identification',
      '✓ Reinstatement request preparation',
      '✓ Appeal management',
      '',
      'TIMELINE:',
      '• Assessment: 24-48 hours',
      '• Recovery action: 48-72 hours',
      '• Resolution: 1-3 weeks (Google dependent)',
      '',
      'INVESTMENT:',
      '• Emergency assessment: $250',
      '• Full recovery service: $750-1,500',
      '• Rush service: +$500',
      '',
      'SUCCESS RATE: 92% of suspensions successfully reinstated.',
    ]),
  },
  {
    id: 'local-starter',
    name: 'Local Business Starter Package',
    icon: '🚀',
    description: 'Everything a new local business needs to get found online.',
    category: 'Starter',
    forLeadType: 'gmb',
    fullContent: createContent([
      'LOCAL BUSINESS STARTER PACKAGE',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'PERFECT FOR: New businesses or those just starting their digital presence.',
      '',
      'EVERYTHING YOU NEED TO GET FOUND:',
      '',
      'GOOGLE BUSINESS SETUP:',
      '✓ Complete profile creation',
      '✓ Category and attribute optimization',
      '✓ Photo upload and optimization',
      '✓ Service/product catalog',
      '',
      'BASIC LOCAL SEO:',
      '✓ 25 essential directory citations',
      '✓ NAP consistency setup',
      '✓ Google Analytics setup',
      '',
      'FOUNDATION PACKAGE:',
      '✓ Review collection system',
      '✓ Social media profile setup (3 platforms)',
      '✓ 90-day action plan',
      '',
      'INVESTMENT:',
      'One-time setup: $799 (or 3 payments of $299)',
      '',
      'This package pays for itself with just 2-3 new customers.',
    ]),
  },
];

// ============================================
// GMB (Super AI) - 10 CONTRACTS
// ============================================
const GMB_CONTRACTS: DocumentTemplate[] = [
  {
    id: 'gmb-management-agreement',
    name: 'GMB Management Agreement',
    icon: '📋',
    description: 'Monthly management contract for Google Business Profile services.',
    category: 'Local SEO',
    forLeadType: 'gmb',
    fullContent: createContent([
      'GOOGLE BUSINESS PROFILE MANAGEMENT AGREEMENT',
      '',
      'This Agreement is entered into as of [DATE] between:',
      '',
      'SERVICE PROVIDER: [PROVIDER_NAME] ("Provider")',
      'CLIENT: [CLIENT_NAME] ("Client")',
      '',
      '1. SERVICES',
      'Provider agrees to manage Client\'s Google Business Profile including:',
      '- Profile optimization and updates',
      '- Review monitoring and response',
      '- Weekly posts (minimum 4/month)',
      '- Photo management',
      '- Performance reporting',
      '',
      '2. TERM',
      'Initial term: [TERM_LENGTH] months',
      'Auto-renewal: Month-to-month after initial term',
      'Cancellation notice: 30 days written notice',
      '',
      '3. FEES',
      'Monthly fee: $[MONTHLY_FEE]',
      'Payment due: 1st of each month',
      'Late fee: 5% after 15 days',
      '',
      '4. CLIENT RESPONSIBILITIES',
      '- Provide accurate business information',
      '- Respond to urgent matters within 48 hours',
      '- Maintain Google account access',
      '',
      '5. SIGNATURES',
      '',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'reputation-services-agreement',
    name: 'Reputation Services Agreement',
    icon: '⭐',
    description: 'Contract for ongoing reputation monitoring and management.',
    category: 'Reputation',
    forLeadType: 'gmb',
    fullContent: createContent([
      'REPUTATION MANAGEMENT SERVICES AGREEMENT',
      '',
      'Effective Date: [DATE]',
      '',
      'PARTIES:',
      'Provider: [PROVIDER_NAME]',
      'Client: [CLIENT_NAME]',
      '',
      '1. SCOPE OF SERVICES',
      'Provider will deliver reputation management services including:',
      '- Review monitoring across all platforms',
      '- Response to reviews within 24 hours',
      '- Monthly reputation reports',
      '- Review generation campaign management',
      '- Negative review resolution assistance',
      '',
      '2. FEES AND PAYMENT',
      'Monthly fee: $[MONTHLY_FEE]',
      'Setup fee: $[SETUP_FEE] (if applicable)',
      'Payment terms: Net 15',
      '',
      '3. TERM',
      'Minimum commitment: [MIN_MONTHS] months',
      'Renewal: Automatic monthly renewal',
      'Termination: 30 days written notice',
      '',
      '4. SIGNATURES',
      '',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'local-marketing-retainer',
    name: 'Local Marketing Retainer',
    icon: '🤝',
    description: 'Monthly retainer for comprehensive local marketing services.',
    category: 'Marketing',
    forLeadType: 'gmb',
    fullContent: createContent([
      'LOCAL MARKETING RETAINER AGREEMENT',
      '',
      'This Retainer Agreement is made effective [DATE]',
      '',
      'BETWEEN:',
      '[PROVIDER_NAME] ("Agency")',
      '[CLIENT_NAME] ("Client")',
      '',
      '1. RETAINER SERVICES',
      'Agency will provide [HOURS] hours per month of local marketing services which may include:',
      '- Google Business Profile management',
      '- Local SEO optimization',
      '- Citation building and management',
      '- Review generation campaigns',
      '- Social media management',
      '',
      '2. RETAINER FEE',
      'Monthly retainer: $[RETAINER_AMOUNT]',
      'Payment due: Beginning of each month',
      '',
      '3. HOUR ALLOCATION',
      '- Hours tracked in 15-minute increments',
      '- Unused hours do not roll over',
      '- Additional hours billed at $[HOURLY_RATE]/hour',
      '',
      '4. TERM',
      'Initial term: [INITIAL_TERM] months',
      'Renewal: Month-to-month',
      'Cancellation: 30 days written notice',
      '',
      '5. SIGNATURES',
      '',
      'Agency: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'citation-building-contract',
    name: 'Citation Building Contract',
    icon: '📍',
    description: 'One-time contract for directory submission services.',
    category: 'Local SEO',
    forLeadType: 'gmb',
    fullContent: createContent([
      'CITATION BUILDING SERVICE CONTRACT',
      '',
      'Date: [DATE]',
      '',
      'CLIENT INFORMATION:',
      'Business Name: [BUSINESS_NAME]',
      'Address: [BUSINESS_ADDRESS]',
      'Phone: [BUSINESS_PHONE]',
      'Website: [BUSINESS_WEBSITE]',
      '',
      'SERVICES TO BE PROVIDED:',
      'Provider will submit Client\'s business information to [CITATION_COUNT] online directories including:',
      '- Google Business Profile verification',
      '- Yelp, YP, BBB, and major directories',
      '- Industry-specific directories',
      '- Local/regional directories',
      '',
      'DELIVERABLES:',
      '- Complete citation report with live links',
      '- NAP consistency documentation',
      '- Completion certificate',
      '',
      'TIMELINE: All citations completed within [TIMELINE] days',
      '',
      'INVESTMENT:',
      'Total fee: $[TOTAL_FEE]',
      '50% due at signing: $[DEPOSIT]',
      '50% due at completion: $[BALANCE]',
      '',
      'SIGNATURES:',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'review-generation-contract',
    name: 'Review Generation Contract',
    icon: '💬',
    description: 'Agreement for review generation campaign services.',
    category: 'Reputation',
    forLeadType: 'gmb',
    fullContent: createContent([
      'REVIEW GENERATION CAMPAIGN AGREEMENT',
      '',
      'Effective Date: [DATE]',
      '',
      'PARTIES:',
      'Provider: [PROVIDER_NAME]',
      'Client: [CLIENT_NAME]',
      '',
      '1. CAMPAIGN DESCRIPTION',
      'Provider will implement a review generation system including:',
      '- Email review request sequences',
      '- SMS review reminders (if opted in)',
      '- Review landing page creation',
      '- Follow-up automation',
      '- Response templates',
      '',
      '2. COMPLIANCE',
      'All review requests will comply with Google\'s review policies and FTC guidelines.',
      '',
      '3. CLIENT RESPONSIBILITIES',
      'Client must provide:',
      '- Customer contact lists (with consent)',
      '- Timely customer service',
      '- Response to negative feedback',
      '',
      '4. FEES',
      'Setup fee: $[SETUP_FEE]',
      'Monthly campaign fee: $[MONTHLY_FEE]',
      '',
      '5. TERM',
      'Minimum term: [MIN_TERM] months',
      '',
      '6. SIGNATURES',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'local-seo-contract',
    name: 'Local SEO Services Contract',
    icon: '🔍',
    description: 'Comprehensive local SEO service agreement.',
    category: 'Local SEO',
    forLeadType: 'gmb',
    fullContent: createContent([
      'LOCAL SEO SERVICES AGREEMENT',
      '',
      'This Agreement is made on [DATE] between:',
      '',
      'PROVIDER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. SERVICES INCLUDED',
      'Provider will perform local SEO services including:',
      '- Technical SEO audit and fixes',
      '- Local keyword research and targeting',
      '- On-page optimization',
      '- Google Business Profile optimization',
      '- Citation building ([CITATIONS_PER_MONTH]/month)',
      '- Monthly reporting',
      '',
      '2. EXPECTATIONS',
      'SEO is a long-term strategy. Significant results typically require 4-6 months.',
      '',
      '3. INVESTMENT',
      'Monthly fee: $[MONTHLY_FEE]',
      'Minimum commitment: [MIN_MONTHS] months',
      'Payment terms: Due 1st of month',
      '',
      '4. TERMINATION',
      'After minimum term, either party may cancel with 30 days written notice.',
      '',
      'SIGNATURES:',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'gmb-audit-contract',
    name: 'GMB Audit & Consultation',
    icon: '🔎',
    description: 'One-time audit and consultation service agreement.',
    category: 'Consulting',
    forLeadType: 'gmb',
    fullContent: createContent([
      'GOOGLE BUSINESS PROFILE AUDIT AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'CLIENT: [CLIENT_NAME]',
      'BUSINESS: [BUSINESS_NAME]',
      '',
      'AUDIT SCOPE:',
      'Provider will conduct a comprehensive audit including:',
      '✓ Profile completeness assessment',
      '✓ Category and attribute analysis',
      '✓ Photo and content review',
      '✓ Review analysis and sentiment',
      '✓ Competitor comparison',
      '✓ Actionable recommendations',
      '',
      'DELIVERABLES:',
      '- Written audit report (PDF)',
      '- Prioritized action plan',
      '- 60-minute consultation call',
      '- 30-day email support',
      '',
      'TIMELINE: Audit completed within 5 business days',
      '',
      'INVESTMENT: $[AUDIT_FEE] (one-time)',
      '',
      'SIGNATURES:',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'photo-service-contract',
    name: 'Business Photo Service Contract',
    icon: '📸',
    description: 'Contract for professional photography services.',
    category: 'Branding',
    forLeadType: 'gmb',
    fullContent: createContent([
      'PROFESSIONAL PHOTOGRAPHY SERVICE AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'PHOTOGRAPHER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      'LOCATION: [SHOOT_LOCATION]',
      '',
      '1. SERVICES',
      'Photographer will provide:',
      '- [SESSION_HOURS]-hour on-site photo session',
      '- [PHOTO_COUNT] professionally edited photos',
      '- High-resolution digital files',
      '- Web-optimized versions',
      '- Google Business Profile upload',
      '',
      '2. SCHEDULE',
      'Photo session date: [SESSION_DATE]',
      'Delivery date: [DELIVERY_DATE]',
      '',
      '3. INVESTMENT',
      'Total fee: $[TOTAL_FEE]',
      'Deposit (50%): $[DEPOSIT] due at signing',
      'Balance: Due at delivery',
      '',
      '4. USAGE RIGHTS',
      'Client receives full commercial usage rights.',
      '',
      'SIGNATURES:',
      'Photographer: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'emergency-recovery-contract',
    name: 'Emergency GMB Recovery Contract',
    icon: '🚨',
    description: 'Urgent service contract for suspended/hacked profiles.',
    category: 'Emergency',
    forLeadType: 'gmb',
    fullContent: createContent([
      'EMERGENCY GMB RECOVERY SERVICE AGREEMENT',
      '',
      'URGENT SERVICE CONTRACT',
      '',
      'Date: [DATE]',
      'Client: [CLIENT_NAME]',
      'Issue Type: [ ] Suspension [ ] Hacked [ ] Other',
      '',
      '1. EMERGENCY SERVICES',
      'Provider will immediately begin work to:',
      '- Assess the current situation',
      '- Identify root cause',
      '- Prepare recovery documentation',
      '- Submit appeals/requests to Google',
      '- Communicate progress daily',
      '',
      '2. TIMELINE',
      '- Assessment: 24-48 hours',
      '- Initial action: 48-72 hours',
      '- Resolution: 1-3 weeks (Google dependent)',
      '',
      '3. FEES',
      'Emergency assessment: $250',
      'Recovery service: $[RECOVERY_FEE]',
      'Rush priority: +$500 (if applicable)',
      '',
      'Payment: Due immediately upon signing',
      '',
      '4. NO GUARANTEE',
      'Provider cannot guarantee successful recovery but maintains 92% success rate.',
      '',
      'AUTHORIZATION:',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'ongoing-maintenance-contract',
    name: 'Ongoing Maintenance Agreement',
    icon: '🔧',
    description: 'Simple maintenance contract for basic upkeep.',
    category: 'Maintenance',
    forLeadType: 'gmb',
    fullContent: createContent([
      'GOOGLE BUSINESS PROFILE MAINTENANCE AGREEMENT',
      '',
      'Effective: [DATE]',
      '',
      'PROVIDER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      'BASIC MAINTENANCE INCLUDES:',
      '- Monthly profile check and updates',
      '- Review monitoring (weekly)',
      '- Basic review responses',
      '- 2 posts per month',
      '- Quarterly performance report',
      '- Email support (48-hour response)',
      '',
      'DOES NOT INCLUDE:',
      '- Advanced optimization',
      '- Citation building',
      '- Advertising management',
      '- Emergency services',
      '',
      'MONTHLY FEE: $[MONTHLY_FEE]',
      '',
      'TERM:',
      '- No minimum commitment',
      '- Cancel anytime with 15 days notice',
      '',
      'SIGNATURES:',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
];

// ============================================
// AGENCY (Platform) - 10 PROPOSALS
// ============================================
const AGENCY_PROPOSALS: DocumentTemplate[] = [
  {
    id: 'website-design',
    name: 'Website Design Proposal',
    icon: '🎨',
    description: 'Custom website design and development with modern UX.',
    category: 'Web Development',
    forLeadType: 'platform',
    fullContent: createContent([
      'WEBSITE DESIGN PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Prepared by: [PROVIDER_NAME]',
      'Date: [DATE]',
      '',
      'EXECUTIVE SUMMARY',
      'We will create a stunning, conversion-focused website that reflects your brand and drives results.',
      '',
      'PROJECT SCOPE:',
      '',
      'DISCOVERY & STRATEGY',
      '- Kickoff meeting and requirements gathering',
      '- Competitor analysis',
      '- User experience planning',
      '',
      'DESIGN',
      '- Custom homepage design',
      '- [PAGE_COUNT] inner page designs',
      '- Mobile-responsive layouts',
      '- 2 rounds of revisions',
      '',
      'DEVELOPMENT',
      '- Modern, fast-loading code',
      '- Content management system',
      '- Contact forms with notifications',
      '- SEO foundation setup',
      '',
      'TIMELINE: [TIMELINE] weeks',
      '',
      'INVESTMENT:',
      'Total: $[TOTAL_PRICE]',
      '- 50% deposit to begin',
      '- 50% at launch',
      '',
      'Ready to get started? Sign below or reply to this email.',
      '',
      'Signature: _________________________',
      'Date: _________________________',
    ]),
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign Proposal',
    icon: '🔧',
    description: 'Transform outdated websites into conversion machines.',
    category: 'Web Development',
    forLeadType: 'platform',
    fullContent: createContent([
      'WEBSITE REDESIGN PROPOSAL',
      '',
      'Current Site: [CURRENT_WEBSITE]',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'THE PROBLEM:',
      'Your current website was built for a different era. It is costing you customers through:',
      '- Slow loading times',
      '- Poor mobile experience',
      '- Outdated design that hurts credibility',
      '',
      'THE SOLUTION:',
      'A complete redesign that modernizes your digital presence.',
      '',
      'REDESIGN INCLUDES:',
      '- Performance analysis',
      '- Modern, professional aesthetic',
      '- Improved user experience',
      '- Mobile-first approach',
      '- Conversion optimization',
      '',
      'INVESTMENT:',
      'Redesign project: $[TOTAL_PRICE]',
      '- 40% to begin',
      '- 30% at design approval',
      '- 30% at launch',
      '',
      'TIMELINE: [TIMELINE] weeks',
    ]),
  },
  {
    id: 'social-media-management',
    name: 'Social Media Management',
    icon: '📱',
    description: 'Full-service social media strategy and content management.',
    category: 'Social Media',
    forLeadType: 'platform',
    fullContent: createContent([
      'SOCIAL MEDIA MANAGEMENT PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'BUILD YOUR BRAND ON SOCIAL MEDIA',
      '',
      'PLATFORMS INCLUDED:',
      '[ ] Facebook',
      '[ ] Instagram',
      '[ ] LinkedIn',
      '[ ] Twitter/X',
      '[ ] TikTok',
      '',
      'MONTHLY SERVICES:',
      '',
      'CONTENT CREATION:',
      '- [POSTS_PER_MONTH] custom posts per month',
      '- Professional graphics and visuals',
      '- Engaging captions and hashtags',
      '',
      'COMMUNITY MANAGEMENT:',
      '- Daily monitoring',
      '- Comment and message responses',
      '- Engagement with followers',
      '',
      'INVESTMENT:',
      'Monthly fee: $[MONTHLY_FEE]',
      'Setup fee: $[SETUP_FEE] (one-time)',
      '',
      'MINIMUM COMMITMENT: 3 months',
    ]),
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing Package',
    icon: '📈',
    description: 'Comprehensive digital marketing with ads, SEO, and analytics.',
    category: 'Marketing',
    forLeadType: 'platform',
    fullContent: createContent([
      'DIGITAL MARKETING PACKAGE PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'FULL-SERVICE DIGITAL MARKETING',
      '',
      'PACKAGE INCLUDES:',
      '',
      'PAID ADVERTISING:',
      '- Google Ads management',
      '- Social media advertising',
      '- Retargeting campaigns',
      '',
      'SEO:',
      '- On-page optimization',
      '- Content recommendations',
      '- Technical fixes',
      '',
      'EMAIL MARKETING:',
      '- Campaign strategy',
      '- Template design',
      '- Automation setup',
      '',
      'INVESTMENT:',
      'Monthly retainer: $[MONTHLY_FEE]',
      'Recommended ad budget: $[AD_BUDGET]/month',
      'Setup fee: $[SETUP_FEE]',
      '',
      'MINIMUM COMMITMENT: 6 months',
    ]),
  },
  {
    id: 'seo-package',
    name: 'SEO & Content Strategy',
    icon: '🔍',
    description: 'Technical SEO, content optimization, and link building.',
    category: 'SEO',
    forLeadType: 'platform',
    fullContent: createContent([
      'SEO & CONTENT STRATEGY PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Current Domain: [WEBSITE]',
      'Date: [DATE]',
      '',
      'DOMINATE SEARCH RESULTS',
      '',
      'SEO SERVICES INCLUDED:',
      '',
      'TECHNICAL SEO:',
      '- Site audit and fixes',
      '- Speed optimization',
      '- Mobile optimization',
      '- Schema markup',
      '',
      'ON-PAGE SEO:',
      '- Keyword research',
      '- Title and meta optimization',
      '- Header structure',
      '',
      'CONTENT STRATEGY:',
      '- Content gap analysis',
      '- [BLOG_POSTS] blog posts per month',
      '',
      'LINK BUILDING:',
      '- Quality outreach',
      '- [LINKS_PER_MONTH] links per month',
      '',
      'INVESTMENT:',
      'Monthly fee: $[MONTHLY_FEE]',
      'Minimum commitment: 6 months',
    ]),
  },
  {
    id: 'ecommerce-setup',
    name: 'E-Commerce Setup',
    icon: '🛒',
    description: 'Complete online store setup and optimization.',
    category: 'E-Commerce',
    forLeadType: 'platform',
    fullContent: createContent([
      'E-COMMERCE STORE SETUP PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'START SELLING ONLINE',
      '',
      'E-COMMERCE PACKAGE:',
      '',
      'STORE SETUP:',
      '- Platform: [PLATFORM]',
      '- Custom theme design',
      '- Mobile optimization',
      '- [PRODUCT_COUNT] products loaded',
      '',
      'FEATURES:',
      '- Payment gateway integration',
      '- Shipping configuration',
      '- Tax setup',
      '- Inventory management',
      '',
      'INVESTMENT:',
      'Setup fee: $[TOTAL_PRICE]',
      '- 50% deposit',
      '- 50% at launch',
      '',
      'TIMELINE: [TIMELINE] weeks',
      '',
      'ONGOING SUPPORT:',
      'Monthly maintenance available: $[MONTHLY_FEE]/month',
    ]),
  },
  {
    id: 'brand-identity',
    name: 'Brand Identity Package',
    icon: '✨',
    description: 'Logo, colors, fonts, and complete brand guidelines.',
    category: 'Branding',
    forLeadType: 'platform',
    fullContent: createContent([
      'BRAND IDENTITY PACKAGE PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'CREATE A MEMORABLE BRAND',
      '',
      'BRAND IDENTITY INCLUDES:',
      '',
      'DISCOVERY:',
      '- Brand questionnaire',
      '- Competitor analysis',
      '- Target audience research',
      '',
      'LOGO DESIGN:',
      '- 3 initial concepts',
      '- 2 rounds of revisions',
      '- Final files in all formats',
      '',
      'BRAND ELEMENTS:',
      '- Color palette',
      '- Typography selection',
      '- Icon/graphic style',
      '',
      'DELIVERABLES:',
      '- Complete brand guide (PDF)',
      '- Logo files (all formats)',
      '- Social media templates',
      '',
      'INVESTMENT: $[TOTAL_PRICE]',
      '',
      'TIMELINE: [TIMELINE] weeks',
    ]),
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing Setup',
    icon: '📧',
    description: 'Email automation, templates, and campaign management.',
    category: 'Email',
    forLeadType: 'platform',
    fullContent: createContent([
      'EMAIL MARKETING PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'TURN SUBSCRIBERS INTO CUSTOMERS',
      '',
      'EMAIL MARKETING PACKAGE:',
      '',
      'SETUP:',
      '- Platform: [EMAIL_PLATFORM]',
      '- List import and cleanup',
      '- Segmentation strategy',
      '',
      'AUTOMATION:',
      '- Welcome sequence ([WELCOME_EMAILS] emails)',
      '- Abandoned cart recovery',
      '- Post-purchase follow-up',
      '',
      'TEMPLATES:',
      '- Newsletter template',
      '- Promotional template',
      '- Transactional templates',
      '',
      'INVESTMENT:',
      'Setup fee: $[SETUP_FEE]',
      'Monthly management: $[MONTHLY_FEE]',
      '',
      'MINIMUM COMMITMENT: 3 months',
    ]),
  },
  {
    id: 'ppc-management',
    name: 'PPC Advertising Management',
    icon: '🎯',
    description: 'Google Ads and paid social campaign management.',
    category: 'Advertising',
    forLeadType: 'platform',
    fullContent: createContent([
      'PPC ADVERTISING MANAGEMENT PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'GET CUSTOMERS NOW WITH PAID ADS',
      '',
      'PLATFORMS:',
      '[ ] Google Search Ads',
      '[ ] Google Display',
      '[ ] Facebook/Instagram Ads',
      '[ ] LinkedIn Ads',
      '',
      'CAMPAIGN MANAGEMENT:',
      '- Campaign strategy',
      '- Keyword research',
      '- Ad copywriting',
      '- Landing page recommendations',
      '- Bid management',
      '',
      'REPORTING:',
      '- Weekly performance updates',
      '- Monthly detailed reports',
      '- ROI analysis',
      '',
      'INVESTMENT:',
      'Management fee: $[MANAGEMENT_FEE]/month',
      '(or [PERCENTAGE]% of ad spend)',
      '',
      'Recommended ad budget: $[AD_BUDGET]+/month',
      '',
      'MINIMUM COMMITMENT: 3 months',
    ]),
  },
  {
    id: 'content-marketing',
    name: 'Content Marketing Strategy',
    icon: '📝',
    description: 'Blog content, guides, and thought leadership.',
    category: 'Content',
    forLeadType: 'platform',
    fullContent: createContent([
      'CONTENT MARKETING STRATEGY PROPOSAL',
      '',
      'Prepared for: [BUSINESS_NAME]',
      'Date: [DATE]',
      '',
      'BECOME THE GO-TO AUTHORITY IN YOUR INDUSTRY',
      '',
      'CONTENT MARKETING PACKAGE:',
      '',
      'STRATEGY:',
      '- Audience research',
      '- Topic ideation',
      '- Content calendar',
      '- SEO keyword mapping',
      '',
      'CONTENT CREATION:',
      '- [BLOG_POSTS] blog posts per month',
      '- Long-form guides (quarterly)',
      '- Infographics',
      '- Social content snippets',
      '',
      'DISTRIBUTION:',
      '- Social media sharing',
      '- Email promotion',
      '- Outreach for backlinks',
      '',
      'INVESTMENT:',
      'Monthly fee: $[MONTHLY_FEE]',
      'Setup/strategy: $[SETUP_FEE] (one-time)',
      '',
      'MINIMUM COMMITMENT: 6 months',
    ]),
  },
];

// ============================================
// AGENCY (Platform) - 10 CONTRACTS
// ============================================
const AGENCY_CONTRACTS: DocumentTemplate[] = [
  {
    id: 'website-design-agreement',
    name: 'Website Design Agreement',
    icon: '🎨',
    description: 'Comprehensive agreement for website design projects.',
    category: 'Web Development',
    forLeadType: 'platform',
    fullContent: createContent([
      'WEBSITE DESIGN & DEVELOPMENT AGREEMENT',
      '',
      'This Agreement is made effective [DATE]',
      '',
      'BETWEEN:',
      '[PROVIDER_NAME] ("Designer")',
      '[CLIENT_NAME] ("Client")',
      '',
      '1. PROJECT SCOPE',
      'Designer will create a custom website including:',
      '- [PAGE_COUNT] pages/sections',
      '- Responsive design (mobile, tablet, desktop)',
      '- Content management system',
      '- Contact form(s)',
      '- Basic SEO setup',
      '',
      '2. TIMELINE',
      'Estimated completion: [TIMELINE] weeks',
      '',
      '3. PAYMENT',
      'Total investment: $[TOTAL_PRICE]',
      '- 50% deposit due at signing: $[DEPOSIT]',
      '- 50% balance due at launch: $[BALANCE]',
      '',
      'Late fee: 5% per month',
      '',
      '4. REVISIONS',
      '[REVISION_ROUNDS] rounds included. Additional: $[HOURLY_RATE]/hour',
      '',
      '5. SIGNATURES',
      'Designer: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'marketing-services-agreement',
    name: 'Marketing Services Agreement',
    icon: '📈',
    description: 'Contract for ongoing digital marketing services.',
    category: 'Marketing',
    forLeadType: 'platform',
    fullContent: createContent([
      'DIGITAL MARKETING SERVICES AGREEMENT',
      '',
      'Effective Date: [DATE]',
      '',
      'PARTIES:',
      'Agency: [PROVIDER_NAME]',
      'Client: [CLIENT_NAME]',
      '',
      '1. SERVICES',
      'Agency will provide digital marketing services which may include:',
      '- Search engine optimization',
      '- Pay-per-click advertising',
      '- Social media marketing',
      '- Email marketing',
      '- Content creation',
      '',
      '2. TERM',
      'Initial term: [INITIAL_TERM] months',
      'Auto-renewal: Month-to-month after initial term',
      'Cancellation: 30 days written notice',
      '',
      '3. FEES',
      'Monthly retainer: $[MONTHLY_FEE]',
      'Payment due: 1st of each month',
      '',
      '4. SIGNATURES',
      'Agency: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'social-media-retainer',
    name: 'Social Media Retainer',
    icon: '📱',
    description: 'Monthly retainer for social media management services.',
    category: 'Social Media',
    forLeadType: 'platform',
    fullContent: createContent([
      'SOCIAL MEDIA MANAGEMENT RETAINER AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'PROVIDER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. PLATFORMS',
      'Provider will manage the following social media accounts:',
      '[ ] Facebook',
      '[ ] Instagram',
      '[ ] LinkedIn',
      '[ ] Twitter/X',
      '',
      '2. SERVICES INCLUDED',
      'Per month:',
      '- [POSTS_PER_MONTH] posts across platforms',
      '- Content calendar creation',
      '- Graphics/visual creation',
      '- Community management',
      '- Monthly analytics report',
      '',
      '3. FEES',
      'Monthly fee: $[MONTHLY_FEE]',
      'Payment due: Beginning of each month',
      '',
      '4. TERM',
      'Minimum commitment: [MIN_MONTHS] months',
      'Cancellation: 30 days written notice',
      '',
      'SIGNATURES:',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'seo-services-agreement',
    name: 'SEO Services Agreement',
    icon: '🔍',
    description: 'Contract for ongoing SEO and content services.',
    category: 'SEO',
    forLeadType: 'platform',
    fullContent: createContent([
      'SEO SERVICES AGREEMENT',
      '',
      'This Agreement is made on [DATE]',
      '',
      'BETWEEN:',
      '[PROVIDER_NAME] ("Agency")',
      '[CLIENT_NAME] ("Client")',
      '',
      '1. SERVICES',
      'Agency will provide SEO services including:',
      '- Technical SEO audit and fixes',
      '- On-page optimization',
      '- Content optimization/creation',
      '- Link building ([LINKS_PER_MONTH]/month)',
      '- Monthly reporting',
      '',
      '2. EXPECTATIONS',
      'SEO is a long-term strategy. Typical timeline for results:',
      '- Initial improvements: 2-3 months',
      '- Substantial results: 4-6 months',
      '',
      '3. FEES',
      'Monthly fee: $[MONTHLY_FEE]',
      'Minimum commitment: [MIN_MONTHS] months',
      '',
      'SIGNATURES:',
      'Agency: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'freelance-project-contract',
    name: 'Freelance Project Contract',
    icon: '📋',
    description: 'Simple contract for one-time freelance projects.',
    category: 'Projects',
    forLeadType: 'platform',
    fullContent: createContent([
      'FREELANCE PROJECT AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'FREELANCER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      'PROJECT: [PROJECT_NAME]',
      '',
      '1. PROJECT DESCRIPTION',
      '[PROJECT_DESCRIPTION]',
      '',
      '2. DELIVERABLES',
      '[DELIVERABLES_LIST]',
      '',
      '3. TIMELINE',
      'Start date: [START_DATE]',
      'Completion date: [END_DATE]',
      '',
      '4. COMPENSATION',
      'Total project fee: $[TOTAL_FEE]',
      '- [DEPOSIT_PERCENT]% deposit: $[DEPOSIT] (due at signing)',
      '- Balance: $[BALANCE] (due at completion)',
      '',
      '5. REVISIONS',
      '[REVISION_COUNT] rounds included. Additional: $[HOURLY_RATE]/hour',
      '',
      'SIGNATURES:',
      'Freelancer: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'consulting-agreement',
    name: 'Consulting Agreement',
    icon: '💼',
    description: 'Agreement for consulting and advisory services.',
    category: 'Consulting',
    forLeadType: 'platform',
    fullContent: createContent([
      'CONSULTING SERVICES AGREEMENT',
      '',
      'Effective Date: [DATE]',
      '',
      'CONSULTANT: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. CONSULTING SERVICES',
      'Consultant will provide advisory services in the area of:',
      '[CONSULTING_AREA]',
      '',
      '2. ENGAGEMENT STRUCTURE',
      '[ ] Project-based: $[PROJECT_FEE] total',
      '[ ] Hourly: $[HOURLY_RATE]/hour',
      '[ ] Retainer: $[RETAINER_AMOUNT]/month for [HOURS] hours',
      '',
      '3. SCHEDULING',
      'Sessions scheduled via mutual agreement.',
      'Minimum notice for cancellation: 24 hours',
      '',
      '4. INDEPENDENT CONTRACTOR',
      'Consultant operates as independent contractor, not employee.',
      '',
      '5. TERM',
      'This agreement is effective for [TERM_LENGTH] or until project completion.',
      '',
      'SIGNATURES:',
      'Consultant: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'content-creation-contract',
    name: 'Content Creation Contract',
    icon: '📝',
    description: 'Agreement for blog posts, articles, and content.',
    category: 'Content',
    forLeadType: 'platform',
    fullContent: createContent([
      'CONTENT CREATION AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'WRITER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. CONTENT SCOPE',
      'Writer will create the following content:',
      '- Type: [CONTENT_TYPE]',
      '- Quantity: [CONTENT_QUANTITY]/month',
      '- Length: [WORD_COUNT] words per piece',
      '',
      '2. PROCESS',
      'a) Client provides topics/briefs',
      'b) Writer delivers first draft',
      'c) Client provides feedback',
      'd) Writer delivers final version',
      '',
      '3. TURNAROUND',
      'First draft: [DRAFT_DAYS] business days',
      'Revisions: [REVISION_DAYS] business days',
      '',
      '4. REVISIONS',
      '[REVISION_ROUNDS] rounds included. Additional: $[REVISION_FEE] per round',
      '',
      '5. COMPENSATION',
      'Per piece: $[PER_PIECE_RATE]',
      'Monthly package: $[MONTHLY_RATE]',
      '',
      'SIGNATURES:',
      'Writer: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'video-production-contract',
    name: 'Video Production Contract',
    icon: '🎬',
    description: 'Agreement for video production services.',
    category: 'Video',
    forLeadType: 'platform',
    fullContent: createContent([
      'VIDEO PRODUCTION AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'PRODUCTION COMPANY: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. PROJECT DESCRIPTION',
      'Video type: [VIDEO_TYPE]',
      'Purpose: [VIDEO_PURPOSE]',
      'Length: [VIDEO_LENGTH]',
      '',
      '2. PRODUCTION SERVICES',
      'Pre-production: Concept, script, storyboard',
      'Production: [SHOOT_DAYS] day(s) of filming',
      'Post-production: Editing, color, audio, graphics',
      '',
      '3. DELIVERABLES',
      '- Final video in [FORMAT]',
      '- Raw footage (if requested)',
      '',
      '4. TIMELINE',
      'Pre-production: [PRE_PROD_WEEKS] week(s)',
      'Production: [PROD_DAYS] day(s)',
      'Post-production: [POST_PROD_WEEKS] week(s)',
      '',
      '5. INVESTMENT',
      'Total: $[TOTAL_PRICE]',
      '- 40% at signing: $[DEPOSIT]',
      '- 30% at production: $[SECOND_PAYMENT]',
      '- 30% at delivery: $[FINAL_PAYMENT]',
      '',
      'SIGNATURES:',
      'Producer: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'branding-agreement',
    name: 'Brand Identity Agreement',
    icon: '✨',
    description: 'Contract for logo and brand identity design.',
    category: 'Branding',
    forLeadType: 'platform',
    fullContent: createContent([
      'BRAND IDENTITY DESIGN AGREEMENT',
      '',
      'Date: [DATE]',
      '',
      'DESIGNER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. BRAND IDENTITY SERVICES',
      'Designer will create:',
      '[ ] Logo design ([LOGO_CONCEPTS] initial concepts)',
      '[ ] Color palette',
      '[ ] Typography selection',
      '[ ] Brand guidelines document',
      '[ ] Business card design',
      '[ ] Social media templates',
      '',
      '2. PROCESS',
      'Phase 1: Discovery',
      'Phase 2: Concepts ([LOGO_CONCEPTS] directions)',
      'Phase 3: Refinement ([REVISION_ROUNDS] rounds)',
      'Phase 4: Finalization',
      '',
      '3. TIMELINE',
      'Estimated: [TIMELINE] weeks',
      '',
      '4. INVESTMENT',
      'Total: $[TOTAL_PRICE]',
      '- 50% deposit: $[DEPOSIT]',
      '- 50% at completion: $[BALANCE]',
      '',
      'SIGNATURES:',
      'Designer: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
  {
    id: 'monthly-retainer-agreement',
    name: 'Monthly Retainer Agreement',
    icon: '🤝',
    description: 'Flexible monthly retainer for ongoing services.',
    category: 'Retainer',
    forLeadType: 'platform',
    fullContent: createContent([
      'MONTHLY RETAINER AGREEMENT',
      '',
      'Effective: [DATE]',
      '',
      'PROVIDER: [PROVIDER_NAME]',
      'CLIENT: [CLIENT_NAME]',
      '',
      '1. RETAINER STRUCTURE',
      'Monthly hours: [MONTHLY_HOURS] hours',
      'Monthly fee: $[MONTHLY_FEE]',
      'Effective hourly rate: $[EFFECTIVE_RATE]/hour',
      'Standard hourly rate: $[STANDARD_RATE]/hour (for additional hours)',
      '',
      '2. SERVICES COVERED',
      '[SERVICES_LIST]',
      '',
      '3. HOUR TRACKING',
      '- Time tracked in 15-minute increments',
      '- Weekly time reports provided',
      '',
      '4. ROLLOVER POLICY',
      '[ ] Unused hours roll over (up to [ROLLOVER_PERCENT]%)',
      '[ ] No rollover - use it or lose it',
      '',
      '5. PRIORITY SERVICE',
      'Retainer clients receive:',
      '- 24-hour response time',
      '- Priority scheduling',
      '- Monthly strategy call',
      '',
      '6. TERM',
      'Minimum commitment: [MIN_MONTHS] months',
      'Cancellation: 30 days written notice',
      '',
      'SIGNATURES:',
      'Provider: _________________________ Date: ________',
      'Client: _________________________ Date: ________',
    ]),
  },
];

interface DocumentsPanelProps {
  searchType?: 'gmb' | 'platform' | null;
  onUseInEmail?: (doc: DocumentTemplate) => void;
}

export default function DocumentsPanel({ searchType, onUseInEmail }: DocumentsPanelProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

// Auto-determine search type from prop or sessionStorage - no toggle
  const [query, setQuery] = useState('');

  // Determine which set to show based on actual search type (no manual toggle)
  const effectiveSearchType: 'gmb' | 'platform' = useMemo(() => {
    if (searchType === 'platform') return 'platform';
    if (searchType === 'gmb') return 'gmb';
    try {
      const fromSession = typeof window !== 'undefined'
        ? (sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' | null)
        : null;
      return fromSession === 'platform' ? 'platform' : 'gmb';
    } catch {
      return 'gmb';
    }
  }, [searchType]);
  
  const isAgencySearch = effectiveSearchType === 'platform';

  // Select templates based on lead type - full 10 each
  const proposals = effectiveSearchType === 'platform' ? AGENCY_PROPOSALS : GMB_PROPOSALS;
  const contracts = effectiveSearchType === 'platform' ? AGENCY_CONTRACTS : GMB_CONTRACTS;

  const leadTypeLabel = isAgencySearch
    ? '🎯 Agency Lead Finder Documents'
    : '🤖 Super AI Business Search Documents';

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProposals = useMemo(() => {
    if (!normalizedQuery) return proposals;
    return proposals.filter((d) => {
      const haystack = `${d.name} ${d.description} ${d.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [proposals, normalizedQuery]);
  const filteredContracts = useMemo(() => {
    if (!normalizedQuery) return contracts;
    return contracts.filter((d) => {
      const haystack = `${d.name} ${d.description} ${d.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [contracts, normalizedQuery]);

  const handlePreview = (doc: DocumentTemplate) => {
    setSelectedDoc(doc);
    const savedContent = typeof window !== 'undefined' ? localStorage.getItem(`bamlead_doc_${doc.id}`) : null;
    setEditedContent(savedContent || doc.fullContent);
    setEditMode(false);
    setPreviewOpen(true);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (selectedDoc) {
      const key = `bamlead_doc_${selectedDoc.id}`;
      localStorage.setItem(key, editedContent);
      toast.success(`"${selectedDoc.name}" saved!`);
      setEditMode(false);
    }
  };

  const handleCopyTemplate = (doc: DocumentTemplate) => {
    const content = typeof window !== 'undefined' ? localStorage.getItem(`bamlead_doc_${doc.id}`) || doc.fullContent : doc.fullContent;
    navigator.clipboard.writeText(content);
    toast.success(`"${doc.name}" copied to clipboard!`);
  };

  const handleSendTemplate = (doc: DocumentTemplate) => {
    const content = typeof window !== 'undefined' ? localStorage.getItem(`bamlead_doc_${doc.id}`) || doc.fullContent : doc.fullContent;
    if (onUseInEmail) {
      onUseInEmail({ ...doc, fullContent: content });
    }
    toast.success(`Opening compose with "${doc.name}"...`);
    setPreviewOpen(false);
  };

  const handleDownload = (doc: DocumentTemplate) => {
    const content = typeof window !== 'undefined' ? localStorage.getItem(`bamlead_doc_${doc.id}`) || doc.fullContent : doc.fullContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded!');
  };

  const getDocContent = (doc: DocumentTemplate) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`bamlead_doc_${doc.id}`) || doc.fullContent;
    }
    return doc.fullContent;
  };

  const TemplateCard = ({ doc }: { doc: DocumentTemplate }) => (
    <div className="p-4 rounded-xl bg-card/80 border border-border hover:border-primary/50 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
          {doc.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm mb-0.5">{doc.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
          <Badge variant="outline" className="mt-2 text-[10px]">
            {doc.category}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handlePreview(doc)}
          className="flex-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCopyTemplate(doc)}
          className="flex-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="w-3.5 h-3.5 mr-1" />
          Copy
        </Button>
        <Button
          size="sm"
          onClick={() => handleSendTemplate(doc)}
          className={cn(
            "flex-1 text-xs text-white",
            isAgencySearch
              ? "bg-violet-600 hover:bg-violet-500"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          Use
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">PreDone Documents</h2>
            <p className="text-sm text-muted-foreground mt-1">Proposals + Contracts — click “Use” to insert into Compose</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1.5 text-xs gap-1.5",
                isAgencySearch 
                  ? "bg-violet-500/10 text-violet-400 border-violet-500/30" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              )}
            >
              {isAgencySearch ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {leadTypeLabel}
            </Badge>
          </div>
        </div>

        {/* Search only - no option toggle */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {proposals.length} proposals • {contracts.length} contracts
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px]",
                  isAgencySearch 
                    ? "border-violet-500/30 text-violet-400" 
                    : "border-emerald-500/30 text-emerald-400"
                )}
              >
                Auto-selected based on your search
              </Badge>
            </div>
            <div className="w-full md:w-80">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
                className="bg-background border-border"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="bg-muted/50 border border-border p-1">
            <TabsTrigger 
              value="proposals" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Proposals ({filteredProposals.length})
            </TabsTrigger>
            <TabsTrigger 
              value="contracts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-4 h-4 mr-2" />
              Contracts ({filteredContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-4">
            {filteredProposals.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No proposals match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProposals.map(doc => (
                  <TemplateCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            {filteredContracts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No contracts match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContracts.map(doc => (
                  <TemplateCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Full Editor Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent elevated className="max-w-4xl h-[85vh] bg-card border-border text-foreground flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedDoc?.icon}</span>
                <div>
                  <DialogTitle className="text-lg">{selectedDoc?.name}</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">
                    {editMode ? 'Editing document — changes are saved locally' : selectedDoc?.description}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedDoc?.category}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden p-4">
            {editMode ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full bg-muted border-border text-foreground font-mono text-sm resize-none"
                placeholder="Edit your document..."
              />
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 rounded-lg bg-muted/50 border border-border">
                  <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">
                    {selectedDoc ? getDocContent(selectedDoc) : 'No document selected'}
                  </pre>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-between">
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setEditMode(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleEdit}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => selectedDoc && handleDownload(selectedDoc)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
            </div>
            
            {!editMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => selectedDoc && handleCopyTemplate(selectedDoc)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={() => selectedDoc && handleSendTemplate(selectedDoc)}
                  className={cn(
                    "text-white",
                    isAgencySearch
                      ? "bg-violet-600 hover:bg-violet-500"
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Use in Email
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
