import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Mail, Send, FileText, BarChart3, Loader2, Plus, Trash2,
  Edit, Eye, Users, CheckCircle, AlertCircle, Clock, MousePointer,
  Reply, XCircle, Sparkles, Database, RefreshCw, Star, Building2
} from 'lucide-react';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendBulkEmails,
  getSends,
  getEmailStats,
  personalizeTemplate,
  EmailTemplate,
  EmailSend,
  EmailStats,
  LeadForEmail,
} from '@/lib/api/email';
import { fetchVerifiedLeads, updateLeadStatus, type SavedLead } from '@/lib/api/verifiedLeads';

interface EmailOutreachModuleProps {
  selectedLeads?: LeadForEmail[];
  onClearSelection?: () => void;
}

export default function EmailOutreachModule({ selectedLeads = [], onClearSelection }: EmailOutreachModuleProps) {
  const [activeTab, setActiveTab] = useState('send');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', body: '' });
  
  // Send state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Saved leads picker state
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [isLoadingSavedLeads, setIsLoadingSavedLeads] = useState(false);
  const [savedLeadPickerOpen, setSavedLeadPickerOpen] = useState(false);
  const [selectedSavedLeadIds, setSelectedSavedLeadIds] = useState<Set<string>>(new Set());
  const [leadsFromPicker, setLeadsFromPicker] = useState<LeadForEmail[]>([]);
  const [showSentLeads, setShowSentLeads] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);

  // Merge selected leads from props and picker
  const allSelectedLeads = [...selectedLeads, ...leadsFromPicker];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [templatesRes, sendsRes, statsRes] = await Promise.all([
        getTemplates(),
        getSends({ limit: 20 }),
        getEmailStats(30),
      ]);
      
      if (templatesRes.success) setTemplates(templatesRes.templates);
      if (sendsRes.success) setSends(sendsRes.sends);
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
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

  // Filter out already-emailed leads
  const availableLeads = savedLeads.filter(l => l.outreachStatus !== 'sent' && l.outreachStatus !== 'replied' && l.outreachStatus !== 'converted');
  const emailedLeads = savedLeads.filter(l => l.outreachStatus === 'sent' || l.outreachStatus === 'replied' || l.outreachStatus === 'converted');

  const handleOpenLeadPicker = () => {
    loadSavedLeads();
    setSavedLeadPickerOpen(true);
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

  const handleSelectAllSavedLeads = (checked: boolean) => {
    if (checked) {
      setSelectedSavedLeadIds(new Set(savedLeads.map(l => l.id)));
    } else {
      setSelectedSavedLeadIds(new Set());
    }
  };

  const handleConfirmLeadSelection = () => {
    // Only select from available (not already emailed) leads
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
    setSavedLeadPickerOpen(false);
    toast.success(`Added ${converted.length} leads from database`);
  };

  const handleClearAllLeads = () => {
    onClearSelection?.();
    setLeadsFromPicker([]);
    setSelectedSavedLeadIds(new Set());
  };

  const handleUpdateLeadOutreachStatus = async (leadDbId: number, newStatus: 'sent' | 'replied' | 'converted' | 'bounced') => {
    setUpdatingLeadId(leadDbId);
    try {
      const result = await updateLeadStatus(leadDbId, { outreachStatus: newStatus });
      if (result.success) {
        toast.success(`Lead marked as ${newStatus}`);
        // Update local state
        setSavedLeads(prev => prev.map(lead => 
          lead.dbId === leadDbId ? { ...lead, outreachStatus: newStatus } : lead
        ));
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update lead status');
    }
    setUpdatingLeadId(null);
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
          toast.success('Template updated');
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
          toast.success('Template created');
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
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    const result = await deleteTemplate(id);
    if (result.success) {
      toast.success('Template deleted');
      loadData();
    } else {
      toast.error(result.error || 'Failed to delete template');
    }
  };

  const handleSendEmails = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }
    
    if (allSelectedLeads.length === 0) {
      toast.error('No leads selected');
      return;
    }

    const leadsWithEmail = allSelectedLeads.filter(l => l.email);
    if (leadsWithEmail.length === 0) {
      toast.error('None of the selected leads have email addresses');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendBulkEmails({
        leads: leadsWithEmail,
        template_id: parseInt(selectedTemplateId),
      });
      
      if (result.success && result.results) {
        const { sent, failed, skipped } = result.results;
        toast.success(`Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`);
        
        // Update outreach status for successfully sent leads from picker
        const leadsFromPickerWithEmail = leadsFromPicker.filter(l => l.email);
        for (const lead of leadsFromPickerWithEmail) {
          if (lead.id) {
            await updateLeadStatus(Number(lead.id), {
              outreachStatus: 'sent',
              sentAt: 'now'
            });
          }
        }
        
        handleClearAllLeads();
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
      issues: 'Slow loading, Not mobile-friendly, Missing SSL',
      phone: '(555) 123-4567',
      email: 'contact@acmeplumbing.com',
    };
    
    setPreviewContent({
      subject: personalizeTemplate(template.subject, sampleData),
      body: personalizeTemplate(template.body_html, sampleData),
    });
    setPreviewDialogOpen(true);
  };

  const getStatusIcon = (status: EmailSend['status']) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'opened':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'clicked':
        return <MousePointer className="w-4 h-4 text-purple-500" />;
      case 'replied':
        return <Reply className="w-4 h-4 text-green-500" />;
      case 'bounced':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: EmailSend['status']) => {
    const variants: Record<string, string> = {
      sent: 'bg-emerald-500/10 text-emerald-500',
      delivered: 'bg-emerald-500/10 text-emerald-500',
      opened: 'bg-blue-500/10 text-blue-500',
      clicked: 'bg-purple-500/10 text-purple-500',
      replied: 'bg-green-500/10 text-green-500',
      bounced: 'bg-red-500/10 text-red-500',
      failed: 'bg-red-500/10 text-red-500',
      pending: 'bg-muted text-muted-foreground',
    };
    return variants[status] || variants.pending;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Send className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_sent}</p>
                  <p className="text-xs text-muted-foreground">Emails Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open_rate}%</p>
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MousePointer className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.click_rate}%</p>
                  <p className="text-xs text-muted-foreground">Click Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Reply className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.reply_rate}%</p>
                  <p className="text-xs text-muted-foreground">Reply Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="send" className="gap-2">
            <Send className="w-4 h-4" />
            Send
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4 mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Send Emails to Leads
              </CardTitle>
              <CardDescription>
                Select a template and send personalized emails to your selected leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected leads indicator */}
              <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{allSelectedLeads.length} leads selected</p>
                      <p className="text-sm text-muted-foreground">
                        {allSelectedLeads.filter(l => l.email).length} with email addresses
                        {selectedLeads.length > 0 && leadsFromPicker.length > 0 && (
                          <span className="ml-1">
                            ({selectedLeads.length} from verification, {leadsFromPicker.length} from database)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {allSelectedLeads.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearAllLeads}>
                      Clear All
                    </Button>
                  )}
                </div>
                
                {/* Add from saved leads button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenLeadPicker}
                  className="w-full gap-2"
                >
                  <Database className="w-4 h-4" />
                  Select from Saved Leads
                </Button>
              </div>

              {/* Template selector */}
              <div className="space-y-2">
                <Label>Email Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                        {template.is_default && (
                          <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview selected template */}
              {selectedTemplateId && (
                <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Template Preview</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const template = templates.find(t => t.id.toString() === selectedTemplateId);
                        if (template) handlePreview(template);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Full Preview
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Subject: {templates.find(t => t.id.toString() === selectedTemplateId)?.subject}
                  </p>
                </div>
              )}

              {/* Personalization tokens info */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Personalization Tokens</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {'{{business_name}}'}, {'{{first_name}}'}, {'{{website}}'}, {'{{platform}}'}, {'{{issues}}'}, {'{{phone}}'}, {'{{email}}'}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSendEmails}
                disabled={isSending || !selectedTemplateId || allSelectedLeads.length === 0}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {allSelectedLeads.filter(l => l.email).length} Leads
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Templates</h3>
            <Button
              onClick={() => {
                setEditingTemplate({
                  name: '',
                  subject: '',
                  body_html: '',
                  is_default: false,
                });
                setTemplateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map(template => (
              <Card key={template.id} className="border-border/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Subject: {template.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTemplate(template);
                          setTemplateDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No templates yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingTemplate({
                        name: '',
                        subject: '',
                        body_html: '',
                        is_default: false,
                      });
                      setTemplateDialogOpen(true);
                    }}
                  >
                    Create your first template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Email History</h3>
          
          <div className="space-y-2">
            {sends.map(send => (
              <Card key={send.id} className="border-border/50">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(send.status)}
                      <div>
                        <p className="font-medium text-sm">{send.business_name || send.recipient_email}</p>
                        <p className="text-xs text-muted-foreground">{send.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusBadge(send.status)}>
                        {send.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {send.sent_at ? new Date(send.sent_at).toLocaleDateString() : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sends.length === 0 && (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-8 text-center">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No emails sent yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable email template with personalization tokens
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
                placeholder="e.g., I noticed your website could use some improvements"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body">Email Body (HTML)</Label>
              <Textarea
                id="template-body"
                value={editingTemplate?.body_html || ''}
                onChange={e => setEditingTemplate(prev => ({ ...prev, body_html: e.target.value }))}
                placeholder="Write your email content here. Use tokens like {{business_name}} for personalization."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Available Personalization Tokens:</p>
              <div className="flex flex-wrap gap-2">
                {['{{business_name}}', '{{first_name}}', '{{website}}', '{{platform}}', '{{issues}}', '{{phone}}', '{{email}}'].map(token => (
                  <Badge
                    key={token}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const currentValue = editingTemplate?.body_html || '';
                        const newValue = currentValue.substring(0, start) + token + currentValue.substring(end);
                        setEditingTemplate(prev => ({ ...prev, body_html: newValue }));
                      }
                    }}
                  >
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
              {editingTemplate?.id ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
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

      {/* Saved Leads Picker Dialog */}
      <Dialog open={savedLeadPickerOpen} onOpenChange={setSavedLeadPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Select Leads from Database
            </DialogTitle>
            <DialogDescription>
              Choose verified leads to add to your email campaign
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle between available and sent leads */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={!showSentLeads ? "secondary" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setShowSentLeads(false)}
              >
                <Users className="w-4 h-4 mr-2" />
                Available ({availableLeads.length})
              </Button>
              <Button
                variant={showSentLeads ? "secondary" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setShowSentLeads(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Already Sent ({emailedLeads.length})
              </Button>
            </div>

            {!showSentLeads ? (
              <>
                {/* Actions bar for available leads */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-saved"
                      checked={selectedSavedLeadIds.size === availableLeads.length && availableLeads.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSavedLeadIds(new Set(availableLeads.map(l => l.id)));
                        } else {
                          setSelectedSavedLeadIds(new Set());
                        }
                      }}
                    />
                    <label htmlFor="select-all-saved" className="text-sm font-medium cursor-pointer">
                      Select All
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadSavedLeads}
                    disabled={isLoadingSavedLeads}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingSavedLeads ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {/* Selected count */}
                {selectedSavedLeadIds.size > 0 && (
                  <div className="p-2 bg-primary/10 rounded-lg text-sm text-center">
                    <span className="font-medium">{selectedSavedLeadIds.size}</span> leads selected
                  </div>
                )}

                {/* Available leads list */}
                <ScrollArea className="h-[350px] pr-4">
                  {isLoadingSavedLeads ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : availableLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {savedLeads.length === 0 ? 'No verified leads saved yet' : 'All leads have been emailed'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {savedLeads.length === 0 ? 'Verify leads and save them to see them here' : 'Add new leads to continue outreach'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedSavedLeadIds.has(lead.id)
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border/50 hover:border-border'
                          }`}
                          onClick={() => handleToggleSavedLead(lead.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedSavedLeadIds.has(lead.id)}
                              onCheckedChange={() => handleToggleSavedLead(lead.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="font-medium truncate">{lead.business_name}</span>
                                {lead.leadScore >= 80 && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
                                    <Star className="w-3 h-3 mr-1" />
                                    {lead.leadScore}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                <Mail className="w-3 h-3 inline mr-1" />
                                {lead.email}
                              </p>
                              {lead.platform && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Platform: {lead.platform}
                                </p>
                              )}
                            </div>
                            {lead.emailValid && (
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <>
                {/* Sent leads header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    View leads that have already been emailed
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadSavedLeads}
                    disabled={isLoadingSavedLeads}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingSavedLeads ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {/* Sent leads list */}
                <ScrollArea className="h-[400px] pr-4">
                  {isLoadingSavedLeads ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : emailedLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No emails sent yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sent leads will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emailedLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-3 rounded-lg border border-border/50 bg-muted/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-emerald-500/10 rounded-full mt-0.5">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="font-medium truncate">{lead.business_name}</span>
                                <Badge 
                                  className={`shrink-0 ${
                                    lead.outreachStatus === 'replied' 
                                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                      : lead.outreachStatus === 'converted'
                                      ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                      : lead.outreachStatus === 'bounced'
                                      ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                      : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                  }`}
                                >
                                  {lead.outreachStatus === 'replied' && <Reply className="w-3 h-3 mr-1" />}
                                  {lead.outreachStatus === 'converted' && <Star className="w-3 h-3 mr-1" />}
                                  {lead.outreachStatus === 'bounced' && <XCircle className="w-3 h-3 mr-1" />}
                                  {lead.outreachStatus === 'sent' && <Send className="w-3 h-3 mr-1" />}
                                  {lead.outreachStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                <Mail className="w-3 h-3 inline mr-1" />
                                {lead.email}
                              </p>
                              {lead.sentAt && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Sent: {new Date(lead.sentAt).toLocaleDateString()} at {new Date(lead.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                              
                              {/* Status update buttons */}
                              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
                                <span className="text-xs text-muted-foreground mr-1">Update:</span>
                                {lead.outreachStatus !== 'replied' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-600"
                                    onClick={() => lead.dbId && handleUpdateLeadOutreachStatus(lead.dbId, 'replied')}
                                    disabled={updatingLeadId === lead.dbId}
                                  >
                                    {updatingLeadId === lead.dbId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Reply className="w-3 h-3 mr-1" />}
                                    Replied
                                  </Button>
                                )}
                                {lead.outreachStatus !== 'converted' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-600"
                                    onClick={() => lead.dbId && handleUpdateLeadOutreachStatus(lead.dbId, 'converted')}
                                    disabled={updatingLeadId === lead.dbId}
                                  >
                                    {updatingLeadId === lead.dbId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 mr-1" />}
                                    Converted
                                  </Button>
                                )}
                                {lead.outreachStatus !== 'bounced' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600"
                                    onClick={() => lead.dbId && handleUpdateLeadOutreachStatus(lead.dbId, 'bounced')}
                                    disabled={updatingLeadId === lead.dbId}
                                  >
                                    {updatingLeadId === lead.dbId ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                                    Bounced
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSavedLeadPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLeadSelection}
              disabled={selectedSavedLeadIds.size === 0}
            >
              <Users className="w-4 h-4 mr-2" />
              Add {selectedSavedLeadIds.size} Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
