import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Mail, Play, Pause, Send, Eye, Upload, Bell, Clock,
  CheckCircle2, Loader2, Users, BarChart3, Settings,
  ChevronRight, Zap, TrendingUp, ArrowRight, ArrowUp, Rocket,
  AlertCircle, FileText, RefreshCw, ExternalLink, Image, Inbox
} from 'lucide-react';
import { sendSingleEmail, isSMTPConfigured, getSentEmails } from '@/lib/emailService';
import { getUserLogoFromStorage } from '@/hooks/useUserBranding';

// Real sent email from backend
interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  business_name?: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
}

// Email queue item
interface QueuedEmail {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  subject: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  sentAt?: string;
  openedAt?: string;
  category?: 'hot' | 'warm' | 'cold';
  verified?: boolean;
}

// Lead from Step 2
interface Lead {
  id?: string | number;
  title?: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  category?: string;
  score?: number;
  verified?: boolean;
}

// Demo leads for simulation
const DEMO_LEADS: QueuedEmail[] = [
  { id: '1', businessName: 'Acme Plumbing Co', contactName: 'John Miller', email: 'john@acmeplumbing.com', subject: 'Grow Your Plumbing Business with Us', status: 'sent', sentAt: new Date(Date.now() - 120000).toISOString(), category: 'hot', verified: true },
  { id: '2', businessName: 'Green Leaf Landscaping', contactName: 'Sarah Chen', email: 'sarah@greenleaf.com', subject: 'Marketing Solutions for Landscapers', status: 'sent', sentAt: new Date(Date.now() - 60000).toISOString(), category: 'hot', verified: true },
  { id: '3', businessName: 'City Auto Repair', contactName: 'Mike Thompson', email: 'mike@cityauto.com', subject: 'Get More Customers for Your Auto Shop', status: 'sending', category: 'warm', verified: true },
  { id: '4', businessName: 'Budget Flooring', contactName: 'Linda Martinez', email: 'linda@budgetflooring.com', subject: 'Lead Generation for Flooring Businesses', status: 'pending', category: 'warm', verified: false },
  { id: '5', businessName: 'Quick Print Shop', contactName: 'David Kim', email: 'david@quickprint.com', subject: 'Digital Marketing for Print Shops', status: 'pending', category: 'cold', verified: false },
  { id: '6', businessName: 'Coastal Realty', contactName: 'Jennifer Adams', email: 'jennifer@coastalrealty.com', subject: 'Real Estate Lead Generation', status: 'pending', category: 'hot', verified: true },
  { id: '7', businessName: 'Mountain View HVAC', contactName: 'Robert Taylor', email: 'robert@mvhvac.com', subject: 'HVAC Business Growth Strategies', status: 'pending', category: 'warm', verified: false },
  { id: '8', businessName: 'Sunrise Bakery', contactName: 'Emily Brown', email: 'emily@sunrisebakery.com', subject: 'Local Marketing for Bakeries', status: 'pending', category: 'cold', verified: false },
  { id: '9', businessName: 'Premier Dental Care', contactName: 'Dr. James Wilson', email: 'james@premierdental.com', subject: 'Patient Acquisition Solutions', status: 'pending', category: 'hot', verified: true },
  { id: '10', businessName: 'Tech Solutions Pro', contactName: 'Amanda Lee', email: 'amanda@techsolpro.com', subject: 'IT Services Marketing', status: 'pending', category: 'cold', verified: false },
];

type ViewMode = 'mailbox' | 'preview' | 'crm' | 'ab' | 'smtp' | 'inbox';

// Email template type
interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body?: string;
  html?: string;
  category?: string;
}

interface LiveDripMailboxProps {
  onSwitchToFullMailbox?: () => void;
  leads?: Lead[];
  verifiedLeads?: Lead[];
  selectedTemplate?: EmailTemplate | null;
}

export default function LiveDripMailbox({ onSwitchToFullMailbox, leads = [], verifiedLeads = [], selectedTemplate }: LiveDripMailboxProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mailbox');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [emailQueue, setEmailQueue] = useState<QueuedEmail[]>(DEMO_LEADS);
  const [sendingSpeed, setSendingSpeed] = useState(50); // emails per hour
  const [showPreviewMode, setShowPreviewMode] = useState(true);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Real sent emails from backend
  const [realSentEmails, setRealSentEmails] = useState<SentEmail[]>([]);
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lead category filters
  const [sendHot, setSendHot] = useState(true);
  const [sendWarm, setSendWarm] = useState(true);
  const [sendCold, setSendCold] = useState(false);
  
  // Template assignments per category
  const [hotTemplate, setHotTemplate] = useState<EmailTemplate | null>(null);
  const [warmTemplate, setWarmTemplate] = useState<EmailTemplate | null>(null);
  const [coldTemplate, setColdTemplate] = useState<EmailTemplate | null>(null);
  
  // Default templates for each category
  const defaultTemplates: EmailTemplate[] = [
    { id: 'aggressive', name: 'Aggressive Pitch', subject: 'Quick question about {{business}}', category: 'hot' },
    { id: 'friendly', name: 'Friendly Intro', subject: 'Helping {{business}} grow online', category: 'warm' },
    { id: 'educational', name: 'Educational Value', subject: 'Free tips for {{business}}', category: 'cold' },
    { id: 'followup', name: 'Follow-Up', subject: 'Following up on my last email', category: 'all' },
  ];
  
  // Auto-assign selected template from Step 2 to all categories
  useEffect(() => {
    if (selectedTemplate) {
      if (!hotTemplate) setHotTemplate(selectedTemplate);
      if (!warmTemplate) setWarmTemplate(selectedTemplate);
      if (!coldTemplate) setColdTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);
  
  // Computed stats
  const sentCount = emailQueue.filter(e => e.status === 'sent').length;
  const pendingCount = emailQueue.filter(e => e.status === 'pending').length;
  const sendingEmail = emailQueue.find(e => e.status === 'sending');
  const progress = (sentCount / emailQueue.length) * 100;
  const timeBetweenEmails = Math.round((60 / sendingSpeed) * 60); // seconds
  
  // Category counts
  const hotLeads = emailQueue.filter(e => e.category === 'hot');
  const warmLeads = emailQueue.filter(e => e.category === 'warm');
  const coldLeads = emailQueue.filter(e => e.category === 'cold');
  const verifiedInQueue = emailQueue.filter(e => e.verified);
  
  // Calculate total emails to send based on filters
  const totalToSend = emailQueue.filter(e => {
    if (e.status === 'sent' || e.status === 'sending') return true;
    if (e.category === 'hot' && sendHot) return true;
    if (e.category === 'warm' && sendWarm) return true;
    if (e.category === 'cold' && sendCold) return true;
    return false;
  }).length;

  // Fetch real sent emails from backend
  const fetchSentEmails = useCallback(async () => {
    setIsLoadingSent(true);
    try {
      const emails = await getSentEmails(50, 0);
      if (Array.isArray(emails)) {
        setRealSentEmails(emails);
      }
    } catch (error) {
      console.error('Failed to fetch sent emails:', error);
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  // Initial fetch and polling for real sent emails
  useEffect(() => {
    fetchSentEmails();
    
    // Poll every 5 seconds when sending is active
    pollingRef.current = setInterval(() => {
      fetchSentEmails();
    }, 5000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchSentEmails]);

  // Convert incoming leads to email queue format
  useEffect(() => {
    if (leads.length > 0) {
      const convertedLeads: QueuedEmail[] = leads.map((lead, idx) => {
        // Determine category based on score or position
        let category: 'hot' | 'warm' | 'cold' = 'cold';
        const score = lead.score || 0;
        if (score >= 80 || idx < Math.ceil(leads.length * 0.2)) {
          category = 'hot';
        } else if (score >= 50 || idx < Math.ceil(leads.length * 0.5)) {
          category = 'warm';
        }
        
        // Check if this lead was verified
        const isVerified = verifiedLeads.some(
          v => String(v.id) === String(lead.id) || v.name === lead.name
        );
        
        return {
          id: String(lead.id || idx + 1),
          businessName: lead.title || lead.name || 'Unknown Business',
          contactName: lead.name?.split(' ')[0] || 'Business Owner',
          email: lead.email || `contact@${(lead.website || 'example.com').replace(/^https?:\/\//, '').split('/')[0]}`,
          subject: `Partnership Opportunity for ${lead.title || lead.name || 'Your Business'}`,
          status: 'pending' as const,
          category,
          verified: isVerified,
        };
      });
      
      setEmailQueue(convertedLeads);
    }
  }, [leads, verifiedLeads]);


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error('Logo must be under 500KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const branding = JSON.parse(localStorage.getItem('bamlead_user_branding') || '{}');
        branding.logo_url = reader.result;
        localStorage.setItem('bamlead_user_branding', JSON.stringify(branding));
        toast.success('Logo uploaded! Will appear on all outgoing emails.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate sending process
  useEffect(() => {
    if (isLiveMode && !isPaused) {
      const intervalMs = (60 / sendingSpeed) * 60 * 1000; // Convert to milliseconds
      
      sendIntervalRef.current = setInterval(() => {
        setEmailQueue(prev => {
          const newQueue = [...prev];
          
          // Find currently sending email and mark as sent
          const sendingIndex = newQueue.findIndex(e => e.status === 'sending');
          if (sendingIndex !== -1) {
            newQueue[sendingIndex] = {
              ...newQueue[sendingIndex],
              status: 'sent',
              sentAt: new Date().toISOString()
            };
            
            // Simulate real sending
            if (isSMTPConfigured()) {
              const email = newQueue[sendingIndex];
              sendSingleEmail({
                to: email.email,
                subject: email.subject,
                bodyHtml: `<p>Hi ${email.contactName.split(' ')[0]},</p><p>This is an automated outreach email from BamLead.</p>`,
                bodyText: `Hi ${email.contactName.split(' ')[0]}, This is an automated outreach email.`
              }).catch(console.error);
            }
          }
          
          // Find next pending email and start sending
          const nextPendingIndex = newQueue.findIndex(e => e.status === 'pending');
          if (nextPendingIndex !== -1) {
            newQueue[nextPendingIndex] = {
              ...newQueue[nextPendingIndex],
              status: 'sending'
            };
          } else {
            // All done
            setIsLiveMode(false);
            toast.success('🎉 Campaign complete! All emails sent.');
          }
          
          return newQueue;
        });
      }, intervalMs);
      
      return () => {
        if (sendIntervalRef.current) {
          clearInterval(sendIntervalRef.current);
        }
      };
    }
  }, [isLiveMode, isPaused, sendingSpeed]);

  const startCampaign = () => {
    if (!isSMTPConfigured()) {
      toast.error('Please configure SMTP settings first', {
        action: {
          label: 'Configure',
          onClick: () => setViewMode('smtp')
        }
      });
      return;
    }
    
    setIsLiveMode(true);
    setIsPaused(false);
    setShowPreviewMode(false);
    
    // Start first email
    setEmailQueue(prev => {
      const newQueue = [...prev];
      const firstPending = newQueue.findIndex(e => e.status === 'pending');
      if (firstPending !== -1) {
        newQueue[firstPending].status = 'sending';
      }
      return newQueue;
    });
    
    toast.success('🚀 Campaign started! Emails are being sent.');
  };

  const pauseCampaign = () => {
    setIsPaused(true);
    toast.info('Campaign paused');
  };

  const resumeCampaign = () => {
    setIsPaused(false);
    toast.success('Campaign resumed');
  };

  const resetCampaign = () => {
    setIsLiveMode(false);
    setIsPaused(false);
    setEmailQueue(DEMO_LEADS.map(e => ({ ...e, status: 'pending', sentAt: undefined })));
    toast.info('Campaign reset');
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-emerald-500/20 text-emerald-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'opened': return 'bg-blue-500/20 text-blue-400';
      case 'clicked': return 'bg-violet-500/20 text-violet-400';
      case 'replied': return 'bg-amber-500/20 text-amber-400';
      case 'bounced': return 'bg-red-500/20 text-red-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const tabs = [
    { id: 'mailbox' as ViewMode, label: 'Mailbox', icon: <Mail className="w-4 h-4" /> },
    { id: 'preview' as ViewMode, label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'crm' as ViewMode, label: 'CRM', icon: <Users className="w-4 h-4" /> },
    { id: 'ab' as ViewMode, label: 'A/B', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'smtp' as ViewMode, label: 'SMTP', icon: <Settings className="w-4 h-4" /> },
    { id: 'inbox' as ViewMode, label: 'Sent Box', icon: <Inbox className="w-4 h-4" />, badge: realSentEmails.length },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Mail className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Smart Drip Mailbox</span>
                <Badge className={cn(
                  "text-xs px-2",
                  isLiveMode ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500 text-white"
                )}>
                  {isLiveMode ? 'LIVE' : 'READY'}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">Your unified outreach command center</p>
            </div>
          </div>

          {/* Center: Actions */}
          <div className="flex items-center gap-4">
            {/* Logo Upload */}
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
              <Image className="w-4 h-4 text-slate-400" />
              <span className="text-sm">Upload Business Logo</span>
              <Upload className="w-4 h-4 text-slate-500" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
          </div>

          {/* Right: Live Demo + Notifications */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onSwitchToFullMailbox}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              <Play className="w-4 h-4" /> Live Demo
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-300 gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                viewMode === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 min-w-[20px]">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Help Banner - PROMINENT HERO CTA */}
      <div className="mx-6 mt-4">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-xl p-5 shadow-lg shadow-emerald-500/30 border border-emerald-400/40">
          {/* Animated background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          
          <div className="relative flex items-center gap-4">
            {/* Large animated icon */}
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce shadow-lg">
              <span className="text-3xl">👆</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                🎯 Your Next Step: Choose a Tab Above!
              </h3>
              <p className="text-white/90 text-sm">
                Click <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Preview</span> to see your emails, 
                <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">CRM</span> to export leads, 
                or <span className="font-bold bg-white/20 px-2 py-0.5 rounded ml-1">SMTP</span> to configure sending.
              </p>
            </div>
            
            {/* Arrow pointing up */}
            <div className="hidden md:flex flex-col items-center animate-bounce">
              <ArrowUp className="w-8 h-8 text-white" />
              <span className="text-xs text-white/80 font-medium">CLICK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Mode Banner */}
      {showPreviewMode && (
        <div className="mx-6 mt-4">
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Eye className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">PREVIEW MODE</span>
                <Badge className="bg-amber-500 text-white text-xs">Demo Only</Badge>
              </div>
              <p className="text-sm text-slate-300">
                This is a <span className="text-cyan-400 font-semibold">simulation</span> showing how your emails will be sent. <span className="text-amber-400 font-semibold">No emails are being sent yet.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Autopilot Campaign Button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={startCampaign}
          disabled={isLiveMode}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg gap-3 shadow-lg shadow-emerald-500/20"
        >
          <Rocket className="w-5 h-5" />
          AI Autopilot Campaign
        </Button>
      </div>

      {/* Sent Box View - Real Emails from Backend */}
      {viewMode === 'inbox' ? (
        <div className="mx-6 mt-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Sent Box Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Sent Emails</h2>
                  <p className="text-sm text-slate-400">
                    {realSentEmails.length} emails sent • Updates every 5 seconds
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchSentEmails}
                  className="border-slate-600 text-slate-300 gap-2"
                  disabled={isLoadingSent}
                >
                  <RefreshCw className={cn("w-4 h-4", isLoadingSent && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Sent Email List */}
            <ScrollArea className="h-[600px]">
              {isLoadingSent && realSentEmails.length === 0 ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-10 h-10 text-slate-500 mx-auto animate-spin mb-4" />
                  <p className="text-slate-400">Loading sent emails...</p>
                </div>
              ) : realSentEmails.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Emails Sent Yet</h3>
                  <p className="text-slate-500 mb-4">Once you send emails, they will appear here in real-time.</p>
                  <Button onClick={() => setViewMode('mailbox')} className="bg-emerald-500 hover:bg-emerald-600">
                    <Send className="w-4 h-4 mr-2" />
                    Go Send Some Emails
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {realSentEmails.map((email, idx) => (
                    <motion.div
                      key={email.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-6 py-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          email.status === 'sent' || email.status === 'delivered' ? "bg-emerald-500/20" : 
                          email.status === 'opened' || email.status === 'clicked' ? "bg-blue-500/20" :
                          email.status === 'failed' || email.status === 'bounced' ? "bg-red-500/20" :
                          "bg-slate-700"
                        )}>
                          {email.status === 'sent' || email.status === 'delivered' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : email.status === 'opened' ? (
                            <Eye className="w-5 h-5 text-blue-400" />
                          ) : email.status === 'clicked' ? (
                            <ExternalLink className="w-5 h-5 text-violet-400" />
                          ) : email.status === 'failed' || email.status === 'bounced' ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <Mail className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        {/* Email Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white truncate">
                              {email.business_name || email.recipient_name || 'Unknown Recipient'}
                            </span>
                            <Badge className={cn("text-[10px] capitalize", getStatusColor(email.status))}>
                              {email.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 truncate mb-1">{email.subject}</p>
                          <p className="text-xs text-slate-500">
                            To: {email.recipient_email}
                          </p>
                        </div>

                        {/* Timestamp */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-500">
                            {email.sent_at ? new Date(email.sent_at).toLocaleDateString() : 'Pending'}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {email.sent_at ? new Date(email.sent_at).toLocaleTimeString() : ''}
                          </p>
                          {email.opened_at && (
                            <p className="text-[10px] text-blue-400 mt-1">
                              Opened {new Date(email.opened_at).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Stats Footer */}
            {realSentEmails.length > 0 && (
              <div className="bg-slate-800 px-6 py-4 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-400">Sent:</span>
                      <span className="text-emerald-400 font-semibold">
                        {realSentEmails.filter(e => e.status === 'sent' || e.status === 'delivered').length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-slate-400">Opened:</span>
                      <span className="text-blue-400 font-semibold">
                        {realSentEmails.filter(e => e.status === 'opened' || e.status === 'clicked').length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-slate-400">Failed:</span>
                      <span className="text-red-400 font-semibold">
                        {realSentEmails.filter(e => e.status === 'failed' || e.status === 'bounced').length}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      /* Main Drip Campaign Preview */
      <div className="mx-6 mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {/* Campaign Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Send className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Smart Drip Campaign Preview</h2>
                <p className="text-sm text-slate-400">
                  <span className="text-emerald-400 font-semibold">{sendingSpeed} emails/hour</span> • ~{(timeBetweenEmails / 60).toFixed(1)} min between each
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isLiveMode ? (
                isPaused ? (
                  <Button onClick={resumeCampaign} className="bg-emerald-500 hover:bg-emerald-600 gap-2">
                    <Play className="w-4 h-4" /> Resume
                  </Button>
                ) : (
                  <Button onClick={pauseCampaign} variant="destructive" className="gap-2">
                    <Pause className="w-4 h-4" /> Pause
                  </Button>
                )
              ) : (
                <Button onClick={startCampaign} className="bg-emerald-500 hover:bg-emerald-600 gap-2">
                  <Send className="w-4 h-4" /> Send Now
                </Button>
              )}
              <Button variant="outline" onClick={resetCampaign} className="border-slate-700 text-slate-300">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Badge className={cn(
                "text-sm px-3 py-1",
                isLiveMode ? "bg-red-500/20 text-red-400 border border-red-500" : "bg-amber-500/20 text-amber-400 border border-amber-500"
              )}>
                • {isLiveMode ? 'LIVE' : 'PREVIEW'}
              </Badge>
            </div>
          </div>

          {/* Progress Bar with Email Icons */}
          <div className="relative mb-8">
            <div className="flex items-center justify-between mb-2">
              {/* Outbox */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold shadow-lg">
                  {pendingCount + (sendingEmail ? 1 : 0)}
                </div>
                <span className="text-sm font-semibold mt-2">Outbox</span>
                <span className="text-xs text-slate-500">Pending</span>
              </div>

              {/* Progress Track */}
              <div className="flex-1 mx-6 relative">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                
                {/* Animated email icons on track */}
                {sendingEmail && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${progress}%` }}
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50 -ml-5">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                )}
                
                {/* Percentage markers */}
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Delivered */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/30">
                  {sentCount}
                </div>
                <span className="text-sm font-semibold mt-2 text-emerald-400">Delivered</span>
                <span className="text-xs text-slate-500">Sent</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Total Emails</span>
              </div>
              <p className="text-2xl font-bold">{emailQueue.length}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-400">In Progress</span>
              </div>
              <p className="text-2xl font-bold">{sendingEmail ? 1 : 0}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">Delivered</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{sentCount}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                <span className="text-sm text-slate-400">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-violet-400">
                {sentCount > 0 ? '100%' : '—'}
              </p>
            </div>
          </div>

          {/* Email Queue List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-slate-400 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Live Email Queue
            </h3>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {/* Previously Sent */}
                {emailQueue.filter(e => e.status === 'sent').slice(-3).map((email, idx) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4 flex items-center gap-4"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{email.businessName}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Sent</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{email.contactName} • {email.email}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {email.sentAt && new Date(email.sentAt).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
                
                {/* Currently Sending */}
                {sendingEmail && (
                  <motion.div
                    className="bg-amber-900/30 border-2 border-amber-500 rounded-lg p-4 flex items-center gap-4"
                    animate={{ scale: [1, 1.01, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{sendingEmail.businessName}</span>
                        <Badge className="bg-amber-500 text-white text-xs animate-pulse">Sending Now...</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{sendingEmail.contactName} • {sendingEmail.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-400 font-semibold">Currently Sending</p>
                      <p className="text-xs text-slate-500">{sendingEmail.subject}</p>
                    </div>
                  </motion.div>
                )}
                
                {/* Up Next */}
                {emailQueue.filter(e => e.status === 'pending').slice(0, 3).map((email, idx) => (
                  <div
                    key={email.id}
                    className={cn(
                      "bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4",
                      idx === 0 && "border-cyan-500/50 bg-cyan-900/10"
                    )}
                  >
                    <Clock className={cn(
                      "w-5 h-5",
                      idx === 0 ? "text-cyan-400" : "text-slate-500"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{email.businessName}</span>
                        {idx === 0 && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Up Next</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{email.contactName} • {email.email}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {idx === 0 ? `~${Math.round(timeBetweenEmails / 60)} min` : 'Queued'}
                    </span>
                  </div>
                ))}
                
                {/* More pending indicator */}
                {pendingCount > 3 && (
                  <div className="text-center py-3 text-sm text-slate-500">
                    +{pendingCount - 3} more emails in queue
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Leads Summary Section - Bottom of Campaign Preview */}
        <div className="mt-6 space-y-4">
          {/* Total Emails to Send Header */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Emails to Send</p>
                  <p className="text-2xl font-bold text-emerald-400">{totalToSend}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Based on selected categories</p>
                <p className="text-sm text-slate-300">
                  {sendHot && 'Hot'}{sendHot && (sendWarm || sendCold) && ' + '}
                  {sendWarm && 'Warm'}{sendWarm && sendCold && ' + '}
                  {sendCold && 'Cold'}
                  {!sendHot && !sendWarm && !sendCold && <span className="text-amber-400">No categories selected</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Lead Category Toggles with Template Assignment */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-slate-300 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Select Lead Categories & Assign Templates
            </h3>
            
            {/* Selected Template from Step 2 */}
            {selectedTemplate && (
              <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
                  <FileText className="w-3 h-3" />
                  Template from Step 2
                </div>
                <p className="font-medium text-white text-sm">{selectedTemplate.name}</p>
                <p className="text-xs text-slate-400 truncate">{selectedTemplate.subject}</p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              {/* Hot Leads */}
              <div
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  sendHot
                    ? "border-red-500 bg-red-500/10"
                    : "border-slate-700 bg-slate-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-red-500 text-white text-xs">🔥 HOT</Badge>
                  <Switch checked={sendHot} onCheckedChange={setSendHot} />
                </div>
                <p className="text-2xl font-bold text-red-400">{hotLeads.length}</p>
                <p className="text-xs text-slate-500 mb-3">High-intent leads</p>
                
                {/* Template selector */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Template:</p>
                  <select 
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white"
                    value={hotTemplate?.id || selectedTemplate?.id || 'aggressive'}
                    onChange={(e) => {
                      const tmpl = [...defaultTemplates, selectedTemplate].find(t => t?.id === e.target.value);
                      if (tmpl) setHotTemplate(tmpl);
                    }}
                  >
                    {selectedTemplate && (
                      <option value={selectedTemplate.id}>✓ {selectedTemplate.name}</option>
                    )}
                    {defaultTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {hotTemplate && (
                    <p className="text-[10px] text-slate-500 truncate">"{hotTemplate.subject}"</p>
                  )}
                </div>
              </div>

              {/* Warm Leads */}
              <div
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  sendWarm
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-700 bg-slate-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-amber-500 text-white text-xs">🌡️ WARM</Badge>
                  <Switch checked={sendWarm} onCheckedChange={setSendWarm} />
                </div>
                <p className="text-2xl font-bold text-amber-400">{warmLeads.length}</p>
                <p className="text-xs text-slate-500 mb-3">Interested prospects</p>
                
                {/* Template selector */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Template:</p>
                  <select 
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white"
                    value={warmTemplate?.id || selectedTemplate?.id || 'friendly'}
                    onChange={(e) => {
                      const tmpl = [...defaultTemplates, selectedTemplate].find(t => t?.id === e.target.value);
                      if (tmpl) setWarmTemplate(tmpl);
                    }}
                  >
                    {selectedTemplate && (
                      <option value={selectedTemplate.id}>✓ {selectedTemplate.name}</option>
                    )}
                    {defaultTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {warmTemplate && (
                    <p className="text-[10px] text-slate-500 truncate">"{warmTemplate.subject}"</p>
                  )}
                </div>
              </div>

              {/* Cold Leads */}
              <div
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  sendCold
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-blue-500 text-white text-xs">❄️ COLD</Badge>
                  <Switch checked={sendCold} onCheckedChange={setSendCold} />
                </div>
                <p className="text-2xl font-bold text-blue-400">{coldLeads.length}</p>
                <p className="text-xs text-slate-500 mb-3">New prospects</p>
                
                {/* Template selector */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Template:</p>
                  <select 
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white"
                    value={coldTemplate?.id || selectedTemplate?.id || 'educational'}
                    onChange={(e) => {
                      const tmpl = [...defaultTemplates, selectedTemplate].find(t => t?.id === e.target.value);
                      if (tmpl) setColdTemplate(tmpl);
                    }}
                  >
                    {selectedTemplate && (
                      <option value={selectedTemplate.id}>✓ {selectedTemplate.name}</option>
                    )}
                    {defaultTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {coldTemplate && (
                    <p className="text-[10px] text-slate-500 truncate">"{coldTemplate.subject}"</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Verified Leads Summary */}
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300 flex items-center gap-2">
                    AI Verified Leads
                    <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">From Step 2</Badge>
                  </p>
                  <p className="text-xs text-slate-500">
                    Leads verified with enhanced accuracy for better deliverability
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-400">{verifiedInQueue.length}</p>
                <p className="text-xs text-slate-500">verified & ready</p>
              </div>
            </div>
            
            {/* Verified leads breakdown */}
            {verifiedInQueue.length > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-500/20">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-slate-400">Hot:</span>
                    <span className="font-semibold text-red-400">
                      {verifiedInQueue.filter(e => e.category === 'hot').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-400">Warm:</span>
                    <span className="font-semibold text-amber-400">
                      {verifiedInQueue.filter(e => e.category === 'warm').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-400">Cold:</span>
                    <span className="font-semibold text-blue-400">
                      {verifiedInQueue.filter(e => e.category === 'cold').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Total Leads Ready - Full Width Bar */}
          <div className="bg-slate-800 border-2 border-primary/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Total Leads Ready</span>
              <span className="text-3xl font-bold text-emerald-400">{emailQueue.length}</span>
            </div>
            <Progress 
              value={(totalToSend / emailQueue.length) * 100} 
              className="h-2 mt-3 bg-slate-700" 
            />
            <p className="text-xs text-slate-500 mt-2 text-center">
              {totalToSend} of {emailQueue.length} leads selected for sending
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Switch to Full Mailbox */}
      {onSwitchToFullMailbox && (
        <div className="mx-6 mt-6 mb-6">
          <Button
            onClick={onSwitchToFullMailbox}
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 gap-2 py-6"
          >
            <Mail className="w-5 h-5" />
            Switch to Full Mailbox View
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
