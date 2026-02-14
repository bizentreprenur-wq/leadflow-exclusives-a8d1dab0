import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, CreditCard, Monitor } from 'lucide-react';
import mascotLogo from '@/assets/bamlead-mascot.png';
import { BackendStatus } from '@/components/BackendStatus';
import { createCheckoutSession } from '@/lib/api/stripe';
import BackButton from '@/components/BackButton';

// Dev bypass for preview environments only
// NOTE: published apps can also be on *.lovable.app, so we only treat the preview subdomain as "preview".
const hostname = window.location.hostname;
const isPreviewEnv =
  hostname === 'localhost' ||
  hostname.includes('lovableproject.com') ||
  hostname.startsWith('id-preview--');
const SIGNUP_ENABLED = true;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check for pending checkout plan from pricing page
  const pendingPlan = searchParams.get('plan') as 'basic' | 'pro' | 'autopilot' | null;
  const pendingBilling = searchParams.get('billing') as 'monthly' | 'yearly' | null;
  
  // Dev bypass - allows accessing dashboard in preview environments
  const devBypass = searchParams.get('devBypass') === 'true';
  
  useEffect(() => {
    if (devBypass && isPreviewEnv) {
      console.log('[Auth] Dev bypass activated - redirecting to dashboard');
      localStorage.setItem('auth_token', 'dev_bypass_token');
      const now = new Date().toISOString();
      localStorage.setItem('bamlead_user_cache', JSON.stringify({
        id: 999001,
        email: 'dev@bamlead.com',
        name: 'Dev User',
        role: 'admin',
        subscription_status: 'active',
        subscription_plan: 'preview_bypass',
        trial_ends_at: null,
        subscription_ends_at: null,
        is_owner: true,
        has_active_subscription: true,
        created_at: now,
      }));
      // Notify AuthContext in the same tab (storage events don't fire in the same document)
      window.dispatchEvent(new Event('bamlead-auth-changed'));
      navigate('/dashboard', { replace: true });
    }
  }, [devBypass, navigate]);

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

    if (pendingPlan && ['basic', 'pro', 'autopilot'].includes(pendingPlan)) {
      try {
        const { checkout_url } = await createCheckoutSession(
          pendingPlan as 'basic' | 'pro' | 'autopilot',
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
    
    // Preview environment test login - admin@test.com / admin123
    // Trim password to avoid confusion with copy/paste whitespace.
    if (isPreviewEnv && trimmedEmail === 'admin@test.com' && loginPassword.trim() === 'admin123') {
      console.log('[Auth] Preview test login activated');
      localStorage.setItem('auth_token', 'preview_test_token');
      const now = new Date().toISOString();
      localStorage.setItem('bamlead_user_cache', JSON.stringify({
        id: 999002,
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin',
        subscription_status: 'active',
        subscription_plan: 'preview_test',
        trial_ends_at: null,
        subscription_ends_at: null,
        is_owner: true,
        has_active_subscription: true,
        created_at: now,
      }));
      window.dispatchEvent(new Event('bamlead-auth-changed'));
      toast.success('Welcome back! (Preview Mode)');
      setIsLoading(false);
      navigate('/dashboard', { replace: true });
      return;
    }
    
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
        <BackButton fallbackPath="/" />
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
                ? (SIGNUP_ENABLED
                  ? 'Create an account or sign in to complete your subscription'
                  : 'Sign in to complete your subscription')
                : (SIGNUP_ENABLED
                  ? 'Find leads, analyze websites, and grow your business'
                  : 'Sign in to access your account')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              {SIGNUP_ENABLED && (
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>
              )}

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
              {SIGNUP_ENABLED && (
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
              )}
            </Tabs>

            {/* Preview-only: Enter Dashboard button */}
            {isPreviewEnv && (
              <div className="mt-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Preview Environment Detected</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-amber-500/50 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  onClick={() => {
                    localStorage.setItem('auth_token', 'dev_bypass_token');
                    const now = new Date().toISOString();
                    localStorage.setItem('bamlead_user_cache', JSON.stringify({
                      id: 999001,
                      email: 'dev@bamlead.com',
                      name: 'Dev User',
                      role: 'admin',
                      subscription_status: 'active',
                      subscription_plan: 'preview_bypass',
                      trial_ends_at: null,
                      subscription_ends_at: null,
                      is_owner: true,
                      has_active_subscription: true,
                      created_at: now,
                    }));
                    window.dispatchEvent(new Event('bamlead-auth-changed'));
                    navigate('/dashboard', { replace: true });
                  }}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Enter Dashboard (Preview Mode)
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Production login may fail in preview due to CORS restrictions
                </p>
              </div>
            )}

            {/* Demo mode removed - always uses real backend */}

            <details className="mt-4">
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
