import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain, Lightbulb, Target, Globe, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Flame, ThermometerSun, Snowflake,
  Smartphone, Zap, MessageSquare, TrendingUp, FileText,
  Mail, Sparkles, Eye, X, Phone, Server, Settings, ArrowRight,
  Search, Users, Send, ChevronRight, Rocket, Star, RefreshCw,
  Shield, Clock, Award, Edit3, Wand2, BarChart3, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getStoredLeadContext, 
  LeadAnalysisContext,
  generateEmailSuggestionsFromContext 
} from '@/lib/leadContext';
import { isSMTPConfigured } from '@/lib/emailService';
import NicheIntelligencePanel from '@/components/NicheIntelligencePanel';
import CompetitiveAnalysisPanel from '@/components/CompetitiveAnalysisPanel';
import { NicheIntelligence } from '@/lib/types/nicheIntelligence';
import { CompetitiveIntelligence } from '@/lib/types/competitiveIntelligence';
import { generateNicheIntelligence, getCachedNicheIntelligence, cacheNicheIntelligence } from '@/lib/api/nicheIntelligence';
import { generateCompetitiveIntelligence, getCachedCompetitiveIntelligence, cacheCompetitiveIntelligence } from '@/lib/api/competitiveIntelligence';

interface LeadIntelligenceReviewPanelProps {
  onApplyStrategy?: (strategy: EmailStrategy) => void;
  onClose?: () => void;
  searchType?: 'gmb' | 'platform' | null;
  onOpenSettings?: () => void;
  onOpenCompose?: (strategy: EmailStrategy) => void;
  selectedTemplate?: { subject: string; body: string } | null;
  onOpenTemplates?: () => void;
  /** Search query for niche intelligence */
  searchQuery?: string;
  /** Search location for niche intelligence */
  searchLocation?: string;
  /** Research mode - 'niche' shows market intelligence, 'competitive' does not */
  researchMode?: 'niche' | 'competitive';
  /** Optional leads array - if not provided, falls back to storage */
  leads?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    aiClassification?: 'hot' | 'warm' | 'cold';
    leadScore?: number;
    successProbability?: number;
    painPoints?: string[];
    websiteAnalysis?: {
      hasWebsite: boolean;
      needsUpgrade?: boolean;
      mobileScore?: number;
      issues?: string[];
    };
  }>;
}

export interface EmailStrategy {
  id: string;
  name: string;
  description: string;
  targetLeads: number;
  subjectTemplate: string;
  openerTemplate: string;
  ctaTemplate: string;
  priority: 'hot' | 'warm' | 'cold';
  emoji?: string;
  followUpDays?: number[];
  searchTypeFilter?: 'gmb' | 'platform' | 'both';
}

// Breadcrumb step definition - Updated to show Template first, then Strategy
const BREADCRUMB_STEPS = [
  { id: 1, label: 'Lead Acquisition', description: 'Search & Discovery', icon: Search },
  { id: 2, label: 'Lead Analysis', description: 'AI Intelligence', icon: Brain },
  { id: 3, label: 'Choose Template', description: 'Email Template', icon: Mail },
  { id: 4, label: 'Refine Strategy', description: 'AI Follow-Up', icon: Rocket },
];

export default function LeadIntelligenceReviewPanel({ 
  onApplyStrategy, 
  onClose,
  searchType,
  onOpenSettings,
  onOpenCompose,
  selectedTemplate,
  onOpenTemplates,
  searchQuery = '',
  searchLocation = '',
  researchMode: propResearchMode,
  leads: passedLeads
}: LeadIntelligenceReviewPanelProps) {
  // Get research mode from props or sessionStorage - only show niche intelligence for 'niche' mode
  const researchMode = propResearchMode || (() => {
    try {
      return (sessionStorage.getItem('bamlead_research_mode') as 'niche' | 'competitive') || 'niche';
    } catch {
      return 'niche';
    }
  })();
  
  // Show niche intelligence only for niche research mode with GMB search type
  const showNicheIntelligence = researchMode === 'niche' && searchType === 'gmb';
  // Show competitive analysis for competitive research mode with GMB search type
  const showCompetitiveAnalysis = researchMode === 'competitive' && searchType === 'gmb';
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [smtpConfigured, setSMTPConfigured] = useState(false);
  const [intelligenceExpanded, setIntelligenceExpanded] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'niche' | 'competitive'>(
    showNicheIntelligence ? 'niche' : showCompetitiveAnalysis ? 'competitive' : 'leads'
  );
  const [nicheIntelligence, setNicheIntelligence] = useState<NicheIntelligence | null>(null);
  const [nicheLoading, setNicheLoading] = useState(false);
  const [competitiveIntelligence, setCompetitiveIntelligence] = useState<CompetitiveIntelligence | null>(null);
  const [competitiveLoading, setCompetitiveLoading] = useState(false);
  
  // Check SMTP configuration status
  useEffect(() => {
    const checkSMTP = async () => {
      const configured = await isSMTPConfigured();
      setSMTPConfigured(configured);
    };
    checkSMTP();
  }, []);
  
  // Show strategies section when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setShowStrategies(true);
    }
  }, [selectedTemplate]);
  
  // Load niche intelligence when search query changes (only for niche research mode)
  useEffect(() => {
    if (!showNicheIntelligence) return;
    
    if (searchQuery && searchQuery.length > 2) {
      // Check cache first
      const cached = getCachedNicheIntelligence(searchQuery);
      if (cached) {
        setNicheIntelligence(cached);
        return;
      }
      
      // Generate new niche intelligence
      const loadNicheIntelligence = async () => {
        setNicheLoading(true);
        try {
          const response = await generateNicheIntelligence(searchQuery, searchLocation, passedLeads || []);
          if (response.success && response.data) {
            setNicheIntelligence(response.data);
            cacheNicheIntelligence(searchQuery, response.data);
          }
        } catch (error) {
          console.error('Failed to load niche intelligence:', error);
        } finally {
          setNicheLoading(false);
        }
      };
      
      loadNicheIntelligence();
    }
  }, [searchQuery, searchLocation, passedLeads, showNicheIntelligence]);
  
  // Load competitive intelligence when search query changes (only for competitive research mode)
  useEffect(() => {
    if (!showCompetitiveAnalysis) return;
    
    if (searchQuery && searchQuery.length > 2) {
      // Check cache first
      const cached = getCachedCompetitiveIntelligence(searchQuery);
      if (cached) {
        setCompetitiveIntelligence(cached);
        return;
      }
      
      // Generate new competitive intelligence
      const loadCompetitiveIntelligence = async () => {
        setCompetitiveLoading(true);
        try {
          // Get myBusiness info from sessionStorage if available
          let myBusiness = undefined;
          try {
            const stored = sessionStorage.getItem('bamlead_my_business_info');
            if (stored) myBusiness = JSON.parse(stored);
          } catch {}
          
          const response = await generateCompetitiveIntelligence(searchQuery, searchLocation, passedLeads || [], myBusiness);
          if (response.success && response.data) {
            setCompetitiveIntelligence(response.data);
            cacheCompetitiveIntelligence(searchQuery, response.data);
          }
        } catch (error) {
          console.error('Failed to load competitive intelligence:', error);
        } finally {
          setCompetitiveLoading(false);
        }
      };
      
      loadCompetitiveIntelligence();
    }
  }, [searchQuery, searchLocation, passedLeads, showCompetitiveAnalysis]);

  // Get lead analysis from passed props OR fall back to storage
  const leadAnalysis = useMemo(() => {
    // If leads passed as prop, use them directly
    if (passedLeads && passedLeads.length > 0) {
      return passedLeads.map(lead => ({
        id: lead.id,
        businessName: lead.name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        aiClassification: lead.aiClassification,
        leadScore: lead.leadScore,
        successProbability: lead.successProbability,
        painPoints: lead.painPoints || [],
        websiteAnalysis: lead.websiteAnalysis ? {
          hasWebsite: lead.websiteAnalysis.hasWebsite,
          needsUpgrade: lead.websiteAnalysis.needsUpgrade || false,
          mobileScore: lead.websiteAnalysis.mobileScore,
          issues: lead.websiteAnalysis.issues || [],
          opportunities: [],
        } : {
          hasWebsite: !!lead.website,
          needsUpgrade: false,
          mobileScore: undefined,
          issues: [],
          opportunities: [],
        },
      })) as LeadAnalysisContext[];
    }
    // Fall back to storage
    return getStoredLeadContext();
  }, [passedLeads]);
  
  // Calculate insights
  const insights = useMemo(() => {
    const total = leadAnalysis.length;
    if (total === 0) return null;
    
    const noWebsite = leadAnalysis.filter(l => !l.websiteAnalysis?.hasWebsite);
    const needsUpgrade = leadAnalysis.filter(l => l.websiteAnalysis?.needsUpgrade);
    const poorMobile = leadAnalysis.filter(l => 
      l.websiteAnalysis?.mobileScore !== undefined && 
      l.websiteAnalysis.mobileScore < 50
    );
    const hotLeads = leadAnalysis.filter(l => l.aiClassification === 'hot');
    const warmLeads = leadAnalysis.filter(l => l.aiClassification === 'warm');
    const coldLeads = leadAnalysis.filter(l => l.aiClassification === 'cold' || !l.aiClassification);
    const withPainPoints = leadAnalysis.filter(l => l.painPoints && l.painPoints.length > 0);
    const withPhone = leadAnalysis.filter(l => l.phone);
    const withEmail = leadAnalysis.filter(l => l.email);
    
    // Top pain points across all leads
    const painPointCounts: Record<string, number> = {};
    leadAnalysis.forEach(l => {
      l.painPoints?.forEach(pp => {
        painPointCounts[pp] = (painPointCounts[pp] || 0) + 1;
      });
    });
    const topPainPoints = Object.entries(painPointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([point, count]) => ({ point, count }));
    
    // Website issues
    const issueCounts: Record<string, number> = {};
    leadAnalysis.forEach(l => {
      l.websiteAnalysis?.issues?.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
    });
    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
    
    return {
      total,
      noWebsite,
      needsUpgrade,
      poorMobile,
      hotLeads,
      warmLeads,
      coldLeads,
      withPainPoints,
      withPhone,
      withEmail,
      topPainPoints,
      topIssues,
    };
  }, [leadAnalysis]);
  
  // Generate 10+ AI-recommended Email Follow-Up Strategies based on analysis
  const allStrategies = useMemo<EmailStrategy[]>(() => {
    if (!insights) return [];
    
    const strategies: EmailStrategy[] = [];
    
    // ===== SUPER AI (GMB) STRATEGIES =====
    // Strategy 1: No Website leads
    if (insights.noWebsite.length > 0) {
      strategies.push({
        id: 'no-website',
        name: 'No Website Outreach',
        emoji: '🌐',
        description: `${insights.noWebsite.length} businesses without websites - high opportunity for web services`,
        targetLeads: insights.noWebsite.length,
        subjectTemplate: '{{business_name}} - Quick question about your online presence',
        openerTemplate: 'I noticed {{business_name}} doesn\'t have a website yet, and many of your competitors are attracting customers online...',
        ctaTemplate: 'Would you be open to a quick 10-minute call to discuss your options?',
        priority: 'hot',
        followUpDays: [1, 3, 5, 7],
        searchTypeFilter: 'gmb',
      });
    }
    
    // Strategy 2: Website Upgrade needed
    if (insights.needsUpgrade.length > 0) {
      strategies.push({
        id: 'needs-upgrade',
        name: 'Website Upgrade Pitch',
        emoji: '🔧',
        description: `${insights.needsUpgrade.length} websites need modernization - show them the issues`,
        targetLeads: insights.needsUpgrade.length,
        subjectTemplate: 'Found some quick wins for {{business_name}}\'s website',
        openerTemplate: 'I took a look at your website and noticed {{website_issues}}. These are quick fixes that could improve your conversions...',
        ctaTemplate: 'Want me to send over a free site audit with specific recommendations?',
        priority: 'warm',
        followUpDays: [1, 4, 7, 10],
        searchTypeFilter: 'gmb',
      });
    }
    
    // Strategy 3: Poor Mobile Score
    if (insights.poorMobile.length > 0) {
      strategies.push({
        id: 'poor-mobile',
        name: 'Mobile Optimization',
        emoji: '📱',
        description: `${insights.poorMobile.length} sites fail mobile tests - 60%+ of traffic is mobile`,
        targetLeads: insights.poorMobile.length,
        subjectTemplate: '{{business_name}} - Your website is losing mobile customers',
        openerTemplate: 'I ran a quick mobile test on your website and it scored {{mobile_score}}. With 60% of web traffic coming from phones, this could be costing you customers...',
        ctaTemplate: 'Can I show you what a mobile-optimized version would look like?',
        priority: 'hot',
        followUpDays: [1, 3, 5],
        searchTypeFilter: 'gmb',
      });
    }
    
    // Strategy 4: Hot leads fast-track
    if (insights.hotLeads.length > 0) {
      strategies.push({
        id: 'hot-leads',
        name: 'Hot Lead Fast Close',
        emoji: '🔥',
        description: `${insights.hotLeads.length} high-intent leads ready for direct outreach`,
        targetLeads: insights.hotLeads.length,
        subjectTemplate: 'Quick opportunity for {{business_name}}',
        openerTemplate: 'I came across {{business_name}} and was impressed. I think there\'s a great fit for us to work together...',
        ctaTemplate: 'Let\'s hop on a quick call today to discuss how I can help.',
        priority: 'hot',
        followUpDays: [1, 2, 4],
        searchTypeFilter: 'both',
      });
    }
    
    // Strategy 5: Pain point focused
    if (insights.withPainPoints.length > 0 && insights.topPainPoints.length > 0) {
      strategies.push({
        id: 'pain-focused',
        name: 'Pain Point Solution',
        emoji: '💊',
        description: `Address top pain points: ${insights.topPainPoints.slice(0, 2).map(p => p.point).join(', ')}`,
        targetLeads: insights.withPainPoints.length,
        subjectTemplate: 'Solving {{main_pain_point}} for {{business_name}}',
        openerTemplate: 'I noticed {{business_name}} might be dealing with {{main_pain_point}}. I\'ve helped similar businesses overcome this...',
        ctaTemplate: 'Would you like to see how we solved this for [similar business]?',
        priority: 'warm',
        followUpDays: [1, 3, 7, 14],
        searchTypeFilter: 'both',
      });
    }
    
    // Strategy 6: Social Proof & Authority
    if (insights.warmLeads.length > 0) {
      strategies.push({
        id: 'social-proof',
        name: 'Social Proof & Authority',
        emoji: '⭐',
        description: 'Build trust with testimonials and case studies before pitching',
        targetLeads: insights.warmLeads.length,
        subjectTemplate: 'How {{similar_business}} increased revenue by 40%',
        openerTemplate: 'Last month, I helped a {{industry}} business similar to {{business_name}} achieve incredible results...',
        ctaTemplate: 'Want me to share the exact strategy we used?',
        priority: 'warm',
        followUpDays: [1, 4, 7, 10],
        searchTypeFilter: 'both',
      });
    }
    
    // Strategy 7: Re-engagement
    if (insights.coldLeads.length > 0) {
      strategies.push({
        id: 're-engagement',
        name: 'Re-Engagement Campaign',
        emoji: '🔄',
        description: `${insights.coldLeads.length} cold leads that need a fresh approach`,
        targetLeads: insights.coldLeads.length,
        subjectTemplate: 'Still interested in growing {{business_name}}?',
        openerTemplate: 'A while back I reached out about helping {{business_name}}. I know things get busy...',
        ctaTemplate: 'Is now a better time to chat?',
        priority: 'cold',
        followUpDays: [1, 5, 10, 15],
        searchTypeFilter: 'both',
      });
    }
    
    // Strategy 8: Competitor Analysis (GMB)
    strategies.push({
      id: 'competitor-analysis',
      name: 'Competitor Advantage',
      emoji: '🎯',
      description: 'Show how competitors are outperforming them online',
      targetLeads: Math.floor(insights.total * 0.6),
      subjectTemplate: 'What your competitors are doing differently',
      openerTemplate: 'I analyzed {{business_name}}\'s top 3 local competitors and found some interesting insights...',
      ctaTemplate: 'Want to see the full competitive analysis?',
      priority: 'warm',
      followUpDays: [1, 3, 6, 10],
      searchTypeFilter: 'gmb',
    });
    
    // Strategy 9: Local SEO Focus (GMB)
    strategies.push({
      id: 'local-seo',
      name: 'Local SEO Boost',
      emoji: '📍',
      description: 'Help businesses dominate local search results',
      targetLeads: Math.floor(insights.total * 0.7),
      subjectTemplate: '{{business_name}} isn\'t showing up when people search for {{industry}}',
      openerTemplate: 'I searched for "{{industry}} near me" and noticed {{business_name}} wasn\'t in the top results...',
      ctaTemplate: 'Let me show you 3 quick fixes to get you ranking higher.',
      priority: 'warm',
      followUpDays: [1, 4, 7, 12],
      searchTypeFilter: 'gmb',
    });
    
    // Strategy 10: Review Management (GMB)
    strategies.push({
      id: 'review-management',
      name: 'Review & Reputation',
      emoji: '💬',
      description: 'Help businesses improve their online reputation',
      targetLeads: Math.floor(insights.total * 0.5),
      subjectTemplate: '{{business_name}} deserves more 5-star reviews',
      openerTemplate: 'I noticed {{business_name}} has great reviews but could use more of them. Here\'s why that matters...',
      ctaTemplate: 'Want me to share our review generation strategy?',
      priority: 'warm',
      followUpDays: [1, 3, 7, 14],
      searchTypeFilter: 'gmb',
    });
    
    // ===== AGENCY LEAD FINDER (PLATFORM) STRATEGIES =====
    // Strategy 11: SEO Audit Offer
    strategies.push({
      id: 'seo-audit',
      name: 'Free SEO Audit',
      emoji: '🔍',
      description: 'Offer a comprehensive SEO analysis as a conversation starter',
      targetLeads: Math.floor(insights.total * 0.8),
      subjectTemplate: 'Free SEO audit for {{business_name}}',
      openerTemplate: 'I ran a quick analysis on {{business_name}}\'s website and found some opportunities to improve your search rankings...',
      ctaTemplate: 'Want me to send over the full audit report?',
      priority: 'warm',
      followUpDays: [1, 3, 7, 10],
      searchTypeFilter: 'platform',
    });
    
    // Strategy 12: Website Redesign Pitch
    strategies.push({
      id: 'redesign-pitch',
      name: 'Website Redesign',
      emoji: '🎨',
      description: 'Pitch modern website redesign for outdated sites',
      targetLeads: insights.needsUpgrade.length || Math.floor(insights.total * 0.4),
      subjectTemplate: 'A fresh look for {{business_name}}\'s website',
      openerTemplate: 'Your website is doing a lot right, but I noticed some design elements that might be holding you back...',
      ctaTemplate: 'Can I show you a quick mockup of what a refreshed version could look like?',
      priority: 'warm',
      followUpDays: [1, 4, 8, 14],
      searchTypeFilter: 'platform',
    });
    
    // Strategy 13: PPC/Ads Management
    strategies.push({
      id: 'ppc-management',
      name: 'Ads Management',
      emoji: '📈',
      description: 'Offer to manage their paid advertising campaigns',
      targetLeads: Math.floor(insights.total * 0.6),
      subjectTemplate: 'Stop wasting money on ads for {{business_name}}',
      openerTemplate: 'Most businesses in {{industry}} waste 30-50% of their ad budget. I can help you optimize...',
      ctaTemplate: 'Want a free ad account audit?',
      priority: 'hot',
      followUpDays: [1, 3, 5, 10],
      searchTypeFilter: 'platform',
    });
    
    // Strategy 14: Social Media Management
    strategies.push({
      id: 'social-media',
      name: 'Social Media Growth',
      emoji: '📱',
      description: 'Offer social media management and growth services',
      targetLeads: Math.floor(insights.total * 0.7),
      subjectTemplate: '{{business_name}} could be getting more customers from social media',
      openerTemplate: 'I noticed {{business_name}} has a social media presence but could be leveraging it much more effectively...',
      ctaTemplate: 'Want to see our social media strategy for {{industry}} businesses?',
      priority: 'warm',
      followUpDays: [1, 4, 7, 12],
      searchTypeFilter: 'platform',
    });
    
    // Strategy 15: Content Marketing
    strategies.push({
      id: 'content-marketing',
      name: 'Content Strategy',
      emoji: '✍️',
      description: 'Propose content marketing to drive organic traffic',
      targetLeads: Math.floor(insights.total * 0.5),
      subjectTemplate: 'Content that actually drives customers to {{business_name}}',
      openerTemplate: 'Most {{industry}} businesses miss the mark with content. Here\'s what actually works...',
      ctaTemplate: 'Want me to share some content ideas tailored to your business?',
      priority: 'cold',
      followUpDays: [1, 5, 10, 15],
      searchTypeFilter: 'platform',
    });
    
    return strategies;
  }, [insights]);
  
  // Filter strategies by search type
  const filteredStrategies = useMemo(() => {
    return allStrategies.filter(s => {
      if (s.searchTypeFilter === 'both') return true;
      if (!searchType) return true;
      return s.searchTypeFilter === searchType;
    });
  }, [allStrategies, searchType]);
  
  if (!insights || insights.total === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/10">
        <CardContent className="py-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No lead analysis data available</p>
          <p className="text-sm text-muted-foreground/70">Run a search in Step 1 to generate intelligence</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleApplyStrategy = (strategy: EmailStrategy) => {
    setSelectedStrategy(strategy.id);
    onApplyStrategy?.(strategy);
    onOpenCompose?.(strategy);
  };
  
  // Get current step for breadcrumb based on template selection
  const currentStep = selectedTemplate ? 4 : 3;
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb Trail */}
      <Card className="border border-border bg-card/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {BREADCRUMB_STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  step.id === currentStep
                    ? "bg-primary/20 border-2 border-primary text-primary"
                    : step.id < currentStep
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                )}>
                  <step.icon className="w-4 h-4" />
                  <div className="hidden sm:block">
                    <span className="text-xs font-medium">Step {step.id}</span>
                    <span className="text-xs opacity-70 ml-1">• {step.label}</span>
                  </div>
                  <span className="sm:hidden text-xs font-medium">{step.id}</span>
                  {step.id < currentStep && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                {idx < BREADCRUMB_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedTemplate 
              ? "✅ Template selected! Now choose an AI Follow-Up Strategy to enhance your outreach."
              : "Choose an email template first to continue to the follow-up strategy step."}
          </p>
        </CardContent>
      </Card>

      {/* STEP A: Choose Email Template - SHOWN FIRST */}
      <Card className={cn(
        "border-2 transition-all",
        selectedTemplate 
          ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
          : "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                selectedTemplate 
                  ? "bg-emerald-500/20" 
                  : "bg-primary/20"
              )}>
                {selectedTemplate ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Mail className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Step A: Choose Email Template
                  {selectedTemplate && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      ✓ Selected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedTemplate 
                    ? "Your template is ready. You can change it or proceed to strategies below."
                    : "Pick an email template that matches your outreach goals"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {selectedTemplate ? (
            <div className="space-y-4">
              {/* Show selected template preview */}
              <div className="p-4 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected Template</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onOpenTemplates}
                    className="gap-2"
                  >
                    <Edit3 className="w-3 h-3" />
                    Change Template
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Subject:</span>
                    <p className="text-sm font-medium text-foreground">{selectedTemplate.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {(selectedTemplate.body || '').slice(0, 150)}...
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Arrow indicating next step */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-primary">
                  <ArrowRight className="w-5 h-5" />
                  <span className="text-sm font-medium">Now refine with an AI Strategy below</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Select Your Email Template First
              </h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Choose a proven email template from our library. This will be your base message that AI strategies can enhance with smart follow-ups.
              </p>
              <Button 
                size="lg" 
                onClick={onOpenTemplates}
                className="gap-2"
              >
                <FileText className="w-5 h-5" />
                Browse Email Templates
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP B: AI Follow-Up Strategies - SHOWN AFTER TEMPLATE SELECTED */}
      <AnimatePresence>
        {showStrategies && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        AI Follow-Up Strategies
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {filteredStrategies.length} Available
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          searchType === 'gmb' 
                            ? "border-emerald-500/30 text-emerald-400" 
                            : "border-purple-500/30 text-purple-400"
                        )}>
                          {searchType === 'gmb' ? '🧠 Super AI Business Search' : '🎯 Agency Lead Finder'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Choose or let AI Autopilot select for you</span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* AI Autopilot Notice */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        How AI Strategies Work
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                          AI Autopilot
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        With <strong className="text-amber-400">AI Autopilot Campaign</strong>, the AI automatically selects the best strategy for each lead based on their profile. You can still:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span><strong>Review all strategies</strong> below to understand what the AI will use</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span><strong>Edit any strategy</strong> in the compose window before sending</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span><strong>Choose manually</strong> if you prefer a specific approach</span>
                        </li>
                      </ul>
                      <div className="mt-3 p-2 rounded-lg bg-background/80 border border-border">
                        <p className="text-xs text-muted-foreground">
                          💡 <strong>Pro Tip:</strong> Click any strategy card to preview it, then edit the subject/body in the compose window. The AI provides smart defaults, but you have full control!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Grid - Colorful Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredStrategies.map((strategy, idx) => {
                    // Alternate colors for variety
                    const colorSchemes = [
                      { border: 'border-rose-500/40', bg: 'bg-rose-500/5', hoverBorder: 'hover:border-rose-500/60', hoverBg: 'hover:bg-rose-500/10', accent: 'text-rose-400', btnBg: 'bg-rose-500 hover:bg-rose-600' },
                      { border: 'border-amber-500/40', bg: 'bg-amber-500/5', hoverBorder: 'hover:border-amber-500/60', hoverBg: 'hover:bg-amber-500/10', accent: 'text-amber-400', btnBg: 'bg-amber-500 hover:bg-amber-600' },
                      { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', hoverBorder: 'hover:border-emerald-500/60', hoverBg: 'hover:bg-emerald-500/10', accent: 'text-emerald-400', btnBg: 'bg-emerald-500 hover:bg-emerald-600' },
                      { border: 'border-cyan-500/40', bg: 'bg-cyan-500/5', hoverBorder: 'hover:border-cyan-500/60', hoverBg: 'hover:bg-cyan-500/10', accent: 'text-cyan-400', btnBg: 'bg-cyan-500 hover:bg-cyan-600' },
                      { border: 'border-purple-500/40', bg: 'bg-purple-500/5', hoverBorder: 'hover:border-purple-500/60', hoverBg: 'hover:bg-purple-500/10', accent: 'text-purple-400', btnBg: 'bg-purple-500 hover:bg-purple-600' },
                      { border: 'border-pink-500/40', bg: 'bg-pink-500/5', hoverBorder: 'hover:border-pink-500/60', hoverBg: 'hover:bg-pink-500/10', accent: 'text-pink-400', btnBg: 'bg-pink-500 hover:bg-pink-600' },
                    ];
                    const colors = colorSchemes[idx % colorSchemes.length];
                    
                    return (
                      <motion.div
                        key={strategy.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all group",
                          selectedStrategy === strategy.id
                            ? `${colors.border} ${colors.bg} shadow-lg`
                            : `border-border bg-card ${colors.hoverBorder} ${colors.hoverBg}`
                        )}
                        onClick={() => handleApplyStrategy(strategy)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{strategy.emoji || '📧'}</span>
                            <h5 className={cn("font-semibold text-sm", selectedStrategy === strategy.id && colors.accent)}>{strategy.name}</h5>
                          </div>
                          <Badge className={cn(
                            "text-[10px]",
                            strategy.priority === 'hot' && "bg-rose-500/20 text-rose-400 border-rose-500/30",
                            strategy.priority === 'warm' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                            strategy.priority === 'cold' && "bg-sky-500/20 text-sky-400 border-sky-500/30"
                          )}>
                            {strategy.targetLeads} leads
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{strategy.description}</p>
                        
                        <div className="space-y-2">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Subject: </span>
                            <span className="text-foreground italic">"{strategy.subjectTemplate}"</span>
                          </div>
                          {strategy.followUpDays && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Follow-ups: Day {strategy.followUpDays.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Hover Action */}
                        <div className={cn(
                          "mt-3 pt-3 border-t border-border/50 transition-all",
                          selectedStrategy === strategy.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <Button size="sm" className={cn("w-full gap-2 text-white", colors.btnBg)}>
                            <Edit3 className="w-3 h-3" />
                            Select & Edit in Composer
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Skip Strategy Option */}
                <div className="flex items-center justify-center pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onOpenCompose?.({
                      id: 'custom',
                      name: 'Custom Campaign',
                      description: 'Use your template without AI enhancements',
                      targetLeads: insights?.total || 0,
                      subjectTemplate: selectedTemplate.subject,
                      openerTemplate: selectedTemplate.body,
                      ctaTemplate: '',
                      priority: 'warm',
                    })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Skip strategy and use template as-is →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intelligence Report with Tabs */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <Collapsible open={intelligenceExpanded} onOpenChange={setIntelligenceExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      🧠 Complete Intelligence Report
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        12 Categories
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Niche trends, market analysis, products/services, and lead-level insights
                    </CardDescription>
                  </div>
                </div>
                {intelligenceExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {showNicheIntelligence ? (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leads' | 'niche')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="niche" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Niche & Market Intelligence
                    </TabsTrigger>
                    <TabsTrigger value="leads" className="gap-2">
                      <Users className="w-4 h-4" />
                      Lead-Level Analysis
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Niche Intelligence Tab */}
                  <TabsContent value="niche" className="mt-0">
                    <NicheIntelligencePanel 
                      nicheIntelligence={nicheIntelligence}
                      isLoading={nicheLoading}
                      searchQuery={searchQuery}
                      onRefresh={async () => {
                        setNicheLoading(true);
                        try {
                          const response = await generateNicheIntelligence(searchQuery, searchLocation, passedLeads || []);
                          if (response.success && response.data) {
                            setNicheIntelligence(response.data);
                            cacheNicheIntelligence(searchQuery, response.data);
                          }
                        } finally {
                          setNicheLoading(false);
                        }
                      }}
                    />
                  </TabsContent>
                
                {/* Lead-Level Analysis Tab */}
                <TabsContent value="leads" className="mt-0 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-destructive">{insights.hotLeads.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3" /> Hot
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-warning">{insights.warmLeads.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <ThermometerSun className="w-3 h-3" /> Warm
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-accent">{insights.coldLeads.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Snowflake className="w-3 h-3" /> Cold
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-primary">{insights.noWebsite.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Globe className="w-3 h-3" /> No Site
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-secondary-foreground">{insights.needsUpgrade.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Upgrade
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{insights.poorMobile.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Smartphone className="w-3 h-3" /> Bad Mobile
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Pain Points & Issues */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pain Points */}
                    {insights.topPainPoints.length > 0 && (
                      <div className="p-4 rounded-xl bg-background border border-border">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-warning" />
                          Top Pain Points Detected
                        </h4>
                        <div className="space-y-2">
                          {insights.topPainPoints.map((pp, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground truncate flex-1">{pp.point}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">{pp.count} leads</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Website Issues */}
                    {insights.topIssues.length > 0 && (
                      <div className="p-4 rounded-xl bg-background border border-border">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          Website Issues Found
                        </h4>
                        <div className="space-y-2">
                          {insights.topIssues.map((issue, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground truncate flex-1">{issue.issue}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">{issue.count} sites</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Mail Server Setup Section */}
                  {!smtpConfigured && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-warning/10 border-2 border-warning/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                          <Server className="w-6 h-6 text-warning" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            Setup Your Mail Server
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Connect your SMTP mail server to send emails to your {insights.total} leads.
                          </p>
                        </div>
                        <Button 
                          onClick={onOpenSettings}
                          className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground flex-shrink-0"
                        >
                          <Settings className="w-4 h-4" />
                          Configure SMTP
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* SMTP Configured Success */}
                  {smtpConfigured && (
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-accent">Mail Server Connected</span>
                          <span className="text-xs text-muted-foreground ml-2">Ready to send emails</span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              ) : showCompetitiveAnalysis ? (
                /* Competitive Analysis Mode - SWOT & Market Positioning */
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leads' | 'niche' | 'competitive')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="competitive" className="gap-2">
                      <Target className="w-4 h-4" />
                      SWOT & Competitive Analysis
                    </TabsTrigger>
                    <TabsTrigger value="leads" className="gap-2">
                      <Users className="w-4 h-4" />
                      Competitor Details
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Competitive Analysis Tab */}
                  <TabsContent value="competitive" className="mt-0">
                    <CompetitiveAnalysisPanel 
                      data={competitiveIntelligence}
                      loading={competitiveLoading}
                      searchQuery={searchQuery}
                    />
                  </TabsContent>
                
                  {/* Competitor Details Tab */}
                  <TabsContent value="leads" className="mt-0 space-y-6">
                    {/* Quick Stats for Competitors */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-background border border-border text-center">
                        <div className="text-2xl font-bold text-destructive">{insights.hotLeads.length}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Flame className="w-3 h-3" /> Strong Competitors
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border text-center">
                        <div className="text-2xl font-bold text-warning">{insights.warmLeads.length}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <ThermometerSun className="w-3 h-3" /> Challengers
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border text-center">
                        <div className="text-2xl font-bold text-accent">{insights.coldLeads.length}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Snowflake className="w-3 h-3" /> Minor Players
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border text-center">
                        <div className="text-2xl font-bold text-primary">{insights.total}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Users className="w-3 h-3" /> Total Analyzed
                        </div>
                      </div>
                    </div>
                    
                    {/* Competitor List */}
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {leadAnalysis.slice(0, 20).map((lead, idx) => (
                          <div 
                            key={lead.id || idx}
                            className={cn(
                              "p-3 rounded-lg border transition-colors hover:bg-muted/50",
                              lead.aiClassification === 'hot' && "border-destructive/30 bg-destructive/5",
                              lead.aiClassification === 'warm' && "border-warning/30 bg-warning/5",
                              lead.aiClassification === 'cold' && "border-muted"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{lead.businessName}</span>
                                  <Badge variant={
                                    lead.aiClassification === 'hot' ? 'destructive' :
                                    lead.aiClassification === 'warm' ? 'default' : 'secondary'
                                  } className="text-xs">
                                    {lead.aiClassification === 'hot' ? 'Strong' :
                                     lead.aiClassification === 'warm' ? 'Challenger' : 'Minor'}
                                  </Badge>
                                </div>
                                {lead.website && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.website}</p>
                                )}
                              </div>
                              {lead.leadScore && (
                                <div className="text-right">
                                  <div className="text-sm font-semibold">{lead.leadScore}%</div>
                                  <div className="text-xs text-muted-foreground">threat</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                /* Lead-Level Analysis Only (no tabs for Platform search mode) */
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-destructive">{insights.hotLeads.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3" /> Hot
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-warning">{insights.warmLeads.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <ThermometerSun className="w-3 h-3" /> Warm
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-accent">{insights.coldLeads.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Snowflake className="w-3 h-3" /> Cold
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-primary">{insights.total}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> Total
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-secondary-foreground">{insights.withEmail.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Mail className="w-3 h-3" /> With Email
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{insights.withPhone.length}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3" /> With Phone
                      </div>
                    </div>
                  </div>

                  {/* SMTP Status */}
                  {!smtpConfigured && onOpenSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-warning/10 border border-warning/30"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                            <Server className="w-5 h-5 text-warning" />
                          </div>
                          <h4 className="font-semibold text-warning">
                            Setup Your Mail Server
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Connect your SMTP mail server to send emails to your {insights.total} leads.
                          </p>
                        </div>
                        <Button 
                          onClick={onOpenSettings}
                          className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground flex-shrink-0"
                        >
                          <Settings className="w-4 h-4" />
                          Configure SMTP
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* SMTP Configured Success */}
                  {smtpConfigured && (
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-accent">Mail Server Connected</span>
                          <span className="text-xs text-muted-foreground ml-2">Ready to send emails</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
