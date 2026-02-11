/**
 * Phone Number Setup Modal
 * Shows phone provisioning flow after AI Calling add-on purchase
 * 
 * V1 WORKFLOW:
 * - BamLead provisions phone numbers via Twilio API
 * - Customers don't connect their own numbers in V1
 * - Autopilot: Phone included, auto-provisioned
 * - Basic/Pro + $8/mo add-on: Phone provisioned after purchase
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Phone, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Shield,
  Sparkles,
  Clock,
  Settings
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface PhoneNumberSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function PhoneNumberSetupModal({ 
  open, 
  onOpenChange,
  onComplete 
}: PhoneNumberSetupModalProps) {
  const { 
    requestPhoneProvisioning, 
    phoneSetup, 
    addon,
    purchaseAddon,
    capabilities,
    status
  } = useAICalling();
  const { tier, isAutopilot } = usePlanFeatures();
  const [step, setStep] = useState<'intro' | 'provisioning' | 'success'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Update step based on phoneSetup status
  useEffect(() => {
    if (phoneSetup.isProvisioning) {
      setStep('provisioning');
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);
      return () => clearInterval(interval);
    }
    
    if (phoneSetup.hasPhone && phoneSetup.isVerified) {
      setStep('success');
      setProgress(100);
    }
  }, [phoneSetup]);

  const handleStartProvisioning = async () => {
    setIsLoading(true);
    try {
      const result = await requestPhoneProvisioning();
      if (result.success) {
        setStep('provisioning');
        toast.success('Phone number provisioning started!');
      } else {
        toast.error(result.error || 'Failed to start provisioning');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
    // Reset for next time
    setTimeout(() => {
      setStep('intro');
      setProgress(0);
    }, 300);
  };

  const formatPhoneDisplay = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    if (clean.length === 11 && clean.startsWith('1')) {
      return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Step: Intro - Explain what will happen */}
        {step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                AI Calling Setup
              </DialogTitle>
              <DialogDescription>
                {isAutopilot 
                  ? "Your AI phone number is included with Autopilot. We'll set it up now."
                  : "We'll provision a dedicated AI phone number for your calls."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-foreground">BamLead AI Phone Number</span>
                  {isAutopilot ? (
                    <Badge className="bg-amber-500/20 text-amber-600 gap-1">
                      <Sparkles className="w-3 h-3" />
                      Included
                    </Badge>
                  ) : (
                    <span className="text-xl font-bold text-primary">${AI_CALLING_ADDON_PRICE}/mo</span>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Dedicated US phone number
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Professional AI caller ID
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Provisioned by BamLead team
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Connected to voice infrastructure
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Settings className="w-4 h-4 mt-0.5 text-primary" />
                  <span>
                    A BamLead team member will configure your Voice Agent. 
                    You'll receive an email once your AI phone number is ready.
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={handleStartProvisioning} disabled={isLoading} className="w-full gap-2">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAutopilot ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Activate My Number
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Request Phone Number
                </>
              )}
            </Button>
          </>
        )}

        {/* Step: Provisioning in progress */}
        {step === 'provisioning' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary animate-pulse" />
                Setting Up Your Number
              </DialogTitle>
              <DialogDescription>
                BamLead is configuring your AI phone number...
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Provisioning phone number...</span>
                  <span className="text-foreground font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-3 text-sm">
                <div className={`flex items-center gap-2 ${progress >= 20 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${progress >= 20 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  Connecting to voice service
                </div>
                <div className={`flex items-center gap-2 ${progress >= 40 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${progress >= 40 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  Allocating phone number
                </div>
                <div className={`flex items-center gap-2 ${progress >= 60 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${progress >= 60 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  Configuring AI Voice Agent
                </div>
                <div className={`flex items-center gap-2 ${progress >= 80 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${progress >= 80 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  Loading your call scripts
                </div>
                <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${progress >= 100 ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                  Finalizing setup
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              This usually takes 1-2 minutes. You'll be notified when ready.
            </p>
          </>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                AI Calling Ready!
              </DialogTitle>
              <DialogDescription>
                Your AI phone number is active and ready to make calls.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              {phoneSetup.phoneNumber && (
                <p className="font-mono text-lg text-foreground mb-2">
                  {formatPhoneDisplay(phoneSetup.phoneNumber)}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                AI calling is now enabled. Your scripts are loaded and ready.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-2 text-sm">
                <Shield className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span className="text-muted-foreground">
                  Your AI Voice Agent has been configured based on your search context, 
                  strategy, and email sequences. You can edit scripts anytime.
                </span>
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full gap-2 mt-4">
              Start Making Calls
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
