import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, RefreshCw, Loader2, HelpCircle, LogOut } from 'lucide-react';
import { resendVerification } from '@/lib/api/password';
import { useAuth } from '@/contexts/AuthContext';
import bamMascot from '@/assets/bamlead-mascot.png';

export default function EmailVerificationRequired() {
  const { user, logout, refreshUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const result = await resendVerification();
      toast.success(result.message || 'Verification email sent! Please check your inbox.');
      
      // Start 60 second cooldown to prevent spam
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    await refreshUser();
    // The dashboard will automatically show if email is now verified
    toast.info('Checking verification status...');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <Card className="w-full max-w-lg border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-2">
            <Mail className="w-12 h-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to <strong className="text-foreground">{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Mascot and message */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
            <img 
              src={bamMascot} 
              alt="BamLead Mascot" 
              className="w-16 h-16 object-contain flex-shrink-0"
            />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Almost there! 🎉</p>
              <p>
                Please check your email inbox (and spam folder) for the verification link. 
                Click the link to activate your account and unlock all BamLead features.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
              variant="default"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              onClick={handleCheckVerification}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              I've Verified - Check Status
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Need help?</span>
            </div>
          </div>

          {/* Help section */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p className="flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Can't find the email? Check your spam folder.
            </p>
            <p>
              Still having issues?{' '}
              <a 
                href="mailto:support@bamlead.com" 
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>

          {/* Logout option */}
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
