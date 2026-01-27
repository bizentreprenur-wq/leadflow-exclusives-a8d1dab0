import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PenTool, Send, Calendar, Bot, Sparkles, ChevronDown, ChevronUp,
  User, Building2, Mail, Clock, Zap, Target, Play, Pause, RefreshCw,
  CheckCircle2, ArrowRight, Flame, ThermometerSun, Snowflake, FileText,
  Settings2, Users, TrendingUp, Rocket
} from 'lucide-react';
import LeadQueueIndicator from './LeadQueueIndicator';
import AISubjectLineGenerator from './AISubjectLineGenerator';
import EmailScheduleCalendar from './EmailScheduleCalendar';
import PriorityTemplateSelector from './PriorityTemplateSelector';
import { isSMTPConfigured, sendSingleEmail } from '@/lib/emailService';
import { sendEmail as apiSendEmail } from '@/lib/api/email';

interface Lead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  contact_name?: string;
  first_name?: string;
  industry?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  priority?: string;
  leadScore?: number;
  hasWebsite?: boolean;
  websiteIssues?: string[];
}

interface EnhancedComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  currentLeadIndex: number;
  lastSentIndex: number;
  onLeadIndexChange: (index: number) => void;
  onEmailSent: (index: number) => void;
  initialEmail?: { to: string; subject: string; body: string };
  automationSettings: {
    doneForYouMode: boolean;
    autoFollowUps: boolean;
  };
  onAutomationChange: (settings: any) => void;
}

type ComposeTab = 'compose' | 'queue' | 'ai-control' | 'campaign';

export default function EnhancedComposeModal({
  isOpen,
  onClose,
  leads,
  currentLeadIndex,
  lastSentIndex,
  onLeadIndexChange,
  onEmailSent,
  initialEmail,
  automationSettings,
  onAutomationChange,
}: EnhancedComposeModalProps) {
  const [activeTab, setActiveTab] = useState<ComposeTab>('compose');
  const [email, setEmail] = useState({ to: '', subject: '', body: '', scheduledFor: null as Date | null });
  const [isSending, setIsSending] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAISubjects, setShowAISubjects] = useState(true);
  const [dripMode, setDripMode] = useState(false);
  const [dripInterval, setDripInterval] = useState(30); // seconds between sends

  const currentLead = useMemo(() => leads[currentLeadIndex] || null, [leads, currentLeadIndex]);

  // Initialize email with current lead or initial values
  useEffect(() => {
    if (initialEmail) {
      setEmail({ ...initialEmail, scheduledFor: null });
    } else if (currentLead?.email) {
      setEmail(prev => ({ ...prev, to: currentLead.email || '' }));
    }
  }, [currentLead, initialEmail]);

  // Send single email
  const handleSend = async () => {
    if (!email.to || !email.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }

    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first');
      return;
    }

    setIsSending(true);
    try {
      await sendSingleEmail({
        to: email.to,
        subject: email.subject,
        bodyHtml: `<p>${email.body.replace(/\n/g, '<br/>')}</p>`,
        leadId: String(currentLead?.id || 'manual'),
      });
      toast.success('Email sent successfully!');
      onEmailSent(currentLeadIndex);

      // Auto-advance to next lead
      if (currentLeadIndex < leads.length - 1) {
        const nextLead = leads[currentLeadIndex + 1];
        onLeadIndexChange(currentLeadIndex + 1);
        setEmail({ to: nextLead?.email || '', subject: '', body: '', scheduledFor: null });
      } else {
        setEmail({ to: '', subject: '', body: '', scheduledFor: null });
        toast.info('All leads in queue processed!');
      }
    } catch {
      toast.error('Failed to send email');
    }
    setIsSending(false);
  };

  // Schedule email
  const handleSchedule = async (date: Date) => {
    if (!email.to || !email.subject) {
      toast.error('Please fill in recipient and subject before scheduling');
      return;
    }

    try {
      await apiSendEmail({
        to: email.to,
        subject: email.subject,
        body_html: `<p>${email.body.replace(/\n/g, '<br/>')}</p>`,
        track_opens: true,
      });

      // Also save locally
      const key = 'bamlead_scheduled_manual_emails';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        id: crypto.randomUUID?.() || Date.now().toString(),
        type: 'manual_compose',
        to: email.to,
        subject: email.subject,
        body: email.body,
        scheduledFor: date.toISOString(),
        createdAt: new Date().toISOString(),
        leadPriority: currentLead?.aiClassification || 'cold',
      });
      localStorage.setItem(key, JSON.stringify(existing));

      toast.success(`Queued for ${date.toLocaleString()}`);
      setShowScheduler(false);
      setEmail({ to: '', subject: '', body: '', scheduledFor: null });
    } catch {
      toast.error('Failed to schedule email');
    }
  };

  // Start drip campaign
  const handleStartDrip = () => {
    if (!automationSettings.doneForYouMode) {
      toast.error('Enable AI Autopilot to start drip campaigns');
      return;
    }
    
    // Save drip campaign state
    localStorage.setItem('bamlead_drip_active', JSON.stringify({
      active: true,
      leads: leads.map(l => l.id),
      currentIndex: currentLeadIndex,
      interval: dripInterval,
      startedAt: new Date().toISOString(),
    }));
    
    toast.success('Drip campaign started! AI will send emails automatically.');
    onClose();
  };

  const getPriorityIcon = () => {
    switch (currentLead?.aiClassification) {
      case 'hot': return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Snowflake className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent elevated className="max-w-2xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              Compose Email
              {automationSettings.doneForYouMode && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] ml-2">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Autopilot
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Write and send an email manually or schedule for later
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ComposeTab)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-muted/50 border border-border p-1 flex-shrink-0">
              <TabsTrigger value="compose" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="queue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5" />
                Lead Queue
                {leads.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1">{leads.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ai-control" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs">
                <Bot className="w-3.5 h-3.5" />
                AI Control
              </TabsTrigger>
              <TabsTrigger value="campaign" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-xs">
                <Rocket className="w-3.5 h-3.5" />
                Drip Campaign
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* COMPOSE TAB */}
              <TabsContent value="compose" className="mt-4 space-y-4 px-1">
                {/* Lead Queue Indicator */}
                {leads.length > 0 && (
                  <LeadQueueIndicator
                    leads={leads}
                    currentIndex={currentLeadIndex}
                    lastSentIndex={lastSentIndex}
                    variant="compact"
                  />
                )}

                {/* Current Lead Info */}
                {currentLead && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {currentLead.business_name || currentLead.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">{currentLead.email}</p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      {getPriorityIcon()}
                      {currentLead.aiClassification || 'cold'}
                    </Badge>
                  </div>
                )}

                {/* AI Subject Line Generator */}
                {showAISubjects && (
                  <AISubjectLineGenerator
                    currentLead={currentLead ? {
                      business_name: currentLead.business_name || currentLead.name,
                      first_name: currentLead.first_name || currentLead.contact_name,
                      industry: currentLead.industry,
                      aiClassification: currentLead.aiClassification,
                      hasWebsite: !!currentLead.website,
                      websiteIssues: currentLead.websiteIssues,
                    } : undefined}
                    onSelect={(subject) => setEmail(prev => ({ ...prev, subject }))}
                  />
                )}

                {/* Email Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">To</label>
                    <Input
                      value={email.to}
                      onChange={(e) => setEmail(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="recipient@email.com"
                      className="bg-muted/30 border-border"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-foreground">Subject</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAISubjects(!showAISubjects)}
                        className="h-6 text-[10px] gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-primary" />
                        {showAISubjects ? 'Hide AI' : 'AI Suggestions'}
                      </Button>
                    </div>
                    <Input
                      value={email.subject}
                      onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Email subject..."
                      className="bg-muted/30 border-border"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-foreground">Message</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTemplateSelector(true)}
                        className="text-xs h-7 gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        Priority Templates
                      </Button>
                    </div>
                    <Textarea
                      value={email.body}
                      onChange={(e) => setEmail(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Write your message..."
                      rows={6}
                      className="bg-muted/30 border-border"
                    />
                  </div>

                  {/* Schedule Section */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Schedule Send
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowScheduler(!showScheduler)}
                        className="text-xs"
                      >
                        {showScheduler ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showScheduler ? 'Hide' : 'Show Options'}
                      </Button>
                    </div>
                    {showScheduler && (
                      <EmailScheduleCalendar
                        onSchedule={handleSchedule}
                        onSendNow={handleSend}
                      />
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!showScheduler && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                      onClick={handleSend}
                      disabled={isSending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Now
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* LEAD QUEUE TAB */}
              <TabsContent value="queue" className="mt-4 space-y-4 px-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Email Queue ({leads.length} leads)</h4>
                  <Badge variant="outline" className="text-xs">
                    Position: {currentLeadIndex + 1} of {leads.length}
                  </Badge>
                </div>

                <LeadQueueIndicator
                  leads={leads}
                  currentIndex={currentLeadIndex}
                  lastSentIndex={lastSentIndex}
                  variant="horizontal"
                />

                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {leads.map((lead, idx) => (
                    <button
                      key={lead.id || idx}
                      onClick={() => {
                        onLeadIndexChange(idx);
                        setEmail(prev => ({ ...prev, to: lead.email || '' }));
                        setActiveTab('compose');
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        idx === currentLeadIndex
                          ? "border-primary bg-primary/10"
                          : idx <= lastSentIndex
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            idx <= lastSentIndex
                              ? "bg-emerald-500/20 text-emerald-400"
                              : idx === currentLeadIndex
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {idx <= lastSentIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lead.business_name || lead.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {lead.aiClassification || 'cold'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* AI CONTROL TAB */}
              <TabsContent value="ai-control" className="mt-4 space-y-4 px-1">
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">AI Autopilot Mode</h3>
                        <p className="text-xs text-muted-foreground">Let AI manage your outreach automatically</p>
                      </div>
                    </div>
                    <Switch
                      checked={automationSettings.doneForYouMode}
                      onCheckedChange={(v) => onAutomationChange({ ...automationSettings, doneForYouMode: v })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                <Separator />

                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">AI Follow-Ups</h4>
                        <p className="text-xs text-muted-foreground">Auto-send follow-ups based on engagement</p>
                      </div>
                    </div>
                    <Switch
                      checked={automationSettings.autoFollowUps}
                      onCheckedChange={(v) => onAutomationChange({ ...automationSettings, autoFollowUps: v })}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </div>

                {automationSettings.doneForYouMode && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      AI is managing your outreach
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leads are being nurtured automatically. You'll be notified when someone replies.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* DRIP CAMPAIGN TAB */}
              <TabsContent value="campaign" className="mt-4 space-y-4 px-1">
                <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Drip Campaign</h3>
                      <p className="text-xs text-muted-foreground">Automatically send emails with human-like pacing</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Enable Drip Mode</label>
                      <Switch
                        checked={dripMode}
                        onCheckedChange={setDripMode}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {dripMode && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-2">
                            Delay Between Emails
                          </label>
                          <div className="flex gap-2">
                            {[30, 60, 120, 300].map(sec => (
                              <Button
                                key={sec}
                                size="sm"
                                variant={dripInterval === sec ? 'default' : 'outline'}
                                onClick={() => setDripInterval(sec)}
                                className={cn("text-xs", dripInterval === sec && "bg-orange-500")}
                              >
                                {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30 border border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Target className="w-3.5 h-3.5 text-primary" />
                            <span>
                              <strong className="text-foreground">{leads.length}</strong> leads will receive emails
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              Estimated duration: <strong className="text-foreground">
                                {Math.ceil((leads.length * dripInterval) / 60)} minutes
                              </strong>
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={handleStartDrip}
                          disabled={!automationSettings.doneForYouMode}
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Drip Campaign
                        </Button>

                        {!automationSettings.doneForYouMode && (
                          <p className="text-xs text-amber-400 text-center">
                            Enable AI Autopilot in the "AI Control" tab to start drip campaigns
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Priority Template Selector */}
      <PriorityTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={(template) => {
          setEmail(prev => ({
            ...prev,
            subject: template.subject,
            body: template.body,
          }));
        }}
        currentLead={currentLead ? {
          business_name: currentLead.business_name || currentLead.name,
          first_name: currentLead.first_name,
          email: currentLead.email,
          website: currentLead.website,
          industry: currentLead.industry,
          aiClassification: currentLead.aiClassification,
          priority: (currentLead.priority as 'hot' | 'warm' | 'cold') || currentLead.aiClassification,
          leadScore: currentLead.leadScore,
          hasWebsite: !!currentLead.website,
          websiteIssues: currentLead.websiteIssues,
        } : undefined}
      />
    </>
  );
}
