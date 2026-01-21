import { useState, useEffect } from 'react';
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
  Clock, TrendingUp, Info, Settings, Phone, X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  
  // Guided tab tracking
  const [activeTab, setActiveTab] = useState('preview');
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['preview']);
  
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

  // Demo sending simulation
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
            {/* 📬 THE MAILBOX - WITH TOOLS INSIDE ON LEFT */}
            {/* ============================================= */}
            <Card className="border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        📬 Smart Drip Mailbox
                        <Badge className="bg-blue-500/30 text-blue-300 border-blue-500/50">
                          LIVE
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Watch your emails being delivered to each business in real-time
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* TOOLS BAR - INSIDE MAILBOX HEADER ON RIGHT */}
                  <div className="flex items-center gap-1">
                    {[
                      { tab: 'preview', icon: Eye, label: 'Preview', color: 'blue' },
                      { tab: 'crm', icon: Database, label: 'CRM', color: 'violet' },
                      { tab: 'ab-testing', icon: FlaskConical, label: 'A/B', color: 'pink' },
                      { tab: 'smtp', icon: Settings, label: 'SMTP', color: 'slate' },
                    ].map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => {
                          if (item.tab === 'smtp') {
                            setCurrentPhase('smtp');
                          } else {
                            handleTabChange(item.tab);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all hover:scale-105
                          ${activeTab === item.tab 
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                            : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                          }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* The Mailbox Animation - THE STAR OF THE SHOW */}
                <MailboxDripAnimation
                  totalEmails={emailLeads.length}
                  sentCount={demoSentCount}
                  isActive={demoIsActive}
                  emailsPerHour={50}
                  leads={leads.map(l => ({ id: l.id, name: l.name, email: l.email }))}
                />
                
                {/* Total Leads Count */}
                <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm text-muted-foreground">Total Leads Ready</span>
                  <span className="text-2xl font-bold text-blue-400">{leadsWithEmail.length}</span>
                </div>
                
                {/* SEND EMAILS BUTTON - INSIDE THE MAILBOX */}
                <div className="mt-6 pt-4 border-t border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Ready to launch your campaign?</p>
                      <p className="text-sm text-muted-foreground">
                        {leadsWithEmail.length} businesses will receive your email via drip sending
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      onClick={() => {
                        sessionStorage.setItem('emails_sent', 'true');
                        setDemoIsActive(true);
                        toast.success('🚀 Campaign launched! Emails are being sent...');
                      }}
                      className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-6 text-lg shadow-lg shadow-blue-500/30"
                    >
                      <Send className="w-5 h-5" />
                      Send Emails Now
                    </Button>
                  </div>
                </div>

                {/* Conditional Analytics - INSIDE MAILBOX after sending */}
                {hasEmailsSent && demoSentCount > 0 && (
                  <div className="mt-6 pt-4 border-t border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bold text-emerald-400">Campaign Analytics</h4>
                    </div>
                    <CampaignAnalyticsDashboard />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TOOL CONTENT - Shows below when a tool is selected */}
            {activeTab && activeTab !== 'analytics' && (
              <Card className="border-2 border-primary/20 bg-muted/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {activeTab === 'preview' && <><Eye className="w-5 h-5 text-blue-400" /> Email Preview</>}
                      {activeTab === 'crm' && <><Database className="w-5 h-5 text-violet-400" /> CRM Integration</>}
                      {activeTab === 'ab-testing' && <><FlaskConical className="w-5 h-5 text-pink-400" /> A/B Testing</>}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('')} className="text-muted-foreground">
                      ✕ Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === 'preview' && (
                    selectedTemplate ? (
                      <EmailClientPreviewPanel 
                        subject={selectedTemplate.subject} 
                        body={selectedTemplate.body_html}
                        templateName={selectedTemplate.name}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <h3 className="font-semibold mb-2">No Template Selected</h3>
                        <p className="text-muted-foreground text-sm mb-3">Go back and select a template</p>
                        <Button size="sm" onClick={() => setCurrentPhase('template')}>Choose Template</Button>
                      </div>
                    )
                  )}
                  {activeTab === 'crm' && (
                    <div className="space-y-4">
                      <CRMSelectionPanel leadCount={leads.length} />
                      <div className="border-t border-border pt-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                          <Database className="w-4 h-4 text-violet-500" />
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
                  )}
                  {activeTab === 'ab-testing' && <ABTestingPanel />}
                </CardContent>
              </Card>
            )}

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
