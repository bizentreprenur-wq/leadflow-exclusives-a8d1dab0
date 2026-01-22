import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Server, FileText, Send, 
  CheckCircle2, Mail, Users, Loader2, Link2, Database,
  Eye, Zap, Rocket, BarChart3, FlaskConical, Home,
  Clock, TrendingUp, Info, Settings, Phone, X, AlertCircle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import EmailOutreachModule from './EmailOutreachModule';
import CRMIntegrationModal from './CRMIntegrationModal';
import MailboxDripAnimation from './MailboxDripAnimation';
import EmailClientPreviewPanel from './EmailClientPreviewPanel';
import BamLeadCRMPanel from './BamLeadCRMPanel';
import AutoCampaignWizard from './AutoCampaignWizard';
import CampaignAnalyticsDashboard from './CampaignAnalyticsDashboard';
import ABTestingPanel from './ABTestingPanel';
import CRMSelectionPanel from './CRMSelectionPanel';
import AITemplateSuggestions from './AITemplateSuggestions';
import AIEmailAssistant from './AIEmailAssistant';
import EmailConfigurationPanel from './EmailConfigurationPanel';
import { LeadForEmail, sendBulkEmails } from '@/lib/api/email';
import { isSMTPConfigured, personalizeContent } from '@/lib/emailService';
import EmailDeliveryNotifications from './EmailDeliveryNotifications';

interface SearchResult {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

interface EmailSetupFlowProps {
  leads: SearchResult[];
  onBack: () => void;
  onComplete: () => void;
  onOpenSettings: () => void;
}

export default function EmailSetupFlow({
  leads,
  onBack,
  onComplete,
  onOpenSettings,
}: EmailSetupFlowProps) {
  const [currentPhase, setCurrentPhase] = useState<'smtp' | 'template' | 'send'>('smtp');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    const saved = localStorage.getItem('bamlead_selected_template');
    return saved ? JSON.parse(saved) : null;
  });
  const [customizedContent, setCustomizedContent] = useState<{ subject: string; body: string } | null>(() => {
    const saved = localStorage.getItem('bamlead_template_customizations');
    return saved ? JSON.parse(saved) : null;
  });
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showAutoCampaign, setShowAutoCampaign] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  // Unified mailbox tab tracking - default to mailbox view
  const [activeTab, setActiveTab] = useState('mailbox');
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['mailbox']);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (!visitedTabs.includes(tab)) {
      setVisitedTabs(prev => [...prev, tab]);
    }
  };
  
  // SMTP configuration
  const [smtpConfigured, setSmtpConfigured] = useState(() => {
    const config = JSON.parse(localStorage.getItem('smtp_config') || '{}');
    return Boolean(config.username && config.password);
  });

  // Load AI-generated email template
  useEffect(() => {
    const savedAiTemplate = localStorage.getItem('ai_email_template');
    if (savedAiTemplate && !selectedTemplate) {
      try {
        const { subject, body } = JSON.parse(savedAiTemplate);
        if (subject && body) {
          setSelectedTemplate({
            id: 'ai-generated',
            name: 'AI-Generated Template',
            subject,
            body,
            category: 'ai-generated',
            conversionRate: '0%',
            useCase: 'Custom AI-generated email',
          });
          if (smtpConfigured) {
            setCurrentPhase('send');
          } else {
            setCurrentPhase('template');
          }
          localStorage.removeItem('ai_email_template');
        }
      } catch (e) {
        console.error('Failed to parse AI email template:', e);
      }
    }
  }, [smtpConfigured, selectedTemplate]);

  // Convert leads to email format
  const emailLeads: LeadForEmail[] = leads.map(l => ({
    email: l.email || '',
    business_name: l.name,
    contact_name: '',
    website: l.website || '',
    phone: l.phone || '',
  }));

  const leadsWithEmail = emailLeads.filter(l => l.email);
  const leadsWithPhone = leads.filter(l => l.phone);

  // Persist email leads
  useEffect(() => {
    if (emailLeads.length > 0) {
      sessionStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
    }
  }, [emailLeads]);

  // Sending state management
  const [demoSentCount, setDemoSentCount] = useState(0);
  const [demoIsActive, setDemoIsActive] = useState(false);
  const [realSendingMode, setRealSendingMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    if (currentPhase !== 'send') return;
    const total = emailLeads.length;
    if (total <= 0) {
      setDemoIsActive(false);
      setDemoSentCount(0);
      return;
    }
    // Only auto-activate demo mode if not in real sending mode
    if (!realSendingMode) {
      setDemoIsActive(true);
      setDemoSentCount(0);
      const interval = window.setInterval(() => {
        setDemoSentCount((c) => (c >= total ? 0 : c + 1));
      }, 650);
      return () => window.clearInterval(interval);
    }
  }, [currentPhase, emailLeads.length, realSendingMode]);

  const phases = [
    { id: 'smtp', label: '1. SMTP Setup', icon: Server, description: 'Configure your email server' },
    { id: 'template', label: '2. Choose Template', icon: FileText, description: 'Pick an email template' },
    { id: 'send', label: '3. Send Emails', icon: Send, description: 'Review and send campaign' },
  ];

  useEffect(() => {
    const checkSMTP = () => {
      const config = JSON.parse(localStorage.getItem('smtp_config') || '{}');
      setSmtpConfigured(Boolean(config.username && config.password));
    };
    checkSMTP();
    window.addEventListener('focus', checkSMTP);
    return () => window.removeEventListener('focus', checkSMTP);
  }, []);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    localStorage.setItem('bamlead_selected_template', JSON.stringify(template));
    setCurrentPhase('send');
    toast.success(`Template "${template.name}" selected!`);
  };

  const handleSaveCustomization = (subject: string, body: string) => {
    const customizations = { subject, body };
    setCustomizedContent(customizations);
    localStorage.setItem('bamlead_template_customizations', JSON.stringify(customizations));
    toast.success('Your template edits have been saved!');
    setShowTemplateEditor(false);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setCustomizedContent(null);
    localStorage.removeItem('bamlead_selected_template');
    localStorage.removeItem('bamlead_template_customizations');
    toast.info('Template cleared. Choose a new one below.');
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'smtp':
        return (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Server className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Step 1: Configure Your Email Server</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Emails are sent through <strong>your own SMTP server</strong> (Gmail, Outlook, custom domain). 
                This ensures better deliverability and keeps your brand consistent.
              </p>
            </div>

            <Card className={`border-2 ${smtpConfigured ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${smtpConfigured ? 'bg-success/15' : 'bg-warning/15'}`}>
                    {smtpConfigured ? '✅' : '⚙️'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">
                      {smtpConfigured ? 'SMTP is Configured!' : 'SMTP Not Yet Configured'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {smtpConfigured 
                        ? 'Your email server is ready. You can proceed to choose a template.'
                        : 'Click the button to go to Settings and set up your email server.'
                      }
                    </p>
                  </div>
                  <Button
                    onClick={onOpenSettings}
                    variant={smtpConfigured ? 'outline' : 'default'}
                    className={`gap-2 ${!smtpConfigured ? 'animate-pulse' : ''}`}
                  >
                    <Server className="w-4 h-4" />
                    {smtpConfigured ? 'View Settings' : 'Set Up SMTP →'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {smtpConfigured && (
              <div className="flex justify-center">
                <Button onClick={() => setCurrentPhase('template')} size="lg" className="gap-2">
                  Continue to Template Selection
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {!smtpConfigured && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">
                    Configure SMTP when you're ready — you can still preview templates and the drip campaign below.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={() => setCurrentPhase('template')} variant="secondary" size="lg" className="gap-2">
                    Preview Templates (Demo)
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentPhase('smtp')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to SMTP
              </Button>
              <Badge variant="outline" className="gap-2 text-lg px-4 py-2 bg-primary/10 border-primary/30">
                <Mail className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">{leadsWithEmail.length}</span> leads ready to email
              </Badge>
            </div>

            {selectedTemplate && (
              <Card className="border-2 border-success/50 bg-gradient-to-r from-success/10 to-green-500/5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">Your Selected Template</h3>
                          <Badge className="bg-success text-white text-xs">Active</Badge>
                          {customizedContent && (
                            <Badge variant="outline" className="border-warning text-warning text-xs">Customized</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedTemplate.name} • {selectedTemplate.category || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowTemplateEditor(true)} className="gap-2">
                        <FileText className="w-4 h-4" />
                        Edit Template
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearTemplate} className="text-muted-foreground hover:text-destructive">
                        Choose Different
                      </Button>
                    </div>
                  </div>

                  <div className="bg-background/80 rounded-lg p-4 border border-border">
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Subject Line</p>
                      <p className="font-semibold text-foreground">
                        {customizedContent?.subject || selectedTemplate.subject}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Preview</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {(customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, '').slice(0, 200)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Ready to send to <span className="font-bold text-success">{leadsWithEmail.length}</span> leads
                    </p>
                    <Button 
                      onClick={() => setCurrentPhase('send')}
                      className="gap-2 bg-gradient-to-r from-success to-green-600 hover:from-success/90 hover:to-green-700"
                    >
                      <Send className="w-4 h-4" />
                      Use This Template & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {showTemplateEditor && selectedTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/30 bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Edit Your Template
                    </CardTitle>
                    <CardDescription>
                      Customize the subject line and body to match your voice. Your changes are saved automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input 
                        id="subject"
                        value={customizedContent?.subject || selectedTemplate.subject}
                        placeholder="Enter your subject line..."
                        className="mt-1"
                        onChange={(e) => {
                          const body = customizedContent?.body || selectedTemplate.body || '';
                          handleSaveCustomization(e.target.value, body);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Email Body</Label>
                      <textarea 
                        id="body"
                        value={(customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, '')}
                        placeholder="Enter your email content..."
                        className="mt-1 w-full h-48 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(e) => {
                          const subject = customizedContent?.subject || selectedTemplate.subject;
                          handleSaveCustomization(subject, e.target.value);
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
                        Done Editing
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <AIEmailAssistant
                  template={selectedTemplate}
                  leads={leads}
                  currentSubject={customizedContent?.subject || selectedTemplate.subject}
                  currentBody={customizedContent?.body || selectedTemplate.body}
                  onApplySubject={(subject) => {
                    const body = customizedContent?.body || selectedTemplate.body || '';
                    handleSaveCustomization(subject, body);
                  }}
                  onApplyBody={(newBody) => {
                    const subject = customizedContent?.subject || selectedTemplate.subject;
                    const currentBody = customizedContent?.body || selectedTemplate.body || '';
                    const updatedBody = currentBody ? `${currentBody}\n\n${newBody}` : newBody;
                    handleSaveCustomization(subject, updatedBody.replace(/<[^>]*>/g, ''));
                  }}
                />
              </div>
            )}

            {!selectedTemplate && (
              <AITemplateSuggestions
                leads={leads.map(l => ({
                  id: l.id,
                  name: l.name,
                  email: l.email,
                  phone: l.phone,
                  website: l.website,
                  address: l.address,
                }))}
                onSelectTemplate={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
              />
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedTemplate ? 'Or Choose a Different Template' : 'Browse All Templates'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate
                      ? 'Browse our library of high-converting templates' 
                      : 'Pick a template that matches your outreach style. You can customize it after selection.'}
                  </p>
                </div>
              </div>

              {!selectedTemplate && (
                <div className="bg-gradient-to-r from-success/20 to-success/10 border-2 border-success/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/30 flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-bold text-success text-lg">👆 Click "READY TO SEND" on any template below</h3>
                      <p className="text-sm text-success/80">This will automatically take you to the next step to send your emails</p>
                    </div>
                  </div>
                </div>
              )}

              <HighConvertingTemplateGallery 
                onSelectTemplate={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
              />
            </div>
          </div>
        );

      case 'send':
        // Track if any emails have been sent (for showing analytics)
        const hasEmailsSent = demoSentCount > 0 || sessionStorage.getItem('emails_sent') === 'true';
        
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentPhase('template')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Templates
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-2">
                  <Mail className="w-3 h-3" />
                  {leadsWithEmail.length} ready to send
                </Badge>
              </div>
            </div>

            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-2">Step 3: Review & Send</h2>
              <p className="text-muted-foreground">
                {selectedTemplate 
                  ? `Using template: "${selectedTemplate.name}". Watch your emails being delivered in real-time.`
                  : 'Review your leads and send your email campaign.'
                }
              </p>
            </div>

            {/* ============================================= */}
            {/* 📬 UNIFIED MAILBOX - PERSISTENT SHELL */}
            {/* ============================================= */}
            <Card className="border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 overflow-hidden">
              {/* PERSISTENT TOP NAVIGATION BAR - NEVER CHANGES */}
              <CardHeader className="pb-0 border-b border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        📬 Smart Drip Mailbox
                        <Badge className="bg-primary/30 text-primary border-primary/50">
                          {realSendingMode ? 'SENDING' : 'LIVE'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Your unified outreach command center
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Real-time Delivery Notifications */}
                  <div className="relative">
                    <EmailDeliveryNotifications enabled={realSendingMode} />
                  </div>
                </div>
                
                {/* UNIFIED TAB BAR - STICKY, ALWAYS VISIBLE */}
                <div className="sticky top-0 z-10 flex items-center gap-1 pb-4 pt-2 -mt-2 bg-card/95 backdrop-blur-sm">
                  <TooltipProvider delayDuration={200}>
                    {[
                      { tab: 'mailbox', icon: Mail, label: 'Mailbox', color: 'blue', tooltip: 'View live email queue, sending progress & campaign stats' },
                      { tab: 'preview', icon: Eye, label: 'Preview', color: 'cyan', tooltip: 'Preview how your email looks in Gmail, Outlook & Apple Mail' },
                      { tab: 'crm', icon: Database, label: 'CRM', color: 'violet', tooltip: 'Connect HubSpot, Salesforce, or use BamLead CRM to manage leads' },
                      { tab: 'ab-testing', icon: FlaskConical, label: 'A/B', color: 'pink', tooltip: 'Create email variants & test which performs best' },
                      { tab: 'edit-template', icon: FileText, label: 'Edit', color: 'emerald', tooltip: 'Customize your email subject & body with AI assistance' },
                      { tab: 'settings', icon: Settings, label: 'SMTP', color: 'slate', tooltip: 'Configure your email server (Gmail, Outlook, custom SMTP)' },
                      { tab: 'inbox', icon: Mail, label: 'Inbox', color: 'slate', tooltip: 'View inbox messages (coming soon)' },
                    ].map((item) => (
                      <Tooltip key={item.tab}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleTabChange(item.tab)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                              ${activeTab === item.tab
                                ? (item.tab === 'mailbox'
                                  ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20'
                                  : 'border-primary bg-primary/20 text-primary-foreground shadow-lg shadow-primary/20')
                                : (item.tab === 'mailbox'
                                  ? 'border-transparent bg-muted/20 text-white/80 hover:bg-muted/40 hover:text-white'
                                  : 'border-transparent bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground')
                              }`}
                          >
                            <item.icon className={`w-4 h-4 ${item.tab === 'mailbox' ? 'text-white' : ''}`} />
                            <span className={item.tab === 'mailbox' ? 'text-white' : ''}>{item.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-center">
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </CardHeader>

              {/* CONTENT AREA - ONLY THIS CHANGES */}
              <CardContent className="pt-6 min-h-[500px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* MAILBOX VIEW - Default home */}
                    {activeTab === 'mailbox' && (
                      <div className="space-y-6">
                        {/* SELECTED TEMPLATE WITH INLINE EDITING */}
                        {selectedTemplate ? (
                          <div className="rounded-xl border-2 border-success/40 bg-gradient-to-r from-success/10 to-emerald-500/5 overflow-hidden">
                            {/* Template Header */}
                            <div className="flex items-center justify-between p-4 border-b border-success/20">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-foreground flex items-center gap-2">
                                    {selectedTemplate.name}
                                    <Badge className="bg-success/20 text-success border-success/40 text-xs">Active</Badge>
                                    {customizedContent && (
                                      <Badge variant="outline" className="border-warning/50 text-warning text-xs">Edited</Badge>
                                    )}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">{selectedTemplate.category || 'General'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                                  className="gap-2 text-primary hover:text-primary"
                                >
                                  <FileText className="w-4 h-4" />
                                  {showTemplateEditor ? 'Hide Editor' : 'Edit Template'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setCurrentPhase('template')}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  Change Template
                                </Button>
                              </div>
                            </div>
                            
                            {/* Inline Template Editor - Expandable */}
                            <AnimatePresence>
                              {showTemplateEditor && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 bg-background/50 border-b border-success/20">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      {/* Editor Fields */}
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="mailbox-subject" className="text-sm font-medium flex items-center gap-2">
                                            Subject Line
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                          </Label>
                                          <Input 
                                            id="mailbox-subject"
                                            value={customizedContent?.subject || selectedTemplate.subject}
                                            placeholder="Enter your subject line..."
                                            className="mt-1.5"
                                            onChange={(e) => {
                                              const body = customizedContent?.body || selectedTemplate.body || '';
                                              handleSaveCustomization(e.target.value, body);
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="mailbox-body" className="text-sm font-medium">Email Body</Label>
                                          <textarea 
                                            id="mailbox-body"
                                            value={(customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, '')}
                                            placeholder="Enter your email content..."
                                            className="mt-1.5 w-full h-40 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                            onChange={(e) => {
                                              const subject = customizedContent?.subject || selectedTemplate.subject;
                                              handleSaveCustomization(subject, e.target.value);
                                            }}
                                          />
                                        </div>
                                        
                                        {/* Personalization Tokens */}
                                        <div className="flex flex-wrap gap-2">
                                          <span className="text-xs text-muted-foreground">Quick tokens:</span>
                                          {['{{business_name}}', '{{first_name}}', '{{website}}'].map(token => (
                                            <button
                                              key={token}
                                              onClick={() => {
                                                const currentBody = customizedContent?.body || selectedTemplate.body || '';
                                                const subject = customizedContent?.subject || selectedTemplate.subject;
                                                handleSaveCustomization(subject, currentBody + ' ' + token);
                                              }}
                                              className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                            >
                                              {token}
                                            </button>
                                          ))}
                                        </div>
                                        
                                        {customizedContent && (
                                          <div className="flex items-center gap-2">
                                            <Badge className="bg-success/20 text-success border-success/40 text-xs">
                                              ✓ Changes saved automatically
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setCustomizedContent(null);
                                                localStorage.removeItem('bamlead_template_customizations');
                                                toast.info('Reverted to original template');
                                              }}
                                              className="text-xs text-muted-foreground hover:text-destructive"
                                            >
                                              Reset to Original
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Live Preview */}
                                      <div className="bg-background rounded-lg border border-border p-4">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                          <Eye className="w-3 h-3" />
                                          Live Preview
                                        </p>
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Subject:</p>
                                            <p className="font-medium text-sm">
                                              {personalizeContent(
                                                customizedContent?.subject || selectedTemplate.subject,
                                                { business_name: 'Acme Corp', first_name: 'John' }
                                              )}
                                            </p>
                                          </div>
                                          <Separator />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Body:</p>
                                            <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-6">
                                              {personalizeContent(
                                                (customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, ''),
                                                { business_name: 'Acme Corp', first_name: 'John', website: 'acme.com' }
                                              ).slice(0, 300)}...
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* Collapsed Preview */}
                            {!showTemplateEditor && (
                              <div className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                                    <p className="font-medium text-foreground truncate">
                                      {customizedContent?.subject || selectedTemplate.subject}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                      {(customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, '').slice(0, 150)}...
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-warning/40 bg-warning/10 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-warning" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-warning">No Template Selected</h3>
                                  <p className="text-xs text-muted-foreground">Choose a template to start your campaign</p>
                                </div>
                              </div>
                              <Button onClick={() => setCurrentPhase('template')} className="gap-2">
                                <FileText className="w-4 h-4" />
                                Choose Template
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* The Mailbox Animation - THE STAR OF THE SHOW */}
                        <MailboxDripAnimation
                          totalEmails={emailLeads.length}
                          sentCount={demoSentCount}
                          isActive={demoIsActive || realSendingMode}
                          emailsPerHour={50}
                          leads={leads.map(l => ({ id: l.id, name: l.name, email: l.email }))}
                          realSendingMode={realSendingMode}
                          campaignId={campaignId || undefined}
                          onEmailStatusUpdate={(statuses) => {
                            // Update sent count based on real status
                            const sentCount = Object.values(statuses).filter(s => s === 'sent' || s === 'delivered').length;
                            setDemoSentCount(sentCount);
                          }}
                        />
                        
                        {/* Total Leads Count */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-sm text-muted-foreground">Total Leads Ready</span>
                          <span className="text-2xl font-bold text-primary">{leadsWithEmail.length}</span>
                        </div>
                        
                        {/* SEND EMAILS BUTTON */}
                        <div className="pt-4 border-t border-primary/30">
                          <div className="flex flex-col gap-4">
                            {/* SMTP Check Warning */}
                            {!smtpConfigured && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-warning">SMTP not configured</p>
                                  <p className="text-xs text-muted-foreground">Configure your email server in Settings to send real emails</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleTabChange('settings')} className="text-warning border-warning/30">
                                  Configure SMTP
                                </Button>
                              </div>
                            )}

                            {/* Template Check Warning */}
                            {!selectedTemplate && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                                <FileText className="w-5 h-5 text-warning flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-warning">No template selected</p>
                                  <p className="text-xs text-muted-foreground">Choose an email template before sending</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPhase('template')} className="text-warning border-warning/30">
                                  Choose Template
                                </Button>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-foreground">Ready to launch your campaign?</p>
                                <p className="text-sm text-muted-foreground">
                                  {leadsWithEmail.length} businesses will receive your email via drip sending
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Demo Mode Button */}
                                <Button 
                                  variant="outline"
                                  size="lg"
                                  onClick={() => {
                                    setRealSendingMode(false);
                                    setDemoIsActive(true);
                                    toast.info('👀 Preview mode activated - simulating email delivery');
                                  }}
                                  disabled={isSending}
                                  className="gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview
                                </Button>
                                
                                {/* Real Send Button */}
                                <Button 
                                  size="lg"
                                  onClick={async () => {
                                    if (!smtpConfigured) {
                                      toast.error('Please configure SMTP settings first');
                                      handleTabChange('settings');
                                      return;
                                    }
                                    if (!selectedTemplate) {
                                      toast.error('Please select an email template first');
                                      setCurrentPhase('template');
                                      return;
                                    }
                                    
                                    setIsSending(true);
                                    try {
                                      const result = await sendBulkEmails({
                                        leads: emailLeads,
                                        custom_subject: customizedContent?.subject || selectedTemplate.subject,
                                        custom_body: customizedContent?.body || selectedTemplate.body,
                                        send_mode: 'drip',
                                        drip_config: { emailsPerHour: 50, delayMinutes: 1 },
                                      });
                                      
                                      if (result.success) {
                                        sessionStorage.setItem('emails_sent', 'true');
                                        setRealSendingMode(true);
                                        setDemoIsActive(true);
                                        toast.success(`🚀 Campaign launched! Sending ${result.results?.sent || 0} emails...`);
                                      } else {
                                        toast.error(result.error || 'Failed to send emails');
                                      }
                                    } catch (error) {
                                      console.error('Send error:', error);
                                      toast.error('Failed to send emails. Check your connection.');
                                    } finally {
                                      setIsSending(false);
                                    }
                                  }}
                                  disabled={isSending || !smtpConfigured || !selectedTemplate}
                                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold px-8 py-6 text-lg shadow-lg shadow-primary/30"
                                >
                                  {isSending ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-5 h-5" />
                                      Send Emails Now
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Conditional Analytics */}
                        {hasEmailsSent && demoSentCount > 0 && (
                          <div className="pt-4 border-t border-success/30">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 className="w-5 h-5 text-success" />
                              <h4 className="font-bold text-success">Campaign Analytics</h4>
                            </div>
                            <CampaignAnalyticsDashboard />
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'inbox' && (
                      <div className="p-6 rounded-lg bg-muted/20 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">Inbox</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Inbox view is coming next — the tab is now in the correct spot (right after SMTP).</p>
                      </div>
                    )}

                    {/* PREVIEW VIEW */}
                    {activeTab === 'preview' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Eye className="w-5 h-5 text-cyan-400" />
                          <h3 className="font-bold text-lg">Email Preview</h3>
                        </div>
                        {selectedTemplate ? (
                          <EmailClientPreviewPanel 
                            subject={customizedContent?.subject || selectedTemplate.subject} 
                            body={customizedContent?.body || selectedTemplate.body_html || selectedTemplate.body}
                            templateName={selectedTemplate.name}
                          />
                        ) : (
                          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                            <h3 className="font-semibold mb-2">No Template Selected</h3>
                            <p className="text-muted-foreground text-sm mb-4">Go back and select a template first</p>
                            <Button size="sm" onClick={() => setCurrentPhase('template')}>Choose Template</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CRM VIEW */}
                    {activeTab === 'crm' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Database className="w-5 h-5 text-violet-400" />
                          <h3 className="font-bold text-lg">CRM Integration</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Database className="w-4 h-4 text-violet-400" />
                              Connect External CRM
                            </h4>
                            <CRMSelectionPanel leadCount={leads.length} />
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-400" />
                              BamLead CRM
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs">Built-in</Badge>
                            </h4>
                            <p className="text-muted-foreground text-sm mb-4">
                              Manage your leads directly without any external integrations.
                            </p>
                            <BamLeadCRMPanel 
                              leads={leads.map(l => ({
                                id: l.id,
                                name: l.name,
                                email: l.email,
                                phone: l.phone,
                                website: l.website,
                                address: l.address,
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* A/B TESTING VIEW */}
                    {activeTab === 'ab-testing' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FlaskConical className="w-5 h-5 text-pink-400" />
                          <h3 className="font-bold text-lg">A/B Testing</h3>
                        </div>
                        <ABTestingPanel />
                      </div>
                    )}

                    {/* EDIT TEMPLATE VIEW */}
                    {activeTab === 'edit-template' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <h3 className="font-bold text-lg">Edit Template</h3>
                        </div>
                        {selectedTemplate ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-subject">Subject Line</Label>
                                <Input 
                                  id="edit-subject"
                                  value={customizedContent?.subject || selectedTemplate.subject}
                                  placeholder="Enter your subject line..."
                                  className="mt-1"
                                  onChange={(e) => {
                                    const body = customizedContent?.body || selectedTemplate.body || '';
                                    handleSaveCustomization(e.target.value, body);
                                  }}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-body">Email Body</Label>
                                <textarea 
                                  id="edit-body"
                                  value={(customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, '')}
                                  placeholder="Enter your email content..."
                                  className="mt-1 w-full h-64 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                  onChange={(e) => {
                                    const subject = customizedContent?.subject || selectedTemplate.subject;
                                    handleSaveCustomization(subject, e.target.value);
                                  }}
                                />
                              </div>
                              {customizedContent && (
                                <Badge variant="outline" className="border-success text-success">
                                  ✓ Your edits are saved automatically
                                </Badge>
                              )}
                            </div>
                            <AIEmailAssistant
                              template={selectedTemplate}
                              leads={leads}
                              currentSubject={customizedContent?.subject || selectedTemplate.subject}
                              currentBody={customizedContent?.body || selectedTemplate.body}
                              onApplySubject={(subject) => {
                                const body = customizedContent?.body || selectedTemplate.body || '';
                                handleSaveCustomization(subject, body);
                              }}
                              onApplyBody={(newBody) => {
                                const subject = customizedContent?.subject || selectedTemplate.subject;
                                const currentBody = customizedContent?.body || selectedTemplate.body || '';
                                const updatedBody = currentBody ? `${currentBody}\n\n${newBody}` : newBody;
                                handleSaveCustomization(subject, updatedBody.replace(/<[^>]*>/g, ''));
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                            <h3 className="font-semibold mb-2">No Template Selected</h3>
                            <p className="text-muted-foreground text-sm mb-4">Select a template first to edit it</p>
                            <Button size="sm" onClick={() => setCurrentPhase('template')}>Choose Template</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SMTP SETTINGS VIEW */}
                    {activeTab === 'settings' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="w-5 h-5 text-slate-400" />
                          <h3 className="font-bold text-lg">Email Settings (SMTP)</h3>
                        </div>
                        <EmailConfigurationPanel leads={leads} hideTabBar={true} initialTab="smtp" />
                      </div>
                    )}

                    {/* INBOX VIEW */}
                    {activeTab === 'inbox' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Mail className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-lg">Inbox</h3>
                        </div>
                        <EmailConfigurationPanel leads={leads} hideTabBar={true} initialTab="inbox" />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCRMModal(true)} className="gap-2">
                <Link2 className="w-4 h-4" />
                Connect External CRM
              </Button>
              <div className="flex items-center gap-3">
                {leadsWithPhone.length > 0 && (
                  <Button variant="outline" onClick={onComplete} className="gap-2">
                    <Phone className="w-4 h-4" />
                    Continue to Calls ({leadsWithPhone.length})
                  </Button>
                )}
                <Button onClick={() => setShowAutoCampaign(true)} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Rocket className="w-4 h-4" />
                  Auto Campaign Wizard
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Button>
        <Button variant="ghost" onClick={() => window.location.href = '/'} className="gap-2 text-muted-foreground hover:text-foreground">
          <Home className="w-4 h-4" />
          Home
        </Button>
      </div>

      {/* Header */}
      <div className="text-center py-6 bg-gradient-card rounded-2xl border-2 border-primary/20 shadow-card">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">STEP 3: Email Outreach</h1>
        <p className="text-muted-foreground">
          {leads.length} leads ready • {leadsWithEmail.length} with email addresses
        </p>
      </div>

      {/* Phase Progress */}
      <div className="grid grid-cols-3 gap-2">
        {phases.map((phase, idx) => {
          const isCurrent = phase.id === currentPhase;
          const isComplete = phases.findIndex(p => p.id === currentPhase) > idx;
          
          return (
            <button
              key={phase.id}
              onClick={() => setCurrentPhase(phase.id as any)}
              className={`p-4 rounded-xl text-center transition-all border border-border cursor-pointer hover:scale-102 ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-elevated scale-105 border-primary/30'
                  : isComplete
                  ? 'bg-success/10 text-success hover:bg-success/15 border-success/20'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <phase.icon className="w-6 h-6" />
                )}
                <span className="font-semibold text-sm">{phase.label}</span>
                <span className="text-xs opacity-80 hidden sm:block">{phase.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Phase Content */}
      <Card>
        <CardContent className="p-6">
          {renderPhaseContent()}
        </CardContent>
      </Card>

      {/* CRM Modal */}
      <CRMIntegrationModal
        open={showCRMModal}
        onOpenChange={setShowCRMModal}
        leads={leads.map(l => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phone: l.phone,
          website: l.website,
          email: l.email,
          source: 'gmb' as const,
        }))}
      />

      {/* Auto Campaign Wizard */}
      <AutoCampaignWizard
        open={showAutoCampaign}
        onOpenChange={setShowAutoCampaign}
        leads={leads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
        }))}
        onLaunch={(campaignData) => {
          toast.success(`Campaign "${campaignData.name}" launched!`);
        }}
      />
    </div>
  );
}
