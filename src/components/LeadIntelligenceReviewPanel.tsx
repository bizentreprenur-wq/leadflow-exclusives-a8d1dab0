import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Lightbulb, Target, Globe, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Flame, ThermometerSun, Snowflake,
  Smartphone, Zap, MessageSquare, TrendingUp, FileText,
  Mail, Sparkles, Eye, X, Phone, Server, Settings, ArrowRight
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
}

interface EmailStrategy {
  id: string;
  name: string;
  description: string;
  targetLeads: number;
  subjectTemplate: string;
  openerTemplate: string;
  ctaTemplate: string;
  priority: 'hot' | 'warm' | 'cold';
}

export default function LeadIntelligenceReviewPanel({ 
  onApplyStrategy, 
  onClose,
  searchType,
  onOpenSettings
}: LeadIntelligenceReviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [smtpConfigured, setSMTPConfigured] = useState(false);
  
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
  
  // Generate AI-recommended email strategies based on analysis
  const recommendedStrategies = useMemo<EmailStrategy[]>(() => {
    if (!insights) return [];
    
    const strategies: EmailStrategy[] = [];
    
    // Strategy 1: No Website leads
    if (insights.noWebsite.length > 0) {
      strategies.push({
        id: 'no-website',
        name: '🌐 No Website Outreach',
        description: `${insights.noWebsite.length} businesses without websites - high opportunity for web services`,
        targetLeads: insights.noWebsite.length,
        subjectTemplate: '{{business_name}} - Quick question about your online presence',
        openerTemplate: 'I noticed {{business_name}} doesn\'t have a website yet, and many of your competitors are attracting customers online...',
        ctaTemplate: 'Would you be open to a quick 10-minute call to discuss your options?',
        priority: 'hot',
      });
    }
    
    // Strategy 2: Website Upgrade needed
    if (insights.needsUpgrade.length > 0) {
      strategies.push({
        id: 'needs-upgrade',
        name: '🔧 Website Upgrade Pitch',
        description: `${insights.needsUpgrade.length} websites need modernization - show them the issues`,
        targetLeads: insights.needsUpgrade.length,
        subjectTemplate: 'Found some quick wins for {{business_name}}\'s website',
        openerTemplate: 'I took a look at your website and noticed {{website_issues}}. These are quick fixes that could improve your conversions...',
        ctaTemplate: 'Want me to send over a free site audit with specific recommendations?',
        priority: 'warm',
      });
    }
    
    // Strategy 3: Poor Mobile Score
    if (insights.poorMobile.length > 0) {
      strategies.push({
        id: 'poor-mobile',
        name: '📱 Mobile Optimization',
        description: `${insights.poorMobile.length} sites fail mobile tests - 60%+ of traffic is mobile`,
        targetLeads: insights.poorMobile.length,
        subjectTemplate: '{{business_name}} - Your website is losing mobile customers',
        openerTemplate: 'I ran a quick mobile test on your website and it scored {{mobile_score}}. With 60% of web traffic coming from phones, this could be costing you customers...',
        ctaTemplate: 'Can I show you what a mobile-optimized version would look like?',
        priority: 'hot',
      });
    }
    
    // Strategy 4: Hot leads fast-track
    if (insights.hotLeads.length > 0) {
      strategies.push({
        id: 'hot-leads',
        name: '🔥 Hot Lead Fast Close',
        description: `${insights.hotLeads.length} high-intent leads ready for direct outreach`,
        targetLeads: insights.hotLeads.length,
        subjectTemplate: 'Quick opportunity for {{business_name}}',
        openerTemplate: 'I came across {{business_name}} and was impressed. I think there\'s a great fit for us to work together...',
        ctaTemplate: 'Let\'s hop on a quick call today to discuss how I can help.',
        priority: 'hot',
      });
    }
    
    // Strategy 5: Pain point focused
    if (insights.withPainPoints.length > 0 && insights.topPainPoints.length > 0) {
      strategies.push({
        id: 'pain-focused',
        name: '💊 Pain Point Solution',
        description: `Address top pain points: ${insights.topPainPoints.slice(0, 2).map(p => p.point).join(', ')}`,
        targetLeads: insights.withPainPoints.length,
        subjectTemplate: 'Solving {{main_pain_point}} for {{business_name}}',
        openerTemplate: 'I noticed {{business_name}} might be dealing with {{main_pain_point}}. I\'ve helped similar businesses overcome this...',
        ctaTemplate: 'Would you like to see how we solved this for [similar business]?',
        priority: 'warm',
      });
    }
    
    return strategies;
  }, [insights]);
  
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
  };
  
  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5 overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Lead Intelligence Report
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {insights.total} Leads Analyzed
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights from your Step 1 search • Click to {isExpanded ? 'collapse' : 'expand'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onClose && (
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
                {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
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
            
            {/* AI-Recommended Strategies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-Recommended Email Strategies
                </h4>
                <Badge variant="outline" className="text-xs">
                  Based on your lead analysis
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedStrategies.map((strategy) => (
                  <motion.div
                    key={strategy.id}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedStrategy === strategy.id
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                    onClick={() => handleApplyStrategy(strategy)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-sm">{strategy.name}</h5>
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
                    </div>
                    
                    {selectedStrategy === strategy.id && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-primary">
                          <CheckCircle2 className="w-4 h-4" />
                          Strategy applied to campaign
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Action Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">How AI Uses This Data</h4>
                  <p className="text-xs text-muted-foreground">
                    {searchType === 'gmb' 
                      ? 'AI Autopilot will craft personalized emails based on each lead\'s website status, pain points, and business insights from your Super AI search.'
                      : 'AI Autopilot will target leads based on their platform, identified issues, and upgrade potential from your Agency Finder search.'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mail Server Setup Section - Shows when SMTP not configured */}
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
                      Connect your SMTP mail server to send emails to your {insights.total} leads. Without this, you won't be able to send outreach campaigns.
                    </p>
                  </div>
                  <Button 
                    onClick={onOpenSettings}
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
                  >
                    <Settings className="w-4 h-4" />
                    Configure SMTP
                    <ArrowRight className="w-4 h-4" />
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
  );
}
