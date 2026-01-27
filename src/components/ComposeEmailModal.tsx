import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PenTool, Send, Calendar, Bot, Sparkles, ChevronDown, ChevronUp,
  Building2, Mail, Clock, Zap, Target, Play, Pause, RefreshCw,
  CheckCircle2, ArrowRight, Flame, ThermometerSun, Snowflake, FileText,
  Settings2, Users, TrendingUp, Rocket, Search, Globe, Store,
  CreditCard, Wand2, Layers, MailPlus, Briefcase, Crown,
  X, Maximize2, Minimize2
} from 'lucide-react';
import LeadQueueIndicator from './LeadQueueIndicator';
import AISubjectLineGenerator from './AISubjectLineGenerator';
import EmailScheduleCalendar from './EmailScheduleCalendar';
import PriorityTemplateSelector from './PriorityTemplateSelector';
import { isSMTPConfigured, sendSingleEmail } from '@/lib/emailService';
import { sendEmail as apiSendEmail } from '@/lib/api/email';

interface Lead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  contact_name?: string;
  first_name?: string;
  industry?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  priority?: string;
  leadScore?: number;
  hasWebsite?: boolean;
  websiteIssues?: string[];
}

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  currentLeadIndex: number;
  lastSentIndex: number;
  onLeadIndexChange: (index: number) => void;
  onEmailSent: (index: number) => void;
  initialEmail?: { to: string; subject: string; body: string };
  automationSettings: {
    doneForYouMode: boolean;
    autoFollowUps: boolean;
  };
  onAutomationChange: (settings: any) => void;
  searchType?: 'gmb' | 'platform' | null;
}

// Three compose modes
type ComposeMode = 'regular' | 'campaign' | 'autopilot';

// Sub-tabs within campaign mode
type CampaignTab = 'leads' | 'template' | 'sequence' | 'review';

export default function ComposeEmailModal({
  isOpen,
  onClose,
  leads,
  currentLeadIndex,
  lastSentIndex,
  onLeadIndexChange,
  onEmailSent,
  initialEmail,
  automationSettings,
  onAutomationChange,
  searchType,
}: ComposeEmailModalProps) {
  // Core state
  const [composeMode, setComposeMode] = useState<ComposeMode>('regular');
  const [campaignTab, setCampaignTab] = useState<CampaignTab>('leads');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [email, setEmail] = useState({ to: '', subject: '', body: '', scheduledFor: null as Date | null });
  const [isSending, setIsSending] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAISubjects, setShowAISubjects] = useState(true);

  // Drip settings
  const [dripMode, setDripMode] = useState(false);
  const [dripInterval, setDripInterval] = useState(60); // seconds
  const [dripRate, setDripRate] = useState(30); // emails per hour

  // Auto wizard subscription
  const [hasAutopilotSubscription, setHasAutopilotSubscription] = useState(() => {
    try {
      const stored = localStorage.getItem('bamlead_autopilot_trial');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.isPaid) return true;
        if (data.trialStartDate) {
          const startDate = new Date(data.trialStartDate);
          const now = new Date();
          const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 14;
        }
      }
      return false;
    } catch { return false; }
  });

  // Determine search context
  const detectedSearchType = useMemo(() => {
    if (searchType) return searchType;
    try {
      return sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' | null;
    } catch { return null; }
  }, [searchType]);

  const isSearchA = detectedSearchType === 'gmb';
  const isSearchB = detectedSearchType === 'platform';

  const currentLead = useMemo(() => leads[currentLeadIndex] || null, [leads, currentLeadIndex]);
  const safeLeads = useMemo(() => leads?.filter((l): l is Lead => l != null) ?? [], [leads]);

  // Check if user came through workflow (Step 1 → 2 → 3)
  const workflowContext = useMemo(() => {
    try {
      const currentStep = sessionStorage.getItem('bamlead_current_step') || '1';
      const hasCompletedStep1 = sessionStorage.getItem('bamlead_search_completed') === 'true';
      const hasCompletedStep2 = sessionStorage.getItem('bamlead_leads_reviewed') === 'true';
      const workflowLeadCount = parseInt(sessionStorage.getItem('bamlead_workflow_lead_count') || '0', 10);
      
      return {
        currentStep: parseInt(currentStep, 10),
        hasCompletedWorkflow: hasCompletedStep1 && hasCompletedStep2,
        isFromWorkflow: safeLeads.length > 0 && (hasCompletedStep1 || hasCompletedStep2),
        leadCount: workflowLeadCount || safeLeads.length,
      };
    } catch {
      return { currentStep: 1, hasCompletedWorkflow: false, isFromWorkflow: false, leadCount: 0 };
    }
  }, [safeLeads.length]);

  // Auto-switch to campaign mode when leads are available from workflow
  useEffect(() => {
    if (workflowContext.isFromWorkflow && safeLeads.length > 0 && composeMode === 'regular') {
      // Auto-suggest campaign mode when coming from workflow
      setComposeMode('campaign');
    }
  }, [workflowContext.isFromWorkflow, safeLeads.length, composeMode]);

  // Initialize email
  useEffect(() => {
    if (initialEmail) {
      setEmail({ ...initialEmail, scheduledFor: null });
    } else if (currentLead?.email) {
      setEmail(prev => ({ ...prev, to: currentLead.email || '' }));
    }
  }, [currentLead, initialEmail]);

  // Handlers
  const handleSend = async () => {
    if (!email.to || !email.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }

    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first');
      return;
    }

    setIsSending(true);
    try {
      await sendSingleEmail({
        to: email.to,
        subject: email.subject,
        bodyHtml: `<p>${email.body.replace(/\n/g, '<br/>')}</p>`,
        leadId: String(currentLead?.id || 'manual'),
      });
      toast.success('Email sent successfully!');
      onEmailSent(currentLeadIndex);

      // Auto-advance in campaign mode
      if (composeMode !== 'regular' && currentLeadIndex < leads.length - 1) {
        const nextLead = leads[currentLeadIndex + 1];
        onLeadIndexChange(currentLeadIndex + 1);
        setEmail({ to: nextLead?.email || '', subject: '', body: '', scheduledFor: null });
      } else {
        setEmail({ to: '', subject: '', body: '', scheduledFor: null });
        if (composeMode !== 'regular') {
          toast.info('All leads processed!');
        }
      }
    } catch {
      toast.error('Failed to send email');
    }
    setIsSending(false);
  };

  const handleSchedule = async (date: Date) => {
    if (!email.to || !email.subject) {
      toast.error('Please fill in recipient and subject before scheduling');
      return;
    }

    try {
      const key = 'bamlead_scheduled_manual_emails';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        id: crypto.randomUUID?.() || Date.now().toString(),
        type: composeMode === 'regular' ? 'manual' : 'campaign',
        to: email.to,
        subject: email.subject,
        body: email.body,
        scheduledFor: date.toISOString(),
        createdAt: new Date().toISOString(),
        leadPriority: currentLead?.aiClassification || 'cold',
        searchType: detectedSearchType,
      });
      localStorage.setItem(key, JSON.stringify(existing));

      toast.success(`Queued for ${date.toLocaleString()}`);
      setShowScheduler(false);
      setEmail({ to: '', subject: '', body: '', scheduledFor: null });
    } catch {
      toast.error('Failed to schedule email');
    }
  };

  const handleStartAutopilot = () => {
    if (!hasAutopilotSubscription) {
      toast.error('Please subscribe to Auto Campaign Wizard first ($39/mo or start 14-day trial)');
      return;
    }
    
    localStorage.setItem('bamlead_drip_active', JSON.stringify({
      active: true,
      leads: safeLeads.map(l => l?.id ?? ''),
      currentIndex: currentLeadIndex,
      interval: dripInterval,
      searchType: detectedSearchType,
      startedAt: new Date().toISOString(),
    }));
    
    onAutomationChange({ ...automationSettings, doneForYouMode: true });
    toast.success('🤖 AI Autopilot activated! AI will manage your outreach automatically.');
    onClose();
  };

  const startFreeTrial = () => {
    const trialData = {
      isTrialActive: true,
      trialDaysRemaining: 14,
      trialStartDate: new Date().toISOString(),
      isPaid: false,
      subscriptionId: null,
    };
    localStorage.setItem('bamlead_autopilot_trial', JSON.stringify(trialData));
    setHasAutopilotSubscription(true);
    toast.success('🎉 14-day free trial started! AI Autopilot is now available.');
  };

  const getPriorityIcon = (priority?: 'hot' | 'warm' | 'cold') => {
    switch (priority) {
      case 'hot': return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Snowflake className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getSearchBadge = () => {
    if (isSearchA) {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] gap-1">
          <Globe className="w-3 h-3" />
          Option A: Super AI
        </Badge>
      );
    }
    if (isSearchB) {
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] gap-1">
          <Store className="w-3 h-3" />
          Option B: Agency Finder
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        elevated 
        className={cn(
          "bg-card border-border overflow-hidden flex flex-col p-0",
          isFullscreen 
            ? "max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none" 
            : "max-w-3xl max-h-[90vh]"
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <MailPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                Compose Email
                {automationSettings.doneForYouMode && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                    <Bot className="w-3 h-3 mr-1" />
                    AI Active
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
                {getSearchBadge()}
                <span>Choose your sending mode below</span>
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Workflow Status Indicator */}
            {workflowContext.isFromWorkflow && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                {safeLeads.length} leads imported
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* MODE SELECTOR - 3 OPTIONS */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-3 gap-3">
            {/* Mode 1: Regular Email */}
            <button
              onClick={() => setComposeMode('regular')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                composeMode === 'regular'
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground text-sm">Regular Email</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Send a single email without campaigns. No leads required.
              </p>
            </button>

            {/* Mode 2: Campaign Send - Highlighted when leads available */}
            <button
              onClick={() => setComposeMode('campaign')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left relative",
                composeMode === 'campaign'
                  ? "border-orange-500 bg-orange-500/10"
                  : workflowContext.isFromWorkflow 
                    ? "border-orange-500/50 bg-orange-500/5 animate-pulse"
                    : "border-border hover:border-orange-500/50 bg-muted/30"
              )}
            >
              {workflowContext.isFromWorkflow && composeMode !== 'campaign' && (
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">!</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-orange-400" />
                <span className="font-semibold text-foreground text-sm">Campaign Send</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {workflowContext.isFromWorkflow 
                  ? `${safeLeads.length} leads ready from Step 1-3. Start campaign now!`
                  : 'Follow steps: Select leads → Template → Send (Manual control)'
                }
              </p>
              {safeLeads.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px]">
                  {safeLeads.length} leads
                </Badge>
              )}
            </button>

            {/* Mode 3: Auto Campaign Wizard */}
            <button
              onClick={() => setComposeMode('autopilot')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left relative",
                composeMode === 'autopilot'
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-500/50 bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-foreground text-sm">Auto Wizard</span>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] px-1.5">
                  PRO
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                AI handles everything: Drip → Follow-ups → Responses ($39/mo)
              </p>
              {hasAutopilotSubscription && (
                <Badge className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                  Active
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* ===================== REGULAR EMAIL MODE ===================== */}
            {composeMode === 'regular' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Compose a single email</span>
                </div>

                {/* To field */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">To</label>
                  <Input
                    value={email.to}
                    onChange={(e) => setEmail(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="recipient@email.com"
                    className="bg-muted/30 border-border"
                  />
                </div>

                {/* Subject with AI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Subject</label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAISubjects(!showAISubjects)}
                      className="h-6 text-[10px] gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-primary" />
                      {showAISubjects ? 'Hide AI' : 'AI Suggestions'}
                    </Button>
                  </div>
                  <Input
                    value={email.subject}
                    onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject..."
                    className="bg-muted/30 border-border"
                  />
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTemplateSelector(true)}
                      className="text-xs h-7 gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Templates
                    </Button>
                  </div>
                  <Textarea
                    value={email.body}
                    onChange={(e) => setEmail(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Write your message..."
                    rows={8}
                    className="bg-muted/30 border-border min-h-[200px]"
                  />
                </div>

                {/* Schedule Toggle */}
                <div className="pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowScheduler(!showScheduler)}
                    className="text-xs gap-2"
                  >
                    <Calendar className="w-4 h-4 text-primary" />
                    {showScheduler ? 'Hide Scheduler' : 'Schedule for Later'}
                    {showScheduler ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                  {showScheduler && (
                    <div className="mt-3">
                      <EmailScheduleCalendar onSchedule={handleSchedule} onSendNow={handleSend} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== CAMPAIGN MODE ===================== */}
            {composeMode === 'campaign' && (
              <div className="space-y-4">
                {/* Campaign sub-tabs */}
                <Tabs value={campaignTab} onValueChange={(v) => setCampaignTab(v as CampaignTab)}>
                  <TabsList className="bg-muted/50 border border-border p-1 w-full">
                    <TabsTrigger value="leads" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <Users className="w-3.5 h-3.5" />
                      1. Leads ({safeLeads.length})
                    </TabsTrigger>
                    <TabsTrigger value="template" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <FileText className="w-3.5 h-3.5" />
                      2. Template
                    </TabsTrigger>
                    <TabsTrigger value="sequence" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <Layers className="w-3.5 h-3.5" />
                      3. Sequence
                    </TabsTrigger>
                    <TabsTrigger value="review" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                      <Send className="w-3.5 h-3.5" />
                      4. Send
                    </TabsTrigger>
                  </TabsList>

                  {/* Step 1: Leads */}
                  <TabsContent value="leads" className="mt-4 space-y-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground text-sm">Lead Queue</h4>
                        {getSearchBadge()}
                      </div>
                      
                      {safeLeads.length === 0 ? (
                        <div className="text-center py-8">
                          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No leads loaded</p>
                          <p className="text-xs text-muted-foreground/70">Run a search in Step 1 to generate leads</p>
                        </div>
                      ) : (
                        <>
                          <LeadQueueIndicator
                            leads={safeLeads}
                            currentIndex={currentLeadIndex}
                            lastSentIndex={lastSentIndex}
                            variant="horizontal"
                          />
                          <ScrollArea className="h-[200px] mt-4">
                            <div className="space-y-2">
                              {safeLeads.map((lead, idx) => (
                                <button
                                  key={lead?.id ?? idx}
                                  onClick={() => {
                                    onLeadIndexChange(idx);
                                    setEmail(prev => ({ ...prev, to: lead.email || '' }));
                                  }}
                                  className={cn(
                                    "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                                    idx === currentLeadIndex
                                      ? "border-orange-500 bg-orange-500/10"
                                      : idx <= lastSentIndex
                                      ? "border-emerald-500/30 bg-emerald-500/5"
                                      : "border-border hover:border-orange-500/50"
                                  )}
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                    idx <= lastSentIndex
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : idx === currentLeadIndex
                                      ? "bg-orange-500/20 text-orange-400"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {idx <= lastSentIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {lead.business_name || lead.name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] gap-1">
                                    {getPriorityIcon(lead.aiClassification)}
                                    {lead.aiClassification || 'cold'}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </div>
                    <Button 
                      onClick={() => setCampaignTab('template')} 
                      disabled={safeLeads.length === 0}
                      className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                    >
                      Continue to Templates <ArrowRight className="w-4 h-4" />
                    </Button>
                  </TabsContent>

                  {/* Step 2: Template */}
                  <TabsContent value="template" className="mt-4 space-y-4">
                    {showAISubjects && currentLead && (
                      <AISubjectLineGenerator
                        currentLead={{
                          business_name: currentLead.business_name || currentLead.name,
                          first_name: currentLead.first_name || currentLead.contact_name,
                          industry: currentLead.industry,
                          aiClassification: currentLead.aiClassification,
                          hasWebsite: !!currentLead.website,
                          websiteIssues: currentLead.websiteIssues,
                        }}
                        onSelect={(subject) => setEmail(prev => ({ ...prev, subject }))}
                      />
                    )}

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">Subject Line</label>
                      <Input
                        value={email.subject}
                        onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Email subject..."
                        className="bg-muted/30 border-border"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Email Body</label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowTemplateSelector(true)}
                          className="text-xs h-7 gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {isSearchA ? 'Niche Templates' : isSearchB ? 'Agency Templates' : 'Priority Templates'}
                        </Button>
                      </div>
                      <Textarea
                        value={email.body}
                        onChange={(e) => setEmail(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Write your message..."
                        rows={10}
                        className="bg-muted/30 border-border min-h-[250px]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setCampaignTab('leads')} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCampaignTab('sequence')} 
                        className="flex-1 bg-orange-500 hover:bg-orange-600 gap-2"
                        disabled={!email.subject}
                      >
                        Configure Sequence <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Step 3: Sequence Settings */}
                  <TabsContent value="sequence" className="mt-4 space-y-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-400" />
                        Sending Options
                      </h4>

                      <div className="space-y-4">
                        {/* Drip Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">Drip Campaign</p>
                            <p className="text-xs text-muted-foreground">Send emails gradually over time</p>
                          </div>
                          <Switch
                            checked={dripMode}
                            onCheckedChange={setDripMode}
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </div>

                        {dripMode && (
                          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                            <label className="text-sm font-medium text-foreground block mb-3">
                              Emails per hour: {dripRate}
                            </label>
                            <input
                              type="range"
                              min={10}
                              max={100}
                              value={dripRate}
                              onChange={(e) => setDripRate(parseInt(e.target.value))}
                              className="w-full accent-orange-500"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Estimated completion: <strong className="text-foreground">
                                {Math.ceil(safeLeads.length / dripRate)} hours
                              </strong>
                            </p>
                          </div>
                        )}

                        {/* AI Follow-ups */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">AI Follow-Ups</p>
                            <p className="text-xs text-muted-foreground">Auto-send follow-ups if no response</p>
                          </div>
                          <Switch
                            checked={automationSettings.autoFollowUps}
                            onCheckedChange={(v) => onAutomationChange({ ...automationSettings, autoFollowUps: v })}
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setCampaignTab('template')} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCampaignTab('review')} 
                        className="flex-1 bg-orange-500 hover:bg-orange-600 gap-2"
                      >
                        Review & Send <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Step 4: Review & Send */}
                  <TabsContent value="review" className="mt-4 space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Campaign Summary
                      </h4>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Leads:</span>
                          <span className="font-medium text-foreground">{safeLeads.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="font-medium text-foreground truncate max-w-[200px]">{email.subject || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Send Mode:</span>
                          <span className="font-medium text-foreground">{dripMode ? 'Drip Campaign' : 'Instant'}</span>
                        </div>
                        {dripMode && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Drip Rate:</span>
                            <span className="font-medium text-foreground">{dripRate} emails/hour</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Search Type:</span>
                          <span className="font-medium text-foreground">
                            {isSearchA ? 'Option A (Super AI)' : isSearchB ? 'Option B (Agency)' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Current lead preview */}
                    {currentLead && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border">
                        <p className="text-xs text-muted-foreground mb-2">First email goes to:</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {currentLead.business_name || currentLead.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{currentLead.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setCampaignTab('sequence')} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={handleSend}
                        disabled={isSending || !email.subject}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2"
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Launch Campaign
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ===================== AUTOPILOT MODE ===================== */}
            {composeMode === 'autopilot' && (
              <div className="space-y-4">
                {/* Subscription Status */}
                {!hasAutopilotSubscription ? (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-center">
                    <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Auto Campaign Wizard</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Let AI handle everything: Drip sequences, follow-ups, lead responses, and smart nurturing based on 
                      {isSearchA ? ' your niche selling strategy (Option A)' : isSearchB ? ' your agency services (Option B)' : ' your lead data'}.
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        14-day free trial
                      </Badge>
                      <span className="text-muted-foreground">then</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        $39/month
                      </Badge>
                    </div>
                    <Button 
                      onClick={startFreeTrial}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Start Free Trial
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active subscription banner */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Auto Campaign Wizard Active</h4>
                        <p className="text-xs text-muted-foreground">
                          AI will manage drip sequences and responses for {isSearchA ? 'Option A' : 'Option B'} leads
                        </p>
                      </div>
                    </div>

                    {/* AI Controls */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        AI Configuration
                      </h4>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Done-For-You Mode</p>
                          <p className="text-xs text-muted-foreground">AI handles entire outreach automatically</p>
                        </div>
                        <Switch
                          checked={automationSettings.doneForYouMode}
                          onCheckedChange={(v) => onAutomationChange({ ...automationSettings, doneForYouMode: v })}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Smart Follow-Ups</p>
                          <p className="text-xs text-muted-foreground">AI sends follow-ups based on engagement</p>
                        </div>
                        <Switch
                          checked={automationSettings.autoFollowUps}
                          onCheckedChange={(v) => onAutomationChange({ ...automationSettings, autoFollowUps: v })}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </div>
                    </div>

                    {/* Sequence Preview */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-400" />
                        AI Recommended Sequence
                        {getSearchBadge()}
                      </h4>

                      <div className="space-y-2">
                        {(isSearchB ? [
                          { day: 1, action: 'Initial outreach: Website/SEO audit offer' },
                          { day: 3, action: 'Follow-up: Social proof + case study' },
                          { day: 5, action: 'Value-add: Free mini audit report' },
                          { day: 7, action: 'Final: Limited time offer' },
                        ] : [
                          { day: 1, action: 'Initial outreach: Industry insights' },
                          { day: 3, action: 'Follow-up: Product/service introduction' },
                          { day: 5, action: 'Value-add: Competitor analysis' },
                          { day: 7, action: 'Final: Call-to-action' },
                        ]).map((step, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-background">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              D{step.day}
                            </div>
                            <span className="text-sm text-muted-foreground">{step.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lead count & launch */}
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-foreground">{safeLeads.length} leads ready</p>
                          <p className="text-xs text-muted-foreground">AI will nurture until response or contract</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {isSearchA ? 'Niche Selling' : isSearchB ? 'Service Selling' : 'Custom'}
                        </Badge>
                      </div>

                      <Button 
                        onClick={handleStartAutopilot}
                        disabled={safeLeads.length === 0}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
                      >
                        <Wand2 className="w-4 h-4" />
                        Activate AI Autopilot
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER for Regular Mode */}
        {composeMode === 'regular' && !showScheduler && (
          <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !email.to || !email.subject}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Priority Template Selector Modal */}
      <PriorityTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={(template) => {
          setEmail(prev => ({
            ...prev,
            subject: template.subject,
            body: template.body,
          }));
        }}
        currentLead={currentLead ? {
          business_name: currentLead.business_name || currentLead.name,
          first_name: currentLead.first_name,
          email: currentLead.email,
          website: currentLead.website,
          industry: currentLead.industry,
          aiClassification: currentLead.aiClassification,
          priority: (currentLead.priority as 'hot' | 'warm' | 'cold') || currentLead.aiClassification,
          leadScore: currentLead.leadScore,
          hasWebsite: !!currentLead.website,
          websiteIssues: currentLead.websiteIssues,
        } : undefined}
      />
    </Dialog>
  );
}
