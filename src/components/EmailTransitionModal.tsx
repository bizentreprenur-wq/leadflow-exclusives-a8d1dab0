import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, ArrowRight, Server, CheckCircle2, 
  AlertCircle, Sparkles, Users, FileText, Settings
} from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
}

interface EmailTransitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: SearchResult[];
  onContinueToEmail: () => void;
  onConfigureSmtp: () => void;
}

export default function EmailTransitionModal({
  open,
  onOpenChange,
  selectedLeads,
  onContinueToEmail,
  onConfigureSmtp,
}: EmailTransitionModalProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check SMTP configuration
  const smtpConfig = JSON.parse(localStorage.getItem('smtp_config') || '{}');
  const isSmtpConfigured = smtpConfig.username && smtpConfig.password;

  // Calculate lead stats
  const hotLeads = selectedLeads.filter(l => l.aiClassification === 'hot').length;
  const warmLeads = selectedLeads.filter(l => l.aiClassification === 'warm').length;
  const leadsWithEmail = selectedLeads.filter(l => l.email).length;
  const leadsWithPhone = selectedLeads.filter(l => l.phone).length;

  const handleContinue = () => {
    setIsTransitioning(true);
    setProgress(0);
    
    // Animate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onContinueToEmail();
            setIsTransitioning(false);
            setProgress(0);
          }, 200);
          return 100;
        }
        return prev + 20;
      });
    }, 100);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsTransitioning(false);
      setProgress(0);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
            Ready to Send Outreach!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            You've selected {selectedLeads.length} leads for email outreach
          </DialogDescription>
        </DialogHeader>

        {isTransitioning ? (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium">Preparing your outreach...</p>
              <p className="text-sm text-muted-foreground">Loading templates and settings</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Lead Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  Selected Leads
                </div>
                <p className="text-2xl font-bold">{selectedLeads.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Mail className="w-4 h-4" />
                  With Email
                </div>
                <p className="text-2xl font-bold">{leadsWithEmail}</p>
              </div>
            </div>

            {/* Lead Classification Breakdown */}
            {(hotLeads > 0 || warmLeads > 0) && (
              <div className="flex flex-wrap gap-2">
                {hotLeads > 0 && (
                  <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
                    🔥 {hotLeads} Hot Leads
                  </Badge>
                )}
                {warmLeads > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                    🌡️ {warmLeads} Warm Leads
                  </Badge>
                )}
                {leadsWithPhone > 0 && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    📞 {leadsWithPhone} Have Phone
                  </Badge>
                )}
              </div>
            )}

            {/* SMTP Status */}
            <div className={`p-4 rounded-lg border-2 ${
              isSmtpConfigured 
                ? 'border-emerald-500/30 bg-emerald-500/5' 
                : 'border-amber-500/30 bg-amber-500/5'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSmtpConfigured ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}>
                  {isSmtpConfigured ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {isSmtpConfigured ? 'SMTP Ready!' : 'SMTP Not Configured'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isSmtpConfigured 
                      ? `Connected to ${smtpConfig.host || 'your email server'}` 
                      : 'You\'ll need to set up SMTP in the next step to send emails'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">What happens next:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                  <span>Choose from 60+ high-converting email templates</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                  <span>Customize your message with AI assistance</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                  <span>Send instantly, schedule, or set up drip campaigns</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={handleContinue}
                size="lg"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-5 h-5" />
                Continue to Email Outreach
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              {!isSmtpConfigured && (
                <Button 
                  onClick={onConfigureSmtp}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Configure SMTP First
                </Button>
              )}
            </div>

            {/* Reassurance */}
            <p className="text-xs text-center text-muted-foreground">
              ✨ Your {selectedLeads.length} leads will be saved and ready in Step 3
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
