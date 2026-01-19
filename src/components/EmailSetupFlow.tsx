import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Server, FileText, Send, 
  CheckCircle2, Mail, Users, Loader2, Link2, Database,
  Eye, Zap, Rocket, BarChart3, FlaskConical, Home
} from 'lucide-react';
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
import { LeadForEmail } from '@/lib/api/email';

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
    // Load previously selected template from localStorage
    const saved = localStorage.getItem('bamlead_selected_template');
    return saved ? JSON.parse(saved) : null;
  });
  const [customizedContent, setCustomizedContent] = useState<{ subject: string; body: string } | null>(() => {
    // Load customer's edits to their template
    const saved = localStorage.getItem('bamlead_template_customizations');
    return saved ? JSON.parse(saved) : null;
  });
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showAutoCampaign, setShowAutoCampaign] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  // Guided tab tracking - prompts user to visit each section
  const [activeTab, setActiveTab] = useState('preview');
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['preview']);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (!visitedTabs.includes(tab)) {
      setVisitedTabs(prev => [...prev, tab]);
    }
  };
  
  // Check SMTP configuration
  const [smtpConfigured, setSmtpConfigured] = useState(() => {
    const config = JSON.parse(localStorage.getItem('smtp_config') || '{}');
    return Boolean(config.username && config.password);
  });

  // Load AI-generated email template from AIEmailWriter if available
  useEffect(() => {
    const savedAiTemplate = localStorage.getItem('ai_email_template');
    if (savedAiTemplate && !selectedTemplate) {
      try {
        const { subject, body } = JSON.parse(savedAiTemplate);
        if (subject && body) {
          // Create a template object from the AI-generated content
          setSelectedTemplate({
            id: 'ai-generated',
            name: 'AI-Generated Template',
            subject,
            body,
            category: 'ai-generated',
            conversionRate: '0%',
            useCase: 'Custom AI-generated email',
          });
          // Auto-skip to send phase if SMTP is configured
          if (smtpConfigured) {
            setCurrentPhase('send');
          } else {
            setCurrentPhase('template');
          }
          // Clear the stored template after loading
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

  // Persist email leads to sessionStorage for Step 4 access
  useEffect(() => {
    if (emailLeads.length > 0) {
      sessionStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
    }
  }, [emailLeads]);

  // Demo-only visual sending simulation (does not send anything)
  const [demoSentCount, setDemoSentCount] = useState(0);
  const [demoIsActive, setDemoIsActive] = useState(false);

  useEffect(() => {
    if (currentPhase !== 'send') return;

    const total = emailLeads.length;
    if (total <= 0) {
      setDemoIsActive(false);
      setDemoSentCount(0);
      return;
    }

    setDemoIsActive(true);
    setDemoSentCount(0);

    const interval = window.setInterval(() => {
      setDemoSentCount((c) => (c >= total ? 0 : c + 1));
    }, 650);

    return () => window.clearInterval(interval);
  }, [currentPhase, emailLeads.length]);

  const phases = [
    { id: 'smtp', label: '1. SMTP Setup', icon: Server, description: 'Configure your email server' },
    { id: 'template', label: '2. Choose Template', icon: FileText, description: 'Pick an email template' },
    { id: 'send', label: '3. Send Emails', icon: Send, description: 'Review and send campaign' },
  ];

  // Re-check SMTP when returning to this component
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
    // Persist selected template
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
                    Configure SMTP when you’re ready — you can still preview templates and the drip campaign below.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => setCurrentPhase('template')}
                    variant="secondary"
                    size="lg"
                    className="gap-2"
                  >
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

            {/* Previously Selected Template - Show if customer already chose one */}
            {selectedTemplate && (
              <Card className="border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-green-500/5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">Your Selected Template</h3>
                          <Badge className="bg-emerald-500 text-white text-xs">Active</Badge>
                          {customizedContent && (
                            <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">Customized</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedTemplate.name} • {selectedTemplate.category || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowTemplateEditor(true)}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Edit Template
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearTemplate}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        Choose Different
                      </Button>
                    </div>
                  </div>

                  {/* Template Preview */}
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

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Ready to send to <span className="font-bold text-emerald-500">{leadsWithEmail.length}</span> leads
                    </p>
                    <Button 
                      onClick={() => setCurrentPhase('send')}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                    >
                      <Send className="w-4 h-4" />
                      Use This Template & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Template Editor Modal */}
            {showTemplateEditor && selectedTemplate && (
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
                      defaultValue={customizedContent?.subject || selectedTemplate.subject}
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
                      defaultValue={(customizedContent?.body || selectedTemplate.body || '').replace(/<[^>]*>/g, '')}
                      placeholder="Enter your email content..."
                      className="mt-1 w-full h-40 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
            )}

            {/* Browse Templates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedTemplate ? 'Or Choose a Different Template' : 'Choose Your Email Template'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate 
                      ? 'Browse our library of high-converting templates' 
                      : 'Pick a template that matches your outreach style. You can customize it after selection.'}
                  </p>
                </div>
              </div>

              {!selectedTemplate && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-400 text-lg">👆 Click "READY TO SEND" on any template below</h3>
                      <p className="text-sm text-green-300/80">This will automatically take you to the next step to send your emails</p>
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
                  ? `Using template: "${selectedTemplate.name}". Preview, manage leads in CRM, and send.`
                  : 'Review your leads and send your email campaign.'
                }
              </p>
            </div>

            {/* GUIDED SETUP CHECKLIST - Prompts user to configure each section */}
            <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">📋 Setup Checklist — Click Each Tab Below</h3>
                    <p className="text-sm text-muted-foreground">Complete each section to launch your campaign</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { tab: 'preview', icon: Eye, label: 'Preview Email', color: 'blue', desc: 'See how it looks' },
                    { tab: 'crm', icon: Database, label: 'Setup CRM', color: 'violet', desc: 'Organize leads' },
                    { tab: 'ab-testing', icon: FlaskConical, label: 'A/B Testing', color: 'pink', desc: 'Test variations' },
                    { tab: 'mailbox', icon: Mail, label: 'Mailbox', color: 'amber', desc: 'View drip queue' },
                    { tab: 'analytics', icon: BarChart3, label: 'Analytics', color: 'emerald', desc: 'Track results' },
                    { tab: 'send', icon: Send, label: 'Send Emails', color: 'red', desc: 'Launch campaign!' },
                  ].map((item, idx) => (
                    <button
                      key={item.tab}
                      onClick={() => setActiveTab(item.tab)}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer text-left
                        ${activeTab === item.tab 
                          ? `border-${item.color}-500 bg-${item.color}-500/20 ring-2 ring-${item.color}-500/50` 
                          : visitedTabs.includes(item.tab)
                            ? 'border-success/50 bg-success/10'
                            : 'border-border bg-muted/30 hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className={`w-4 h-4 ${activeTab === item.tab ? `text-${item.color}-500` : visitedTabs.includes(item.tab) ? 'text-success' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-bold">{idx + 1}</span>
                        {visitedTabs.includes(item.tab) && <CheckCircle2 className="w-3 h-3 text-success ml-auto" />}
                      </div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Progress: <span className="font-bold text-primary">{visitedTabs.length}/6</span> sections viewed
                  </p>
                  {visitedTabs.length >= 6 && (
                    <Badge className="bg-success text-white animate-pulse gap-1">
                      <CheckCircle2 className="w-3 h-3" /> All Setup Complete!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Interface for all visual components */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/50">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="preview" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-center">
                      <p className="font-semibold mb-1">👁️ Email Preview</p>
                      <p className="text-xs text-muted-foreground">
                        See exactly how your email will appear in Gmail, Outlook, and Apple Mail before sending.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="crm" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                        <Database className="w-4 h-4" />
                        <span className="hidden sm:inline">CRM</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-center">
                      <p className="font-semibold mb-1">🗂️ Lead Management (CRM)</p>
                      <p className="text-xs text-muted-foreground">
                        Organize, filter, and track your leads. Update statuses, add notes, and monitor email campaign results.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="ab-testing" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                        <FlaskConical className="w-4 h-4" />
                        <span className="hidden sm:inline">A/B Test</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-center">
                      <p className="font-semibold mb-1">📊 What is A/B Testing?</p>
                      <p className="text-xs text-muted-foreground">
                        Compare two email versions (subject lines, content, CTAs) to see which gets more opens & clicks. 
                        This helps you send winning emails every time!
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="mailbox" className="relative gap-2 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">Mailbox</span>
                        {!visitedTabs.includes('mailbox') && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />}
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-center">
                      <p className="font-semibold mb-1">📬 Drip Mailbox</p>
                      <p className="text-xs text-muted-foreground">
                        Watch your emails being sent in real-time. Drip sending spaces out emails to avoid spam filters and improve deliverability.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="analytics" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Analytics</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-center">
                      <p className="font-semibold mb-1">📈 Campaign Analytics</p>
                      <p className="text-xs text-muted-foreground">
                        Track open rates, click rates, and engagement. See which emails perform best and optimize your outreach strategy.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="send" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-red-500 data-[state=active]:text-white">
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-center">
                      <p className="font-semibold mb-1">🚀 Send Campaign</p>
                      <p className="text-xs text-muted-foreground">
                        Launch your email campaign! Review final settings, select recipients, and hit send to start your outreach.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                {selectedTemplate ? (
                  <EmailClientPreviewPanel 
                    subject={selectedTemplate.subject} 
                    body={selectedTemplate.body_html}
                    templateName={selectedTemplate.name}
                  />
                ) : (
                  <Card className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Go back and select a template to preview it here
                    </p>
                    <Button onClick={() => setCurrentPhase('template')}>
                      Choose Template
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="crm" className="mt-4">
                <div className="space-y-6">
                  {/* CRM Selection Panel */}
                  <CRMSelectionPanel leadCount={leads.length} />
                  
                  {/* Lead Management CRM Panel */}
                  <div className="border-t border-border pt-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5 text-violet-500" />
                      Lead Management
                    </h3>
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
              </TabsContent>

              <TabsContent value="ab-testing" className="mt-4">
                <ABTestingPanel />
              </TabsContent>

              <TabsContent value="mailbox" className="mt-4">
                <div className="space-y-4">
                  {/* Mailbox Drip Animation - with lead details */}
                  <MailboxDripAnimation
                    totalEmails={emailLeads.length}
                    sentCount={demoSentCount}
                    isActive={demoIsActive}
                    emailsPerHour={50}
                    leads={leads.map(l => ({ id: l.id, name: l.name, email: l.email }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                <CampaignAnalyticsDashboard />
              </TabsContent>

              <TabsContent value="send" className="mt-4">
                <EmailOutreachModule 
                  selectedLeads={emailLeads}
                  onClearSelection={() => {
                    toast.success('Campaign complete!');
                    onComplete();
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCRMModal(true)} className="gap-2">
                <Link2 className="w-4 h-4" />
                Connect External CRM
              </Button>
              <div className="flex items-center gap-3">
                {/* Dynamic Next Step Button - Color matches next tab */}
                {activeTab === 'preview' && (
                  <Button 
                    onClick={() => handleTabChange('crm')} 
                    size="sm"
                    className="gap-2 bg-violet-500 hover:bg-violet-600 text-white transition-all hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next: Setup CRM
                  </Button>
                )}
                {activeTab === 'crm' && (
                  <Button 
                    onClick={() => handleTabChange('ab-testing')} 
                    size="sm"
                    className="gap-2 bg-pink-500 hover:bg-pink-600 text-white transition-all hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next: A/B Testing
                  </Button>
                )}
                {activeTab === 'ab-testing' && (
                  <Button 
                    onClick={() => handleTabChange('mailbox')} 
                    size="sm"
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-white transition-all hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next: Mailbox
                  </Button>
                )}
                {activeTab === 'mailbox' && (
                  <Button 
                    onClick={() => handleTabChange('analytics')} 
                    size="sm"
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next: Analytics
                  </Button>
                )}
                {activeTab === 'analytics' && (
                  <Button 
                    onClick={() => handleTabChange('send')} 
                    size="sm"
                    className="gap-2 bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next: Send Emails
                  </Button>
                )}
                {activeTab === 'send' && (
                  <Button 
                    onClick={onComplete} 
                    size="sm"
                    className="gap-2 bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next: Outreach Hub
                  </Button>
                )}
                <Button 
                  onClick={() => setShowAutoCampaign(true)} 
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
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
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/'}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
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
