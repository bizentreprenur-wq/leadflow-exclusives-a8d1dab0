import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Server, FileText, Send, 
  CheckCircle2, Mail, Users, Loader2, Link2
} from 'lucide-react';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import EmailOutreachModule from './EmailOutreachModule';
import CRMIntegrationModal from './CRMIntegrationModal';
import MailboxDripAnimation from './MailboxDripAnimation';
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

            <Card className={`border-2 ${smtpConfigured ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${smtpConfigured ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
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
              <div className="text-center p-6 bg-muted/50 rounded-xl border border-dashed">
                <p className="text-muted-foreground">
                  👆 Configure your SMTP settings first, then come back here to continue
                </p>
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
                <Button variant="outline" onClick={() => setShowCRMModal(true)} className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Connect CRM
                </Button>
              </div>
            </div>

            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-2">Step 3: Review & Send</h2>
              <p className="text-muted-foreground">
                {selectedTemplate 
                  ? `Using template: "${selectedTemplate.name}". Review and send your campaign.`
                  : 'Review your leads and send your email campaign.'
                }
              </p>
            </div>

            {/* Mailbox Drip Animation */}
            <MailboxDripAnimation
              totalEmails={emailLeads.length}
              sentCount={0}
              isActive={false}
              emailsPerHour={50}
            />

            <EmailOutreachModule 
              selectedLeads={emailLeads}
              onClearSelection={() => {
                toast.success('Campaign complete!');
                onComplete();
              }}
            />
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
      <div className="text-center py-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border-2 border-blue-500/30">
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
              className={`p-4 rounded-xl text-center transition-all ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : isComplete
                  ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 cursor-pointer'
                  : 'bg-muted/50 text-muted-foreground opacity-50'
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
