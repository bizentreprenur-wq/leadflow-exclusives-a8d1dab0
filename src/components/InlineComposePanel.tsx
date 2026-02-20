import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { loadDripSettings, saveDripSettings } from '@/lib/dripSettings';
import { getUserLogoFromStorage } from '@/hooks/useUserBranding';
import {
  Crown, Brain, FileText, Layers, Rocket, Send, ArrowRight,
  CheckCircle2, RefreshCw, Bot, Sparkles, BarChart3, Mail, Clock,
  TrendingUp, X, Flame, ThermometerSun, Snowflake, Bold, Italic,
  Underline, AlignLeft, List, Link2, Image, Paperclip, Smile, MoreHorizontal,
  Trash2, ChevronDown, Code, Eye
} from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';
import { isSMTPConfigured, getSMTPConfig, personalizeContent } from '@/lib/emailService';
import { sendBulkEmails, LeadForEmail, processMyScheduledEmails } from '@/lib/api/email';
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

type SideTab = 'strategy' | 'template' | 'sequence' | 'launch';

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
  const [activeSideTab, setActiveSideTab] = useState<SideTab | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [sentEmailsList, setSentEmailsList] = useState<Array<{ email: string; name: string; sentAt: string }>>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<AIStrategy | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [email, setEmail] = useState({ subject: '', body: '' });
  const [bodyHtml, setBodyHtml] = useState<string | null>(null); // stores rich HTML template
  const [isEditingSource, setIsEditingSource] = useState(false); // toggle between visual & source
  const editableRef = useRef<HTMLDivElement>(null);
  const [manualToInput, setManualToInput] = useState('');
  const [manualRecipients, setManualRecipients] = useState<Array<{ email: string; label: string; initial: string }>>([]);
  const [showSendingFeed, setShowSendingFeed] = useState(false);

  const isHtmlContent = useMemo(() => {
    return bodyHtml !== null || (email.body && /<[a-z][\s\S]*>/i.test(email.body));
  }, [bodyHtml, email.body]);

  const userLogo = useMemo(() => getUserLogoFromStorage(), []);

  // Sync contentEditable changes back to state
  const handleEditableInput = useCallback(() => {
    if (editableRef.current) {
      const html = editableRef.current.innerHTML;
      setBodyHtml(html);
      setEmail(prev => ({ ...prev, body: html }));
    }
  }, []);

  // Set editable content when template loads
  useEffect(() => {
    if (editableRef.current && isHtmlContent && !isEditingSource) {
      const html = bodyHtml || email.body;
      if (html && editableRef.current.innerHTML !== html) {
        editableRef.current.innerHTML = html;
      }
    }
  }, [bodyHtml, isHtmlContent, isEditingSource]);

  const handleAddManualRecipient = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && EMAIL_REGEX.test(trimmed) && !manualRecipients.some(r => r.email === trimmed)) {
      setManualRecipients(prev => [...prev, {
        email: trimmed,
        label: trimmed,
        initial: trimmed[0].toUpperCase(),
      }]);
      setManualToInput('');
    }
  };

  const handleRemoveManualRecipient = (emailToRemove: string) => {
    setManualRecipients(prev => prev.filter(r => r.email !== emailToRemove));
  };

  const handleManualToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      handleAddManualRecipient(manualToInput);
    }
  };

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

  // Auto-populate email from template (check for visual HTML template first)
  useEffect(() => {
    if (email.subject || email.body || bodyHtml) return; // already populated

    // Check for a visual HTML template from the template gallery/editor
    try {
      const stored = localStorage.getItem('bamlead_selected_template');
      if (stored) {
        const template = JSON.parse(stored);
        if (template.body_html) {
          setBodyHtml(template.body_html);
          setEmail({ subject: template.subject || '', body: template.body_html });
          return;
        }
        if (template.body) {
          setEmail({ subject: template.subject || '', body: template.body || template.body_text || '' });
          return;
        }
      }
    } catch (e) {}

    // Fallback to auto-suggested template
    if (effectiveTemplate) {
      setEmail({ subject: effectiveTemplate.subject || '', body: effectiveTemplate.body || '' });
    }
  }, [effectiveTemplate]);

  // Recipient chips
  const recipientChips = useMemo(() => {
    return eligibleLeads.slice(0, 20).map(l => ({
      email: l.email || '',
      label: l.business_name || l.name || l.first_name || l.email || '',
      initial: (l.business_name || l.name || l.first_name || l.email || 'U')[0].toUpperCase(),
    }));
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

    const subject = email.subject || effectiveTemplate?.rawSubject || effectiveTemplate?.subject || effectiveSequence?.steps?.[0]?.subject;
    const body = bodyHtml || email.body || effectiveTemplate?.rawBody || effectiveTemplate?.body || effectiveSequence?.steps?.[0]?.body;
    if (!subject || !body) {
      toast.error('No template or sequence content available. Please add a subject and body.');
      setIsLaunching(false);
      return;
    }

    setIsLaunching(true);
    setLaunchProgress(0);
    setShowSendingFeed(true);

    try {
      const leadsWithContext = getStoredLeadContext();
      saveCampaignLeadsWithContext(leadsWithContext);

      setLaunchProgress(10);

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

      setLaunchProgress(25);
      console.log('[BamLead] Sending bulk emails:', { leadsCount: leadsForSend.length, subject, sendMode: 'drip', dripConfig });

      const result = await sendBulkEmails({
        leads: leadsForSend,
        custom_subject: subject,
        custom_body: body,
        send_mode: 'drip',
        drip_config: dripConfig,
      });

      console.log('[BamLead] Bulk send result:', result);

      if (!result.success) throw new Error(result.error || 'Failed to launch campaign. Check SMTP settings and try again.');

      setLaunchProgress(60);

      // Trigger immediate processing of scheduled emails
      try {
        const processResult = await processMyScheduledEmails(10, 300);
        console.log('[BamLead] Process scheduled result:', processResult);
      } catch (procErr) {
        console.warn('[BamLead] Could not trigger immediate processing:', procErr);
      }

      setLaunchProgress(100);

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

  const sideTabs: { id: SideTab; label: string; icon: React.ReactNode; shortLabel: string; color: string; activeColor: string; activeBg: string; borderColor: string }[] = [
    { id: 'strategy', label: 'AI Strategy', icon: <Brain className="w-3.5 h-3.5" />, shortLabel: 'Strategy', color: 'text-purple-400', activeColor: 'text-purple-300', activeBg: 'bg-purple-500/10', borderColor: 'bg-purple-500' },
    { id: 'template', label: 'Template', icon: <FileText className="w-3.5 h-3.5" />, shortLabel: 'Template', color: 'text-cyan-400', activeColor: 'text-cyan-300', activeBg: 'bg-cyan-500/10', borderColor: 'bg-cyan-500' },
    { id: 'sequence', label: 'Sequence', icon: <Layers className="w-3.5 h-3.5" />, shortLabel: 'Sequence', color: 'text-amber-400', activeColor: 'text-amber-300', activeBg: 'bg-amber-500/10', borderColor: 'bg-amber-500' },
    { id: 'launch', label: 'Launch', icon: <Rocket className="w-3.5 h-3.5" />, shortLabel: 'Launch', color: 'text-emerald-400', activeColor: 'text-emerald-300', activeBg: 'bg-emerald-500/10', borderColor: 'bg-emerald-500' },
  ];

  const colorMap: Record<string, string> = {
    A: 'bg-blue-600', B: 'bg-rose-600', C: 'bg-emerald-600', D: 'bg-purple-600',
    E: 'bg-amber-600', F: 'bg-cyan-600', G: 'bg-pink-600', H: 'bg-teal-600',
    I: 'bg-indigo-600', J: 'bg-orange-600', K: 'bg-lime-600', L: 'bg-red-600',
    M: 'bg-sky-600', N: 'bg-violet-600', O: 'bg-fuchsia-600', P: 'bg-green-600',
  };
  const getChipColor = (initial: string) => colorMap[initial.toUpperCase()] || 'bg-muted-foreground';

  return (
    <div className="h-full flex bg-background">
      {/* Left Vertical Tabs */}
      <div className="w-11 border-r border-border bg-card flex flex-col py-1 shrink-0">
        {sideTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSideTab(activeSideTab === tab.id ? null : tab.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 px-0.5 transition-all relative",
              activeSideTab === tab.id
                ? `${tab.activeColor} ${tab.activeBg}`
                : `${tab.color} hover:bg-muted/40`
            )}
            title={tab.label}
          >
            {activeSideTab === tab.id && (
              <div className={cn("absolute left-0 top-1 bottom-1 w-0.5 rounded-r", tab.borderColor)} />
            )}
            {tab.icon}
            <span className="text-[7px] font-medium leading-tight text-center">{tab.shortLabel}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowSendingFeed(!showSendingFeed)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2.5 px-0.5 transition-all",
            showSendingFeed ? "text-emerald-400 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted/40"
          )}
          title="Sending Feed"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="text-[7px] font-medium">Feed</span>
        </button>
      </div>

      {/* Side Panel (when a tab is active) */}
      {activeSideTab && (
        <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {sideTabs.find(t => t.id === activeSideTab)?.label}
            </span>
            <Button size="icon" variant="ghost" onClick={() => setActiveSideTab(null)} className="h-5 w-5">
              <X className="w-3 h-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {activeSideTab === 'strategy' && (
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
              )}

              {activeSideTab === 'template' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">Current template is shown in the email body. Edit directly or select a different one below.</p>
                  {effectiveTemplate && (
                    <div className="p-2 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3 h-3 text-red-400" />
                        <span className="text-[11px] font-medium text-foreground">{effectiveTemplate.name}</span>
                      </div>
                      <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">AI Selected</Badge>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[11px]"
                    onClick={() => {
                      // Try visual template from localStorage first
                      try {
                        const stored = localStorage.getItem('bamlead_selected_template');
                        if (stored) {
                          const t = JSON.parse(stored);
                          if (t.body_html) {
                            setBodyHtml(t.body_html);
                            setEmail({ subject: t.subject || '', body: t.body_html });
                            setIsEditingSource(false);
                            toast.success('Visual template restored');
                            return;
                          }
                        }
                      } catch (e) {}
                      if (effectiveTemplate) {
                        setEmail({ subject: effectiveTemplate.subject, body: effectiveTemplate.body });
                        setBodyHtml(null);
                        toast.success('Template applied to email body');
                      }
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Reset to AI Template
                  </Button>
                </div>
              )}

              {activeSideTab === 'sequence' && effectiveSequence && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{effectiveSequence.emoji}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{effectiveSequence.name}</p>
                      <p className="text-[9px] text-muted-foreground">{effectiveSequence.steps.length} steps</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {effectiveSequence.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-muted/30 text-[10px]">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-[9px] font-bold text-red-400 shrink-0">
                          D{step.day}
                        </div>
                        <span className="text-muted-foreground">{step.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSideTab === 'launch' && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-gradient-to-br from-red-500/5 to-red-900/5 border border-red-500/20 p-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Leads:</span><span className="font-medium text-foreground">{eligibleLeads.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Strategy:</span><span className="font-medium text-foreground">{selectedStrategy?.name || 'Auto'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Template:</span><span className="font-medium text-foreground">{effectiveTemplate?.name || 'Auto'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sequence:</span><span className="font-medium text-foreground">{effectiveSequence?.name || 'Auto'}</span></div>
                  </div>

                  {eligibleLeads.length > 0 && (
                    <LeadQueueIndicator
                      leads={eligibleLeads}
                      currentIndex={currentLeadIndex}
                      lastSentIndex={lastSentIndex}
                      variant="horizontal"
                    />
                  )}

                  <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-[10px] text-foreground">AI handles follow-ups & replies</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleLaunch}
                    disabled={eligibleLeads.length === 0 || isLaunching}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white gap-1.5 text-xs"
                  >
                    {isLaunching ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {launchProgress}%</>
                    ) : (
                      <><Rocket className="w-3.5 h-3.5" /> Launch ({eligibleLeads.length})</>
                    )}
                  </Button>

                  {isLaunching && (
                    <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300" style={{ width: `${launchProgress}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Compose Area (always visible) */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">New Message</span>
            <Badge className="text-[8px] bg-red-500/10 text-red-400 border-red-500/20">
              <Crown className="w-2.5 h-2.5 mr-0.5" /> Unlimited
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Sending Status Cards */}
            <div className="flex items-center gap-2">
              {/* Last Sent */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card min-w-[120px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-foreground">Last Sent</span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                    {lastSentIndex >= 0 && lastSentIndex < eligibleLeads.length
                      ? (eligibleLeads[lastSentIndex]?.business_name || eligibleLeads[lastSentIndex]?.email || 'Sent')
                      : 'No emails sent yet'}
                  </span>
                </div>
              </div>

              {/* Sending Now */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 min-w-[130px]">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-cyan-300">Sending Now</span>
                    {isLaunching && (
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                    {isLaunching && currentLeadIndex < eligibleLeads.length
                      ? (eligibleLeads[currentLeadIndex]?.business_name || eligibleLeads[currentLeadIndex]?.email || 'Sending...')
                      : 'Ready to send'}
                  </span>
                </div>
              </div>

              {/* Up Next */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card min-w-[110px]">
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-foreground">Up Next</span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                    {currentLeadIndex + 1 < eligibleLeads.length
                      ? (eligibleLeads[currentLeadIndex + 1]?.business_name || eligibleLeads[currentLeadIndex + 1]?.email || 'Queued')
                      : 'Queue complete'}
                  </span>
                </div>
              </div>
            </div>

            <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* To Field - Gmail-style chips + manual input */}
        <div className="px-4 py-2 border-b border-border/50 shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground pt-1 shrink-0">To</span>
            <div className="flex-1 flex flex-wrap gap-1 max-h-32 overflow-y-auto items-center">
              {/* Manual recipients */}
              {manualRecipients.map((chip, i) => (
                <span
                  key={`manual-${i}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-foreground"
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-cyan-600">
                    {chip.initial}
                  </span>
                  <span className="truncate max-w-[140px]">{chip.label}</span>
                  <X className="w-2.5 h-2.5 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleRemoveManualRecipient(chip.email)} />
                </span>
              ))}
              {/* Drip feed recipients */}
              {recipientChips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border text-[11px] text-foreground"
                >
                  <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white", getChipColor(chip.initial))}>
                    {chip.initial}
                  </span>
                  <span className="truncate max-w-[140px]">{chip.label}</span>
                  <X className="w-2.5 h-2.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                </span>
              ))}
              {eligibleLeads.length > 20 && (
                <span className="text-[10px] text-muted-foreground self-center">+{eligibleLeads.length - 20} more</span>
              )}
              {/* Inline manual email input */}
              <input
                type="email"
                value={manualToInput}
                onChange={(e) => setManualToInput(e.target.value)}
                onKeyDown={handleManualToKeyDown}
                onBlur={() => { if (manualToInput.trim()) handleAddManualRecipient(manualToInput); }}
                className="flex-1 min-w-[160px] bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 h-6"
                placeholder={recipientChips.length === 0 && manualRecipients.length === 0 ? "Type email address…" : "Add more…"}
              />
            </div>
            <span className="text-[10px] text-muted-foreground pt-1 cursor-pointer hover:text-foreground">Cc Bcc</span>
          </div>
        </div>

        {/* Subject */}
        <div className="px-4 py-1.5 border-b border-border/50 shrink-0">
          <Input
            value={email.subject}
            onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
            className="border-0 bg-transparent h-8 text-sm p-0 focus-visible:ring-0 shadow-none"
            placeholder="Subject"
          />
        </div>

        {/* Email Body - editable template or plain text */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Source toggle for HTML content */}
          {isHtmlContent && (
            <div className="px-4 py-1 border-b border-border/50 flex items-center gap-2 shrink-0">
              <Button
                variant={!isEditingSource ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={() => setIsEditingSource(false)}
              >
                <Eye className="w-3 h-3" /> Edit
              </Button>
              <Button
                variant={isEditingSource ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={() => setIsEditingSource(true)}
              >
                <Code className="w-3 h-3" /> HTML Source
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-4 relative">
              {!email.body && !bodyHtml && (
                <div className="absolute inset-0 p-4 pointer-events-none flex flex-col items-center justify-center text-center gap-3 opacity-60">
                  <FileText className="w-8 h-8 text-cyan-400/50" />
                  <div>
                    <p className="text-sm text-muted-foreground">Compose your email…</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">Your Email Template will be placed here.<br/>Select a template from <span className="text-cyan-400 font-medium">Step 2</span> or type manually.</p>
                  </div>
                </div>
              )}

              {/* Editable rich HTML content */}
              {isHtmlContent && !isEditingSource ? (
                <div
                  ref={editableRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditableInput}
                  className="min-h-[250px] outline-none text-sm leading-relaxed text-foreground [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_a]:text-blue-400 [&_a]:underline [&_table]:border-collapse [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                  style={{ wordBreak: 'break-word' }}
                />
              ) : (
                <Textarea
                  value={email.body}
                  onChange={(e) => {
                    setEmail(prev => ({ ...prev, body: e.target.value }));
                    if (bodyHtml !== null) setBodyHtml(e.target.value);
                  }}
                  className="border-0 bg-transparent min-h-[250px] p-0 focus-visible:ring-0 shadow-none text-sm resize-none w-full"
                  placeholder="Compose your email here..."
                />
              )}
            </div>
          </ScrollArea>

          {/* Sending Feed (when active) */}
          {showSendingFeed && (
            <div className="border-t border-border bg-card px-4 py-2 shrink-0 max-h-36">
              <div className="flex items-center gap-2 mb-1.5">
                <Send className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-semibold text-foreground">Live Sending Feed</span>
                <div className="flex-1" />
                <div className="flex gap-3 text-[9px]">
                  <span className="text-muted-foreground">Queued: <span className="text-foreground font-medium">{eligibleLeads.length}</span></span>
                  <span className="text-muted-foreground">Sent: <span className="text-emerald-400 font-medium">{sentEmailsList.length}</span></span>
                  <span className="text-muted-foreground">Opened: <span className="text-blue-400 font-medium">0</span></span>
                </div>
              </div>
              {eligibleLeads.length > 0 && (
                <div className="space-y-1 overflow-y-auto max-h-20">
                  {lastSentIndex >= 0 && lastSentIndex < eligibleLeads.length && (
                    <div className="flex items-center gap-2 p-1 rounded bg-emerald-500/5 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-muted-foreground">Last Sent:</span>
                      <span className="text-foreground font-medium truncate">{eligibleLeads[lastSentIndex]?.business_name || eligibleLeads[lastSentIndex]?.email}</span>
                    </div>
                  )}
                  {currentLeadIndex < eligibleLeads.length && (
                    <div className="flex items-center gap-2 p-1 rounded bg-amber-500/5 text-[10px]">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
                      <span className="text-muted-foreground">Sending Now:</span>
                      <span className="text-foreground font-medium truncate">{eligibleLeads[currentLeadIndex]?.business_name || eligibleLeads[currentLeadIndex]?.email}</span>
                    </div>
                  )}
                  {currentLeadIndex + 1 < eligibleLeads.length && (
                    <div className="flex items-center gap-2 p-1 rounded bg-muted/30 text-[10px]">
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Next:</span>
                      <span className="text-foreground font-medium truncate">{eligibleLeads[currentLeadIndex + 1]?.business_name || eligibleLeads[currentLeadIndex + 1]?.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Toolbar - Gmail style */}
          <div className="border-t border-border px-3 py-1.5 flex items-center gap-1 shrink-0 bg-card">
            <Button
              onClick={handleLaunch}
              disabled={eligibleLeads.length === 0 || isLaunching}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-7 h-10 text-sm font-semibold gap-2 shadow-[0_0_16px_hsl(38_92%_50%_/_0.3)] animate-pulse-slow"
            >
              {isLaunching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronDown className="w-3 h-3" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-0.5">
              {[
                { Icon: Bold, color: 'text-blue-400' },
                { Icon: Italic, color: 'text-purple-400' },
                { Icon: Underline, color: 'text-pink-400' },
              ].map(({ Icon, color }, i) => (
                <Button key={i} variant="ghost" size="icon" className={`h-7 w-7 ${color} hover:brightness-125`}>
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              ))}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:brightness-125">
                <AlignLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-teal-400 hover:brightness-125">
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-0.5">
              {[
                { Icon: Link2, color: 'text-cyan-400' },
                { Icon: Smile, color: 'text-yellow-400' },
                { Icon: Paperclip, color: 'text-orange-400' },
                { Icon: Image, color: 'text-emerald-400' },
              ].map(({ Icon, color }, i) => (
                <Button key={i} variant="ghost" size="icon" className={`h-7 w-7 ${color} hover:brightness-125`}>
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
