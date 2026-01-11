import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CreditCard } from 'lucide-react';
import mascotLogo from '@/assets/bamlead-mascot.png';
import { BackendStatus } from '@/components/BackendStatus';
import { createCheckoutSession } from '@/lib/api/stripe';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check for pending checkout plan from pricing page
  const pendingPlan = searchParams.get('plan') as 'basic' | 'pro' | 'agency' | null;
  const pendingBilling = searchParams.get('billing') as 'monthly' | 'yearly' | null;

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const redirectingRef = useRef(false);

  // Helper to handle post-auth redirect (either to checkout or dashboard)
  const handlePostAuthRedirect = useCallback(async () => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    setIsRedirecting(true);

    if (pendingPlan && ['basic', 'pro', 'agency'].includes(pendingPlan)) {
      try {
        const { checkout_url } = await createCheckoutSession(
          pendingPlan,
          pendingBilling || 'monthly'
        );
        window.location.assign(checkout_url);
        return;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
        redirectingRef.current = false;
        setIsRedirecting(false);
        navigate('/pricing', { replace: true });
        return;
      }
    }

    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname ||
      '/dashboard';
    navigate(from, { replace: true });
  }, [pendingPlan, pendingBilling, navigate, location.state]);

  // Redirect if already authenticated (in useEffect to avoid render-phase navigation)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void handlePostAuthRedirect();
    }
  }, [isAuthenticated, authLoading, handlePostAuthRedirect]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail, loginPassword);
      toast.success('Welcome back!');
      await handlePostAuthRedirect();
    } catch (error) {
      // Don't reveal whether email exists or password is wrong
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = registerEmail.trim().toLowerCase();
    const trimmedName = registerName.trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password validation - require complexity
    if (registerPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    // Check for at least one number and one letter
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(registerPassword)) {
      toast.error('Password must contain at least one letter and one number');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Name validation (optional but if provided, sanitize)
    if (trimmedName && trimmedName.length > 100) {
      toast.error('Name is too long');
      return;
    }

    setIsLoading(true);
    try {
      await register(trimmedEmail, registerPassword, trimmedName || undefined);
      toast.success('Account created! Welcome to BamLead.');
      await handlePostAuthRedirect();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking auth or redirecting
  if (authLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            {isRedirecting ? 'Redirecting to checkout...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Get plan display name
  const getPlanDisplayName = (plan: string) => {
    const names: Record<string, string> = {
      basic: 'Basic',
      pro: 'Pro',
      agency: 'Agency'
    };
    return names[plan] || plan;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Back to home */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          {/* Plan selection banner */}
          {pendingPlan && (
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 rounded-t-lg">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-foreground">
                  Sign in to subscribe to the <strong className="text-primary">{getPlanDisplayName(pendingPlan)}</strong> plan
                  {pendingBilling && <span className="text-muted-foreground"> ({pendingBilling})</span>}
                </span>
              </div>
            </div>
          )}
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto mb-2">
              <img 
                src={mascotLogo} 
                alt="BamLead Mascot" 
                className="h-20 w-auto object-contain mx-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to BamLead</CardTitle>
            <CardDescription>
              {pendingPlan 
                ? 'Create an account or sign in to complete your subscription'
                : 'Find leads, analyze websites, and grow your business'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </div>

                  <div className="text-center">
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Name (optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-confirm"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                Having trouble? Test backend connection
              </summary>
              <div className="mt-3">
                <BackendStatus />
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
