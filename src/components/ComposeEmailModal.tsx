import { useState, useEffect, useMemo, useRef } from 'react';
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
  CheckSquare, Square, Edit3, ExternalLink, Shield
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
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
import { sendBulkEmails, LeadForEmail } from '@/lib/api/email';
import { EmailSequence, getSuggestedSequence } from '@/lib/emailSequences';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import { 
  getLeadContextByEmail, 
  generatePersonalizationFromContext,
  saveCampaignLeadsWithContext,
  getStoredLeadContext
} from '@/lib/leadContext';
import { getSuggestedTemplate, personalizeTemplate } from '@/lib/priorityEmailTemplates';
import { saveAutopilotCampaign, updateAutopilotCampaign } from '@/lib/autopilotCampaign';
import AIStrategySelector from './AIStrategySelector';
import { AIStrategy, autoSelectStrategy, buildStrategyContext } from '@/lib/aiStrategyEngine';

// Enhanced Lead interface with Step 2 analysis data
interface Lead {
  id?: string | number;
  email?: string;
  phone?: string;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasValidEmail(email?: string): boolean {
  return !!email && EMAIL_REGEX.test(email.trim());
}

function hasValidPhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
}

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
  const [showTemplateGalleryModal, setShowTemplateGalleryModal] = useState(false);
  const [showAISubjects, setShowAISubjects] = useState(true);
  const [showSequenceSelector, setShowSequenceSelector] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState<{
    id?: string;
    name: string;
    subject?: string;
    body?: string;
    rawSubject?: string;
    rawBody?: string;
    source?: 'priority' | 'gallery' | 'sequence' | 'auto';
  } | null>(null);
  
  // Select All leads state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [selectAllLeads, setSelectAllLeads] = useState(false);
  const [showTemplateRequiredModal, setShowTemplateRequiredModal] = useState(false);

  // Autopilot launch state
  const [isLaunchingAutopilot, setIsLaunchingAutopilot] = useState(false);
  const [autopilotLaunchProgress, setAutopilotLaunchProgress] = useState(0);
  const [showLeadsPreview, setShowLeadsPreview] = useState(false);
  const [autopilotTab, setAutopilotTab] = useState<AutopilotTab>('leads');
  const subjectInputRef = useRef<HTMLInputElement>(null);
  
  // Campaign selection state
  const [showCampaignSelection, setShowCampaignSelection] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState<'manual' | 'autopilot' | null>(null);
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  
  // AI Strategy state
  const [selectedStrategy, setSelectedStrategy] = useState<AIStrategy | null>(null);
  const [strategyApproved, setStrategyApproved] = useState(false);

  // Drip settings
  const [dripMode, setDripMode] = useState(false);
  const [dripInterval, setDripInterval] = useState(60); // seconds
  const [dripRate, setDripRate] = useState(30); // emails per hour
  const [workflowEmailLeadCount, setWorkflowEmailLeadCount] = useState(0);
  const [dripSettingsReady, setDripSettingsReady] = useState(false);

  // Use the trial hook for autopilot subscription status
  const { status: trialStatus, startTrial, upgradeToPaid, MONTHLY_PRICE, TRIAL_DURATION_DAYS } = useAutopilotTrial();
  const hasAutopilotSubscription = trialStatus.canUseAutopilot;
  
  // Plan features for Unlimited mode
  const { isUnlimited: isUnlimitedPlan } = usePlanFeatures();

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
  const autopilotEligibleLeads = useMemo(
    () => safeLeads.filter((lead) => hasValidEmail(lead.email) && hasValidPhone(lead.phone)),
    [safeLeads]
  );
  const autopilotExcludedCount = safeLeads.length - autopilotEligibleLeads.length;
  
  // Filtered leads based on campaign target
  const filteredLeads = useMemo(() => {
    if (campaignTarget === 'all') return safeLeads;
    return safeLeads.filter(l => 
      campaignTarget === 'cold' 
        ? (l.aiClassification === 'cold' || !l.aiClassification)
        : l.aiClassification === campaignTarget
    );
  }, [safeLeads, campaignTarget]);

  const smtpSenderName = useMemo(() => getSMTPConfig()?.fromName || 'Your Name', []);

  const dominantPriority = useMemo<'hot' | 'warm' | 'cold'>(() => {
    const hot = safeLeads.filter(l => l.aiClassification === 'hot').length;
    const warm = safeLeads.filter(l => l.aiClassification === 'warm').length;
    const cold = safeLeads.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length;
    if (hot >= warm && hot >= cold) return 'hot';
    if (warm >= hot && warm >= cold) return 'warm';
    return 'cold';
  }, [safeLeads]);

  const representativeLead = useMemo(() => {
    if (safeLeads.length === 0) return null;
    return safeLeads.find(l => (l.aiClassification || 'cold') === dominantPriority) || safeLeads[0];
  }, [safeLeads, dominantPriority]);

  const suggestedTemplate = useMemo(() => {
    if (!representativeLead) return null;
    const suggested = getSuggestedTemplate({
      aiClassification: representativeLead.aiClassification,
      priority: representativeLead.priority as 'hot' | 'warm' | 'cold' | undefined,
      leadScore: representativeLead.leadScore,
      hasWebsite: !!representativeLead.website,
      websiteIssues: representativeLead.websiteIssues,
    });
    const personalized = personalizeTemplate(
      suggested,
      {
        business_name: representativeLead.business_name || representativeLead.name,
        first_name: representativeLead.first_name || representativeLead.contact_name,
        email: representativeLead.email,
        website: representativeLead.website,
        industry: representativeLead.industry,
      },
      smtpSenderName
    );
    return {
      id: suggested.id,
      name: suggested.name,
      subject: personalized.subject,
      body: personalized.body,
      rawSubject: suggested.subject,
      rawBody: suggested.body,
      source: 'auto' as const,
    };
  }, [representativeLead, smtpSenderName]);

  const effectiveTemplate = useMemo(() => {
    return selectedCampaignTemplate || suggestedTemplate;
  }, [selectedCampaignTemplate, suggestedTemplate]);

  const suggestedSequence = useMemo(() => {
    if (!representativeLead) return undefined;
    const search = detectedSearchType || 'gmb';
    return getSuggestedSequence(search, {
      aiClassification: representativeLead.aiClassification,
      priority: representativeLead.priority as 'hot' | 'warm' | 'cold' | undefined,
      leadScore: representativeLead.leadScore,
      hasWebsite: !!representativeLead.website,
      websiteIssues: representativeLead.websiteIssues,
    });
  }, [representativeLead, detectedSearchType]);

  const effectiveSequence = useMemo(() => {
    return selectedSequence || suggestedSequence;
  }, [selectedSequence, suggestedSequence]);
  
  const getLeadKey = (lead: Lead, index: number) => {
    if (lead.id !== undefined && lead.id !== null) return String(lead.id);
    if (lead.email) return `email:${lead.email}`;
    return `idx:${index}`;
  };

  const filteredLeadKeys = useMemo(() => {
    return new Set(filteredLeads.map((lead, idx) => getLeadKey(lead, idx)));
  }, [filteredLeads]);

  const selectedLeads = useMemo(() => {
    if (selectAllLeads || selectedLeadIds.size === 0) {
      return filteredLeads;
    }
    return filteredLeads.filter((lead, idx) => selectedLeadIds.has(getLeadKey(lead, idx)));
  }, [filteredLeads, selectAllLeads, selectedLeadIds]);

  useEffect(() => {
    if (selectAllLeads) {
      setSelectedLeadIds(filteredLeadKeys);
      return;
    }
    if (selectedLeadIds.size === 0) return;
    const updated = new Set(
      Array.from(selectedLeadIds).filter((key) => filteredLeadKeys.has(key))
    );
    if (updated.size !== selectedLeadIds.size) {
      setSelectedLeadIds(updated);
    }
  }, [filteredLeadKeys, selectAllLeads, selectedLeadIds]);

  // Handle select all toggle
  const handleSelectAllToggle = (checked: boolean) => {
    setSelectAllLeads(checked);
    if (checked) {
      setSelectedLeadIds(new Set(filteredLeadKeys));
    } else {
      setSelectedLeadIds(new Set());
    }
  };
  
  // Handle individual lead selection
  const handleLeadSelection = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeadIds);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeadIds(newSelected);
    setSelectAllLeads(newSelected.size === filteredLeadKeys.size);
  };
  
  // Get selected lead count for campaign
  const selectedLeadCount = useMemo(() => {
    return selectedLeads.length;
  }, [selectedLeads]);
  
  const dripLeadCount = useMemo(() => {
    return selectedLeadCount;
  }, [selectedLeadCount]);

  const currentFilteredIndex = useMemo(() => {
    if (!currentLead) return -1;
    return filteredLeads.indexOf(currentLead);
  }, [filteredLeads, currentLead]);

  const lastSentFilteredIndex = useMemo(() => {
    if (lastSentIndex < 0) return -1;
    const lastLead = leads[lastSentIndex];
    return lastLead ? filteredLeads.indexOf(lastLead) : -1;
  }, [lastSentIndex, leads, filteredLeads]);

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

  const handleSendCampaign = async () => {
    if (!email.subject || !email.body) {
      toast.error('Please add a subject and message before sending.');
      return;
    }

    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first. Go to Settings > SMTP Configuration.');
      return;
    }

    const selected = selectedLeads;
    const validLeads = selected.filter((lead) => hasValidEmail(lead.email));

    if (validLeads.length === 0) {
      toast.error('No selected leads have valid email addresses.');
      return;
    }

    setIsSending(true);
    try {
      const leadsForSend: LeadForEmail[] = validLeads.map((lead) => ({
        id: typeof lead.id === 'number' ? lead.id : undefined,
        email: lead.email as string,
        business_name: lead.business_name || lead.name,
        contact_name: lead.contact_name || lead.first_name,
        website: lead.website,
        platform: lead.industry,
        issues: lead.websiteIssues,
        phone: (lead as any).phone,
        leadScore: lead.leadScore,
      }));

      const dripConfig = dripMode
        ? { emailsPerHour: Math.max(1, dripRate), delayMinutes: Math.max(1, Math.floor(60 / Math.max(1, dripRate))) }
        : undefined;

      const result = await sendBulkEmails({
        leads: leadsForSend,
        custom_subject: email.subject,
        custom_body: email.body,
        send_mode: dripMode ? 'drip' : 'instant',
        drip_config: dripConfig,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send campaign.');
      }

      const sentCount = result.results?.sent || validLeads.length;
      validLeads.forEach((lead) => {
        const globalIndex = safeLeads.indexOf(lead);
        if (globalIndex >= 0) {
          onEmailSent(globalIndex);
        }
      });

      toast.success(`Campaign sent! ${sentCount} emails queued.`);
      if (dripMode) {
        toast.info(`Drip mode active: ~${Math.ceil(sentCount / Math.max(1, dripRate))} hours to complete.`);
      }
      setCampaignTab('leads');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send campaign.';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
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
      toast.error(`Please subscribe to AI Autopilot first ($${MONTHLY_PRICE}/mo or start ${TRIAL_DURATION_DAYS}-day trial)`);
      return;
    }

    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first. Go to Settings > SMTP Configuration.');
      return;
    }

    if (autopilotEligibleLeads.length === 0) {
      toast.error('No leads available for Autopilot. Add leads first.');
      return;
    }

    const validLeads = autopilotEligibleLeads;

    const launchTemplate = effectiveTemplate;
    const launchSequence = effectiveSequence;
    const fallbackStep = launchSequence?.steps?.[0];
    const subject = launchTemplate?.rawSubject || launchTemplate?.subject || fallbackStep?.subject;
    const body = launchTemplate?.rawBody || launchTemplate?.body || fallbackStep?.body;
    if (!subject || !body) {
      toast.error('Please select a template or sequence before launching Autopilot.');
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
    
    try {
      const leadsWithContext = getStoredLeadContext();
      saveCampaignLeadsWithContext(leadsWithContext);

      const leadsForSend: LeadForEmail[] = validLeads.map(l => ({
        id: typeof l.id === 'number' ? l.id : undefined,
        email: l.email as string,
        business_name: l.business_name || l.name,
        contact_name: l.contact_name || l.first_name,
        website: l.website,
        platform: l.industry,
        issues: l.websiteIssues,
        phone: (l as any).phone,
        leadScore: l.leadScore,
      }));

      const dripConfig = {
        emailsPerHour: Math.max(1, dripRate),
        delayMinutes: Math.max(1, Math.floor(60 / Math.max(1, dripRate))),
      };

      const result = await sendBulkEmails({
        leads: leadsForSend,
        custom_subject: subject,
        custom_body: body,
        send_mode: 'drip',
        drip_config: dripConfig,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to launch Autopilot campaign.');
      }

      const now = new Date().toISOString();
      const campaignId = `autopilot_${Date.now()}`;
      const analysisContext = {
        totalLeads: leadsWithContext.length,
        noWebsiteCount: leadsWithContext.filter(l => !l.websiteAnalysis?.hasWebsite).length,
        needsUpgradeCount: leadsWithContext.filter(l => l.websiteAnalysis?.needsUpgrade).length,
        hotLeadsCount: leadsWithContext.filter(l => l.aiClassification === 'hot').length,
        warmLeadsCount: leadsWithContext.filter(l => l.aiClassification === 'warm').length,
        coldLeadsCount: leadsWithContext.filter(l => l.aiClassification === 'cold').length,
      };

      saveAutopilotCampaign({
        id: campaignId,
        status: 'active',
        searchType: detectedSearchType || null,
        createdAt: now,
        startedAt: now,
        template: {
          id: launchTemplate?.id,
          name: launchTemplate?.name || 'AI Smart Selection',
          subject: launchTemplate?.subject || subject,
          body: launchTemplate?.body || body,
          rawSubject: launchTemplate?.rawSubject || subject,
          rawBody: launchTemplate?.rawBody || body,
          source: launchTemplate?.source || (launchSequence ? 'sequence' : 'auto'),
        },
        sequence: launchSequence,
        leads: validLeads,
        totalLeads: validLeads.length,
        sentCount: result.results?.sent || validLeads.length,
        lastSentAt: now,
        dripConfig,
        analysisSummary: analysisContext,
      });

      localStorage.setItem('bamlead_drip_active', JSON.stringify({
        active: true,
        autopilot: true,
        campaignId,
        leads: validLeads.map(l => l?.id ?? ''),
        leadsWithAnalysis: leadsWithContext.length,
        currentIndex: currentLeadIndex,
        interval: dripInterval,
        searchType: detectedSearchType,
        startedAt: now,
        templateName: launchTemplate?.name || 'AI Smart Selection',
        sequenceId: launchSequence?.id,
        sentCount: result.results?.sent || validLeads.length,
        analysisContext,
      }));

      onAutomationChange({ ...automationSettings, doneForYouMode: true });

      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLaunchingAutopilot(false);
      setAutopilotLaunchProgress(0);
      toast.success(`🤖 AI Autopilot activated! Sending ${result.results?.sent || validLeads.length} emails.`);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to launch Autopilot campaign.';
      updateAutopilotCampaign({ status: 'paused' });
      toast.error(message);
      setIsLaunchingAutopilot(false);
      setAutopilotLaunchProgress(0);
    }
  };

  const handleStartFreeTrial = () => {
    const success = startTrial();
    if (success) {
      toast.success(`🎉 ${TRIAL_DURATION_DAYS}-day free trial started! AI Autopilot is now available.`);
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
          "bg-card border-border overflow-hidden flex flex-col p-0 min-h-0 [&>button]:hidden",
          isFullscreen 
            ? "max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none" 
            : "max-w-5xl w-[92vw] max-h-[90vh] h-[90vh]"
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
          <div className={`grid gap-3 ${isUnlimitedPlan ? 'grid-cols-4 opacity-50 pointer-events-none' : 'grid-cols-3'}`}>
            {/* Mode 1: Basic Single Email */}
            <button
              onClick={() => setComposeMode('regular')}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                composeMode === 'regular'
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border hover:border-blue-500/50 bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-foreground text-sm">Basic Email</span>
                <Badge className="text-[8px] px-1.5 bg-blue-500/20 text-blue-500 border-blue-500/30">
                  Manual Mode
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Send a single email to one customer. You control everything.
              </p>
            </button>

            {/* Mode 2: Co-Pilot Mode Campaign */}
            <button
              onClick={() => {
                setSelectedCampaignType('manual');
                setComposeMode('campaign');
                try {
                  const auditLog = JSON.parse(localStorage.getItem('bamlead_campaign_audit') || '[]');
                  auditLog.push({
                    type: 'copilot',
                    timestamp: new Date().toISOString(),
                    leadCount: safeLeads.length,
                  });
                  localStorage.setItem('bamlead_campaign_audit', JSON.stringify(auditLog));
                } catch {}
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left relative",
                composeMode === 'campaign' && selectedCampaignType === 'manual'
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground text-sm">Co-Pilot Mode</span>
                <Badge className="text-[8px] px-1.5 bg-primary/20 text-primary border-primary/30">
                  Co-Pilot
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                AI assists with writing — you click 'Send'. Send to one or many leads.
              </p>
              {safeLeads.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-primary/20 text-primary border-primary/30 text-[9px]">
                  {safeLeads.length} leads
                </Badge>
              )}
            </button>

            {/* Mode 3: AI Autopilot Campaign */}
            <button
              onClick={() => {
                if (!hasAutopilotSubscription) {
                  setShowPaymentRequired(true);
                  return;
                }
                setSelectedCampaignType('autopilot');
                setComposeMode('autopilot');
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

          {/* Unlimited Mode Banner - shows when on Unlimited plan */}
          {isUnlimitedPlan && (
            <div className="mt-3 p-4 rounded-xl border-2 border-red-500 bg-red-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-foreground text-sm">Unlimited Mode Active</span>
                <Badge className="text-[8px] px-1.5 bg-red-500 text-white border-0">$999/mo</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                All features unlocked. No credit limits. AI handles everything autonomously.
              </p>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <ScrollArea className="flex-1 min-h-0 h-full" showHorizontalScrollbar>
          <div className="p-4 pb-10 min-w-[820px]">
            {/* ===================== REGULAR EMAIL MODE ===================== */}
            {composeMode === 'regular' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-foreground">Compose a single email (Manual Mode)</span>
                </div>

                {/* AI Strategy Selector for Basic Mode - Manual Selection */}
                <AIStrategySelector
                  mode="basic"
                  searchType={detectedSearchType}
                  leads={safeLeads}
                  selectedTemplate={selectedCampaignTemplate || undefined}
                  onSelectStrategy={(strategy) => {
                    setSelectedStrategy(strategy);
                    toast.success(`Strategy selected: ${strategy.name}`);
                  }}
                  selectedStrategy={selectedStrategy}
                  compact
                />

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
                    searchType={detectedSearchType}
                  />
                )}

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

            {/* ===================== CO-PILOT MODE ===================== */}
            {composeMode === 'campaign' && (
              <div className="space-y-4">
                {/* Co-Pilot Campaign sub-tabs */}
                <Tabs value={campaignTab} onValueChange={(v) => setCampaignTab(v as CampaignTab)}>
                  <TabsList className="bg-muted/50 border border-primary/30 p-1 w-full">
                    <TabsTrigger value="leads" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Users className="w-3.5 h-3.5" />
                      1. Leads ({safeLeads.length})
                    </TabsTrigger>
                    <TabsTrigger value="template" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      2. Template
                    </TabsTrigger>
                    <TabsTrigger value="sequence" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Layers className="w-3.5 h-3.5" />
                      3. Sequence
                    </TabsTrigger>
                    <TabsTrigger value="review" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
                      <div className="overflow-x-auto pb-2">
                        <div className="grid grid-cols-4 gap-2 min-w-[520px]">
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
                            currentIndex={currentFilteredIndex}
                            lastSentIndex={lastSentFilteredIndex}
                            variant="horizontal"
                          />
                          
                          {/* Select All Toggle */}
                          <div className="flex items-center justify-between p-3 mt-4 rounded-lg bg-primary/10 border border-primary/30">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id="select-all"
                                checked={selectAllLeads}
                                onCheckedChange={(checked) => handleSelectAllToggle(checked === true)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
                                Select All Leads
                              </label>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              {selectedLeadCount} / {filteredLeads.length} selected
                            </Badge>
                          </div>
                          
                          <ScrollArea className="h-[200px] mt-4">
                            <div className="space-y-2">
                              {filteredLeads.map((lead, idx) => {
                                const globalIndex = safeLeads.indexOf(lead);
                                return (
                                  <div
                                    key={lead?.id ?? idx}
                                    className={cn(
                                      "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                                      selectedLeadIds.has(getLeadKey(lead, idx)) || selectAllLeads
                                        ? "border-primary bg-primary/10"
                                        : globalIndex >= 0 && globalIndex <= lastSentIndex
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : "border-border hover:border-primary/50"
                                    )}
                                  >
                                  <Checkbox
                                    checked={selectAllLeads || selectedLeadIds.has(getLeadKey(lead, idx))}
                                    onCheckedChange={(checked) => handleLeadSelection(getLeadKey(lead, idx), checked === true)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                  <button
                                    onClick={() => {
                                      if (globalIndex >= 0) {
                                        onLeadIndexChange(globalIndex);
                                      }
                                      setEmail(prev => ({ ...prev, to: lead.email || '' }));
                                    }}
                                    className="flex-1 flex items-center gap-3 min-w-0"
                                  >
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                      globalIndex >= 0 && globalIndex <= lastSentIndex
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : globalIndex === currentLeadIndex
                                        ? "bg-orange-500/20 text-orange-400"
                                        : "bg-muted text-muted-foreground"
                                    )}>
                                      {globalIndex >= 0 && globalIndex <= lastSentIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
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
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </div>
                    <Button 
                      onClick={() => setCampaignTab('template')} 
                      disabled={safeLeads.length === 0}
                      className="w-full bg-primary hover:bg-primary/90 gap-2"
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
                                if (selectedCampaignTemplate.subject || selectedCampaignTemplate.rawSubject) {
                                  setEmail(prev => ({
                                    ...prev,
                                    subject: selectedCampaignTemplate.rawSubject || selectedCampaignTemplate.subject || '',
                                    body: selectedCampaignTemplate.rawBody || selectedCampaignTemplate.body || '',
                                  }));
                                }
                                setCampaignTab('template');
                                setTimeout(() => {
                                  subjectInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  subjectInputRef.current?.focus();
                                }, 50);
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
                              onClick={() => {
                                setShowTemplateGalleryModal(true);
                              }}
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
                        ref={subjectInputRef}
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
                    {/* AI Strategy Panel - Co-Pilot Mode */}
                    <AIStrategySelector
                      mode="copilot"
                      searchType={detectedSearchType}
                      leads={safeLeads}
                      selectedTemplate={selectedCampaignTemplate || undefined}
                      onSelectStrategy={(strategy) => {
                        setSelectedStrategy(strategy);
                        setStrategyApproved(false);
                        toast.info(`Strategy selected: ${strategy.name}`);
                      }}
                      onApproveStrategy={(strategy) => {
                        setSelectedStrategy(strategy);
                        setStrategyApproved(true);
                        toast.success(`Strategy approved: ${strategy.name}`);
                      }}
                      selectedStrategy={selectedStrategy}
                    />
                    
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
                        {selectedLeads.slice(0, showLeadsPreview ? selectedLeads.length : 3).map((lead, idx) => (
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
                        {!showLeadsPreview && selectedLeads.length > 3 && (
                          <p className="text-xs text-center text-muted-foreground py-2">
                            + {selectedLeads.length - 3} more recipients
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setCampaignTab('sequence')} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={handleSendCampaign}
                        disabled={isSending || !email.subject || !email.body || selectedLeads.length === 0}
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
                      1. Leads ({autopilotEligibleLeads.length})
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
                          {`$${MONTHLY_PRICE}/month`}
                        </Badge>
                      </div>
                      <Button 
                        onClick={upgradeToPaid}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        {`Subscribe Now - $${MONTHLY_PRICE}/month`}
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
                              {`$${MONTHLY_PRICE}/mo`}
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
                            AI will only include leads that have both a valid email and phone number.
                          </p>
                          {autopilotExcludedCount > 0 && (
                            <p className="text-xs text-amber-400 mb-3">
                              {autopilotExcludedCount} lead{autopilotExcludedCount !== 1 ? 's are' : ' is'} excluded (missing valid email or phone).
                            </p>
                          )}
                          
                          {/* Lead Stats */}
                          <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="p-3 rounded-lg bg-background border border-border text-center">
                              <div className="text-lg font-bold text-foreground">{autopilotEligibleLeads.length}</div>
                              <div className="text-[10px] text-muted-foreground">Total</div>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                              <div className="text-lg font-bold text-red-400">{autopilotEligibleLeads.filter(l => l.aiClassification === 'hot').length}</div>
                              <div className="text-[10px] text-muted-foreground">Hot</div>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                              <div className="text-lg font-bold text-amber-400">{autopilotEligibleLeads.filter(l => l.aiClassification === 'warm').length}</div>
                              <div className="text-[10px] text-muted-foreground">Warm</div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                              <div className="text-lg font-bold text-blue-400">{autopilotEligibleLeads.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length}</div>
                              <div className="text-[10px] text-muted-foreground">Cold</div>
                            </div>
                          </div>
                          
                          {/* Lead List */}
                          <ScrollArea className="h-[250px]">
                            <div className="space-y-2">
                              {autopilotEligibleLeads.map((lead, idx) => (
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
                          disabled={autopilotEligibleLeads.length === 0}
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
                          
                          {effectiveTemplate ? (
                            <div className="p-4 rounded-lg bg-background border border-amber-500/30 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{effectiveTemplate.name}</p>
                                  {!selectedCampaignTemplate && (
                                    <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                                      AI Selected
                                    </Badge>
                                  )}
                                </div>
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
                              {effectiveTemplate.subject && (
                                <p className="text-xs text-muted-foreground">Subject: {effectiveTemplate.subject}</p>
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
                        {/* AI Strategy Panel - Autopilot Mode (Auto-Selected) */}
                        <AIStrategySelector
                          mode="autopilot"
                          searchType={detectedSearchType}
                          leads={autopilotEligibleLeads}
                          selectedTemplate={selectedCampaignTemplate || effectiveTemplate || undefined}
                          onSelectStrategy={(strategy) => setSelectedStrategy(strategy)}
                          selectedStrategy={selectedStrategy || autoSelectStrategy(buildStrategyContext(detectedSearchType, autopilotEligibleLeads))}
                        />
                        
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
                              <span className="font-medium text-foreground">{autopilotEligibleLeads.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Template:</span>
                              <span className="font-medium text-foreground">{effectiveTemplate?.name || 'AI Smart Selection'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sequence:</span>
                              <span className="font-medium text-foreground">{effectiveSequence?.name || 'AI Optimized'}</span>
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
                              Recipients ({autopilotEligibleLeads.length})
                            </h4>
                          </div>
                          
                          <div className="space-y-2">
                            {autopilotEligibleLeads.slice(0, 5).map((lead, idx) => (
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
                            {autopilotEligibleLeads.length > 5 && (
                              <p className="text-xs text-center text-muted-foreground py-2">
                                + {autopilotEligibleLeads.length - 5} more recipients
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
                            disabled={autopilotEligibleLeads.length === 0 || isLaunchingAutopilot}
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
                                Launch AI Autopilot ({autopilotEligibleLeads.length} leads)
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
              <span>Campaign: {selectedLeadCount} leads | {email.subject ? `"${email.subject.substring(0, 30)}..."` : 'No subject'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setCampaignTab('sequence')}>Back</Button>
              <Button
                onClick={handleSendCampaign}
                disabled={isSending || !email.subject || !email.body || selectedLeads.length === 0}
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
                      {autopilotEligibleLeads.length} leads being prepared for AI outreach
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
                  <span>{autopilotEligibleLeads.length} verified leads ready for AI outreach</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button
                    onClick={handleStartAutopilot}
                    disabled={autopilotEligibleLeads.length === 0 || isLaunchingAutopilot}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
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
          const useRawTemplate = composeMode === 'campaign';
          setEmail(prev => ({
            ...prev,
            subject: useRawTemplate ? template.rawSubject : template.subject,
            body: useRawTemplate ? template.rawBody : template.body,
          }));
          setSelectedCampaignTemplate({
            id: template.id,
            name: template.name,
            subject: template.subject,
            body: template.body,
            rawSubject: template.rawSubject,
            rawBody: template.rawBody,
            source: 'priority',
          });
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

      {/* Full Template Gallery Modal */}
      <Dialog open={showTemplateGalleryModal} onOpenChange={setShowTemplateGalleryModal}>
        <DialogContent
          elevated
          className="max-w-6xl w-[96vw] h-[92vh] flex flex-col p-0 bg-card border-border overflow-hidden"
        >
          <ScrollArea className="h-full">
            <HighConvertingTemplateGallery
              onSelectTemplate={(template) => {
                setSelectedCampaignTemplate({
                  name: template.name || 'Selected Template',
                  subject: template.subject,
                  body: template.body_html || '',
                  rawSubject: template.subject,
                  rawBody: template.body_html || '',
                  source: 'gallery',
                });
                setEmail(prev => ({
                  ...prev,
                  subject: template.subject || '',
                  body: template.body_html || '',
                }));
                setShowTemplateGalleryModal(false);
                setCampaignTab('template');
                setTimeout(() => {
                  subjectInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  subjectInputRef.current?.focus();
                }, 50);
                toast.success(`Template "${template.name}" selected!`);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
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
                <p className="text-amber-400">
                  {`$${MONTHLY_PRICE}/month or ${TRIAL_DURATION_DAYS}-day free trial`}
                </p>
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
              <p className="text-lg font-bold text-amber-400">{`$${MONTHLY_PRICE}/month`}</p>
              <p className="text-xs text-muted-foreground">
                {`or start with a ${TRIAL_DURATION_DAYS}-day free trial`}
              </p>
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
                
                toast.success(`${TRIAL_DURATION_DAYS}-day free trial started!`);
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
              {`Subscribe $${MONTHLY_PRICE}/mo`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
