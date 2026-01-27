import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Bot, Flame, ThermometerSun, Snowflake, Mail, Clock, CheckCircle2,
  AlertTriangle, MessageSquare, FileText, Send, Pause, Play, RefreshCw,
  TrendingUp, Zap, Eye, Target, Users, Calendar, ArrowRight,
  Sparkles, Phone, Globe, XCircle, MailOpen, Reply, Crown, CreditCard, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredLeadContext, LeadAnalysisContext } from '@/lib/leadContext';
import { EmailSequence } from '@/lib/emailSequences';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';
import AutopilotTrialWarning from './AutopilotTrialWarning';

interface AutopilotLead {
  id: string;
  businessName: string;
  email: string;
  priority: 'hot' | 'warm' | 'cold';
  sequenceId: string;
  sequenceName: string;
  currentStep: number;
  totalSteps: number;
  status: 'active' | 'paused' | 'completed' | 'responded' | 'proposal_ready';
  lastActivity: string;
  nextAction: string;
  nextActionTime: string;
  responseDetected?: boolean;
  responseType?: 'positive' | 'negative' | 'question' | 'unsubscribe';
  proposalReady?: boolean;
  emailsSent: number;
  opensCount: number;
  clicksCount: number;
  websiteStatus?: string;
  painPoints?: string[];
}

interface AIAutopilotDashboardProps {
  searchType?: 'gmb' | 'platform' | null;
  onViewLead?: (lead: AutopilotLead) => void;
  onPauseLead?: (leadId: string) => void;
  onResumeLead?: (leadId: string) => void;
  onSendProposal?: (leadId: string) => void;
}

export default function AIAutopilotDashboard({
  searchType,
  onViewLead,
  onPauseLead,
  onResumeLead,
  onSendProposal,
}: AIAutopilotDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'responded' | 'proposal_ready'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  
  // Trial status
  const { status: trialStatus, upgradeToPaid, MONTHLY_PRICE } = useAutopilotTrial();
  const isExpired = trialStatus.isExpired;
  const canUseAutopilot = trialStatus.canUseAutopilot;

  // Generate demo autopilot leads from stored context
  const autopilotLeads = useMemo<AutopilotLead[]>(() => {
    const storedLeads = getStoredLeadContext();
    
    if (storedLeads.length === 0) {
      // Return demo data if no leads
      return [
        {
          id: '1',
          businessName: 'Acme Plumbing Co',
          email: 'john@acmeplumbing.com',
          priority: 'hot',
          sequenceId: 'a-hot-1',
          sequenceName: 'Cold Intro → Value Proof',
          currentStep: 2,
          totalSteps: 4,
          status: 'active',
          lastActivity: '2 hours ago',
          nextAction: 'Send follow-up email',
          nextActionTime: 'Tomorrow 9:00 AM',
          emailsSent: 2,
          opensCount: 2,
          clicksCount: 1,
          websiteStatus: 'Needs Upgrade',
        },
        {
          id: '2',
          businessName: 'Best Auto Repair',
          email: 'mike@bestauto.com',
          priority: 'hot',
          sequenceId: 'a-hot-2',
          sequenceName: '"We Found This" Audit',
          currentStep: 3,
          totalSteps: 4,
          status: 'responded',
          lastActivity: '30 minutes ago',
          nextAction: 'Review response',
          nextActionTime: 'Now',
          responseDetected: true,
          responseType: 'positive',
          emailsSent: 3,
          opensCount: 3,
          clicksCount: 2,
          websiteStatus: 'No Website',
        },
        {
          id: '3',
          businessName: 'City Dental Clinic',
          email: 'info@citydental.com',
          priority: 'warm',
          sequenceId: 'a-warm-1',
          sequenceName: 'Social Proof & Authority',
          currentStep: 4,
          totalSteps: 4,
          status: 'proposal_ready',
          lastActivity: '1 hour ago',
          nextAction: 'Send proposal',
          nextActionTime: 'Ready now',
          responseDetected: true,
          responseType: 'positive',
          proposalReady: true,
          emailsSent: 4,
          opensCount: 4,
          clicksCount: 3,
          painPoints: ['Low online visibility', 'No booking system'],
        },
        {
          id: '4',
          businessName: 'Joe\'s Pizza',
          email: 'joe@joespizza.com',
          priority: 'cold',
          sequenceId: 'a-cold-1',
          sequenceName: 'Gentle Introduction',
          currentStep: 1,
          totalSteps: 4,
          status: 'active',
          lastActivity: '1 day ago',
          nextAction: 'Send intro email',
          nextActionTime: 'Today 2:00 PM',
          emailsSent: 1,
          opensCount: 0,
          clicksCount: 0,
        },
        {
          id: '5',
          businessName: 'Elite Fitness Gym',
          email: 'contact@elitefitness.com',
          priority: 'warm',
          sequenceId: 'a-warm-2',
          sequenceName: 'Re-Engagement',
          currentStep: 2,
          totalSteps: 4,
          status: 'paused',
          lastActivity: '3 days ago',
          nextAction: 'Paused - waiting for review',
          nextActionTime: 'Manual action needed',
          emailsSent: 2,
          opensCount: 1,
          clicksCount: 0,
        },
      ];
    }

    // Map stored leads to autopilot format
    return storedLeads.slice(0, 10).map((lead, idx) => {
      const statuses: AutopilotLead['status'][] = ['active', 'active', 'responded', 'proposal_ready', 'paused'];
      const status = statuses[idx % statuses.length];
      const currentStep = Math.min(idx % 4 + 1, 4);
      
      return {
        id: lead.id || `lead-${idx}`,
        businessName: lead.businessName,
        email: lead.email || `contact@${lead.businessName.toLowerCase().replace(/\s/g, '')}.com`,
        priority: lead.aiClassification || 'cold',
        sequenceId: `${searchType === 'platform' ? 'b' : 'a'}-${lead.aiClassification || 'cold'}-1`,
        sequenceName: lead.aiClassification === 'hot' ? 'Cold Intro → Value Proof' 
          : lead.aiClassification === 'warm' ? 'Social Proof & Authority'
          : 'Gentle Introduction',
        currentStep,
        totalSteps: 4,
        status,
        lastActivity: ['5 minutes ago', '1 hour ago', '3 hours ago', '1 day ago'][idx % 4],
        nextAction: status === 'proposal_ready' ? 'Send proposal' 
          : status === 'responded' ? 'Review response'
          : status === 'paused' ? 'Resume campaign'
          : 'Send follow-up email',
        nextActionTime: status === 'proposal_ready' || status === 'responded' ? 'Now' : 'Tomorrow 9:00 AM',
        responseDetected: status === 'responded' || status === 'proposal_ready',
        responseType: status === 'responded' ? 'positive' : undefined,
        proposalReady: status === 'proposal_ready',
        emailsSent: currentStep,
        opensCount: Math.max(0, currentStep - 1),
        clicksCount: Math.max(0, currentStep - 2),
        websiteStatus: lead.websiteAnalysis?.hasWebsite 
          ? (lead.websiteAnalysis.needsUpgrade ? 'Needs Upgrade' : 'Has Website')
          : 'No Website',
        painPoints: lead.painPoints,
      };
    });
  }, [searchType]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = autopilotLeads.length;
    const active = autopilotLeads.filter(l => l.status === 'active').length;
    const responded = autopilotLeads.filter(l => l.status === 'responded').length;
    const proposalReady = autopilotLeads.filter(l => l.status === 'proposal_ready').length;
    const paused = autopilotLeads.filter(l => l.status === 'paused').length;
    const completed = autopilotLeads.filter(l => l.status === 'completed').length;
    const totalEmailsSent = autopilotLeads.reduce((sum, l) => sum + l.emailsSent, 0);
    const totalOpens = autopilotLeads.reduce((sum, l) => sum + l.opensCount, 0);
    const avgProgress = autopilotLeads.reduce((sum, l) => sum + (l.currentStep / l.totalSteps) * 100, 0) / total;

    return { total, active, responded, proposalReady, paused, completed, totalEmailsSent, totalOpens, avgProgress };
  }, [autopilotLeads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    switch (activeFilter) {
      case 'active': return autopilotLeads.filter(l => l.status === 'active');
      case 'responded': return autopilotLeads.filter(l => l.status === 'responded');
      case 'proposal_ready': return autopilotLeads.filter(l => l.status === 'proposal_ready');
      default: return autopilotLeads;
    }
  }, [autopilotLeads, activeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'hot':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] gap-1"><Flame className="w-3 h-3" />Hot</Badge>;
      case 'warm':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] gap-1"><ThermometerSun className="w-3 h-3" />Warm</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] gap-1"><Snowflake className="w-3 h-3" />Cold</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: AutopilotLead['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] gap-1"><Play className="w-3 h-3" />AI Active</Badge>;
      case 'paused':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[9px] gap-1"><Pause className="w-3 h-3" />Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] gap-1"><CheckCircle2 className="w-3 h-3" />Completed</Badge>;
      case 'responded':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] gap-1 animate-pulse"><Reply className="w-3 h-3" />Responded</Badge>;
      case 'proposal_ready':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] gap-1 animate-pulse"><FileText className="w-3 h-3" />Proposal Ready</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Expired Overlay */}
      {isExpired && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Trial Expired</h3>
            <p className="text-muted-foreground mb-6">
              Your 14-day AI Autopilot trial has ended. Subscribe to continue using AI-powered automated outreach and nurturing.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={upgradeToPaid}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
              >
                <Crown className="w-5 h-5" />
                Upgrade for ${MONTHLY_PRICE}/month
              </Button>
              <p className="text-xs text-muted-foreground">Cancel anytime • Secure payment</p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Warning Banner (when active but not expired) */}
      {trialStatus.isTrialActive && !isExpired && (
        <AutopilotTrialWarning variant="compact" showUpgradeButton={true} />
      )}

      {/* Header - Yellow/Amber AI Autopilot Branding */}
      <div className={cn("flex items-center justify-between", isExpired && "opacity-30 pointer-events-none")}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              AI Autopilot
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 border-0">
                PRO
              </Badge>
              {!isExpired && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  {trialStatus.isPaid ? 'Active' : `${stats.active} Running`}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              AI handles everything: Drip → Follow-ups → Responses ($39/mo)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {trialStatus.isTrialActive && (
            <Badge className={cn(
              "text-xs",
              trialStatus.trialDaysRemaining <= 3 
                ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" 
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            )}>
              <Clock className="w-3 h-3 mr-1" />
              {trialStatus.trialDaysRemaining} days left
            </Badge>
          )}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-xs text-amber-400 font-medium">Autopilot</span>
            <Switch
              checked={autopilotEnabled && canUseAutopilot}
              onCheckedChange={setAutopilotEnabled}
              disabled={!canUseAutopilot}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !canUseAutopilot}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3", isExpired && "opacity-30 pointer-events-none")}>
        <Card className="bg-muted/20 border-border">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Total Leads
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.active}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Play className="w-3 h-3 text-amber-400" /> AI Active
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.responded}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Reply className="w-3 h-3 text-primary" /> Responded
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.proposalReady}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <FileText className="w-3 h-3 text-amber-400" /> Proposal Ready
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalEmailsSent}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Send className="w-3 h-3" /> Emails Sent
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.avgProgress.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Avg Progress
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className={cn("flex gap-2", isExpired && "opacity-30 pointer-events-none")}>
        {[
          { id: 'all', label: 'All Leads', count: stats.total },
          { id: 'active', label: 'Active', count: stats.active, color: 'text-emerald-400' },
          { id: 'responded', label: 'Responded', count: stats.responded, color: 'text-primary' },
          { id: 'proposal_ready', label: 'Proposal Ready', count: stats.proposalReady, color: 'text-amber-400' },
        ].map(filter => (
          <Button
            key={filter.id}
            size="sm"
            variant={activeFilter === filter.id ? "default" : "outline"}
            onClick={() => setActiveFilter(filter.id as any)}
            disabled={!canUseAutopilot}
            className={cn(
              "text-xs gap-1",
              activeFilter === filter.id && filter.color
            )}
          >
            {filter.label}
            <Badge variant="secondary" className="text-[9px] ml-1">{filter.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Lead Cards */}
      <ScrollArea className={cn("h-[500px]", isExpired && "opacity-30 pointer-events-none")}>
        <div className="space-y-3 pr-4">
          <AnimatePresence>
            {filteredLeads.map((lead, idx) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  "border-2 transition-all hover:shadow-lg",
                  lead.status === 'proposal_ready' && "border-amber-500/50 bg-amber-500/5",
                  lead.status === 'responded' && "border-primary/50 bg-primary/5",
                  lead.status === 'paused' && "opacity-70"
                )}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Lead Avatar */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                        lead.priority === 'hot' && "bg-red-500/20 text-red-400",
                        lead.priority === 'warm' && "bg-amber-500/20 text-amber-400",
                        lead.priority === 'cold' && "bg-blue-500/20 text-blue-400"
                      )}>
                        {lead.businessName.charAt(0).toUpperCase()}
                      </div>

                      {/* Lead Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">{lead.businessName}</h4>
                          {getPriorityBadge(lead.priority)}
                          {getStatusBadge(lead.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-2">{lead.email}</p>
                        
                        {/* Sequence Progress */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Zap className="w-3 h-3 text-primary" />
                              {lead.sequenceName}
                            </span>
                            <span className="text-foreground font-medium">
                              Step {lead.currentStep} of {lead.totalSteps}
                            </span>
                          </div>
                          <Progress 
                            value={(lead.currentStep / lead.totalSteps) * 100} 
                            className="h-2"
                          />
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3" /> {lead.emailsSent} sent
                          </span>
                          <span className="flex items-center gap-1">
                            <MailOpen className="w-3 h-3" /> {lead.opensCount} opens
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" /> {lead.clicksCount} clicks
                          </span>
                          {lead.websiteStatus && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {lead.websiteStatus}
                            </span>
                          )}
                        </div>

                        {/* Response Detection Alert */}
                        {lead.responseDetected && (
                          <div className={cn(
                            "p-2 rounded-lg text-xs flex items-center gap-2 mb-2",
                            lead.responseType === 'positive' && "bg-emerald-500/10 border border-emerald-500/30",
                            lead.responseType === 'negative' && "bg-red-500/10 border border-red-500/30",
                            lead.responseType === 'question' && "bg-blue-500/10 border border-blue-500/30"
                          )}>
                            <MessageSquare className={cn(
                              "w-4 h-4",
                              lead.responseType === 'positive' && "text-emerald-400",
                              lead.responseType === 'negative' && "text-red-400",
                              lead.responseType === 'question' && "text-blue-400"
                            )} />
                            <span className="text-foreground">
                              {lead.responseType === 'positive' && '🎉 Positive response detected!'}
                              {lead.responseType === 'negative' && '⚠️ Not interested - sequence paused'}
                              {lead.responseType === 'question' && '❓ Question received - needs review'}
                            </span>
                          </div>
                        )}

                        {/* Proposal Ready Banner */}
                        {lead.proposalReady && (
                          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Crown className="w-5 h-5 text-amber-400" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">Ready for Proposal!</p>
                                <p className="text-[10px] text-muted-foreground">Lead showed buying intent</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
                              onClick={() => onSendProposal?.(lead.id)}
                            >
                              <FileText className="w-3 h-3" />
                              Send Proposal
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="text-right text-[10px] text-muted-foreground mb-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {lead.lastActivity}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1"
                          onClick={() => onViewLead?.(lead)}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        {lead.status === 'paused' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1 text-emerald-400 border-emerald-500/30"
                            onClick={() => onResumeLead?.(lead.id)}
                          >
                            <Play className="w-3 h-3" />
                            Resume
                          </Button>
                        ) : lead.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1 text-amber-400 border-amber-500/30"
                            onClick={() => onPauseLead?.(lead.id)}
                          >
                            <Pause className="w-3 h-3" />
                            Pause
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {/* Next Action Footer */}
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Next:</span>
                        <span className="text-foreground font-medium">{lead.nextAction}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        <Calendar className="w-3 h-3 mr-1" />
                        {lead.nextActionTime}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No leads in this category</p>
              <p className="text-sm text-muted-foreground/70">Start an AI Autopilot campaign to see leads here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
