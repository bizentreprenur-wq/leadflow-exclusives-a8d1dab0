import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Brain, ArrowRight, Printer, Download, Users, Sparkles } from 'lucide-react';

interface LeadDecisionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadCount: number;
  onChooseEmail: () => void;
  onChooseCall: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onJustView: () => void;
}

export default function LeadDecisionPopup({
  open,
  onOpenChange,
  leadCount,
  onChooseEmail,
  onChooseCall,
  onPrint,
  onDownload,
  onJustView,
}: LeadDecisionPopupProps) {
  const [showAIReminder, setShowAIReminder] = useState(false);
  const [pendingAction, setPendingAction] = useState<'email' | 'call' | null>(null);

  const handleEmailClick = () => {
    setPendingAction('email');
    setShowAIReminder(true);
  };

  const handleCallClick = () => {
    setPendingAction('call');
    setShowAIReminder(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction === 'email') {
      onChooseEmail();
    } else if (pendingAction === 'call') {
      onChooseCall();
    }
    setShowAIReminder(false);
    setPendingAction(null);
    onOpenChange(false);
  };

  const handleSkipAI = () => {
    if (pendingAction === 'email') {
      onChooseEmail();
    } else if (pendingAction === 'call') {
      onChooseCall();
    }
    onOpenChange(false);
  };

  if (showAIReminder) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-amber-600" />
              </div>
              Wait! AI Verify First?
            </DialogTitle>
            <DialogDescription>Recommendation before proceeding with your action</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Recommendation */}
            <div className="p-4 bg-amber-500/10 rounded-xl border-2 border-amber-500/30">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-700 mb-1">
                    🎯 Recommended: AI Verify First!
                  </p>
                  <p className="text-sm text-amber-600">
                    AI Verification confirms emails are valid and phone numbers work. 
                    This prevents bounced emails and wasted calls!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid gap-3">
              <Button
                onClick={handleConfirmAction}
                size="lg"
                className="w-full gap-3 bg-amber-500 hover:bg-amber-600 text-white h-14"
              >
                <Brain className="w-5 h-5" />
                Yes, AI Verify First (Recommended)
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleSkipAI}
                variant="outline"
                size="lg"
                className="w-full gap-3 h-12"
              >
                Skip Verification & Continue to {pendingAction === 'email' ? 'Email' : 'Calls'}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              💡 AI Verification uses credits but significantly improves response rates
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">🎉 Found {leadCount} Leads!</p>
              <p className="text-sm font-normal text-muted-foreground">
                What would you like to do with them?
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">Choose an action for your leads</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Main Action Buttons - Big and Clear */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Email Option */}
            <button
              onClick={handleEmailClick}
              className="group p-6 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 mb-1">
                    STEP 3
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">📧 Email Them</h3>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Set up your SMTP, choose a template, and send professional email campaigns
              </p>
              <div className="flex items-center gap-2 text-blue-500 font-semibold group-hover:gap-3 transition-all">
                Continue to Email Setup <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Call Option */}
            <button
              onClick={handleCallClick}
              className="group p-6 rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:border-green-500 hover:shadow-xl hover:shadow-green-500/10 transition-all text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 mb-1">
                    STEP 4
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">📞 Call Them</h3>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Use AI voice agents or manual dialing to reach out directly by phone
              </p>
              <div className="flex items-center gap-2 text-green-500 font-semibold group-hover:gap-3 transition-all">
                Continue to Call Setup <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onPrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Leads
            </Button>
            <Button variant="outline" onClick={onDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
            <Button variant="ghost" onClick={onJustView} className="gap-2 text-muted-foreground">
              Just View the Spreadsheet
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            💡 <strong>Tip:</strong> You can always switch between Email and Calls later from the spreadsheet view
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
