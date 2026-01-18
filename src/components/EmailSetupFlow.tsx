import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showAutoCampaign, setShowAutoCampaign] = useState(false);
  
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
    setCurrentPhase('send');
    toast.success(`Template "${template.name}" selected!`);
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
              <Badge variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                {leadsWithEmail.length} leads with email
              </Badge>
            </div>

            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-2">Step 2: Choose Your Email Template</h2>
              <p className="text-muted-foreground">
                Pick a template that matches your outreach style. You can customize it before sending.
              </p>
            </div>

            <HighConvertingTemplateGallery 
              onSelectTemplate={handleTemplateSelect}
            />
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

            {/* Tabbed Interface for all visual components */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/50">
                <TabsTrigger value="preview" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </TabsTrigger>
                <TabsTrigger value="crm" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">CRM</span>
                </TabsTrigger>
                <TabsTrigger value="ab-testing" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                  <FlaskConical className="w-4 h-4" />
                  <span className="hidden sm:inline">A/B Test</span>
                </TabsTrigger>
                <TabsTrigger value="mailbox" className="relative gap-2 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white animate-pulse">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Mailbox</span>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="send" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </TabsTrigger>
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
              </TabsContent>

              <TabsContent value="ab-testing" className="mt-4">
                <ABTestingPanel />
              </TabsContent>

              <TabsContent value="mailbox" className="mt-4">
                <div className="space-y-4">
                  {/* Mailbox Drip Animation */}
                  <MailboxDripAnimation
                    totalEmails={emailLeads.length}
                    sentCount={demoSentCount}
                    isActive={demoIsActive}
                    emailsPerHour={50}
                  />

                  {/* Live sending stats - with glow effect */}
                  <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-pulse-slow">
                    {/* Animated glow border */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-shimmer" />
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                            <Zap className="w-5 h-5 text-primary animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-primary">Smart Drip Technology</h4>
                            <p className="text-sm text-muted-foreground">
                              Emails are sent gradually to maximize deliverability
                            </p>
                          </div>
                        </div>
                        <Badge className="gap-1 bg-success/20 text-success border-success/50 shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
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
              <Button 
                onClick={() => setShowAutoCampaign(true)} 
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Rocket className="w-4 h-4" />
                Auto Campaign Wizard
              </Button>
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
