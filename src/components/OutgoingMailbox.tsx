import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Inbox, CheckCircle2, Clock, AlertCircle,
  Server, Loader2, RefreshCw, ArrowRight, Sparkles,
  MailOpen, MailPlus, ExternalLink, Zap, TrendingUp,
  Upload, Building2, Palette
} from 'lucide-react';
import { EmailSend, EmailStats, getSends, getEmailStats } from '@/lib/api/email';
import { useEmailBranding, EmailBrandingConfig } from './EmailBrandingSettings';
import { saveUserBranding } from '@/lib/api/branding';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OutgoingEmail {
  id: string;
  to: string;
  subject: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  timestamp: string;
  businessName?: string;
}

interface OutgoingMailboxProps {
  smtpConnected?: boolean;
  smtpHost?: string;
  onConfigureClick?: () => void;
}

// Convert API EmailSend to our local OutgoingEmail format
const mapEmailSendToOutgoing = (send: EmailSend): OutgoingEmail => {
  let status: OutgoingEmail['status'] = 'sent';
  if (send.status === 'pending') status = 'queued';
  else if (send.status === 'failed' || send.status === 'bounced') status = 'failed';
  else if (send.status === 'sent' || send.status === 'delivered' || send.status === 'opened' || send.status === 'clicked' || send.status === 'replied') status = 'sent';
  
  return {
    id: send.id.toString(),
    to: send.recipient_email,
    subject: send.subject,
    status,
    timestamp: send.sent_at || send.created_at,
    businessName: send.business_name || send.recipient_name,
  };
};

export default function OutgoingMailbox({ 
  smtpConnected = false, 
  smtpHost = 'Your SMTP Server',
  onConfigureClick 
}: OutgoingMailboxProps) {
  const [emails, setEmails] = useState<OutgoingEmail[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  
  // Branding hook for logo and company info
  const { branding, updateBranding } = useEmailBranding();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    
    setIsUploadingLogo(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      updateBranding({ ...branding, logoUrl: dataUrl, enabled: true });
      
      // Also sync to bamlead_branding_info for proposals/contracts
      const existingBranding = localStorage.getItem('bamlead_branding_info');
      const parsed = existingBranding ? JSON.parse(existingBranding) : {};
      localStorage.setItem('bamlead_branding_info', JSON.stringify({ ...parsed, logoUrl: dataUrl }));
      
      if (isAuthenticated) {
        const saved = await saveUserBranding({ logo_url: dataUrl });
        if (saved) {
          toast.success("Logo saved to your account!");
        } else {
          toast.warning("Logo saved locally, but backend save failed. Check your API and the user_branding table.");
        }
      } else {
        toast.success("Logo uploaded! It will appear in all your emails and documents.");
      }
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };
  
  // Load real email data on mount
  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    setIsLoading(true);
    
    // Use timeout to prevent hanging
    const withTimeout = <T,>(promise: Promise<T>, fallback: T, ms = 5000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
      ]);
    };

    try {
      const [sendsRes, statsRes] = await Promise.all([
        withTimeout(getSends({ limit: 20 }), { success: false, sends: [], total: 0 }),
        withTimeout(getEmailStats(7), { success: false, stats: null }),
      ]);

      if (sendsRes.success && sendsRes.sends && sendsRes.sends.length > 0) {
        setEmails(sendsRes.sends.map(mapEmailSendToOutgoing));
      } else {
        setEmails([]);
      }

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (error) {
      console.error('Failed to load email data:', error);
      setEmails([]);
    }
    
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEmailData();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: OutgoingEmail['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'sending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: OutgoingEmail['status']) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Delivered</Badge>;
      case 'sending':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Sending...</Badge>;
      case 'queued':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">In Queue</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const sentCount = stats?.total_sent || emails.filter(e => e.status === 'sent').length;
  const queuedCount = emails.filter(e => e.status === 'queued' || e.status === 'sending').length;
  const fallbackSent = emails.filter((email) => email.status === 'sent').length;
  const fallbackFailed = emails.filter((email) => email.status === 'failed').length;
  const deliveryRate = stats
    ? Math.round(((stats.total_sent - stats.total_bounced - stats.total_failed) / Math.max(stats.total_sent, 1)) * 100)
    : Math.round((fallbackSent / Math.max(fallbackSent + fallbackFailed, 1)) * 100);

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading your mailbox...</p>
        </Card>
      ) : (
        <>
          {/* Visual Mailbox Header */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <Mail className="w-7 h-7 text-primary-foreground" />
                </div>
                {isAnimating && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >
                    <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Send className="w-2.5 h-2.5 text-white" />
                    </div>
                  </motion.div>
                )}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Your Outgoing Mailbox
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  {smtpConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sending via <strong>{smtpHost}</strong></span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Configure your SMTP to send emails</span>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
            
            {!smtpConnected && onConfigureClick && (
              <Button onClick={onConfigureClick} size="sm" className="gap-2">
                <Server className="w-4 h-4" />
                Configure SMTP
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Your Branding Section */}
        <CardContent className="pt-0 pb-4">
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Logo Display Area */}
                <div className="flex items-center gap-4">
                  {branding.logoUrl ? (
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-xl bg-white border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-sm">
                        <img 
                          src={branding.logoUrl} 
                          alt="Your Logo" 
                          className="max-w-full max-h-full object-contain p-1"
                        />
                      </div>
                      <label className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                      {isUploadingLogo ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-primary mb-1" />
                          <span className="text-[9px] text-primary font-medium">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">
                        {branding.companyName || 'Your Company'}
                      </span>
                      {branding.enabled && branding.logoUrl && (
                        <Badge className="bg-success/20 text-success border-success/40 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Branded
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {branding.logoUrl 
                        ? '✓ Your logo will appear in all outgoing emails & documents' 
                        : 'Upload your logo to brand emails & proposals'}
                    </p>
                  </div>
                </div>
                
                {/* Quick Branding Toggle */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">Auto-Brand Emails</p>
                    <p className="text-[10px] text-muted-foreground">Apply to all outreach</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branding.enabled}
                      onChange={(e) => updateBranding({ ...branding, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>

        {/* Visual Email Flow */}
        <CardContent className="pt-0">
          <div className="flex items-center justify-center gap-2 py-4 px-2 bg-gradient-to-r from-muted/50 via-muted to-muted/50 rounded-lg mb-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-primary/30 flex items-center justify-center">
                <MailPlus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Compose</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-warning/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <span className="text-xs text-muted-foreground">Queue</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            <div className="flex flex-col items-center gap-1 relative">
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-accent/30 flex items-center justify-center">
                <Server className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Your SMTP</span>
              {smtpConnected && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-success/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">Delivered</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-2xl font-bold text-emerald-600">{sentCount}</div>
              <div className="text-xs text-emerald-600/80">Total Sent</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-2xl font-bold text-amber-600">{queuedCount}</div>
              <div className="text-xs text-amber-600/80">In Queue</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-2xl font-bold text-blue-600">{deliveryRate}%</div>
              <div className="text-xs text-blue-600/80">Delivery Rate</div>
            </div>
          </div>

          {/* Sending Progress (when active) */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending emails via your SMTP...
                    </span>
                    <span className="text-sm text-blue-600">{sendProgress}%</span>
                  </div>
                  <Progress value={sendProgress} className="h-2" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Email Queue / Outbox */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4" />
              Outgoing Emails
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-xs"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              <AnimatePresence>
                {emails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border transition-all ${
                      email.status === 'sending' 
                        ? 'bg-blue-500/5 border-blue-500/20' 
                        : email.status === 'sent'
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5">
                          {getStatusIcon(email.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {email.businessName || email.to}
                            </span>
                            {getStatusBadge(email.status)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {email.subject}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            To: {email.to}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(email.timestamp)}
                      </span>
                    </div>
                    
                    {email.status === 'sending' && (
                      <div className="mt-2">
                        <Progress value={65} className="h-1" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {emails.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MailOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No outgoing emails yet</p>
                  <p className="text-sm">Emails you send will appear here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* SMTP Info Banner */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Your Emails, Your Control</h4>
            <p className="text-xs text-muted-foreground mt-1">
              All emails are sent directly through <strong>your own SMTP server</strong>. 
              This means better deliverability, your branding, and full control over your outreach.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Better deliverability
              </span>
              <span className="text-xs flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Your domain reputation
              </span>
              <span className="text-xs flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Full control
              </span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
