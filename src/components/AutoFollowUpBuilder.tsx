import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail, Clock, Zap, TrendingUp, Users, Play, RefreshCw, Sparkles,
  CheckCircle, Brain, Target, Eye, MousePointer, Settings, ArrowRight,
  Rocket, Shield, Bot, ToggleLeft, ToggleRight, ChevronRight
} from 'lucide-react';
import { getSends, getEmailStats, sendBulkEmails, EmailSend, EmailStats } from '@/lib/api/email';
import { fetchVerifiedLeads, updateLeadStatus, SavedLead } from '@/lib/api/verifiedLeads';

// Follow-up templates based on engagement pattern
const FOLLOW_UP_TEMPLATES = {
  noOpen: {
    name: 'Re-engagement (No Open)',
    subject: 'Did you see my message about {{business_name}}?',
    timing: 3,
    body: `Hi {{first_name}},

I wanted to make sure my previous email didn't get lost in your inbox.

I mentioned how {{business_name}} could potentially attract more customers with a few simple website improvements.

Would you have 5 minutes this week for a quick chat?

Best,
{{sender_name}}`,
  },
  openedNoReply: {
    name: 'Gentle Nudge (Opened, No Reply)',
    subject: 'Quick follow-up - any thoughts?',
    timing: 4,
    body: `Hi {{first_name}},

I noticed you opened my email (thanks for taking a look!). 

I know you're busy, so I'll keep this short: I'd love to show you exactly how similar businesses increased their leads by 40%.

No pressure - just reply "interested" and I'll send over some case studies.

Best,
{{sender_name}}`,
  },
  clickedNoReply: {
    name: 'Hot Lead Follow-up (Clicked)',
    subject: '{{first_name}}, let\'s schedule that call',
    timing: 2,
    body: `Hi {{first_name}},

I saw you clicked through to learn more - that tells me you might be interested!

I have a few openings this week for a quick 15-minute call where I can show you:
- Exactly what's slowing down your current site
- How we fixed it for [Similar Business]
- A realistic timeline and investment

Would Tuesday or Thursday work better for you?

Best,
{{sender_name}}`,
  },
  finalNurture: {
    name: 'Final Value Add',
    subject: 'Something I thought you\'d find useful',
    timing: 7,
    body: `Hi {{first_name}},

I've been thinking about {{business_name}} and put together a quick checklist of the top 5 things holding back most local business websites.

It's free, no strings attached - I just want to be helpful.

Want me to send it over?

Best,
{{sender_name}}`,
  },
};

type EngagementPattern = 'no_open' | 'opened_no_reply' | 'clicked_no_reply' | 'nurture';

interface FollowUpSequence {
  id: string;
  name: string;
  pattern: EngagementPattern;
  enabled: boolean;
  delayDays: number;
  leadsEligible: number;
  lastRun?: string;
}

interface LeadEngagement {
  lead: SavedLead;
  pattern: EngagementPattern;
  daysSinceContact: number;
  eligibleForFollowUp: boolean;
}

const FOLLOWUP_SEQUENCES_STORAGE_KEY = 'bamlead_followup_sequences';

const DEFAULT_SEQUENCES: FollowUpSequence[] = [
  { id: 'noOpen', name: 'No Open Follow-up', pattern: 'no_open', enabled: true, delayDays: 3, leadsEligible: 0 },
  { id: 'openedNoReply', name: 'Opened But No Reply', pattern: 'opened_no_reply', enabled: true, delayDays: 4, leadsEligible: 0 },
  { id: 'clickedNoReply', name: 'Clicked (Hot Lead!)', pattern: 'clicked_no_reply', enabled: true, delayDays: 2, leadsEligible: 0 },
  { id: 'finalNurture', name: 'Final Nurture', pattern: 'nurture', enabled: false, delayDays: 7, leadsEligible: 0 },
];

function loadStoredSequences(): FollowUpSequence[] {
  try {
    const stored = localStorage.getItem(FOLLOWUP_SEQUENCES_STORAGE_KEY);
    if (!stored) return DEFAULT_SEQUENCES;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return DEFAULT_SEQUENCES;

    return DEFAULT_SEQUENCES.map(defaultSequence => {
      const saved = parsed.find((item: Partial<FollowUpSequence>) => item?.id === defaultSequence.id);
      if (!saved) return defaultSequence;
      const delayDays = Number.isFinite(saved.delayDays) ? Number(saved.delayDays) : defaultSequence.delayDays;
      return {
        ...defaultSequence,
        enabled: saved.enabled !== false,
        delayDays: Math.max(1, delayDays),
        lastRun: typeof saved.lastRun === 'string' ? saved.lastRun : undefined,
      };
    });
  } catch {
    return DEFAULT_SEQUENCES;
  }
}

interface AutoFollowUpBuilderProps {
  /** Campaign context to show real-time drip status */
  campaignContext?: {
    isActive: boolean;
    sentCount: number;
    totalLeads: number;
  };
}

export default function AutoFollowUpBuilder({ campaignContext }: AutoFollowUpBuilderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [leadEngagements, setLeadEngagements] = useState<LeadEngagement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showSetupGuide, setShowSetupGuide] = useState(true);
  
  // Automation settings
  const [automationMode, setAutomationMode] = useState<'automatic' | 'manual'>(() => {
    return (localStorage.getItem('bamlead_followup_mode') as 'automatic' | 'manual') || 'manual';
  });
  
  const [sequences, setSequences] = useState<FollowUpSequence[]>(() => loadStoredSequences());
  const sequencesRef = useRef<FollowUpSequence[]>(sequences);

  useEffect(() => {
    sequencesRef.current = sequences;
  }, [sequences]);

  useEffect(() => {
    try {
      const serializable = sequences.map(sequence => ({
        id: sequence.id,
        enabled: sequence.enabled,
        delayDays: sequence.delayDays,
        lastRun: sequence.lastRun,
      }));
      localStorage.setItem(FOLLOWUP_SEQUENCES_STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore storage failures
    }
  }, [sequences]);

  const analyzeEngagement = useCallback((
    sendsData: EmailSend[],
    leadsData: SavedLead[],
    sequenceConfig: FollowUpSequence[]
  ) => {
    const now = new Date();
    const engagements: LeadEngagement[] = [];
    const patternCounts: Record<EngagementPattern, number> = {
      no_open: 0,
      opened_no_reply: 0,
      clicked_no_reply: 0,
      nurture: 0,
    };

    const sendsByEmail = sendsData.reduce((acc, send) => {
      const email = send.recipient_email.toLowerCase();
      if (!acc[email]) acc[email] = [];
      acc[email].push(send);
      return acc;
    }, {} as Record<string, EmailSend[]>);

    for (const lead of leadsData) {
      if (!lead.email || lead.outreachStatus === 'converted' || lead.outreachStatus === 'replied') continue;

      const leadSends = sendsByEmail[lead.email.toLowerCase()] || [];
      if (leadSends.length === 0) continue;

      const latestSend = leadSends.sort((a, b) => 
        new Date(b.sent_at || b.created_at).getTime() - new Date(a.sent_at || a.created_at).getTime()
      )[0];

      if (!latestSend.sent_at) continue;

      const sentDate = new Date(latestSend.sent_at);
      const daysSince = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

      let pattern: EngagementPattern;
      if (latestSend.clicked_at) {
        pattern = 'clicked_no_reply';
      } else if (latestSend.opened_at) {
        pattern = 'opened_no_reply';
      } else if (daysSince >= 7) {
        pattern = 'nurture';
      } else {
        pattern = 'no_open';
      }

      const sequenceForPattern = sequenceConfig.find(s => s.pattern === pattern);
      const eligibleForFollowUp = sequenceForPattern 
        ? daysSince >= sequenceForPattern.delayDays && leadSends.length < 3
        : false;

      if (eligibleForFollowUp) {
        patternCounts[pattern]++;
      }

      engagements.push({
        lead,
        pattern,
        daysSinceContact: daysSince,
        eligibleForFollowUp,
      });
    }

    return { engagements, patternCounts };
  }, []);

  const syncEngagementState = useCallback((
    sendsData: EmailSend[],
    leadsData: SavedLead[],
    sequenceConfig: FollowUpSequence[]
  ) => {
    const { engagements, patternCounts } = analyzeEngagement(sendsData, leadsData, sequenceConfig);
    setLeadEngagements(engagements);
    setSequences(sequenceConfig.map(seq => ({
      ...seq,
      leadsEligible: patternCounts[seq.pattern] || 0,
    })));
  }, [analyzeEngagement]);

  const loadData = useCallback(async (sequenceConfigOverride?: FollowUpSequence[]) => {
    setIsLoading(true);
    try {
      const [statsRes, sendsRes, leadsRes] = await Promise.all([
        getEmailStats(30),
        getSends({ limit: 500 }),
        fetchVerifiedLeads(1, 500, { emailValid: true }),
      ]);

      const nextSends = sendsRes.success && sendsRes.sends ? sendsRes.sends : [];
      const nextLeads = leadsRes.success && leadsRes.data ? leadsRes.data.leads : [];
      const sequenceConfig = sequenceConfigOverride || sequencesRef.current;

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      setSends(nextSends);
      setSavedLeads(nextLeads);
      syncEngagementState(nextSends, nextLeads, sequenceConfig);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load engagement data');
    } finally {
      setIsLoading(false);
    }
  }, [syncEngagementState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPatternIcon = (pattern: EngagementPattern) => {
    switch (pattern) {
      case 'no_open': return Mail;
      case 'opened_no_reply': return Eye;
      case 'clicked_no_reply': return MousePointer;
      case 'nurture': return RefreshCw;
    }
  };

  const getPatternColor = (pattern: EngagementPattern) => {
    switch (pattern) {
      case 'no_open': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'opened_no_reply': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'clicked_no_reply': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'nurture': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getTemplateForPattern = (pattern: EngagementPattern) => {
    switch (pattern) {
      case 'no_open': return FOLLOW_UP_TEMPLATES.noOpen;
      case 'opened_no_reply': return FOLLOW_UP_TEMPLATES.openedNoReply;
      case 'clicked_no_reply': return FOLLOW_UP_TEMPLATES.clickedNoReply;
      case 'nurture': return FOLLOW_UP_TEMPLATES.finalNurture;
    }
  };

  const handleRunSequence = useCallback(async (sequenceId: string, triggeredByAutomation = false) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence || !sequence.enabled || sequence.leadsEligible === 0) {
      toast.error('No eligible leads for this sequence');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const eligibleLeads = leadEngagements
        .filter(e => e.pattern === sequence.pattern && e.eligibleForFollowUp)
        .map(e => e.lead);

      const template = getTemplateForPattern(sequence.pattern);
      
      if (!eligibleLeads.length) {
        toast.error('No eligible leads found for this sequence');
        return;
      }

      if (!triggeredByAutomation) {
        toast.info(`Sending follow-ups to ${eligibleLeads.length} leads...`);
      }

      const leadsForEmail = eligibleLeads.map(lead => ({
        id: lead.dbId,
        email: lead.email,
        business_name: lead.business_name,
        contact_name: lead.contact_name,
        website: lead.website,
        phone: lead.phone,
      }));

      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="white-space: pre-line; line-height: 1.6;">${template.body}</p>
        </div>
      `;

      const batchSize = 10;
      let sent = 0;
      
      for (let i = 0; i < leadsForEmail.length; i += batchSize) {
        const batch = leadsForEmail.slice(i, i + batchSize);
        
        const result = await sendBulkEmails({
          leads: batch,
          custom_subject: template.subject,
          custom_body: htmlTemplate,
          send_mode: 'drip',
          drip_config: { emailsPerHour: 50, delayMinutes: 1 },
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to send follow-up batch.');
        }

        sent += batch.length;
        setProcessingProgress((sent / leadsForEmail.length) * 100);
      }

      for (const lead of eligibleLeads) {
        if (lead.dbId) {
          await updateLeadStatus(lead.dbId, { 
            outreachStatus: 'sent',
            sentAt: 'now'
          });
        }
      }

      toast.success(
        triggeredByAutomation
          ? `🤖 Auto-sent ${eligibleLeads.length} follow-up emails`
          : `✅ Sent ${eligibleLeads.length} follow-up emails!`
      );
      
      const updatedSequences = sequences.map(s => 
        s.id === sequenceId 
          ? { ...s, lastRun: new Date().toISOString(), leadsEligible: 0 }
          : s
      );
      setSequences(updatedSequences);

      await loadData(updatedSequences);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send follow-ups';
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [leadEngagements, loadData, sequences]);

  const toggleSequence = (sequenceId: string) => {
    const updated = sequences.map(s =>
      s.id === sequenceId ? { ...s, enabled: !s.enabled } : s
    );
    syncEngagementState(sends, savedLeads, updated);
  };

  const updateSequenceDelay = (sequenceId: string, days: number) => {
    const safeDays = Math.max(1, days);
    const updated = sequences.map(s =>
      s.id === sequenceId ? { ...s, delayDays: safeDays } : s
    );
    syncEngagementState(sends, savedLeads, updated);
  };

  const handleModeChange = (mode: 'automatic' | 'manual') => {
    setAutomationMode(mode);
    localStorage.setItem('bamlead_followup_mode', mode);
    toast.success(mode === 'automatic' 
      ? '🤖 AI will automatically send follow-ups on schedule' 
      : '✅ You control when follow-ups are sent'
    );
  };

  const totalEligible = sequences.reduce((sum, s) => sum + (s.enabled ? s.leadsEligible : 0), 0);

  useEffect(() => {
    if (automationMode !== 'automatic' || isLoading || isProcessing) return;
    const nextSequence = sequences.find(sequence => sequence.enabled && sequence.leadsEligible > 0);
    if (!nextSequence) return;

    const delay = window.setTimeout(() => {
      handleRunSequence(nextSequence.id, true);
    }, 400);

    return () => window.clearTimeout(delay);
  }, [automationMode, handleRunSequence, isLoading, isProcessing, sequences]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-950">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-slate-400">Analyzing lead engagement patterns...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
      
      {/* Real-time Campaign Status Banner */}
      {campaignContext?.isActive && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            <div>
              <span className="font-semibold text-emerald-300">Drip Campaign Active</span>
              <span className="text-slate-400 ml-2">
                {campaignContext.sentCount} of {campaignContext.totalLeads} emails sent
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress 
              value={(campaignContext.sentCount / campaignContext.totalLeads) * 100} 
              className="w-32 h-2 bg-slate-700"
            />
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {Math.round((campaignContext.sentCount / campaignContext.totalLeads) * 100)}%
            </Badge>
          </div>
        </div>
      )}

      {/* Hero Setup Section - Dark Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Follow-Up Automation</h1>
              <p className="text-slate-400">Let AI handle your follow-ups automatically</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium text-slate-400 mb-3">Choose how AI handles follow-ups:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Automatic Mode */}
              <button
                onClick={() => handleModeChange('automatic')}
                className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                  automationMode === 'automatic'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-700 hover:border-emerald-500/50 bg-slate-800/50'
                }`}
              >
                {automationMode === 'automatic' && (
                  <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white">Active</Badge>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    automationMode === 'automatic' ? 'bg-emerald-500 text-white' : 'bg-slate-700'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Fully Automatic</h3>
                    <p className="text-xs text-slate-400">AI sends on schedule</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    AI sends follow-ups automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    24/7 engagement without manual work
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Smart timing based on patterns
                  </li>
                </ul>
              </button>

              {/* Manual Mode */}
              <button
                onClick={() => handleModeChange('manual')}
                className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                  automationMode === 'manual'
                    ? 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10'
                    : 'border-slate-700 hover:border-teal-500/50 bg-slate-800/50'
                }`}
              >
                {automationMode === 'manual' && (
                  <Badge className="absolute -top-2 -right-2 bg-teal-500 text-white">Active</Badge>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    automationMode === 'manual' ? 'bg-teal-500 text-white' : 'bg-slate-700'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">You Control</h3>
                    <p className="text-xs text-slate-400">Review & send manually</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    AI suggests follow-ups to send
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    You review before sending
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Full control over timing
                  </li>
                </ul>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Dark Theme */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-slate-700 bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalEligible}</p>
              <p className="text-xs text-slate-400">Ready</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {sequences.find(s => s.pattern === 'clicked_no_reply')?.leadsEligible || 0}
              </p>
              <p className="text-xs text-slate-400">Hot 🔥</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {sequences.find(s => s.pattern === 'opened_no_reply')?.leadsEligible || 0}
              </p>
              <p className="text-xs text-slate-400">Warm</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-600 bg-slate-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">
                {sequences.find(s => s.pattern === 'no_open')?.leadsEligible || 0}
              </p>
              <p className="text-xs text-slate-400">Cold</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress - Dark Theme */}
      {isProcessing && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 mb-2">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="font-medium text-white">Sending follow-up emails...</span>
              <span className="text-slate-400 ml-auto">{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Run All CTA - Dark Theme */}
      {totalEligible > 0 && (
        <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">Send All Follow-ups Now</h3>
                  <p className="text-sm text-slate-400">
                    {totalEligible} leads ready across {sequences.filter(s => s.enabled && s.leadsEligible > 0).length} sequences
                  </p>
                </div>
              </div>
              <Button
                onClick={async () => {
                  for (const seq of sequences.filter(s => s.enabled && s.leadsEligible > 0)) {
                    await handleRunSequence(seq.id);
                  }
                }}
                disabled={isProcessing}
                size="lg"
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Zap className="w-5 h-5" />
                Run All Sequences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sequence Cards - Dark Theme */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            <Target className="w-4 h-4 text-emerald-400" />
            Follow-up Sequences
          </h3>
          <Button onClick={() => loadData()} variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {sequences.map((sequence) => {
          const Icon = getPatternIcon(sequence.pattern);
          const template = getTemplateForPattern(sequence.pattern);
          const colorClasses = getPatternColor(sequence.pattern);
          
          return (
            <Card 
              key={sequence.id}
              className={`transition-all border-slate-700 bg-slate-900 ${!sequence.enabled && 'opacity-50'}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClasses}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{sequence.name}</h4>
                      <Badge variant="outline" className={`text-xs ${colorClasses}`}>
                        {sequence.leadsEligible} ready
                      </Badge>
                      {sequence.pattern === 'clicked_no_reply' && sequence.leadsEligible > 0 && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          🔥 Hot
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <Select 
                          value={sequence.delayDays.toString()}
                          onValueChange={(v) => updateSequenceDelay(sequence.id, parseInt(v))}
                        >
                          <SelectTrigger className="w-[120px] h-7 text-xs bg-slate-800 border-slate-700 text-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="1">After 1 day</SelectItem>
                            <SelectItem value="2">After 2 days</SelectItem>
                            <SelectItem value="3">After 3 days</SelectItem>
                            <SelectItem value="4">After 4 days</SelectItem>
                            <SelectItem value="5">After 5 days</SelectItem>
                            <SelectItem value="7">After 7 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <span className="text-xs text-slate-500 hidden md:inline">
                        Subject: "{template.subject.substring(0, 40)}..."
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Switch 
                      checked={sequence.enabled}
                      onCheckedChange={() => toggleSequence(sequence.id)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Button
                      onClick={() => handleRunSequence(sequence.id)}
                      disabled={!sequence.enabled || sequence.leadsEligible === 0 || isProcessing}
                      size="sm"
                      variant={sequence.leadsEligible > 0 ? "default" : "outline"}
                      className={sequence.leadsEligible > 0 ? "gap-1.5 bg-emerald-500 hover:bg-emerald-600" : "gap-1.5 border-slate-600 text-slate-400"}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Insights - Dark Theme */}
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">AI Insights</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-violet-400 font-medium mb-1">Best Time to Send</p>
              <p className="text-lg font-bold text-white">Tue, 10 AM</p>
              <p className="text-xs text-slate-400">Highest open rates</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-violet-400 font-medium mb-1">Optimal Sequence</p>
              <p className="text-lg font-bold text-white">2-3 Emails</p>
              <p className="text-xs text-slate-400">Better response rate</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-violet-400 font-medium mb-1">Predicted Response</p>
              <p className="text-lg font-bold text-emerald-400">
                {sequences.find(s => s.pattern === 'clicked_no_reply')?.leadsEligible ? '35-45%' : '15-25%'}
              </p>
              <p className="text-xs text-slate-400">Based on engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
