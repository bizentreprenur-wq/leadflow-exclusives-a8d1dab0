import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  MessageSquare,
  Brain,
  Zap,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Send,
  Bot,
  Sparkles,
  Settings,
  Eye,
  MousePointer,
  Reply,
  Loader2,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  RefreshCw,
  Volume2,
  Voicemail,
  FileText,
  Download,
  BarChart3,
} from 'lucide-react';

// Types
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  businessName?: string;
  website?: string;
  classification?: 'hot' | 'warm' | 'cold';
  score?: number;
}

export interface SequenceStep {
  id: string;
  type: 'email' | 'sms' | 'call' | 'voicemail' | 'wait';
  delay: number;
  delayUnit: 'hours' | 'days';
  subject?: string;
  content: string;
  aiGenerated?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed';
}

export interface MultiChannelSequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  leadsEnrolled: number;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    meetings: number;
  };
  createdAt: string;
  lastActivity?: string;
}

export interface EngagementEvent {
  id: string;
  leadId: string;
  leadName: string;
  type: 'email_open' | 'email_click' | 'email_reply' | 'sms_reply' | 'call_answered' | 'call_voicemail' | 'meeting_scheduled';
  timestamp: string;
  details?: string;
  sequenceId?: string;
  stepIndex?: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'no_open' | 'opened_no_reply' | 'clicked_no_reply' | 'no_response_3x' | 'hot_lead' | 'meeting_request';
  action: 'send_followup' | 'send_sms' | 'trigger_call' | 'escalate' | 'notify_calendar';
  delay: number;
  delayUnit: 'hours' | 'days';
  enabled: boolean;
  template?: string;
}

interface MultiChannelAutomationProps {
  leads?: Lead[];
  onSendEmail?: (lead: Lead, subject: string, content: string) => Promise<boolean>;
  onSendSMS?: (lead: Lead, message: string) => Promise<boolean>;
  onTriggerCall?: (lead: Lead) => Promise<boolean>;
  onScheduleMeeting?: (lead: Lead, date: Date) => Promise<boolean>;
}

// Default sequences for different lead types
const DEFAULT_SEQUENCES: MultiChannelSequence[] = [
  {
    id: 'multi-touch-cold',
    name: 'Multi-Touch Cold Outreach',
    description: 'Email → Follow-up → SMS → AI Call sequence for new leads',
    steps: [
      {
        id: 's1',
        type: 'email',
        delay: 0,
        delayUnit: 'days',
        subject: 'Quick question about {{business_name}}',
        content: 'Hi {{first_name}},\n\nI noticed {{business_name}} and wanted to reach out about how we can help you grow your business.\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\n{{sender_name}}',
        aiGenerated: true,
      },
      {
        id: 's2',
        type: 'wait',
        delay: 3,
        delayUnit: 'days',
        content: 'Wait for engagement',
      },
      {
        id: 's3',
        type: 'email',
        delay: 0,
        delayUnit: 'days',
        subject: 'Following up - {{business_name}}',
        content: 'Hi {{first_name}},\n\nI wanted to follow up on my previous email. I understand you\'re busy, so I\'ll keep this brief.\n\nHere\'s a quick case study showing how we helped a similar business increase leads by 47%: [Link]\n\nWorth a quick chat?\n\nBest,\n{{sender_name}}',
        aiGenerated: true,
      },
      {
        id: 's4',
        type: 'wait',
        delay: 2,
        delayUnit: 'days',
        content: 'Wait for response',
      },
      {
        id: 's5',
        type: 'sms',
        delay: 0,
        delayUnit: 'hours',
        content: 'Hi {{first_name}}, this is {{sender_name}}. I sent you an email about helping {{business_name}}. Would a quick call work for you this week?',
        aiGenerated: true,
      },
      {
        id: 's6',
        type: 'wait',
        delay: 2,
        delayUnit: 'days',
        content: 'Wait for SMS response',
      },
      {
        id: 's7',
        type: 'call',
        delay: 0,
        delayUnit: 'hours',
        content: 'AI Call Script: Introduce yourself, mention previous outreach, offer value proposition, qualify interest, schedule follow-up if interested.',
        aiGenerated: true,
      },
    ],
    status: 'draft',
    leadsEnrolled: 0,
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, meetings: 0 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hot-lead-fast',
    name: 'Hot Lead Fast Close',
    description: 'Rapid multi-channel engagement for high-intent leads',
    steps: [
      {
        id: 'h1',
        type: 'email',
        delay: 0,
        delayUnit: 'hours',
        subject: 'Ready when you are, {{first_name}}',
        content: 'Hi {{first_name}},\n\nThank you for your interest! Based on what I know about {{business_name}}, I think we can help you significantly.\n\nHere\'s my calendar link to book a time: [Calendar Link]\n\nLooking forward to connecting!\n\n{{sender_name}}',
        aiGenerated: true,
      },
      {
        id: 'h2',
        type: 'sms',
        delay: 4,
        delayUnit: 'hours',
        content: 'Hi {{first_name}}, just sent over some info. Any questions? Happy to jump on a quick call.',
        aiGenerated: true,
      },
      {
        id: 'h3',
        type: 'wait',
        delay: 1,
        delayUnit: 'days',
        content: 'Wait for response',
      },
      {
        id: 'h4',
        type: 'call',
        delay: 0,
        delayUnit: 'hours',
        content: 'Priority AI Call: Lead showed high intent. Focus on understanding their timeline and closing the deal.',
        aiGenerated: true,
      },
    ],
    status: 'draft',
    leadsEnrolled: 0,
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, meetings: 0 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'engagement-nurture',
    name: 'Engagement-Based Nurture',
    description: 'Adapts messaging based on lead behavior and interactions',
    steps: [
      {
        id: 'e1',
        type: 'email',
        delay: 0,
        delayUnit: 'days',
        subject: 'Resources for {{business_name}}',
        content: 'Hi {{first_name}},\n\nI put together some resources specifically for businesses like {{business_name}}.\n\n[Resource Link]\n\nLet me know if you find them helpful!\n\n{{sender_name}}',
        aiGenerated: true,
      },
      {
        id: 'e2',
        type: 'wait',
        delay: 3,
        delayUnit: 'days',
        content: 'Wait and track engagement',
      },
      {
        id: 'e3',
        type: 'email',
        delay: 0,
        delayUnit: 'days',
        subject: 'Saw you checked out our resources',
        content: 'Hi {{first_name}},\n\nI noticed you had a chance to look at the resources I sent. Would you like to discuss how these strategies could apply to {{business_name}}?\n\nHappy to schedule a quick call.\n\n{{sender_name}}',
        aiGenerated: true,
      },
    ],
    status: 'draft',
    leadsEnrolled: 0,
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, meetings: 0 },
    createdAt: new Date().toISOString(),
  },
];

// Default automation rules
const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'r1',
    name: 'No Open → New Subject Line',
    trigger: 'no_open',
    action: 'send_followup',
    delay: 3,
    delayUnit: 'days',
    enabled: true,
    template: 'different_subject',
  },
  {
    id: 'r2',
    name: 'Opened No Reply → SMS',
    trigger: 'opened_no_reply',
    action: 'send_sms',
    delay: 2,
    delayUnit: 'days',
    enabled: true,
    template: 'friendly_sms',
  },
  {
    id: 'r3',
    name: 'Clicked No Reply → Reference Click',
    trigger: 'clicked_no_reply',
    action: 'send_followup',
    delay: 1,
    delayUnit: 'days',
    enabled: true,
    template: 'click_reference',
  },
  {
    id: 'r4',
    name: 'No Response 3x → AI Call',
    trigger: 'no_response_3x',
    action: 'trigger_call',
    delay: 0,
    delayUnit: 'hours',
    enabled: true,
  },
  {
    id: 'r5',
    name: 'Hot Lead → Priority Outreach',
    trigger: 'hot_lead',
    action: 'trigger_call',
    delay: 1,
    delayUnit: 'hours',
    enabled: true,
  },
  {
    id: 'r6',
    name: 'Meeting Request → Calendar Sync',
    trigger: 'meeting_request',
    action: 'notify_calendar',
    delay: 0,
    delayUnit: 'hours',
    enabled: true,
  },
];

// Demo engagement events
const DEMO_EVENTS: EngagementEvent[] = [
  {
    id: 'ev1',
    leadId: 'l1',
    leadName: 'John Smith - ABC Corp',
    type: 'email_open',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: 'Opened: "Quick question about ABC Corp"',
    sequenceId: 'multi-touch-cold',
    stepIndex: 0,
  },
  {
    id: 'ev2',
    leadId: 'l2',
    leadName: 'Sarah Johnson - XYZ Inc',
    type: 'email_click',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: 'Clicked: Case study link',
    sequenceId: 'multi-touch-cold',
    stepIndex: 2,
  },
  {
    id: 'ev3',
    leadId: 'l3',
    leadName: 'Mike Davis - Tech Solutions',
    type: 'sms_reply',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    details: 'Reply: "Sure, how about Thursday?"',
    sequenceId: 'hot-lead-fast',
    stepIndex: 1,
  },
  {
    id: 'ev4',
    leadId: 'l4',
    leadName: 'Emily Brown - Design Co',
    type: 'meeting_scheduled',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    details: 'Meeting: Tomorrow at 2:00 PM',
  },
  {
    id: 'ev5',
    leadId: 'l5',
    leadName: 'James Wilson - Local Shop',
    type: 'call_answered',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    details: 'Call duration: 4:32 - Interested, requested proposal',
    sequenceId: 'multi-touch-cold',
    stepIndex: 6,
  },
];

const STEP_ICONS = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  voicemail: Voicemail,
  wait: Clock,
};

const STEP_COLORS = {
  email: 'from-blue-500 to-cyan-500',
  sms: 'from-emerald-500 to-teal-500',
  call: 'from-amber-500 to-orange-500',
  voicemail: 'from-purple-500 to-pink-500',
  wait: 'from-slate-500 to-slate-600',
};

export default function MultiChannelAutomation({
  leads = [],
  onSendEmail,
  onSendSMS,
  onTriggerCall,
  onScheduleMeeting,
}: MultiChannelAutomationProps) {
  const [activeTab, setActiveTab] = useState('sequences');
  const [sequences, setSequences] = useState<MultiChannelSequence[]>(DEFAULT_SEQUENCES);
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  const [events, setEvents] = useState<EngagementEvent[]>(DEMO_EVENTS);
  const [isAutomationActive, setIsAutomationActive] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<MultiChannelSequence | null>(null);
  const [showSequenceEditor, setShowSequenceEditor] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrolledLeads, setEnrolledLeads] = useState<Lead[]>([]);
  
  // Real-time stats
  const [liveStats, setLiveStats] = useState({
    activeSequences: 0,
    leadsInProgress: 0,
    emailsSent: 0,
    smsSent: 0,
    callsMade: 0,
    meetings: 0,
    responseRate: 0,
  });

  // Polling interval for live updates
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate live stats
  useEffect(() => {
    const activeSeqs = sequences.filter(s => s.status === 'active');
    const totalStats = sequences.reduce(
      (acc, seq) => ({
        sent: acc.sent + seq.stats.sent,
        opened: acc.opened + seq.stats.opened,
        replied: acc.replied + seq.stats.replied,
        meetings: acc.meetings + seq.stats.meetings,
      }),
      { sent: 0, opened: 0, replied: 0, meetings: 0 }
    );

    setLiveStats({
      activeSequences: activeSeqs.length,
      leadsInProgress: activeSeqs.reduce((acc, s) => acc + s.leadsEnrolled, 0),
      emailsSent: totalStats.sent,
      smsSent: Math.floor(totalStats.sent * 0.4),
      callsMade: Math.floor(totalStats.sent * 0.15),
      meetings: totalStats.meetings,
      responseRate: totalStats.sent > 0 ? Math.round((totalStats.replied / totalStats.sent) * 100) : 0,
    });
  }, [sequences]);

  // Start automation polling when active
  useEffect(() => {
    if (isAutomationActive) {
      pollingRef.current = setInterval(() => {
        // Simulate real-time updates
        setEvents(prev => {
          if (prev.length > 20) return prev.slice(0, 20);
          return prev;
        });
        
        // Update sequence stats
        setSequences(prev => prev.map(seq => {
          if (seq.status === 'active') {
            return {
              ...seq,
              stats: {
                ...seq.stats,
                sent: seq.stats.sent + Math.floor(Math.random() * 2),
                opened: seq.stats.opened + (Math.random() > 0.6 ? 1 : 0),
                clicked: seq.stats.clicked + (Math.random() > 0.8 ? 1 : 0),
                replied: seq.stats.replied + (Math.random() > 0.9 ? 1 : 0),
              },
              lastActivity: new Date().toISOString(),
            };
          }
          return seq;
        }));
      }, 10000);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [isAutomationActive]);

  // Toggle automation
  const toggleAutomation = () => {
    setIsAutomationActive(!isAutomationActive);
    toast.success(
      !isAutomationActive
        ? '🚀 Multi-Channel Automation activated! Sequences will run automatically.'
        : 'Automation paused. All sequences will stop sending.'
    );
  };

  // Toggle sequence status
  const toggleSequenceStatus = (sequenceId: string) => {
    setSequences(prev => prev.map(seq => {
      if (seq.id === sequenceId) {
        const newStatus = seq.status === 'active' ? 'paused' : 'active';
        toast.success(`Sequence ${newStatus === 'active' ? 'activated' : 'paused'}: ${seq.name}`);
        return { ...seq, status: newStatus };
      }
      return seq;
    }));
  };

  // Toggle rule
  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return { ...rule, enabled: !rule.enabled };
      }
      return rule;
    }));
  };

  // Enroll leads in sequence
  const enrollLeadsInSequence = (sequenceId: string, leadsToEnroll: Lead[]) => {
    if (leadsToEnroll.length === 0) {
      toast.error('No leads selected');
      return;
    }

    setSequences(prev => prev.map(seq => {
      if (seq.id === sequenceId) {
        return {
          ...seq,
          leadsEnrolled: seq.leadsEnrolled + leadsToEnroll.length,
          status: 'active',
        };
      }
      return seq;
    }));

    setEnrolledLeads(prev => [...prev, ...leadsToEnroll]);
    toast.success(`🎯 Enrolled ${leadsToEnroll.length} leads in sequence`);
  };

  // Process next step for a lead
  const processNextStep = async (lead: Lead, sequence: MultiChannelSequence, stepIndex: number) => {
    const step = sequence.steps[stepIndex];
    if (!step) return;

    setIsProcessing(true);

    try {
      switch (step.type) {
        case 'email':
          if (onSendEmail && lead.email) {
            await onSendEmail(lead, step.subject || 'No Subject', step.content);
            toast.success(`📧 Email sent to ${lead.name}`);
          }
          break;
        case 'sms':
          if (onSendSMS && lead.phone) {
            await onSendSMS(lead, step.content);
            toast.success(`💬 SMS sent to ${lead.name}`);
          }
          break;
        case 'call':
          if (onTriggerCall && lead.phone) {
            await onTriggerCall(lead);
            toast.success(`📞 AI Call triggered for ${lead.name}`);
          }
          break;
      }
    } catch (error) {
      toast.error(`Failed to process step for ${lead.name}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get event icon
  const getEventIcon = (type: EngagementEvent['type']) => {
    switch (type) {
      case 'email_open': return Eye;
      case 'email_click': return MousePointer;
      case 'email_reply': return Reply;
      case 'sms_reply': return MessageSquare;
      case 'call_answered': return Phone;
      case 'call_voicemail': return Voicemail;
      case 'meeting_scheduled': return Calendar;
      default: return Mail;
    }
  };

  // Get event color
  const getEventColor = (type: EngagementEvent['type']) => {
    switch (type) {
      case 'email_open': return 'text-blue-400 bg-blue-500/10';
      case 'email_click': return 'text-cyan-400 bg-cyan-500/10';
      case 'email_reply': return 'text-emerald-400 bg-emerald-500/10';
      case 'sms_reply': return 'text-teal-400 bg-teal-500/10';
      case 'call_answered': return 'text-amber-400 bg-amber-500/10';
      case 'call_voicemail': return 'text-purple-400 bg-purple-500/10';
      case 'meeting_scheduled': return 'text-pink-400 bg-pink-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Master Control */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Multi-Channel Automation
          </h2>
          <p className="text-slate-400 text-sm">
            Email, SMS, and AI Calling sequences with behavior-based follow-ups
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-sm text-slate-400">Full Autopilot</span>
            <Switch
              checked={isAutomationActive}
              onCheckedChange={toggleAutomation}
              className="data-[state=checked]:bg-emerald-500"
            />
            {isAutomationActive && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Automation Status Banner */}
      <AnimatePresence>
        {isAutomationActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              <Bot className="w-5 h-5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-semibold text-emerald-300">Automation Running</span>
                <span className="text-slate-400 text-sm">
                  {liveStats.activeSequences} active sequences • {liveStats.leadsInProgress} leads in progress
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium">{liveStats.emailsSent}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">{liveStats.smsSent}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="text-white font-medium">{liveStats.callsMade}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                <Calendar className="w-4 h-4 text-pink-400" />
                <span className="text-white font-medium">{liveStats.meetings}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="sequences" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Sequences
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" />
            Auto Follow-ups
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Live Activity
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Sequences Tab */}
        <TabsContent value="sequences" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-4">
            {sequences.map((sequence) => (
              <Card key={sequence.id} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        {sequence.name}
                        {sequence.status === 'active' && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{sequence.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSequenceStatus(sequence.id)}
                      className={sequence.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}
                    >
                      {sequence.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sequence Steps Preview */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {sequence.steps.map((step, idx) => {
                      const Icon = STEP_ICONS[step.type];
                      return (
                        <div key={step.id} className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${STEP_COLORS[step.type]} flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          {idx < sequence.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-slate-600 mx-1 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <div className="text-lg font-bold text-white">{sequence.stats.sent}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Sent</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <div className="text-lg font-bold text-blue-400">{sequence.stats.opened}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Opened</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <div className="text-lg font-bold text-emerald-400">{sequence.stats.replied}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Replied</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <div className="text-lg font-bold text-pink-400">{sequence.stats.meetings}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Meetings</div>
                    </div>
                  </div>

                  {/* Enrolled Leads */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="w-4 h-4" />
                      {sequence.leadsEnrolled} leads enrolled
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      onClick={() => {
                        setSelectedSequence(sequence);
                        enrollLeadsInSequence(sequence.id, leads.slice(0, 10));
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Leads
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create New Sequence */}
          <Card className="bg-slate-900 border-slate-800 border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => setShowSequenceEditor(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Sequence
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto Follow-ups Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" />
                Behavior-Based Automation Rules
              </CardTitle>
              <CardDescription>
                AI automatically triggers follow-ups based on lead engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    rule.enabled
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        rule.action === 'send_followup'
                          ? 'bg-blue-500/20 text-blue-400'
                          : rule.action === 'send_sms'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : rule.action === 'trigger_call'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}
                    >
                      {rule.action === 'send_followup' && <Mail className="w-5 h-5" />}
                      {rule.action === 'send_sms' && <MessageSquare className="w-5 h-5" />}
                      {rule.action === 'trigger_call' && <Phone className="w-5 h-5" />}
                      {rule.action === 'notify_calendar' && <Calendar className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{rule.name}</h4>
                      <p className="text-sm text-slate-400">
                        Trigger: {rule.trigger.replace(/_/g, ' ')} →{' '}
                        {rule.delay > 0 && `After ${rule.delay} ${rule.delayUnit}`}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Learning Card */}
          <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">AI Continuously Learns</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    The AI analyzes engagement patterns, identifies high-performing content, and automatically
                    optimizes subject lines, message timing, and channel selection for maximum response rates.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Subject line A/B testing</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Optimal send time detection</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Channel preference learning</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    Live Engagement Feed
                    {isAutomationActive && (
                      <span className="flex items-center gap-1 text-sm font-normal text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Real-time lead interactions across all channels</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {events.map((event) => {
                    const Icon = getEventIcon(event.type);
                    const colorClass = getEventColor(event.type);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{event.leadName}</h4>
                            <span className="text-xs text-slate-500">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{event.details}</p>
                          {event.type === 'meeting_scheduled' && (
                            <Badge className="mt-2 bg-pink-500/20 text-pink-400 border-pink-500/30">
                              <Calendar className="w-3 h-3 mr-1" />
                              Added to Calendar
                            </Badge>
                          )}
                          {event.type === 'email_reply' || event.type === 'sms_reply' ? (
                            <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Response Received
                            </Badge>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Response Rate', value: `${liveStats.responseRate}%`, icon: Reply, color: 'from-emerald-500 to-teal-500' },
              { label: 'Meetings Booked', value: liveStats.meetings, icon: Calendar, color: 'from-pink-500 to-rose-500' },
              { label: 'Total Outreach', value: liveStats.emailsSent + liveStats.smsSent + liveStats.callsMade, icon: Send, color: 'from-blue-500 to-cyan-500' },
              { label: 'AI Calls Made', value: liveStats.callsMade, icon: Phone, color: 'from-amber-500 to-orange-500' },
            ].map((stat, idx) => (
              <Card key={idx} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Results Delivery */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Results Delivered Automatically</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    All qualified leads, meeting requests, and responses are automatically sent to your email
                    inbox and calendar. You're completely hands-off.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Email Reports</div>
                        <div className="text-xs text-slate-500">Daily summary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <Calendar className="w-5 h-5 text-pink-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Calendar Sync</div>
                        <div className="text-xs text-slate-500">Auto-schedule meetings</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Lead Export</div>
                        <div className="text-xs text-slate-500">CRM integration</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sequence Editor Dialog */}
      <Dialog open={showSequenceEditor} onOpenChange={setShowSequenceEditor}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create Multi-Channel Sequence</DialogTitle>
            <DialogDescription>
              Build an automated sequence with emails, SMS, and AI calls
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Sequence Name</Label>
              <Input
                placeholder="e.g., Q1 Cold Outreach"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                placeholder="What does this sequence do?"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="font-medium text-violet-300">AI-Generated Steps</span>
              </div>
              <p className="text-sm text-slate-400">
                Based on your lead types and past performance, AI will generate an optimized sequence
                with personalized content for each step.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSequenceEditor(false)}>
              Cancel
            </Button>
            <Button
              className="bg-violet-500 hover:bg-violet-600"
              onClick={() => {
                toast.success('Sequence created with AI-generated content!');
                setShowSequenceEditor(false);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
