import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import CRMSelectionPanel from './CRMSelectionPanel';
import ProposalsContractsPanel from './ProposalsContractsPanel';
import { sendSingleEmail, getSentEmails } from '@/lib/emailService';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api/config';
import { EmailTemplate } from '@/lib/highConvertingTemplates';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

const SMTP_CONFIG_KEY = 'bamlead_smtp_config';
const SMTP_STATUS_KEY = 'bamlead_smtp_status';
const SMTP_CHANGE_EVENT = 'bamlead_smtp_changed';
const SMTP_LEGACY_EVENT = 'bamlead-smtp-config-updated';

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

interface EmailSendRecord {
  id?: number | string;
  recipient_email?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  status?: string;
  sent_at?: string;
  created_at?: string;
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
  const safeParse = <T,>(value: string | null, fallback: T): T => {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  const [activeTab, setActiveTab] = useState(initialTab || 'smtp');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showTestEmailInput, setShowTestEmailInput] = useState(false);
  const [isConnected, setIsConnected] = useState(() => {
    const savedStatus = safeParse(localStorage.getItem(SMTP_STATUS_KEY), null as any);
    if (savedStatus) return Boolean(savedStatus.isConnected);
    return false;
  });
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>(() => {
    const saved = safeParse(localStorage.getItem(SMTP_CONFIG_KEY), null as SMTPConfig | null)
      || safeParse(localStorage.getItem('smtp_config'), null as SMTPConfig | null);
    return saved || {
      host: 'smtp.hostinger.com',
      port: '465',
      username: '',
      password: '',
      fromEmail: 'noreply@bamlead.com',
      fromName: 'BamLead',
      secure: true,
    };
  });
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const savedConfig = safeParse(localStorage.getItem('smtp_config'), null as SMTPConfig | null);
    const passwordMatchesSaved = savedConfig ? savedConfig.password === smtpConfig.password : false;
    if (!isVerificationMatch(smtpConfig) || !passwordMatchesSaved) {
      setIsConnected(false);
    }
  }, [smtpConfig.host, smtpConfig.port, smtpConfig.username, smtpConfig.password]);
  
  // Template state from localStorage
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    return safeParse(localStorage.getItem('bamlead_selected_template'), null);
  });
  const [customizedContent, setCustomizedContent] = useState<{ subject: string; body: string } | null>(() => {
    return safeParse(localStorage.getItem('bamlead_template_customizations'), null);
  });
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showProposalsPanel, setShowProposalsPanel] = useState<'proposals' | 'contracts' | null>(null);
  const [showGoogleSheetsDialog, setShowGoogleSheetsDialog] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => localStorage.getItem('bamlead_google_sheet_url') || '');
  const [isSyncingGoogleSheets, setIsSyncingGoogleSheets] = useState(false);
  const broadcastSMTPChange = () => {
    window.dispatchEvent(new Event(SMTP_LEGACY_EVENT));
    window.dispatchEvent(new CustomEvent(SMTP_CHANGE_EVENT));
  };

  const persistSMTPConfig = (config: SMTPConfig) => {
    const serialized = JSON.stringify(config);
    localStorage.setItem('smtp_config', serialized);
    localStorage.setItem(SMTP_CONFIG_KEY, serialized);
  };

  const persistSMTPStatus = (isConnected: boolean, isVerified: boolean) => {
    localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify({
      isConnected,
      isVerified,
      lastTestDate: new Date().toISOString(),
    }));
  };

  const getStoredVerification = () => {
    return safeParse(localStorage.getItem('smtp_verified'), null as null | {
      host?: string;
      port?: string | number;
      username?: string;
      verifiedAt?: string;
    });
  };

  const isVerificationMatch = (config: SMTPConfig) => {
    const verification = getStoredVerification();
    if (!verification) return false;
    return (
      (verification.host || '').toLowerCase() === (config.host || '').toLowerCase() &&
      String(verification.port || '') === String(config.port || '') &&
      (verification.username || '').toLowerCase() === (config.username || '').toLowerCase()
    );
  };

  const toPreviewText = (htmlOrText: string) => {
    return htmlOrText
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const loadEmailHistory = useCallback(async (showToast = false) => {
    setIsLoadingEmails(true);
    try {
      const fromConfig = safeParse(localStorage.getItem('smtp_config'), {} as Partial<SMTPConfig>);
      const fromAddress = fromConfig.fromEmail || fromConfig.username || 'noreply@bamlead.com';
      const rows = (await getSentEmails(200, 0)) as EmailSendRecord[];
      const mapped = (Array.isArray(rows) ? rows : []).map((row) => {
        const status = String(row.status || '').toLowerCase();
        const preview = toPreviewText(row.body_text || row.body_html || '');
        const type: EmailMessage['type'] = (
          status === 'failed' || status === 'bounced' || status === 'cancelled'
            ? 'failed'
            : status === 'replied'
              ? 'received'
              : 'sent'
        );

        return {
          id: String(
            row.id ??
            `${row.recipient_email || 'unknown'}-${row.sent_at || row.created_at || 'na'}-${row.subject || 'no-subject'}`
          ),
          from: fromAddress,
          to: row.recipient_email || '',
          subject: row.subject || '(No subject)',
          preview: preview || '(No content)',
          date: row.sent_at || row.created_at || new Date().toISOString(),
          read: type !== 'received',
          starred: false,
          type,
        } as EmailMessage;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEmails(mapped);
      if (showToast) {
        toast.success('Email history refreshed');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Failed to load email history');
      }
    } finally {
      setIsLoadingEmails(false);
    }
  }, []);

  // Load saved config — prefer server-side, fall back to localStorage
  useEffect(() => {
    const loadFromServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/email-outreach.php?action=load_smtp_config`, {
          method: 'GET',
          headers: { ...getAuthHeaders() },
        });
        const result = await response.json();
        if (result.success && result.config) {
          const serverConfig: SMTPConfig = {
            host: result.config.host || 'smtp.hostinger.com',
            port: result.config.port || '465',
            username: result.config.username || '',
            password: result.config.password || '',
            fromEmail: result.config.fromEmail || 'noreply@bamlead.com',
            fromName: result.config.fromName || 'BamLead',
            secure: result.config.secure !== undefined ? result.config.secure : true,
          };
          setSMTPConfig(serverConfig);
          persistSMTPConfig(serverConfig);
          const hasCredentials = Boolean(serverConfig.host && serverConfig.username && serverConfig.password);
          if (hasCredentials) {
            setIsConnected(true);
            persistSMTPStatus(true, true);
          }
          broadcastSMTPChange();
          return; // Server config loaded successfully
        }

        if (result.success && !result.config) {
          localStorage.removeItem(SMTP_CONFIG_KEY);
          localStorage.removeItem('smtp_config');
          localStorage.removeItem('smtp_verified');
          localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify({
            isConnected: false,
            isVerified: false,
          }));
          setSMTPConfig({
            host: 'smtp.hostinger.com',
            port: '465',
            username: '',
            password: '',
            fromEmail: 'noreply@bamlead.com',
            fromName: 'BamLead',
            secure: true,
          });
          setIsConnected(false);
          broadcastSMTPChange();
          return;
        }
      } catch (e) {
        // Server unavailable, fall back to localStorage
      }

      // Fallback: localStorage
      const savedConfig = localStorage.getItem(SMTP_CONFIG_KEY) || localStorage.getItem('smtp_config');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          setSMTPConfig(parsed);
          setIsConnected(isVerificationMatch(parsed));
        } catch (e) {
          console.error('Failed to parse SMTP config');
        }
      }
    };
    loadFromServer();
  }, []);

  useEffect(() => {
    void loadEmailHistory(false);
  }, [loadEmailHistory]);

  const saveToServer = async (config: SMTPConfig): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/email-outreach.php?action=save_smtp_config`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify(config),
      });
      const text = await response.text();
      let payload: any = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          error: payload?.error || `Server returned ${response.status}`,
        };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach server' };
    }
  };

  const handleSaveConfig = async () => {
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }

    persistSMTPConfig(smtpConfig);
    localStorage.removeItem('smtp_verified');
    setIsConnected(false);
    persistSMTPStatus(false, false);
    broadcastSMTPChange();

    // Persist to server so it survives browser clears
    const saved = await saveToServer(smtpConfig);
    if (!saved.success) {
      toast.warning('Saved locally only', {
        description: saved.error || 'Server save failed. It may not persist across devices.',
      });
      return;
    }
    toast.success('SMTP configuration saved to your account!');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/email-outreach.php?action=test_smtp`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
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
        persistSMTPConfig(smtpConfig);
        localStorage.setItem('smtp_verified', JSON.stringify({
          host: smtpConfig.host,
          port: smtpConfig.port,
          username: smtpConfig.username,
          verifiedAt: new Date().toISOString(),
        }));
        setIsConnected(true);
        persistSMTPStatus(true, true);
        broadcastSMTPChange();
        // Also persist to server after successful verification
        const saveResult = await saveToServer(smtpConfig);
        if (!saveResult.success) {
          toast.warning('SMTP verified, but server save failed', {
            description: saveResult.error || 'Config is local only for now.',
          });
        }
      } else {
        toast.error('Connection failed', {
          description: result.error || 'Please check your SMTP credentials',
        });
        localStorage.removeItem('smtp_verified');
        setIsConnected(false);
        persistSMTPStatus(false, false);
        broadcastSMTPChange();
      }
    } catch (error) {
      toast.error('SMTP test failed', {
        description: 'Unable to reach the test endpoint. Please try again or check your API.',
      });
      localStorage.removeItem('smtp_verified');
      setIsConnected(false);
      persistSMTPStatus(false, false);
      broadcastSMTPChange();
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
      const response = await fetch(`${API_BASE_URL}/email-outreach.php?action=send_test`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          to_email: testEmailAddress,
          smtp_override: {
            host: smtpConfig.host,
            port: smtpConfig.port,
            username: smtpConfig.username,
            password: smtpConfig.password,
            secure: smtpConfig.secure,
            from_email: smtpConfig.fromEmail || smtpConfig.username,
            from_name: smtpConfig.fromName || 'BamLead',
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Test email sent!', {
          description: `Check ${testEmailAddress} for your test email`,
        });
        persistSMTPConfig(smtpConfig);
        localStorage.setItem('smtp_verified', JSON.stringify({
          host: smtpConfig.host,
          port: smtpConfig.port,
          username: smtpConfig.username,
          verifiedAt: new Date().toISOString(),
        }));
        setIsConnected(true);
        persistSMTPStatus(true, true);
        broadcastSMTPChange();
        const saveResult = await saveToServer(smtpConfig);
        if (!saveResult.success) {
          toast.warning('Test email sent, but server save failed', {
            description: saveResult.error || 'Config is local only for now.',
          });
        }
        setShowTestEmailInput(false);
        setTestEmailAddress('');
        void loadEmailHistory(false);
      } else {
        toast.error('Failed to send test email', {
          description: result.error || 'Check your SMTP configuration',
        });
        localStorage.removeItem('smtp_verified');
        setIsConnected(false);
        persistSMTPStatus(false, false);
        broadcastSMTPChange();
      }
    } catch (error) {
      toast.error('Failed to send test email', {
        description: 'Network error or server unavailable. Please try again.',
      });
      localStorage.removeItem('smtp_verified');
      setIsConnected(false);
      persistSMTPStatus(false, false);
      broadcastSMTPChange();
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRefreshEmails = async () => {
    await loadEmailHistory(true);
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

  const sanitizeSpreadsheetCell = (value: unknown) => {
    const raw = String(value ?? '').replace(/\r?\n/g, ' ').trim();
    if (/^[=+\-@]/.test(raw)) {
      return `'${raw}`;
    }
    return raw;
  };

  const triggerLeadDownload = (content: string, mimeType: string, extension: 'csv' | 'xls') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportLeads = (format: 'csv' | 'excel') => {
    if (leads.length === 0) {
      toast.error('No leads available to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Website', 'Address', 'Classification', 'Lead Score'];
    const rows = leads.map((lead) => [
      sanitizeSpreadsheetCell(lead.name),
      sanitizeSpreadsheetCell(lead.email || ''),
      sanitizeSpreadsheetCell(lead.phone || ''),
      sanitizeSpreadsheetCell(lead.website || ''),
      sanitizeSpreadsheetCell(lead.address || ''),
      sanitizeSpreadsheetCell(lead.aiClassification || ''),
      sanitizeSpreadsheetCell(lead.leadScore ?? ''),
    ]);

    if (format === 'excel') {
      const tsv = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
      triggerLeadDownload(tsv, 'application/vnd.ms-excel;charset=utf-8;', 'xls');
      toast.success('Lead export downloaded (Excel-compatible)');
      return;
    }

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    triggerLeadDownload(csv, 'text/csv;charset=utf-8;', 'csv');
    toast.success('Lead export downloaded (CSV)');
  };

  const getLeadsAsTabSeparated = () => {
    const headers = ['Name', 'Email', 'Phone', 'Website', 'Address', 'Classification', 'Lead Score'];
    const rows = leads.map((lead) => [
      sanitizeSpreadsheetCell(lead.name),
      sanitizeSpreadsheetCell(lead.email || ''),
      sanitizeSpreadsheetCell(lead.phone || ''),
      sanitizeSpreadsheetCell(lead.website || ''),
      sanitizeSpreadsheetCell(lead.address || ''),
      sanitizeSpreadsheetCell(lead.aiClassification || ''),
      sanitizeSpreadsheetCell(lead.leadScore ?? ''),
    ]);
    return [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
  };

  const handleOpenGoogleSheets = () => {
    if (leads.length === 0) {
      toast.error('No leads available to sync');
      return;
    }
    setShowGoogleSheetsDialog(true);
  };

  const handleGoogleSheetsSync = async () => {
    setIsSyncingGoogleSheets(true);
    try {
      const cleanUrl = googleSheetUrl.trim();
      const targetUrl = cleanUrl || 'https://docs.google.com/spreadsheets/create';

      if (cleanUrl) {
        let parsed: URL;
        try {
          parsed = new URL(cleanUrl);
        } catch {
          toast.error('Please enter a valid URL');
          return;
        }

        const isGoogleSheets =
          parsed.hostname.includes('docs.google.com') &&
          parsed.pathname.includes('/spreadsheets/');

        if (!isGoogleSheets) {
          toast.error('Please enter a Google Sheets URL');
          return;
        }
      }

      await navigator.clipboard.writeText(getLeadsAsTabSeparated());
      localStorage.setItem('bamlead_google_sheet_url', cleanUrl);

      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setShowGoogleSheetsDialog(false);
      toast.success('Leads copied. Paste into Google Sheets with Ctrl+V / Cmd+V.');
    } catch {
      toast.error('Failed to copy leads to clipboard');
    } finally {
      setIsSyncingGoogleSheets(false);
    }
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

              <div className="space-y-3">
                <Label className="text-sm font-medium">Connect External CRM</Label>
                <CRMSelectionPanel leadCount={leads.length} />
              </div>

              {/* Export Options */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Export Leads</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportLeads('csv')}>
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportLeads('excel')}>
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenGoogleSheets}>
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
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleRefreshEmails}
                    disabled={isLoadingEmails}
                  >
                    {isLoadingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Refresh
                  </Button>
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

      <Dialog open={showGoogleSheetsDialog} onOpenChange={setShowGoogleSheetsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Google Sheets Sync
            </DialogTitle>
            <DialogDescription>
              Paste an existing Google Sheet URL, or leave blank to create a new sheet. Lead rows will be copied for instant paste.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="google-sheet-url">Google Sheet URL (optional)</Label>
            <Input
              id="google-sheet-url"
              type="url"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
            Data is copied to your clipboard, then the sheet opens in a new tab. Paste with `Ctrl+V` or `Cmd+V`.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoogleSheetsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleGoogleSheetsSync()} disabled={isSyncingGoogleSheets}>
              {isSyncingGoogleSheets ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              Open Sheet & Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
