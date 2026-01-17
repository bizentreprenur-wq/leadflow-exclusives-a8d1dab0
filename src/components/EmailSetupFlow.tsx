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
  Eye, Zap
} from 'lucide-react';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import EmailOutreachModule from './EmailOutreachModule';
import CRMIntegrationModal from './CRMIntegrationModal';
import MailboxDripAnimation from './MailboxDripAnimation';
import EmailClientPreviewPanel from './EmailClientPreviewPanel';
import BamLeadCRMPanel from './BamLeadCRMPanel';
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
  
  // Check SMTP configuration
  const [smtpConfigured, setSmtpConfigured] = useState(() => {
    const config = JSON.parse(localStorage.getItem('smtp_config') || '{}');
    return Boolean(config.username && config.password);
  });

  // Convert leads to email format
  const emailLeads: LeadForEmail[] = leads.map(l => ({
    email: l.email || '',
    business_name: l.name,
    contact_name: '',
    website: l.website || '',
    phone: l.phone || '',
  }));

  const leadsWithEmail = emailLeads.filter(l => l.email);

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
              <h2 className="text-2xl font-bold mb-2">Step 1: Configure Email Server</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Before sending emails, you need to set up your SMTP server. This tells BamLead how to send your emails.
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
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Template Preview
                </TabsTrigger>
                <TabsTrigger value="crm" className="gap-2">
                  <Database className="w-4 h-4" />
                  BamLead CRM
                </TabsTrigger>
                <TabsTrigger value="mailbox" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Email Mailbox
                </TabsTrigger>
                <TabsTrigger value="send" className="gap-2">
                  <Send className="w-4 h-4" />
                  Send Campaign
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

              <TabsContent value="mailbox" className="mt-4">
                <div className="space-y-4">
                  {/* Mailbox Drip Animation */}
                  <MailboxDripAnimation
                    totalEmails={emailLeads.length}
                    sentCount={demoSentCount}
                    isActive={demoIsActive}
                    emailsPerHour={50}
                  />

                  {/* Live sending stats */}
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Smart Drip Technology</h4>
                            <p className="text-sm text-muted-foreground">
                              Emails are sent gradually to maximize deliverability
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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

            {/* External CRM Modal */}
            <div className="flex justify-center pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCRMModal(true)} className="gap-2">
                <Link2 className="w-4 h-4" />
                Connect External CRM (HubSpot, Salesforce, etc.)
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Button>

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
              onClick={() => {
                // Only allow going back or to completed phases
                if (isComplete || isCurrent) {
                  setCurrentPhase(phase.id as any);
                }
              }}
              disabled={!isComplete && !isCurrent}
               className={`p-4 rounded-xl text-center transition-all border border-border ${
                 isCurrent
                   ? 'bg-primary text-primary-foreground shadow-elevated scale-105 border-primary/30'
                   : isComplete
                   ? 'bg-success/10 text-success hover:bg-success/15 cursor-pointer border-success/20'
                   : 'bg-muted/30 text-muted-foreground opacity-50'
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
    </div>
  );
}
