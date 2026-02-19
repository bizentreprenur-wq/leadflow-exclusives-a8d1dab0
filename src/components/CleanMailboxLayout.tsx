import { useState, useEffect, useMemo } from 'react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Mail, Bot, Send, Flame, Clock, Settings, Play, Pause,
  Inbox, PenTool, Sparkles, Target, Rocket,
  Calendar, Shield, CheckCircle2, X, FolderOpen,
  Palette, Link2, Cloud, BarChart3, MousePointer, Eye, Reply, TrendingUp,
  PanelLeftClose, PanelLeft, MailOpen, Zap, Crown, Layers, Brain
} from 'lucide-react';
import SMTPConfigPanel from './SMTPConfigPanel';
import BrandingSettingsPanel from './BrandingSettingsPanel';
import CloudCRMIntegrationsPanel from './CloudCRMIntegrationsPanel';
import DocumentsPanel from './mailbox/DocumentsPanel';
import AutoCampaignWizard from './AutoCampaignWizard';
import AutoCampaignWizardPro from './AutoCampaignWizardPro';
import ClickHeatmapChart from './ClickHeatmapChart';
import ABTestingChart from './ABTestingChart';
import AIAutopilotSubscription from './AIAutopilotSubscription';
import ScheduledQueuePanel from './ScheduledQueuePanel';
import EmailPerformanceReport from './EmailPerformanceReport';
import LeadQueueIndicator from './LeadQueueIndicator';
import CampaignPerformanceDashboard from './CampaignPerformanceDashboard';
import ComposeEmailModal from './ComposeEmailModal';
import InlineComposePanel from './InlineComposePanel';
import EmailABTestingSystem from './EmailABTestingSystem';
import LeadResponseDetection from './LeadResponseDetection';
import EmailSequenceSelector from './EmailSequenceSelector';
import AISequenceRecommendationEngine from './AISequenceRecommendationEngine';
import AIAutopilotDashboard from './AIAutopilotDashboard';
import SequencePreviewModal from './SequencePreviewModal';
import ConversionFunnelDashboard from './ConversionFunnelDashboard';
import AIStrategySelector from './AIStrategySelector';
import { EmailSequence } from '@/lib/emailSequences';
import { updateAutopilotCampaign } from '@/lib/autopilotCampaign';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';
import { 
  AIStrategy, 
  saveSelectedStrategy, 
  getPersistedStrategy,
  getAutonomousSequencesForStrategy 
} from '@/lib/aiStrategyEngine';
import { AutonomousSequence } from '@/lib/autonomousSequences';

// Tab types for main navigation
type MainTab = 'inbox' | 'campaigns' | 'sequences' | 'automation' | 'analytics' | 'documents' | 'settings' | 'strategy';
type InboxFilter = 'all' | 'hot' | 'unread';

// Demo sequence types
interface OutreachSequence {
  id: string;
  name: string;
  channels: ('email' | 'linkedin' | 'sms')[];
  steps: number;
  duration: string;
  status: 'active' | 'paused' | 'draft';
}

// Demo email reply
interface EmailReply {
  id: string;
  from_name: string;
  from_email: string;
  subject: string;
  preview: string;
  body?: string;
  time: string;
  urgencyLevel: 'hot' | 'warm' | 'cold';
  isRead: boolean;
  hasDocument?: boolean;
}

// AI Automation Settings
interface AutomationSettings {
  doneForYouMode: boolean;
  autoFollowUps: boolean;
  responseMode: 'automatic' | 'manual';
}

const DEMO_SEQUENCES: OutreachSequence[] = [];

const DEMO_REPLIES: EmailReply[] = [];

const INBOX_STORAGE_KEY = 'bamlead_inbox_replies';

interface CleanMailboxLayoutProps {
  searchType?: 'gmb' | 'platform' | null;
  campaignContext?: {
    isActive: boolean;
    sentCount: number;
    totalLeads: number;
  };
}

export default function CleanMailboxLayout({ searchType, campaignContext }: CleanMailboxLayoutProps) {
  const { isUnlimited } = usePlanFeatures();
  const [mainTab, setMainTab] = useState<MainTab>('inbox');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [replies, setReplies] = useState<EmailReply[]>(() => {
    if (typeof window === 'undefined') return DEMO_REPLIES;
    try {
      const stored = localStorage.getItem(INBOX_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((reply: EmailReply, idx: number) => ({
            ...reply,
            id: reply.id || String(idx + 1),
            isRead: Boolean(reply.isRead),
            urgencyLevel: reply.urgencyLevel || 'cold',
          }));
        }
      }
    } catch {
      // ignore
    }
    return DEMO_REPLIES;
  });
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showInlineCompose, setShowInlineCompose] = useState(false);
  const [showAutopilotSubscription, setShowAutopilotSubscription] = useState(false);
  const [composeInitialEmail, setComposeInitialEmail] = useState<{
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  const [sequences, setSequences] = useState<OutreachSequence[]>(DEMO_SEQUENCES);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mailboxSidebarWidth, setMailboxSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('bamlead_mailbox_sidebar_width');
      const parsed = saved ? parseFloat(saved) : NaN;
      if (!Number.isNaN(parsed)) return parsed;
    } catch {
      // ignore
    }
    return 280;
  });
  const [isMailboxSidebarResizing, setIsMailboxSidebarResizing] = useState(false);
  const [selectedEmailSequence, setSelectedEmailSequence] = useState<EmailSequence | null>(null);
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
  
  // Load persisted strategy on mount
  const [selectedStrategy, setSelectedStrategy] = useState<AIStrategy | null>(() => {
    try {
      return getPersistedStrategy();
    } catch {
      return null;
    }
  });
  
  // Connected autonomous sequences based on selected strategy
  const [autonomousSequences, setAutonomousSequences] = useState<AutonomousSequence[]>([]);
  
  // Update autonomous sequences when strategy changes
  useEffect(() => {
    if (selectedStrategy) {
      const sequences = getAutonomousSequencesForStrategy(selectedStrategy);
      setAutonomousSequences(sequences);
      // Persist the selected strategy
      saveSelectedStrategy(selectedStrategy);
    }
  }, [selectedStrategy]);
  
  // Email preview panel width (right side resizable)
  const [emailPreviewWidth, setEmailPreviewWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('bamlead_email_preview_width');
      const parsed = saved ? parseFloat(saved) : NaN;
      if (!Number.isNaN(parsed)) return parsed;
    } catch {
      // ignore
    }
    return 450;
  });
  const [isEmailPreviewResizing, setIsEmailPreviewResizing] = useState(false);
  const { status: trialStatus, startTrial, TRIAL_DURATION_DAYS } = useAutopilotTrial();

  const clampMailboxSidebarWidth = (w: number) => Math.max(220, Math.min(520, w));

  const handleMailboxSidebarResizeStart = (e: React.PointerEvent) => {
    if (sidebarCollapsed) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startW = mailboxSidebarWidth;
    let latestW = mailboxSidebarWidth;
    setIsMailboxSidebarResizing(true);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      latestW = clampMailboxSidebarWidth(startW + (ev.clientX - startX));
      setMailboxSidebarWidth(latestW);
    };

    const onUp = (ev: PointerEvent) => {
      try {
        localStorage.setItem('bamlead_mailbox_sidebar_width', String(latestW));
      } catch {
        // ignore
      }
      setIsMailboxSidebarResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  
  // AI Automation settings
  const [automation, setAutomation] = useState<AutomationSettings>(() => {
    try {
      const saved = localStorage.getItem('bamlead_automation_settings');
      return saved ? JSON.parse(saved) : { doneForYouMode: false, autoFollowUps: true, responseMode: 'manual' };
    } catch { return { doneForYouMode: false, autoFollowUps: true, responseMode: 'manual' }; }
  });

  // Lead queue tracking for Compose modal display
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [lastSentLeadIndex, setLastSentLeadIndex] = useState(-1);
  
  // Campaign Wizard state
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [leadPriority, setLeadPriority] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [showSequenceBrowser, setShowSequenceBrowser] = useState(false);
  const [showSequencePreview, setShowSequencePreview] = useState(false);
  const [previewSequence, setPreviewSequence] = useState<EmailSequence | null>(null);
  
  const readStoredEmailLeads = () => {
    if (typeof window === 'undefined') return [] as any[];
    const read = (storage: Storage) => {
      try {
        const searchRaw = storage.getItem('bamlead_search_results');
        const searchParsed = searchRaw ? JSON.parse(searchRaw) : [];
        if (Array.isArray(searchParsed) && searchParsed.length) {
          return searchParsed.map((lead: any) => ({
            id: lead.id ?? lead.lead_id,
            email: lead.email || '',
            business_name: lead.business_name || lead.name || 'Unknown',
            name: lead.name || lead.business_name || 'Unknown',
            contact_name: lead.contact_name,
            first_name: lead.first_name,
            industry: lead.industry,
            website: lead.website,
            aiClassification: lead.aiClassification,
            leadScore: lead.leadScore,
            websiteIssues: lead.websiteIssues,
            phone: lead.phone,
            // Step 2 Analysis fields - passed to email campaigns
            websiteAnalysis: lead.websiteAnalysis || lead.website_analysis,
            painPoints: lead.painPoints || lead.pain_points,
            talkingPoints: lead.talkingPoints || lead.talking_points,
            aiInsights: lead.aiInsights || lead.ai_insights,
            recommendedApproach: lead.recommendedApproach || lead.recommended_approach,
            urgency: lead.urgency,
            successProbability: lead.successProbability || lead.success_probability,
          }));
        }
        const raw = storage.getItem('bamlead_email_leads');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [] as any[];
      }
    };

    const fromSession = read(sessionStorage);
    if (fromSession.length) return fromSession;
    return read(localStorage);
  };

  // Load leads from sessionStorage (Step 3) with localStorage fallback
  const [campaignLeads, setCampaignLeads] = useState<any[]>(readStoredEmailLeads);

  // Keep mailbox in sync when Step 3 updates lead selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setCampaignLeads(readStoredEmailLeads());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    sync();
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open compose modal when coming from AI verification
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const autoOpen = sessionStorage.getItem('bamlead_auto_open_compose');
    if (autoOpen === 'true') {
      sessionStorage.removeItem('bamlead_auto_open_compose');
      setTimeout(() => {
        if (isUnlimited) {
          setShowInlineCompose(true);
        } else {
          setShowComposeModal(true);
        }
      }, 100);
    }
  }, []);

  const activeLeadEmail = useMemo(() => {
    if (selectedReply?.from_email) return selectedReply.from_email;
    if (typeof window !== 'undefined') {
      const explicit =
        sessionStorage.getItem('bamlead_active_lead_email') ||
        localStorage.getItem('bamlead_active_lead_email');
      if (explicit) return explicit;
    }
    const firstWithEmail = campaignLeads.find((l: any) => l?.email);
    return (firstWithEmail?.email || campaignLeads?.[0]?.email || '') as string;
  }, [campaignLeads, selectedReply]);

  // Campaign analytics state - sync from localStorage (no fake data)
  const [campaignAnalytics, setCampaignAnalytics] = useState(() => {
    try {
      const stored = localStorage.getItem('bamlead_campaign_analytics');
      return stored ? JSON.parse(stored) : {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
      };
    } catch { 
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0 }; 
    }
  });

  const campaignStats = useMemo(() => {
    const sent = Math.max(0, campaignAnalytics.sent || 0);
    const delivered = Math.max(0, Math.min(sent, campaignAnalytics.delivered || 0));
    const opened = Math.max(0, Math.min(delivered, campaignAnalytics.opened || 0));
    const clicked = Math.max(0, Math.min(opened, campaignAnalytics.clicked || 0));
    const replied = Math.max(0, Math.min(clicked, campaignAnalytics.replied || 0));
    return {
      sent,
      delivered,
      opened,
      clicked,
      replied,
      bounced: Math.max(0, sent - delivered),
      unsubscribed: 0,
      meetingsBooked: 0,
      dealsClosed: 0,
    };
  }, [campaignAnalytics]);

  // Sync campaign context from Step 3
  useEffect(() => {
    if (campaignContext?.isActive) {
      setCampaignAnalytics(prev => ({
        ...prev,
        sent: campaignContext.sentCount,
        delivered: Math.floor(campaignContext.sentCount * 0.95),
        opened: Math.floor(campaignContext.sentCount * 0.42),
        clicked: Math.floor(campaignContext.sentCount * 0.18),
        replied: Math.floor(campaignContext.sentCount * 0.08),
      }));
    }
  }, [campaignContext]);

  // Handler to open compose with document content
  const handleUseDocumentInEmail = (doc: any) => {
    setComposeInitialEmail({
      to: activeLeadEmail,
      subject: doc?.name ? `Document: ${doc.name}` : 'Document',
      body: doc?.fullContent || '',
    });
    setShowComposeModal(true);
    setMainTab('inbox');
  };

  const openCompose = (initial?: { to: string; subject: string; body: string }) => {
    setComposeInitialEmail(initial || null);
    if (isUnlimited) {
      setShowInlineCompose(true);
    } else {
      setShowComposeModal(true);
    }
  };

  const formatForwardBody = (reply: EmailReply) => {
    const headerLines = [
      '--- Forwarded message ---',
      `From: ${reply.from_name} <${reply.from_email}>`,
      `Date: ${reply.time}`,
      `Subject: ${reply.subject}`,
      '',
    ];
    return `${headerLines.join('\n')}\n${reply.body || reply.preview || ''}`;
  };

  const selectReply = (reply: EmailReply) => {
    const updated = replies.map(r => 
      r.id === reply.id ? { ...r, isRead: true } : r
    );
    setReplies(updated);
    const selected = updated.find(r => r.id === reply.id) || null;
    setSelectedReply(selected);
  };

  const pauseAutopilotCampaign = () => {
    updateAutopilotCampaign({ status: 'paused' });
    try {
      const raw = localStorage.getItem('bamlead_drip_active');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      localStorage.setItem('bamlead_drip_active', JSON.stringify({
        ...parsed,
        active: false,
        autopilot: false,
        pausedAt: new Date().toISOString(),
      }));
    } catch {
      // ignore
    }
  };

  const enableAutopilot = () => {
    setAutomation(prev => ({
      ...prev,
      doneForYouMode: true,
      responseMode: 'automatic',
      autoFollowUps: true,
    }));
    setMainTab('automation');
  };

  const disableAutopilot = () => {
    setAutomation(prev => ({
      ...prev,
      doneForYouMode: false,
      responseMode: 'manual',
    }));
    pauseAutopilotCampaign();
  };

  const handleAutopilotToggle = (next: boolean) => {
    if (next) {
      if (trialStatus.canUseAutopilot) {
        enableAutopilot();
        if (trialStatus.isTrialActive && !trialStatus.isPaid) {
          toast.success(`🤖 AI Autopilot enabled! ${trialStatus.trialDaysRemaining} days left in trial.`);
        } else {
          toast.success('🤖 AI Autopilot enabled.');
        }
        return;
      }

      if (!trialStatus.hasStartedTrial && !trialStatus.isExpired) {
        const started = startTrial();
        if (started) {
          enableAutopilot();
          toast.success(`🚀 ${TRIAL_DURATION_DAYS}-day AI Autopilot trial started!`);
          return;
        }
      }

      disableAutopilot();
      setShowAutopilotSubscription(true);
      toast.error(
        trialStatus.isExpired
          ? 'Your AI Autopilot trial has expired. Please subscribe to continue.'
          : 'AI Autopilot requires a trial or subscription.'
      );
      return;
    }

    if (automation.doneForYouMode) {
      disableAutopilot();
      toast.info('👤 Switched to Manual Mode. AI Autopilot paused.');
    }
  };

  useEffect(() => {
    localStorage.setItem('bamlead_automation_settings', JSON.stringify(automation));
  }, [automation]);

  useEffect(() => {
    try {
      localStorage.setItem('bamlead_campaign_analytics', JSON.stringify(campaignAnalytics));
    } catch {
      // ignore
    }
  }, [campaignAnalytics]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(replies));
    } catch {
      // ignore
    }
  }, [replies]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      try {
        const stored = localStorage.getItem(INBOX_STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return;
        const normalized = parsed.map((reply: EmailReply, idx: number) => ({
          ...reply,
          id: reply.id || String(idx + 1),
          isRead: Boolean(reply.isRead),
          urgencyLevel: reply.urgencyLevel || 'cold',
        }));
        setReplies(normalized);
        if (selectedReply) {
          const refreshed = normalized.find(r => r.id === selectedReply.id) || null;
          setSelectedReply(refreshed);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, [selectedReply]);

  useEffect(() => {
    if (automation.doneForYouMode && !trialStatus.canUseAutopilot) {
      disableAutopilot();
      toast.error('AI Autopilot disabled because your trial expired.');
    }
  }, [automation.doneForYouMode, trialStatus.canUseAutopilot]);

  // Filter replies
  const filteredReplies = replies.filter(r => {
    if (inboxFilter === 'hot') return r.urgencyLevel === 'hot';
    if (inboxFilter === 'unread') return !r.isRead;
    return true;
  });

  // Start/pause campaign
  const toggleCampaign = (sequenceId: string) => {
    setSequences(prev => prev.map(s => 
      s.id === sequenceId 
        ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
        : s
    ));
    toast.success('Campaign status updated');
  };

  // Main navigation tabs — hide items that live inside the Unlimited inline compose panel
  const navTabs = [
    { id: 'inbox' as MainTab, label: 'Inbox', icon: Inbox },
    { id: 'campaigns' as MainTab, label: 'Campaigns', icon: Send },
    ...(!isUnlimited ? [{ id: 'sequences' as MainTab, label: 'Sequences', icon: Layers }] : []),
    ...(!isUnlimited ? [{ id: 'strategy' as MainTab, label: 'AI Strategy', icon: Brain, isBrain: true }] : []),
    ...(!isUnlimited ? [{ id: 'automation' as MainTab, label: 'AI Autopilot', icon: Crown, isPro: true }] : []),
    { id: 'analytics' as MainTab, label: 'Analytics', icon: BarChart3 },
    { id: 'documents' as MainTab, label: 'PreDone Docs', icon: FolderOpen },
    { id: 'settings' as MainTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="relative w-full h-full flex bg-background">
      {/* COLLAPSIBLE LEFT SIDEBAR */}
      <AnimatePresence mode="wait">
        {!sidebarCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: mailboxSidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={isMailboxSidebarResizing ? { duration: 0 } : { duration: 0.2 }}
            className="h-full border-r border-border bg-card flex flex-col overflow-hidden"
            style={{ width: mailboxSidebarWidth }}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-foreground">BamLead</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarCollapsed(true)}
                className="h-8 w-8"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>

            {/* Compose Button */}
            <div className="p-4 space-y-2">
              <Button
                onClick={() => openCompose()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                <PenTool className="w-4 h-4" />
                Compose
              </Button>
              <Button
                onClick={() => setShowSequenceBrowser(true)}
                variant="outline"
                className="w-full gap-2 text-xs"
              >
                <Layers className="w-4 h-4" />
                Browse Sequences
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
               {navTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    mainTab === tab.id
                      ? tab.id === 'automation' 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                        : tab.id === 'strategy'
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20"
                        : "bg-emerald-600 text-white"
                      : tab.id === 'automation'
                        ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30"
                        : tab.id === 'strategy'
                        ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", 
                    tab.id === 'automation' && mainTab !== 'automation' && "text-amber-400",
                    tab.id === 'strategy' && mainTab !== 'strategy' && "text-purple-400"
                  )} />
                  {tab.label}
                  {tab.id === 'inbox' && (
                    <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5">
                      {replies.filter(r => !r.isRead).length}
                    </Badge>
                  )}
                  {tab.id === 'automation' && isUnlimited && (
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[8px] px-1.5">
                      Active
                    </Badge>
                  )}
                  {(tab as any).isPro && (
                    <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] px-1.5 border-0">
                      PRO
                    </Badge>
                  )}
                </button>
              ))}
            </nav>

            {/* AI Autopilot Mode Indicator - Yellow Theme */}
            <div className="p-4 border-t border-border">
              <div className={cn(
                "p-3 rounded-lg border-2 transition-all",
                automation.doneForYouMode 
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10" 
                  : "bg-muted/30 border-border"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className={cn("w-4 h-4", automation.doneForYouMode ? "text-amber-400" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-semibold", automation.doneForYouMode ? "text-amber-400" : "text-foreground")}>
                      {automation.doneForYouMode ? (isUnlimited ? 'Unlimited Mode' : 'AI Autopilot') : 'Manual Mode'}
                    </span>
                  </div>
                  <Switch
                    checked={automation.doneForYouMode}
                    onCheckedChange={handleAutopilotToggle}
                    className="data-[state=checked]:bg-amber-500 scale-75"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {automation.doneForYouMode 
                    ? 'AI handles Drip → Follow-ups → Responses' 
                    : 'You control all outreach'}
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar resize handle (desktop) */}
      {!sidebarCollapsed && (
        <div
          onPointerDown={handleMailboxSidebarResizeStart}
          className="relative hidden md:flex w-2 items-stretch justify-center cursor-col-resize select-none"
          aria-label="Resize mailbox sidebar"
          role="separator"
        >
          <div className="w-px bg-border" />
          <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2" />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-card border-b border-border px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Collapse toggle + current tab */}
            <div className="flex items-center gap-3">
              {sidebarCollapsed && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-8 w-8"
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              )}
              <h1 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
                {navTabs.find(t => t.id === mainTab)?.icon && (
                  <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    {(() => {
                      const Icon = navTabs.find(t => t.id === mainTab)?.icon || Inbox;
                      return <Icon className="w-3.5 h-3.5 text-primary" />;
                    })()}
                  </span>
                )}
                {mainTab}
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {campaignContext?.isActive && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Campaign Active
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-3 py-1",
                  automation.doneForYouMode 
                    ? "border-emerald-500/50 text-emerald-400" 
                    : "border-border text-muted-foreground"
                )}
              >
                {automation.doneForYouMode ? '🤖 Auto' : '👤 Manual'}
              </Badge>
            </div>
          </div>
        </header>

        {/* GMAIL-STYLE POP-OUT COMPOSE - bottom-right, non-blocking */}
        {showInlineCompose && (
          <div className="fixed bottom-0 right-6 z-[100] w-[520px] h-[520px] rounded-t-xl border border-border shadow-2xl bg-background overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 flex flex-col">
            <InlineComposePanel
              leads={campaignLeads}
              currentLeadIndex={currentLeadIndex}
              lastSentIndex={lastSentLeadIndex}
              onLeadIndexChange={setCurrentLeadIndex}
              onEmailSent={(idx) => {
                setLastSentLeadIndex(idx);
                setCampaignAnalytics(prev => ({
                  ...prev,
                  sent: prev.sent + 1,
                  delivered: prev.delivered + 1,
                }));
              }}
              onClose={() => setShowInlineCompose(false)}
              automationSettings={automation}
              onAutomationChange={setAutomation}
              searchType={searchType}
            />
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden">
          <>
          {/* INBOX VIEW */}
          {mainTab === 'inbox' && (
            <div className="h-full flex">
              {/* Email List Panel */}
              <div className={cn(
                "border-r border-border flex flex-col bg-card transition-all",
                sidebarCollapsed ? "w-80" : "w-72"
              )}>
                {/* Inbox Banner */}
                <div className="p-3 bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>This inbox shows replies only.</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">Campaigns run in the background.</p>
                </div>

                {/* Filters */}
                <div className="p-3 border-b border-border/50 flex gap-2">
                  {(['all', 'hot', 'unread'] as InboxFilter[]).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setInboxFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-all capitalize",
                        inboxFilter === filter
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter === 'all' ? 'All Replies' : filter}
                    </button>
                  ))}
                </div>

                {/* Email List */}
                <ScrollArea className="flex-1">
                  {filteredReplies.map(reply => (
                    <button
                      key={reply.id}
                      onClick={() => selectReply(reply)}
                      className={cn(
                        "w-full text-left p-4 border-b border-border/40 hover:bg-muted/30 transition-colors",
                        selectedReply?.id === reply.id && "bg-muted/50",
                        !reply.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          reply.urgencyLevel === 'hot' ? "bg-red-500" :
                          reply.urgencyLevel === 'warm' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "text-sm truncate",
                              !reply.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                            )}>
                              {reply.from_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                              {reply.time?.split(' ')[0] || reply.time}
                            </span>
                          </div>
                          <p className="text-xs text-foreground truncate mb-0.5">{reply.subject}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{reply.preview || reply.body || ''}</p>
                          <Badge 
                            className={cn(
                              "mt-2 text-[9px] px-1.5 py-0",
                              reply.urgencyLevel === 'hot' 
                                ? "bg-red-500/20 text-red-400 border-red-500/30" 
                                : reply.urgencyLevel === 'warm'
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            )}
                          >
                            {reply.urgencyLevel}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </div>

              {/* Resizable handle for email preview panel */}
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startW = emailPreviewWidth;
                  let latestW = emailPreviewWidth;
                  setIsEmailPreviewResizing(true);
                  const target = e.currentTarget as HTMLElement;
                  target.setPointerCapture(e.pointerId);
                  
                  const onMove = (ev: PointerEvent) => {
                    // Moving left increases width, moving right decreases
                    latestW = Math.max(300, Math.min(800, startW - (ev.clientX - startX)));
                    setEmailPreviewWidth(latestW);
                  };
                  
                  const onUp = () => {
                    try {
                      localStorage.setItem('bamlead_email_preview_width', String(latestW));
                    } catch { /* ignore */ }
                    setIsEmailPreviewResizing(false);
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                    try {
                      target.releasePointerCapture(e.pointerId);
                    } catch { /* ignore */ }
                  };
                  
                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                }}
                className="relative hidden md:flex w-2 items-stretch justify-center cursor-col-resize select-none hover:bg-primary/20 transition-colors"
                aria-label="Resize email preview panel"
                role="separator"
              >
                <div className="w-px bg-border" />
                <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2" />
              </div>

              {/* Email Preview / Empty State - NOW RESIZABLE */}
              <div 
                className="flex items-center justify-center bg-background transition-all"
                style={{ width: emailPreviewWidth }}
              >
                {selectedReply ? (
                  <div className="w-full h-full p-8 overflow-auto">
                    <div className="rounded-2xl border border-border bg-card p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                          selectedReply.urgencyLevel === 'hot' ? "bg-red-500" :
                          selectedReply.urgencyLevel === 'warm' ? "bg-amber-500" : "bg-blue-500"
                        )}>
                          {selectedReply.from_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{selectedReply.from_name}</p>
                          <p className="text-xs text-muted-foreground">{selectedReply.from_email}</p>
                        </div>
                        <Badge className="ml-auto" variant="outline">
                          {selectedReply.time}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-4">{selectedReply.subject}</h2>
                      <Separator className="my-4" />
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {selectedReply.body || selectedReply.preview || 'No message content available.'}
                      </p>
                      <div className="mt-6 flex gap-2">
                        <Button
                          onClick={() =>
                            openCompose({
                              to: selectedReply.from_email,
                              subject: selectedReply.subject ? `Re: ${selectedReply.subject}` : 'Re:',
                              body: '',
                            })
                          }
                          className="gap-2"
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            openCompose({
                              to: '',
                              subject: selectedReply.subject ? `Fwd: ${selectedReply.subject}` : 'Fwd:',
                              body: formatForwardBody(selectedReply),
                            })
                          }
                        >
                          Forward
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md px-6 text-center">
                    <div className="rounded-2xl border border-border bg-card p-10">
                      <MailOpen className="w-16 h-16 text-muted-foreground/60 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Select an email to view</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Replies show here. Campaigns and AI send messages in the background.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI AUTOMATION VIEW - BOLD AI AUTOPILOT CAMPAIGN PRO */}
          {mainTab === 'automation' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-5xl mx-auto">
                <Tabs defaultValue="dashboard" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="dashboard" className="gap-2">
                      <Bot className="w-4 h-4" />
                      Autopilot Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="wizard" className="gap-2">
                      <Zap className="w-4 h-4" />
                      Launch Campaign
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="dashboard">
                    <AIAutopilotDashboard
                      searchType={searchType}
                      onViewLead={(lead) => {
                        toast.info(`Viewing ${lead.businessName}`);
                      }}
                      onPauseLead={(leadId) => {
                        toast.success('Lead paused');
                      }}
                      onResumeLead={(leadId) => {
                        toast.success('Lead resumed');
                      }}
                      onSendProposal={(leadId) => {
                        setMainTab('documents');
                        toast.success('Opening PreDone Documents to send proposal');
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="wizard">
                    <AutoCampaignWizardPro
                      leads={campaignLeads}
                      searchType={searchType || null}
                      isEmbedded={true}
                      onActivate={() => {
                        setAutomation(prev => ({ ...prev, doneForYouMode: true }));
                        toast.success('🤖 AI Autopilot Campaign activated!');
                      }}
                      onClose={() => setMainTab('inbox')}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {/* CAMPAIGNS VIEW (Manual) */}
          {mainTab === 'campaigns' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* ==================== AI STRATEGY SECTION - THE BRAIN ==================== */}
                <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
                  {/* Header */}
                  <div className="p-6 text-center border-b border-slate-700">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-7 h-7 text-teal-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Review Your AI Strategy</h2>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                      Intelligent outreach paths tailored to your leads and selected template
                    </p>
                    <Badge className="mt-3 bg-teal-500/20 text-teal-400 border-teal-500/30 gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Powered by AI
                    </Badge>
                  </div>
                  
                  {/* Strategy Content */}
                  <div className="p-4">
                    {selectedStrategy ? (
                      <div className="space-y-4">
                        {/* Active Strategy Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/30">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl">{selectedStrategy.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{selectedStrategy.name}</h4>
                                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-[9px]">
                                  Active Strategy
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">{selectedStrategy.description}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                              <span className="text-slate-500">Expected Response</span>
                              <p className="font-medium text-emerald-400">{selectedStrategy.expectedResponseRate}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                              <span className="text-slate-500">Urgency Level</span>
                              <p className="font-medium text-amber-400 capitalize">{selectedStrategy.urgencyLevel}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-[10px] font-medium text-slate-500 mb-1.5">AI Reasoning</p>
                            <ul className="text-[10px] text-slate-400 space-y-0.5">
                              {selectedStrategy.aiReasoning.slice(0, 3).map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0 mt-0.5" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {/* Connected 7-Step Autonomous Sequences */}
                        {autonomousSequences.length > 0 && (
                          <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
                            <div className="p-3 border-b border-slate-700">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-white">Connected 7-Step Sequences</span>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                                  Autopilot Ready
                                </Badge>
                              </div>
                            </div>
                            <div className="p-3 space-y-2">
                              {autonomousSequences.map((seq) => (
                                <div 
                                  key={seq.id}
                                  className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-amber-500/30 transition-all"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{seq.icon}</span>
                                      <span className="text-sm font-medium text-white">{seq.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] text-slate-300 border-slate-600">
                                      {seq.steps.length} emails
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mb-2">{seq.description}</p>
                                  
                                  {/* Mini sequence preview */}
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {seq.steps.slice(0, 7).map((step, idx) => (
                                      <div 
                                        key={idx}
                                        className="flex items-center gap-1"
                                      >
                                        <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-[8px] font-medium text-teal-400">
                                          {step.day}
                                        </div>
                                        {idx < seq.steps.length - 1 && idx < 6 && (
                                          <div className="w-3 h-px bg-slate-600" />
                                        )}
                                      </div>
                                    ))}
                                    <span className="text-[9px] text-slate-500 ml-1">days</span>
                                  </div>
                                  
                                  {/* Expected response day */}
                                  <div className="mt-2 pt-2 border-t border-slate-700">
                                    <p className="text-[9px] text-slate-500">
                                      <TrendingUp className="w-3 h-3 inline mr-1 text-emerald-400" />
                                      Typical response: Day {seq.expectedResponseDay}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStrategyPanel(true)}
                          className="w-full border-teal-500/30 text-teal-400 hover:bg-teal-500/10 gap-2"
                        >
                          <Bot className="w-4 h-4" />
                          Change Strategy
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-slate-400 text-sm mb-4">No strategy selected yet. Choose a strategy to power your campaigns.</p>
                        <AIStrategySelector
                          mode="basic"
                          searchType={searchType || 'gmb'}
                          leads={campaignLeads}
                          selectedStrategy={selectedStrategy}
                          onSelectStrategy={(strategy) => {
                            setSelectedStrategy(strategy);
                            toast.success(`Strategy selected: ${strategy.name}`);
                          }}
                          compact
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Header with Create Campaign Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">Campaigns</h2>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">Manual</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">You control these campaigns.</p>
                  </div>
                  <Button 
                    onClick={() => setShowCampaignWizard(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    Create Campaign
                  </Button>
                </div>

                {/* Lead Queue Indicator - Last Sent / Current / Up Next */}
                {campaignLeads.length > 0 && (
                  <LeadQueueIndicator
                    leads={campaignLeads}
                    currentIndex={currentLeadIndex}
                    lastSentIndex={lastSentLeadIndex}
                    variant="horizontal"
                  />
                )}

                {/* Lead Priority Filter */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Filter by Lead Priority</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {campaignLeads.filter(l => 
                        leadPriority === 'all' ? true : 
                        (l.aiClassification || 'cold') === leadPriority
                      ).length} leads
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'All Leads', color: 'bg-primary/20 text-primary border-primary/30' },
                      { value: 'hot', label: '🔥 Hot', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                      { value: 'warm', label: '🌡️ Warm', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                      { value: 'cold', label: '❄️ Cold', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                    ].map(opt => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={leadPriority === opt.value ? "default" : "outline"}
                        onClick={() => setLeadPriority(opt.value as any)}
                        className={cn(
                          "text-xs",
                          leadPriority === opt.value 
                            ? opt.color
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Campaign Performance Dashboard */}
                <CampaignPerformanceDashboard stats={campaignStats} />

                {/* Click Heatmap Visualization */}
                <ClickHeatmapChart />

                {/* A/B Testing Chart */}
                <ABTestingChart />

                {/* Campaign Cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Active Sequences</h3>
                  {sequences.map(seq => (
                    <div key={seq.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{seq.name}</h4>
                            {seq.status === 'active' && (
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {seq.channels.map(ch => (
                              <span key={ch} className="px-2 py-0.5 rounded bg-muted border border-border capitalize">{ch}</span>
                            ))}
                            <span>•</span>
                            <span>Steps: {seq.steps}</span>
                            <span>•</span>
                            <span>Duration: {seq.duration}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => toggleCampaign(seq.id)}
                          size="sm"
                          className={cn(
                            "gap-2",
                            seq.status === 'active'
                              ? "bg-amber-600 hover:bg-amber-500 text-white"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          )}
                        >
                          {seq.status === 'active' ? (
                            <><Pause className="w-3.5 h-3.5" /> Pause</>
                          ) : (
                            <><Play className="w-3.5 h-3.5" /> Start</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scheduled Queue Panel */}
                <ScheduledQueuePanel />
              </div>
            </div>
          )}

          {/* SEQUENCES VIEW - AI Recommendation Engine */}
          {mainTab === 'sequences' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">Email Sequences</h2>
                      <Badge variant="outline" className={cn(
                        "text-xs gap-1.5",
                        searchType === 'gmb' 
                          ? "border-emerald-500/30 text-emerald-400" 
                          : "border-violet-500/30 text-violet-400"
                      )}>
                        {searchType === 'gmb' ? '🤖 Super AI Business Search' : '🎯 Agency Lead Finder'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchType === 'gmb' 
                        ? 'AI-powered sequences for insight-driven niche selling' 
                        : 'Revenue-focused sequences for agency services'}
                    </p>
                  </div>
                  {selectedEmailSequence && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-2">
                      <CheckCircle2 className="w-3 h-3" />
                      {selectedEmailSequence.name} Selected
                    </Badge>
                  )}
                </div>

                {/* AI Sequence Recommendation Engine - Campaign Mode */}
                <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    For Co-Pilot Campaigns
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowStrategyPanel(true)}
                      className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Strategy
                    </Button>
                    {selectedEmailSequence && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPreviewSequence(selectedEmailSequence);
                          setShowSequencePreview(true);
                        }}
                        className="gap-1 text-xs"
                      >
                        <Eye className="w-3 h-3" />
                        Preview Sequence
                      </Button>
                    )}
                  </div>
                </div>
                  <AISequenceRecommendationEngine
                    searchType={searchType}
                    mode="campaign"
                    onSelectSequence={(seq) => {
                      setSelectedEmailSequence(seq);
                      setPreviewSequence(seq);
                      setShowSequencePreview(true);
                    }}
                  />
                </div>

                <Separator className="my-6" />

                {/* AI Sequence Recommendation Engine - Autopilot Mode */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    For AI Autopilot
                  </h3>
                  <AISequenceRecommendationEngine
                    searchType={searchType}
                    mode="autopilot"
                    onSelectSequence={(seq) => {
                      setSelectedEmailSequence(seq);
                      setPreviewSequence(seq);
                      setShowSequencePreview(true);
                    }}
                    onStartAutopilot={(seq, leads) => {
                      toast.success(`AI Autopilot started with "${seq.name}" for ${leads.length} leads`);
                      setMainTab('automation');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI STRATEGY VIEW (The Brain) */}
          {mainTab === 'strategy' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">AI Strategy Brain</h2>
                    <p className="text-sm text-muted-foreground">Your campaign intelligence engine — selects strategies, sequences & personalization</p>
                  </div>
                </div>
                <AIStrategySelector
                  mode="copilot"
                  searchType={searchType || 'gmb'}
                  leads={campaignLeads}
                  onSelectStrategy={(strategy) => {
                    setSelectedStrategy(strategy);
                    toast.success(`Strategy "${strategy.name}" activated in the Brain`);
                  }}
                  onApproveStrategy={(strategy) => {
                    setSelectedStrategy(strategy);
                    setMainTab('inbox');
                    openCompose();
                  }}
                  selectedStrategy={selectedStrategy}
                />
                {selectedStrategy && autonomousSequences.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Connected Drip Sequences ({autonomousSequences.length} steps)
                    </h3>
                    <div className="space-y-2">
                      {autonomousSequences.map((seq, i) => (
                        <div key={seq.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                          <span className="text-xs font-bold text-muted-foreground w-6">#{i+1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{seq.name}</p>
                            <p className="text-xs text-muted-foreground">{seq.steps.length} steps • {seq.trigger}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {mainTab === 'analytics' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                <ConversionFunnelDashboard searchType={searchType} analytics={campaignStats} />
                
                {/* Email Performance Report with PDF Export */}
                <EmailPerformanceReport 
                  campaignName="Current Campaign"
                  stats={campaignStats}
                  leadsByPriority={{
                    hot: campaignLeads.filter(l => l?.aiClassification === 'hot').length,
                    warm: campaignLeads.filter(l => l?.aiClassification === 'warm').length,
                    cold: campaignLeads.filter(l => l?.aiClassification === 'cold' || !l?.aiClassification).length,
                  }}
                />
              </div>
            </div>
          )}

          {/* DOCUMENTS VIEW */}
          {mainTab === 'documents' && (
            <DocumentsPanel 
              searchType={searchType} 
              onUseInEmail={handleUseDocumentInEmail}
            />
          )}

          {/* SETTINGS VIEW */}
          {mainTab === 'settings' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Mailbox Settings</h2>
                  <Badge variant="outline" className="text-xs">
                    Configure your outreach setup
                  </Badge>
                </div>
                
                <Tabs defaultValue="smtp" className="w-full">
                  <TabsList className="bg-muted/50 border border-border p-1 mb-6">
                    <TabsTrigger value="smtp" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                      <Mail className="w-4 h-4" />
                      Email / SMTP
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                      <Palette className="w-4 h-4" />
                      Branding
                    </TabsTrigger>
                    <TabsTrigger value="crm" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                      <Cloud className="w-4 h-4" />
                      CRM & Integrations
                    </TabsTrigger>
                  </TabsList>

                  {/* SMTP Tab */}
                  <TabsContent value="smtp">
                    <div className="rounded-xl bg-card border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          Email / SMTP Configuration
                        </h3>
                        <p className="text-xs text-muted-foreground">Configure your email server to send campaigns</p>
                      </div>
                      <div className="p-4">
                        <SMTPConfigPanel />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Branding Tab */}
                  <TabsContent value="branding">
                    <div className="rounded-xl bg-card border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Palette className="w-4 h-4 text-primary" />
                          Email Branding
                        </h3>
                        <p className="text-xs text-muted-foreground">Customize your logo, colors, and signature for outgoing emails</p>
                      </div>
                      <div className="p-4">
                        <BrandingSettingsPanel />
                      </div>
                    </div>
                  </TabsContent>

                  {/* CRM & Integrations Tab */}
                  <TabsContent value="crm">
                    <div className="space-y-4">
                      <CloudCRMIntegrationsPanel />
                      
                      {/* Additional Integration Info */}
                      <div className="rounded-xl bg-card border border-border p-4">
                        <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                          <Link2 className="w-4 h-4 text-primary" />
                          Export Options
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/30 border border-border">
                            <p className="text-sm font-medium text-foreground">Google Sheets</p>
                            <p className="text-xs text-muted-foreground">Auto-sync leads to spreadsheets</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border border-border">
                            <p className="text-sm font-medium text-foreground">CSV Export</p>
                            <p className="text-xs text-muted-foreground">Download leads anytime</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border border-border">
                            <p className="text-sm font-medium text-foreground">Zapier</p>
                            <p className="text-xs text-muted-foreground">Connect 5000+ apps</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border border-border">
                            <p className="text-sm font-medium text-foreground">Webhooks</p>
                            <p className="text-xs text-muted-foreground">Real-time lead notifications</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
          </>

        </div>
      </div>

      {/* Compose Email Modal - 3 Modes: Regular, Campaign, Autopilot */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => {
          setShowComposeModal(false);
          setComposeInitialEmail(null);
        }}
        leads={campaignLeads}
        currentLeadIndex={currentLeadIndex}
        lastSentIndex={lastSentLeadIndex}
        onLeadIndexChange={setCurrentLeadIndex}
        onEmailSent={(idx) => {
          setLastSentLeadIndex(idx);
          // Update analytics
          setCampaignAnalytics(prev => ({
            ...prev,
            sent: prev.sent + 1,
            delivered: prev.delivered + 1,
          }));
        }}
        initialEmail={composeInitialEmail || undefined}
        automationSettings={automation}
        onAutomationChange={setAutomation}
        searchType={searchType}
      />

      {/* Campaign Wizard Modal */}
      <AutoCampaignWizard
        open={showCampaignWizard}
        onOpenChange={setShowCampaignWizard}
        leads={campaignLeads.filter(l => 
          leadPriority === 'all' ? true : 
          (l.aiClassification || 'cold') === leadPriority
        )}
        onLaunch={(campaignData) => {
          const campaigns = JSON.parse(localStorage.getItem('bamlead_campaigns') || '[]');
          campaigns.push({
            ...campaignData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            priority: leadPriority,
          });
          localStorage.setItem('bamlead_campaigns', JSON.stringify(campaigns));
          toast.success(`Campaign "${campaignData.name}" launched!`);
          setShowCampaignWizard(false);
        }}
      />

      {/* Sequence Browser Modal */}
      <Dialog open={showSequenceBrowser} onOpenChange={setShowSequenceBrowser}>
        <DialogContent
          elevated
          className="max-w-4xl h-[85vh] max-h-[85vh] overflow-hidden flex flex-col"
        >
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Layers className="w-5 h-5 text-primary" />
            Email Sequences Library
            <Badge className={cn(
              "ml-2 text-xs",
              searchType === 'gmb' 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-violet-500/20 text-violet-400 border-violet-500/30"
            )}>
              {searchType === 'gmb' ? 'Option A' : 'Option B'}
            </Badge>
          </DialogTitle>
          <ScrollArea className="flex-1 min-h-0 mt-4" type="always">
            <EmailSequenceSelector
              searchType={searchType || 'gmb'}
              currentLead={campaignLeads[0] ? {
                business_name: campaignLeads[0].business_name || campaignLeads[0].name,
                first_name: campaignLeads[0].first_name || campaignLeads[0].contact_name,
                aiClassification: campaignLeads[0].aiClassification,
              } : undefined}
              onSelectSequence={(sequence) => {
                toast.success(`Selected sequence: ${sequence.name}`);
              }}
              onApplyStep={(step, personalized) => {
                // Open compose modal with this content
                setShowSequenceBrowser(false);
                openCompose({
                  to: activeLeadEmail,
                  subject: personalized.subject,
                  body: personalized.body,
                });
                toast.success(`Applied Day ${step.day} email template`);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Sequence Preview Modal with Personalization */}
      <SequencePreviewModal
        isOpen={showSequencePreview}
        onClose={() => setShowSequencePreview(false)}
        sequence={previewSequence}
        onSelectSequence={(seq) => {
          setSelectedEmailSequence(seq);
          toast.success(`Sequence "${seq.name}" applied to campaign`);
        }}
        onApplyStep={(step, personalized) => {
          setShowSequencePreview(false);
          openCompose({
            to: activeLeadEmail,
            subject: personalized.subject,
            body: personalized.body,
          });
          toast.success(`Applied Day ${step.day} email`);
        }}
      />

      {/* Autopilot Subscription Modal */}
      <Dialog open={showAutopilotSubscription} onOpenChange={setShowAutopilotSubscription}>
        <DialogContent
          elevated
          className="max-w-2xl max-h-[85vh] overflow-auto"
        >
          <DialogTitle className="text-lg font-bold text-foreground">
            AI Autopilot Access
          </DialogTitle>
          <AIAutopilotSubscription
            isActive={automation.doneForYouMode}
            onToggle={(active) => {
              if (active) {
                enableAutopilot();
              } else {
                disableAutopilot();
              }
              setShowAutopilotSubscription(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* AI Strategy Panel Modal */}
      <Dialog open={showStrategyPanel} onOpenChange={setShowStrategyPanel}>
        <DialogContent
          elevated
          className="max-w-3xl max-h-[85vh] overflow-auto"
        >
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Strategy Brain
          </DialogTitle>
          <p className="text-sm text-muted-foreground mb-4">
            The AI analyzes your search context, lead data, and templates to recommend optimal outreach strategies.
          </p>
          <AIStrategySelector
            mode="copilot"
            searchType={searchType}
            leads={campaignLeads}
            selectedTemplate={undefined}
            onSelectStrategy={(strategy) => {
              setSelectedStrategy(strategy);
              toast.success(`Strategy selected: ${strategy.name}`);
            }}
            onApproveStrategy={(strategy) => {
              setSelectedStrategy(strategy);
              setShowStrategyPanel(false);
              toast.success(`Strategy approved: ${strategy.name}`);
            }}
            selectedStrategy={selectedStrategy}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
