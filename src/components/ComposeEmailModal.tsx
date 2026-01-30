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
import { loadDripSettings, saveDripSettings } from '@/lib/dripSettings';
import {
  PenTool, Send, Calendar, Bot, Sparkles, ChevronDown, ChevronUp,
  Building2, Mail, Clock, Zap, Target, Play, Pause, RefreshCw,
  CheckCircle2, ArrowRight, Flame, ThermometerSun, Snowflake, FileText,
  Settings2, Users, TrendingUp, Rocket, Search, Globe, Store,
  CreditCard, Wand2, Layers, MailPlus, Briefcase, Crown,
  X, Maximize2, Minimize2, Eye, AlertCircle, Lightbulb, Brain,
  CheckSquare, Square, Edit3, ExternalLink
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AutopilotTrialWarning from './AutopilotTrialWarning';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';
import LeadQueueIndicator from './LeadQueueIndicator';
import AISubjectLineGenerator from './AISubjectLineGenerator';
import EmailScheduleCalendar from './EmailScheduleCalendar';
import PriorityTemplateSelector from './PriorityTemplateSelector';
import EmailSequenceSelector from './EmailSequenceSelector';
import AISequenceRecommendationEngine from './AISequenceRecommendationEngine';
import AIIntelligenceDecisionPanel from './AIIntelligenceDecisionPanel';
import { isSMTPConfigured, sendSingleEmail, personalizeContent, getSMTPConfig } from '@/lib/emailService';
import SMTPStatusIndicator from './SMTPStatusIndicator';
import { sendEmail as apiSendEmail } from '@/lib/api/email';
import { EmailSequence, EmailStep } from '@/lib/emailSequences';
import { 
  getLeadContextByEmail, 
  generatePersonalizationFromContext,
  generateEmailSuggestionsFromContext,
  LeadAnalysisContext,
  saveCampaignLeadsWithContext,
  getStoredLeadContext
} from '@/lib/leadContext';

// Enhanced Lead interface with Step 2 analysis data
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
  // Step 2 Analysis fields
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform?: string;
    needsUpgrade: boolean;
    mobileScore?: number;
    loadTime?: number;
    issues: string[];
    opportunities: string[];
  };
  painPoints?: string[];
  talkingPoints?: string[];
  aiInsights?: string[];
  recommendedApproach?: string;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  successProbability?: number;
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

// Sub-tabs within autopilot mode
type AutopilotTab = 'leads' | 'template' | 'sequence' | 'launch';

// Campaign target type
type CampaignTarget = 'all' | 'hot' | 'warm' | 'cold';

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
  const [campaignTarget, setCampaignTarget] = useState<CampaignTarget>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [email, setEmail] = useState({ to: '', subject: '', body: '', scheduledFor: null as Date | null });
  const [isSending, setIsSending] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAISubjects, setShowAISubjects] = useState(true);
  const [showSequenceSelector, setShowSequenceSelector] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState<{
    name: string;
    subject?: string;
    body?: string;
  } | null>(null);
  
  // Select All leads state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string | number>>(new Set());
  const [selectAllLeads, setSelectAllLeads] = useState(false);
  const [showTemplateRequiredModal, setShowTemplateRequiredModal] = useState(false);

  // Autopilot launch state
  const [isLaunchingAutopilot, setIsLaunchingAutopilot] = useState(false);
  const [autopilotLaunchProgress, setAutopilotLaunchProgress] = useState(0);
  const [showLeadsPreview, setShowLeadsPreview] = useState(false);
  const [autopilotTab, setAutopilotTab] = useState<AutopilotTab>('leads');
  
  // Campaign selection state
  const [showCampaignSelection, setShowCampaignSelection] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState<'manual' | 'autopilot' | null>(null);
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);

  // Drip settings
  const [dripMode, setDripMode] = useState(false);
  const [dripInterval, setDripInterval] = useState(60); // seconds
  const [dripRate, setDripRate] = useState(30); // emails per hour
  const [workflowEmailLeadCount, setWorkflowEmailLeadCount] = useState(0);
  const [dripSettingsReady, setDripSettingsReady] = useState(false);

  // Use the trial hook for autopilot subscription status
  const { status: trialStatus, startTrial, upgradeToPaid, MONTHLY_PRICE } = useAutopilotTrial();
  const hasAutopilotSubscription = trialStatus.canUseAutopilot;

  useEffect(() => {
    if (!isOpen) {
      setDripSettingsReady(false);
      return;
    }
    const settings = loadDripSettings();
    setDripMode(settings.enabled);
    setDripRate(settings.emailsPerHour);
    setDripInterval(settings.intervalSeconds);
    setDripSettingsReady(true);
    try {
      const storedTemplate = localStorage.getItem('bamlead_selected_template');
      if (!storedTemplate) return;
      const template = JSON.parse(storedTemplate);
      const customized = JSON.parse(localStorage.getItem('bamlead_template_customizations') || 'null');
      const subject = customized?.subject || template.subject || '';
      const rawBody = customized?.body || template.body || template.body_html || '';
      const body = typeof rawBody === 'string' ? rawBody.replace(/<[^>]*>/g, '') : '';

      setSelectedCampaignTemplate({
        name: template.name || 'Selected Template',
        subject,
        body,
      });

      setEmail(prev => ({
        ...prev,
        subject: prev.subject || subject,
        body: prev.body || body,
      }));
    } catch {
      // ignore malformed template cache
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = sessionStorage.getItem('bamlead_email_leads');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWorkflowEmailLeadCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setWorkflowEmailLeadCount(0);
      }
    } catch {
      setWorkflowEmailLeadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dripSettingsReady) return;
    saveDripSettings({
      enabled: dripMode,
      emailsPerHour: dripRate,
      intervalSeconds: dripInterval,
      source: 'compose',
    });
  }, [dripMode, dripRate, dripInterval, isOpen, dripSettingsReady]);

  useEffect(() => {
    setDripInterval(Math.round(3600 / Math.max(1, dripRate)));
  }, [dripRate]);

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
  
  // Filtered leads based on campaign target
  const filteredLeads = useMemo(() => {
    if (campaignTarget === 'all') return safeLeads;
    return safeLeads.filter(l => 
      campaignTarget === 'cold' 
        ? (l.aiClassification === 'cold' || !l.aiClassification)
        : l.aiClassification === campaignTarget
    );
  }, [safeLeads, campaignTarget]);
  
  // Handle select all toggle
  const handleSelectAllToggle = (checked: boolean) => {
    setSelectAllLeads(checked);
    if (checked) {
      const allIds = new Set(filteredLeads.map(l => l.id ?? '').filter(Boolean));
      setSelectedLeadIds(allIds);
    } else {
      setSelectedLeadIds(new Set());
    }
  };
  
  // Handle individual lead selection
  const handleLeadSelection = (leadId: string | number, checked: boolean) => {
    const newSelected = new Set(selectedLeadIds);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeadIds(newSelected);
    setSelectAllLeads(newSelected.size === filteredLeads.length);
  };
  
  // Get selected lead count for campaign
  const selectedLeadCount = useMemo(() => {
    if (selectAllLeads) return filteredLeads.length;
    return selectedLeadIds.size > 0 ? selectedLeadIds.size : filteredLeads.length;
  }, [selectAllLeads, selectedLeadIds.size, filteredLeads.length]);
  
  const dripLeadCount = useMemo(() => {
    if (workflowEmailLeadCount > 0) return workflowEmailLeadCount;
    const emailCount = safeLeads.filter(l => l.email).length;
    return emailCount > 0 ? emailCount : safeLeads.length;
  }, [workflowEmailLeadCount, safeLeads]);

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
      toast.error('Please configure SMTP settings first. Go to Settings > SMTP Configuration.');
      return;
    }

    setIsSending(true);
    try {
      // Get lead analysis context for personalization
      const leadContext = currentLead?.email ? getLeadContextByEmail(currentLead.email) : null;
      const personalization = leadContext ? generatePersonalizationFromContext(leadContext) : {};
      
      // Personalize the email body with Step 2 analysis data
      const personalizedBody = personalizeContent(email.body, {
        ...personalization,
        business_name: currentLead?.business_name || currentLead?.name || '',
        website: currentLead?.website || '',
      });
      
      const result = await sendSingleEmail({
        to: email.to,
        subject: personalizeContent(email.subject, personalization),
        bodyHtml: `<p>${personalizedBody.replace(/\n/g, '<br/>')}</p>`,
        leadId: String(currentLead?.id || 'manual'),
        personalization,
      });
      
      if (!result.success) {
        // Show specific error from the email service
        toast.error(result.error || 'Failed to send email. Please check your SMTP settings.');
        setIsSending(false);
        return;
      }
      
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
    } catch (error) {
      console.error('Email send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to send: ${errorMessage}`);
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

  const handleStartAutopilot = async () => {
    if (!hasAutopilotSubscription) {
      toast.error('Please subscribe to AI Autopilot Campaign first ($19.99/mo or start 14-day trial)');
      return;
    }

    // Start launch animation
    setIsLaunchingAutopilot(true);
    setAutopilotLaunchProgress(0);

    // Simulate progressive loading for visual feedback
    const progressSteps = [
      { progress: 15, delay: 200, message: 'Analyzing lead profiles...' },
      { progress: 35, delay: 400, message: 'Preparing personalized sequences...' },
      { progress: 55, delay: 300, message: 'Configuring AI decision engine...' },
      { progress: 75, delay: 350, message: 'Setting up response detection...' },
      { progress: 90, delay: 250, message: 'Activating autopilot...' },
      { progress: 100, delay: 200, message: 'Launch complete!' },
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setAutopilotLaunchProgress(step.progress);
    }
    
    // Get full lead context from Step 2 analysis for AI Autopilot
    const leadsWithContext = getStoredLeadContext();
    
    // Save leads with their full analysis context for AI to use
    saveCampaignLeadsWithContext(leadsWithContext);
    
    // Store campaign configuration with analysis data
    localStorage.setItem('bamlead_drip_active', JSON.stringify({
      active: true,
      leads: safeLeads.map(l => l?.id ?? ''),
      leadsWithAnalysis: leadsWithContext.length,
      currentIndex: currentLeadIndex,
      interval: dripInterval,
      searchType: detectedSearchType,
      startedAt: new Date().toISOString(),
      // Include summary of lead analysis for AI reference
      analysisContext: {
        totalLeads: leadsWithContext.length,
        noWebsiteCount: leadsWithContext.filter(l => !l.websiteAnalysis?.hasWebsite).length,
        needsUpgradeCount: leadsWithContext.filter(l => l.websiteAnalysis?.needsUpgrade).length,
        hotLeadsCount: leadsWithContext.filter(l => l.aiClassification === 'hot').length,
        warmLeadsCount: leadsWithContext.filter(l => l.aiClassification === 'warm').length,
        coldLeadsCount: leadsWithContext.filter(l => l.aiClassification === 'cold').length,
      },
    }));
    
    onAutomationChange({ ...automationSettings, doneForYouMode: true });
    
    // Small delay to show 100% completion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLaunchingAutopilot(false);
    setAutopilotLaunchProgress(0);
    toast.success('🤖 AI Autopilot activated! AI will use Step 2 analysis to personalize your outreach.');
    onClose();
  };

  const handleStartFreeTrial = () => {
    const success = startTrial();
    if (success) {
      toast.success('🎉 14-day free trial started! AI Autopilot is now available.');
    }
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
          "bg-card border-border overflow-hidden flex flex-col p-0 min-h-0",
          isFullscreen 
            ? "max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none" 
            : "max-w-3xl max-h-[90vh] h-[90vh]"
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
        <div className="p-4 border-b border-border space-y-4">
          {/* SMTP Status Indicator - Shows which email account will be used */}
          <SMTPStatusIndicator 
            showConfigureButton={true}
            onConfigure={() => {
              // Navigate to SMTP setup
              onClose();
              sessionStorage.setItem('bamlead_navigate_to', 'smtp-setup');
              window.dispatchEvent(new CustomEvent('bamlead-navigate', { detail: { target: 'smtp-setup' } }));
            }}
          />
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
                <Badge className="text-[8px] px-1.5 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  FREE
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Send emails to any recipient. No leads required.
              </p>
            </button>

            {/* Mode 2: Manual Campaign Send */}
            <button
              onClick={() => {
                setSelectedCampaignType('manual');
                setComposeMode('campaign');
                // Log for accountability
                try {
                  const auditLog = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                  auditLog.push({
                    type: 'manual',
                    timestamp: new Date().toISOString(),
                    leadCount: safeLeads.length,
                  });
                  localStorage.setItem('bamlead_campaign_audit', JSON.stringify(auditLog));
                } catch {}
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left relative",
                composeMode === 'campaign' && selectedCampaignType === 'manual'
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-border hover:border-orange-500/50 bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-orange-400" />
                <span className="font-semibold text-foreground text-sm">Manual Campaign</span>
                <Badge className="text-[8px] px-1.5 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  FREE
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Send emails to multiple leads. You control follow-ups.
              </p>
              {safeLeads.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px]">
                  {safeLeads.length} leads
                </Badge>
              )}
            </button>

            {/* Mode 3: AI Autopilot Campaign */}
            <button
              onClick={() => {
                // Check payment/trial first
                if (!hasAutopilotSubscription) {
                  setShowPaymentRequired(true);
                  return;
                }
                setSelectedCampaignType('autopilot');
                setComposeMode('autopilot');
                // Log for accountability
                try {
                  const auditLog = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                  auditLog.push({
                    type: 'autopilot',
                    timestamp: new Date().toISOString(),
                    leadCount: safeLeads.length,
                    subscriptionStatus: hasAutopilotSubscription ? 'active' : 'none',
                  });
                  localStorage.setItem('bamlead_campaign_audit', JSON.stringify(auditLog));
                } catch {}
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left relative",
                composeMode === 'autopilot'
                  ? "border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
                  : workflowContext.isFromWorkflow 
                    ? "border-amber-500/50 bg-amber-500/5 animate-pulse"
                    : "border-border hover:border-amber-500/50 bg-muted/30"
              )}
            >
              {workflowContext.isFromWorkflow && composeMode !== 'autopilot' && (
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-foreground text-sm">AI Autopilot</span>
                <Badge className="text-[8px] px-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  PREMIUM
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                AI sends emails, manages follow-ups, responds to customers on your behalf. Full automation.
              </p>
              {safeLeads.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                  {safeLeads.length} leads
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <ScrollArea className="flex-1 min-h-0 h-full">
          <div className="p-4 pb-10">
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
                    {/* Campaign Target Selection */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Campaign Type
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => setCampaignTarget('all')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-center",
                            campaignTarget === 'all'
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <span className="text-xs font-medium">All Leads</span>
                          <p className="text-[10px] text-muted-foreground">{safeLeads.length}</p>
                        </button>
                        <button
                          onClick={() => setCampaignTarget('hot')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-center",
                            campaignTarget === 'hot'
                              ? "border-red-500 bg-red-500/10"
                              : "border-border hover:border-red-500/50"
                          )}
                        >
                          <Flame className="w-5 h-5 mx-auto mb-1 text-red-400" />
                          <span className="text-xs font-medium">Hot</span>
                          <p className="text-[10px] text-muted-foreground">
                            {safeLeads.filter(l => l.aiClassification === 'hot').length}
                          </p>
                        </button>
                        <button
                          onClick={() => setCampaignTarget('warm')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-center",
                            campaignTarget === 'warm'
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-border hover:border-amber-500/50"
                          )}
                        >
                          <ThermometerSun className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                          <span className="text-xs font-medium">Warm</span>
                          <p className="text-[10px] text-muted-foreground">
                            {safeLeads.filter(l => l.aiClassification === 'warm').length}
                          </p>
                        </button>
                        <button
                          onClick={() => setCampaignTarget('cold')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-center",
                            campaignTarget === 'cold'
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-border hover:border-blue-500/50"
                          )}
                        >
                          <Snowflake className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                          <span className="text-xs font-medium">Cold</span>
                          <p className="text-[10px] text-muted-foreground">
                            {safeLeads.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Step 2 Analysis Context Indicator */}
                    {(() => {
                      const analysisContext = getStoredLeadContext();
                      const noWebsiteCount = analysisContext.filter(l => !l.websiteAnalysis?.hasWebsite).length;
                      const needsUpgradeCount = analysisContext.filter(l => l.websiteAnalysis?.needsUpgrade).length;
                      const hasPainPoints = analysisContext.filter(l => l.painPoints && l.painPoints.length > 0).length;
                      
                      if (analysisContext.length === 0) return null;
                      
                      return (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Lightbulb className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground text-sm">Step 2 Analysis Active</h4>
                              <p className="text-[10px] text-muted-foreground">
                                AI will use this data to personalize your emails
                              </p>
                            </div>
                            <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-[10px]">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Smart Context
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-background/50">
                              <div className="text-lg font-bold text-foreground">{noWebsiteCount}</div>
                              <div className="text-[10px] text-muted-foreground">No Website</div>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50">
                              <div className="text-lg font-bold text-foreground">{needsUpgradeCount}</div>
                              <div className="text-[10px] text-muted-foreground">Needs Upgrade</div>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50">
                              <div className="text-lg font-bold text-foreground">{hasPainPoints}</div>
                              <div className="text-[10px] text-muted-foreground">Pain Points</div>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            📧 Emails will include personalized openers based on website status & AI insights
                          </p>
                        </div>
                      );
                    })()}

                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground text-sm">
                          Lead Queue {campaignTarget !== 'all' && `(${campaignTarget.toUpperCase()})`}
                        </h4>
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
                            leads={filteredLeads}
                            currentIndex={currentLeadIndex}
                            lastSentIndex={lastSentIndex}
                            variant="horizontal"
                          />
                          
                          {/* Select All Toggle */}
                          <div className="flex items-center justify-between p-3 mt-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id="select-all"
                                checked={selectAllLeads}
                                onCheckedChange={(checked) => handleSelectAllToggle(checked === true)}
                                className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                              />
                              <label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
                                Select All Leads
                              </label>
                            </div>
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                              {selectedLeadCount} / {filteredLeads.length} selected
                            </Badge>
                          </div>
                          
                          <ScrollArea className="h-[200px] mt-4">
                            <div className="space-y-2">
                              {filteredLeads.map((lead, idx) => (
                                <div
                                  key={lead?.id ?? idx}
                                  className={cn(
                                    "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                                    selectedLeadIds.has(lead.id ?? '') || selectAllLeads
                                      ? "border-orange-500 bg-orange-500/10"
                                      : idx <= lastSentIndex
                                      ? "border-emerald-500/30 bg-emerald-500/5"
                                      : "border-border hover:border-orange-500/50"
                                  )}
                                >
                                  <Checkbox
                                    checked={selectAllLeads || selectedLeadIds.has(lead.id ?? '')}
                                    onCheckedChange={(checked) => handleLeadSelection(lead.id ?? idx, checked === true)}
                                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                  />
                                  <button
                                    onClick={() => {
                                      onLeadIndexChange(idx);
                                      setEmail(prev => ({ ...prev, to: lead.email || '' }));
                                    }}
                                    className="flex-1 flex items-center gap-3 min-w-0"
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
                                      <p className="text-sm font-medium text-foreground truncate text-left">
                                        {lead.business_name || lead.name || 'Unknown'}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate text-left">{lead.email}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] gap-1">
                                      {getPriorityIcon(lead.aiClassification)}
                                      {lead.aiClassification || 'cold'}
                                    </Badge>
                                  </button>
                                </div>
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
                  <TabsContent value="template" className="mt-4 space-y-4 pb-6">
                    {/* No Template Warning */}
                    {!selectedCampaignTemplate && !email.subject && !email.body && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">No Template Selected</p>
                            <p className="text-xs text-muted-foreground">
                              Choose an AI template below or go to Step 3 Email Outreach to configure your template.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onClose();
                              sessionStorage.setItem('bamlead_current_step', '3');
                              toast.info('Navigate to Step 3: Email Outreach in the dashboard to configure your template.');
                            }}
                            className="gap-1 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Go to Step 3
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {selectedCampaignTemplate && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Selected template from Step 3</p>
                            <p className="text-sm font-medium text-foreground">{selectedCampaignTemplate.name}</p>
                            {selectedCampaignTemplate.subject && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                Subject: {selectedCampaignTemplate.subject}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Apply template to editor for viewing/editing
                                if (selectedCampaignTemplate.subject) {
                                  setEmail(prev => ({
                                    ...prev,
                                    subject: selectedCampaignTemplate.subject || '',
                                    body: selectedCampaignTemplate.body || '',
                                  }));
                                }
                                toast.info('Template loaded into editor. You can now view and edit it.');
                              }}
                              className="text-xs gap-1 h-7"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowTemplateSelector(true)}
                              className="text-xs gap-1 h-7"
                            >
                              <Edit3 className="w-3 h-3" />
                              Change
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {showAISubjects && (
                      <AISubjectLineGenerator
                        currentLead={currentLead ? {
                          business_name: currentLead.business_name || currentLead.name,
                          first_name: currentLead.first_name || currentLead.contact_name,
                          industry: currentLead.industry,
                          aiClassification: currentLead.aiClassification,
                          hasWebsite: !!currentLead.website,
                          websiteIssues: currentLead.websiteIssues,
                        } : undefined}
                        onSelect={(subject) => setEmail(prev => ({ ...prev, subject }))}
                        campaignType={campaignTarget === 'all' ? undefined : campaignTarget}
                        searchType={detectedSearchType}
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
                        onClick={() => {
                          if (!email.subject && !email.body) {
                            setShowTemplateRequiredModal(true);
                          } else {
                            setCampaignTab('sequence');
                          }
                        }} 
                        className="flex-1 bg-orange-500 hover:bg-orange-600 gap-2"
                        disabled={!email.subject && !email.body}
                      >
                        Configure Sequence <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Step 3: Sequence Settings */}
                  <TabsContent value="sequence" className="mt-4 space-y-4">
                    {/* Sequence Selector Toggle */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-semibold text-foreground">Email Sequences</h4>
                            <p className="text-xs text-muted-foreground">
                              {isSearchA ? 'Option A sequences for B2B & local businesses' : 'Option B sequences for agency client acquisition'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={showSequenceSelector ? "default" : "outline"}
                          onClick={() => setShowSequenceSelector(!showSequenceSelector)}
                          className="gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {showSequenceSelector ? 'Hide' : 'Browse'} Sequences
                        </Button>
                      </div>

                      {selectedSequence && (
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                <span>{selectedSequence.emoji}</span>
                                {selectedSequence.name}
                              </span>
                              <p className="text-xs text-muted-foreground">{selectedSequence.steps.length} emails in sequence</p>
                            </div>
                            <Badge className={cn(
                              "text-[10px]",
                              selectedSequence.priority === 'hot' && "bg-red-500/20 text-red-400 border-red-500/30",
                              selectedSequence.priority === 'warm' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                              selectedSequence.priority === 'cold' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            )}>
                              {selectedSequence.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Sequence Recommendation Engine */}
                    {showSequenceSelector && (
                      <div className="border border-border rounded-xl p-4 bg-muted/20">
                        <AISequenceRecommendationEngine
                          searchType={detectedSearchType}
                          mode="campaign"
                          onSelectSequence={(sequence) => {
                            setSelectedSequence(sequence);
                            // Auto-apply first step to email
                            if (sequence.steps.length > 0) {
                              const firstStep = sequence.steps[0];
                              setEmail(prev => ({
                                ...prev,
                                subject: firstStep.subject,
                                body: firstStep.body,
                              }));
                            }
                            toast.success(`Selected: ${sequence.name} - First email applied`);
                          }}
                          compact
                        />
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-orange-400" />
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
                                {Math.ceil(dripLeadCount / dripRate)} hours
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
                    {/* Campaign Summary Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Campaign Summary
                      </h4>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Leads:</span>
                          <span className="font-medium text-foreground">{selectedLeadCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-medium text-foreground truncate max-w-[200px]">{selectedCampaignTemplate?.name || 'Custom Email'}</span>
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
                        {selectedSequence && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sequence:</span>
                            <span className="font-medium text-foreground">{selectedSequence.name} ({selectedSequence.steps.length} emails)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Preview Card */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          Email Preview
                        </h4>
                        <Badge variant="outline" className="text-[10px]">
                          {selectedCampaignTemplate?.name || 'Custom'}
                        </Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-border space-y-2">
                        <p className="text-xs text-muted-foreground">Subject:</p>
                        <p className="text-sm font-medium text-foreground">{email.subject || 'No subject set'}</p>
                        <Separator className="my-2" />
                        <p className="text-xs text-muted-foreground">Preview:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{email.body?.substring(0, 200) || 'No body content'}...</p>
                      </div>
                    </div>

                    {/* Recipients List */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Recipients ({selectedLeadCount})
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowLeadsPreview(!showLeadsPreview)}
                          className="text-xs h-7 gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {showLeadsPreview ? 'Hide' : 'View All'}
                        </Button>
                      </div>
                      
                      {/* First 3 recipients preview */}
                      <div className="space-y-2">
                        {filteredLeads.slice(0, showLeadsPreview ? filteredLeads.length : 3).map((lead, idx) => (
                          <div key={lead?.id ?? idx} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {lead.business_name || lead.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-[10px] gap-1",
                              lead.aiClassification === 'hot' && "border-red-500/30 text-red-400",
                              lead.aiClassification === 'warm' && "border-amber-500/30 text-amber-400",
                              (!lead.aiClassification || lead.aiClassification === 'cold') && "border-blue-500/30 text-blue-400"
                            )}>
                              {getPriorityIcon(lead.aiClassification)}
                              {lead.aiClassification || 'cold'}
                            </Badge>
                          </div>
                        ))}
                        {!showLeadsPreview && filteredLeads.length > 3 && (
                          <p className="text-xs text-center text-muted-foreground py-2">
                            + {filteredLeads.length - 3} more recipients
                          </p>
                        )}
                      </div>
                    </div>

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
                            Send Campaign ({selectedLeadCount} emails)
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
                {/* Autopilot Tabs - ALWAYS show at top for consistent positioning */}
                <Tabs value={autopilotTab} onValueChange={(v) => setAutopilotTab(v as AutopilotTab)}>
                  <TabsList className="bg-muted/50 border border-amber-500/30 p-1 w-full">
                    <TabsTrigger value="leads" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                      <Users className="w-3.5 h-3.5" />
                      1. Leads ({safeLeads.length})
                    </TabsTrigger>
                    <TabsTrigger value="template" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                      <FileText className="w-3.5 h-3.5" />
                      2. Template
                    </TabsTrigger>
                    <TabsTrigger value="sequence" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                      <Layers className="w-3.5 h-3.5" />
                      3. Sequence
                    </TabsTrigger>
                    <TabsTrigger value="launch" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                      <Rocket className="w-3.5 h-3.5" />
                      4. Launch
                    </TabsTrigger>
                  </TabsList>

                  {/* ONLY show trial expired promo AFTER 7-day trial ends */}
                  {trialStatus.isExpired && (
                    <div className="mt-4 p-6 rounded-xl text-center bg-muted/50 border-2 border-red-500/30">
                      <Crown className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        AI Autopilot Trial Expired
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Your 7-day free trial has ended. Subscribe to continue using AI-powered automated outreach.
                      </p>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          ${MONTHLY_PRICE}/month
                        </Badge>
                      </div>
                      <Button 
                        onClick={upgradeToPaid}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Subscribe Now - ${MONTHLY_PRICE}/month
                      </Button>
                    </div>
                  )}

                  {/* Trial/Expired Warning Banner - only show during active trial */}
                  {trialStatus.hasStartedTrial && !trialStatus.isPaid && !trialStatus.isExpired && (
                    <div className="mt-4">
                      <AutopilotTrialWarning 
                        variant="banner" 
                        showUpgradeButton={true}
                        onUpgrade={upgradeToPaid}
                      />
                    </div>
                  )}
                
                  {/* Active subscription/trial content - show when access granted */}
                  {hasAutopilotSubscription && !trialStatus.isExpired && (
                    <>
                      {/* Status banner */}
                      <div className={cn(
                        "mt-4 p-4 rounded-xl flex items-center gap-4",
                        trialStatus.isPaid 
                          ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                          : "bg-emerald-500/10 border border-emerald-500/30"
                      )}>
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          trialStatus.isPaid ? "bg-amber-500/20" : "bg-emerald-500/20"
                        )}>
                          {trialStatus.isPaid ? (
                            <Crown className="w-6 h-6 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">
                              {trialStatus.isPaid ? 'AI Autopilot Pro Active' : 'AI Autopilot Trial Active'}
                            </h4>
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                              ${MONTHLY_PRICE}/mo
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            AI manages entire outreach: sequences, follow-ups, and responses
                          </p>
                        </div>
                        {trialStatus.isTrialActive && (
                          <Badge className={cn(
                            "text-xs",
                            trialStatus.trialDaysRemaining <= 3 
                              ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" 
                              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          )}>
                            <Clock className="w-3 h-3 mr-1" />
                            {trialStatus.trialDaysRemaining} day{trialStatus.trialDaysRemaining !== 1 ? 's' : ''} left
                          </Badge>
                        )}
                      </div>
                    </>
                  )}

                  {/* Step 1: Leads - Show for active subscription/trial */}
                  {hasAutopilotSubscription && !trialStatus.isExpired && (
                    <>
                      <TabsContent value="leads" className="mt-4 space-y-4">
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Bot className="w-5 h-5 text-amber-400" />
                            <h4 className="font-semibold text-foreground">AI Autopilot Lead Queue</h4>
                            {getSearchBadge()}
                          </div>
                          <p className="text-xs text-muted-foreground mb-4">
                            AI will automatically email all leads below based on their classification and website analysis.
                          </p>
                          
                          {/* Lead Stats */}
                          <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="p-3 rounded-lg bg-background border border-border text-center">
                              <div className="text-lg font-bold text-foreground">{safeLeads.length}</div>
                              <div className="text-[10px] text-muted-foreground">Total</div>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                              <div className="text-lg font-bold text-red-400">{safeLeads.filter(l => l.aiClassification === 'hot').length}</div>
                              <div className="text-[10px] text-muted-foreground">Hot</div>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                              <div className="text-lg font-bold text-amber-400">{safeLeads.filter(l => l.aiClassification === 'warm').length}</div>
                              <div className="text-[10px] text-muted-foreground">Warm</div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                              <div className="text-lg font-bold text-blue-400">{safeLeads.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length}</div>
                              <div className="text-[10px] text-muted-foreground">Cold</div>
                            </div>
                          </div>
                          
                          {/* Lead List */}
                          <ScrollArea className="h-[250px]">
                            <div className="space-y-2">
                              {safeLeads.map((lead, idx) => (
                                <div 
                                  key={lead.id || idx}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                    lead.aiClassification === 'hot' ? "bg-red-500/20 text-red-400" :
                                    lead.aiClassification === 'warm' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-blue-500/20 text-blue-400"
                                  )}>
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {lead.business_name || lead.name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                                  </div>
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] gap-1",
                                    lead.aiClassification === 'hot' && "border-red-500/30 text-red-400",
                                    lead.aiClassification === 'warm' && "border-amber-500/30 text-amber-400",
                                    (!lead.aiClassification || lead.aiClassification === 'cold') && "border-blue-500/30 text-blue-400"
                                  )}>
                                    {getPriorityIcon(lead.aiClassification)}
                                    {lead.aiClassification || 'cold'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                        <Button 
                          onClick={() => setAutopilotTab('template')} 
                          disabled={safeLeads.length === 0}
                          className="w-full bg-amber-500 hover:bg-amber-600 gap-2"
                        >
                          Continue to Templates <ArrowRight className="w-4 h-4" />
                        </Button>
                      </TabsContent>

                      {/* Step 2: Template */}
                      <TabsContent value="template" className="mt-4 space-y-4">
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-amber-400" />
                              <h4 className="font-semibold text-foreground">AI Template Selection</h4>
                            </div>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Brain className="w-3 h-3" />
                              AI Auto-Personalizes
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-4">
                            AI will automatically personalize emails based on each lead's website status, pain points, and business type.
                          </p>
                          
                          {selectedCampaignTemplate ? (
                            <div className="p-4 rounded-lg bg-background border border-amber-500/30 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-foreground">{selectedCampaignTemplate.name}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowTemplateSelector(true)}
                                  className="text-xs h-7 gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Change
                                </Button>
                              </div>
                              {selectedCampaignTemplate.subject && (
                                <p className="text-xs text-muted-foreground">Subject: {selectedCampaignTemplate.subject}</p>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-background border-2 border-dashed border-amber-500/30 text-center mb-4">
                              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-foreground font-medium">No template selected</p>
                              <p className="text-xs text-muted-foreground mb-3">AI will use intelligent defaults based on lead type</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowTemplateSelector(true)}
                                className="text-xs gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Browse Templates
                              </Button>
                            </div>
                          )}
                          
                          {/* AI Personalization Preview */}
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span className="font-medium text-foreground">AI Personalization:</span>
                              Each email will include business name, website status, and tailored value propositions.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setAutopilotTab('leads')} className="flex-1">
                            Back
                          </Button>
                          <Button 
                            onClick={() => setAutopilotTab('sequence')} 
                            className="flex-1 bg-amber-500 hover:bg-amber-600 gap-2"
                          >
                            Configure Sequence <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Step 3: Sequence */}
                      <TabsContent value="sequence" className="mt-4 space-y-4">
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Layers className="w-5 h-5 text-amber-400" />
                              <h4 className="font-semibold text-foreground">AI Sequence Selection</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowSequenceSelector(!showSequenceSelector)}
                              className="text-xs gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Browse All
                            </Button>
                          </div>
                          
                          {showSequenceSelector && (
                            <div className="mb-4 border border-border rounded-lg p-3 bg-background">
                              <AISequenceRecommendationEngine
                                searchType={detectedSearchType}
                                mode="autopilot"
                                onSelectSequence={(seq) => {
                                  setSelectedSequence(seq);
                                  toast.success(`Selected: ${seq.name}`);
                                }}
                                compact
                              />
                            </div>
                          )}

                          {selectedSequence ? (
                            <div className="p-4 rounded-lg bg-background border border-amber-500/30 mb-3">
                              <div className="flex items-center gap-2 mb-3">
                                <span>{selectedSequence.emoji}</span>
                                <span className="font-medium text-foreground">{selectedSequence.name}</span>
                                <Badge className={cn(
                                  "text-[10px] ml-auto",
                                  selectedSequence.priority === 'hot' && "bg-red-500/20 text-red-400 border-red-500/30",
                                  selectedSequence.priority === 'warm' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                                  selectedSequence.priority === 'cold' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                )}>
                                  {selectedSequence.steps.length} emails
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {selectedSequence.steps.map((step, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                      D{step.day}
                                    </div>
                                    <span className="text-muted-foreground">{step.action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-background border-2 border-dashed border-amber-500/30 text-center mb-3">
                              <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-foreground font-medium">AI will select optimal sequence</p>
                              <p className="text-xs text-muted-foreground">Based on lead classification and search type</p>
                            </div>
                          )}
                          
                          {/* AI Controls */}
                          <div className="space-y-3">
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
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setAutopilotTab('template')} className="flex-1">
                            Back
                          </Button>
                          <Button 
                            onClick={() => setAutopilotTab('launch')} 
                            className="flex-1 bg-amber-500 hover:bg-amber-600 gap-2"
                          >
                            Review & Launch <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Step 4: Launch */}
                      <TabsContent value="launch" className="mt-4 space-y-4">
                        {/* Summary Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            AI Autopilot Summary
                          </h4>

                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Leads:</span>
                              <span className="font-medium text-foreground">{safeLeads.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Template:</span>
                              <span className="font-medium text-foreground">{selectedCampaignTemplate?.name || 'AI Smart Selection'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sequence:</span>
                              <span className="font-medium text-foreground">{selectedSequence?.name || 'AI Optimized'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mode:</span>
                              <span className="font-medium text-foreground">
                                {automationSettings.doneForYouMode ? 'Full Automation' : 'Semi-Automated'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Search Type:</span>
                              <span className="font-medium text-foreground">
                                {isSearchA ? 'Option A (Super AI)' : isSearchB ? 'Option B (Agency)' : 'Custom'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recipients Preview */}
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                              <Users className="w-4 h-4 text-amber-400" />
                              Recipients ({safeLeads.length})
                            </h4>
                          </div>
                          
                          <div className="space-y-2">
                            {safeLeads.slice(0, 5).map((lead, idx) => (
                              <div key={lead?.id ?? idx} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                  lead.aiClassification === 'hot' ? "bg-red-500/20 text-red-400" :
                                  lead.aiClassification === 'warm' ? "bg-amber-500/20 text-amber-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {lead.business_name || lead.name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                                </div>
                              </div>
                            ))}
                            {safeLeads.length > 5 && (
                              <p className="text-xs text-center text-muted-foreground py-2">
                                + {safeLeads.length - 5} more recipients
                              </p>
                            )}
                          </div>
                        </div>

                        {/* AI Info Banner */}
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">AI Takes Over After Launch</p>
                              <p className="text-xs text-muted-foreground">
                                No further action needed. AI will send sequences, detect responses, and pause when leads reply.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Launch Buttons */}
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setAutopilotTab('sequence')} className="flex-1">
                            Back
                          </Button>
                          <Button 
                            onClick={handleStartAutopilot}
                            disabled={safeLeads.length === 0 || isLaunchingAutopilot}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
                          >
                            {isLaunchingAutopilot ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Launching AI...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                Launch AI Autopilot ({safeLeads.length} leads)
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </>
                  )}
                </Tabs>
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

        {/* FOOTER for Campaign Mode */}
        {composeMode === 'campaign' && campaignTab === 'review' && (
          <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4 text-orange-400" />
              <span>Campaign: {dripLeadCount} leads | {email.subject ? `"${email.subject.substring(0, 30)}..."` : 'No subject'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setCampaignTab('sequence')}>Back</Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !email.subject}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Campaign Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        {/* FOOTER for AI Autopilot Mode */}
        {composeMode === 'autopilot' && hasAutopilotSubscription && (
          <div className="p-4 border-t border-border bg-muted/30">
            {/* Launch Progress Animation */}
            {isLaunchingAutopilot ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {autopilotLaunchProgress < 30 ? 'Analyzing lead profiles...' :
                       autopilotLaunchProgress < 50 ? 'Preparing personalized sequences...' :
                       autopilotLaunchProgress < 70 ? 'Configuring AI decision engine...' :
                       autopilotLaunchProgress < 90 ? 'Setting up response detection...' :
                       autopilotLaunchProgress < 100 ? 'Activating autopilot...' :
                       '🚀 Launch complete!'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {safeLeads.length} leads being prepared for AI outreach
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
                    {autopilotLaunchProgress}%
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
                    style={{ width: `${autopilotLaunchProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4 text-primary" />
                  <span>{safeLeads.length} verified leads ready for AI outreach</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button
                    onClick={handleStartAutopilot}
                    disabled={safeLeads.length === 0 || isLaunchingAutopilot}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Launch AI Campaign
                  </Button>
                </div>
              </div>
            )}
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
      
      {/* Template Required Modal */}
      <AlertDialog open={showTemplateRequiredModal} onOpenChange={setShowTemplateRequiredModal}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Template Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to select or configure an email template before proceeding. You can either:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Choose an AI template from the gallery above</li>
                <li>Upload your own custom template</li>
                <li>Go to Step 3: Email Outreach to configure your template</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Here</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowTemplateSelector(true);
                setShowTemplateRequiredModal(false);
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <FileText className="w-4 h-4 mr-2" />
              Browse Templates
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                onClose();
                sessionStorage.setItem('bamlead_current_step', '3');
                toast.info('Navigate to Step 3: Email Outreach in the dashboard to configure your template.');
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Step 3
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Campaign Selection Dialog */}
      <AlertDialog open={showCampaignSelection} onOpenChange={setShowCampaignSelection}>
        <AlertDialogContent className="bg-card border-border max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-orange-400" />
              Choose Campaign Type
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select how you want to reach out to your leads
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-2 gap-4 my-4">
            {/* Manual Campaign */}
            <button
              onClick={() => {
                setSelectedCampaignType('manual');
                setComposeMode('campaign');
                setShowCampaignSelection(false);
                
                // Audit log
                const auditLog = {
                  type: 'campaign_selection',
                  campaignType: 'manual',
                  timestamp: new Date().toISOString(),
                  userId: localStorage.getItem('bamlead_user_id') || 'unknown',
                };
                const logs = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                logs.push(auditLog);
                localStorage.setItem('bamlead_campaign_audit', JSON.stringify(logs));
                
                toast.success('Manual Campaign selected');
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                selectedCampaignType === 'manual'
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-border hover:border-orange-500/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-5 h-5 text-orange-400" />
                <span className="font-semibold text-foreground text-sm">Manual Campaign Send</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Follow up with your customers manually
              </p>
              <div className="space-y-1 text-[10px] text-muted-foreground">
                <p>• Select leads → Template → Send</p>
                <p>• Full control over each email</p>
                <p>• No automation</p>
              </div>
            </button>
            
            {/* AI Autopilot */}
            <button
              onClick={() => {
                // Check if user has subscription or is on trial
                if (hasAutopilotSubscription || trialStatus.canUseAutopilot) {
                  setSelectedCampaignType('autopilot');
                  setComposeMode('autopilot');
                  setShowCampaignSelection(false);
                  
                  // Audit log - critical for tracking selection
                  const auditLog = {
                    type: 'campaign_selection',
                    campaignType: 'autopilot',
                    timestamp: new Date().toISOString(),
                    userId: localStorage.getItem('bamlead_user_id') || 'unknown',
                    hasSubscription: hasAutopilotSubscription,
                    isOnTrial: trialStatus.isTrialActive,
                    trialDaysRemaining: trialStatus.trialDaysRemaining,
                  };
                  const logs = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                  logs.push(auditLog);
                  localStorage.setItem('bamlead_campaign_audit', JSON.stringify(logs));
                  
                  toast.success('AI Autopilot Campaign selected');
                } else {
                  // Show payment required modal
                  setShowCampaignSelection(false);
                  setShowPaymentRequired(true);
                }
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left relative",
                selectedCampaignType === 'autopilot'
                  ? "border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/10"
                  : "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5"
              )}
            >
              {hasAutopilotSubscription && (
                <Badge className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                  Active
                </Badge>
              )}
              {trialStatus.isTrialActive && !hasAutopilotSubscription && (
                <Badge className="absolute top-2 right-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                  {trialStatus.trialDaysRemaining}d trial
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-amber-400 text-sm">AI Autopilot</span>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] px-1.5 border-0">
                  PRO
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                AI handles everything automatically
              </p>
              <div className="space-y-1 text-[10px] text-muted-foreground">
                <p>• Automated drip sequences</p>
                <p>• Intelligent follow-ups</p>
                <p>• AI response detection</p>
                <p className="text-amber-400">$19.99/month or 14-day free trial</p>
              </div>
            </button>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Payment Required Dialog */}
      <AlertDialog open={showPaymentRequired} onOpenChange={setShowPaymentRequired}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              AI Autopilot Subscription Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI Autopilot Campaign is a premium feature that requires an active subscription or free trial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 my-4">
            <h4 className="font-semibold text-foreground mb-2">What's included:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Automated drip email sequences</li>
              <li>✓ Intelligent follow-up timing</li>
              <li>✓ AI response detection & pausing</li>
              <li>✓ Lead prioritization (Hot/Warm/Cold)</li>
              <li>✓ Real-time campaign monitoring</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-amber-500/20">
              <p className="text-lg font-bold text-amber-400">$19.99/month</p>
              <p className="text-xs text-muted-foreground">or start with a 14-day free trial</p>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Start trial
                startTrial();
                setSelectedCampaignType('autopilot');
                setComposeMode('autopilot');
                setShowPaymentRequired(false);
                
                // Audit log
                const auditLog = {
                  type: 'trial_started',
                  campaignType: 'autopilot',
                  timestamp: new Date().toISOString(),
                  userId: localStorage.getItem('bamlead_user_id') || 'unknown',
                };
                const logs = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                logs.push(auditLog);
                localStorage.setItem('bamlead_campaign_audit', JSON.stringify(logs));
                
                toast.success('14-day free trial started!');
              }}
              className="bg-amber-500 hover:bg-amber-600 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Free Trial
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                upgradeToPaid();
                
                // Audit log
                const auditLog = {
                  type: 'payment_initiated',
                  campaignType: 'autopilot',
                  timestamp: new Date().toISOString(),
                  userId: localStorage.getItem('bamlead_user_id') || 'unknown',
                };
                const logs = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                logs.push(auditLog);
                localStorage.setItem('bamlead_campaign_audit', JSON.stringify(logs));
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Subscribe $19.99/mo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
