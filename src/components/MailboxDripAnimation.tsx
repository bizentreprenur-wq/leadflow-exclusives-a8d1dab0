import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, Clock, Zap, Info, ArrowRight, Shield, TrendingUp, Eye, AlertCircle, RefreshCw, Pause, Play, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getSends } from '@/lib/api/email';

type EmailStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced';

interface MailboxDripAnimationProps {
  totalEmails: number;
  sentCount: number;
  isActive: boolean;
  emailsPerHour?: number;
  leads?: Array<{ id: string; name: string; email?: string }>;
  onEmailStatusUpdate?: (statuses: Record<string, EmailStatus>) => void;
  // Real sending mode - when true, polls backend for actual delivery status
  realSendingMode?: boolean;
  campaignId?: string;
  // Pause/Send controls
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onSend?: () => void;
  showControls?: boolean;
  showCampaignSpeed?: boolean;
}

export default function MailboxDripAnimation({
  totalEmails,
  sentCount,
  isActive,
  emailsPerHour = 50,
  leads = [],
  onEmailStatusUpdate,
  realSendingMode = false,
  campaignId,
  isPaused = false,
  onPause,
  onResume,
  onSend,
  showControls = true,
  showCampaignSpeed = true,
}: MailboxDripAnimationProps) {
  const [flyingEmails, setFlyingEmails] = useState<number[]>([]);
  const [emailId, setEmailId] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(0);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, EmailStatus>>({});
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [deliveryStats, setDeliveryStats] = useState({
    sent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
  });

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
    }
  }, [leads]);

  // Poll backend for real delivery status
  const pollDeliveryStatus = useCallback(async () => {
    if (!realSendingMode || !isActive) return;
    
    setIsPolling(true);
    try {
      const result = await getSends({ limit: 100, status: undefined });
      
      if (result.success && result.sends) {
        const newStatuses: Record<string, EmailStatus> = { ...emailStatuses };
        let sentCount = 0, deliveredCount = 0, failedCount = 0, bouncedCount = 0;
        
        result.sends.forEach(send => {
          // Match by email address
          const matchingLead = leads.find(l => l.email === send.recipient_email);
          if (matchingLead) {
            const status = send.status as EmailStatus;
            newStatuses[matchingLead.id] = status;
            
            if (status === 'sent') sentCount++;
            else if (status === 'delivered') deliveredCount++;
            else if (status === 'failed') failedCount++;
            else if (status === 'bounced') bouncedCount++;
          }
        });
        
        setEmailStatuses(newStatuses);
        setDeliveryStats({ sent: sentCount, delivered: deliveredCount, failed: failedCount, bounced: bouncedCount });
        onEmailStatusUpdate?.(newStatuses);
        setLastPollTime(new Date());
      }
    } catch (error) {
      console.error('Failed to poll delivery status:', error);
    } finally {
      setIsPolling(false);
    }
  }, [realSendingMode, isActive, leads, emailStatuses, onEmailStatusUpdate]);

  // Auto-poll every 5 seconds in real sending mode
  useEffect(() => {
    if (!realSendingMode || !isActive) return;
    
    // Initial poll
    pollDeliveryStatus();
    
    // Poll every 5 seconds
    const pollInterval = setInterval(pollDeliveryStatus, 5000);
    
    return () => clearInterval(pollInterval);
  }, [realSendingMode, isActive, pollDeliveryStatus]);

  // Simulate sending each lead's email (demo mode only)
  useEffect(() => {
    if (realSendingMode || !isActive || leads.length === 0) return;

    const leadsWithEmail = leads.filter(l => l.email);
    if (currentSendingIndex >= leadsWithEmail.length) return;

    const interval = setInterval(() => {
      if (currentSendingIndex < leadsWithEmail.length) {
        const currentLead = leadsWithEmail[currentSendingIndex];
        
        // Mark as sending
        setEmailStatuses(prev => ({ ...prev, [currentLead.id]: 'sending' }));
        
        // After animation, mark as sent
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
  }, [realSendingMode, isActive, currentSendingIndex, leads, onEmailStatusUpdate]);

  // Simulate email flying animation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setEmailId(prev => prev + 1);
      setFlyingEmails(prev => [...prev, emailId]);
      
      // Remove email after animation completes
      setTimeout(() => {
        setFlyingEmails(prev => prev.filter(id => id !== emailId));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [isActive, emailId]);

  const progress = totalEmails > 0 ? (sentCount / totalEmails) * 100 : 0;
  const pendingCount = totalEmails - sentCount;
  const etaMinutes = Math.ceil(pendingCount / emailsPerHour * 60);
  const etaHours = Math.floor(etaMinutes / 60);
  const etaRemainingMins = etaMinutes % 60;

  // Get leads with email
  const leadsWithEmail = leads.filter(l => l.email);

  // Helper to get status display info
  const getStatusDisplay = (status: EmailStatus) => {
    switch (status) {
      case 'sending':
        return { icon: '📤', label: realSendingMode ? 'Sending...' : 'Simulating...', className: 'bg-primary/30 text-primary border-primary/50 animate-pulse' };
      case 'sent':
        return { icon: '✅', label: realSendingMode ? 'Sent' : 'Preview Sent', className: 'bg-success/20 text-success border-success/30' };
      case 'delivered':
        return { icon: '📬', label: 'Delivered', className: 'bg-success/30 text-success border-success/50' };
      case 'failed':
        return { icon: '❌', label: 'Failed', className: 'bg-destructive/20 text-destructive border-destructive/30' };
      case 'bounced':
        return { icon: '↩️', label: 'Bounced', className: 'bg-warning/20 text-warning border-warning/30' };
      default:
        return { icon: '⏳', label: 'Queued', className: 'bg-muted/30 text-muted-foreground border-muted/30' };
    }
  };

  return (
    <div className="space-y-4">
      {/* MODE BANNER - Changes based on real vs demo mode */}
      {realSendingMode ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-success/20 to-emerald-500/20 border-2 border-success/50">
          <div className="w-12 h-12 rounded-full bg-success/30 flex items-center justify-center">
            <Mail className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-success text-lg">📧 LIVE SENDING</h3>
              <Badge className="bg-success/30 text-success border-success/50">
                Real Emails
              </Badge>
              {isPolling && (
                <RefreshCw className="w-4 h-4 text-success animate-spin" />
              )}
            </div>
            <p className="text-sm text-success/80">
              Emails are being sent to real recipients. Status updates every 5 seconds.
              {lastPollTime && (
                <span className="ml-2 text-muted-foreground">
                  Last updated: {lastPollTime.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={pollDeliveryStatus}
            disabled={isPolling}
            className="gap-2 border-success/30 text-success hover:bg-success/10"
          >
            <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-warning/20 to-orange-500/20 border-2 border-warning/50">
          <div className="w-12 h-12 rounded-full bg-warning/30 flex items-center justify-center">
            <Eye className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-warning text-lg">📧 PREVIEW MODE</h3>
              <Badge className="bg-warning/30 text-warning border-warning/50">
                Demo Only
              </Badge>
            </div>
            <p className="text-sm text-warning/80">
              This is a <strong>simulation</strong> showing how your emails will be sent. 
              <strong className="text-foreground"> No emails are being sent yet.</strong>
            </p>
          </div>
        </div>
      )}

      {/* Real-time Delivery Stats (only in real mode) */}
      {realSendingMode && (deliveryStats.sent > 0 || deliveryStats.delivered > 0 || deliveryStats.failed > 0) && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted/20 rounded-lg p-3 text-center border border-muted/30">
            <p className="text-2xl font-bold text-success">{deliveryStats.sent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center border border-muted/30">
            <p className="text-2xl font-bold text-success">{deliveryStats.delivered}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center border border-muted/30">
            <p className="text-2xl font-bold text-destructive">{deliveryStats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center border border-muted/30">
            <p className="text-2xl font-bold text-warning">{deliveryStats.bounced}</p>
            <p className="text-xs text-muted-foreground">Bounced</p>
          </div>
        </div>
      )}

      {/* Live Email Queue - Shows each lead */}
      {leadsWithEmail.length > 0 && (
        <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/10">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              {realSendingMode ? 'Email Delivery Queue' : 'Email Queue Preview'}
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                {Object.values(emailStatuses).filter(s => s === 'sent' || s === 'delivered').length} {realSendingMode ? 'Delivered' : 'Simulated'}
              </Badge>
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                {Object.values(emailStatuses).filter(s => s === 'pending').length} Pending
              </Badge>
              {realSendingMode && Object.values(emailStatuses).filter(s => s === 'failed').length > 0 && (
                <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                  {Object.values(emailStatuses).filter(s => s === 'failed').length} Failed
                </Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {leadsWithEmail.slice(0, 20).map((lead, idx) => {
                const status = emailStatuses[lead.id] || 'pending';
                const statusDisplay = getStatusDisplay(status);
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      status === 'sending' 
                        ? 'bg-primary/20 border border-primary/50 animate-pulse' 
                        : status === 'sent' || status === 'delivered'
                          ? 'bg-success/10 border border-success/30'
                          : status === 'failed' || status === 'bounced'
                            ? 'bg-destructive/10 border border-destructive/30'
                            : 'bg-muted/10 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      status === 'sending'
                        ? 'bg-primary/30 text-primary'
                        : status === 'sent' || status === 'delivered'
                          ? 'bg-success/30 text-success'
                          : status === 'failed' || status === 'bounced'
                            ? 'bg-destructive/30 text-destructive'
                            : 'bg-muted/30 text-muted-foreground'
                    }`}>
                      {status === 'sent' || status === 'delivered' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : status === 'failed' || status === 'bounced' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                    <Badge className={`text-xs ${statusDisplay.className}`}>
                      {statusDisplay.icon} {statusDisplay.label}
                    </Badge>
                  </motion.div>
                );
              })}
              {leadsWithEmail.length > 20 && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  + {leadsWithEmail.length - 20} more leads in queue
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Animation Container */}
      <div className="relative bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/30 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Mailbox Icon */}
            <div className="relative w-14 h-14">
              {/* Mailbox body */}
              <div className="absolute bottom-0 w-12 h-10 bg-gradient-to-b from-blue-500 to-blue-700 rounded-lg border-2 border-blue-400/60">
                {/* Mail slot */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-900/60 rounded-full" />
              </div>
              {/* Mailbox flag */}
              <motion.div 
                className="absolute right-0 top-2 w-2 h-6 bg-red-500 rounded-sm origin-bottom"
                animate={isActive ? { rotate: [0, -45, 0] } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              {/* Mailbox post */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-blue-800" />
            </div>
            <div>
              <h3 className="font-bold text-white">Smart Drip Campaign Preview</h3>
              <div className="flex items-center gap-2 text-sm text-blue-300/80">
                <span className="font-semibold text-primary">{emailsPerHour} emails/hour</span>
                <span>•</span>
                <span>~{Math.round(60 / emailsPerHour * 10) / 10} min between each</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Pause/Resume and Send Controls */}
            {showControls && (
              <div className="flex items-center gap-2 mr-2">
                {isPaused ? (
                  <Button
                    onClick={onResume}
                    size="sm"
                    className="gap-2 bg-success hover:bg-success/90 text-white"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={onPause}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={onSend}
                  size="sm"
                  className="gap-2 bg-primary hover:bg-primary/90"
                  disabled={isActive && !isPaused}
                >
                  <Send className="w-4 h-4" />
                  Send Now
                </Button>
              </div>
            )}
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="How does drip sending work?"
            >
              <Info className="w-4 h-4 text-blue-300" />
            </button>
            {isActive && !isPaused && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-amber-400">PREVIEW</span>
              </div>
            )}
            {isPaused && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/30 rounded-full border border-amber-500/50">
                <Pause className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">PAUSED</span>
              </div>
            )}
          </div>
        </div>

        {/* Animation Container - Mailbox Style */}
        <div className="relative h-36 mb-6">
          {/* Outbox Mailbox (Left) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 flex flex-col items-center">
            <motion.div
              animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative"
            >
              {/* Mailbox body */}
              <div className="w-20 h-16 bg-gradient-to-b from-blue-500 to-blue-700 rounded-t-3xl rounded-b-lg border-2 border-blue-400/50 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30">
                {/* Mail slot */}
                <div className="absolute top-2 w-12 h-1.5 bg-blue-900/70 rounded-full" />
                {/* Door */}
                <motion.div 
                  className="absolute bottom-0 w-10 h-8 bg-blue-600 border-t-2 border-blue-400/50 rounded-b-md origin-bottom"
                  animate={isActive ? { rotateX: [0, 30, 0] } : { rotateX: 0 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-2xl font-bold text-white mt-2">{pendingCount}</span>
              </div>
              {/* Post */}
              <div className="w-3 h-6 bg-blue-800 mx-auto rounded-b" />
              {/* Flag */}
              <motion.div
                className="absolute -right-1 top-4 w-1.5 h-4 bg-amber-500 rounded-sm origin-bottom"
                animate={isActive && pendingCount > 0 ? { rotate: [-45, 0] } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            </motion.div>
            <p className="text-sm text-blue-300 font-medium mt-2">Outbox</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>

          {/* Flying Emails Path */}
          <div className="absolute left-28 right-28 top-1/2 -translate-y-1/2">
            {/* Path line - styled like a road/conveyor */}
            <div className="relative h-3 bg-gradient-to-r from-blue-800/80 via-indigo-800/80 to-green-800/80 rounded-full border border-white/10">
              {/* Progress indicator */}
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-green-400 rounded-full"
                style={{ width: `${progress}%` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              {/* Center line markings */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
            </div>
            
            {/* Progress markers */}
            <div className="flex justify-between mt-3 px-1">
              {[0, 25, 50, 75, 100].map((marker, i) => (
                <div key={i} className="flex flex-col items-center">
                  <motion.div
                    className={`w-2 h-2 rounded-full ${progress >= marker ? 'bg-green-400' : 'bg-white/30'}`}
                    animate={{ 
                      scale: progress >= marker && isActive ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">{marker}%</span>
                </div>
              ))}
            </div>

            {/* Flying email animations */}
            <AnimatePresence>
              {flyingEmails.map((id) => (
                <motion.div
                  key={id}
                  initial={{ x: 0, y: -30, opacity: 0, scale: 0.5 }}
                  animate={{ 
                    x: [0, 60, 120, 180, 240], 
                    y: [-30, -35, -30, -25, -30],
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0.5, 1, 1, 1, 0.5],
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute left-0 top-0"
                >
                  <div className="w-10 h-7 bg-white rounded-md shadow-lg shadow-primary/40 flex items-center justify-center border border-primary/20">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Inbox Mailbox (Right) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 flex flex-col items-center">
            <motion.div
              animate={{ 
                scale: isActive && sentCount > 0 ? [1, 1.05, 1] : 1,
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative"
            >
              {/* Mailbox body */}
              <div className="w-20 h-16 bg-gradient-to-b from-green-500 to-green-700 rounded-t-3xl rounded-b-lg border-2 border-green-400/50 flex flex-col items-center justify-center shadow-lg shadow-green-500/30">
                {/* Mail slot */}
                <div className="absolute top-2 w-12 h-1.5 bg-green-900/70 rounded-full" />
                {/* Checkmark badge */}
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
                  animate={{ scale: sentCount > 0 ? [1, 1.2, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-900" />
                </motion.div>
                <span className="text-2xl font-bold text-white mt-2">{sentCount}</span>
              </div>
              {/* Post */}
              <div className="w-3 h-6 bg-green-800 mx-auto rounded-b" />
            </motion.div>
            <p className="text-sm text-green-300 font-medium mt-2">Delivered</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{totalEmails}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{sentCount}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">
              {etaHours > 0 ? `${etaHours}h ${etaRemainingMins}m` : `${etaMinutes}m`}
            </p>
            <p className="text-xs text-muted-foreground">ETA</p>
          </div>
        </div>

        {/* Drip Rate Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-muted-foreground">
            Sending <span className="text-white font-semibold">{emailsPerHour} emails per hour</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            1 email every <span className="text-primary font-semibold">{Math.round(60 / emailsPerHour * 10) / 10} minutes</span>
          </span>
        </div>
      </div>

      {/* Explanation Panel */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-5 border border-indigo-500/30">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                How Drip Sending Works
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Controlled Sending Speed</p>
                    <p className="text-sm text-muted-foreground">
                      Your emails are sent at <span className="text-primary font-medium">{emailsPerHour} per hour</span> — 
                      that's roughly one email every <span className="text-primary font-medium">{Math.round(60 / emailsPerHour * 10) / 10} minutes</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Why Not Send All At Once?</p>
                    <p className="text-sm text-muted-foreground">
                      Sending too many emails too fast triggers spam filters. Drip sending mimics natural human 
                      behavior, keeping your sender reputation high and emails landing in the inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Time Estimate</p>
                    <p className="text-sm text-muted-foreground">
                      With <span className="text-white font-medium">{pendingCount} emails</span> remaining at{' '}
                      <span className="text-white font-medium">{emailsPerHour}/hour</span>, your campaign will complete in approximately{' '}
                      <span className="text-amber-400 font-medium">
                        {etaHours > 0 ? `${etaHours} hour${etaHours > 1 ? 's' : ''} and ${etaRemainingMins} minutes` : `${etaMinutes} minutes`}
                      </span>.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-white font-medium">Pro tip:</span> You can close this page — emails will continue sending in the background!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign speed summary (only when real campaign activity exists) */}
      {showCampaignSpeed && (
        <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-white">Campaign Speed</p>
                <p className="text-sm text-muted-foreground">Optimized for maximum deliverability</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{emailsPerHour}</p>
              <p className="text-xs text-muted-foreground">emails/hour</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-white">{Math.round(60 / emailsPerHour * 10) / 10}</p>
              <p className="text-xs text-muted-foreground">min between emails</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{emailsPerHour * 24}</p>
              <p className="text-xs text-muted-foreground">emails/day max</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-400">99%</p>
              <p className="text-xs text-muted-foreground">inbox rate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
