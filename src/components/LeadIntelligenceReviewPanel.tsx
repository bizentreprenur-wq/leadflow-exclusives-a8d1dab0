import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain, Lightbulb, Target, Globe, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Flame, ThermometerSun, Snowflake,
  Smartphone, Zap, MessageSquare, TrendingUp, FileText,
  Mail, Sparkles, Eye, X, Phone, Server, Settings, ArrowRight,
  Search, Users, Send, ChevronRight, Rocket, Star, RefreshCw,
  Shield, Clock, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getStoredLeadContext, 
  LeadAnalysisContext,
  generateEmailSuggestionsFromContext 
} from '@/lib/leadContext';
import { isSMTPConfigured } from '@/lib/emailService';

interface LeadIntelligenceReviewPanelProps {
  onApplyStrategy?: (strategy: EmailStrategy) => void;
  onClose?: () => void;
  searchType?: 'gmb' | 'platform' | null;
  onOpenSettings?: () => void;
  onOpenCompose?: (strategy: EmailStrategy) => void;
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

// Breadcrumb step definition
const BREADCRUMB_STEPS = [
  { id: 1, label: 'Lead Acquisition', description: 'Search & Discovery', icon: Search },
  { id: 2, label: 'Lead Analysis', description: 'AI Intelligence', icon: Brain },
  { id: 3, label: 'Email Outreach', description: 'Template Selection', icon: Mail },
  { id: 4, label: 'Follow-Up Strategy', description: 'Current Step', icon: Rocket },
];

export default function LeadIntelligenceReviewPanel({ 
  onApplyStrategy, 
  onClose,
  searchType,
  onOpenSettings,
  onOpenCompose
}: LeadIntelligenceReviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [smtpConfigured, setSMTPConfigured] = useState(false);
  const [intelligenceExpanded, setIntelligenceExpanded] = useState(false);
  
  // Check SMTP configuration status
  useEffect(() => {
    const checkSMTP = async () => {
      const configured = await isSMTPConfigured();
      setSMTPConfigured(configured);
    };
    checkSMTP();
  }, []);
  
  // Get lead analysis from Step 1/2
  const leadAnalysis = useMemo(() => getStoredLeadContext(), []);
  
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
                  idx === BREADCRUMB_STEPS.length - 1
                    ? "bg-primary/20 border-2 border-primary text-primary"
                    : idx < BREADCRUMB_STEPS.length - 1
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                )}>
                  <step.icon className="w-4 h-4" />
                  <div className="hidden sm:block">
                    <span className="text-xs font-medium">Step {step.id}</span>
                    <span className="text-xs opacity-70 ml-1">• {step.label}</span>
                  </div>
                  <span className="sm:hidden text-xs font-medium">{step.id}</span>
                  {idx < BREADCRUMB_STEPS.length - 1 && (
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
            You've completed lead discovery and analysis. Now choose an Email Follow-Up Strategy to launch your campaign.
          </p>
        </CardContent>
      </Card>

      {/* Email Follow-Up Strategies Section - PRIMARY FOCUS */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Email Follow-Up Strategies
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {filteredStrategies.length} Available
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    searchType === 'gmb' 
                      ? "border-emerald-500/30 text-emerald-400" 
                      : "border-violet-500/30 text-violet-400"
                  )}>
                    {searchType === 'gmb' ? '🧠 Super AI Business Search' : '🎯 Agency Lead Finder'}
                  </Badge>
                  <span className="text-xs">Click any strategy to open the compose window</span>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">How Email Follow-Up Strategies Work</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Each strategy is a pre-configured email campaign tailored to your lead analysis. Clicking a strategy will:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Open the Compose window with the template pre-loaded
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Setup automated follow-up sequences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Target the specific lead segment for this strategy
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Strategy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredStrategies.map((strategy) => (
              <motion.div
                key={strategy.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all group",
                  selectedStrategy === strategy.id
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                )}
                onClick={() => handleApplyStrategy(strategy)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{strategy.emoji || '📧'}</span>
                    <h5 className="font-semibold text-sm">{strategy.name}</h5>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    strategy.priority === 'hot' && "bg-red-500/20 text-red-400 border-red-500/30",
                    strategy.priority === 'warm' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                    strategy.priority === 'cold' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
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
                  "mt-3 pt-3 border-t border-border transition-all",
                  selectedStrategy === strategy.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <Button size="sm" className="w-full gap-2 bg-primary hover:bg-primary/90">
                    <Send className="w-3 h-3" />
                    Use This Strategy
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lead Intelligence Report - MOVED TO BOTTOM */}
      <Card className="border border-border bg-card/50">
        <Collapsible open={intelligenceExpanded} onOpenChange={setIntelligenceExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Brain className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Lead Intelligence Report
                      <Badge variant="secondary" className="text-xs">
                        {insights.total} Leads Analyzed
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Click to {intelligenceExpanded ? 'collapse' : 'expand'} detailed analysis from Step 2
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
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-2xl font-bold text-red-400">{insights.hotLeads.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3" /> Hot
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-2xl font-bold text-amber-400">{insights.warmLeads.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <ThermometerSun className="w-3 h-3" /> Warm
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-2xl font-bold text-blue-400">{insights.coldLeads.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Snowflake className="w-3 h-3" /> Cold
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-2xl font-bold text-orange-400">{insights.noWebsite.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Globe className="w-3 h-3" /> No Site
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-2xl font-bold text-purple-400">{insights.needsUpgrade.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Upgrade
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-2xl font-bold text-cyan-400">{insights.poorMobile.length}</div>
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
                      <Lightbulb className="w-4 h-4 text-amber-400" />
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
                      <AlertTriangle className="w-4 h-4 text-red-400" />
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
                  className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Server className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Setup Your Mail Server
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect your SMTP mail server to send emails to your {insights.total} leads.
                      </p>
                    </div>
                    <Button 
                      onClick={onOpenSettings}
                      className="gap-2 bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
                    >
                      <Settings className="w-4 h-4" />
                      Configure SMTP
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {/* SMTP Configured Success */}
              {smtpConfigured && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-emerald-400">Mail Server Connected</span>
                      <span className="text-xs text-muted-foreground ml-2">Ready to send emails</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
