import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Mail, Bot, Send, Flame, Clock, Settings, Play, Pause,
  Inbox, PenTool, Sparkles, Target, Rocket,
  Calendar, Shield, CheckCircle2, X, FolderOpen,
  Palette, Link2, Cloud, BarChart3, MousePointer, Eye, Reply, TrendingUp,
  PanelLeftClose, PanelLeft, MailOpen, Zap
} from 'lucide-react';
import SMTPConfigPanel from './SMTPConfigPanel';
import BrandingSettingsPanel from './BrandingSettingsPanel';
import CloudCRMIntegrationsPanel from './CloudCRMIntegrationsPanel';
import DocumentsPanel from './mailbox/DocumentsPanel';
import AutoCampaignWizard from './AutoCampaignWizard';
import ClickHeatmapChart from './ClickHeatmapChart';
import ABTestingChart from './ABTestingChart';
import AIAutopilotSubscription from './AIAutopilotSubscription';
import ScheduledQueuePanel from './ScheduledQueuePanel';
import LeadQueueIndicator from './LeadQueueIndicator';
import CampaignPerformanceDashboard from './CampaignPerformanceDashboard';
import ComposeEmailModal from './ComposeEmailModal';
import EmailABTestingSystem from './EmailABTestingSystem';
import LeadResponseDetection from './LeadResponseDetection';

// Tab types for main navigation
type MainTab = 'inbox' | 'campaigns' | 'automation' | 'documents' | 'settings';
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

const DEMO_SEQUENCES: OutreachSequence[] = [
  { id: '1', name: 'Cold Outreach', channels: ['email', 'linkedin', 'sms'], steps: 4, duration: '10 days', status: 'active' },
  { id: '2', name: 'Warm Lead Nurture', channels: ['email'], steps: 3, duration: '7 days', status: 'active' },
  { id: '3', name: 'No Website Specialist', channels: ['email'], steps: 3, duration: '5 days', status: 'paused' },
  { id: '4', name: 'Re-Engagement', channels: ['email'], steps: 2, duration: '14 days', status: 'draft' },
];

const DEMO_REPLIES: EmailReply[] = [
  { id: '1', from_name: 'Katie Myers', from_email: 'katie@example.com', subject: 'Thank you for your great assist...', preview: 'Thank you for giving great assist...', time: 'Today 4:32 PM', urgencyLevel: 'hot', isRead: false },
  { id: '2', from_name: 'Thomas Jackson', from_email: 'thomas@example.com', subject: 'Forwarded meeting times!', preview: 'Hi, below, opposite PM...', time: 'Today 2:15 PM', urgencyLevel: 'hot', isRead: false },
  { id: '3', from_name: 'Michael Davis', from_email: 'michael@example.com', subject: 'Interested in reality TV promo', preview: '', time: 'Yesterday 5:42 PM', urgencyLevel: 'warm', isRead: true },
  { id: '4', from_name: 'Laura Bennett', from_email: 'laura@example.com', subject: 'Re: Need us think additional times?', preview: 'Finally, 200 PM...', time: 'Yesterday 2:10 PM', urgencyLevel: 'warm', isRead: true },
  { id: '5', from_name: 'Ryan Brooks', from_email: 'ryan@example.com', subject: 'Thank you for following up!', preview: 'Finally, Got PM...', time: '2 days ago 6:27 PM', urgencyLevel: 'cold', isRead: true, hasDocument: true },
];

interface CleanMailboxLayoutProps {
  searchType?: 'gmb' | 'platform' | null;
  campaignContext?: {
    isActive: boolean;
    sentCount: number;
    totalLeads: number;
  };
}

export default function CleanMailboxLayout({ searchType, campaignContext }: CleanMailboxLayoutProps) {
  const [mainTab, setMainTab] = useState<MainTab>('inbox');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [sequences, setSequences] = useState<OutreachSequence[]>(DEMO_SEQUENCES);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
  
  const readStoredEmailLeads = () => {
    if (typeof window === 'undefined') return [] as any[];
    const read = (storage: Storage) => {
      try {
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

  // Campaign analytics state - sync from localStorage
  const [campaignAnalytics, setCampaignAnalytics] = useState(() => {
    try {
      const stored = localStorage.getItem('bamlead_campaign_analytics');
      return stored ? JSON.parse(stored) : {
        sent: campaignContext?.sentCount || 0,
        delivered: Math.floor((campaignContext?.sentCount || 0) * 0.95),
        opened: Math.floor((campaignContext?.sentCount || 0) * 0.42),
        clicked: Math.floor((campaignContext?.sentCount || 0) * 0.18),
        replied: Math.floor((campaignContext?.sentCount || 0) * 0.08),
      };
    } catch { 
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0 }; 
    }
  });

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
    setShowComposeModal(true);
    setMainTab('inbox');
  };

  useEffect(() => {
    localStorage.setItem('bamlead_automation_settings', JSON.stringify(automation));
  }, [automation]);

  // Filter replies
  const filteredReplies = DEMO_REPLIES.filter(r => {
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

  // Main navigation tabs
  const navTabs = [
    { id: 'inbox' as MainTab, label: 'Inbox', icon: Inbox },
    { id: 'campaigns' as MainTab, label: 'Campaigns', icon: Send },
    { id: 'automation' as MainTab, label: 'AI Automation', icon: Bot },
    { id: 'documents' as MainTab, label: 'PreDone Documents', icon: FolderOpen },
    { id: 'settings' as MainTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="relative w-full h-full flex bg-background">
      {/* COLLAPSIBLE LEFT SIDEBAR */}
      <AnimatePresence mode="wait">
        {!sidebarCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-r border-border bg-card flex flex-col overflow-hidden"
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
            <div className="p-4">
              <Button
                onClick={() => setShowComposeModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                <PenTool className="w-4 h-4" />
                Compose
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
                      ? "bg-emerald-600 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'inbox' && (
                    <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5">
                      {DEMO_REPLIES.filter(r => !r.isRead).length}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>

            {/* Mode Indicator */}
            <div className="p-4 border-t border-border">
              <div className={cn(
                "p-3 rounded-lg border",
                automation.doneForYouMode 
                  ? "bg-emerald-500/10 border-emerald-500/30" 
                  : "bg-muted/30 border-border"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">
                    {automation.doneForYouMode ? '🤖 AI Autopilot' : '👤 Manual Mode'}
                  </span>
                  <Switch
                    checked={automation.doneForYouMode}
                    onCheckedChange={(v) => setAutomation(prev => ({ ...prev, doneForYouMode: v }))}
                    className="data-[state=checked]:bg-emerald-500 scale-75"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {automation.doneForYouMode 
                    ? 'AI is nurturing leads automatically' 
                    : 'You control all outreach'}
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden">
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
                      onClick={() => setSelectedReply(reply)}
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
                              {reply.time.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-foreground truncate mb-0.5">{reply.subject}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{reply.preview}</p>
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

              {/* Email Preview / Empty State */}
              <div className="flex-1 flex items-center justify-center bg-background">
                {selectedReply ? (
                  <div className="w-full max-w-2xl p-8">
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
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedReply.preview || 'No preview available.'}
                      </p>
                      <div className="mt-6 flex gap-2">
                        <Button onClick={() => setShowComposeModal(true)} className="gap-2">
                          <Reply className="w-4 h-4" />
                          Reply
                        </Button>
                        <Button variant="outline">Forward</Button>
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

          {/* AI AUTOMATION VIEW */}
          {mainTab === 'automation' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* AI Autopilot Subscription Component */}
                <AIAutopilotSubscription
                  isActive={automation.doneForYouMode}
                  onToggle={(active) => {
                    setAutomation(prev => ({ ...prev, doneForYouMode: active }));
                  }}
                />

                {/* AI-Managed Sequences (only visible when DFY is ON) */}
                <AnimatePresence>
                  {automation.doneForYouMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        AI-Managed Outreach Sequences
                      </h4>
                      
                      {/* Sequence A - GMB Search */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">A</Badge>
                            <h5 className="font-medium text-foreground">GMB Search Sequence</h5>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded bg-muted border border-border">Email</span>
                          <span className="px-2 py-0.5 rounded bg-muted border border-border">Follow-up x3</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Steps: 4 • Duration: 10 days • For Google Maps leads
                        </p>
                        <p className="text-[10px] text-emerald-400 mt-1">
                          AI sends initial outreach + 3 follow-ups based on engagement
                        </p>
                      </div>

                      {/* Sequence B - Platform Search */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">B</Badge>
                            <h5 className="font-medium text-foreground">Platform Search Sequence</h5>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded bg-muted border border-border">Email</span>
                          <span className="px-2 py-0.5 rounded bg-muted border border-border">LinkedIn</span>
                          <span className="px-2 py-0.5 rounded bg-muted border border-border">SMS</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Steps: 5 • Duration: 14 days • For Yelp, Yellow Pages, etc.
                        </p>
                        <p className="text-[10px] text-emerald-400 mt-1">
                          Multi-channel nurturing with smart channel switching
                        </p>
                      </div>

                      {/* CRM Sync Notice */}
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs text-foreground">
                          All AI interactions sync to your connected CRM in real-time
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Separator />

                {/* AI Follow-Ups */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">AI Follow-Ups</h3>
                        <p className="text-xs text-muted-foreground">AI sends follow-ups automatically</p>
                        <p className="text-xs text-muted-foreground/70">based on engagement and response timing.</p>
                      </div>
                    </div>
                    <Switch
                      checked={automation.autoFollowUps}
                      onCheckedChange={(v) => setAutomation(prev => ({ ...prev, autoFollowUps: v }))}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                <Separator />

                {/* Lead Response Detection System */}
                <LeadResponseDetection 
                  onFollowUp={(response) => {
                    setShowComposeModal(true);
                    toast.success(`Preparing reply to ${response.leadName}`);
                  }}
                />

                <Separator />

                {/* Email A/B Testing System */}
                <EmailABTestingSystem 
                  leads={campaignLeads}
                  onApplyWinner={(variant) => {
                    toast.success(`Applied winning template: ${variant.name}`);
                  }}
                />
              </div>
            </div>
          )}

          {/* CAMPAIGNS VIEW (Manual) */}
          {mainTab === 'campaigns' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
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
                <CampaignPerformanceDashboard />

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
        </div>
      </div>

      {/* Compose Email Modal - 3 Modes: Regular, Campaign, Autopilot */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
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
    </div>
  );
}
