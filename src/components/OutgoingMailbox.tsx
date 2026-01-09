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
  MailOpen, MailPlus, ExternalLink, Zap, TrendingUp
} from 'lucide-react';

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

export default function OutgoingMailbox({ 
  smtpConnected = false, 
  smtpHost = 'Your SMTP Server',
  onConfigureClick 
}: OutgoingMailboxProps) {
  const [emails, setEmails] = useState<OutgoingEmail[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  
  // Load mock demo emails
  useEffect(() => {
    setEmails([
      {
        id: '1',
        to: 'john@smithplumbing.com',
        subject: 'Grow Your Plumbing Business with BamLead',
        status: 'sent',
        timestamp: '2025-01-09T10:30:00',
        businessName: 'Smith Plumbing Co.'
      },
      {
        id: '2',
        to: 'info@greenlawncare.com',
        subject: 'Special Offer for Green Lawn Care',
        status: 'sent',
        timestamp: '2025-01-09T10:29:00',
        businessName: 'Green Lawn Care'
      },
      {
        id: '3',
        to: 'hello@quickelectric.com',
        subject: 'Partnership Opportunity',
        status: 'sending',
        timestamp: '2025-01-09T10:28:00',
        businessName: 'Quick Electric Services'
      },
      {
        id: '4',
        to: 'contact@luxuryauto.com',
        subject: 'Website Review for Luxury Auto',
        status: 'queued',
        timestamp: '2025-01-09T10:27:00',
        businessName: 'Luxury Auto Detailing'
      },
    ]);
  }, []);

  // Simulate sending animation
  const simulateSending = () => {
    setIsAnimating(true);
    setSendProgress(0);
    
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnimating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sentCount = emails.filter(e => e.status === 'sent').length;
  const queuedCount = emails.filter(e => e.status === 'queued' || e.status === 'sending').length;

  return (
    <div className="space-y-4">
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
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-amber-500/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">Queue</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            <div className="flex flex-col items-center gap-1 relative">
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-blue-500/30 flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Your SMTP</span>
              {smtpConnected && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg bg-background border-2 border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">Delivered</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-2xl font-bold text-emerald-600">{sentCount}</div>
              <div className="text-xs text-emerald-600/80">Sent Today</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-2xl font-bold text-amber-600">{queuedCount}</div>
              <div className="text-xs text-amber-600/80">In Queue</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-2xl font-bold text-blue-600">98%</div>
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
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <RefreshCw className="w-3 h-3" />
              Refresh
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
    </div>
  );
}
