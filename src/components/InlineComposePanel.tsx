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
  Trash2, ChevronDown, Code, Eye, Pause, Play
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
import { HIGH_CONVERTING_TEMPLATES, HERO_IMAGE_CHOICES, getHeroImageChoices } from '@/lib/highConvertingTemplates';

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
  const [localSendingIndex, setLocalSendingIndex] = useState(-1);
  const [localLastSentIndex, setLocalLastSentIndex] = useState(-1);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [email, setEmail] = useState({ subject: '', body: '' });
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const [manualToInput, setManualToInput] = useState('');
  const [manualRecipients, setManualRecipients] = useState<Array<{ email: string; label: string; initial: string }>>([]);
  const [showSendingFeed, setShowSendingFeed] = useState(false);
  // Track which recipient indices have been sent (for removing chips)
  const [sentRecipientIndices, setSentRecipientIndices] = useState<Set<number>>(new Set());
  const [sentManualIndices, setSentManualIndices] = useState<Set<number>>(new Set());
  const [removedLeadEmails, setRemovedLeadEmails] = useState<Set<string>>(new Set());
  const [isSendingPaused, setIsSendingPaused] = useState(false);
  const pauseRef = useRef(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showImageSwap, setShowImageSwap] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState<string | null>(null);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [ccRecipients, setCcRecipients] = useState<Array<{ email: string; label: string; initial: string }>>([]);
  const [bccRecipients, setBccRecipients] = useState<Array<{ email: string; label: string; initial: string }>>([]);

  const handleAddCcRecipient = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && EMAIL_REGEX.test(trimmed) && !ccRecipients.some(r => r.email === trimmed)) {
      setCcRecipients(prev => [...prev, { email: trimmed, label: trimmed, initial: trimmed[0].toUpperCase() }]);
      setCcInput('');
    }
  };
  const handleAddBccRecipient = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && EMAIL_REGEX.test(trimmed) && !bccRecipients.some(r => r.email === trimmed)) {
      setBccRecipients(prev => [...prev, { email: trimmed, label: trimmed, initial: trimmed[0].toUpperCase() }]);
      setBccInput('');
    }
  };
  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && ccInput.trim()) {
      e.preventDefault();
      handleAddCcRecipient(ccInput);
    }
  };
  const handleBccKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && bccInput.trim()) {
      e.preventDefault();
      handleAddBccRecipient(bccInput);
    }
  };

  const SENT_LOG_KEY = 'bamlead_sent_emails_log';

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
  const { isUnlimited: isUnlimitedTier } = usePlanFeatures();

  const safeLeads = useMemo(() => leads?.filter((l): l is Lead => l != null) ?? [], [leads]);
  const eligibleLeads = useMemo(
    () => safeLeads.filter((l) => hasValidEmail(l.email) && !removedLeadEmails.has((l.email || '').toLowerCase())),
    [safeLeads, removedLeadEmails]
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

  // Unlimited auto-config: auto-select strategy on mount
  useEffect(() => {
    if (isUnlimitedTier && !selectedStrategy && safeLeads.length > 0) {
      const context = buildStrategyContext(detectedSearchType, safeLeads);
      const bestStrategy = autoSelectStrategy(context);
      if (bestStrategy) {
        setSelectedStrategy(bestStrategy);
      }
    }
  }, [isUnlimitedTier, safeLeads.length, detectedSearchType]);

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
  // For Unlimited users: auto-select a visual HTML template with hero image if none stored

  useEffect(() => {
    // Always check localStorage for a visual HTML template with images FIRST
    try {
      const stored = localStorage.getItem('bamlead_selected_template');
      if (stored) {
        const template = JSON.parse(stored);
        if (template.body_html) {
          // Only update if the stored template is different from current
          if (bodyHtml !== template.body_html) {
            setBodyHtml(template.body_html);
            setEmail({ subject: template.subject || '', body: template.body_html });
            // Extract hero image for swap feature
            const imgMatch = template.body_html.match(/<img[^>]*src="([^"]+)"/);
            if (imgMatch) setCurrentHeroImage(imgMatch[1]);
          }
          return;
        }
        if (template.body || template.body_text) {
          const body = template.body || template.body_text || '';
          if (email.body !== body) {
            setEmail({ subject: template.subject || '', body });
          }
          return;
        }
      }
    } catch (e) {}

    // For Unlimited users: auto-select a visual HTML template with hero image
    if (isUnlimitedTier && !email.subject && !email.body && !bodyHtml) {
      const visualTemplate = HIGH_CONVERTING_TEMPLATES.find(t => t.body_html && t.body_html.includes('<img'));
      if (visualTemplate) {
        // Personalize with representative lead data
        let html = visualTemplate.body_html;
        let subject = visualTemplate.subject;
        if (representativeLead) {
          const biz = representativeLead.business_name || representativeLead.name || '{{business_name}}';
          const first = representativeLead.first_name || representativeLead.contact_name || '{{first_name}}';
          html = html.replace(/\{\{business_name\}\}/g, biz).replace(/\{\{first_name\}\}/g, first);
          subject = subject.replace(/\{\{business_name\}\}/g, biz).replace(/\{\{first_name\}\}/g, first);
        }
        html = html.replace(/\{\{sender_name\}\}/g, smtpSenderName);
        setBodyHtml(html);
        setEmail({ subject, body: html });
        // Store so it persists
        localStorage.setItem('bamlead_selected_template', JSON.stringify({
          id: visualTemplate.id,
          name: visualTemplate.name,
          subject,
          body_html: html,
        }));
        // Extract hero image
        const imgMatch = html.match(/<img[^>]*src="([^"]+)"/);
        if (imgMatch) setCurrentHeroImage(imgMatch[1]);
        return;
      }
    }

    // Only fall back to auto-suggested template if nothing is populated yet
    if (!email.subject && !email.body && !bodyHtml && effectiveTemplate) {
      setEmail({ subject: effectiveTemplate.subject || '', body: effectiveTemplate.body || '' });
    }
  }, [effectiveTemplate, isUnlimitedTier]);

  // Recipient chips
  const recipientChips = useMemo(() => {
    return eligibleLeads.slice(0, 20).map(l => ({
      email: l.email || '',
      label: l.business_name || l.name || l.first_name || l.email || '',
      initial: (l.business_name || l.name || l.first_name || l.email || 'U')[0].toUpperCase(),
    }));
  }, [eligibleLeads]);

   const handleLaunch = async () => {
    setSendError(null);

    if (!isSMTPConfigured()) {
      const err = 'SMTP not configured. Go to Settings → SMTP to add your mail server credentials.';
      toast.error(err);
      setSendError(err);
      return;
    }

    const allRecipients = [...eligibleLeads.map(l => ({ email: l.email as string, name: l.business_name || l.name || l.email || '' })), ...manualRecipients.map(r => ({ email: r.email, name: r.label }))];

    if (allRecipients.length === 0) {
      const err = 'No recipients. Add leads or type email addresses in the To field.';
      toast.error(err);
      setSendError(err);
      return;
    }

    const subject = email.subject || effectiveTemplate?.rawSubject || effectiveTemplate?.subject || effectiveSequence?.steps?.[0]?.subject;
    const body = bodyHtml || email.body || effectiveTemplate?.rawBody || effectiveTemplate?.body || effectiveSequence?.steps?.[0]?.body;
    if (!subject || !body) {
      const err = 'Missing subject or body. Please add email content before sending.';
      toast.error(err);
      setSendError(err);
      setIsLaunching(false);
      return;
    }

    setIsLaunching(true);
    setLaunchProgress(0);
    setSentEmailsList([]);
    setLocalSendingIndex(0);
    setLocalLastSentIndex(-1);

    try {
      const leadsWithContext = getStoredLeadContext();
      saveCampaignLeadsWithContext(leadsWithContext);

      setLaunchProgress(10);

      // Combine search leads + manual recipients
      const leadsFromSearch: LeadForEmail[] = eligibleLeads.map(l => ({
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
      const leadsFromManual: LeadForEmail[] = manualRecipients.map(r => ({
        email: r.email,
        business_name: r.label !== r.email ? r.label : undefined,
      }));
      const leadsForSend: LeadForEmail[] = [...leadsFromSearch, ...leadsFromManual];

      // Determine send mode: if only manual recipients (no search leads), always instant
      const isManualOnlyEmail = leadsFromSearch.length === 0 && leadsFromManual.length > 0;
      const dripConfig = { emailsPerHour: Math.max(1, dripRate), delayMinutes: Math.max(1, Math.floor(60 / Math.max(1, dripRate))) };
      const isManualMode = isManualOnlyEmail || !automationSettings.doneForYouMode;
      const sendMode = isManualMode ? 'instant' : 'drip';

      setLaunchProgress(25);
      console.log('[BamLead] Sending bulk emails:', { leadsCount: leadsForSend.length, subject, sendMode, dripConfig });

      const result = await sendBulkEmails({
        leads: leadsForSend,
        custom_subject: subject,
        custom_body: body,
        send_mode: sendMode,
        drip_config: sendMode === 'drip' ? dripConfig : undefined,
      });

      console.log('[BamLead] Bulk send result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Backend rejected the send request. Check SMTP settings and try again.');
      }

      setLaunchProgress(60);

      // For drip mode, trigger immediate processing of all scheduled emails
      if (sendMode === 'drip') {
        try {
          // Use large lookahead to force-process all just-scheduled emails now
          const totalToProcess = leadsForSend.length;
          const processResult = await processMyScheduledEmails(totalToProcess, 86400);
          console.log('[BamLead] Process scheduled result:', processResult);
          // Add processed count to sent
          if (processResult.success && processResult.processed) {
            result.results = result.results || { total: 0, sent: 0, failed: 0, skipped: 0, details: [] };
            result.results.sent = (result.results.sent || 0) + processResult.processed;
            if (processResult.failed) {
              result.results.failed = (result.results.failed || 0) + processResult.failed;
            }
          }
        } catch (procErr) {
          console.warn('[BamLead] Could not trigger immediate processing:', procErr);
        }
      }

      // Calculate real sent count from backend response
      const actualSent = result.results?.sent || 0;
      const actualScheduled = result.results?.scheduled || 0;
      const sentCount = actualSent + actualScheduled; // scheduled = queued for delivery
      const failedCount = result.results?.failed || 0;

      if (sentCount === 0 && failedCount === 0 && leadsForSend.length > 0) {
        throw new Error(`Backend queued 0 of ${leadsForSend.length} emails. Check your SMTP credentials and try again.`);
      }

      if (failedCount > 0) {
        toast.warning(`⚠️ ${failedCount} of ${leadsForSend.length} emails failed to send. Check SMTP settings.`);
      }
      const sentItems: Array<{ email: string; name: string; sentAt: string }> = [];
      
      // For instant mode (manual emails): mark all as sent immediately, no drip feed
      if (sendMode === 'instant') {
        for (let i = 0; i < Math.min(sentCount, allRecipients.length); i++) {
          const sentItem = { 
            email: allRecipients[i].email, 
            name: allRecipients[i].name, 
            sentAt: new Date().toISOString(),
            subject: subject,
          };
          sentItems.push(sentItem);
          
          if (i < eligibleLeads.length) {
            setSentRecipientIndices(prev => new Set([...prev, i]));
            onEmailSent?.(i);
          } else {
            const manualIdx = i - eligibleLeads.length;
            setSentManualIndices(prev => new Set([...prev, manualIdx]));
          }
          
          try {
            const existing = JSON.parse(localStorage.getItem(SENT_LOG_KEY) || '[]');
            existing.push(sentItem);
            localStorage.setItem(SENT_LOG_KEY, JSON.stringify(existing));
            window.dispatchEvent(new Event('bamlead_sent_update'));
          } catch { /* ignore */ }
        }
        setSentEmailsList(sentItems);
        setLocalSendingIndex(-1);
        setLocalLastSentIndex(Math.min(sentCount, allRecipients.length) - 1);
        setLaunchProgress(100);
        setIsLaunching(false);
        toast.success(`✅ Email sent to ${sentCount} recipient${sentCount > 1 ? 's' : ''}${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
      } else {
        // Drip mode: show live feed with delays
        setShowSendingFeed(true);
        pauseRef.current = false;
        setIsSendingPaused(false);
        const dripDelayMs = Math.max(2000, dripInterval * 1000);
        
        for (let i = 0; i < Math.min(sentCount, allRecipients.length); i++) {
          if (pauseRef.current) {
            toast.info(`Campaign paused after ${i} of ${sentCount} emails.`);
            setIsLaunching(false);
            setLocalSendingIndex(-1);
            break;
          }
          setLocalSendingIndex(i);
          setLocalLastSentIndex(i - 1);
          
          const sentItem = { 
            email: allRecipients[i].email, 
            name: allRecipients[i].name, 
            sentAt: new Date().toISOString(),
            subject: subject,
          };
          sentItems.push(sentItem);
          setSentEmailsList([...sentItems]);
          setLaunchProgress(60 + Math.round((i / allRecipients.length) * 35));
          
          if (i < eligibleLeads.length) {
            setSentRecipientIndices(prev => new Set([...prev, i]));
            onEmailSent?.(i);
          } else {
            const manualIdx = i - eligibleLeads.length;
            setSentManualIndices(prev => new Set([...prev, manualIdx]));
          }
          
          try {
            const existing = JSON.parse(localStorage.getItem(SENT_LOG_KEY) || '[]');
            existing.push(sentItem);
            localStorage.setItem(SENT_LOG_KEY, JSON.stringify(existing));
            window.dispatchEvent(new Event('bamlead_sent_update'));
          } catch { /* ignore */ }
          
          if (i < allRecipients.length - 1) {
            await new Promise(r => setTimeout(r, dripDelayMs));
          }
        }
        setLocalLastSentIndex(Math.min(sentCount, allRecipients.length) - 1);
        setLocalSendingIndex(-1);
        setLaunchProgress(100);

        const now = new Date().toISOString();
        const campaignId = `unlimited_${Date.now()}`;
        saveAutopilotCampaign({
          id: campaignId, status: 'active', searchType: detectedSearchType || null,
          createdAt: now, startedAt: now,
          template: { id: effectiveTemplate?.id, name: effectiveTemplate?.name || 'AI Smart Selection', subject, body, rawSubject: subject, rawBody: body, source: 'auto' },
          sequence: effectiveSequence, leads: eligibleLeads, totalLeads: eligibleLeads.length,
          sentCount: sentCount, lastSentAt: now, dripConfig,
        });

        localStorage.setItem('bamlead_drip_active', JSON.stringify({
          active: true, autopilot: true, campaignId,
          leads: eligibleLeads.map(l => l?.id ?? ''),
          currentIndex: currentLeadIndex, interval: dripInterval,
          searchType: detectedSearchType, startedAt: now,
          templateName: effectiveTemplate?.name || 'AI Smart Selection',
          sentCount: sentCount,
        }));

        onAutomationChange({ ...automationSettings, doneForYouMode: true });
        await new Promise(r => setTimeout(r, 500));
        setIsLaunching(false);
        const statusMsg = actualSent > 0 && actualScheduled > 0
          ? `${actualSent} sent, ${actualScheduled} queued`
          : actualSent > 0 ? `${actualSent} sent` : `${actualScheduled} queued`;
        toast.success(`🚀 Campaign launched! ${statusMsg}${failedCount > 0 ? `, ${failedCount} failed` : ''}.`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Launch failed. Unknown error.';
      console.error('[BamLead] Send error:', msg, error);
      updateAutopilotCampaign({ status: 'paused' });
      setSendError(msg);
      toast.error(`❌ Send failed: ${msg}`);
      setIsLaunching(false);
      setLaunchProgress(0);
      setLocalSendingIndex(-1);
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
                    disabled={(eligibleLeads.length === 0 && manualRecipients.length === 0) || isLaunching}
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
                    {sentEmailsList.length > 0
                      ? sentEmailsList[sentEmailsList.length - 1]?.name || sentEmailsList[sentEmailsList.length - 1]?.email
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
                    {isLaunching && localSendingIndex >= 0 && localSendingIndex < eligibleLeads.length
                      ? (eligibleLeads[localSendingIndex]?.business_name || eligibleLeads[localSendingIndex]?.email || 'Sending...')
                      : sendError ? '⚠ Error' : 'Ready to send'}
                  </span>
                </div>
              </div>

              {/* Up Next */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card min-w-[110px]">
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-foreground">Up Next</span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                    {localSendingIndex >= 0 && localSendingIndex + 1 < eligibleLeads.length
                      ? (eligibleLeads[localSendingIndex + 1]?.business_name || eligibleLeads[localSendingIndex + 1]?.email || 'Queued')
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
              {/* Manual recipients - hide sent ones */}
              {manualRecipients.map((chip, i) => (
                sentManualIndices.has(i) ? null : (
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
                )
              ))}
              {/* Drip feed recipients - hide sent ones */}
              {recipientChips.map((chip, i) => (
                sentRecipientIndices.has(i) ? null : (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] text-foreground transition-all",
                    localSendingIndex === i
                      ? "bg-cyan-500/20 border-cyan-500/50 animate-pulse"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white", getChipColor(chip.initial))}>
                    {chip.initial}
                  </span>
                  <span className="truncate max-w-[140px]">{chip.label}</span>
                  <X className="w-2.5 h-2.5 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setRemovedLeadEmails(prev => new Set([...prev, (chip.email || '').toLowerCase()]))} />
                </span>
                )
              ))}
              {eligibleLeads.length > 20 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{Math.max(0, eligibleLeads.length - 20 - sentRecipientIndices.size)} more
                </span>
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
            <div className="flex items-center gap-1 pt-1 shrink-0">
              {!showCc && (
                <span
                  className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground px-1 py-0.5 rounded hover:bg-muted transition-colors"
                  onClick={() => setShowCc(true)}
                >
                  Cc
                </span>
              )}
              {!showBcc && (
                <span
                  className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground px-1 py-0.5 rounded hover:bg-muted transition-colors"
                  onClick={() => setShowBcc(true)}
                >
                  Bcc
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cc Field */}
        {showCc && (
          <div className="px-4 py-1.5 border-b border-border/50 shrink-0">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground pt-1 shrink-0">Cc</span>
              <div className="flex-1 flex flex-wrap gap-1 items-center">
                {ccRecipients.map((chip, i) => (
                  <span
                    key={`cc-${i}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] text-foreground"
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-blue-600">
                      {chip.initial}
                    </span>
                    <span className="truncate max-w-[140px]">{chip.label}</span>
                    <X className="w-2.5 h-2.5 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setCcRecipients(prev => prev.filter(r => r.email !== chip.email))} />
                  </span>
                ))}
                <input
                  type="email"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={handleCcKeyDown}
                  onBlur={() => { if (ccInput.trim()) handleAddCcRecipient(ccInput); }}
                  className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 h-6"
                  placeholder="Add Cc…"
                />
              </div>
              <X className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground mt-1.5 shrink-0" onClick={() => { setShowCc(false); setCcRecipients([]); setCcInput(''); }} />
            </div>
          </div>
        )}

        {/* Bcc Field */}
        {showBcc && (
          <div className="px-4 py-1.5 border-b border-border/50 shrink-0">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground pt-1 shrink-0">Bcc</span>
              <div className="flex-1 flex flex-wrap gap-1 items-center">
                {bccRecipients.map((chip, i) => (
                  <span
                    key={`bcc-${i}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-foreground"
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-amber-600">
                      {chip.initial}
                    </span>
                    <span className="truncate max-w-[140px]">{chip.label}</span>
                    <X className="w-2.5 h-2.5 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setBccRecipients(prev => prev.filter(r => r.email !== chip.email))} />
                  </span>
                ))}
                <input
                  type="email"
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                  onKeyDown={handleBccKeyDown}
                  onBlur={() => { if (bccInput.trim()) handleAddBccRecipient(bccInput); }}
                  className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 h-6"
                  placeholder="Add Bcc…"
                />
              </div>
              <X className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground mt-1.5 shrink-0" onClick={() => { setShowBcc(false); setBccRecipients([]); setBccInput(''); }} />
            </div>
          </div>
        )}

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
                  <span className="text-muted-foreground">Queued: <span className="text-foreground font-medium">{eligibleLeads.length + manualRecipients.length}</span></span>
                  <span className="text-muted-foreground">Sent: <span className="text-emerald-400 font-medium">{sentEmailsList.length}</span></span>
                  <span className="text-muted-foreground">Opened: <span className="text-blue-400 font-medium">0</span></span>
                </div>
              </div>
              {sendError && (
                <div className="flex items-center gap-2 p-1.5 rounded bg-destructive/10 border border-destructive/30 text-[10px] mb-1.5">
                  <span className="text-destructive font-medium">⚠ {sendError}</span>
                </div>
              )}
              <div className="space-y-1 overflow-y-auto max-h-20">
                {sentEmailsList.length > 0 && (
                  <div className="flex items-center gap-2 p-1 rounded bg-emerald-500/5 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-muted-foreground">Last Sent:</span>
                    <span className="text-foreground font-medium truncate">{sentEmailsList[sentEmailsList.length - 1]?.name || sentEmailsList[sentEmailsList.length - 1]?.email}</span>
                  </div>
                )}
                {isLaunching && localSendingIndex >= 0 && localSendingIndex < eligibleLeads.length && (
                  <div className="flex items-center gap-2 p-1 rounded bg-amber-500/5 text-[10px]">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
                    <span className="text-muted-foreground">Sending Now:</span>
                    <span className="text-foreground font-medium truncate">{eligibleLeads[localSendingIndex]?.business_name || eligibleLeads[localSendingIndex]?.email}</span>
                  </div>
                )}
                {localSendingIndex >= 0 && localSendingIndex + 1 < eligibleLeads.length && (
                  <div className="flex items-center gap-2 p-1 rounded bg-muted/30 text-[10px]">
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Next:</span>
                    <span className="text-foreground font-medium truncate">{eligibleLeads[localSendingIndex + 1]?.business_name || eligibleLeads[localSendingIndex + 1]?.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Toolbar - Gmail style */}
          <div className="border-t border-border px-3 py-1.5 flex items-center gap-1 shrink-0 bg-card">
            {isLaunching ? (
              <Button
                onClick={() => { pauseRef.current = true; setIsSendingPaused(true); toast.info('Pausing campaign…'); }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 h-10 text-sm font-semibold gap-2"
              >
                <Pause className="w-4 h-4" /> Pause
              </Button>
            ) : isSendingPaused ? (
              <Button
                onClick={() => { setIsSendingPaused(false); pauseRef.current = false; handleLaunch(); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 h-10 text-sm font-semibold gap-2"
              >
                <Play className="w-4 h-4" /> Resume
              </Button>
            ) : (
              <Button
                onClick={handleLaunch}
                disabled={(eligibleLeads.length === 0 && manualRecipients.length === 0)}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-7 h-10 text-sm font-semibold gap-2 shadow-[0_0_16px_hsl(38_92%_50%_/_0.3)] animate-pulse-slow"
              >
                <Send className="w-4 h-4" /> Send
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronDown className="w-3 h-3" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-0.5">
              {[
                { Icon: Bold, color: 'text-blue-400', cmd: 'bold' },
                { Icon: Italic, color: 'text-purple-400', cmd: 'italic' },
                { Icon: Underline, color: 'text-pink-400', cmd: 'underline' },
              ].map(({ Icon, color, cmd }, i) => (
                <Button key={i} variant="ghost" size="icon" className={`h-7 w-7 ${color} hover:brightness-125`}
                  onMouseDown={(e) => { e.preventDefault(); document.execCommand(cmd, false); }}>
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              ))}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:brightness-125"
                onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft', false); }}>
                <AlignLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-teal-400 hover:brightness-125"
                onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-cyan-400 hover:brightness-125"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const url = prompt('Enter URL:');
                  if (url) document.execCommand('createLink', false, url);
                }}>
                <Link2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-yellow-400 hover:brightness-125"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const emojis = ['😊','👋','🔥','⭐','💡','🎯','✅','🚀','💪','❤️'];
                  const pick = emojis[Math.floor(Math.random() * emojis.length)];
                  document.execCommand('insertText', false, pick);
                }}>
                <Smile className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-400 hover:brightness-125"
                onMouseDown={(e) => { e.preventDefault(); toast.info('Attachments coming soon'); }}>
                <Paperclip className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:brightness-125"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (currentHeroImage) {
                    setShowImageSwap(!showImageSwap);
                  } else {
                    const url = prompt('Enter image URL:');
                    if (url) document.execCommand('insertImage', false, url);
                  }
                }}>
                <Image className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Image Swap Panel for Unlimited users */}
            {showImageSwap && currentHeroImage && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-lg border border-border ml-1">
                <span className="text-[9px] text-muted-foreground shrink-0">Swap Hero:</span>
                {getHeroImageChoices('default').map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (bodyHtml) {
                        const updatedHtml = bodyHtml.replace(
                          /<img([^>]*?)src="[^"]*"([^>]*?)\/?>/, 
                          `<img$1src="${imgUrl}"$2/>`
                        );
                        setBodyHtml(updatedHtml);
                        setEmail(prev => ({ ...prev, body: updatedHtml }));
                        setCurrentHeroImage(imgUrl);
                        if (editableRef.current) {
                          editableRef.current.innerHTML = updatedHtml;
                        }
                        // Update stored template
                        try {
                          const stored = localStorage.getItem('bamlead_selected_template');
                          if (stored) {
                            const t = JSON.parse(stored);
                            t.body_html = updatedHtml;
                            localStorage.setItem('bamlead_selected_template', JSON.stringify(t));
                          }
                        } catch {}
                        toast.success('Hero image updated!');
                        setShowImageSwap(false);
                      }
                    }}
                    className={cn(
                      "w-10 h-6 rounded border overflow-hidden transition-all hover:ring-2 hover:ring-primary",
                      currentHeroImage === imgUrl ? "ring-2 ring-primary" : "border-border"
                    )}
                  >
                    <img src={imgUrl} alt={`Option ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    const url = prompt('Enter custom image URL:');
                    if (url && bodyHtml) {
                      const updatedHtml = bodyHtml.replace(
                        /<img([^>]*?)src="[^"]*"([^>]*?)\/?>/, 
                        `<img$1src="${url}"$2/>`
                      );
                      setBodyHtml(updatedHtml);
                      setEmail(prev => ({ ...prev, body: updatedHtml }));
                      setCurrentHeroImage(url);
                      if (editableRef.current) editableRef.current.innerHTML = updatedHtml;
                      toast.success('Custom hero image set!');
                      setShowImageSwap(false);
                    }
                  }}
                  className="w-10 h-6 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center text-[8px] text-muted-foreground hover:bg-muted transition-colors"
                >
                  URL
                </button>
                <X className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setShowImageSwap(false)} />
              </div>
            )}
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
