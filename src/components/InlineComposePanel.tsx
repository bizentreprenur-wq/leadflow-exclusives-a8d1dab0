import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { loadDripSettings, saveDripSettings } from '@/lib/dripSettings';
import {
  Crown, Brain, FileText, Layers, Rocket, Send, ArrowRight, ArrowLeft,
  CheckCircle2, RefreshCw, Bot, Sparkles, BarChart3, Mail, Clock,
  TrendingUp, Eye, X, ChevronRight, Flame, ThermometerSun, Snowflake
} from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';
import { isSMTPConfigured, getSMTPConfig, personalizeContent } from '@/lib/emailService';
import SMTPStatusIndicator from './SMTPStatusIndicator';
import { sendBulkEmails, LeadForEmail } from '@/lib/api/email';
import { EmailSequence, getSuggestedSequence } from '@/lib/emailSequences';
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
import LeadQueueIndicator from './LeadQueueIndicator';

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
  websiteAnalysis?: any;
  painPoints?: string[];
  talkingPoints?: string[];
  aiInsights?: string[];
  recommendedApproach?: string;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  successProbability?: number;
}

interface InlineComposePanelProps {
  leads: Lead[];
  currentLeadIndex: number;
  lastSentIndex: number;
  onLeadIndexChange: (index: number) => void;
  onEmailSent: (index: number) => void;
  onClose: () => void;
  automationSettings: {
    doneForYouMode: boolean;
    autoFollowUps: boolean;
  };
  onAutomationChange: (settings: any) => void;
  searchType?: 'gmb' | 'platform' | null;
}

type UnlimitedTab = 'strategy' | 'template' | 'sequence' | 'launch';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function hasValidEmail(email?: string): boolean {
  return !!email && EMAIL_REGEX.test(email.trim());
}
function hasValidPhone(phone?: string): boolean {
  if (!phone) return false;
  return phone.replace(/\D/g, '').length >= 7;
}

export default function InlineComposePanel({
  leads,
  currentLeadIndex,
  lastSentIndex,
  onLeadIndexChange,
  onEmailSent,
  onClose,
  automationSettings,
  onAutomationChange,
  searchType,
}: InlineComposePanelProps) {
  const [activeTab, setActiveTab] = useState<UnlimitedTab>('strategy');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [sentEmailsList, setSentEmailsList] = useState<Array<{ email: string; name: string; sentAt: string }>>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<AIStrategy | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [email, setEmail] = useState({ subject: '', body: '' });

  const { status: trialStatus } = useAutopilotTrial();

  const safeLeads = useMemo(() => leads?.filter((l): l is Lead => l != null) ?? [], [leads]);
  const eligibleLeads = useMemo(
    () => safeLeads.filter((l) => hasValidEmail(l.email) && hasValidPhone(l.phone)),
    [safeLeads]
  );

  const detectedSearchType = useMemo(() => {
    if (searchType) return searchType;
    try { return sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' | null; } catch { return null; }
  }, [searchType]);

  const smtpSenderName = useMemo(() => getSMTPConfig()?.fromName || 'Your Name', []);

  const dominantPriority = useMemo<'hot' | 'warm' | 'cold'>(() => {
    const hot = safeLeads.filter(l => l.aiClassification === 'hot').length;
    const warm = safeLeads.filter(l => l.aiClassification === 'warm').length;
    if (hot >= warm) return 'hot';
    if (warm >= hot) return 'warm';
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
    return { id: suggested.id, name: suggested.name, subject: personalized.subject, body: personalized.body, rawSubject: suggested.subject, rawBody: suggested.body, source: 'auto' as const };
  }, [representativeLead, smtpSenderName]);

  const effectiveTemplate = suggestedTemplate;

  const suggestedSequence = useMemo(() => {
    if (!representativeLead) return undefined;
    return getSuggestedSequence(detectedSearchType || 'gmb', {
      aiClassification: representativeLead.aiClassification,
      priority: representativeLead.priority as 'hot' | 'warm' | 'cold' | undefined,
      leadScore: representativeLead.leadScore,
      hasWebsite: !!representativeLead.website,
      websiteIssues: representativeLead.websiteIssues,
    });
  }, [representativeLead, detectedSearchType]);

  const effectiveSequence = selectedSequence || suggestedSequence;

  // Drip settings
  const [dripRate, setDripRate] = useState(30);
  const [dripInterval, setDripInterval] = useState(60);
  useEffect(() => {
    const settings = loadDripSettings();
    setDripRate(settings.emailsPerHour);
    setDripInterval(settings.intervalSeconds);
  }, []);
  useEffect(() => { setDripInterval(Math.round(3600 / Math.max(1, dripRate))); }, [dripRate]);

  // Auto-populate email from template
  useEffect(() => {
    if (effectiveTemplate && !email.subject && !email.body) {
      setEmail({ subject: effectiveTemplate.subject || '', body: effectiveTemplate.body || '' });
    }
  }, [effectiveTemplate]);

  // Comma-separated "To" display
  const toFieldDisplay = useMemo(() => {
    return eligibleLeads.map(l => l.email).filter(Boolean).join(', ');
  }, [eligibleLeads]);

  const handleLaunch = async () => {
    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first.');
      return;
    }
    if (eligibleLeads.length === 0) {
      toast.error('No eligible leads to send to.');
      return;
    }

    const subject = effectiveTemplate?.rawSubject || effectiveTemplate?.subject || effectiveSequence?.steps?.[0]?.subject;
    const body = effectiveTemplate?.rawBody || effectiveTemplate?.body || effectiveSequence?.steps?.[0]?.body;
    if (!subject || !body) {
      toast.error('No template or sequence content available.');
      return;
    }

    setIsLaunching(true);
    setLaunchProgress(0);

    const steps = [
      { progress: 15, delay: 200 }, { progress: 35, delay: 400 },
      { progress: 55, delay: 300 }, { progress: 75, delay: 350 },
      { progress: 90, delay: 250 }, { progress: 100, delay: 200 },
    ];
    for (const s of steps) {
      await new Promise(r => setTimeout(r, s.delay));
      setLaunchProgress(s.progress);
    }

    try {
      const leadsWithContext = getStoredLeadContext();
      saveCampaignLeadsWithContext(leadsWithContext);

      const leadsForSend: LeadForEmail[] = eligibleLeads.map(l => ({
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

      const dripConfig = { emailsPerHour: Math.max(1, dripRate), delayMinutes: Math.max(1, Math.floor(60 / Math.max(1, dripRate))) };

      const result = await sendBulkEmails({
        leads: leadsForSend,
        custom_subject: subject,
        custom_body: body,
        send_mode: 'drip',
        drip_config: dripConfig,
      });

      if (!result.success) throw new Error(result.error || 'Failed to launch.');

      const now = new Date().toISOString();
      const campaignId = `unlimited_${Date.now()}`;
      saveAutopilotCampaign({
        id: campaignId, status: 'active', searchType: detectedSearchType || null,
        createdAt: now, startedAt: now,
        template: { id: effectiveTemplate?.id, name: effectiveTemplate?.name || 'AI Smart Selection', subject, body, rawSubject: subject, rawBody: body, source: 'auto' },
        sequence: effectiveSequence, leads: eligibleLeads, totalLeads: eligibleLeads.length,
        sentCount: result.results?.sent || eligibleLeads.length, lastSentAt: now, dripConfig,
      });

      localStorage.setItem('bamlead_drip_active', JSON.stringify({
        active: true, autopilot: true, campaignId,
        leads: eligibleLeads.map(l => l?.id ?? ''),
        currentIndex: currentLeadIndex, interval: dripInterval,
        searchType: detectedSearchType, startedAt: now,
        templateName: effectiveTemplate?.name || 'AI Smart Selection',
        sentCount: result.results?.sent || eligibleLeads.length,
      }));

      onAutomationChange({ ...automationSettings, doneForYouMode: true });
      await new Promise(r => setTimeout(r, 500));
      setIsLaunching(false);
      toast.success(`🚀 Campaign launched! ${result.results?.sent || eligibleLeads.length} emails queued.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Launch failed.';
      updateAutopilotCampaign({ status: 'paused' });
      toast.error(msg);
      setIsLaunching(false);
      setLaunchProgress(0);
    }
  };

  const tabs: { id: UnlimitedTab; label: string; icon: React.ReactNode }[] = [
    { id: 'strategy', label: 'AI Strategy', icon: <Brain className="w-4 h-4" /> },
    { id: 'template', label: 'Template', icon: <FileText className="w-4 h-4" /> },
    { id: 'sequence', label: 'Sequence', icon: <Layers className="w-4 h-4" /> },
    { id: 'launch', label: 'Launch', icon: <Rocket className="w-4 h-4" /> },
  ];

  const tabIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Bar - Unlimited branding + To field + close */}
      <div className="border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">New Message</span>
              <Badge className="ml-2 text-[8px] bg-red-500/10 text-red-400 border-red-500/20">Unlimited</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SMTPStatusIndicator showConfigureButton={false} />
            <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* To field */}
        <div className="flex items-start gap-2">
          <span className="text-xs text-muted-foreground pt-1.5 shrink-0">To:</span>
          <div className="flex-1 p-1.5 rounded-md bg-muted/30 border border-border text-xs text-foreground leading-relaxed max-h-16 overflow-y-auto break-all">
            {toFieldDisplay || <span className="text-muted-foreground italic">No eligible leads</span>}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 mt-1">
            {eligibleLeads.length} recipients
          </Badge>
        </div>
      </div>

      {/* Main body: vertical tabs left + content right */}
      <div className="flex-1 flex min-h-0">
        {/* Vertical Tabs */}
        <div className="w-[52px] border-r border-border bg-card flex flex-col py-2 shrink-0">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-3 px-1 transition-all relative",
                activeTab === tab.id
                  ? "text-red-400 bg-red-500/10"
                  : idx <= tabIndex
                    ? "text-emerald-400 hover:bg-muted/40"
                    : "text-muted-foreground hover:bg-muted/40"
              )}
              title={tab.label}
            >
              {activeTab === tab.id && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r bg-red-500" />
              )}
              {idx < tabIndex && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                </div>
              )}
              {tab.icon}
              <span className="text-[8px] font-medium leading-tight text-center">{tab.label.split(' ').pop()}</span>
            </button>
          ))}

          <div className="flex-1" />

          {/* Stats button */}
          <button
            onClick={() => setShowLiveStats(!showLiveStats)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-3 px-1 transition-all",
              showLiveStats ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted/40"
            )}
            title="Live Stats"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[8px] font-medium">Stats</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">

              {/* ===== STRATEGY TAB ===== */}
              {activeTab === 'strategy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-foreground">AI Strategy</span>
                    <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Pre-configured</Badge>
                  </div>
                  <AIStrategySelector
                    mode="autopilot"
                    searchType={detectedSearchType}
                    leads={safeLeads}
                    selectedTemplate={effectiveTemplate || undefined}
                    onSelectStrategy={(s) => {
                      setSelectedStrategy(s);
                      toast.success(`Strategy: ${s.name}`);
                    }}
                    selectedStrategy={selectedStrategy}
                    compact
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('template')} className="bg-red-500 hover:bg-red-600 gap-2 text-sm">
                      Next: Template <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ===== TEMPLATE TAB ===== */}
              {activeTab === 'template' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-foreground">Email Template</span>
                    <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Pre-configured</Badge>
                  </div>

                  {effectiveTemplate ? (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{effectiveTemplate.name}</span>
                        </div>
                        <Badge className="text-[8px] bg-red-500/10 text-red-400 border-red-500/20">AI Selected</Badge>
                      </div>
                      {/* Subject */}
                      <div className="px-4 py-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">Subject:</span>
                          <Input
                            value={email.subject}
                            onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
                            className="border-0 bg-transparent h-7 text-sm p-0 focus-visible:ring-0 shadow-none"
                            placeholder="Email subject..."
                          />
                        </div>
                      </div>
                      {/* Body */}
                      <div className="p-4">
                        <Textarea
                          value={email.body}
                          onChange={(e) => setEmail(prev => ({ ...prev, body: e.target.value }))}
                          className="border-0 bg-transparent min-h-[200px] p-0 focus-visible:ring-0 shadow-none text-sm resize-none"
                          placeholder="Email body..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border-2 border-dashed border-border">
                      <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">AI will auto-select the best template</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('strategy')} className="gap-2 text-sm">
                      <ArrowLeft className="w-3.5 h-3.5" /> Strategy
                    </Button>
                    <Button onClick={() => setActiveTab('sequence')} className="bg-red-500 hover:bg-red-600 gap-2 text-sm">
                      Next: Sequence <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ===== SEQUENCE TAB ===== */}
              {activeTab === 'sequence' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-foreground">Email Sequence</span>
                    <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Pre-configured</Badge>
                  </div>

                  {effectiveSequence ? (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{effectiveSequence.emoji}</span>
                          <div>
                            <p className="font-medium text-foreground text-sm">{effectiveSequence.name}</p>
                            <p className="text-[10px] text-muted-foreground">{effectiveSequence.steps.length} emails in sequence</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-[10px]",
                          effectiveSequence.priority === 'hot' && "bg-red-500/20 text-red-400 border-red-500/30",
                          effectiveSequence.priority === 'warm' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                          effectiveSequence.priority === 'cold' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}>
                          {effectiveSequence.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {effectiveSequence.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-400">
                              D{step.day}
                            </div>
                            <span className="text-muted-foreground text-xs">{step.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border-2 border-dashed border-border">
                      <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">AI will select the optimal sequence</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('template')} className="gap-2 text-sm">
                      <ArrowLeft className="w-3.5 h-3.5" /> Template
                    </Button>
                    <Button onClick={() => setActiveTab('launch')} className="bg-red-500 hover:bg-red-600 gap-2 text-sm">
                      Ready to Launch <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ===== LAUNCH TAB ===== */}
              {activeTab === 'launch' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-foreground">Launch Campaign</span>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-gradient-to-br from-red-500/5 to-red-900/5 border border-red-500/20 p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Leads:</span><span className="font-medium text-foreground">{eligibleLeads.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Strategy:</span><span className="font-medium text-foreground">{selectedStrategy?.name || 'AI Auto-Selected'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Template:</span><span className="font-medium text-foreground">{effectiveTemplate?.name || 'AI Smart Selection'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sequence:</span><span className="font-medium text-foreground">{effectiveSequence?.name || 'AI Optimized'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Mode:</span><span className="font-medium text-red-400">Full Automation (Unlimited)</span></div>
                  </div>

                  {/* Lead Queue - Last Sent / Sending / Next */}
                  {eligibleLeads.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-foreground">Sending Queue</span>
                      </div>
                      <LeadQueueIndicator
                        leads={eligibleLeads}
                        currentIndex={currentLeadIndex}
                        lastSentIndex={lastSentIndex}
                        variant="horizontal"
                      />
                    </div>
                  )}

                  {/* Sent emails tracker */}
                  {sentEmailsList.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-foreground">Sent ({sentEmailsList.length})</span>
                      </div>
                      <ScrollArea className="max-h-[100px]">
                        <div className="space-y-1">
                          {sentEmailsList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-foreground truncate">{item.name}</span>
                              <span className="text-muted-foreground truncate ml-auto">{item.email}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* AI Info */}
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-medium text-foreground">AI Takes Over After Launch</p>
                        <p className="text-[10px] text-muted-foreground">Sends sequences, detects responses, pauses on replies.</p>
                      </div>
                    </div>
                  </div>

                  {/* Launch + Back */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setActiveTab('sequence')} className="text-sm">Back</Button>
                    <Button
                      onClick={handleLaunch}
                      disabled={eligibleLeads.length === 0 || isLaunching}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white gap-2 text-sm"
                    >
                      {isLaunching ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Launching... {launchProgress}%</>
                      ) : (
                        <><Rocket className="w-4 h-4" /> Launch Campaign ({eligibleLeads.length} leads)</>
                      )}
                    </Button>
                  </div>

                  {/* Launch progress bar */}
                  {isLaunching && (
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                        style={{ width: `${launchProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Live Stats Panel (bottom drawer) */}
          {showLiveStats && (
            <div className="border-t border-border bg-card p-3 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Live Stats</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
                  <div className="text-base font-bold text-foreground">{eligibleLeads.length}</div>
                  <div className="text-[9px] text-muted-foreground">Queued</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-base font-bold text-emerald-400">{sentEmailsList.length}</div>
                  <div className="text-[9px] text-muted-foreground">Sent</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                  <div className="text-base font-bold text-blue-400">0</div>
                  <div className="text-[9px] text-muted-foreground">Opened</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-base font-bold text-amber-400">0</div>
                  <div className="text-[9px] text-muted-foreground">Replied</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
