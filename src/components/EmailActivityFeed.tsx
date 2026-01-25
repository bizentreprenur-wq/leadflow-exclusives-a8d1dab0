import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Mail, Send, CheckCircle2, XCircle, Clock, Loader2,
  RefreshCw, AlertTriangle, Eye, MousePointer, RotateCcw,
  Trash2, ExternalLink, Filter, TrendingUp, MailOpen,
  Activity, Zap, Play, Pause
} from 'lucide-react';
import { 
  getSentEmails, 
  getScheduledEmails, 
  getEmailStats,
  sendSingleEmail,
  isSMTPConfigured 
} from '@/lib/emailService';

// Email activity item type
interface EmailActivity {
  id: string;
  to: string;
  toName: string;
  subject: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  retryCount?: number;
  templateId?: string;
  campaignId?: string;
}

// Demo activity data
const DEMO_ACTIVITIES: EmailActivity[] = [
  { 
    id: '1', 
    to: 'john@acmeplumbing.com', 
    toName: 'John Miller', 
    subject: 'Grow Your Plumbing Business', 
    status: 'opened',
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    openedAt: new Date(Date.now() - 1800000).toISOString()
  },
  { 
    id: '2', 
    to: 'sarah@greenleaf.com', 
    toName: 'Sarah Chen', 
    subject: 'Marketing Solutions for Landscapers', 
    status: 'delivered',
    sentAt: new Date(Date.now() - 7200000).toISOString()
  },
  { 
    id: '3', 
    to: 'mike@cityauto.com', 
    toName: 'Mike Thompson', 
    subject: 'Get More Customers for Your Auto Shop', 
    status: 'sending'
  },
  { 
    id: '4', 
    to: 'linda@budgetflooring.com', 
    toName: 'Linda Martinez', 
    subject: 'Lead Generation for Flooring Businesses', 
    status: 'queued'
  },
  { 
    id: '5', 
    to: 'david@quickprint.com', 
    toName: 'David Kim', 
    subject: 'Digital Marketing for Print Shops', 
    status: 'failed',
    error: 'SMTP connection timeout',
    retryCount: 2
  },
  { 
    id: '6', 
    to: 'jennifer@coastalrealty.com', 
    toName: 'Jennifer Adams', 
    subject: 'Real Estate Lead Generation', 
    status: 'clicked',
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    openedAt: new Date(Date.now() - 43200000).toISOString(),
    clickedAt: new Date(Date.now() - 21600000).toISOString()
  },
  { 
    id: '7', 
    to: 'robert@mvhvac.com', 
    toName: 'Robert Taylor', 
    subject: 'HVAC Business Growth Strategies', 
    status: 'bounced',
    error: 'Mailbox not found'
  },
  { 
    id: '8', 
    to: 'emily@sunrisebakery.com', 
    toName: 'Emily Brown', 
    subject: 'Local Marketing for Bakeries', 
    status: 'sent',
    sentAt: new Date(Date.now() - 300000).toISOString()
  },
];

interface EmailActivityFeedProps {
  className?: string;
}

export default function EmailActivityFeed({ className }: EmailActivityFeedProps) {
  const [activities, setActivities] = useState<EmailActivity[]>(DEMO_ACTIVITIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sending' | 'sent' | 'failed'>('all');
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
    queued: 0
  });

  // Calculate stats from activities
  useEffect(() => {
    const newStats = {
      total: activities.length,
      sent: activities.filter(a => a.status === 'sent').length,
      delivered: activities.filter(a => a.status === 'delivered').length,
      opened: activities.filter(a => a.status === 'opened').length,
      clicked: activities.filter(a => a.status === 'clicked').length,
      failed: activities.filter(a => a.status === 'failed' || a.status === 'bounced').length,
      queued: activities.filter(a => a.status === 'queued' || a.status === 'sending').length
    };
    setStats(newStats);
  }, [activities]);

  // Fetch real data from backend
  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sent, scheduled] = await Promise.all([
        getSentEmails(50),
        getScheduledEmails()
      ]);

      // Merge and format data
      const formattedSent: EmailActivity[] = (sent || []).map((email: any) => ({
        id: email.id || email.email_id,
        to: email.to_email || email.to,
        toName: email.to_name || email.to_email?.split('@')[0] || 'Unknown',
        subject: email.subject,
        status: email.opened_at ? 'opened' : email.delivered_at ? 'delivered' : 'sent',
        sentAt: email.sent_at,
        openedAt: email.opened_at,
        clickedAt: email.clicked_at,
        error: email.error
      }));

      const formattedScheduled: EmailActivity[] = (scheduled || []).map((email: any) => ({
        id: email.id,
        to: email.to_email || email.to,
        toName: email.to_name || 'Scheduled',
        subject: email.subject,
        status: 'queued' as const,
        sentAt: email.scheduled_for
      }));

      if (formattedSent.length > 0 || formattedScheduled.length > 0) {
        setActivities([...formattedScheduled, ...formattedSent]);
      }
    } catch (error) {
      console.error('Failed to fetch email activities:', error);
      // Keep demo data if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh in live mode
  useEffect(() => {
    if (isLiveMode) {
      const interval = setInterval(fetchActivities, 10000);
      return () => clearInterval(interval);
    }
  }, [isLiveMode, fetchActivities]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Retry failed email
  const handleRetry = async (activity: EmailActivity) => {
    if (!isSMTPConfigured()) {
      toast.error('SMTP not configured', {
        description: 'Please configure your SMTP settings first.'
      });
      return;
    }

    // Update status to sending
    setActivities(prev => prev.map(a => 
      a.id === activity.id ? { ...a, status: 'sending' as const, error: undefined } : a
    ));

    try {
      const result = await sendSingleEmail({
        to: activity.to,
        subject: activity.subject,
        bodyHtml: '<p>Retry email content</p>' // Would need actual content in real implementation
      });

      if (result.success) {
        setActivities(prev => prev.map(a => 
          a.id === activity.id ? { ...a, status: 'sent' as const, sentAt: new Date().toISOString(), retryCount: (a.retryCount || 0) + 1 } : a
        ));
        toast.success(`Email resent to ${activity.toName}`);
      } else {
        setActivities(prev => prev.map(a => 
          a.id === activity.id ? { ...a, status: 'failed' as const, error: result.error, retryCount: (a.retryCount || 0) + 1 } : a
        ));
        toast.error('Retry failed', { description: result.error });
      }
    } catch (error) {
      setActivities(prev => prev.map(a => 
        a.id === activity.id ? { ...a, status: 'failed' as const, error: 'Network error' } : a
      ));
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: EmailActivity['status']) => {
    switch (status) {
      case 'queued':
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-800', label: 'Queued' };
      case 'sending':
        return { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-900/50', label: 'Sending', animate: true };
      case 'sent':
        return { icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-900/50', label: 'Sent' };
      case 'delivered':
        return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-900/50', label: 'Delivered' };
      case 'opened':
        return { icon: MailOpen, color: 'text-cyan-400', bg: 'bg-cyan-900/50', label: 'Opened' };
      case 'clicked':
        return { icon: MousePointer, color: 'text-violet-400', bg: 'bg-violet-900/50', label: 'Clicked' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/50', label: 'Failed' };
      case 'bounced':
        return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-900/50', label: 'Bounced' };
      default:
        return { icon: Mail, color: 'text-slate-400', bg: 'bg-slate-800', label: 'Unknown' };
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'sending') return a.status === 'queued' || a.status === 'sending';
    if (filter === 'sent') return ['sent', 'delivered', 'opened', 'clicked'].includes(a.status);
    if (filter === 'failed') return a.status === 'failed' || a.status === 'bounced';
    return true;
  });

  // Format time ago
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const successRate = stats.total > 0 
    ? Math.round(((stats.sent + stats.delivered + stats.opened + stats.clicked) / stats.total) * 100) 
    : 0;

  return (
    <div className={cn("flex flex-col h-full bg-slate-900", className)}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Email Activity Feed
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchActivities}
              disabled={isLoading}
              className="gap-1.5 border-slate-700 text-slate-300 hover:text-white"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              variant={isLiveMode ? "default" : "outline"}
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={cn(
                "gap-1.5",
                isLiveMode 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                  : "border-slate-700 text-slate-300 hover:text-white"
              )}
            >
              {isLiveMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isLiveMode ? 'Live' : 'Auto'}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-white">{stats.queued}</p>
            <p className="text-[10px] text-slate-500">Queued</p>
          </div>
          <div className="bg-emerald-900/30 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-emerald-400">{stats.sent + stats.delivered}</p>
            <p className="text-[10px] text-emerald-500/70">Sent</p>
          </div>
          <div className="bg-cyan-900/30 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-cyan-400">{stats.opened + stats.clicked}</p>
            <p className="text-[10px] text-cyan-500/70">Engaged</p>
          </div>
          <div className="bg-red-900/30 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-red-400">{stats.failed}</p>
            <p className="text-[10px] text-red-500/70">Failed</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Success Rate</span>
            <span className="text-emerald-400 font-medium">{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-1.5 bg-slate-800" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3">
          {(['all', 'sending', 'sent', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                filter === f 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && ` (${activities.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((activity, idx) => {
              const statusInfo = getStatusDisplay(activity.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    activity.status === 'sending' && "border-blue-500/50 bg-blue-900/20",
                    activity.status === 'failed' || activity.status === 'bounced' 
                      ? "border-red-500/30 bg-red-900/10" 
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      statusInfo.bg
                    )}>
                      <StatusIcon className={cn(
                        "w-4 h-4",
                        statusInfo.color,
                        statusInfo.animate && "animate-spin"
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{activity.toName}</p>
                        <Badge className={cn(
                          "text-[10px] flex-shrink-0",
                          statusInfo.bg,
                          statusInfo.color
                        )}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{activity.to}</p>
                      <p className="text-xs text-slate-500 truncate mt-1">{activity.subject}</p>
                      
                      {/* Error Message */}
                      {activity.error && (
                        <div className="mt-2 p-2 rounded bg-red-900/30 border border-red-500/20">
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {activity.error}
                          </p>
                          {activity.retryCount && activity.retryCount > 0 && (
                            <p className="text-[10px] text-red-500/70 mt-1">
                              Retried {activity.retryCount} time{activity.retryCount > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Timeline */}
                      {activity.sentAt && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          {activity.sentAt && (
                            <span className="flex items-center gap-1">
                              <Send className="w-3 h-3" /> {formatTimeAgo(activity.sentAt)}
                            </span>
                          )}
                          {activity.openedAt && (
                            <span className="flex items-center gap-1 text-cyan-500">
                              <Eye className="w-3 h-3" /> {formatTimeAgo(activity.openedAt)}
                            </span>
                          )}
                          {activity.clickedAt && (
                            <span className="flex items-center gap-1 text-violet-500">
                              <MousePointer className="w-3 h-3" /> {formatTimeAgo(activity.clickedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(activity.status === 'failed' || activity.status === 'bounced') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(activity)}
                        className="gap-1 border-slate-600 text-slate-300 hover:text-white hover:border-emerald-500"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No email activity yet</p>
              <p className="text-xs text-slate-600 mt-1">Send your first email to see activity here</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* SMTP Status Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg text-xs",
          isSMTPConfigured() 
            ? "bg-emerald-900/20 border border-emerald-500/20" 
            : "bg-amber-900/20 border border-amber-500/20"
        )}>
          <div className="flex items-center gap-2">
            <Zap className={cn(
              "w-4 h-4",
              isSMTPConfigured() ? "text-emerald-400" : "text-amber-400"
            )} />
            <span className={isSMTPConfigured() ? "text-emerald-300" : "text-amber-300"}>
              {isSMTPConfigured() ? 'SMTP Connected' : 'SMTP Not Configured'}
            </span>
          </div>
          {!isSMTPConfigured() && (
            <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300 text-xs h-6">
              Configure →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
