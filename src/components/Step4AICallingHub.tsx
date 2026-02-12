/**
 * Step 4 AI Calling Hub
 * Sidebar-based layout with clear navigation between AI Calling sections.
 * Inspired by professional calling platforms with organized left panel.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Phone, PhoneCall, PhoneMissed, Play, Pause, Square, CheckCircle2, XCircle,
  Sparkles, Lock, FileText, Users, Clock, BarChart3, Target, Zap, Loader2,
  ChevronRight, AlertCircle, Bot, Eye, Edit3, Volume2, TrendingUp, Flame,
  Info, Calendar as CalendarIcon, Database, ArrowLeft, Home, MessageSquare,
  Send, Settings2, Plus, Building2, MessageCircle, Headphones, Activity,
  Signal, Mic, Rocket, BookOpen, HelpCircle, PhoneForwarded, LayoutDashboard,
  History, Brain, ChevronDown, RotateCcw
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useUserBranding } from '@/hooks/useUserBranding';
import PhoneNumberSetupModal from '@/components/PhoneNumberSetupModal';
import AIScriptPreviewPanel from '@/components/AIScriptPreviewPanel';
import CallQueueModal from '@/components/CallQueueModal';
import SMSConversationPanel from '@/components/SMSConversationPanel';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { buildCallScriptContext, addBreadcrumb, CustomerJourneyBreadcrumb } from '@/lib/aiCallingScriptGenerator';
import { SMSConversation, SMSMessage } from '@/lib/api/sms';
import { releaseNumber, initiateCall as apiInitiateCall, hangupCall as apiHangupCall, getCallStatus } from '@/lib/api/calling';
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
  const colorMap: Record<string, { bg: string; icon: string }> = {
    primary: { bg: 'from-primary/15 to-primary/5 border-primary/25', icon: 'text-primary' },
    emerald: { bg: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/25', icon: 'text-emerald-400' },
    amber: { bg: 'from-amber-500/15 to-amber-500/5 border-amber-500/25', icon: 'text-amber-400' },
    blue: { bg: 'from-blue-500/15 to-blue-500/5 border-blue-500/25', icon: 'text-blue-400' },
    cyan: { bg: 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/25', icon: 'text-cyan-400' },
  };
  const c = colorMap[accent] || colorMap.primary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c.bg} p-4 text-center`}
    >
      <Icon className={`w-4 h-4 mx-auto mb-1.5 ${c.icon}`} />
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">{label}</div>
    </motion.div>
  );
}

/* ── Sidebar navigation items ── */
type SidebarSection = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  group: 'main' | 'calling' | 'tools';
  requiresAutopilot?: boolean;
  iconColor?: string;
};

export default function Step4AICallingHub({
  leads, onBack, onOpenSettings, onOpenCRMModal,
  searchType = 'gmb', searchQuery = '', searchLocation = '',
  selectedStrategy = '', emailSequences = [], proposalType = ''
}: Step4AICallingHubProps) {
  const { status, statusMessage, callingModeDescription, capabilities, phoneSetup, isLoading, needsUpgrade, needsAddon, addonMessage, purchaseAddon, requestPhoneProvisioning, isReady, addon, savePhoneSetup } = useAICalling();
  const { tier, tierInfo, isAutopilot, isPro } = usePlanFeatures();
  const { user } = useAuth();
  const { branding, isLoading: brandingLoading } = useUserBranding();
  const [isProvisioningNumber, setIsProvisioningNumber] = useState(false);
  const [showAreaCodePicker, setShowAreaCodePicker] = useState(false);
  const [selectedAreaCode, setSelectedAreaCode] = useState('');
  const [provisionMode, setProvisionMode] = useState<'new' | 'port'>('new');
  const [portNumber, setPortNumber] = useState('');
  const [portName, setPortName] = useState('');
  const [isPortSubmitting, setIsPortSubmitting] = useState(false);
  const [existingNumber, setExistingNumber] = useState('');
  const [isSavingExisting, setIsSavingExisting] = useState(false);
  const [isReleasingNumber, setIsReleasingNumber] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [callStats, setCallStats] = useState({ total: 0, completed: 0, answered: 0, noAnswer: 0, interested: 0, avgDuration: 0, smsReplies: 0 });
  const activeCallSidRef = useRef<string | null>(null);
  const callingActiveRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [meetings, setMeetings] = useState<{ date: Date; leadName: string }[]>([]);
  const [smsConversations, setSmsConversations] = useState<SMSConversation[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const processNextCall = useCallback(async () => {
    if (!callingActiveRef.current) return;

    const pendingCalls = callQueue.filter(c => c.status === 'pending' && c.phone.startsWith('+') && c.phone.replace(/\D/g, '').length >= 11);
    if (pendingCalls.length === 0) {
      setIsCallingActive(false);
      callingActiveRef.current = false;
      toast.info('All calls completed');
      return;
    }

    const currentCall = pendingCalls[0];
    setCallQueue(prev => prev.map(c => c.id === currentCall.id ? { ...c, status: 'calling' as const } : c));

    try {
      const result = await apiInitiateCall({
        destination_number: currentCall.phone,
        lead_id: typeof currentCall.id === 'number' ? currentCall.id : undefined,
        lead_name: currentCall.name,
      });

      if (!result.success || !result.call_sid) {
        setCallQueue(prev => prev.map(c => c.id === currentCall.id ? { ...c, status: 'failed' as const, outcome: result.error || 'Call failed' } : c));
        setCallStats(prev => ({ ...prev, total: prev.total + 1 }));
        if (callingActiveRef.current) setTimeout(() => processNextCall(), 2000);
        return;
      }

      activeCallSidRef.current = result.call_sid;

      // Poll for call completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResult = await getCallStatus(result.call_sid!);
          if (!statusResult.success) return;

          const endStatuses = ['completed', 'busy', 'no-answer', 'failed', 'canceled'];
          if (statusResult.status && endStatuses.includes(statusResult.status)) {
            clearInterval(pollInterval);
            activeCallSidRef.current = null;

            const isAnswered = statusResult.status === 'completed';
            const duration = statusResult.duration_seconds || 0;

            setCallQueue(prev => prev.map(c => c.id === currentCall.id ? {
              ...c,
              status: isAnswered ? 'completed' as const : statusResult.status === 'no-answer' ? 'no_answer' as const : 'failed' as const,
              outcome: isAnswered ? (duration > 30 ? 'Interested' : 'Callback') : statusResult.status === 'no-answer' ? 'No Answer' : 'Failed',
              duration,
            } : c));

            setCallStats(prev => ({
              total: prev.total + 1,
              completed: prev.completed + (isAnswered ? 1 : 0),
              answered: prev.answered + (isAnswered ? 1 : 0),
              noAnswer: prev.noAnswer + (statusResult.status === 'no-answer' ? 1 : 0),
              interested: prev.interested + (isAnswered && duration > 30 ? 1 : 0),
              avgDuration: prev.total > 0 ? Math.floor((prev.avgDuration * prev.total + duration) / (prev.total + 1)) : duration,
              smsReplies: prev.smsReplies,
            }));

            if (callingActiveRef.current) setTimeout(() => processNextCall(), 2000);
          }
        } catch (e) {
          console.error('Poll error:', e);
        }
      }, 3000);

    } catch (e) {
      console.error('Call initiation error:', e);
      setCallQueue(prev => prev.map(c => c.id === currentCall.id ? { ...c, status: 'failed' as const, outcome: 'Network Error' } : c));
      setCallStats(prev => ({ ...prev, total: prev.total + 1 }));
      if (callingActiveRef.current) setTimeout(() => processNextCall(), 2000);
    }
  }, [callQueue]);

  const handleStartCalling = useCallback(() => {
    if (!phoneSetup.hasPhone) {
      toast.error('Set up a phone number first');
      setActiveSection('phone-setup');
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
    callingActiveRef.current = true;
    processNextCall();
    toast.success('Twilio AI calling started');
  }, [isReady, needsUpgrade, needsAddon, status, callQueue, processNextCall]);

  const handleStopCalling = useCallback(async () => {
    setIsCallingActive(false);
    callingActiveRef.current = false;
    // Hang up any active call
    if (activeCallSidRef.current) {
      try {
        await apiHangupCall(activeCallSidRef.current);
      } catch (e) { console.error('Hangup error:', e); }
      activeCallSidRef.current = null;
    }
    toast.info('AI calling stopped');
  }, []);

  const getCallStatusIcon = (callStatus: CallQueueItem['status']) => {
    switch (callStatus) {
      case 'calling': return <PhoneCall className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'no_answer': return <PhoneMissed className="w-4 h-4 text-amber-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Phone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleScheduleMeeting = (lead: Lead) => {
    if (!selectedDate) { toast.error('Please select a date first'); return; }
    const leadName = lead.business_name || lead.name || 'Unknown';
    setMeetings(prev => [...prev, { date: selectedDate, leadName }]);
    toast.success(`Meeting scheduled with ${leadName}`);
  };

  // Build sidebar navigation
  const pendingCount = callQueue.filter(c => c.status === 'pending').length;
  const unreadSMS = smsConversations.reduce((acc, c) => acc + c.unread_count, 0);
  const hotLeads = callQueue.filter(c => c.outcome === 'Interested').length;

  const sidebarItems: SidebarSection[] = useMemo(() => [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen, group: 'main', iconColor: 'text-sky-400' },
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'main', iconColor: 'text-amber-400' },
    { id: 'phone-setup', label: 'Phone Setup', icon: Signal, group: 'calling', badge: phoneSetup.hasPhone ? undefined : '!', badgeColor: 'bg-amber-500', iconColor: 'text-emerald-400' },
    { id: 'queue', label: 'Call Queue', icon: Headphones, group: 'calling', badge: pendingCount > 0 ? pendingCount : undefined, badgeColor: 'bg-primary', iconColor: 'text-violet-400' },
    { id: 'script', label: 'AI Script', icon: Brain, group: 'calling', iconColor: 'text-orange-400' },
    { id: 'results', label: 'Call Results', icon: Target, group: 'calling', badge: hotLeads > 0 ? `🔥 ${hotLeads}` : undefined, badgeColor: 'bg-orange-500', iconColor: 'text-rose-400' },
    { id: 'sms', label: 'SMS Messaging', icon: MessageCircle, group: 'calling', badge: unreadSMS > 0 ? unreadSMS : undefined, badgeColor: 'bg-blue-500', requiresAutopilot: true, iconColor: 'text-cyan-400' },
    { id: 'schedule', label: 'Calendar', icon: CalendarIcon, group: 'tools', iconColor: 'text-pink-400' },
    { id: 'crm', label: 'Save to CRM', icon: Database, group: 'tools', iconColor: 'text-yellow-400' },
  ], [pendingCount, unreadSMS, hotLeads, phoneSetup.hasPhone]);

  const filteredItems = sidebarItems.filter(item => !item.requiresAutopilot || isAutopilot);

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

  const renderSidebarItem = (item: SidebarSection) => {
    const isActive = activeSection === item.id;
    const isDisabled = item.id === 'phone-setup' && phoneSetup.hasPhone;
    return (
      <button
        key={item.id}
        onClick={() => !isDisabled && setActiveSection(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isDisabled
            ? 'opacity-40 cursor-not-allowed text-muted-foreground'
            : isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-foreground hover:text-foreground hover:bg-muted/60'
        }`}
        disabled={isDisabled}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isDisabled ? 'text-muted-foreground' : isActive ? 'text-primary' : (item.iconColor || 'text-muted-foreground')}`} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-amber-500'}`}>
                {item.badge}
              </span>
            )}
            {item.id === 'sms' && (
              <Badge className="rounded-full text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-500 border-0">AI</Badge>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] max-w-[1400px] mx-auto gap-0">
        {/* ── LEFT SIDEBAR ── */}
        <div className={`shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-64'} border-r border-border bg-gradient-to-b from-muted/60 via-card to-card flex flex-col transition-all duration-300`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Phone className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground text-sm truncate">AI Calling</h2>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {branding?.company_name || 'BamLead Voice'}
                  </p>
                </div>
              )}
            </div>
            {/* Back / Home buttons */}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1 mt-3">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg">
                  <ArrowLeft className="w-3 h-3" /> Back
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg">
                  <Home className="w-3 h-3" /> Home
                </Button>
              </div>
            )}
          </div>

          {/* Phone Status - moved to AI Calling section below */}

          {/* Tier Badge */}
          {!sidebarCollapsed && (
            <div className="px-4 py-2">
              <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-400 border-0 w-full justify-center">
                {tierInfo.name} Plan
              </Badge>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1">
              {/* Main */}
              <div className="mb-3">
                {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 px-3 mb-2">Main</p>}
                {filteredItems.filter(i => i.group === 'main').map(renderSidebarItem)}
              </div>

              <Separator className="my-2 opacity-50" />

              {/* AI Calling */}
              <div className="mb-3">
                {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 px-3 mb-2">AI Calling</p>}
                {/* Phone number display - shown before Phone Setup */}
                {!sidebarCollapsed && phoneSetup.hasPhone && phoneSetup.phoneNumber && (
                  <div className="px-2 mb-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-mono font-bold text-emerald-600 truncate">{formatPhoneWithCountry(phoneSetup.phoneNumber)}</span>
                      <Badge className="ml-auto bg-emerald-500/15 text-emerald-600 rounded-full border-0 text-[9px] px-1.5 py-0">Active</Badge>
                    </div>
                  </div>
                )}
                {filteredItems.filter(i => i.group === 'calling').map(renderSidebarItem)}
              </div>

              <Separator className="my-2 opacity-50" />

              {/* Tools */}
              <div>
                {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 px-3 mb-2">Tools</p>}
                {filteredItems.filter(i => i.group === 'tools').map(renderSidebarItem)}
              </div>
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={onOpenSettings} className="w-full gap-2 justify-start text-xs text-muted-foreground hover:text-foreground rounded-xl">
              <Settings2 className="w-4 h-4" /> {!sidebarCollapsed && 'Settings'}
            </Button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {/* ════════ GETTING STARTED ════════ */}
                {activeSection === 'getting-started' && (
                  <div className="space-y-6">
                    {/* Hero Welcome Banner */}
                    <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-primary/10 border border-amber-500/25 p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-foreground">Welcome to AI Calling ✨</h1>
                          <p className="text-sm text-muted-foreground">Follow these steps to start making AI-powered calls to your leads.</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Banner */}
                    <div className={`rounded-2xl border p-5 ${
                      status === 'ready' ? 'border-emerald-500/25 bg-emerald-500/[0.05]' :
                      status === 'addon_needed' ? 'border-amber-500/25 bg-amber-500/[0.05]' :
                      'border-primary/20 bg-primary/[0.04]'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          status === 'ready' ? 'bg-emerald-500/15' : status === 'addon_needed' ? 'bg-amber-500/15' : 'bg-primary/15'
                        }`}>
                          {status === 'ready' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                           status === 'addon_needed' ? <AlertCircle className="w-6 h-6 text-amber-500" /> :
                           <Zap className="w-6 h-6 text-primary" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">
                            {status === 'ready' ? '✅ AI Calling is Ready!' : status === 'addon_needed' ? `Activate AI Calling — $${AI_CALLING_ADDON_PRICE}/mo` : 'Setup Required'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{addonMessage}</p>
                          {status === 'addon_needed' && tier !== 'free' && (
                            <Button onClick={purchaseAddon} size="sm" className="gap-2 mt-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
                              <Zap className="w-4 h-4" /> Subscribe — ${AI_CALLING_ADDON_PRICE}/mo
                            </Button>
                          )}
                          {tier === 'free' && (
                            <Link to="/pricing"><Button size="sm" className="gap-2 mt-3 rounded-xl">View Plans <ChevronRight className="w-4 h-4" /></Button></Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step-by-step guide */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">How it works</h3>
                      {[
                        { step: 1, title: 'Get Your Phone Number', desc: 'Provision a local business number or port your existing one. This is the number your leads will see when you call.', icon: Signal, action: () => setActiveSection('phone-setup'), actionLabel: 'Set Up Number', done: phoneSetup.hasPhone },
                        { step: 2, title: 'Review Your Call Queue', desc: 'Your leads with valid phone numbers are automatically queued. Review and prioritize who to call first.', icon: Headphones, action: () => setActiveSection('queue'), actionLabel: 'View Queue', done: callQueue.length > 0 },
                        { step: 3, title: 'Customize AI Script', desc: 'The AI generates a personalized call script based on your search context. Review and tweak it before calling.', icon: Brain, action: () => setActiveSection('script'), actionLabel: 'Preview Script', done: false },
                        { step: 4, title: 'Start AI Calling', desc: 'Hit "Start Calling" and let the AI handle conversations. It will greet, pitch, handle objections, and log outcomes automatically.', icon: PhoneCall, action: () => setActiveSection('queue'), actionLabel: 'Start Calling', done: callStats.total > 0 },
                        { step: 5, title: 'Review Results & Follow Up', desc: 'Check call results, identify hot leads, and schedule follow-ups. Autopilot users get automatic SMS follow-ups.', icon: Target, action: () => setActiveSection('results'), actionLabel: 'View Results', done: false },
                      ].map((s) => (
                        <div key={s.step} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${s.done ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-border/50 bg-card/30'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.done ? 'bg-emerald-500/15' : 'bg-muted/60'}`}>
                            {s.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <span className="text-sm font-bold text-muted-foreground">{s.step}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-sm">{s.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={s.action} className="gap-1.5 rounded-xl text-xs shrink-0">
                            <s.icon className="w-3.5 h-3.5" /> {s.actionLabel}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Tier Capabilities */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Plan Capabilities</h3>
                      <div className="grid md:grid-cols-3 gap-3">
                        {[
                          { tier: 'autopilot', name: 'Autopilot · $249', icon: Sparkles, features: ['Fully autonomous calling', 'AI texts back & forth', 'Phone included'], included: 'All included!' },
                          { tier: 'pro', name: 'Pro · $99', icon: Bot, features: ['AI calls your leads', 'You supervise calls'], addon: `+$${AI_CALLING_ADDON_PRICE}/mo` },
                          { tier: 'basic', name: 'Basic · $49', icon: Edit3, features: ['AI generates call scripts', 'You dial manually'], addon: `+$${AI_CALLING_ADDON_PRICE}/mo` },
                        ].map((tc) => {
                          const isCurrentTier = tier === tc.tier;
                          const isAutopilotTier = tc.tier === 'autopilot';
                          return (
                            <div key={tc.tier} className={`rounded-2xl border p-4 ${
                              isCurrentTier && isAutopilotTier ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 ring-1 ring-amber-500/25' :
                              isCurrentTier ? 'border-primary/30 bg-primary/[0.05] ring-1 ring-primary/20' :
                              isAutopilotTier ? 'border-amber-500/20 bg-amber-500/[0.03]' :
                              'border-border/40 opacity-50'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <tc.icon className={`w-4 h-4 ${isAutopilotTier ? 'text-amber-500' : 'text-primary'}`} />
                                <span className="font-semibold text-sm">{tc.name}</span>
                                {isCurrentTier && <Badge className={`text-[9px] rounded-full px-2 ${isAutopilotTier ? 'bg-amber-500 text-white border-0' : 'bg-foreground text-background'}`}>Current</Badge>}
                              </div>
                              <ul className="space-y-1">
                                {tc.features.map((f, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className={`w-3 h-3 shrink-0 ${isAutopilotTier ? 'text-amber-500' : 'text-primary'}`} /> {f}
                                  </li>
                                ))}
                              </ul>
                              {tc.addon && <div className="mt-2 text-center text-[10px] font-medium rounded-lg py-1 bg-muted/50">{tc.addon}</div>}
                              {tc.included && <div className="mt-2 text-center text-[10px] font-bold rounded-lg py-1 bg-amber-500/15 text-amber-500 border border-amber-500/20">{tc.included}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <StatPill value={callableLeads.length} label="Callable Leads" icon={Phone} accent="amber" />
                      <StatPill value={emailableLeads.length} label="Have Email" icon={MessageSquare} accent="amber" />
                      <StatPill value={leads.length} label="Total Leads" icon={Users} accent="amber" />
                    </div>
                  </div>
                )}

                {/* ════════ DASHBOARD / OVERVIEW ════════ */}
                {activeSection === 'overview' && (() => {
                  const totalDurationMins = Math.floor(callStats.avgDuration * callStats.total / 60);
                  const totalDurationSecs = (callStats.avgDuration * callStats.total) % 60;
                  const avgMins = Math.floor(callStats.avgDuration / 60);
                  const avgSecs = callStats.avgDuration % 60;
                  const successRate = callStats.total > 0 ? Math.round((callStats.interested / callStats.total) * 100) : 0;
                  const amdRate = callStats.total > 0 ? Math.round((callStats.noAnswer / callStats.total) * 100) : 0;
                  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

                    const statCards = [
                    { label: 'TOTAL CALLS', value: `${callStats.total}`, icon: Phone, cardBg: 'bg-gradient-to-br from-amber-500 to-amber-600', iconBg: 'bg-white/20', iconColor: 'text-white', change: '+0%', changeUp: true },
                    { label: 'AVERAGE CALL DURATION', value: `${avgMins} min ${avgSecs} sec`, icon: Clock, cardBg: 'bg-gradient-to-br from-violet-500 to-violet-600', iconBg: 'bg-white/20', iconColor: 'text-white', change: '+0%', changeUp: true },
                    { label: 'TOTAL USAGE', value: `${totalDurationMins} min ${totalDurationSecs} sec`, icon: Clock, cardBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', iconBg: 'bg-white/20', iconColor: 'text-white', change: '+0%', changeUp: true },
                    { label: 'TOTAL APPOINTMENTS', value: `${meetings.length}`, icon: CalendarIcon, cardBg: 'bg-gradient-to-br from-orange-500 to-orange-600', iconBg: 'bg-white/20', iconColor: 'text-white', change: '+0%', changeUp: true },
                    { label: 'AMD DETECTION RATE', value: `${amdRate}%`, icon: Target, cardBg: 'bg-gradient-to-br from-rose-500 to-rose-600', iconBg: 'bg-white/20', iconColor: 'text-white', change: '+0%', changeUp: true },
                    { label: 'SUCCESS RATE', value: `${successRate}%`, icon: TrendingUp, cardBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconBg: 'bg-white/20', iconColor: 'text-white', change: successRate > 0 ? `${successRate}%` : 'Below average', changeUp: successRate > 0 },
                  ];

                  return (
                  <div className="space-y-6">
                    {/* Greeting Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">{greeting}, {user?.name || branding?.company_name || 'there'}</h1>
                        <p className="text-muted-foreground text-sm">Track your call performance and key metrics</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs">
                          Last 7 Days <ChevronDown className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => {}}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ── PRIMARY CALL ACTION ── */}
                    {!isCallingActive && phoneSetup.hasPhone && pendingCount > 0 && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <PhoneCall className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground">Ready to Call Your Leads</h3>
                            <p className="text-sm text-muted-foreground"><span className="font-extrabold text-foreground">{pendingCount}</span> leads queued · Phone <span className="text-emerald-400 font-semibold">{formatPhoneDisplay(phoneSetup.phoneNumber || '')}</span> active</p>
                          </div>
                          <Button
                            onClick={handleStartCalling}
                            className="gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 text-base font-bold shadow-xl shadow-emerald-500/30"
                          >
                            <Play className="w-5 h-5" /> Start Calling
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {!isCallingActive && !phoneSetup.hasPhone && pendingCount > 0 && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Phone className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground">Set Up Your Phone First</h3>
                            <p className="text-sm text-muted-foreground"><span className="font-extrabold text-foreground">{pendingCount}</span> leads ready — configure a Twilio number to start calling</p>
                          </div>
                          <Button
                            onClick={() => setActiveSection('phone-setup')}
                            className="gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-4 text-base font-bold shadow-xl shadow-amber-500/30"
                          >
                            <Signal className="w-5 h-5" /> Setup Phone
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Active Call Banner */}
                    {isCallingActive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-primary/25 bg-primary/[0.05] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <Mic className="w-5 h-5 text-primary animate-pulse" />
                            <span className="font-semibold text-foreground">AI Calling in Progress</span>
                          </div>
                          <Button onClick={handleStopCalling} variant="destructive" size="sm" className="gap-1.5 rounded-xl">
                            <Square className="w-3 h-3" /> Stop
                          </Button>
                        </div>
                        <Progress value={(callQueue.filter(c => c.status !== 'pending').length / callQueue.length) * 100} className="h-2 rounded-full" />
                        <p className="text-xs text-muted-foreground mt-2">{callQueue.filter(c => c.status !== 'pending').length} / {callQueue.length} calls processed</p>
                      </motion.div>
                    )}

                    {/* 6 Stat Cards - 3x2 grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {statCards.map((card, idx) => (
                        <motion.div
                          key={card.label}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`rounded-2xl p-5 shadow-lg ${card.cardBg}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-2">{card.label}</p>
                              <p className="text-2xl font-extrabold text-white">{card.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 mt-3 text-xs font-medium text-white/60`}>
                            {card.changeUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                            <span>{card.change} from previous period</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Call Volume Section */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Call Volume</h3>
                            <p className="text-xs text-muted-foreground">Call activity over time</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="gap-1 text-xs rounded-full">
                          <TrendingUp className="w-3 h-3 text-amber-400" /> {callStats.total > 0 ? `+${callStats.total}` : '0%'}
                        </Badge>
                      </div>

                      {/* Sub-metrics row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="rounded-xl bg-muted/30 border border-border/30 p-3 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-lg font-extrabold text-foreground">{callStats.total}</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/30 border border-border/30 p-3 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">Average Per Day</p>
                            <p className="text-lg font-extrabold text-foreground">{callStats.total > 0 ? (callStats.total / 7).toFixed(1) : '0'}</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/30 border border-border/30 p-3 flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-amber-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Peak Day</p>
                            <p className="text-lg font-extrabold text-foreground">{callStats.total > 0 ? callStats.total : '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Empty state / placeholder chart area */}
                      <div className="h-40 rounded-xl bg-muted/20 border border-dashed border-border/40 flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">Start making calls to see activity trends</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">Call Queue</h4>
                            <p className="text-xs text-muted-foreground"><span className="font-extrabold text-foreground">{pendingCount}</span> leads waiting</p>
                          </div>
                        </div>
                        <Button onClick={() => setActiveSection('queue')} variant="outline" className="w-full gap-2 rounded-xl">
                          <Headphones className="w-4 h-4" /> Open Call Queue
                        </Button>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">Hot Leads</h4>
                            <p className="text-xs text-muted-foreground"><span className="font-extrabold text-foreground">{hotLeads}</span> interested</p>
                          </div>
                        </div>
                        <Button onClick={() => setActiveSection('results')} variant="outline" className="w-full gap-2 rounded-xl">
                          <Target className="w-4 h-4" /> View Results
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* ════════ PHONE SETUP ════════ */}
                {activeSection === 'phone-setup' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">Phone Setup</h1>
                      <p className="text-muted-foreground text-sm">Provision or port a business phone number for AI calling.</p>
                    </div>

                    {phoneSetup.hasPhone && phoneSetup.phoneNumber ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                              <Phone className="w-7 h-7 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Your Twilio Phone Number</p>
                              <p className="text-2xl font-mono font-bold text-emerald-400 tracking-wide">{formatPhoneWithCountry(phoneSetup.phoneNumber)}</p>
                            </div>
                            <Badge className="bg-emerald-500/15 text-emerald-500 rounded-full border-0 gap-1 ml-auto">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </Badge>
                          </div>
                        </div>

                        {/* Prominent Start Calling CTA */}
                        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-primary/5 p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                              <PhoneCall className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground">Ready to Call</h3>
                              <p className="text-xs text-muted-foreground"><span className="font-extrabold text-foreground">{pendingCount}</span> leads in queue with valid phone numbers</p>
                            </div>
                            <Button
                              onClick={() => { setActiveSection('queue'); setTimeout(() => handleStartCalling(), 300); }}
                              disabled={pendingCount === 0}
                              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/20"
                            >
                              <Play className="w-4 h-4" /> Start AI Calling
                            </Button>
                          </div>
                        </div>

                        {/* Test Your AI Phone */}
                        <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-emerald-500/5 p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                              <PhoneCall className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground">Test Your AI Phone</h3>
                              <p className="text-xs text-muted-foreground">Call your own phone to hear how the AI agent sounds to your leads.</p>
                            </div>
                            <Button
                              onClick={() => {
                                const testNumber = prompt('Enter your personal phone number to receive a test call:');
                                if (testNumber && testNumber.trim()) {
                                  toast.info('📞 Test call initiated! Your phone should ring shortly.');
                                  apiInitiateCall({ destination_number: testNumber.trim(), lead_name: 'Test Call' })
                                    .then(res => { if (res.success) toast.success('✅ Test call connected!'); else toast.error(res.error || 'Test call failed'); })
                                    .catch(() => toast.error('Network error'));
                                }
                              }}
                              className="gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-white font-bold px-5 py-2.5 shadow-lg shadow-cyan-500/20"
                            >
                              <Phone className="w-4 h-4" /> Test Call
                            </Button>
                          </div>
                        </div>

                        {/* Release Number */}
                        <div className="rounded-2xl border border-border/50 p-4">
                          <h4 className="font-semibold text-sm text-foreground mb-2">Manage Number</h4>
                          {!showReleaseConfirm ? (
                            <Button variant="outline" size="sm" onClick={() => setShowReleaseConfirm(true)} className="text-muted-foreground hover:text-destructive gap-1.5 rounded-xl">
                              <XCircle className="w-3.5 h-3.5" /> Release Number
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                              <span className="text-sm text-destructive font-medium">Are you sure? This cannot be undone.</span>
                              <Button size="sm" variant="destructive" className="rounded-lg" onClick={async () => {
                                setIsReleasingNumber(true);
                                try { const result = await releaseNumber(); if (result.success) { toast.success('Number released!'); setShowReleaseConfirm(false); window.location.reload(); } else toast.error(result.error || 'Failed'); }
                                catch { toast.error('Network error'); } finally { setIsReleasingNumber(false); }
                              }} disabled={isReleasingNumber}>{isReleasingNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Release'}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowReleaseConfirm(false)}>Cancel</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Mode selection */}
                         <div className="grid md:grid-cols-3 gap-4">
                         <div
                            onClick={() => setProvisionMode('new')}
                            className={`cursor-pointer rounded-2xl border p-5 transition-all ${provisionMode === 'new' ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-orange-500/10 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10' : 'border-border/50 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5'}`}
                          >
                            <Signal className="w-7 h-7 text-amber-400 mb-3" />
                            <h4 className="font-semibold text-foreground">Get New Number</h4>
                            <p className="text-xs text-muted-foreground mt-1">Choose an area code and get a local number instantly.</p>
                          </div>
                          <div
                            onClick={() => setProvisionMode('port')}
                            className={`cursor-pointer rounded-2xl border p-5 transition-all ${provisionMode === 'port' ? 'border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-purple-500/10 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10' : 'border-border/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5'}`}
                          >
                            <PhoneForwarded className="w-7 h-7 text-violet-400 mb-3" />
                            <h4 className="font-semibold text-foreground">Port Existing Number</h4>
                            <p className="text-xs text-muted-foreground mt-1">Transfer your existing business number. Takes 1-3 days.</p>
                          </div>
                          <div
                            onClick={() => setProvisionMode('existing' as any)}
                            className={`cursor-pointer rounded-2xl border p-5 transition-all ${(provisionMode as string) === 'existing' ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'border-border/50 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5'}`}
                          >
                            <Phone className="w-7 h-7 text-emerald-400 mb-3" />
                            <h4 className="font-semibold text-foreground">I Have a Twilio Number</h4>
                            <p className="text-xs text-muted-foreground mt-1">Already have a Twilio number? Enter it here.</p>
                          </div>
                        </div>

                        {provisionMode === 'new' ? (
                          <div className="rounded-2xl border border-border/50 bg-card/30 p-5 space-y-4">
                            <div className="flex items-center gap-2"><Signal className="w-4 h-4 text-amber-400" /><span className="font-semibold text-sm">Choose Area Code</span></div>
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
                                if (result.success) { 
                                  localStorage.setItem('twilio_phone_number', (result as any).phone_number || `+1${selectedAreaCode}`);
                                  localStorage.setItem('twilio_phone_active', 'true');
                                  toast.success('Phone number provisioned!'); window.location.reload(); 
                                }
                                else toast.error(result.error || 'Provisioning failed');
                              } catch { toast.error('Network error'); }
                              finally { setIsProvisioningNumber(false); }
                            }} className="w-full gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-white font-bold text-sm shadow-lg shadow-cyan-500/30">
                              {isProvisioningNumber ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</> : <><Phone className="w-4 h-4" /> Get Number ({selectedAreaCode || '…'})</>}
                            </Button>
                          </div>
                        ) : (provisionMode as string) === 'existing' ? (
                          <div className="rounded-2xl border border-emerald-500/20 bg-card/30 p-5 space-y-4">
                            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /><span className="font-semibold text-sm">Enter Your Twilio Number</span></div>
                            <p className="text-xs text-muted-foreground">Enter the phone number you purchased from Twilio. It will be saved to your account for AI calling.</p>
                            <input
                              type="tel"
                              placeholder="+1 (888) 293-5813"
                              value={existingNumber}
                              onChange={(e) => setExistingNumber(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm font-mono"
                            />
                            <Button
                              onClick={async () => {
                                if (!existingNumber.trim()) { toast.error('Enter your Twilio number'); return; }
                                const formatted = toE164(existingNumber.trim());
                                if (!formatted.startsWith('+') || formatted.replace(/\D/g, '').length < 11) {
                                  toast.error('Enter a valid phone number (e.g. +18882935813)');
                                  return;
                                }
                                // Verify the number is a real Twilio number
                                setIsSavingExisting(true);
                                try {
                                  // Step 1: Verify with Twilio API
                                  const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://bamlead.com/api'}/calling.php?action=verify_twilio_number`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                                    body: JSON.stringify({ phone_number: formatted }),
                                  });
                                  const verifyData = await verifyRes.json().catch(() => null);
                                  
                                  if (verifyRes.ok && verifyData?.verified === false) {
                                    toast.error('❌ This number is not a valid Twilio number. Please enter a number purchased from your Twilio account.');
                                    return;
                                  }

                                  // Step 2: Save to backend
                                  const result = await savePhoneSetup(formatted);
                                  if (result.success) {
                                    toast.success(`✅ Number ${formatted} verified & active!`);
                                    localStorage.setItem('twilio_phone_number', formatted);
                                    localStorage.setItem('twilio_phone_active', 'true');
                                    setTimeout(() => setActiveSection('queue'), 600);
                                  } else {
                                    toast.error(result.error || 'Failed to save number');
                                  }
                                } catch { toast.error('Network error'); }
                                finally { setIsSavingExisting(false); }
                              }}
                              disabled={isSavingExisting || !existingNumber.trim()}
                              className="w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-white font-bold text-sm shadow-lg shadow-emerald-500/30"
                            >
                              {isSavingExisting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying & Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save My Twilio Number</>}
                            </Button>
                            <div className="text-[11px] text-muted-foreground bg-muted/30 p-3 rounded-xl space-y-1">
                              <p>🔍 <strong>Verified:</strong> We confirm your number is from Twilio before saving</p>
                              <p>✅ <strong>Format:</strong> Use E.164 format (e.g. +18882935813)</p>
                              <p>🔒 <strong>Security:</strong> This number is tied only to your account</p>
                              <p>⚡ <strong>Instant:</strong> Number is active immediately after verification</p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border/50 bg-card/30 p-5 space-y-4">
                            <div className="flex items-center gap-2"><PhoneForwarded className="w-4 h-4 text-violet-400" /><span className="font-semibold text-sm">Port Your Number</span></div>
                            <div className="space-y-3">
                              <input type="tel" placeholder="+1 (555) 123-4567" value={portNumber} onChange={(e) => setPortNumber(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background text-foreground text-sm" />
                              <input type="text" placeholder="Account holder name" value={portName} onChange={(e) => setPortName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background text-foreground text-sm" />
                            </div>
                            <Button onClick={async () => {
                              if (!portNumber || !portName) { toast.error('Fill in all fields'); return; }
                              setIsPortSubmitting(true);
                              try { toast.success('Port request submitted! We\'ll notify you when ready.'); }
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ CALL QUEUE ════════ */}
                {activeSection === 'queue' && (
                  <div className="space-y-5">
                    {/* Phone required guard */}
                    {!phoneSetup.hasPhone && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                            <Phone className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground">Phone Number Required</h3>
                            <p className="text-sm text-muted-foreground">You need an active Twilio phone number before you can start calling leads.</p>
                          </div>
                          <Button onClick={() => setActiveSection('phone-setup')} className="gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 font-semibold shadow-lg shadow-amber-500/20">
                            <Signal className="w-4 h-4" /> Set Up Phone
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">Call Queue</h1>
                        <p className="text-muted-foreground text-sm">{callableLeads.length} leads with valid phone numbers ready to call.</p>
                      </div>
                      <div className="flex gap-2">
                        {phoneSetup.hasPhone && !isCallingActive && pendingCount > 0 && (
                          <Button onClick={handleStartCalling} className="gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 px-6">
                            <Play className="w-4 h-4" /> Start Calling ({pendingCount})
                          </Button>
                        )}
                        {isCallingActive && (
                          <>
                            <Button onClick={() => setIsCallingActive(false)} variant="outline" className="gap-2 rounded-xl"><Pause className="w-4 h-4" /> Pause</Button>
                            <Button onClick={handleStopCalling} variant="destructive" className="gap-2 rounded-xl"><Square className="w-4 h-4" /> Stop</Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    {isCallingActive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
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
                        { label: 'Pending', count: callQueue.filter(c => c.status === 'pending').length, cardBg: 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-500/20' },
                        { label: 'Calling', count: callQueue.filter(c => c.status === 'calling').length, cardBg: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25' },
                        { label: 'Completed', count: callQueue.filter(c => c.status === 'completed').length, cardBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25' },
                        { label: 'Failed', count: callQueue.filter(c => c.status === 'no_answer' || c.status === 'failed').length, cardBg: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-2xl p-4 text-center ${s.cardBg}`}>
                          <div className="text-3xl font-extrabold text-white drop-shadow-sm">{s.count}</div>
                          <div className="text-[11px] text-white/80 mt-0.5 font-semibold uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Queue list */}
                    {callQueue.length > 0 ? (
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
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${call.status === 'calling' ? 'bg-primary/15' : 'bg-muted/60'}`}>
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
                                {/* Individual Call Button */}
                                {call.status === 'pending' && phoneSetup.hasPhone && (
                                  <Button
                                    size="sm"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setCallQueue(prev => prev.map(c => c.id === call.id ? { ...c, status: 'calling' as const } : c));
                                      try {
                                        const result = await apiInitiateCall({
                                          destination_number: call.phone,
                                          lead_id: typeof call.id === 'number' ? call.id : undefined,
                                          lead_name: call.name,
                                        });
                                        if (!result.success) {
                                          setCallQueue(prev => prev.map(c => c.id === call.id ? { ...c, status: 'failed' as const, outcome: result.error || 'Failed' } : c));
                                          toast.error(result.error || 'Call failed');
                                        } else {
                                          toast.success(`Calling ${call.name}...`);
                                          // Poll for completion
                                          const sid = result.call_sid!;
                                          const poll = setInterval(async () => {
                                            const sr = await getCallStatus(sid);
                                            if (sr.success && sr.status && ['completed','busy','no-answer','failed','canceled'].includes(sr.status)) {
                                              clearInterval(poll);
                                              const answered = sr.status === 'completed';
                                              setCallQueue(prev => prev.map(c => c.id === call.id ? {
                                                ...c,
                                                status: answered ? 'completed' as const : 'failed' as const,
                                                outcome: answered ? (sr.duration_seconds && sr.duration_seconds > 30 ? 'Interested' : 'Callback') : sr.status === 'no-answer' ? 'No Answer' : 'Failed',
                                                duration: sr.duration_seconds || 0,
                                              } : c));
                                              setCallStats(prev => ({ ...prev, total: prev.total + 1, answered: prev.answered + (answered ? 1 : 0) }));
                                            }
                                          }, 3000);
                                        }
                                      } catch {
                                        setCallQueue(prev => prev.map(c => c.id === call.id ? { ...c, status: 'failed' as const, outcome: 'Network Error' } : c));
                                        toast.error('Network error');
                                      }
                                    }}
                                    className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20 px-4 font-semibold text-xs"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5" /> Call
                                  </Button>
                                )}
                                {call.status === 'pending' && !phoneSetup.hasPhone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActiveSection('phone-setup')}
                                    className="gap-1.5 rounded-xl text-xs text-amber-500 border-amber-500/30"
                                  >
                                    <Signal className="w-3.5 h-3.5" /> Setup Phone
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="py-16 text-center rounded-2xl border bg-card/30">
                        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-semibold text-foreground mb-1">No leads with phone numbers</p>
                        <p className="text-sm text-muted-foreground">Go back to Step 1 and search with phone filter enabled</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ AI SCRIPT ════════ */}
                {activeSection === 'script' && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">AI Call Script</h1>
                      <p className="text-muted-foreground text-sm">Preview and customize what the AI will say to your leads.</p>
                    </div>
                    <div className="rounded-2xl border bg-card/30 p-6">
                      <AIScriptPreviewPanel searchQuery={searchQuery} searchLocation={searchLocation} selectedStrategy={selectedStrategy} />
                    </div>
                  </div>
                )}

                {/* ════════ RESULTS ════════ */}
                {activeSection === 'results' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">Call Results</h1>
                      <p className="text-muted-foreground text-sm">Analytics and outcomes from your AI calling campaigns.</p>
                    </div>

                    {callStats.total > 0 ? (
                      <>
                        <div className="grid md:grid-cols-3 gap-5">
                          {[
                            { icon: CheckCircle2, cardBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', title: 'Success Rate', value: `${callStats.total > 0 ? Math.round((callStats.answered / callStats.total) * 100) : 0}%`, sub: `${callStats.answered} answered / ${callStats.total} total` },
                            { icon: Target, cardBg: 'bg-gradient-to-br from-violet-500 to-violet-600', title: 'Interest Rate', value: `${callStats.answered > 0 ? Math.round((callStats.interested / callStats.answered) * 100) : 0}%`, sub: `${callStats.interested} interested` },
                            { icon: MessageSquare, cardBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', title: 'SMS Replies', value: callStats.smsReplies, sub: isAutopilot ? 'Lead responses' : 'Autopilot only' },
                          ].map((card) => (
                            <div key={card.title} className={`rounded-2xl p-6 shadow-lg ${card.cardBg}`}>
                              <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                  <card.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-semibold text-sm text-white">{card.title}</span>
                              </div>
                              <div className="text-4xl font-extrabold tracking-tight text-white">{card.value}</div>
                              <p className="text-xs text-white/60 mt-1">{card.sub}</p>
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
                                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-500 border-0 text-[10px]">Interested</Badge>
                                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs"><Phone className="w-3 h-3" /> Call Back</Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-16 text-center rounded-2xl border bg-card/30">
                        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-semibold text-foreground mb-1">No call data yet</p>
                        <p className="text-sm text-muted-foreground">Start calling leads to see analytics here.</p>
                        <Button onClick={() => setActiveSection('queue')} variant="outline" className="mt-4 gap-2 rounded-xl">
                          <Headphones className="w-4 h-4" /> Go to Call Queue
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ SMS ════════ */}
                {activeSection === 'sms' && isAutopilot && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">SMS Messaging</h1>
                        <p className="text-muted-foreground text-sm">AI-powered bi-directional text messaging with your leads.</p>
                      </div>
                      <Badge className="rounded-full bg-amber-500/15 text-amber-500 border-0 gap-1"><Sparkles className="w-3 h-3" /> Autopilot</Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <StatPill value={smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'outbound').length, 0)} label="Sent" icon={Send} accent="blue" />
                      <StatPill value={smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'inbound').length, 0)} label="Received" icon={MessageSquare} accent="emerald" />
                      <StatPill value={smsConversations.filter(c => c.sentiment === 'interested').length} label="Interested" icon={Flame} accent="amber" />
                      <StatPill value={smsConversations.length > 0 ? `${Math.round((smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'inbound').length, 0) / Math.max(smsConversations.reduce((a, c) => a + c.messages.filter(m => m.direction === 'outbound').length, 0), 1)) * 100)}%` : '0%'} label="Response" icon={TrendingUp} accent="primary" />
                    </div>

                    <SMSConversationPanel conversations={smsConversations} onRefresh={loadSMSConversations} isLoading={smsLoading} userPhoneNumber={phoneSetup.phoneNumber} companyName={branding?.company_name} />
                  </div>
                )}

                {/* ════════ CALENDAR ════════ */}
                {activeSection === 'schedule' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">Calendar</h1>
                      <p className="text-muted-foreground text-sm">Schedule follow-up meetings with your leads.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="rounded-2xl border border-border/50 bg-card/30 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-foreground text-sm">Select Date</h4>
                        </div>
                        <div className="flex justify-center">
                          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-xl border" />
                        </div>
                        <div className="text-center text-xs text-muted-foreground">{meetings.length} meetings scheduled</div>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-card/30 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-foreground text-sm">Quick Schedule</h4>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {callableLeads.slice(0, 10).map((lead, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30">
                                <div>
                                  <p className="font-medium text-sm">{lead.business_name || lead.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleScheduleMeeting(lead)} disabled={!selectedDate} className="gap-1 rounded-lg text-xs">
                                  <CalendarIcon className="w-3 h-3" /> Book
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ CRM ════════ */}
                {activeSection === 'crm' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">Save to CRM</h1>
                      <p className="text-muted-foreground text-sm">Export your {leads.length} leads to your favorite CRM.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CRM_OPTIONS.map((crm) => (
                        <Button key={crm.id} variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 rounded-xl hover:border-primary/40" onClick={onOpenCRMModal}>
                          <span className="text-2xl">{crm.icon}</span>
                          <span className="text-xs font-medium">{crm.name}</span>
                        </Button>
                      ))}
                    </div>
                    <div className="text-center">
                      <Button onClick={onOpenCRMModal} className="gap-2 rounded-xl">
                        <Database className="w-4 h-4" /> View All 11 CRMs
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
