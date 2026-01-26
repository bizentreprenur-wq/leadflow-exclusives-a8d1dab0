import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  MousePointer,
  Reply,
  Bot,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  Target,
  Sparkles,
  Send,
  Voicemail,
  PhoneCall,
  PhoneOff,
  MessageCircle,
  CalendarCheck,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Activity,
} from 'lucide-react';

// Types
interface LeadJourneyStep {
  id: string;
  leadId: string;
  leadName: string;
  businessName: string;
  channel: 'email' | 'sms' | 'call' | 'voicemail';
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'scheduled';
  timestamp: string;
  details?: string;
  response?: string;
  nextStep?: string;
}

interface LeadJourneyStats {
  totalLeads: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  smsSent: number;
  smsReplied: number;
  callsMade: number;
  callsAnswered: number;
  voicemailsLeft: number;
  meetingsScheduled: number;
  conversions: number;
}

interface LeadJourneyDashboardProps {
  isAutopilotActive?: boolean;
  onToggleAutopilot?: (active: boolean) => void;
  campaignContext?: {
    isActive: boolean;
    sentCount: number;
    totalLeads: number;
  };
}

// Demo journey data
const generateDemoJourneySteps = (): LeadJourneyStep[] => {
  const businesses = [
    { id: '1', name: 'John Smith', business: 'ABC Plumbing' },
    { id: '2', name: 'Sarah Chen', business: 'Green Leaf Landscaping' },
    { id: '3', name: 'Mike Davis', business: 'Tech Solutions Inc' },
    { id: '4', name: 'Emily Brown', business: 'Design Studio Pro' },
    { id: '5', name: 'James Wilson', business: 'Local Auto Shop' },
    { id: '6', name: 'Lisa Martinez', business: 'Home Cleaning Co' },
    { id: '7', name: 'David Kim', business: 'Kim\'s Restaurant' },
    { id: '8', name: 'Rachel Green', business: 'Fitness First Gym' },
  ];

  const steps: LeadJourneyStep[] = [];
  const now = Date.now();

  businesses.forEach((biz, idx) => {
    // Initial email
    steps.push({
      id: `${biz.id}-email-1`,
      leadId: biz.id,
      leadName: biz.name,
      businessName: biz.business,
      channel: 'email',
      action: 'Initial Email Sent',
      status: 'completed',
      timestamp: new Date(now - (60000 * (idx * 15 + 60))).toISOString(),
      details: 'Personalized outreach about website upgrade',
    });

    // Some opened
    if (idx < 6) {
      steps.push({
        id: `${biz.id}-email-open`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'email',
        action: 'Email Opened',
        status: 'completed',
        timestamp: new Date(now - (60000 * (idx * 10 + 30))).toISOString(),
      });
    }

    // Some clicked
    if (idx < 4) {
      steps.push({
        id: `${biz.id}-email-click`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'email',
        action: 'Link Clicked',
        status: 'completed',
        timestamp: new Date(now - (60000 * (idx * 8 + 20))).toISOString(),
        details: 'Clicked on case study link',
      });
    }

    // SMS follow-ups
    if (idx < 5) {
      steps.push({
        id: `${biz.id}-sms-1`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'sms',
        action: 'SMS Sent',
        status: 'completed',
        timestamp: new Date(now - (60000 * (idx * 5 + 15))).toISOString(),
        details: 'Follow-up text message',
      });
    }

    // Some SMS replies
    if (idx < 2) {
      steps.push({
        id: `${biz.id}-sms-reply`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'sms',
        action: 'SMS Reply Received',
        status: 'completed',
        timestamp: new Date(now - (60000 * (idx * 3 + 10))).toISOString(),
        response: idx === 0 ? 'Sure, let\'s talk tomorrow!' : 'Send me more info please',
      });
    }

    // AI Calls
    if (idx < 4) {
      const callStatus = idx < 2 ? 'completed' : 'in_progress';
      steps.push({
        id: `${biz.id}-call-1`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'call',
        action: idx < 2 ? 'AI Call Answered' : 'AI Call In Progress',
        status: callStatus,
        timestamp: new Date(now - (60000 * (idx * 2 + 5))).toISOString(),
        details: idx < 2 ? 'Lead qualified, interested in demo' : 'Connecting...',
      });
    }

    // Voicemails
    if (idx === 2 || idx === 3) {
      steps.push({
        id: `${biz.id}-voicemail`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'voicemail',
        action: 'Voicemail Left',
        status: 'completed',
        timestamp: new Date(now - (60000 * (idx + 8))).toISOString(),
        details: 'Left personalized voicemail with callback number',
        nextStep: 'Follow-up call in 24 hours',
      });
    }

    // Meeting scheduled
    if (idx === 0) {
      steps.push({
        id: `${biz.id}-meeting`,
        leadId: biz.id,
        leadName: biz.name,
        businessName: biz.business,
        channel: 'call',
        action: 'Meeting Scheduled',
        status: 'completed',
        timestamp: new Date(now - (60000 * 2)).toISOString(),
        details: 'Demo call scheduled for tomorrow 2:00 PM',
      });
    }
  });

  // Sort by timestamp descending
  return steps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const DEMO_STATS: LeadJourneyStats = {
  totalLeads: 156,
  emailsSent: 412,
  emailsOpened: 287,
  emailsClicked: 94,
  emailsReplied: 47,
  smsSent: 89,
  smsReplied: 23,
  callsMade: 67,
  callsAnswered: 41,
  voicemailsLeft: 26,
  meetingsScheduled: 18,
  conversions: 12,
};

const CHANNEL_CONFIG = {
  email: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  sms: { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  call: { icon: Phone, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  voicemail: { icon: Voicemail, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  in_progress: { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20' },
  scheduled: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

export default function LeadJourneyDashboard({
  isAutopilotActive = false,
  onToggleAutopilot,
  campaignContext,
}: LeadJourneyDashboardProps) {
  const [journeySteps, setJourneySteps] = useState<LeadJourneyStep[]>(generateDemoJourneySteps);
  const [stats, setStats] = useState<LeadJourneyStats>(DEMO_STATS);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'email' | 'sms' | 'call'>('all');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time updates when autopilot is active
  useEffect(() => {
    if (isAutopilotActive) {
      pollingRef.current = setInterval(() => {
        setIsPolling(true);
        
        // Simulate new activity
        const channels: Array<'email' | 'sms' | 'call'> = ['email', 'sms', 'call'];
        const randomChannel = channels[Math.floor(Math.random() * channels.length)];
        const actions = {
          email: ['Email Sent', 'Email Opened', 'Email Clicked', 'Reply Received'],
          sms: ['SMS Sent', 'SMS Delivered', 'SMS Reply Received'],
          call: ['AI Call Started', 'AI Call Answered', 'Voicemail Left', 'Meeting Scheduled'],
        };
        const randomAction = actions[randomChannel][Math.floor(Math.random() * actions[randomChannel].length)];

        const newStep: LeadJourneyStep = {
          id: `live-${Date.now()}`,
          leadId: `lead-${Math.floor(Math.random() * 100)}`,
          leadName: ['John', 'Sarah', 'Mike', 'Emily', 'James'][Math.floor(Math.random() * 5)] + ' ' + 
                   ['Smith', 'Johnson', 'Davis', 'Brown', 'Wilson'][Math.floor(Math.random() * 5)],
          businessName: ['ABC Corp', 'XYZ Inc', 'Local Shop', 'Pro Services', 'Tech Co'][Math.floor(Math.random() * 5)],
          channel: randomChannel,
          action: randomAction,
          status: Math.random() > 0.1 ? 'completed' : 'in_progress',
          timestamp: new Date().toISOString(),
          details: randomAction.includes('Reply') ? 'Lead responded positively!' : undefined,
        };

        setJourneySteps(prev => [newStep, ...prev.slice(0, 49)]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          emailsSent: randomChannel === 'email' && randomAction.includes('Sent') ? prev.emailsSent + 1 : prev.emailsSent,
          emailsOpened: randomChannel === 'email' && randomAction.includes('Opened') ? prev.emailsOpened + 1 : prev.emailsOpened,
          smsSent: randomChannel === 'sms' && randomAction.includes('Sent') ? prev.smsSent + 1 : prev.smsSent,
          callsMade: randomChannel === 'call' && (randomAction.includes('Started') || randomAction.includes('Answered')) ? prev.callsMade + 1 : prev.callsMade,
          callsAnswered: randomChannel === 'call' && randomAction.includes('Answered') ? prev.callsAnswered + 1 : prev.callsAnswered,
          meetingsScheduled: randomAction.includes('Meeting') ? prev.meetingsScheduled + 1 : prev.meetingsScheduled,
        }));

        setLastUpdated(new Date());
        setIsPolling(false);
      }, 5000);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [isAutopilotActive]);

  const filteredSteps = filter === 'all' 
    ? journeySteps 
    : journeySteps.filter(s => s.channel === filter);

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Lead Journey Dashboard
              {isAutopilotActive && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  Live
                </Badge>
              )}
            </h2>
            <p className="text-slate-400 text-sm">
              Real-time view of AI outreach across all channels
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Autopilot Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-sm text-slate-400">BamLead AI</span>
              <Switch
                checked={isAutopilotActive}
                onCheckedChange={onToggleAutopilot}
                className="data-[state=checked]:bg-violet-500"
              />
              {isAutopilotActive && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => {
                setJourneySteps(generateDemoJourneySteps());
                setLastUpdated(new Date());
                toast.success('Dashboard refreshed!');
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Campaign Context Banner */}
        {campaignContext?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-emerald-300">
                Campaign Active: {campaignContext.sentCount} / {campaignContext.totalLeads} processed
              </span>
            </div>
            <Progress 
              value={(campaignContext.sentCount / campaignContext.totalLeads) * 100} 
              className="w-32 h-2 bg-slate-700"
            />
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Emails Sent', value: stats.emailsSent, icon: Mail, color: 'text-blue-400', subValue: `${stats.emailsOpened} opened` },
            { label: 'SMS Sent', value: stats.smsSent, icon: MessageSquare, color: 'text-emerald-400', subValue: `${stats.smsReplied} replied` },
            { label: 'AI Calls', value: stats.callsMade, icon: Phone, color: 'text-amber-400', subValue: `${stats.callsAnswered} answered` },
            { label: 'Voicemails', value: stats.voicemailsLeft, icon: Voicemail, color: 'text-purple-400', subValue: 'Left' },
            { label: 'Meetings', value: stats.meetingsScheduled, icon: Calendar, color: 'text-pink-400', subValue: 'Scheduled' },
            { label: 'Conversions', value: stats.conversions, icon: CheckCircle2, color: 'text-emerald-400', subValue: `${((stats.conversions / stats.totalLeads) * 100).toFixed(1)}%` },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
                <div className="text-xs text-slate-500">{stat.subValue}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Activity', icon: Activity },
            { id: 'email', label: 'Emails', icon: Mail },
            { id: 'sms', label: 'SMS', icon: MessageSquare },
            { id: 'call', label: 'Calls', icon: Phone },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filter === tab.id ? 'default' : 'ghost'}
              size="sm"
              className={filter === tab.id ? 'bg-violet-500 hover:bg-violet-600' : 'text-slate-400 hover:text-white'}
              onClick={() => setFilter(tab.id as any)}
            >
              <tab.icon className="w-4 h-4 mr-1.5" />
              {tab.label}
            </Button>
          ))}

          <div className="ml-auto text-xs text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Journey Feed */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredSteps.map((step, idx) => {
              const channelConfig = CHANNEL_CONFIG[step.channel];
              const statusConfig = STATUS_CONFIG[step.status];
              const Icon = channelConfig.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex items-start gap-4 p-4 rounded-xl bg-slate-900 border ${channelConfig.border}`}
                >
                  <div className={`w-10 h-10 rounded-lg ${channelConfig.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${channelConfig.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-medium text-white truncate">{step.leadName}</h4>
                        <span className="text-slate-500">•</span>
                        <span className="text-sm text-slate-400 truncate">{step.businessName}</span>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">{getTimeAgo(step.timestamp)}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-300">{step.action}</span>
                      <Badge className={`text-[10px] ${statusConfig.bg} ${statusConfig.color} border-0`}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {step.details && (
                      <p className="text-sm text-slate-500 mt-1">{step.details}</p>
                    )}

                    {step.response && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
                          <Reply className="w-3 h-3" />
                          Response
                        </div>
                        <p className="text-sm text-emerald-300">"{step.response}"</p>
                      </div>
                    )}

                    {step.nextStep && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-violet-400">
                        <ChevronRight className="w-3 h-3" />
                        Next: {step.nextStep}
                      </div>
                    )}
                  </div>

                  {step.status === 'in_progress' && (
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredSteps.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity yet. Enable BamLead AI to start outreach!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with AI Summary */}
      {isAutopilotActive && (
        <div className="shrink-0 px-6 py-4 border-t border-slate-800 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-violet-300">AI is actively working</div>
              <div className="text-xs text-slate-400">
                Sending personalized emails, SMS follow-ups, and making AI calls automatically
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Mail className="w-3 h-3 mr-1" />
                {stats.emailsSent} emails
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <MessageSquare className="w-3 h-3 mr-1" />
                {stats.smsSent} SMS
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Phone className="w-3 h-3 mr-1" />
                {stats.callsMade} calls
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
