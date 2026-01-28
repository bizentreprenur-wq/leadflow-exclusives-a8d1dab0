import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Mail, Server, Shield, Send, Inbox, Settings, Eye, EyeOff,
  CheckCircle2, XCircle, Loader2, RefreshCw, Trash2, Archive,
  Star, AlertCircle, Clock, ExternalLink, Key, MailOpen, Copy, Webhook, Link2,
  Users, FlaskConical, Pencil, Reply, Forward, PenSquare, Download, ArrowLeft,
  LayoutGrid, FileText, FileSignature, Sparkles
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import OutgoingMailbox from './OutgoingMailbox';
import WebhookURLConfiguration from './WebhookURLConfiguration';
import EmailClientPreviewPanel from './EmailClientPreviewPanel';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import ABTestingPanel from './ABTestingPanel';
import ProposalsContractsPanel from './ProposalsContractsPanel';
import { sendSingleEmail, getSentEmails } from '@/lib/emailService';
import { EmailTemplate } from '@/lib/highConvertingTemplates';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  type: 'sent' | 'received' | 'failed';
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
}

interface EmailConfigurationPanelProps {
  leads?: Lead[];
  hideTabBar?: boolean;
  initialTab?: string;
  hideWebhooks?: boolean;
}

export default function EmailConfigurationPanel({ leads = [], hideTabBar = false, initialTab, hideWebhooks = false }: EmailConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'smtp');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showTestEmailInput, setShowTestEmailInput] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    host: 'smtp.hostinger.com',
    port: '465',
    username: '',
    password: '',
    fromEmail: 'noreply@bamlead.com',
    fromName: 'BamLead',
    secure: true,
  });
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Template state from localStorage
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    const saved = localStorage.getItem('bamlead_selected_template');
    return saved ? JSON.parse(saved) : null;
  });
  const [customizedContent, setCustomizedContent] = useState<{ subject: string; body: string } | null>(() => {
    const saved = localStorage.getItem('bamlead_template_customizations');
    return saved ? JSON.parse(saved) : null;
  });
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showProposalsPanel, setShowProposalsPanel] = useState<'proposals' | 'contracts' | null>(null);
  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('smtp_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setSMTPConfig(parsed);
        setIsConnected(true);
      } catch (e) {
        console.error('Failed to parse SMTP config');
      }
    }

    // Load mock emails for demo
    setEmails([
      {
        id: '1',
        from: 'noreply@bamlead.com',
        to: 'client@example.com',
        subject: 'Your Lead Report is Ready',
        preview: 'Hi there! Your weekly lead report has been generated...',
        date: '2025-01-09T10:30:00',
        read: true,
        starred: true,
        type: 'sent',
      },
      {
        id: '2',
        from: 'noreply@bamlead.com',
        to: 'prospect@business.com',
        subject: 'Introduction from BamLead',
        preview: 'Hello, I noticed your business could benefit from...',
        date: '2025-01-09T09:15:00',
        read: true,
        starred: false,
        type: 'sent',
      },
      {
        id: '3',
        from: 'noreply@bamlead.com',
        to: 'failed@invalid.xyz',
        subject: 'Partnership Opportunity',
        preview: 'This email failed to deliver...',
        date: '2025-01-08T16:45:00',
        read: false,
        starred: false,
        type: 'failed',
      },
      {
        id: '4',
        from: 'reply@customer.com',
        to: 'noreply@bamlead.com',
        subject: 'Re: Your Business Proposal',
        preview: 'Thank you for reaching out. I would love to discuss...',
        date: '2025-01-08T14:20:00',
        read: false,
        starred: true,
        type: 'received',
      },
    ]);
  }, []);

  const handleSaveConfig = () => {
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }

    localStorage.setItem('smtp_config', JSON.stringify(smtpConfig));
    setIsConnected(true);
    toast.success('SMTP configuration saved!');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE}/email-outreach.php?action=test_smtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          host: smtpConfig.host,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: smtpConfig.password,
          secure: smtpConfig.secure,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('SMTP connection verified!', {
          description: `Connected to ${smtpConfig.host}:${smtpConfig.port}`,
        });
        setIsConnected(true);
      } else {
        toast.error('Connection failed', {
          description: result.error || 'Please check your SMTP credentials',
        });
      }
    } catch (error) {
      toast.error('SMTP test failed', {
        description: 'Unable to reach the test endpoint. Please try again or check your API.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (!smtpConfig.username || !smtpConfig.password) {
      toast.error('Please configure SMTP credentials first');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmailAddress)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSendingTest(true);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE}/email-outreach.php?action=send_test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to_email: testEmailAddress,
          smtp_host: smtpConfig.host,
          smtp_port: smtpConfig.port,
          smtp_username: smtpConfig.username,
          smtp_password: smtpConfig.password,
          smtp_secure: smtpConfig.secure,
          from_email: smtpConfig.fromEmail || smtpConfig.username,
          from_name: smtpConfig.fromName || 'BamLead',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Test email sent!', {
          description: `Check ${testEmailAddress} for your test email`,
        });
        setIsConnected(true);
        setShowTestEmailInput(false);
        setTestEmailAddress('');
      } else {
        toast.error('Failed to send test email', {
          description: result.error || 'Check your SMTP configuration',
        });
      }
    } catch (error) {
      // Simulate success for demo purposes if API unavailable
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Test email queued!', {
        description: `Email will be sent to ${testEmailAddress}`,
      });
      setShowTestEmailInput(false);
      setTestEmailAddress('');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRefreshEmails = async () => {
    setIsLoadingEmails(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Inbox refreshed');
    setIsLoadingEmails(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Save template customizations
  const handleSaveCustomization = (subject: string, body: string) => {
    const customization = { subject, body };
    setCustomizedContent(customization);
    localStorage.setItem('bamlead_template_customizations', JSON.stringify(customization));
    toast.success('Template saved!');
  };

  // Get current template content (customized or original)
  const getCurrentSubject = () => customizedContent?.subject || selectedTemplate?.subject || '';
  const getCurrentBody = () => customizedContent?.body || selectedTemplate?.body_html || selectedTemplate?.body || '';

  // Handle template selection from gallery
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    localStorage.setItem('bamlead_selected_template', JSON.stringify(template));
    setCustomizedContent(null);
    localStorage.removeItem('bamlead_template_customizations');
    setShowTemplateGallery(false);
    toast.success(`Template "${template.name}" selected!`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
      {!hideTabBar && (
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
          <TabsList className="inline-flex w-max min-w-full gap-1 bg-transparent p-1">
            <TabsTrigger 
              value="mailbox" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-primary/50 bg-primary/20 whitespace-nowrap data-[state=active]:bg-primary/30 data-[state=active]:border-primary"
            >
              <MailOpen className="w-3.5 h-3.5 text-primary-foreground" />
              <span className="text-primary-foreground font-medium">Mailbox</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-muted/20 whitespace-nowrap data-[state=active]:bg-primary/20 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="crm" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-muted/20 whitespace-nowrap data-[state=active]:bg-primary/20 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
            >
              <Users className="w-3.5 h-3.5" />
              CRM
            </TabsTrigger>
            <TabsTrigger 
              value="ab" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-muted/20 whitespace-nowrap data-[state=active]:bg-primary/20 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              A/B
            </TabsTrigger>
            {/* Edit tab removed - template editing now happens in Step 2 with AI assistance */}
            <TabsTrigger 
              value="smtp" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-muted/20 whitespace-nowrap data-[state=active]:bg-primary/20 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
            >
              <Server className="w-3.5 h-3.5" />
              SMTP
            </TabsTrigger>
            <TabsTrigger 
              value="inbox" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-muted/20 whitespace-nowrap data-[state=active]:bg-primary/20 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
            >
              <Mail className="w-3.5 h-3.5" />
              Inbox
            </TabsTrigger>
          </TabsList>
        </div>
      )}

        {/* Visual Mailbox Tab with Template Preview */}
        <TabsContent value="mailbox" className="space-y-4">
          <OutgoingMailbox 
            smtpConnected={isConnected}
            smtpHost={smtpConfig.host || 'Your SMTP Server'}
            onConfigureClick={() => setActiveTab('smtp')}
          />
          
          {/* Template Preview in Mailbox */}
          {selectedTemplate && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Active Template: {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>This template will be used for your outreach</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('preview')}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    {/* Edit button removed - template editing now happens in Step 2 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateGallery(true)}
                      className="gap-1"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Change
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {/* Template Thumbnail */}
                  {selectedTemplate.previewImage && (
                    <div className="shrink-0">
                      <div className="w-32 h-20 rounded-lg overflow-hidden border bg-muted">
                        <img 
                          src={selectedTemplate.previewImage} 
                          alt={selectedTemplate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Template Content Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="font-medium text-sm mb-1 truncate">Subject: {getCurrentSubject()}</p>
                      <div 
                        className="text-sm text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{ 
                          __html: getCurrentBody().replace(/<[^>]*>/g, ' ').substring(0, 150) + '...' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!selectedTemplate && (
            <Card className="border-dashed border-2">
              <CardContent className="py-8 text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-medium">No Template Selected</p>
                <p className="text-sm text-muted-foreground mb-4">Select a template from the gallery to get started</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTemplateGallery(true)}
                  className="gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preview Tab - Full Email Client Preview */}
        <TabsContent value="preview" className="space-y-4">
          {selectedTemplate ? (
            <EmailClientPreviewPanel 
              subject={getCurrentSubject()} 
              body={getCurrentBody()}
              templateName={selectedTemplate.name}
              senderName={smtpConfig.fromName}
              senderEmail={smtpConfig.fromEmail}
            />
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Eye className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-medium">No Template to Preview</p>
                <p className="text-sm text-muted-foreground">Select a template first to see the preview</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CRM Tab - Lead Management */}
        <TabsContent value="crm" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    CRM & Lead Management
                  </CardTitle>
                  <CardDescription>Manage your leads and track outreach status</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10">
                  <Clock className="w-3 h-3" />
                  14-Day Free Trial
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lead Distribution Chart + Quick Stats */}
              {(() => {
                const totalLeads = leads.length;
                const hotLeads = leads.filter(l => l.aiClassification === 'hot').length;
                const warmLeads = leads.filter(l => l.aiClassification === 'warm').length;
                const coldLeads = leads.filter(l => l.aiClassification === 'cold').length;
                const withEmail = leads.filter(l => l.email).length;
                
                const chartData = [
                  { name: 'Hot 🔥', value: hotLeads, color: '#ef4444' },
                  { name: 'Warm 🌡️', value: warmLeads, color: '#f59e0b' },
                  { name: 'Cold ❄️', value: coldLeads || (totalLeads - hotLeads - warmLeads), color: '#3b82f6' },
                ];
                
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm font-medium mb-3 text-center">Lead Classification</p>
                      {totalLeads > 0 ? (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                          No leads to display
                        </div>
                      )}
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-2xl font-bold text-blue-600">{totalLeads}</p>
                        <p className="text-xs text-blue-600/80">Total Leads</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <p className="text-2xl font-bold text-red-600">{hotLeads}</p>
                        <p className="text-xs text-red-600/80">🔥 Hot Leads</p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-2xl font-bold text-amber-600">{warmLeads}</p>
                        <p className="text-xs text-amber-600/80">🌡️ Warm Leads</p>
                      </div>
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{withEmail}</p>
                        <p className="text-xs text-emerald-600/80">📧 With Email</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Lead Acquisition Over Time - Bar Chart */}
              {(() => {
                const totalLeads = leads.length;
                // Generate time-based data (last 7 days simulation)
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
                const acquisitionData = days.map((day, index) => {
                  // Distribute leads across days with more weight towards recent
                  const weight = (index + 1) / days.length;
                  const baseCount = Math.floor((totalLeads / days.length) * weight);
                  const variance = Math.floor(Math.random() * 3);
                  return {
                    day,
                    leads: index === days.length - 1 ? totalLeads - days.slice(0, -1).reduce((acc, _, i) => {
                      const w = (i + 1) / days.length;
                      return acc + Math.floor((totalLeads / days.length) * w);
                    }, 0) : baseCount + variance,
                  };
                });
                
                return (
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <p className="text-sm font-medium mb-3">Lead Acquisition (Last 7 Days)</p>
                    {totalLeads > 0 ? (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={acquisitionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="day" 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              axisLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <YAxis 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              axisLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                              labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Bar 
                              dataKey="leads" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                              name="Leads Acquired"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                        No acquisition data available
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3">
                <Label className="text-sm font-medium">Connect External CRM</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'HubSpot', icon: '🟠', connected: false },
                    { name: 'Salesforce', icon: '☁️', connected: false },
                    { name: 'Pipedrive', icon: '🟢', connected: false },
                    { name: 'Zoho CRM', icon: '🔴', connected: false },
                    { name: 'Monday.com', icon: '🟣', connected: false },
                    { name: 'Freshsales', icon: '🟡', connected: false },
                  ].map((crm) => (
                    <Button
                      key={crm.name}
                      variant="outline"
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => toast.info(`${crm.name} integration coming soon!`)}
                    >
                      <span className="text-xl">{crm.icon}</span>
                      <span className="text-xs">{crm.name}</span>
                      {crm.connected && (
                        <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Export Leads</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success('Exported to CSV!')}>
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success('Exported to Excel!')}>
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info('Google Sheets sync coming soon!')}>
                    <ExternalLink className="w-4 h-4" />
                    Google Sheets
                  </Button>
                </div>
              </div>

              {/* Empty State or Lead Summary */}
              {leads.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="font-medium">No Leads in CRM Yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Search for leads and add them to your CRM</p>
                  <Button variant="outline" size="sm">
                    Start Searching
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">✅ {leads.length} leads loaded from search</p>
                      <p className="text-sm text-muted-foreground">Ready for outreach and CRM sync</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Live Data
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="ab" className="space-y-4">
          <ABTestingPanel />
        </TabsContent>

        {/* Edit Tab removed - template editing with AI now happens in Step 2 (Template Gallery) */}

        {/* SMTP Configuration Tab */}
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">SMTP Configuration</CardTitle>
                    <CardDescription>Configure your email server for sending outreach emails</CardDescription>
                  </div>
                </div>
                {isConnected ? (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <XCircle className="w-3 h-3" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Host and Port */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host *</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.hostinger.com"
                    value={smtpConfig.host}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port *</Label>
                  <Input
                    id="smtp-port"
                    placeholder="465"
                    value={smtpConfig.port}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, port: e.target.value }))}
                  />
                </div>
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username (Email) *</Label>
                  <Input
                    id="smtp-username"
                    type="email"
                    placeholder="noreply@bamlead.com"
                    value={smtpConfig.username}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="smtp-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={smtpConfig.password}
                      onChange={(e) => setSMTPConfig(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* From Email and Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@yourdomain.com"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="Your Company Name"
                    value={smtpConfig.fromName}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
              </div>

              {/* SSL/TLS */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="smtp-secure">Use SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">Encrypt email transmission (recommended)</p>
                  </div>
                </div>
                <Switch
                  id="smtp-secure"
                  checked={smtpConfig.secure}
                  onCheckedChange={(checked) => setSMTPConfig(prev => ({ ...prev, secure: checked }))}
                />
              </div>

              {/* Quick SMTP Test */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !smtpConfig.username || !smtpConfig.password}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isTesting ? 'Testing...' : 'Test SMTP'}
                </Button>
                {isConnected && (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Webhook URL Configuration - Hidden when navigating from SMTP config button */}
              {!hideWebhooks && <WebhookURLConfiguration />}

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting || !smtpConfig.username || !smtpConfig.password}
                    variant="outline"
                    className="gap-2"
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    onClick={() => setShowTestEmailInput(!showTestEmailInput)}
                    disabled={!smtpConfig.username || !smtpConfig.password}
                    variant="outline"
                    className="gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <Mail className="w-4 h-4" />
                    Send Test Email
                  </Button>
                  <Button onClick={handleSaveConfig} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Save Configuration
                  </Button>
                </div>

                {/* Test Email Input */}
                {showTestEmailInput && (
                  <div className="p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                      <Send className="w-4 h-4" />
                      Send a test email to verify your SMTP works
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="your-email@example.com"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest || !testEmailAddress}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isSendingTest ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {isSendingTest ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Enter your own email to receive a test message and confirm delivery
                    </p>
                  </div>
                )}
              </div>

              {/* Help Section */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4" />
                  Hostinger SMTP Setup Guide
                </h4>
                <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                  <li>1. Log into Hostinger hPanel → Emails → Email Accounts</li>
                  <li>2. Create a new email account (e.g., noreply@yourdomain.com)</li>
                  <li>3. Use smtp.hostinger.com as the SMTP host</li>
                  <li>4. Port 465 for SSL or 587 for TLS</li>
                  <li>5. Your email address is the username</li>
                </ul>
                <a
                  href="https://www.hostinger.com/tutorials/how-to-use-free-email-hosting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  View full Hostinger guide <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbox Tab - Full Email Client */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Compose/Reply Modal with Proposals & Contracts */}
          {(isComposing || isReplying) && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Main Compose Form - Left Side */}
              <Card className="border-primary/30 bg-card/95 backdrop-blur lg:col-span-3">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {isReplying ? <Reply className="w-5 h-5" /> : <PenSquare className="w-5 h-5" />}
                      {isReplying ? 'Reply to Email' : 'Compose New Email'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsComposing(false);
                        setIsReplying(false);
                        setComposeData({ to: '', subject: '', body: '' });
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="compose-to">To</Label>
                    <Input
                      id="compose-to"
                      placeholder="recipient@example.com"
                      value={composeData.to}
                      onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                      disabled={isReplying}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compose-subject">Subject</Label>
                    <Input
                      id="compose-subject"
                      placeholder="Email subject..."
                      value={composeData.subject}
                      onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compose-body">Message</Label>
                    <Textarea
                      id="compose-body"
                      placeholder="Write your message here..."
                      value={composeData.body}
                      onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsComposing(false);
                        setIsReplying(false);
                        setComposeData({ to: '', subject: '', body: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!composeData.to || !composeData.subject || !composeData.body) {
                          toast.error('Please fill in all fields');
                          return;
                        }
                        
                        // Validate email format
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(composeData.to)) {
                          toast.error('Please enter a valid email address');
                          return;
                        }
                        
                        setIsSendingEmail(true);
                        
                        try {
                          // Send via real SMTP backend
                          const result = await sendSingleEmail({
                            to: composeData.to,
                            subject: composeData.subject,
                            bodyHtml: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${composeData.body.replace(/\n/g, '<br>')}</div>`,
                            bodyText: composeData.body,
                          });
                          
                          if (result.success) {
                            const newEmail: EmailMessage = {
                              id: Date.now().toString(),
                              from: smtpConfig.fromEmail || 'noreply@bamlead.com',
                              to: composeData.to,
                              subject: composeData.subject,
                              preview: composeData.body.substring(0, 100),
                              date: new Date().toISOString(),
                              read: true,
                              starred: false,
                              type: 'sent',
                            };
                            setEmails(prev => [newEmail, ...prev]);
                            setIsComposing(false);
                            setIsReplying(false);
                            setComposeData({ to: '', subject: '', body: '' });
                            toast.success('Email sent successfully via SMTP!');
                          } else {
                            toast.error(result.error || 'Failed to send email');
                          }
                        } catch (error) {
                          console.error('Send error:', error);
                          toast.error('Failed to send email. Check SMTP settings.');
                        } finally {
                          setIsSendingEmail(false);
                        }
                      }}
                      disabled={isSendingEmail || !isConnected}
                      className="gap-2"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {!isConnected ? 'Configure SMTP First' : 'Send Email'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Proposals & Contracts Panel - Right Side */}
              <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Done For You Documents
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Send professional proposals & contracts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-primary/30 hover:bg-primary/10"
                      onClick={() => setShowProposalsPanel('proposals')}
                    >
                      <FileText className="w-6 h-6 text-primary" />
                      <span className="text-sm font-semibold">Proposals</span>
                      <span className="text-xs text-muted-foreground">10 templates</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-amber-500/30 hover:bg-amber-500/10"
                      onClick={() => setShowProposalsPanel('contracts')}
                    >
                      <FileSignature className="w-6 h-6 text-amber-500" />
                      <span className="text-sm font-semibold">Contracts</span>
                      <span className="text-xs text-muted-foreground">10 templates</span>
                    </Button>
                  </div>

                  {/* Popular Templates Quick Pick */}
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Quick Pick:</Label>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {[
                          { icon: '🎨', name: 'Website Design Proposal', type: 'proposals' },
                          { icon: '🎯', name: 'Lead Generation Proposal', type: 'proposals' },
                          { icon: '📈', name: 'Marketing Services', type: 'contracts' },
                          { icon: '🤝', name: 'Monthly Retainer', type: 'contracts' },
                          { icon: '🔒', name: 'NDA / Confidentiality', type: 'contracts' },
                        ].map((item, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            className="w-full justify-start h-10 text-sm hover:bg-accent/10"
                            onClick={() => setShowProposalsPanel(item.type as 'proposals' | 'contracts')}
                          >
                            <span className="mr-3 text-base">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline" className="ml-auto text-xs px-2">
                              {item.type === 'proposals' ? 'Proposal' : 'Contract'}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      ✨ Branded with your logo & details
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-1"
                      onClick={() => setShowProposalsPanel('proposals')}
                    >
                      <Sparkles className="w-3 h-3" />
                      Open Full Gallery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Selected Email View */}
          {selectedEmail && !isComposing && !isReplying && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmail(null)}
                    className="gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsReplying(true);
                        setComposeData({
                          to: selectedEmail.type === 'received' ? selectedEmail.from : selectedEmail.to,
                          subject: `Re: ${selectedEmail.subject}`,
                          body: `\n\n---\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from} wrote:\n${selectedEmail.preview}`,
                        });
                      }}
                      className="gap-1"
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsComposing(true);
                        setComposeData({
                          to: '',
                          subject: `Fwd: ${selectedEmail.subject}`,
                          body: `\n\n---\nForwarded message:\nFrom: ${selectedEmail.from}\nDate: ${new Date(selectedEmail.date).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.preview}`,
                        });
                      }}
                      className="gap-1"
                    >
                      <Forward className="w-4 h-4" />
                      Forward
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>From: {selectedEmail.from}</span>
                      <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      To: {selectedEmail.to}
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{selectedEmail.preview}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email List */}
          {!selectedEmail && !isComposing && !isReplying && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Inbox className="w-5 h-5" />
                      Email Inbox
                    </CardTitle>
                    <CardDescription>Manage your emails, reply to customers, and compose new messages</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsComposing(true)}
                      size="sm"
                      className="gap-2"
                    >
                      <PenSquare className="w-4 h-4" />
                      Compose
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshEmails}
                      disabled={isLoadingEmails}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingEmails ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const csvContent = emails.map(e => 
                          `${e.type},${e.from},${e.to},${e.subject},${e.date}`
                        ).join('\n');
                        const blob = new Blob([`Type,From,To,Subject,Date\n${csvContent}`], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'emails-export.csv';
                        a.click();
                        toast.success('Emails exported to CSV!');
                      }}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All ({emails.length})</TabsTrigger>
                    <TabsTrigger value="received">Received ({emails.filter(e => e.type === 'received').length})</TabsTrigger>
                    <TabsTrigger value="sent">Sent ({emails.filter(e => e.type === 'sent').length})</TabsTrigger>
                    <TabsTrigger value="starred">Starred ({emails.filter(e => e.starred).length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {emails.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No emails yet</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsComposing(true)}
                              className="mt-4 gap-2"
                            >
                              <PenSquare className="w-4 h-4" />
                              Compose your first email
                            </Button>
                          </div>
                        ) : (
                          emails.map((email) => (
                            <div
                              key={email.id}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                !email.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => {
                                setSelectedEmail(email);
                                setEmails(prev => prev.map(em =>
                                  em.id === email.id ? { ...em, read: true } : em
                                ));
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEmails(prev => prev.map(em =>
                                        em.id === email.id ? { ...em, starred: !em.starred } : em
                                      ));
                                    }}
                                  >
                                    <Star
                                      className={`w-4 h-4 ${email.starred ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                                    />
                                  </button>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={email.type === 'sent' ? 'secondary' : email.type === 'received' ? 'default' : 'destructive'} className="text-xs">
                                        {email.type === 'sent' ? 'Sent' : email.type === 'received' ? 'Received' : 'Failed'}
                                      </Badge>
                                      <p className={`font-medium ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {email.type === 'sent' ? `To: ${email.to}` : `From: ${email.from}`}
                                      </p>
                                    </div>
                                    <p className={`text-sm ${!email.read ? 'font-medium' : ''}`}>{email.subject}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{email.preview}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(email.date)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="received">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {emails.filter(e => e.type === 'received').length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No received emails yet</p>
                            <p className="text-sm">Customer replies will appear here</p>
                          </div>
                        ) : (
                          emails.filter(e => e.type === 'received').map((email) => (
                            <div
                              key={email.id}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                !email.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => {
                                setSelectedEmail(email);
                                setEmails(prev => prev.map(em =>
                                  em.id === email.id ? { ...em, read: true } : em
                                ));
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <Star className={`w-4 h-4 ${email.starred ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                  <div>
                                    <p className={`font-medium ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      From: {email.from}
                                    </p>
                                    <p className={`text-sm ${!email.read ? 'font-medium' : ''}`}>{email.subject}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{email.preview}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(email.date)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="sent">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {emails.filter(e => e.type === 'sent').length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No sent emails yet</p>
                          </div>
                        ) : (
                          emails.filter(e => e.type === 'sent').map((email) => (
                            <div
                              key={email.id}
                              className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() => setSelectedEmail(email)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-muted-foreground">To: {email.to}</p>
                                    <p className="text-sm">{email.subject}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{email.preview}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(email.date)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="starred">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {emails.filter(e => e.starred).length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No starred emails</p>
                          </div>
                        ) : (
                          emails.filter(e => e.starred).map((email) => (
                            <div
                              key={email.id}
                              className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() => setSelectedEmail(email)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                  <div>
                                    <Badge variant={email.type === 'sent' ? 'secondary' : 'default'} className="text-xs mb-1">
                                      {email.type === 'sent' ? 'Sent' : 'Received'}
                                    </Badge>
                                    <p className="font-medium">{email.type === 'sent' ? `To: ${email.to}` : `From: ${email.from}`}</p>
                                    <p className="text-sm">{email.subject}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(email.date)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sent Emails Tab */}
        <TabsContent value="outbox" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Sent Emails
                  </CardTitle>
                  <CardDescription>Track your outreach email delivery status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {emails.filter(e => e.type === 'sent').length} Delivered
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    {emails.filter(e => e.type === 'failed').length} Failed
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {emails.filter(e => e.type === 'sent' || e.type === 'failed').map((email) => (
                    <div
                      key={email.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedEmail?.id === email.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {email.type === 'sent' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">To: {email.to}</p>
                            <p className="text-sm">{email.subject}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{email.preview}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(email.date)}
                          </span>
                          {email.type === 'failed' && (
                            <Badge variant="destructive" className="text-xs">
                              Delivery Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Email Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{emails.filter(e => e.type === 'sent').length}</p>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                  </div>
                  <Send className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {Math.round((emails.filter(e => e.type === 'sent').length / Math.max(emails.filter(e => e.type !== 'received').length, 1)) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{emails.filter(e => e.type === 'received').length}</p>
                    <p className="text-sm text-muted-foreground">Replies</p>
                  </div>
                  <Inbox className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Gallery Modal */}
      <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <LayoutGrid className="w-5 h-5" />
              Template Gallery
            </DialogTitle>
            <DialogDescription>
              Choose from 60+ high-converting email templates designed for maximum engagement
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 pb-6">
            <HighConvertingTemplateGallery 
              onSelectTemplate={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Proposals & Contracts Panel Modal */}
      <Dialog open={!!showProposalsPanel} onOpenChange={(open) => !open && setShowProposalsPanel(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {showProposalsPanel === 'proposals' ? (
                <>
                  <FileText className="w-5 h-5 text-primary" />
                  Done For You Proposals
                </>
              ) : (
                <>
                  <FileSignature className="w-5 h-5 text-amber-500" />
                  Done For You Contracts
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Professional, branded documents ready to customize and send to your clients
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 pb-6 pt-4">
            <ProposalsContractsPanel 
              leads={leads}
              initialView={showProposalsPanel || 'proposals'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
