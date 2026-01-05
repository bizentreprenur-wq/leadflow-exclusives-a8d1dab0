import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Search, Building2, Globe, LogOut, User, 
  Crown, TrendingUp, Clock, Star, CreditCard, Mail,
  Target, Zap, BarChart3, ArrowRight, Sparkles
} from 'lucide-react';
import GMBSearchModule from '@/components/GMBSearchModule';
import PlatformSearchModule from '@/components/PlatformSearchModule';
import EmailOutreachModule from '@/components/EmailOutreachModule';
import { createPortalSession } from '@/lib/api/stripe';
import { LeadForEmail } from '@/lib/api/email';
import bamMascot from '@/assets/bamlead-mascot.png';

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('gmb');
  const [emailLeads, setEmailLeads] = useState<LeadForEmail[]>([]);

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your subscription is now active.');
      refreshUser();
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

  const stats = [
    { 
      label: 'Searches Available', 
      value: '∞', 
      icon: Search, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      label: 'Leads Saved', 
      value: '0', 
      icon: Target, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    { 
      label: 'Emails Sent', 
      value: '0', 
      icon: Mail, 
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10'
    },
    { 
      label: 'Conversion Rate', 
      value: '0%', 
      icon: TrendingUp, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src={bamMascot} 
                  alt="Bam" 
                  className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground leading-none">BamLead</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lead Generation</span>
              </div>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Subscription Badge */}
              {user?.subscription_status === 'trial' && (
                <Badge className="hidden sm:flex gap-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                  <Clock className="w-3 h-3" />
                  {trialDaysRemaining} days trial
                </Badge>
              )}
              
              {user?.subscription_status === 'active' && (
                <Badge className="hidden sm:flex gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                  <Star className="w-3 h-3 fill-current" />
                  Pro Plan
                </Badge>
              )}

              {/* Billing Button */}
              {user?.subscription_status === 'active' && !user?.is_owner && user?.subscription_plan !== 'free_granted' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 hidden md:flex"
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

              {/* Admin Button */}
              {(user?.role === 'admin' || user?.is_owner) && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-foreground">{user?.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex items-start gap-6">
            <div className="hidden md:block relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                <img 
                  src={bamMascot} 
                  alt="Bam" 
                  className="w-16 h-16 object-contain animate-float"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Ready to find your next high-quality leads? Use the tools below to search, analyze, and reach out to potential clients.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/50 bg-card hover:shadow-card transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Search Tools Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Lead Generation Tools
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Powerful tools to find and connect with potential clients
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1.5 gap-1">
              <TabsTrigger 
                value="gmb" 
                className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Building2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">GMB Search</span>
                <span className="sm:hidden">GMB</span>
              </TabsTrigger>
              <TabsTrigger 
                value="platform" 
                className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Platform Search</span>
                <span className="sm:hidden">Platform</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Email Outreach</span>
                <span className="sm:hidden">Email</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gmb" className="mt-6">
              <Card className="border-border bg-card shadow-card">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Google My Business Search</CardTitle>
                      <CardDescription>Find local businesses and analyze their online presence</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <GMBSearchModule />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platform" className="mt-6">
              <Card className="border-border bg-card shadow-card">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Platform-Based Search</CardTitle>
                      <CardDescription>Find businesses using specific website platforms like WordPress, Wix, Squarespace</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <PlatformSearchModule />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <Card className="border-border bg-card shadow-card">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Email Outreach</CardTitle>
                      <CardDescription>Send personalized emails to your leads with tracking and analytics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <EmailOutreachModule 
                    selectedLeads={emailLeads}
                    onClearSelection={() => setEmailLeads([])}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Tips Section */}
        <section>
          <Card className="border-border bg-gradient-to-br from-primary/5 via-card to-accent/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pro Tip</h3>
                    <p className="text-sm text-muted-foreground">
                      Start with GMB Search to find local businesses, then use Platform Search to identify outdated websites that need your services.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="shrink-0 gap-2 ml-auto">
                  View Guide
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={bamMascot} alt="Bam" className="w-5 h-5 object-contain" />
              <span>© 2025 BamLead. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/contact" className="hover:text-foreground transition-colors">Support</Link>
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
