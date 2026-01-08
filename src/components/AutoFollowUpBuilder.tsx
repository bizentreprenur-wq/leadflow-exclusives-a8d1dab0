import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Mail, Clock, Zap, TrendingUp, Users, Play, Pause, Settings,
  CheckCircle, XCircle, RefreshCw, Sparkles, Calendar, ArrowRight,
  Brain, Target, BarChart3, Eye, MousePointer, MessageSquare, Edit
} from 'lucide-react';
import { getSends, getEmailStats, sendBulkEmails, EmailSend, EmailStats } from '@/lib/api/email';
import { fetchVerifiedLeads, updateLeadStatus, SavedLead } from '@/lib/api/verifiedLeads';
import { HIGH_CONVERTING_TEMPLATES, getTemplatePerformance } from '@/lib/highConvertingTemplates';

// Follow-up templates based on engagement pattern
const FOLLOW_UP_TEMPLATES = {
  noOpen: {
    name: 'Re-engagement (No Open)',
    subject: 'Did you see my message about {{business_name}}?',
    timing: 3, // days after initial
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

// Engagement pattern types
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

export default function AutoFollowUpBuilder() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [leadEngagements, setLeadEngagements] = useState<LeadEngagement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Sequence settings
  const [sequences, setSequences] = useState<FollowUpSequence[]>([
    { id: 'noOpen', name: 'No Open Follow-up', pattern: 'no_open', enabled: true, delayDays: 3, leadsEligible: 0 },
    { id: 'openedNoReply', name: 'Opened But No Reply', pattern: 'opened_no_reply', enabled: true, delayDays: 4, leadsEligible: 0 },
    { id: 'clickedNoReply', name: 'Clicked (Hot Lead!)', pattern: 'clicked_no_reply', enabled: true, delayDays: 2, leadsEligible: 0 },
    { id: 'finalNurture', name: 'Final Nurture', pattern: 'nurture', enabled: false, delayDays: 7, leadsEligible: 0 },
  ]);
  
  const [autoMode, setAutoMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, sendsRes, leadsRes] = await Promise.all([
        getEmailStats(30),
        getSends({ limit: 500 }),
        fetchVerifiedLeads(1, 500, { emailValid: true }),
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (sendsRes.success && sendsRes.sends) setSends(sendsRes.sends);
      if (leadsRes.success && leadsRes.data) setSavedLeads(leadsRes.data.leads);

      // Analyze engagement patterns
      analyzeEngagement(sendsRes.sends || [], leadsRes.data?.leads || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load engagement data');
    }
    setIsLoading(false);
  };

  const analyzeEngagement = (sends: EmailSend[], leads: SavedLead[]) => {
    const now = new Date();
    const engagements: LeadEngagement[] = [];
    const patternCounts: Record<EngagementPattern, number> = {
      no_open: 0,
      opened_no_reply: 0,
      clicked_no_reply: 0,
      nurture: 0,
    };

    // Group sends by email
    const sendsByEmail = sends.reduce((acc, send) => {
      const email = send.recipient_email.toLowerCase();
      if (!acc[email]) acc[email] = [];
      acc[email].push(send);
      return acc;
    }, {} as Record<string, EmailSend[]>);

    // Analyze each lead
    for (const lead of leads) {
      if (!lead.email || lead.outreachStatus === 'converted' || lead.outreachStatus === 'replied') continue;

      const leadSends = sendsByEmail[lead.email.toLowerCase()] || [];
      if (leadSends.length === 0) continue;

      // Get most recent send
      const latestSend = leadSends.sort((a, b) => 
        new Date(b.sent_at || b.created_at).getTime() - new Date(a.sent_at || a.created_at).getTime()
      )[0];

      if (!latestSend.sent_at) continue;

      const sentDate = new Date(latestSend.sent_at);
      const daysSince = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

      // Determine engagement pattern
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

      // Check eligibility based on delay
      const sequenceForPattern = sequences.find(s => s.pattern === pattern);
      const eligibleForFollowUp = sequenceForPattern 
        ? daysSince >= sequenceForPattern.delayDays && leadSends.length < 3 // Max 3 emails
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

    setLeadEngagements(engagements);
    
    // Update sequence counts
    setSequences(prev => prev.map(seq => ({
      ...seq,
      leadsEligible: patternCounts[seq.pattern] || 0,
    })));
  };

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
      case 'no_open': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      case 'opened_no_reply': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'clicked_no_reply': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'nurture': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
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

  const handleRunSequence = async (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence || sequence.leadsEligible === 0) {
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
      
      toast.info(`Sending follow-ups to ${eligibleLeads.length} leads...`);

      // Convert to email format
      const leadsForEmail = eligibleLeads.map(lead => ({
        id: lead.dbId,
        email: lead.email,
        business_name: lead.business_name,
        contact_name: lead.contact_name,
        website: lead.website,
        phone: lead.phone,
      }));

      // Build HTML template
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="white-space: pre-line; line-height: 1.6;">${template.body}</p>
        </div>
      `;

      // Send in batches
      const batchSize = 10;
      let sent = 0;
      
      for (let i = 0; i < leadsForEmail.length; i += batchSize) {
        const batch = leadsForEmail.slice(i, i + batchSize);
        
        await sendBulkEmails({
          leads: batch,
          custom_subject: template.subject,
          custom_body: htmlTemplate,
          send_mode: 'drip',
          drip_config: { emailsPerHour: 50, delayMinutes: 1 },
        });

        sent += batch.length;
        setProcessingProgress((sent / leadsForEmail.length) * 100);
      }

      // Update lead statuses
      for (const lead of eligibleLeads) {
        if (lead.dbId) {
          await updateLeadStatus(lead.dbId, { 
            outreachStatus: 'sent',
            sentAt: 'now'
          });
        }
      }

      toast.success(`✅ Sent ${eligibleLeads.length} follow-up emails!`);
      
      // Update sequence
      setSequences(prev => prev.map(s => 
        s.id === sequenceId 
          ? { ...s, lastRun: new Date().toISOString(), leadsEligible: 0 }
          : s
      ));

      // Refresh data
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send follow-ups');
    }

    setIsProcessing(false);
    setProcessingProgress(0);
  };

  const toggleSequence = (sequenceId: string) => {
    setSequences(prev => prev.map(s =>
      s.id === sequenceId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const updateSequenceDelay = (sequenceId: string, days: number) => {
    setSequences(prev => prev.map(s =>
      s.id === sequenceId ? { ...s, delayDays: days } : s
    ));
    // Re-analyze with new delay
    analyzeEngagement(sends, savedLeads);
  };

  const totalEligible = sequences.reduce((sum, s) => sum + (s.enabled ? s.leadsEligible : 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Analyzing lead engagement patterns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Auto Follow-Up Builder
          </h2>
          <p className="text-muted-foreground mt-1">
            Automatically send follow-ups based on engagement patterns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoMode} 
              onCheckedChange={setAutoMode}
              id="auto-mode"
            />
            <Label htmlFor="auto-mode" className="text-sm">
              Auto Mode {autoMode && <Badge variant="secondary" className="ml-1">Beta</Badge>}
            </Label>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEligible}</p>
                <p className="text-xs text-muted-foreground">Ready for Follow-up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {sequences.find(s => s.pattern === 'clicked_no_reply')?.leadsEligible || 0}
                </p>
                <p className="text-xs text-muted-foreground">Hot Leads (Clicked)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {sequences.find(s => s.pattern === 'opened_no_reply')?.leadsEligible || 0}
                </p>
                <p className="text-xs text-muted-foreground">Opened (Warm)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-500/20 bg-slate-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">
                  {sequences.find(s => s.pattern === 'no_open')?.leadsEligible || 0}
                </p>
                <p className="text-xs text-muted-foreground">No Open (Cold)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 mb-2">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <span className="font-medium">Sending follow-up emails...</span>
              <span className="text-muted-foreground ml-auto">{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Sequence Cards */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          Follow-up Sequences
        </h3>

        {sequences.map((sequence) => {
          const Icon = getPatternIcon(sequence.pattern);
          const template = getTemplateForPattern(sequence.pattern);
          
          return (
            <Card 
              key={sequence.id}
              className={`transition-all ${sequence.enabled ? 'border-primary/30' : 'border-border/50 opacity-60'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getPatternColor(sequence.pattern).replace('text-', 'bg-').replace('/10', '/20')}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{sequence.name}</h4>
                      <Badge variant="outline" className={getPatternColor(sequence.pattern)}>
                        {sequence.leadsEligible} eligible
                      </Badge>
                      {sequence.pattern === 'clicked_no_reply' && sequence.leadsEligible > 0 && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          🔥 Hot Leads
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      Trigger: {sequence.pattern === 'no_open' ? 'Email not opened' :
                                sequence.pattern === 'opened_no_reply' ? 'Opened but no reply' :
                                sequence.pattern === 'clicked_no_reply' ? 'Clicked link but no reply' :
                                '7+ days with no engagement'}
                    </p>

                    {/* Template Preview */}
                    <Card className="border-dashed bg-muted/30 mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{template.subject}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.body.substring(0, 150)}...
                        </p>
                      </CardContent>
                    </Card>

                    {/* Settings Row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Select 
                          value={sequence.delayDays.toString()}
                          onValueChange={(v) => updateSequenceDelay(sequence.id, parseInt(v))}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">After 1 day</SelectItem>
                            <SelectItem value="2">After 2 days</SelectItem>
                            <SelectItem value="3">After 3 days</SelectItem>
                            <SelectItem value="4">After 4 days</SelectItem>
                            <SelectItem value="5">After 5 days</SelectItem>
                            <SelectItem value="7">After 7 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {sequence.lastRun && (
                        <span className="text-xs text-muted-foreground">
                          Last run: {new Date(sequence.lastRun).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <Switch 
                      checked={sequence.enabled}
                      onCheckedChange={() => toggleSequence(sequence.id)}
                    />
                    <Button
                      onClick={() => handleRunSequence(sequence.id)}
                      disabled={!sequence.enabled || sequence.leadsEligible === 0 || isProcessing}
                      size="sm"
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Send Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Insights */}
      <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-600" />
            AI Follow-up Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm font-medium text-violet-600 mb-1">Best Follow-up Time</p>
              <p className="text-lg font-bold">Tuesday, 10:00 AM</p>
              <p className="text-xs text-muted-foreground">Based on your open rate patterns</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm font-medium text-violet-600 mb-1">Optimal Sequence Length</p>
              <p className="text-lg font-bold">2-3 Emails</p>
              <p className="text-xs text-muted-foreground">Higher response rate than 4+ emails</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm font-medium text-violet-600 mb-1">Predicted Response Rate</p>
              <p className="text-lg font-bold text-emerald-600">
                {sequences.find(s => s.pattern === 'clicked_no_reply')?.leadsEligible 
                  ? '35-45%' : '15-25%'}
              </p>
              <p className="text-xs text-muted-foreground">Based on engagement signals</p>
            </div>
          </div>

          {totalEligible > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div>
                <p className="font-medium">Ready to send all follow-ups?</p>
                <p className="text-sm text-muted-foreground">
                  {totalEligible} leads across {sequences.filter(s => s.enabled && s.leadsEligible > 0).length} sequences
                </p>
              </div>
              <Button
                onClick={async () => {
                  for (const seq of sequences.filter(s => s.enabled && s.leadsEligible > 0)) {
                    await handleRunSequence(seq.id);
                  }
                }}
                disabled={isProcessing}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Run All Sequences
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
