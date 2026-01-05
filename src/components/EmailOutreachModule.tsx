import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail, Send, FileText, BarChart3, Loader2, Plus, Trash2,
  Edit, Eye, Users, CheckCircle, AlertCircle, Clock, MousePointer,
  Reply, XCircle, Sparkles, Database, RefreshCw, Star, Building2, 
  RotateCcw, Calendar, Timer, ArrowRight, ArrowLeft, PartyPopper,
  Zap, CheckCheck, ChevronRight, TrendingUp, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPie, Pie
} from 'recharts';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendBulkEmails,
  getSends,
  getEmailStats,
  getScheduledEmails,
  cancelScheduledEmail,
  personalizeTemplate,
  EmailTemplate,
  EmailSend,
  EmailStats,
  LeadForEmail,
  ScheduledEmail,
} from '@/lib/api/email';
import { fetchVerifiedLeads, updateLeadStatus, type SavedLead } from '@/lib/api/verifiedLeads';

interface EmailOutreachModuleProps {
  selectedLeads?: LeadForEmail[];
  onClearSelection?: () => void;
}

type WizardStep = 'start' | 'select-leads' | 'choose-template' | 'schedule' | 'review' | 'success' | 'sent-leads';

export default function EmailOutreachModule({ selectedLeads = [], onClearSelection }: EmailOutreachModuleProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('start');
  
  // Data state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', body: '' });
  
  // Selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [isLoadingSavedLeads, setIsLoadingSavedLeads] = useState(false);
  const [selectedSavedLeadIds, setSelectedSavedLeadIds] = useState<Set<string>>(new Set());
  const [leadsFromPicker, setLeadsFromPicker] = useState<LeadForEmail[]>([]);
  
  // Scheduling state
  const [scheduleMode, setScheduleMode] = useState<'now' | 'optimal' | 'custom'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  
  // Success state
  const [lastSendResult, setLastSendResult] = useState<{ sent: number; failed: number; scheduled?: string } | null>(null);

  // Merge selected leads from props and picker
  const allSelectedLeads = [...selectedLeads, ...leadsFromPicker];
  const leadsWithEmail = allSelectedLeads.filter(l => l.email);
  
  // Filter out already-emailed leads
  const availableLeads = savedLeads.filter(l => 
    l.outreachStatus !== 'sent' && 
    l.outreachStatus !== 'replied' && 
    l.outreachStatus !== 'converted' && 
    l.outreachStatus !== 'bounced'
  );

  // Sent leads (for the 'View Sent' tab)
  const sentLeads = savedLeads.filter(l => 
    l.outreachStatus === 'sent' || 
    l.outreachStatus === 'replied' || 
    l.outreachStatus === 'converted' || 
    l.outreachStatus === 'bounced'
  );

  // Handle status update for sent leads
  const handleUpdateSentStatus = async (leadId: number, newStatus: SavedLead['outreachStatus']) => {
    const result = await updateLeadStatus(leadId, { outreachStatus: newStatus || 'pending' });
    if (result.success) {
      toast.success(`Lead marked as ${newStatus}!`);
      loadSavedLeads();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: SavedLead['outreachStatus']) => {
    switch (status) {
      case 'sent':
        return { icon: Send, label: 'Sent', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'replied':
        return { icon: Reply, label: 'Replied!', className: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'converted':
        return { icon: CheckCircle, label: 'Converted!', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'bounced':
        return { icon: XCircle, label: 'Bounced', className: 'bg-red-500/10 text-red-600 border-red-500/20' };
      default:
        return { icon: Clock, label: 'Pending', className: 'bg-muted text-muted-foreground' };
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // If leads are passed from verification, go straight to template selection
    if (selectedLeads.length > 0 && currentStep === 'start') {
      setCurrentStep('choose-template');
    }
  }, [selectedLeads]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [templatesRes, sendsRes, statsRes, scheduledRes] = await Promise.all([
        getTemplates(),
        getSends({ limit: 20 }),
        getEmailStats(30),
        getScheduledEmails(),
      ]);
      
      if (templatesRes.success) setTemplates(templatesRes.templates);
      if (sendsRes.success) setSends(sendsRes.sends);
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (scheduledRes.success) setScheduledEmails(scheduledRes.emails);
    } catch (error) {
      console.error('Failed to load email data:', error);
    }
    setIsLoading(false);
  };

  const loadSavedLeads = async () => {
    setIsLoadingSavedLeads(true);
    try {
      const response = await fetchVerifiedLeads(1, 200, { emailValid: true });
      if (response.success && response.data) {
        setSavedLeads(response.data.leads);
      }
    } catch (error) {
      console.error('Failed to load saved leads:', error);
    }
    setIsLoadingSavedLeads(false);
  };

  const handleToggleSavedLead = (leadId: string) => {
    setSelectedSavedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleConfirmLeadSelection = () => {
    const selected = availableLeads.filter(l => selectedSavedLeadIds.has(l.id));
    const converted: LeadForEmail[] = selected.map(l => ({
      id: l.dbId,
      email: l.email,
      business_name: l.business_name,
      contact_name: l.contact_name,
      website: l.website,
      platform: l.platform,
      issues: l.issues,
      phone: l.phone,
    }));
    setLeadsFromPicker(converted);
    setCurrentStep('choose-template');
  };

  const handleClearAllLeads = () => {
    onClearSelection?.();
    setLeadsFromPicker([]);
    setSelectedSavedLeadIds(new Set());
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body_html) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingTemplate.id) {
        const result = await updateTemplate(editingTemplate.id, editingTemplate);
        if (result.success) {
          toast.success('Template updated!');
          setTemplateDialogOpen(false);
          loadData();
        } else {
          toast.error(result.error || 'Failed to update template');
        }
      } else {
        const result = await createTemplate({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          body_html: editingTemplate.body_html,
          body_text: editingTemplate.body_text,
          is_default: editingTemplate.is_default || false,
        });
        if (result.success) {
          toast.success('Template created!');
          setTemplateDialogOpen(false);
          loadData();
        } else {
          toast.error(result.error || 'Failed to create template');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    
    const result = await deleteTemplate(id);
    if (result.success) {
      toast.success('Template deleted');
      loadData();
    } else {
      toast.error(result.error || 'Failed to delete template');
    }
  };

  const getNextOptimalTime = (): string => {
    const now = new Date();
    const optimalHours = [10, 14];
    const optimalDays = [2, 3, 4];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayOfWeek = checkDate.getDay();
      
      if (optimalDays.includes(dayOfWeek)) {
        for (const hour of optimalHours) {
          const slotTime = new Date(checkDate);
          slotTime.setHours(hour, 0, 0, 0);
          
          if (slotTime > now) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return `${dayNames[slotTime.getDay()]}, ${slotTime.toLocaleDateString()} at ${slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          }
        }
      }
    }
    
    return 'Next Tuesday at 10:00 AM';
  };

  const handleSendEmails = async () => {
    if (!selectedTemplateId || leadsWithEmail.length === 0) return;

    // Calculate scheduled time
    let scheduledFor: string | undefined;
    if (scheduleMode === 'optimal') {
      const now = new Date();
      const optimalHours = [10, 14];
      const optimalDays = [2, 3, 4];
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        
        if (optimalDays.includes(dayOfWeek)) {
          for (const hour of optimalHours) {
            const slotTime = new Date(checkDate);
            slotTime.setHours(hour, 0, 0, 0);
            
            if (slotTime > now) {
              scheduledFor = slotTime.toISOString();
              break;
            }
          }
          if (scheduledFor) break;
        }
      }
    } else if (scheduleMode === 'custom' && scheduledDate) {
      scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    setIsSending(true);
    try {
      const result = await sendBulkEmails({
        leads: leadsWithEmail,
        template_id: parseInt(selectedTemplateId),
        scheduled_for: scheduledFor,
      });
      
      if (result.success && result.results) {
        const { sent, failed } = result.results;
        
        setLastSendResult({
          sent,
          failed,
          scheduled: scheduledFor ? new Date(scheduledFor).toLocaleString() : undefined
        });
        
        // Update outreach status for successfully sent leads
        for (const lead of leadsFromPicker) {
          if (lead.id && lead.email) {
            await updateLeadStatus(Number(lead.id), {
              outreachStatus: 'sent',
              sentAt: 'now'
            });
          }
        }
        
        setCurrentStep('success');
        loadData();
      } else {
        toast.error(result.error || 'Failed to send emails');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send emails');
    }
    setIsSending(false);
  };

  const handlePreview = (template: EmailTemplate) => {
    const sampleData = {
      business_name: 'Acme Plumbing Co',
      first_name: 'John',
      website: 'www.acmeplumbing.com',
      platform: 'WordPress',
      issues: 'Slow loading, Not mobile-friendly',
      phone: '(555) 123-4567',
      email: 'contact@acmeplumbing.com',
    };
    
    setPreviewContent({
      subject: personalizeTemplate(template.subject, sampleData),
      body: personalizeTemplate(template.body_html, sampleData),
    });
    setPreviewDialogOpen(true);
  };

  const handleStartOver = () => {
    handleClearAllLeads();
    setSelectedTemplateId('');
    setScheduleMode('now');
    setScheduledDate('');
    setLastSendResult(null);
    setCurrentStep('start');
  };

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);

  // Template editor and preview dialogs (always rendered)
  const dialogs = (
    <>
      {/* Template Editor Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable email template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={editingTemplate?.name || ''}
                onChange={e => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Website Upgrade Offer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                value={editingTemplate?.subject || ''}
                onChange={e => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Quick question about your website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body">Email Body</Label>
              <Textarea
                id="template-body"
                value={editingTemplate?.body_html || ''}
                onChange={e => setEditingTemplate(prev => ({ ...prev, body_html: e.target.value }))}
                placeholder="Write your email content here..."
                className="min-h-[200px]"
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Personalization tokens you can use:
              </p>
              <div className="flex flex-wrap gap-2">
                {['{{business_name}}', '{{first_name}}', '{{website}}', '{{email}}'].map(token => (
                  <Badge key={token} variant="outline" className="text-xs">
                    {token}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate?.id ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>This is how your email will look</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Subject:</p>
              <p className="text-sm">{previewContent.subject}</p>
            </div>

            <div className="p-4 bg-background border rounded-lg">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent.body }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isLoading) {
    return (
      <>
        {dialogs}
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your email tools...</p>
        </div>
      </>
    );
  }

  // ============================================
  // STEP: START - Welcome screen
  // ============================================
  if (currentStep === 'start') {
    return (
      <>
        {dialogs}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Send Emails to Your Leads</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ready to reach out? Let's do it step by step — super easy!
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {stats && stats.total_sent > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.total_sent}</p>
                  <p className="text-xs text-muted-foreground">Emails Sent</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.open_rate}%</p>
                  <p className="text-xs text-muted-foreground">Opened</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.reply_rate}%</p>
                  <p className="text-xs text-muted-foreground">Replied</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Actions */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-16 text-lg gap-3"
              onClick={() => {
                loadSavedLeads();
                setCurrentStep('select-leads');
              }}
            >
              <Zap className="w-5 h-5" />
              Start Sending Emails
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 gap-2"
                onClick={() => {
                  setEditingTemplate({ name: '', subject: '', body_html: '', is_default: false });
                  setTemplateDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
              <Button
                variant="outline"
                className="h-14 gap-2"
                onClick={() => {
                  loadSavedLeads();
                  setCurrentStep('select-leads');
                }}
              >
                <FileText className="w-4 h-4" />
                View Templates ({templates.length})
              </Button>
            </div>
          </div>

          {/* View Sent Leads button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 gap-3"
            onClick={() => {
              loadSavedLeads();
              setCurrentStep('sent-leads');
            }}
          >
            <BarChart3 className="w-5 h-5" />
            View Sent Leads
            <Badge variant="secondary" className="ml-auto">{sentLeads.length}</Badge>
          </Button>

          {/* Scheduled emails reminder */}
          {scheduledEmails.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-medium">You have {scheduledEmails.length} scheduled email{scheduledEmails.length > 1 ? 's' : ''}</p>
                    <p className="text-sm text-muted-foreground">
                      Next send: {new Date(scheduledEmails[0].scheduled_for).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  }

  // ============================================
  // STEP: VIEW SENT LEADS
  // ============================================
  if (currentStep === 'sent-leads') {
    const repliedCount = sentLeads.filter(l => l.outreachStatus === 'replied').length;
    const convertedCount = sentLeads.filter(l => l.outreachStatus === 'converted').length;
    const bouncedCount = sentLeads.filter(l => l.outreachStatus === 'bounced').length;
    const awaitingCount = sentLeads.filter(l => l.outreachStatus === 'sent').length;
    const totalSent = sentLeads.length;

    // Calculate rates
    const replyRate = totalSent > 0 ? Math.round(((repliedCount + convertedCount) / totalSent) * 100) : 0;
    const conversionRate = (repliedCount + convertedCount) > 0 
      ? Math.round((convertedCount / (repliedCount + convertedCount)) * 100) : 0;
    const bounceRate = totalSent > 0 ? Math.round((bouncedCount / totalSent) * 100) : 0;

    // Chart data for funnel
    const funnelData = [
      { name: 'Sent', value: totalSent, fill: '#3b82f6' },
      { name: 'Replied', value: repliedCount + convertedCount, fill: '#22c55e' },
      { name: 'Converted', value: convertedCount, fill: '#10b981' },
    ];

    // Pie chart data for status breakdown
    const pieData = [
      { name: 'Awaiting', value: awaitingCount, fill: '#3b82f6' },
      { name: 'Replied', value: repliedCount, fill: '#22c55e' },
      { name: 'Converted', value: convertedCount, fill: '#10b981' },
      { name: 'Bounced', value: bouncedCount, fill: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
      <>
        {dialogs}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6 pb-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">Your Outreach Performance</h2>
              <p className="text-muted-foreground text-sm">
                Track replies, conversions, and campaign success
              </p>
            </CardContent>
          </Card>

          {/* Tabs for Stats vs Leads */}
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="leads" className="gap-2">
                <Users className="w-4 h-4" />
                All Leads ({totalSent})
              </TabsTrigger>
            </TabsList>

            {/* STATS TAB */}
            <TabsContent value="stats" className="space-y-4 mt-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="pt-4 pb-4 text-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{replyRate}%</p>
                    <p className="text-xs text-muted-foreground">Reply Rate</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="pt-4 pb-4 text-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-600">{conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </CardContent>
                </Card>
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardContent className="pt-4 pb-4 text-center">
                    <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{bounceRate}%</p>
                    <p className="text-xs text-muted-foreground">Bounce Rate</p>
                  </CardContent>
                </Card>
              </div>

              {totalSent === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center">
                    <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium">No data yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send some emails to see your performance charts!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Conversion Funnel */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Conversion Funnel
                      </CardTitle>
                      <CardDescription>How leads progress through your pipeline</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={funnelData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value: number) => [value, 'Leads']}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Breakdown Pie */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Status Breakdown
                      </CardTitle>
                      <CardDescription>Current status of all sent leads</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              labelLine={false}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* LEADS TAB */}
            <TabsContent value="leads" className="mt-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">All Sent Leads</CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadSavedLeads} disabled={isLoadingSavedLeads}>
                      <RefreshCw className={`w-4 h-4 ${isLoadingSavedLeads ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoadingSavedLeads ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : sentLeads.length === 0 ? (
                      <div className="text-center py-12">
                        <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium">No emails sent yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Start by sending some emails to your leads!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sentLeads.map((lead) => {
                          const statusInfo = getStatusBadge(lead.outreachStatus);
                          const StatusIcon = statusInfo.icon;
                          
                          return (
                            <div
                              key={lead.id}
                              className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium truncate">{lead.business_name}</span>
                                    <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {statusInfo.label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                                  {lead.sentAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Sent: {new Date(lead.sentAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Quick Status Buttons */}
                                <div className="flex gap-1 shrink-0">
                                  {lead.outreachStatus === 'sent' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-green-600 hover:bg-green-500/10"
                                        onClick={() => lead.dbId && handleUpdateSentStatus(lead.dbId, 'replied')}
                                        title="Mark as replied"
                                      >
                                        <Reply className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-red-600 hover:bg-red-500/10"
                                        onClick={() => lead.dbId && handleUpdateSentStatus(lead.dbId, 'bounced')}
                                        title="Mark as bounced"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {lead.outreachStatus === 'replied' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-emerald-600 hover:bg-emerald-500/10"
                                      onClick={() => lead.dbId && handleUpdateSentStatus(lead.dbId, 'converted')}
                                      title="Mark as converted"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setCurrentStep('start')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Email Home
          </Button>
        </div>
      </>
    );
  }

  // ============================================
  // STEP: SELECT LEADS
  // ============================================
  if (currentStep === 'select-leads') {
    return (
      <>
        {dialogs}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-primary font-medium">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
              Pick Leads
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">2</span>
              Template
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">3</span>
              Send
            </span>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Who do you want to email?</CardTitle>
              <CardDescription>Select the leads you'd like to reach out to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selection actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedSavedLeadIds.size === availableLeads.length && availableLeads.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSavedLeadIds(new Set(availableLeads.map(l => l.id)));
                      } else {
                        setSelectedSavedLeadIds(new Set());
                      }
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All ({availableLeads.length} available)
                  </label>
                </div>
                <Button variant="ghost" size="sm" onClick={loadSavedLeads} disabled={isLoadingSavedLeads}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingSavedLeads ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Selected count */}
              {selectedSavedLeadIds.size > 0 && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {selectedSavedLeadIds.size} lead{selectedSavedLeadIds.size > 1 ? 's' : ''} selected!
                  </p>
                </div>
              )}

              {/* Leads list */}
              <ScrollArea className="h-[300px] pr-4 border rounded-lg">
                {isLoadingSavedLeads ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : availableLeads.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium">No leads available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Search for leads and verify them first
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {availableLeads.map((lead, index) => (
                      <div
                        key={lead.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedSavedLeadIds.has(lead.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-border'
                        }`}
                        onClick={() => handleToggleSavedLead(lead.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedSavedLeadIds.has(lead.id)}
                            className="pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">#{index + 1}</span>
                              <span className="font-medium truncate">{lead.business_name}</span>
                              {lead.leadScore >= 80 && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Hot
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {lead.email}
                            </p>
                          </div>
                          <CheckCircle className={`w-5 h-5 transition-opacity ${
                            selectedSavedLeadIds.has(lead.id) ? 'text-primary opacity-100' : 'opacity-0'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('start')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleConfirmLeadSelection}
                  disabled={selectedSavedLeadIds.size === 0}
                >
                  Continue with {selectedSavedLeadIds.size} Lead{selectedSavedLeadIds.size !== 1 ? 's' : ''}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // ============================================
  // STEP: CHOOSE TEMPLATE
  // ============================================
  if (currentStep === 'choose-template') {
    return (
      <>
        {dialogs}
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCheck className="w-5 h-5" />
            {allSelectedLeads.length} Leads
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1 text-primary font-medium">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
            Template
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">3</span>
            Send
          </span>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Pick an email template</CardTitle>
            <CardDescription>What message would you like to send?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">No templates yet!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first email template to get started
                </p>
                <Button
                  onClick={() => {
                    setEditingTemplate({ name: '', subject: '', body_html: '', is_default: false });
                    setTemplateDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </Button>
              </div>
            ) : (
              <>
                {/* Template selection */}
                <div className="space-y-3">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplateId === template.id.toString()
                          ? 'border-primary bg-primary/5'
                          : 'border-border/50 hover:border-border'
                      }`}
                      onClick={() => setSelectedTemplateId(template.id.toString())}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            Subject: {template.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(template);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {selectedTemplateId === template.id.toString() && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create new template button */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setEditingTemplate({ name: '', subject: '', body_html: '', is_default: false });
                    setTemplateDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Create New Template
                </Button>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('select-leads')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => setCurrentStep('schedule')}
                disabled={!selectedTemplateId}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </>
    );
  }

  // ============================================
  // STEP: SCHEDULE
  // ============================================
  if (currentStep === 'schedule') {
    return (
      <>
        {dialogs}
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCheck className="w-5 h-5" />
            {allSelectedLeads.length} Leads
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1 text-green-600">
            <CheckCheck className="w-5 h-5" />
            Template
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1 text-primary font-medium">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
            Send
          </span>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>When should we send?</CardTitle>
            <CardDescription>Choose the best time to reach your leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Schedule options */}
            <div className="grid gap-3">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scheduleMode === 'now' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                }`}
                onClick={() => setScheduleMode('now')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Send Now</p>
                    <p className="text-sm text-muted-foreground">Emails go out immediately</p>
                  </div>
                  {scheduleMode === 'now' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scheduleMode === 'optimal' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                }`}
                onClick={() => setScheduleMode('optimal')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Best Time (Recommended)</p>
                    <p className="text-sm text-muted-foreground">
                      {getNextOptimalTime()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Tue-Thu at 10AM or 2PM = highest open rates!</p>
                  </div>
                  {scheduleMode === 'optimal' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scheduleMode === 'custom' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                }`}
                onClick={() => setScheduleMode('custom')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pick a Time</p>
                    <p className="text-sm text-muted-foreground">Choose your own date & time</p>
                  </div>
                  {scheduleMode === 'custom' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </div>
            </div>

            {/* Custom date/time picker */}
            {scheduleMode === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Summary</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>{leadsWithEmail.length}</strong> leads will receive emails</p>
                <p>• Using template: <strong>{selectedTemplate?.name}</strong></p>
                <p>• Sending: <strong>{
                  scheduleMode === 'now' 
                    ? 'Immediately' 
                    : scheduleMode === 'optimal'
                      ? getNextOptimalTime()
                      : scheduledDate 
                        ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()
                        : 'Select a date'
                }</strong></p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('choose-template')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSendEmails}
                disabled={isSending || (scheduleMode === 'custom' && !scheduledDate)}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {scheduleMode === 'now' ? 'Sending...' : 'Scheduling...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {scheduleMode === 'now' ? 'Send Now' : 'Schedule Emails'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </>
    );
  }

  // ============================================
  // STEP: SUCCESS
  // ============================================
  if (currentStep === 'success') {
    return (
      <>
        {dialogs}
        <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="pt-12 pb-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
              <PartyPopper className="w-10 h-10 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">
              {lastSendResult?.scheduled ? 'Emails Scheduled!' : 'Emails Sent!'}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {lastSendResult?.scheduled 
                ? `${lastSendResult.sent} emails scheduled for ${lastSendResult.scheduled}`
                : `Successfully sent ${lastSendResult?.sent || 0} emails`
              }
            </p>

            {lastSendResult?.failed && lastSendResult.failed > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6 inline-block">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {lastSendResult.failed} email{lastSendResult.failed > 1 ? 's' : ''} couldn't be sent
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleStartOver}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Send More Emails
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep('start')}
                className="gap-2"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </>
    );
  }

  // Fallback - should never reach here
  return <>{dialogs}</>;
}
