/**
 * Phone Number Setup Modal
 * Allows users to add their own phone number or purchase a BamLead number
 * 
 * V1 RULES:
 * - One phone number per customer
 * - Use own number OR purchase BamLead number ($7/month)
 * - Phone verified via API handshake
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Phone, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ShoppingCart,
  Smartphone,
  Shield,
  Sparkles
} from 'lucide-react';
import { useAICalling, PhoneNumberType } from '@/hooks/useAICalling';
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
  const { savePhoneSetup, verifyPhone, capabilities } = useAICalling();
  const { tier, isAutopilot } = usePlanFeatures();
  const [step, setStep] = useState<'choice' | 'own' | 'bamlead' | 'verify' | 'success'>('choice');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<PhoneNumberType | null>(null);

  const handleUseOwnNumber = () => {
    setSelectedType('own');
    setStep('own');
  };

  const handleGetBamLeadNumber = () => {
    setSelectedType('bamlead');
    setStep('bamlead');
  };

  const handleSubmitOwnNumber = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Basic phone validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await savePhoneSetup(phoneNumber, 'own');
      if (result.success) {
        setStep('verify');
      } else {
        toast.error(result.error || 'Failed to save phone number');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseBamLeadNumber = async () => {
    setIsLoading(true);
    // In a real implementation, this would redirect to Stripe checkout
    // For now, simulate the process
    setTimeout(() => {
      setIsLoading(false);
      toast.info('BamLead number provisioning coming soon!');
      // setStep('verify');
    }, 1500);
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const result = await verifyPhone();
      if (result.success) {
        setStep('success');
        toast.success('Phone number verified successfully!');
      } else {
        toast.error(result.error || 'Verification failed');
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
      setStep('choice');
      setPhoneNumber('');
      setSelectedType(null);
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
        {/* Step: Choice */}
        {step === 'choice' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Enable AI Calling
              </DialogTitle>
              <DialogDescription>
                Add a phone number to enable AI outbound calling for your leads.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Option 1: Use Own Number */}
              <button
                onClick={handleUseOwnNumber}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Use My Own Number</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect your existing business phone number
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Free</Badge>
                      <span className="text-xs text-muted-foreground">Requires verification</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                </div>
              </button>

              {/* Option 2: Get BamLead Number */}
              <button
                onClick={handleGetBamLeadNumber}
                className="w-full p-4 rounded-xl border-2 border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      Get a BamLead Number
                      {isAutopilot && (
                        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                          Included
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      We provision a dedicated number for your AI calls
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {isAutopilot ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Free with Autopilot
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">$8/month</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">Instant setup</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* Step: Own Number Input */}
        {step === 'own' && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Your Phone Number</DialogTitle>
              <DialogDescription>
                This number will be used as the caller ID for AI calls.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your number with country code
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 mt-0.5 text-primary" />
                  <span>
                    Your number will be verified via our secure API. Standard carrier rates may apply for verification calls.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('choice')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmitOwnNumber} disabled={isLoading} className="flex-1 gap-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step: BamLead Number Purchase */}
        {step === 'bamlead' && (
          <>
            <DialogHeader>
              <DialogTitle>Get a BamLead Number</DialogTitle>
              <DialogDescription>
                We'll provision a dedicated phone number for your AI calls.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-foreground">BamLead Phone Number</span>
                  {isAutopilot ? (
                    <Badge className="bg-amber-500/20 text-amber-600">Included</Badge>
                  ) : (
                    <span className="text-xl font-bold text-primary">$8/mo</span>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Dedicated US phone number
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Instant activation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Professional caller ID
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Cancel anytime
                  </li>
                </ul>
              </div>

              {!isAutopilot && (
                <p className="text-xs text-center text-muted-foreground">
                  Billing will be added to your monthly subscription
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('choice')} className="flex-1">
                Back
              </Button>
              <Button onClick={handlePurchaseBamLeadNumber} disabled={isLoading} className="flex-1 gap-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isAutopilot ? (
                  <>Activate Number</>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Purchase
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step: Verify */}
        {step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Your Number</DialogTitle>
              <DialogDescription>
                Complete verification to enable AI calling.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <p className="font-mono text-lg text-foreground mb-2">
                  {formatPhoneDisplay(phoneNumber)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Click verify to complete the API handshake
                </p>
              </div>
            </div>

            <Button onClick={handleVerify} disabled={isLoading} className="w-full gap-2">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              Verify & Activate
            </Button>
          </>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                Phone Number Activated!
              </DialogTitle>
              <DialogDescription>
                Your AI calling is now ready to use.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <p className="font-mono text-lg text-foreground mb-2">
                {formatPhoneDisplay(phoneNumber)}
              </p>
              <p className="text-sm text-muted-foreground">
                AI calling is now enabled for your account
              </p>
            </div>

            <Button onClick={handleComplete} className="w-full gap-2">
              Start Making Calls
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
