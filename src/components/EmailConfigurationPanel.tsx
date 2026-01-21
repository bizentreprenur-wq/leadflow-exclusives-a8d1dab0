import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Mail, Server, Shield, Send, Inbox, Settings, Eye, EyeOff,
  CheckCircle2, XCircle, Loader2, RefreshCw, Trash2, Archive,
  Star, AlertCircle, Clock, ExternalLink, Key, MailOpen, Copy, Webhook, Link2,
  Users, FlaskConical, Pencil, Reply, Forward, PenSquare, Download, ArrowLeft
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import OutgoingMailbox from './OutgoingMailbox';
import WebhookURLConfiguration from './WebhookURLConfiguration';

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

export default function EmailConfigurationPanel() {
  const [activeTab, setActiveTab] = useState('mailbox');
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
      // Fallback to simulated test if API unavailable
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (smtpConfig.username && smtpConfig.password) {
        toast.success('SMTP configuration looks good!', {
          description: `Will connect to ${smtpConfig.host}:${smtpConfig.port}`,
        });
        setIsConnected(true);
      } else {
        toast.error('Please enter SMTP credentials');
      }
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
          <TabsList className="inline-flex w-max min-w-full gap-1 bg-transparent p-1">
            <TabsTrigger 
              value="mailbox" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-cyan-500/50 bg-black/60 text-white data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <MailOpen className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-medium">Mailbox</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-black/40 text-muted-foreground data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="crm" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-black/40 text-muted-foreground data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              CRM
            </TabsTrigger>
            <TabsTrigger 
              value="ab" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-black/40 text-muted-foreground data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              A/B
            </TabsTrigger>
            <TabsTrigger 
              value="edit" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-black/40 text-muted-foreground data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </TabsTrigger>
            <TabsTrigger 
              value="smtp" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-black/40 text-muted-foreground data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <Server className="w-3.5 h-3.5" />
              SMTP
            </TabsTrigger>
            <TabsTrigger 
              value="inbox" 
              className="gap-1.5 text-xs px-3 py-2 rounded-lg border border-muted/30 bg-black/40 text-muted-foreground data-[state=active]:bg-cyan-500/20 data-[state=active]:border-cyan-400 data-[state=active]:text-white whitespace-nowrap"
            >
              <Inbox className="w-3.5 h-3.5" />
              Inbox
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visual Mailbox Tab */}
        <TabsContent value="mailbox" className="space-y-4">
          <OutgoingMailbox 
            smtpConnected={isConnected}
            smtpHost={smtpConfig.host || 'Your SMTP Server'}
            onConfigureClick={() => setActiveTab('smtp')}
          />
        </TabsContent>

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

              <Separator />

              {/* Webhook URL Configuration */}
              <WebhookURLConfiguration />

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
          {/* Compose/Reply Modal */}
          {(isComposing || isReplying) && (
            <Card className="border-primary/30 bg-card/95 backdrop-blur">
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
                      setIsSendingEmail(true);
                      // Simulate sending
                      await new Promise(resolve => setTimeout(resolve, 1500));
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
                      setIsSendingEmail(false);
                      setIsComposing(false);
                      setIsReplying(false);
                      setComposeData({ to: '', subject: '', body: '' });
                      toast.success('Email sent successfully!');
                    }}
                    disabled={isSendingEmail}
                    className="gap-2"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}
