import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Server, FileText, Send, 
  CheckCircle2, Mail, Loader2, Settings, Phone,
  Eye, Home, Play, Pause, AlertCircle, X, BarChart3
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import HighConvertingTemplateGallery from './HighConvertingTemplateGallery';
import CampaignAnalyticsDashboard from './CampaignAnalyticsDashboard';
import { LeadForEmail, sendBulkEmails } from '@/lib/api/email';

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
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'mailbox'>('setup');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    const saved = localStorage.getItem('bamlead_selected_template');
    return saved ? JSON.parse(saved) : null;
  });
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  
  // SMTP Configuration
  const [smtpConfigured, setSmtpConfigured] = useState(() => {
    const config = JSON.parse(localStorage.getItem('smtp_config') || '{}');
    return Boolean(config.username && config.password);
  });

  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, 'pending' | 'sending' | 'sent' | 'failed'>>({});
  const [sendingComplete, setSendingComplete] = useState(false);

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

  // Initialize email statuses
  useEffect(() => {
    if (leads.length > 0) {
      const initialStatuses: Record<string, 'pending' | 'sending' | 'sent' | 'failed'> = {};
      leads.forEach(lead => {
        if (lead.email) {
          initialStatuses[lead.id] = 'pending';
        }
      });
      setEmailStatuses(initialStatuses);
    }
  }, [leads]);

  // Persist email leads to sessionStorage for Step 4 access
  useEffect(() => {
    if (emailLeads.length > 0) {
      sessionStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
    }
  }, [emailLeads]);

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
    localStorage.setItem('bamlead_selected_template', JSON.stringify(template));
    setShowTemplateGallery(false);
    toast.success(`Template "${template.name}" selected!`);
  };

  // Actual email sending function
  const handleSendEmails = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }
    if (!smtpConfigured) {
      toast.error('Please configure SMTP in settings first');
      onOpenSettings();
      return;
    }
    if (leadsWithEmail.length === 0) {
      toast.error('No leads with email addresses');
      return;
    }

    setIsSending(true);
    setCurrentPhase('mailbox');
    setSentCount(0);
    setSendingComplete(false);

    // Send emails one by one with visual feedback
    const leadsToSend = leads.filter(l => l.email);
    
    for (let i = 0; i < leadsToSend.length; i++) {
      if (isPaused) {
        // Wait until unpaused
        await new Promise(resolve => {
          const checkPaused = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPaused);
              resolve(true);
            }
          }, 100);
        });
      }

      const lead = leadsToSend[i];
      
      // Mark as sending
      setEmailStatuses(prev => ({ ...prev, [lead.id]: 'sending' }));

      try {
        // Actually send the email via API
        await sendBulkEmails({
          leads: [{
            email: lead.email!,
            business_name: lead.name,
            contact_name: '',
            website: lead.website || '',
            phone: lead.phone || '',
          }],
          custom_subject: selectedTemplate.subject,
          custom_body: selectedTemplate.body || selectedTemplate.body_html,
          template_id: typeof selectedTemplate.id === 'number' ? selectedTemplate.id : undefined,
        });

        // Mark as sent
        setEmailStatuses(prev => ({ ...prev, [lead.id]: 'sent' }));
        setSentCount(prev => prev + 1);
      } catch (error) {
        // Mark as failed
        setEmailStatuses(prev => ({ ...prev, [lead.id]: 'failed' }));
        console.error('Failed to send email to:', lead.email, error);
      }

      // Delay between emails for drip effect
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    setIsSending(false);
    setSendingComplete(true);
    toast.success(`Campaign complete! ${sentCount + 1} emails sent.`);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Resuming campaign...' : 'Campaign paused');
  };

  const progress = leadsWithEmail.length > 0 ? (sentCount / leadsWithEmail.length) * 100 : 0;
  const pendingCount = leadsWithEmail.length - sentCount;

  // Get leads with email for the queue display
  const leadsWithEmailData = leads.filter(l => l.email);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          </Button>
        </div>
        <Badge variant="outline" className="gap-2 text-lg px-4 py-2 bg-primary/10 border-primary/30">
          <Mail className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">{leadsWithEmail.length}</span> leads ready
        </Badge>
      </div>

      {/* Main Title */}
      <div className="text-center py-4 bg-gradient-card rounded-2xl border-2 border-primary/20">
        <div className="text-5xl mb-2">📧</div>
        <h1 className="text-2xl md:text-3xl font-bold">STEP 3: Email Outreach</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sendingComplete ? 'Campaign Complete!' : isSending ? 'Sending in progress...' : 'Configure and launch your email campaign'}
        </p>
      </div>

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border-2 border-border max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Choose Email Template</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowTemplateGallery(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ScrollArea className="h-[70vh] p-4">
              <HighConvertingTemplateGallery 
                onSelectTemplate={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
              />
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Main Content - Mailbox Centered Layout */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Setup Bar - Minimal config strip at top */}
          <div className="p-4 bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* SMTP Status */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${smtpConfigured ? 'bg-success/20' : 'bg-warning/20'}`}>
                  {smtpConfigured ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-warning" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{smtpConfigured ? 'SMTP Connected' : 'SMTP Required'}</p>
                  <p className="text-xs text-muted-foreground">
                    {smtpConfigured ? 'Ready to send' : 'Configure in settings'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onOpenSettings} className="gap-1">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>

              {/* Template Selection */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedTemplate ? 'bg-success/20' : 'bg-muted'}`}>
                  {selectedTemplate ? <CheckCircle2 className="w-5 h-5 text-success" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate max-w-[200px]">
                    {selectedTemplate ? selectedTemplate.name : 'No Template'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate ? selectedTemplate.category || 'Email Template' : 'Choose a template'}
                  </p>
                </div>
                <Button 
                  variant={selectedTemplate ? 'outline' : 'default'} 
                  size="sm" 
                  onClick={() => setShowTemplateGallery(true)}
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {selectedTemplate ? 'Change' : 'Choose Template'}
                </Button>
              </div>
            </div>
          </div>

          {/* LIVE MAILBOX - The Main Focus */}
          <div className="p-6">
            {/* Mailbox Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">📬 Live Mailbox</h2>
                  <p className="text-sm text-muted-foreground">
                    {isSending ? 'Sending emails in real-time...' : sendingComplete ? 'All emails delivered!' : 'Your outgoing email queue'}
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              {isSending && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                  LIVE
                </Badge>
              )}
              {sendingComplete && (
                <Badge className="bg-success/20 text-success border-success/30 gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            {(isSending || sendingComplete) && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-bold">{sentCount} / {leadsWithEmail.length} sent</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            )}

            {/* Email Queue - Main Visual */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Queue
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {Object.values(emailStatuses).filter(s => s === 'sent').length} Sent
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {pendingCount} Pending
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="h-64">
                <div className="p-3 space-y-2">
                  {leadsWithEmailData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No leads with email addresses</p>
                    </div>
                  ) : (
                    leadsWithEmailData.map((lead, idx) => {
                      const status = emailStatuses[lead.id] || 'pending';
                      return (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            status === 'sending' 
                              ? 'bg-primary/20 border border-primary/50 animate-pulse' 
                              : status === 'sent'
                                ? 'bg-green-500/10 border border-green-500/30'
                                : status === 'failed'
                                  ? 'bg-red-500/10 border border-red-500/30'
                                  : 'bg-white/5 border border-transparent hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            status === 'sending'
                              ? 'bg-primary/30 text-primary'
                              : status === 'sent'
                                ? 'bg-green-500/30 text-green-400'
                                : status === 'failed'
                                  ? 'bg-red-500/30 text-red-400'
                                  : 'bg-white/10 text-muted-foreground'
                          }`}>
                            {status === 'sent' ? <CheckCircle2 className="w-5 h-5" /> : 
                             status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                             status === 'failed' ? <X className="w-5 h-5" /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lead.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                          </div>
                          <Badge className={`text-xs shrink-0 ${
                            status === 'sending'
                              ? 'bg-primary/30 text-primary border-primary/50'
                              : status === 'sent'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : status === 'failed'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-white/10 text-muted-foreground border-white/20'
                          }`}>
                            {status === 'sending' ? '📤 Sending...' : 
                             status === 'sent' ? '✅ Sent' : 
                             status === 'failed' ? '❌ Failed' : '⏳ Queued'}
                          </Badge>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Analytics - Only show after sending complete */}
            {sendingComplete && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  📈 Campaign Analytics
                </h3>
                <CampaignAnalyticsDashboard />
              </div>
            )}
          </div>

          {/* Footer Action Bar - Send Button at Bottom Right */}
          <div className="p-4 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between">
              {/* Left side - Secondary actions */}
              <div className="flex items-center gap-2">
                {leadsWithPhone.length > 0 && (
                  <Button variant="outline" onClick={onComplete} className="gap-2">
                    <Phone className="w-4 h-4" />
                    Continue to Calls ({leadsWithPhone.length})
                  </Button>
                )}
              </div>

              {/* Right side - Primary Send Action */}
              <div className="flex items-center gap-3">
                {isSending && (
                  <Button 
                    variant="outline" 
                    onClick={handlePauseResume}
                    className="gap-2"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                
                {!sendingComplete && (
                  <Button 
                    onClick={handleSendEmails}
                    disabled={isSending || !selectedTemplate || !smtpConfigured || leadsWithEmail.length === 0}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 min-w-[180px]"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending... ({sentCount}/{leadsWithEmail.length})
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send {leadsWithEmail.length} Emails
                      </>
                    )}
                  </Button>
                )}

                {sendingComplete && (
                  <Button 
                    onClick={onComplete}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Continue to Outreach Hub
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
