import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, FileText, Send, 
  CheckCircle2, Mail, Loader2, Settings, Phone,
  Eye, Home, Play, Pause, AlertCircle, X, BarChart3,
  Clock, Zap, TrendingUp, Info
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    const saved = localStorage.getItem('bamlead_selected_template');
    return saved ? JSON.parse(saved) : null;
  });
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
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
  
  // Flying email animations
  const [flyingEmails, setFlyingEmails] = useState<number[]>([]);
  const [emailId, setEmailId] = useState(0);
  
  // Campaign settings
  const emailsPerHour = 50;

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
  const leadsWithEmailData = leads.filter(l => l.email);

  // Calculate progress and ETA
  const progress = leadsWithEmail.length > 0 ? (sentCount / leadsWithEmail.length) * 100 : 0;
  const pendingCount = leadsWithEmail.length - sentCount;
  const etaMinutes = Math.ceil(pendingCount / emailsPerHour * 60);
  const etaHours = Math.floor(etaMinutes / 60);
  const etaRemainingMins = etaMinutes % 60;

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

  // Flying email animation
  useEffect(() => {
    if (!isSending) return;

    const interval = setInterval(() => {
      setEmailId(prev => prev + 1);
      setFlyingEmails(prev => [...prev, emailId]);
      
      setTimeout(() => {
        setFlyingEmails(prev => prev.filter(id => id !== emailId));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [isSending, emailId]);

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
    setSentCount(0);
    setSendingComplete(false);

    const leadsToSend = leads.filter(l => l.email);
    
    for (let i = 0; i < leadsToSend.length; i++) {
      if (isPaused) {
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
      setEmailStatuses(prev => ({ ...prev, [lead.id]: 'sending' }));

      try {
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

        setEmailStatuses(prev => ({ ...prev, [lead.id]: 'sent' }));
        setSentCount(prev => prev + 1);
      } catch (error) {
        setEmailStatuses(prev => ({ ...prev, [lead.id]: 'failed' }));
        console.error('Failed to send email to:', lead.email, error);
      }

      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    setIsSending(false);
    setSendingComplete(true);
    toast.success(`Campaign complete! ${leadsToSend.length} emails sent.`);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Resuming campaign...' : 'Campaign paused');
  };

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

      {/* Main Content */}
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

          {/* SMART DRIP CAMPAIGN PREVIEW - The Main Focus */}
          <div className="p-6 space-y-6">
            
            {/* Main Animation Container */}
            <div className="relative bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10" />
              
              {/* Header */}
              <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14">
                    <div className="absolute bottom-0 w-12 h-10 bg-gradient-to-b from-blue-500 to-blue-700 rounded-lg border-2 border-blue-400/60">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-900/60 rounded-full" />
                    </div>
                    <motion.div 
                      className="absolute right-0 top-2 w-2 h-6 bg-destructive rounded-sm origin-bottom"
                      animate={isSending ? { rotate: [0, -45, 0] } : { rotate: 0 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-blue-800" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Smart Drip Campaign Preview</h3>
                    <div className="flex items-center gap-2 text-sm text-blue-300/80">
                      <span className="font-semibold text-primary">{emailsPerHour} emails/hour</span>
                      <span>•</span>
                      <span>~{Math.round(60 / emailsPerHour * 10) / 10} min between each</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="How does drip sending work?"
                  >
                    <Info className="w-4 h-4 text-blue-300" />
                  </button>
                  {isSending && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full border border-primary/30">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-primary">LIVE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Animation Container - Mailbox Style */}
              <div className="relative h-36 mb-6">
                {/* Outbox Mailbox (Left) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 flex flex-col items-center">
                  <motion.div
                    animate={{ scale: isSending ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="relative"
                  >
                    <div className="w-20 h-16 bg-gradient-to-b from-blue-500 to-blue-700 rounded-t-3xl rounded-b-lg border-2 border-blue-400/50 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30">
                      <div className="absolute top-2 w-12 h-1.5 bg-blue-900/70 rounded-full" />
                      <motion.div 
                        className="absolute bottom-0 w-10 h-8 bg-blue-600 border-t-2 border-blue-400/50 rounded-b-md origin-bottom"
                        animate={isSending ? { rotateX: [0, 30, 0] } : { rotateX: 0 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                      <span className="text-2xl font-bold text-white mt-2">{pendingCount}</span>
                    </div>
                    <div className="w-3 h-6 bg-blue-800 mx-auto rounded-b" />
                    <motion.div
                      className="absolute -right-1 top-4 w-1.5 h-4 bg-amber-500 rounded-sm origin-bottom"
                      animate={isSending && pendingCount > 0 ? { rotate: [-45, 0] } : { rotate: 0 }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />
                  </motion.div>
                  <p className="text-sm text-blue-300 font-medium mt-2">Outbox</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>

                {/* Flying Emails Path */}
                <div className="absolute left-28 right-28 top-1/2 -translate-y-1/2">
                  <div className="relative h-3 bg-gradient-to-r from-blue-800/80 via-indigo-800/80 to-green-800/80 rounded-full border border-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-green-400 rounded-full"
                      style={{ width: `${progress}%` }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
                  </div>
                  
                  <div className="flex justify-between mt-3 px-1">
                    {[0, 25, 50, 75, 100].map((marker, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <motion.div
                          className={`w-2 h-2 rounded-full ${progress >= marker ? 'bg-green-400' : 'bg-white/30'}`}
                          animate={{ scale: progress >= marker && isSending ? [1, 1.3, 1] : 1 }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1">{marker}%</span>
                      </div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {flyingEmails.map((id) => (
                      <motion.div
                        key={id}
                        initial={{ x: 0, y: -30, opacity: 0, scale: 0.5 }}
                        animate={{ 
                          x: [0, 60, 120, 180, 240], 
                          y: [-30, -35, -30, -25, -30],
                          opacity: [0, 1, 1, 1, 0],
                          scale: [0.5, 1, 1, 1, 0.5],
                          rotate: [0, 5, 0, -5, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute left-0 top-0"
                      >
                        <div className="w-10 h-7 bg-white rounded-md shadow-lg shadow-primary/40 flex items-center justify-center border border-primary/20">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Inbox Mailbox (Right) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 flex flex-col items-center">
                  <motion.div
                    animate={{ scale: isSending && sentCount > 0 ? [1, 1.05, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="relative"
                  >
                    <div className="w-20 h-16 bg-gradient-to-b from-green-500 to-green-700 rounded-t-3xl rounded-b-lg border-2 border-green-400/50 flex flex-col items-center justify-center shadow-lg shadow-green-500/30">
                      <div className="absolute top-2 w-12 h-1.5 bg-green-900/70 rounded-full" />
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
                        animate={{ scale: sentCount > 0 ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-900" />
                      </motion.div>
                      <span className="text-2xl font-bold text-white mt-2">{sentCount}</span>
                    </div>
                    <div className="w-3 h-6 bg-green-800 mx-auto rounded-b" />
                  </motion.div>
                  <p className="text-sm text-green-300 font-medium mt-2">Delivered</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    <Mail className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-white">{leadsWithEmail.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-white">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-white">{sentCount}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-white">
                    {etaHours > 0 ? `${etaHours}h ${etaRemainingMins}m` : `${etaMinutes}m`}
                  </p>
                  <p className="text-xs text-muted-foreground">ETA</p>
                </div>
              </div>

              {/* Drip Rate Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-muted-foreground">
                  Sending <span className="text-white font-semibold">{emailsPerHour} emails per hour</span>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  1 email every <span className="text-primary font-semibold">{Math.round(60 / emailsPerHour * 10) / 10} minutes</span>
                </span>
              </div>
            </div>

            {/* Explanation Panel */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-5 border border-indigo-500/30">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-indigo-400" />
                      How Drip Sending Works
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">Controlled Sending Speed</p>
                          <p className="text-sm text-muted-foreground">
                            Your emails are sent at <span className="text-primary font-medium">{emailsPerHour} per hour</span> — 
                            that's roughly one email every <span className="text-primary font-medium">{Math.round(60 / emailsPerHour * 10) / 10} minutes</span>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Why Not Send All At Once?</p>
                          <p className="text-sm text-muted-foreground">
                            Sending too many emails too fast triggers spam filters. Drip sending mimics natural human 
                            behavior, keeping your sender reputation high and emails landing in the inbox.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          <span className="text-white font-medium">Pro tip:</span> You can close this page — emails will continue sending in the background!
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campaign Speed Summary */}
            <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Campaign Speed</p>
                    <p className="text-sm text-muted-foreground">Optimized for maximum deliverability</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{emailsPerHour}</p>
                  <p className="text-xs text-muted-foreground">emails/hour</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">{Math.round(60 / emailsPerHour * 10) / 10}</p>
                  <p className="text-xs text-muted-foreground">min between emails</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{emailsPerHour * 24}</p>
                  <p className="text-xs text-muted-foreground">emails/day max</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-success">99%</p>
                  <p className="text-xs text-muted-foreground">inbox rate</p>
                </div>
              </div>
            </div>

            {/* Email Queue List */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Queue
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                    {Object.values(emailStatuses).filter(s => s === 'sent').length} Sent
                  </Badge>
                  <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                    {pendingCount} Pending
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="h-48">
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
                                ? 'bg-success/10 border border-success/30'
                                : status === 'failed'
                                  ? 'bg-destructive/10 border border-destructive/30'
                                  : 'bg-white/5 border border-transparent hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            status === 'sending'
                              ? 'bg-primary/30 text-primary'
                              : status === 'sent'
                                ? 'bg-success/30 text-success'
                                : status === 'failed'
                                  ? 'bg-destructive/30 text-destructive'
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
                                ? 'bg-success/20 text-success border-success/30'
                                : status === 'failed'
                                  ? 'bg-destructive/20 text-destructive border-destructive/30'
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
              <div className="pt-6 border-t border-border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-success" />
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
