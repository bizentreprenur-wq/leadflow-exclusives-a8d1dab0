import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Search, Building2, Globe, Settings, LogOut, User, 
  Crown, ChevronRight, TrendingUp, Clock, Star, CreditCard
} from 'lucide-react';
import GMBSearchModule from '@/components/GMBSearchModule';
import PlatformSearchModule from '@/components/PlatformSearchModule';
import { createPortalSession } from '@/lib/api/stripe';

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('search');

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your subscription is now active.');
      refreshUser();
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, refreshUser]);

  // Calculate trial days remaining
  const trialDaysRemaining = user?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary">B</span>
            </div>
            <span className="text-xl font-bold">BamLead</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Subscription status */}
            {user?.subscription_status === 'trial' && (
              <Badge variant="outline" className="hidden sm:flex gap-1 text-amber-500 border-amber-500/50">
                <Clock className="w-3 h-3" />
                {trialDaysRemaining} days left in trial
              </Badge>
            )}
            
            {user?.subscription_status === 'active' && (
              <Badge variant="outline" className="hidden sm:flex gap-1 text-emerald-500 border-emerald-500/50">
                <Star className="w-3 h-3" />
                Pro
              </Badge>
            )}

            {/* Manage subscription button for paid users */}
            {user?.subscription_status === 'active' && !user?.is_owner && user?.subscription_plan !== 'free_granted' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 hidden sm:flex"
                onClick={async () => {
                  try {
                    const { portal_url } = await createPortalSession();
                    window.location.href = portal_url;
                  } catch (error) {
                    toast.error('Could not open billing portal');
                  }
                }}
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </Button>
            )}

            {(user?.role === 'admin' || user?.is_owner) && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Find and verify leads to grow your business.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">∞</p>
                  <p className="text-sm text-muted-foreground">Searches Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Leads Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0%</p>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="search" className="gap-2">
              <Building2 className="w-4 h-4" />
              GMB Search
            </TabsTrigger>
            <TabsTrigger value="platform" className="gap-2">
              <Globe className="w-4 h-4" />
              Platform Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Google My Business Search
                </CardTitle>
                <CardDescription>
                  Find local businesses and analyze their web presence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GMBSearchModule />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platform" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Platform-Based Search
                </CardTitle>
                <CardDescription>
                  Find businesses using specific website platforms (WordPress, Wix, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformSearchModule />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
