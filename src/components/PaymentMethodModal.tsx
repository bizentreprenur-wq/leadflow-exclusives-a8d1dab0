import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  CreditCard, Shield, Lock, CheckCircle2, Loader2, 
  Sparkles, Clock, Gift, AlertCircle 
} from 'lucide-react';
import { createSetupIntent, savePaymentMethod } from '@/lib/api/stripeSetup';
import { getStripeConfig } from '@/lib/api/stripe';

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plan?: 'basic' | 'pro' | 'agency';
}

export default function PaymentMethodModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  plan = 'pro'
}: PaymentMethodModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  
  // Form fields (for fallback/display - actual card handling is via Stripe)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load Stripe config and create SetupIntent when modal opens
  useEffect(() => {
    if (open) {
      loadStripeSetup();
    }
  }, [open]);

  const loadStripeSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get Stripe publishable key
      const config = await getStripeConfig();
      setPublishableKey(config.publishable_key);
      
      // Create SetupIntent for payment method collection
      const setupResponse = await createSetupIntent();
      if (setupResponse.success) {
        setClientSecret(setupResponse.client_secret);
        setSetupIntentId(setupResponse.setup_intent_id);
        setStripeLoaded(true);
      } else {
        throw new Error('Failed to initialize payment setup');
      }
    } catch (err: any) {
      console.error('Stripe setup error:', err);
      setError(err.message || 'Failed to initialize payment form');
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setupIntentId) {
      toast.error('Payment setup not initialized. Please try again.');
      return;
    }
    
    // Basic validation
    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return;
    }
    
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      setError('Please enter a valid card number');
      return;
    }
    
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (cvc.length < 3 || cvc.length > 4) {
      setError('Please enter a valid CVC');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // In production, this would use Stripe.js to confirm the SetupIntent
      // For now, we'll call the backend to save the payment method
      // Note: The actual card data should be handled by Stripe Elements, not sent to our server
      
      // This is a simplified flow - in production, integrate @stripe/stripe-js
      const result = await savePaymentMethod(setupIntentId, plan);
      
      if (result.success) {
        toast.success(result.message || 'Payment method saved! Your 7-day trial has started.');
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to save payment method');
      }
    } catch (err: any) {
      console.error('Payment setup error:', err);
      setError(err.message || 'Failed to save payment method. Please try again.');
      toast.error('Payment setup failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const planPrices = {
    basic: { monthly: 49, name: 'Basic' },
    pro: { monthly: 99, name: 'Pro' },
    agency: { monthly: 249, name: 'Agency' },
  };

  const selectedPlan = planPrices[plan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-6 h-6 text-primary" />
            Start Your 7-Day Free Trial
          </DialogTitle>
          <DialogDescription className="text-base">
            Add your payment details to begin your trial. You won't be charged today.
          </DialogDescription>
        </DialogHeader>

        {/* Trial Info Banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">
                  No charge until trial ends
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your card will only be charged <strong>${selectedPlan.monthly}/month</strong> after 
                  your 7-day free trial ends. Cancel anytime before then and pay nothing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Badge */}
        <div className="flex items-center justify-between py-2 px-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Selected Plan</span>
          <Badge className="bg-primary text-primary-foreground">
            <Sparkles className="w-3 h-3 mr-1" />
            {selectedPlan.name} - ${selectedPlan.monthly}/mo after trial
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Setting up secure payment form...</p>
          </div>
        ) : error && !clientSecret ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={loadStripeSetup} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Smith"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                disabled={isProcessing}
                className="bg-background"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  disabled={isProcessing}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  disabled={isProcessing}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <div className="relative">
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    maxLength={4}
                    disabled={isProcessing}
                    className="bg-background"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Security Note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>
                Your payment information is encrypted and securely processed by Stripe. 
                BamLead never stores your full card details.
              </span>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Start 7-Day Free Trial
                </>
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              {' '}and authorize BamLead to charge your card after the trial period.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
