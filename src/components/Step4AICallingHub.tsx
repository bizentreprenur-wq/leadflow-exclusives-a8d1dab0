/**
 * Step 4 AI Calling Hub
 * Clean card-based SaaS aesthetic with rounded sections, generous spacing,
 * soft gradients, and polished phone/call interface styling.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Phone, PhoneCall, PhoneMissed, Play, Pause, Square, CheckCircle2, XCircle,
  Sparkles, Lock, FileText, Users, Clock, BarChart3, Target, Zap, Loader2,
  ChevronRight, AlertCircle, Bot, Eye, Edit3, Volume2, TrendingUp, Flame,
  Info, Calendar as CalendarIcon, Database, ArrowLeft, Home, MessageSquare,
  Send, Settings2, Plus, Building2, MessageCircle, Headphones, Activity,
  Signal, Mic
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useUserBranding } from '@/hooks/useUserBranding';
import PhoneNumberSetupModal from '@/components/PhoneNumberSetupModal';
import AIScriptPreviewPanel from '@/components/AIScriptPreviewPanel';
import CallQueueModal from '@/components/CallQueueModal';
import SMSConversationPanel from '@/components/SMSConversationPanel';
import { Link } from 'react-router-dom';
import { buildCallScriptContext, addBreadcrumb, CustomerJourneyBreadcrumb } from '@/lib/aiCallingScriptGenerator';
import { SMSConversation, SMSMessage } from '@/lib/api/sms';
import { releaseNumber } from '@/lib/api/calling';
import { formatPhoneWithCountry, formatPhoneDisplay, isValidUSPhone, toE164 } from '@/lib/phoneUtils';

interface Lead {
  id?: string;
  email?: string;
  business_name?: string;
  name?: string;
  phone?: string;
  website?: string;
}

interface Step4AICallingHubProps {
  leads: Lead[];
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenCRMModal: () => void;
  searchType?: 'gmb' | 'platform';
  searchQuery?: string;
  searchLocation?: string;
  selectedStrategy?: string;
  emailSequences?: string[];
  proposalType?: string;
}

interface CallQueueItem {
  id: string | number;
  name: string;
  phone: string;
  business?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer';
  outcome?: string;
  duration?: number;
  smsReplies?: { from: 'ai' | 'lead'; message: string; timestamp: string }[];
}

const CRM_OPTIONS = [
  { id: 'bamlead', name: 'BAMLEAD CRM', icon: '🎯', color: 'from-emerald-500 to-teal-500' },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: 'from-orange-500 to-orange-600' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: 'from-blue-500 to-blue-600' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', color: 'from-green-500 to-green-600' },
];

/* ── Stat pill ── */
function StatPill({ value, label, icon: Icon, accent = 'primary' }: { value: string | number; label: string; icon: React.ElementType; accent?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary/15 to-primary/5 border-primary/25 text-primary',
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/25 text-emerald-400',
    amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/25 text-amber-400',
    blue: 'from-blue-500/15 to-blue-500/5 border-blue-500/25 text-blue-400',
    cyan: 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/25 text-cyan-400',
  };
  const c = colorMap[accent] || colorMap.primary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c} p-5 text-center`}
    >
      <Icon className={`w-5 h-5 mx-auto mb-2 opacity-60`} />
      <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{label}</div>
    </motion.div>
  );
}

export default function Step4AICallingHub({
  leads, onBack, onOpenSettings, onOpenCRMModal,
  searchType = 'gmb', searchQuery = '', searchLocation = '',
  selectedStrategy = '', emailSequences = [], proposalType = ''
}: Step4AICallingHubProps) {
  const { status, statusMessage, callingModeDescription, capabilities, phoneSetup, isLoading, needsUpgrade, needsAddon, addonMessage, purchaseAddon, requestPhoneProvisioning, isReady, addon } = useAICalling();
  const { tier, tierInfo, isAutopilot, isPro } = usePlanFeatures();
  const { branding, isLoading: brandingLoading } = useUserBranding();
  const [isProvisioningNumber, setIsProvisioningNumber] = useState(false);
  const [showAreaCodePicker, setShowAreaCodePicker] = useState(false);
  const [selectedAreaCode, setSelectedAreaCode] = useState('');
  const [provisionMode, setProvisionMode] = useState<'new' | 'port'>('new');
  const [portNumber, setPortNumber] = useState('');
  const [portName, setPortName] = useState('');
  const [isPortSubmitting, setIsPortSubmitting] = useState(false);
  const [isReleasingNumber, setIsReleasingNumber] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [callStats, setCallStats] = useState({ total: 0, completed: 0, answered: 0, noAnswer: 0, interested: 0, avgDuration: 0, smsReplies: 0 });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [meetings, setMeetings] = useState<{ date: Date; leadName: string }[]>([]);
  const [smsConversations, setSmsConversations] = useState<SMSConversation[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);

  const callableLeads = useMemo(() => {
    return leads.filter(lead => {
      if (!lead.phone) return false;
      const digits = lead.phone.replace(/\D/g, '');
      return digits.length >= 10 && isValidUSPhone(lead.phone) || digits.length > 11;
    });
  }, [leads]);

  const emailableLeads = useMemo(() => {
    return leads.filter(lead => lead.email);
  }, [leads]);

  useEffect(() => {
    if (callableLeads.length > 0 && callQueue.length === 0) {
      setCallQueue(callableLeads.map(lead => ({
        id: lead.id || `lead-${Math.random()}`,
        name: lead.business_name || lead.name || 'Unknown',
        phone: toE164(lead.phone!),
        business: lead.business_name,
        status: 'pending' as const,
        smsReplies: []
      })));
    }
  }, [callableLeads]);

  useEffect(() => {
    addBreadcrumb({
      step: 'Step 4',
      action: 'Entered AI Calling Hub',
      timestamp: new Date().toISOString(),
      details: { searchType, leadsCount: leads.length, callableCount: callableLeads.length, strategy: selectedStrategy }
    });
  }, []);

  useEffect(() => {
    if (isAutopilot && callableLeads.length > 0) loadSMSConversations();
  }, [isAutopilot, callableLeads]);

  const loadSMSConversations = async () => {
    setSmsLoading(true);
    try {
      const demoConversations: SMSConversation[] = callableLeads.slice(0, 5).map((lead, idx) => ({
        lead_id: lead.id || `lead-${idx}`,
        lead_name: lead.business_name || lead.name || 'Unknown Lead',
        lead_phone: lead.phone || '',
        business_name: lead.business_name,
        last_message: idx === 0 ? 'Yes, I\'m interested! When can we talk?' : 'Thanks for reaching out.',
        last_message_at: new Date(Date.now() - idx * 3600000).toISOString(),
        unread_count: idx === 0 ? 2 : 0,
        sentiment: idx === 0 ? 'interested' : 'neutral',
        messages: [
          { id: `msg-${idx}-1`, lead_id: lead.id || `lead-${idx}`, lead_name: lead.business_name || lead.name || 'Unknown', lead_phone: lead.phone || '', direction: 'outbound' as const, message: `Hi ${(lead.business_name || lead.name || '').split(' ')[0] || 'there'}, I noticed your business and wanted to reach out about how we can help you grow. Would you be open to a quick chat?`, status: 'delivered' as const, created_at: new Date(Date.now() - (idx * 3600000) - 7200000).toISOString(), read: true },
          { id: `msg-${idx}-2`, lead_id: lead.id || `lead-${idx}`, lead_name: lead.business_name || lead.name || 'Unknown', lead_phone: lead.phone || '', direction: 'inbound' as const, message: idx === 0 ? 'Yes, I\'m interested! When can we talk?' : 'Thanks for reaching out.', status: 'received' as const, created_at: new Date(Date.now() - idx * 3600000).toISOString(), read: idx !== 0 }
        ],
        ai_suggested_reply: idx === 0 ? 'Great to hear from you! I\'d love to schedule a call. Would tomorrow at 2pm work for you?' : undefined
      }));
      setSmsConversations(demoConversations);
    } catch (error) { console.error('Failed to load SMS conversations:', error); }
    finally { setSmsLoading(false); }
  };

  const handleStartCalling = () => {
    if (!isReady) {
      if (needsUpgrade) toast.error('Upgrade your plan to enable AI calling');
      else if (needsAddon) toast.error('Purchase AI Calling add-on first');
      else if (status === 'phone_needed') setShowPhoneModal(true);
      return;
    }
    const pendingCalls = callQueue.filter(c => c.status === 'pending');
    if (pendingCalls.length === 0) { toast.error('No leads in queue to call'); return; }
    const invalidNumbers = pendingCalls.filter(c => !c.phone.startsWith('+') || c.phone.replace(/\D/g, '').length < 11);
    if (invalidNumbers.length > 0) {
      toast.warning(`${invalidNumbers.length} lead(s) have invalid phone numbers and will be skipped`);
      setCallQueue(prev => prev.map(c => invalidNumbers.some(inv => inv.id === c.id) ? { ...c, status: 'failed' as const, outcome: 'Invalid Number' } : c));
    }
    setIsCallingActive(true);
    simulateCall();
    toast.success('AI calling started');
  };

  const handleStopCalling = () => { setIsCallingActive(false); toast.info('AI calling paused'); };

  const simulateCall = () => {
    const pendingCalls = callQueue.filter(c => c.status === 'pending' && c.phone.startsWith('+') && c.phone.replace(/\D/g, '').length >= 11);
    if (pendingCalls.length === 0 || !isCallingActive) { setIsCallingActive(false); return; }
    const currentCall = pendingCalls[0];
    setCallQueue(prev => prev.map(c => c.id === currentCall.id ? { ...c, status: 'calling' as const } : c));
    const duration = Math.floor(Math.random() * 12000) + 3000;
    setTimeout(() => {
      const outcomes = ['completed', 'no_answer', 'completed', 'completed', 'failed'] as const;
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const interested = outcome === 'completed' && Math.random() > 0.6;
      const smsReplies: CallQueueItem['smsReplies'] = [];
      if (isAutopilot && outcome === 'completed' && Math.random() > 0.5) {
        smsReplies.push({ from: 'ai', message: `Hi! Following up on our call. Would you like to schedule a meeting?`, timestamp: new Date().toISOString() });
        if (Math.random() > 0.4) smsReplies.push({ from: 'lead', message: `Yes, that sounds good. What times work?`, timestamp: new Date(Date.now() + 60000).toISOString() });
      }
      setCallQueue(prev => prev.map(c => c.id === currentCall.id ? { ...c, status: outcome, outcome: interested ? 'Interested' : outcome === 'completed' ? 'Callback' : undefined, duration: Math.floor(duration / 1000), smsReplies } : c));
      setCallStats(prev => ({ total: prev.total + 1, completed: prev.completed + (outcome === 'completed' ? 1 : 0), answered: prev.answered + (outcome === 'completed' ? 1 : 0), noAnswer: prev.noAnswer + (outcome === 'no_answer' ? 1 : 0), interested: prev.interested + (interested ? 1 : 0), avgDuration: Math.floor((prev.avgDuration * prev.total + duration / 1000) / (prev.total + 1)), smsReplies: prev.smsReplies + smsReplies.filter(s => s.from === 'lead').length }));
      if (isCallingActive) setTimeout(simulateCall, 1500);
    }, duration);
  };

  const getCallStatusIcon = (callStatus: CallQueueItem['status']) => {
    switch (callStatus) {
      case 'calling': return <PhoneCall className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'no_answer': return <PhoneMissed className="w-4 h-4 text-amber-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Phone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const tierCapabilities = useMemo(() => [
    { tier: 'free', name: 'Free', icon: Eye, accent: 'slate', features: ['AI call script preview only', 'See what AI would say'], limitation: 'Upgrade to unlock' },
    { tier: 'basic', name: 'Basic · $49', icon: Edit3, accent: 'blue', features: ['AI generates call scripts', 'You dial manually'], addon: `+$${AI_CALLING_ADDON_PRICE}/mo` },
    { tier: 'pro', name: 'Pro · $99', icon: Bot, accent: 'teal', features: ['AI calls your leads', 'You supervise calls'], addon: `+$${AI_CALLING_ADDON_PRICE}/mo` },
    { tier: 'autopilot', name: 'Autopilot · $249', icon: Sparkles, accent: 'amber', features: ['Fully autonomous calling', 'AI texts back & forth', 'Phone included'], included: 'All included!' },
  ], []);

  const handleScheduleMeeting = (lead: Lead) => {
    if (!selectedDate) { toast.error('Please select a date first'); return; }
    const leadName = lead.business_name || lead.name || 'Unknown';
    setMeetings(prev => [...prev, { date: selectedDate, leadName }]);
    toast.success(`Meeting scheduled with ${leadName}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <Phone className="absolute inset-0 m-auto w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Initializing AI Calling Hub…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── TOP NAV ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <span className="text-muted-foreground/40">|</span>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="gap-1.5 text-muted-foreground hover:text-foreground rounded-xl">
              <Home className="w-4 h-4" /> Home
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenSettings} className="gap-1.5 rounded-xl">
            <Settings2 className="w-4 h-4" /> Settings
          </Button>
        </div>

        {/* ── HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [.16,1,.3,1] }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-background via-primary/[0.04] to-background p-8 md:p-10"
        >
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-accent/[0.06] blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Branding + Title */}
            <div className="space-y-3">
              {(branding?.logo_url || branding?.company_name) && (
                <div className="flex items-center gap-2.5 mb-1">
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt={branding.company_name || ''} className="h-8 w-auto object-contain rounded-lg" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary" /></div>
                  )}
                  {branding.company_name && <span className="text-sm font-semibold text-foreground">{branding.company_name}</span>}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                AI Calling Hub
              </h1>
              <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                {callingModeDescription}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="rounded-full px-3 py-1 text-xs font-semibold bg-primary/15 text-primary border-0">
                  {tierInfo.name}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {callableLeads.length} leads ready
                </Badge>
                {isCallingActive && (
                  <Badge className="rounded-full px-3 py-1 text-xs bg-emerald-500/15 text-emerald-500 border-0 gap-1.5 animate-pulse">
                    <Activity className="w-3 h-3" /> Live
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Phone number card */}
            {phoneSetup.phoneNumber && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06]"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
                    {branding?.company_name ? `${branding.company_name}'s Line` : 'Your AI Line'}
                  </p>
                  <p className="text-xl font-mono font-bold text-emerald-400 tracking-wide">{formatPhoneWithCountry(phoneSetup.phoneNumber)}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── MAIN TABS ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-center">
            <TabsList className="h-12 rounded-2xl bg-muted/60 border border-border/50 p-1 gap-1">
              <TabsTrigger value="overview" className="rounded-xl px-5 py-2.5 text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BarChart3 className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="queue" className="rounded-xl px-5 py-2.5 text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Headphones className="w-4 h-4" /> Call Queue
                {callQueue.filter(c => c.status === 'pending').length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {callQueue.filter(c => c.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
              {isAutopilot && (
                <TabsTrigger value="sms" className="rounded-xl px-5 py-2.5 text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageCircle className="w-4 h-4" /> SMS
                  {smsConversations.reduce((acc, c) => acc + c.unread_count, 0) > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-bold">
                      {smsConversations.reduce((acc, c) => acc + c.unread_count, 0)}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="script" className="rounded-xl px-5 py-2.5 text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4" /> AI Script
              </TabsTrigger>
              <TabsTrigger value="results" className="rounded-xl px-5 py-2.5 text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Target className="w-4 h-4" /> Results
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ════════ OVERVIEW ════════ */}
          <TabsContent value="overview" className="space-y-8">
            {/* Tier Capability Cards — horizontal glass cards */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Capabilities by Plan</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {tierCapabilities.map((tc) => {
                  const isCurrentTier = tier === tc.tier;
                  const TierIcon = tc.icon;
                  const accentMap: Record<string, string> = {
                    slate: 'border-muted-foreground/20',
                    blue: 'border-blue-500/30',
                    teal: 'border-primary/30',
                    amber: 'border-amber-500/30',
                  };
                  const activeBg: Record<string, string> = {
                    slate: 'bg-muted/50',
                    blue: 'bg-blue-500/[0.07]',
                    teal: 'bg-primary/[0.07]',
                    amber: 'bg-amber-500/[0.07]',
                  };
                  const iconColor: Record<string, string> = {
                    slate: 'text-muted-foreground',
                    blue: 'text-blue-400',
                    teal: 'text-primary',
                    amber: 'text-amber-400',
                  };
                  
                  return (
                    <motion.div
                      key={tc.tier}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={!isCurrentTier ? { scale: 1.02 } : {}}
                      onClick={!isCurrentTier ? () => window.location.href = `/pricing?highlight=${tc.tier}` : undefined}
                      className={`relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
                        isCurrentTier
                          ? `${accentMap[tc.accent]} ${activeBg[tc.accent]} ring-2 ring-offset-2 ring-offset-background ${tc.accent === 'amber' ? 'ring-amber-500/40' : tc.accent === 'teal' ? 'ring-primary/40' : tc.accent === 'blue' ? 'ring-blue-500/40' : 'ring-muted-foreground/20'}`
                          : 'border-border/50 bg-card/30 opacity-50 hover:opacity-80'
                      }`}
                    >
                      {isCurrentTier && (
                        <Badge className="absolute -top-2.5 right-3 rounded-full text-[10px] px-2.5 py-0.5 bg-foreground text-background font-semibold">
                          Current
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCurrentTier ? activeBg[tc.accent] : 'bg-muted/50'}`}>
                          <TierIcon className={`w-4.5 h-4.5 ${isCurrentTier ? iconColor[tc.accent] : 'text-muted-foreground'}`} />
                        </div>
                        <span className={`font-bold text-sm ${isCurrentTier ? 'text-foreground' : 'text-muted-foreground'}`}>{tc.name}</span>
                      </div>
                      <ul className="space-y-2">
                        {tc.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isCurrentTier ? iconColor[tc.accent] : 'text-muted-foreground/50'}`} />
                            <span className={isCurrentTier ? 'text-foreground' : 'text-muted-foreground'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {tc.addon && (
                        <div className={`mt-4 text-center text-[11px] font-medium rounded-lg py-1.5 ${isCurrentTier ? 'bg-foreground/5 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {tc.addon}
                        </div>
                      )}
                      {tc.included && (
                        <div className="mt-4 text-center text-[11px] font-bold rounded-lg py-1.5 bg-emerald-500/15 text-emerald-500">
                          {tc.included}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Live Stats — pill-style */}
            {(isPro || isAutopilot) && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Live Stats</h3>
                <div className={`grid ${isAutopilot ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-3 md:grid-cols-5'} gap-3`}>
                  <StatPill value={callStats.total} label="Total" icon={Phone} accent="primary" />
                  <StatPill value={callStats.answered} label="Answered" icon={CheckCircle2} accent="emerald" />
                  <StatPill value={callStats.noAnswer} label="Missed" icon={PhoneMissed} accent="amber" />
                  <StatPill value={callStats.interested} label="Interested" icon={Flame} accent="primary" />
                  <StatPill value={`${callStats.avgDuration}s`} label="Avg Duration" icon={Clock} accent="cyan" />
                  {isAutopilot && <StatPill value={callStats.smsReplies} label="SMS Replies" icon={MessageSquare} accent="blue" />}
                </div>
              </div>
            )}

            {/* Quick Actions Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Schedule */}
              <div className="rounded-2xl border border-border/60 bg-card/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Quick Schedule</h4>
                    <p className="text-xs text-muted-foreground">Book follow-up meetings</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-xl border" />
                </div>
                <div className="text-center text-xs text-muted-foreground">{meetings.length} meetings scheduled</div>
              </div>

              {/* CRM */}
              <div className="rounded-2xl border border-border/60 bg-card/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Save to CRM</h4>
                    <p className="text-xs text-muted-foreground">Export leads to your CRM</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CRM_OPTIONS.map((crm) => (
                    <Button key={crm.id} variant="outline" className="h-auto py-3.5 flex flex-col items-center gap-1.5 rounded-xl hover:border-purple-500/40" onClick={onOpenCRMModal}>
                      <span className="text-xl">{crm.icon}</span>
                      <span className="text-xs font-medium">{crm.name}</span>
                    </Button>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground">11 CRMs available</div>
              </div>
            </div>

            {/* Status / Action Card */}
            <div className={`rounded-2xl border p-6 ${
              status === 'ready' ? 'border-emerald-500/25 bg-emerald-500/[0.04]' :
              status === 'addon_needed' ? 'border-amber-500/25 bg-amber-500/[0.04]' :
              'border-primary/20 bg-primary/[0.03]'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  status === 'ready' ? 'bg-emerald-500/15' : status === 'addon_needed' ? 'bg-amber-500/15' : 'bg-primary/15'
                }`}>
                  {status === 'ready' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                   status === 'addon_needed' ? <AlertCircle className="w-6 h-6 text-amber-500" /> :
                   <Zap className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-bold text-foreground">
                      {status === 'ready' ? 'AI Calling Ready!' : status === 'addon_needed' ? `Add AI Calling — $${AI_CALLING_ADDON_PRICE}/mo` : 'Get Started with AI Calling'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{addonMessage}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {tier === 'free' && (
                      <Link to="/pricing"><Button className="gap-2 rounded-xl">View Plans <ChevronRight className="w-4 h-4" /></Button></Link>
                    )}
                    {status === 'addon_needed' && tier !== 'free' && (
                      <Button onClick={purchaseAddon} className="gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"><Zap className="w-4 h-4" /> Subscribe — ${AI_CALLING_ADDON_PRICE}/mo</Button>
                    )}
                    {(status === 'phone_needed' || status === 'phone_provisioning') && tier !== 'free' && !showAreaCodePicker && (
                      <div className="flex gap-2">
                        <Button onClick={() => { setProvisionMode('new'); setShowAreaCodePicker(true); }} disabled={isProvisioningNumber || phoneSetup.isProvisioning} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Phone className="w-4 h-4" /> Get My Number</Button>
                        <Button variant="outline" onClick={() => { setProvisionMode('port'); setShowAreaCodePicker(true); }} className="gap-2 rounded-xl"><ArrowLeft className="w-4 h-4" /> Port Existing</Button>
                      </div>
                    )}
                    {showAreaCodePicker && (
                      <div className="w-full mt-2 space-y-3 p-4 rounded-2xl bg-card border border-border">
                        {provisionMode === 'new' ? (
                          <>
                            <div className="flex items-center gap-2 mb-2"><Signal className="w-4 h-4 text-primary" /><span className="font-semibold text-sm text-foreground">Choose Area Code</span></div>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                              {[
                                { code: '212', city: 'NYC' }, { code: '310', city: 'LA' }, { code: '312', city: 'Chicago' },
                                { code: '415', city: 'SF' }, { code: '305', city: 'Miami' }, { code: '512', city: 'Austin' },
                                { code: '404', city: 'Atlanta' }, { code: '206', city: 'Seattle' }, { code: '720', city: 'Denver' },
                                { code: '617', city: 'Boston' }, { code: '713', city: 'Houston' }, { code: '602', city: 'Phoenix' }
                              ].map(ac => (
                                <Button key={ac.code} variant={selectedAreaCode === ac.code ? 'default' : 'outline'} size="sm" className="rounded-xl text-xs flex flex-col h-auto py-2" onClick={() => setSelectedAreaCode(ac.code)}>
                                  <span className="font-bold">{ac.code}</span>
                                  <span className="text-[10px] text-muted-foreground">{ac.city}</span>
                                </Button>
                              ))}
                            </div>
                            <Button disabled={!selectedAreaCode || isProvisioningNumber} onClick={async () => {
                              setIsProvisioningNumber(true);
                              try {
                                const result = await requestPhoneProvisioning({ area_code: selectedAreaCode });
                                if (result.success) { toast.success('Phone number provisioned!'); setShowAreaCodePicker(false); window.location.reload(); }
                                else toast.error(result.error || 'Provisioning failed');
                              } catch { toast.error('Network error'); }
                              finally { setIsProvisioningNumber(false); }
                            }} className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                              {isProvisioningNumber ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</> : <><Phone className="w-4 h-4" /> Get Number ({selectedAreaCode || '…'})</>}
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2"><ArrowLeft className="w-4 h-4 text-primary" /><span className="font-semibold text-sm text-foreground">Port Your Number</span></div>
                            <div className="space-y-2">
                              <input type="tel" placeholder="+1 (555) 123-4567" value={portNumber} onChange={(e) => setPortNumber(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-background text-foreground text-sm" />
                              <input type="text" placeholder="Account holder name" value={portName} onChange={(e) => setPortName(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-background text-foreground text-sm" />
                            </div>
                            <Button onClick={async () => {
                              if (!portNumber || !portName) { toast.error('Fill in all fields'); return; }
                              setIsPortSubmitting(true);
                              try { toast.success('Port request submitted! We\'ll notify you when ready.'); setShowAreaCodePicker(false); }
                              catch { toast.error('Failed to submit'); }
                              finally { setIsPortSubmitting(false); }
                            }} disabled={isPortSubmitting || !portNumber || !portName} className="w-full gap-2 rounded-xl">
                              {isPortSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Port Request</>}
                            </Button>
                            <div className="text-[11px] text-muted-foreground bg-muted/30 p-3 rounded-xl space-y-1">
                              <p>📋 <strong>What you'll need:</strong> Phone bill, account PIN, authorization.</p>
                              <p>⏱️ <strong>Timeline:</strong> 1–3 business days.</p>
                              <p>📞 <strong>During porting:</strong> No downtime.</p>
                            </div>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setShowAreaCodePicker(false)} className="text-muted-foreground w-full rounded-xl">Cancel</Button>
                      </div>
                    )}
                    {phoneSetup.hasPhone && phoneSetup.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/15 text-emerald-500 gap-1 text-sm py-1.5 px-3 rounded-full border-0">
                          <Phone className="w-3 h-3" /> {formatPhoneWithCountry(phoneSetup.phoneNumber)}
                        </Badge>
                        {!showReleaseConfirm ? (
                          <Button variant="ghost" size="sm" onClick={() => setShowReleaseConfirm(true)} className="text-muted-foreground hover:text-destructive text-xs gap-1 rounded-xl">
                            <XCircle className="w-3 h-3" /> Release
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-destructive/10 border border-destructive/20">
                            <span className="text-xs text-destructive font-medium">Release?</span>
                            <Button size="sm" variant="destructive" className="text-xs h-7 px-2 rounded-lg" onClick={async () => {
                              setIsReleasingNumber(true);
                              try { const result = await releaseNumber(); if (result.success) { toast.success('Number released!'); setShowReleaseConfirm(false); setShowAreaCodePicker(false); window.location.reload(); } else toast.error(result.error || 'Failed'); }
                              catch { toast.error('Network error'); } finally { setIsReleasingNumber(false); }
                            }} disabled={isReleasingNumber}>{isReleasingNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowReleaseConfirm(false)} className="text-xs h-7 px-2">No</Button>
                          </div>
                        )}
                      </div>
                    )}
                    {isReady && !isCallingActive && callQueue.filter(c => c.status === 'pending').length > 0 && (
                      <Button onClick={handleStartCalling} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Play className="w-4 h-4" /> Start Calling ({callQueue.filter(c => c.status === 'pending').length})</Button>
                    )}
                    {isCallingActive && (
                      <Button onClick={handleStopCalling} variant="destructive" className="gap-2 rounded-xl"><Square className="w-4 h-4" /> Stop</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════ CALL QUEUE ════════ */}
          <TabsContent value="queue" className="space-y-5">
            {callQueue.length > 0 ? (
              <>
                {/* Progress */}
                {isCallingActive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                          <Mic className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">AI Calling in Progress</span>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">{callQueue.filter(c => c.status !== 'pending').length}/{callQueue.length}</span>
                    </div>
                    <Progress value={(callQueue.filter(c => c.status !== 'pending').length / callQueue.length) * 100} className="h-2 rounded-full" />
                  </motion.div>
                )}

                {/* Status counters */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Pending', count: callQueue.filter(c => c.status === 'pending').length, color: 'text-muted-foreground', bg: 'bg-muted/50' },
                    { label: 'Calling', count: callQueue.filter(c => c.status === 'calling').length, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Completed', count: callQueue.filter(c => c.status === 'completed').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Failed', count: callQueue.filter(c => c.status === 'no_answer' || c.status === 'failed').length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Queue list */}
                <ScrollArea className="h-[420px] rounded-2xl border bg-card/30">
                  <div className="divide-y divide-border/50">
                    {callQueue.map((call) => (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-center justify-between px-5 py-4 transition-colors ${
                          call.status === 'calling' ? 'bg-primary/[0.06]' :
                          call.status === 'completed' ? 'bg-emerald-500/[0.03]' :
                          'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            call.status === 'calling' ? 'bg-primary/15' : 'bg-muted/60'
                          }`}>
                            {getCallStatusIcon(call.status)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{call.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{formatPhoneDisplay(call.phone)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {call.smsReplies && call.smsReplies.length > 0 && (
                            <Badge variant="outline" className="rounded-full text-[10px] gap-1 text-blue-500 border-blue-500/30">
                              <MessageSquare className="w-3 h-3" /> {call.smsReplies.length}
                            </Badge>
                          )}
                          {call.outcome && (
                            <Badge className={`rounded-full text-[10px] border-0 ${call.outcome === 'Interested' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                              {call.outcome}
                            </Badge>
                          )}
                          {call.duration && <span className="text-xs text-muted-foreground font-mono">{call.duration}s</span>}
                          {call.status === 'calling' && (
                            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Live
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Actions */}
                {isReady && (
                  <div className="flex justify-end gap-2">
                    {!isCallingActive && callQueue.filter(c => c.status === 'pending').length > 0 && (
                      <Button onClick={handleStartCalling} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Play className="w-4 h-4" /> Start AI Calling</Button>
                    )}
                    {isCallingActive && (
                      <>
                        <Button onClick={() => setIsCallingActive(false)} variant="outline" className="gap-2 rounded-xl"><Pause className="w-4 h-4" /> Pause</Button>
                        <Button onClick={handleStopCalling} variant="destructive" className="gap-2 rounded-xl"><Square className="w-4 h-4" /> Stop</Button>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground mb-1">No leads with phone numbers</p>
                <p className="text-sm text-muted-foreground">Go back to Step 1 and search with phone filter enabled</p>
              </div>
            )}
          </TabsContent>

          {/* ════════ SMS (Autopilot) ════════ */}
          {isAutopilot && (
            <TabsContent value="sms" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Autonomous SMS</h3>
                    <p className="text-xs text-muted-foreground">AI handles bi-directional texting automatically</p>
                  </div>
                </div>
                <Badge className="rounded-full bg-blue-500/15 text-blue-500 border-0 gap-1"><Sparkles className="w-3 h-3" /> AI-Powered</Badge>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <StatPill value={smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'outbound').length, 0)} label="Sent" icon={Send} accent="blue" />
                <StatPill value={smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'inbound').length, 0)} label="Received" icon={MessageSquare} accent="emerald" />
                <StatPill value={smsConversations.filter(c => c.sentiment === 'interested').length} label="Interested" icon={Flame} accent="amber" />
                <StatPill value={smsConversations.length > 0 ? `${Math.round((smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'inbound').length, 0) / Math.max(smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'outbound').length, 0), 1)) * 100)}%` : '0%'} label="Response" icon={TrendingUp} accent="primary" />
              </div>

              <SMSConversationPanel conversations={smsConversations} onRefresh={loadSMSConversations} isLoading={smsLoading} userPhoneNumber={phoneSetup.phoneNumber} companyName={branding?.company_name} />

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Bot, color: 'blue', title: 'Auto-Replies', desc: 'AI crafts personalized responses based on lead context and sentiment' },
                  { icon: Sparkles, color: 'emerald', title: 'Smart Scheduling', desc: 'Detects appointment requests and auto-proposes meeting times' },
                  { icon: Flame, color: 'amber', title: 'Hot Lead Alerts', desc: 'Get notified when leads show strong buying signals' },
                ].map((feat) => (
                  <div key={feat.title} className="rounded-2xl border bg-card/50 p-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-9 h-9 rounded-xl bg-${feat.color}-500/10 flex items-center justify-center`}>
                        <feat.icon className={`w-4 h-4 text-${feat.color}-400`} />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{feat.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {/* ════════ AI SCRIPT ════════ */}
          <TabsContent value="script">
            <div className="rounded-2xl border bg-card/30 p-6">
              <AIScriptPreviewPanel searchQuery={searchQuery} searchLocation={searchLocation} selectedStrategy={selectedStrategy} />
            </div>
          </TabsContent>

          {/* ════════ RESULTS ════════ */}
          <TabsContent value="results" className="space-y-6">
            {callStats.total > 0 ? (
              <>
                <div className="grid md:grid-cols-3 gap-5">
                  {[
                    { icon: CheckCircle2, color: 'emerald', title: 'Success Rate', value: `${callStats.total > 0 ? Math.round((callStats.answered / callStats.total) * 100) : 0}%`, sub: `${callStats.answered} answered / ${callStats.total} total` },
                    { icon: Target, color: 'primary', title: 'Interest Rate', value: `${callStats.answered > 0 ? Math.round((callStats.interested / callStats.answered) * 100) : 0}%`, sub: `${callStats.interested} interested` },
                    { icon: MessageSquare, color: 'blue', title: 'SMS Replies', value: callStats.smsReplies, sub: isAutopilot ? 'Lead responses' : 'Autopilot only' },
                  ].map((card) => (
                    <div key={card.title} className="rounded-2xl border bg-card/50 p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-10 h-10 rounded-xl bg-${card.color === 'primary' ? 'primary' : card.color + '-500'}/10 flex items-center justify-center`}>
                          <card.icon className={`w-5 h-5 ${card.color === 'primary' ? 'text-primary' : `text-${card.color}-500`}`} />
                        </div>
                        <span className="font-semibold text-sm text-foreground">{card.title}</span>
                      </div>
                      <div className={`text-4xl font-extrabold tracking-tight ${card.color === 'primary' ? 'text-primary' : `text-${card.color}-400`}`}>{card.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Hot Leads */}
                {callQueue.filter(c => c.outcome === 'Interested').length > 0 && (
                  <div className="rounded-2xl border overflow-hidden">
                    <div className="px-5 py-4 border-b bg-emerald-500/[0.04] flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <h4 className="font-bold text-foreground text-sm">Hot Leads — Ready to Close</h4>
                    </div>
                    <div className="divide-y divide-border/50">
                      {callQueue.filter(c => c.outcome === 'Interested').map(lead => (
                        <div key={lead.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                              <Flame className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{lead.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{formatPhoneDisplay(lead.phone)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lead.smsReplies && lead.smsReplies.length > 0 && (
                              <Badge variant="outline" className="rounded-full text-[10px] text-blue-500 border-blue-500/30 gap-1"><MessageSquare className="w-3 h-3" /> {lead.smsReplies.filter(s => s.from === 'lead').length}</Badge>
                            )}
                            <Badge className="rounded-full bg-emerald-500/15 text-emerald-500 border-0 text-[10px]">Interested</Badge>
                            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs"><Phone className="w-3 h-3" /> Call Back</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SMS Conversations in Results */}
                {isAutopilot && callQueue.some(c => c.smsReplies && c.smsReplies.length > 0) && (
                  <div className="rounded-2xl border overflow-hidden">
                    <div className="px-5 py-4 border-b bg-blue-500/[0.04] flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <h4 className="font-bold text-foreground text-sm">SMS Conversations</h4>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="divide-y divide-border/50">
                        {callQueue.filter(c => c.smsReplies && c.smsReplies.length > 0).map(lead => (
                          <div key={lead.id} className="p-5">
                            <p className="font-semibold text-sm text-foreground mb-3">{lead.name}</p>
                            <div className="space-y-2">
                              {lead.smsReplies?.map((sms, i) => (
                                <div key={i} className={`p-3 rounded-xl text-sm ${sms.from === 'ai' ? 'bg-primary/[0.06] ml-6' : 'bg-muted/50 mr-6'}`}>
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{sms.from === 'ai' ? '🤖 AI' : '👤 Lead'}</span>
                                  <p className="text-foreground mt-0.5">{sms.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground mb-1">No results yet</p>
                <p className="text-sm text-muted-foreground">Start calling to see analytics here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PhoneNumberSetupModal open={showPhoneModal} onOpenChange={setShowPhoneModal} />
    </>
  );
}
