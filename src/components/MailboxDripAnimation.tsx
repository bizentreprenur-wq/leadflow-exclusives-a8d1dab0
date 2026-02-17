import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, Clock, Zap, Shield, AlertCircle, RefreshCw, Pause, Play, Send, ChevronDown, User, Building2, Inbox, ArrowRight, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSends, processMyScheduledEmails } from '@/lib/api/email';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EmailStatus =
  | 'pending'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'failed'
  | 'bounced'
  | 'cancelled';
type LeadCategory = 'hot' | 'warm' | 'cold';
type LeadScope = 'hot' | 'warm' | 'cold' | 'hot_warm' | 'all';

interface Lead {
  id: string;
  name: string;
  email?: string;
  business?: string;
  category?: LeadCategory;
  verified?: boolean;
}

interface MailboxDripAnimationProps {
  totalEmails: number;
  sentCount: number;
  isActive: boolean;
  emailsPerHour?: number;
  leads?: Lead[];
  onEmailStatusUpdate?: (statuses: Record<string, EmailStatus>) => void;
  realSendingMode?: boolean;
  campaignId?: string;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onSend?: () => void;
  onPreview?: () => void;
  showControls?: boolean;
  renderAfterBanner?: React.ReactNode;
  onOpenMailbox?: () => void;
}

export default function MailboxDripAnimation({
  totalEmails,
  sentCount,
  isActive,
  emailsPerHour = 50,
  leads = [],
  onEmailStatusUpdate,
  realSendingMode = false,
  isPaused = false,
  onPause,
  onResume,
  onSend,
  onPreview,
  showControls = true,
  renderAfterBanner,
  onOpenMailbox,
}: MailboxDripAnimationProps) {
  const [flyingEmails, setFlyingEmails] = useState<number[]>([]);
  const [emailId, setEmailId] = useState(0);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(0);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, EmailStatus>>({});
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [deliveryStats, setDeliveryStats] = useState({ sent: 0, delivered: 0, failed: 0, bounced: 0 });
  const [backendQueueStats, setBackendQueueStats] = useState({ scheduledTotal: 0, scheduledDue: 0 });
  const [leadScope, setLeadScope] = useState<LeadScope>('all');
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);

  // Scope labels
  const scopeLabels: Record<LeadScope, string> = {
    hot: 'Hot Leads',
    warm: 'Warm Leads',
    cold: 'Cold Leads',
    hot_warm: 'Hot + Warm',
    all: 'All Verified Leads',
  };

  // Filter leads by scope
  const getFilteredLeads = useCallback(() => {
    const leadsWithEmail = leads.filter(l => l.email);
    switch (leadScope) {
      case 'hot':
        return leadsWithEmail.filter(l => l.category === 'hot');
      case 'warm':
        return leadsWithEmail.filter(l => l.category === 'warm');
      case 'cold':
        return leadsWithEmail.filter(l => l.category === 'cold');
      case 'hot_warm':
        return leadsWithEmail.filter(l => l.category === 'hot' || l.category === 'warm');
      default:
        return leadsWithEmail;
    }
  }, [leads, leadScope]);

  const filteredLeads = getFilteredLeads();
  const verifiedCount = filteredLeads.filter(l => l.verified !== false).length;
  const userApprovedCount = filteredLeads.filter(l => l.verified === false).length;
  const COMPLETED_STATUSES = new Set<EmailStatus>(['sent', 'delivered', 'opened', 'clicked', 'replied']);
  const PENDING_STATUSES = new Set<EmailStatus>(['pending', 'scheduled', 'sending']);

  const normalizeStatus = useCallback((value: string | undefined): EmailStatus => {
    const v = String(value || '').toLowerCase();
    if (v === 'scheduled') return 'scheduled';
    if (v === 'sending') return 'sending';
    if (v === 'sent') return 'sent';
    if (v === 'delivered') return 'delivered';
    if (v === 'opened') return 'opened';
    if (v === 'clicked') return 'clicked';
    if (v === 'replied') return 'replied';
    if (v === 'bounced') return 'bounced';
    if (v === 'failed') return 'failed';
    if (v === 'cancelled') return 'cancelled';
    return 'pending';
  }, []);

  // Initialize email statuses from leads
  useEffect(() => {
    if (leads.length > 0) {
      const initialStatuses: Record<string, EmailStatus> = {};
      leads.forEach(lead => {
        if (lead.email) {
          initialStatuses[lead.id] = 'pending';
        }
      });
      setEmailStatuses(initialStatuses);
      setCurrentSendingIndex(0);
      return;
    }

    setEmailStatuses({});
    setCurrentSendingIndex(0);
    setDeliveryStats({ sent: 0, delivered: 0, failed: 0, bounced: 0 });
    setBackendQueueStats({ scheduledTotal: 0, scheduledDue: 0 });
    setLastSentTime(null);
  }, [leads]);

  // Poll backend for real delivery status
  const pollDeliveryStatus = useCallback(async () => {
    if (!realSendingMode || !isActive) return;
    
    setIsPolling(true);
    try {
      if (!isPaused) {
        await processMyScheduledEmails(12);
      }

      const result = await getSends({ limit: 100, status: undefined });
      
      if (result.success && result.sends) {
        const normalizeEmail = (email?: string) => String(email || '').trim().toLowerCase();
        const leadsByEmail = new Map<string, Lead>();
        filteredLeads.forEach((lead) => {
          const key = normalizeEmail(lead.email);
          if (key && !leadsByEmail.has(key)) {
            leadsByEmail.set(key, lead);
          }
        });

        // Default all visible leads to pending each poll, then override from backend.
        const newStatuses: Record<string, EmailStatus> = {};
        filteredLeads.forEach((lead) => {
          newStatuses[lead.id] = 'pending';
        });

        let sentCount = 0;
        let deliveredCount = 0;
        let failedCount = 0;
        let bouncedCount = 0;
        let scheduledTotal = 0;
        let scheduledDue = 0;
        const nowTs = Date.now();
        const seenLeadIds = new Set<string>();

        result.sends.forEach((send: any) => {
          const key = normalizeEmail(send.recipient_email);
          const matchingLead = leadsByEmail.get(key);
          if (!matchingLead || seenLeadIds.has(matchingLead.id)) {
            return;
          }

          const status = normalizeStatus(send.status);
          newStatuses[matchingLead.id] = status;
          seenLeadIds.add(matchingLead.id);

          if (status === 'sent') sentCount++;
          else if (status === 'delivered') deliveredCount++;
          else if (status === 'failed') failedCount++;
          else if (status === 'bounced') bouncedCount++;

          if (status === 'scheduled') {
            scheduledTotal++;
            const scheduledFor = send.scheduled_for ? new Date(send.scheduled_for).getTime() : NaN;
            if (!Number.isNaN(scheduledFor) && scheduledFor <= nowTs) {
              scheduledDue++;
            }
          }
        });

        setEmailStatuses(newStatuses);
        setDeliveryStats({ sent: sentCount, delivered: deliveredCount, failed: failedCount, bounced: bouncedCount });
        setBackendQueueStats({ scheduledTotal, scheduledDue });
        onEmailStatusUpdate?.(newStatuses);
        setLastPollTime(new Date());
      }
    } catch (error) {
      console.error('Failed to poll delivery status:', error);
    } finally {
      setIsPolling(false);
    }
  }, [realSendingMode, isActive, isPaused, filteredLeads, normalizeStatus, onEmailStatusUpdate]);

  // Auto-poll every 5 seconds in real sending mode
  useEffect(() => {
    if (!realSendingMode || !isActive) return;
    pollDeliveryStatus();
    const pollInterval = setInterval(pollDeliveryStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [realSendingMode, isActive, pollDeliveryStatus]);

  // Simulate sending each lead's email (demo mode only)
  useEffect(() => {
    if (realSendingMode || !isActive || isPaused || filteredLeads.length === 0) return;

    if (currentSendingIndex >= filteredLeads.length) return;

    const interval = setInterval(() => {
      if (currentSendingIndex < filteredLeads.length) {
        const currentLead = filteredLeads[currentSendingIndex];
        
        setEmailStatuses(prev => ({ ...prev, [currentLead.id]: 'sending' }));
        setLastSentTime(new Date());
        
        setTimeout(() => {
          setEmailStatuses(prev => {
            const updated = { ...prev, [currentLead.id]: 'sent' as const };
            onEmailStatusUpdate?.(updated);
            return updated;
          });
        }, 1500);
        
        setCurrentSendingIndex(prev => prev + 1);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [realSendingMode, isActive, isPaused, currentSendingIndex, filteredLeads, onEmailStatusUpdate]);

  // Flying email animation
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setEmailId(prev => prev + 1);
      setFlyingEmails(prev => [...prev, emailId]);
      
      setTimeout(() => {
        setFlyingEmails(prev => prev.filter(id => id !== emailId));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [isActive, isPaused, emailId]);

  // Calculate stats
  const actualSentCount = Object.values(emailStatuses).filter((s) => COMPLETED_STATUSES.has(s)).length;
  const progress = filteredLeads.length > 0 ? (actualSentCount / filteredLeads.length) * 100 : 0;
  const pendingCount = filteredLeads.reduce((count, lead) => {
    const status = emailStatuses[lead.id] || 'pending';
    return count + (PENDING_STATUSES.has(status) ? 1 : 0);
  }, 0);
  const etaMinutes = Math.ceil(pendingCount / emailsPerHour * 60);
  const etaHours = Math.floor(etaMinutes / 60);
  const etaRemainingMins = etaMinutes % 60;

  // Get current sending, last sent, and up next leads
  const sendingNowIndex = filteredLeads.findIndex((l) => {
    const status = emailStatuses[l.id] || 'pending';
    return status === 'sending' || status === 'scheduled' || status === 'pending';
  });
  const lastSentIndex = (() => {
    for (let i = filteredLeads.length - 1; i >= 0; i--) {
      const status = emailStatuses[filteredLeads[i].id] || 'pending';
      if (COMPLETED_STATUSES.has(status)) {
        return i;
      }
    }
    return -1;
  })();
  const lastSentLead = lastSentIndex >= 0 ? filteredLeads[lastSentIndex] : null;
  const sendingNowLead = sendingNowIndex >= 0 ? filteredLeads[sendingNowIndex] : null;
  const upNextLead = sendingNowIndex >= 0 && sendingNowIndex + 1 < filteredLeads.length ? filteredLeads[sendingNowIndex + 1] : null;
  const sendingNowStatus: EmailStatus = sendingNowLead ? (emailStatuses[sendingNowLead.id] || 'pending') : 'pending';
  const likelyStalledQueue = realSendingMode && isActive && backendQueueStats.scheduledDue > 0 && actualSentCount === 0;

  // Time since last sent
  const getTimeSince = (date: Date | null) => {
    if (!date) return null;
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  };

  // ETA for next email
  const getNextEta = () => {
    const secondsPerEmail = 3600 / emailsPerHour;
    return `in ${Math.round(secondsPerEmail)}s`;
  };

  return (
    <div className="space-y-4">
      {/* Lead Scope Selector - TOP PRIORITY */}
      <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
                {scopeLabels[leadScope]}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-600">
              <DropdownMenuItem onClick={() => setLeadScope('hot')} className="text-red-400 hover:bg-slate-700">
                🔥 Hot Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLeadScope('warm')} className="text-amber-400 hover:bg-slate-700">
                🌡️ Warm Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLeadScope('cold')} className="text-blue-400 hover:bg-slate-700">
                ❄️ Cold Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLeadScope('hot_warm')} className="text-orange-400 hover:bg-slate-700">
                🔥🌡️ Hot + Warm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLeadScope('all')} className="text-emerald-400 hover:bg-slate-700">
                ✅ All Verified Leads
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Leads Selected:</span>
              <span className="font-bold text-white">{filteredLeads.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">AI-Verified:</span>
              <span className="font-bold text-emerald-400">{verifiedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Unverified (User Approved):</span>
              <span className="font-bold text-amber-400">{userApprovedCount}</span>
            </div>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Button onClick={onResume} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
              ) : (
                <Button onClick={onPause} size="sm" variant="outline" className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              <Button onClick={onSend} size="sm" className="gap-2 bg-primary hover:bg-primary/90" disabled={isActive && !isPaused}>
                <Send className="w-4 h-4" />
                Send Now
              </Button>
              {!realSendingMode && (
                <Button
                  onClick={onPreview}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content injected after the banner */}
      {renderAfterBanner}

      {/* HEADER: Smart Drip Campaign with TOTAL as anchor */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Smart Drip Campaign</h2>
          <p className="text-slate-400">BamLead is sending emails slowly to improve deliverability</p>
        </div>

        {/* ANCHOR NUMBER - Total Leads */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <motion.div
              animate={{ scale: isActive && !isPaused ? [1, 1.02, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border-4 border-cyan-400/50 flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-4xl font-bold text-cyan-400">{filteredLeads.length}</p>
                <p className="text-xs text-slate-400">leads queued</p>
              </div>
            </motion.div>
            {isActive && !isPaused && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
        </div>

        {/* PROGRESS BAR: Queue → Live → Delivered */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between mb-2">
            {/* Queue - Clickable to open mailbox */}
            <button
              type="button"
              onClick={onOpenMailbox}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
              aria-label="Open mailbox queue"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-1 group-hover:bg-cyan-500/30 group-hover:border-cyan-400 transition-all duration-200 group-hover:scale-105">
                <Inbox className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs text-cyan-400 font-medium group-hover:text-cyan-300">Queue</p>
              <p className="text-lg font-bold text-white">{pendingCount}</p>
            </button>

            {/* Progress Track */}
            <div className="flex-1 mx-4 relative">
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  animate={{ opacity: isActive ? [0.8, 1, 0.8] : 1 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              <p className="text-center text-sm text-slate-400 mt-1">Sending Now</p>
              
              {/* Flying emails */}
              <AnimatePresence>
                {flyingEmails.map((id) => (
                  <motion.div
                    key={id}
                    initial={{ left: '0%', top: -20, opacity: 0, scale: 0.5 }}
                    animate={{ 
                      left: ['0%', '50%', '100%'],
                      top: [-20, -25, -20],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute"
                  >
                    <div className="w-8 h-6 bg-white rounded shadow-lg shadow-primary/40 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Delivered - Clickable to open mailbox */}
            <button
              type="button"
              onClick={onOpenMailbox}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
              aria-label="Open mailbox delivered"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mb-1 relative group-hover:bg-emerald-500/30 group-hover:border-emerald-400 transition-all duration-200 group-hover:scale-105">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                {actualSentCount > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </div>
              <p className="text-xs text-emerald-400 font-medium group-hover:text-emerald-300">Delivered</p>
              <p className="text-lg font-bold text-white">{actualSentCount}</p>
            </button>
          </div>

          {/* Percentage markers */}
          <div className="flex justify-between px-16 mt-1">
            <span className="text-xs text-slate-500">0%</span>
            <span className="text-xs text-slate-400 font-medium">{Math.round(progress)}%</span>
            <span className="text-xs text-slate-500">100%</span>
          </div>
        </div>

        {/* 3-COLUMN TIMELINE: Last Sent | Sending Now | Up Next */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Last Sent */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Last Sent</span>
            </div>
            {lastSentLead ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{lastSentLead.name}</p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {lastSentLead.business || 'Unknown Business'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{lastSentLead.email}</p>
                  <p className="text-xs text-emerald-400 mt-1">{getTimeSince(lastSentTime)}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No emails sent yet</p>
            )}
          </div>

          {/* Sending Now */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-xl p-4 border-2 border-cyan-400/50 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">Sending Now</span>
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-xs text-cyan-400"
                >
                  •••
                </motion.span>
              </div>
              {sendingNowLead && isActive && !isPaused ? (
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ scale: sendingNowStatus === 'sending' ? [1, 1.1, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-10 h-10 rounded-full bg-cyan-500/30 flex items-center justify-center flex-shrink-0"
                  >
                    <User className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{sendingNowLead.name}</p>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {sendingNowLead.business || 'Unknown Business'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{sendingNowLead.email}</p>
                    {sendingNowStatus === 'sending' ? (
                      <motion.p
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="text-xs text-cyan-400 mt-1"
                      >
                        Sending...
                      </motion.p>
                    ) : (
                      <p className="text-xs text-amber-400 mt-1">Queued...</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">{isPaused ? 'Paused' : 'Ready to send'}</p>
              )}
            </div>
          </div>

          {/* Up Next */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Up Next</span>
            </div>
            {upNextLead ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{upNextLead.name}</p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {upNextLead.business || 'Unknown Business'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{upNextLead.email}</p>
                  <p className="text-xs text-amber-400 mt-1">{getNextEta()}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Queue complete</p>
            )}
          </div>
        </div>

        {/* Stats Row: Total | Pending | Sent | ETA */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <Mail className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{filteredLeads.length}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{actualSentCount}</p>
            <p className="text-xs text-slate-500">Sent</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <Zap className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">
              {etaHours > 0 ? `${etaHours}h ${etaRemainingMins}m` : `${etaMinutes}m`}
            </p>
            <p className="text-xs text-slate-500">ETA</p>
          </div>
        </div>

        {/* Real-time stats if in live mode */}
        {realSendingMode && (deliveryStats.sent > 0 || deliveryStats.delivered > 0 || deliveryStats.failed > 0) && (
          <div className="grid grid-cols-4 gap-2 mb-6 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-400">{deliveryStats.sent}</p>
              <p className="text-xs text-slate-400">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-400">{deliveryStats.delivered}</p>
              <p className="text-xs text-slate-400">Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-400">{deliveryStats.failed}</p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-400">{deliveryStats.bounced}</p>
              <p className="text-xs text-slate-400">Bounced</p>
            </div>
            {lastPollTime && (
              <div className="col-span-4 flex items-center justify-center gap-2 text-xs text-slate-400 mt-2">
                <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin' : ''}`} />
                Last updated: {lastPollTime.toLocaleTimeString()}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pollDeliveryStatus}
                  disabled={isPolling}
                  className="h-6 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EXPLANATION: Why emails are drip-fed (always visible, not hidden) */}
      <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Emails are drip-fed intentionally
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              This protects your sender reputation and increases inbox placement. Sending too fast triggers spam filters — BamLead sends like a human, not a spam tool.
            </p>
          </div>
        </div>

        {/* AI Warmup indicator */}
        {isActive && actualSentCount < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <Zap className="w-5 h-5 text-amber-400" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-amber-400">AI warming & testing delivery...</p>
              <p className="text-xs text-slate-400">Sending test batch to optimize timing</p>
            </div>
          </motion.div>
        )}

        {likelyStalledQueue && (
          <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Queue is due but sender worker is not processing</p>
              <p className="text-xs text-slate-400">
                Scheduled emails are ready. Check `cron-email.php`/`process-scheduled` cron job on the server.
                ({backendQueueStats.scheduledDue} due / {backendQueueStats.scheduledTotal} scheduled)
              </p>
            </div>
          </div>
        )}

        {/* Campaign speed summary */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Sending <span className="text-white font-semibold">{emailsPerHour} emails/hour</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              1 email every <span className="text-primary font-semibold">{Math.round(3600 / emailsPerHour)}s</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-medium">99% inbox rate</span>
          </div>
        </div>
      </div>

      {/* Failed/bounced alert if any */}
      {(deliveryStats.failed > 0 || deliveryStats.bounced > 0) && (
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-400">Some emails failed to deliver</p>
            <p className="text-sm text-slate-400">
              {deliveryStats.failed} failed, {deliveryStats.bounced} bounced. Check recipient emails for typos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
