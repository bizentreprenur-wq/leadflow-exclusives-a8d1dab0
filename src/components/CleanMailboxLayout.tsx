import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Mail, Bot, User, Send, Flame, Clock, Settings, Play, Pause,
  Inbox, MessageSquare, Zap, Users, FileText, ChevronRight,
  Search, MailOpen, PenTool, Sparkles, Target, Rocket,
  Calendar, Phone, BellRing, Shield, CheckCircle2, X, FolderOpen,
  Building2, Globe, MapPin, Megaphone, Palette, Link2, Cloud
} from 'lucide-react';
import SMTPConfigPanel from './SMTPConfigPanel';
import BrandingSettingsPanel from './BrandingSettingsPanel';
import CloudCRMIntegrationsPanel from './CloudCRMIntegrationsPanel';
import DocumentsPanel from './mailbox/DocumentsPanel';
import AutoCampaignWizard from './AutoCampaignWizard';
import { isSMTPConfigured, sendSingleEmail } from '@/lib/emailService';

// Tab types for main navigation
type MainTab = 'inbox' | 'campaigns' | 'automation' | 'documents' | 'settings';
type InboxFilter = 'all' | 'hot' | 'unread';
type DocumentsTab = 'proposals' | 'contracts';

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
  
  // AI Automation settings
  const [automation, setAutomation] = useState<AutomationSettings>(() => {
    try {
      const saved = localStorage.getItem('bamlead_automation_settings');
      return saved ? JSON.parse(saved) : { doneForYouMode: false, autoFollowUps: true, responseMode: 'manual' };
    } catch { return { doneForYouMode: false, autoFollowUps: true, responseMode: 'manual' }; }
  });

  // Compose email state
  const [composeEmail, setComposeEmail] = useState({ to: '', subject: '', body: '' });
  const [isSending, setIsSending] = useState(false);
  
  // Campaign Wizard state
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [leadPriority, setLeadPriority] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  
  // Load leads from localStorage
  const [campaignLeads, setCampaignLeads] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('bamlead_email_leads');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Persist automation settings
  useEffect(() => {
    localStorage.setItem('bamlead_automation_settings', JSON.stringify(automation));
  }, [automation]);

  // Filter replies
  const filteredReplies = DEMO_REPLIES.filter(r => {
    if (inboxFilter === 'hot') return r.urgencyLevel === 'hot';
    if (inboxFilter === 'unread') return !r.isRead;
    return true;
  });

  // Send email handler
  const handleSendEmail = async () => {
    if (!composeEmail.to || !composeEmail.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }

    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first');
      setMainTab('settings');
      return;
    }

    setIsSending(true);
    try {
      await sendSingleEmail({
        to: composeEmail.to,
        subject: composeEmail.subject,
        bodyHtml: `<p>${composeEmail.body.replace(/\n/g, '<br/>')}</p>`,
        leadId: 'manual',
      });
      toast.success('Email sent successfully!');
      setShowComposeModal(false);
      setComposeEmail({ to: '', subject: '', body: '' });
    } catch (error) {
      toast.error('Failed to send email');
    }
    setIsSending(false);
  };

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
    { id: 'documents' as MainTab, label: 'Contracts', icon: FolderOpen },
    { id: 'settings' as MainTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-background">
      <div className="relative flex h-full flex-col">
        {/* TOP HEADER */}
        <header className="bg-card border-b border-border/60 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">BamLead</span>
            </div>

            {/* Main Navigation */}
            <nav className="flex items-center gap-1">
              {navTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    mainTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-muted/40"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mode indicator */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-3 py-1",
                  automation.doneForYouMode 
                    ? "border-emerald-500 text-emerald-400" 
                    : "border-border/70 text-muted-foreground"
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
            <div className="w-96 border-r border-border/60 flex flex-col bg-card">
              {/* Inbox Banner */}
              <div className="p-3 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>This inbox shows replies only.</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Campaigns run in the background.</p>
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
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {filter === 'all' ? 'All Replies' : filter}
                  </button>
                ))}
              </div>

              {/* Compose Button */}
              <div className="p-3">
                <Button
                  onClick={() => setShowComposeModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  Compose
                </Button>
              </div>

              {/* Email List */}
              <ScrollArea className="flex-1">
                <div className="divide-y divide-slate-800">
                  {filteredReplies.map(reply => (
                    <button
                      key={reply.id}
                      onClick={() => setSelectedReply(reply)}
                      className={cn(
                        "w-full p-3 text-left transition-all hover:bg-slate-800",
                        selectedReply?.id === reply.id && "bg-slate-800 border-l-2 border-l-emerald-500",
                        !reply.isRead && "bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs",
                          reply.urgencyLevel === 'hot' ? 'bg-red-500' :
                          reply.urgencyLevel === 'warm' ? 'bg-amber-500' : 'bg-slate-600'
                        )}>
                          {reply.from_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={cn("text-sm truncate", !reply.isRead ? "font-bold text-white" : "text-slate-300")}>
                              {reply.from_name}
                            </span>
                            <span className="text-[10px] text-slate-500">{reply.time}</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{reply.subject}</p>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {reply.urgencyLevel === 'hot' && (
                              <Badge className="bg-red-900/50 text-red-300 border border-red-700 text-[10px] px-1.5">
                                <Flame className="w-2.5 h-2.5 mr-0.5" /> Hot
                              </Badge>
                            )}
                            {reply.hasDocument && (
                              <Badge className="bg-violet-900/50 text-violet-300 border border-violet-700 text-[10px] px-1.5">
                                <FileText className="w-2.5 h-2.5 mr-0.5" /> Doc
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Email Detail Panel */}
            <div className="flex-1 flex items-center justify-center bg-card">
              {selectedReply ? (
                <div className="w-full h-full p-6">
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-2">{selectedReply.subject}</h2>
                    <p className="text-sm text-slate-400">From: {selectedReply.from_name} &lt;{selectedReply.from_email}&gt;</p>
                    <Separator className="my-4 bg-slate-800" />
                    <p className="text-slate-300">{selectedReply.preview || 'No preview available.'}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md px-6">
                  <div className="rounded-2xl border border-border/40 bg-card p-10 text-center">
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
              {/* Done-For-You Mode Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Done-For-You Mode</h3>
                      <p className="text-xs text-slate-400">BamLead runs campaigns for you automatically.</p>
                      <p className="text-xs text-slate-500">You approve once — AI handles the rest.</p>
                    </div>
                  </div>
                  <Switch
                    checked={automation.doneForYouMode}
                    onCheckedChange={(v) => {
                      setAutomation(prev => ({ ...prev, doneForYouMode: v }));
                      toast.success(v ? '🤖 Done-For-You Mode activated!' : 'Switched to Manual Mode');
                    }}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>

              {/* AI-Managed Sequences (only visible when DFY is ON) */}
              <AnimatePresence>
                {automation.doneForYouMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      AI-Managed Outreach Sequences
                    </h4>
                    
                    {/* Sequence Cards - Read Only */}
                    {DEMO_SEQUENCES.slice(0, 2).map(seq => (
                      <div key={seq.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-white">{seq.name}</h5>
                          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                            Manual Mode →
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {seq.channels.map(ch => (
                            <span key={ch} className="px-2 py-0.5 rounded bg-slate-700/50 capitalize">{ch}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">
                          Steps: {seq.steps} • Duration: {seq.duration}
                        </p>
                        <p className="text-[10px] text-emerald-400 mt-1">
                          AI selects and runs this sequence when appropriate.
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Separator className="bg-slate-800" />

              {/* AI Follow-Ups */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">AI Follow-Ups</h3>
                      <p className="text-xs text-slate-400">AI sends follow-ups automatically</p>
                      <p className="text-xs text-slate-500">based on engagement and response timing.</p>
                    </div>
                  </div>
                  <Switch
                    checked={automation.autoFollowUps}
                    onCheckedChange={(v) => setAutomation(prev => ({ ...prev, autoFollowUps: v }))}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGNS VIEW (Manual) */}
        {mainTab === 'campaigns' && (
          <div className="h-full overflow-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header with Create Campaign Button */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">Campaigns</h2>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">Manual</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">You control these campaigns.</p>
                  <p className="text-xs text-muted-foreground/70">Messages send only when you start them.</p>
                </div>
                <Button 
                  onClick={() => setShowCampaignWizard(true)}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  Create Campaign
                </Button>
              </div>

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

              {/* Campaign Cards */}
              <div className="space-y-3">
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
                          <><Play className="w-3.5 h-3.5" /> Start Campaign</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS VIEW */}
        {mainTab === 'documents' && (
          <DocumentsPanel searchType={searchType} />
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

      {/* Compose Email Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent elevated className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-emerald-400" />
              Compose Email
            </DialogTitle>
            <DialogDescription className="text-slate-400">Write and send an email manually</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-200 block mb-1.5">To</label>
              <Input
                value={composeEmail.to}
                onChange={(e) => setComposeEmail(prev => ({ ...prev, to: e.target.value }))}
                placeholder="recipient@email.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200 block mb-1.5">Subject</label>
              <Input
                value={composeEmail.subject}
                onChange={(e) => setComposeEmail(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200 block mb-1.5">Message</label>
              <Textarea
                value={composeEmail.body}
                onChange={(e) => setComposeEmail(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your message..."
                rows={6}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowComposeModal(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              {isSending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Email</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Wizard Modal */}
      <AutoCampaignWizard
        open={showCampaignWizard}
        onOpenChange={setShowCampaignWizard}
        leads={campaignLeads.filter(l => 
          leadPriority === 'all' ? true : 
          (l.aiClassification || 'cold') === leadPriority
        )}
        onLaunch={(campaignData) => {
          // Save campaign to localStorage
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
