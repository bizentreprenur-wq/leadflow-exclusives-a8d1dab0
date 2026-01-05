import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Search, Globe, Mail, Target, TrendingUp,
  Zap, BarChart3, ArrowRight, Sparkles, Menu,
  CheckCircle2, Send, FileText, Chrome, Download,
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import UnifiedSearchModule from '@/components/UnifiedSearchModule';
import PlatformSearchModule from '@/components/PlatformSearchModule';
import LeadVerificationModule, { VerifiedLead } from '@/components/LeadVerificationModule';
import EmailOutreachModule from '@/components/EmailOutreachModule';
import EmailTemplateLibrary from '@/components/EmailTemplateLibrary';
import SequenceBuilderModule from '@/components/SequenceBuilderModule';
import { LeadForEmail } from '@/lib/api/email';
import bamMascot from '@/assets/bamlead-mascot.png';

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('search');
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSendToEmail = (leads: VerifiedLead[]) => {
    // Convert VerifiedLead to LeadForEmail format
    const convertedLeads: LeadForEmail[] = leads.map((l) => ({
      email: l.email,
      business_name: l.business_name,
      contact_name: l.contact_name,
      website: l.website,
      phone: l.phone,
    }));
    setEmailLeads(convertedLeads);
    setActiveTab('email');
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
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Leads Saved',
      value: '0',
      icon: Target,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Emails Sent',
      value: '0',
      icon: Mail,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Conversion Rate',
      value: '0%',
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const getActiveToolConfig = () => {
    switch (activeTab) {
      case 'search':
        return {
          title: 'Lead Search',
          description: 'Search across Google My Business, Google, and Bing to find potential leads',
          icon: Search,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          component: <UnifiedSearchModule />,
        };
      case 'platform':
        return {
          title: 'Platform-Based Search',
          description: 'Find businesses using specific website platforms like WordPress, Wix, Squarespace',
          icon: Globe,
          iconColor: 'text-violet-500',
          iconBg: 'bg-violet-500/10',
          component: <PlatformSearchModule />,
        };
      case 'verify':
        return {
          title: 'AI Lead Verification',
          description: 'Validate emails, score leads, and generate personalized AI-drafted messages',
          icon: CheckCircle2,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10',
          component: <LeadVerificationModule onSendToEmail={handleSendToEmail} />,
        };
      case 'email':
        return {
          title: 'Email Outreach',
          description: 'Send personalized emails to your verified leads with tracking and analytics',
          icon: Send,
          iconColor: 'text-emerald-500',
          iconBg: 'bg-emerald-500/10',
          component: (
            <EmailOutreachModule
              selectedLeads={emailLeads}
              onClearSelection={() => setEmailLeads([])}
            />
          ),
        };
      case 'sequences':
        return {
          title: 'Multi-Channel Sequences',
          description: 'Build automated Email → LinkedIn → SMS outreach flows',
          icon: Zap,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10',
          component: <SequenceBuilderModule />,
        };
      case 'templates':
        return {
          title: 'Email Templates',
          description: 'Pre-built email templates for every outreach scenario',
          icon: FileText,
          iconColor: 'text-purple-500',
          iconBg: 'bg-purple-500/10',
          component: <EmailTemplateLibrary />,
        };
      case 'extension':
        return {
          title: 'Chrome Extension',
          description: 'Prospect leads from any website with our browser extension',
          icon: Chrome,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500/10',
          component: (
            <div className="text-center py-12">
              <Chrome className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">BamLead Chrome Extension</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Extract contact info, analyze websites, and save leads directly from any webpage.
              </p>
              <Button className="gap-2" onClick={() => toast.info('Download the extension from the chrome-extension folder in your project')}>
                <Download className="w-4 h-4" />
                Download Extension
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Load as unpacked extension in Chrome Developer Mode
              </p>
            </div>
          ),
        };
      default:
        return null;
    }
  };

  const activeTool = getActiveToolConfig();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />

        <SidebarInset>
          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>

            <div className="flex-1" />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={bamMascot} alt="Bam" className="w-5 h-5 object-contain" />
              <span className="hidden sm:inline">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Welcome Section */}
            <section className="mb-8">
              <div className="flex items-start gap-6">
                <div className="hidden lg:block relative">
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
                    Lead Generation Dashboard
                  </h1>
                  <p className="text-muted-foreground max-w-2xl">
                    Search → Verify with AI → Send personalized emails. Use the sidebar to navigate between tools.
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

            {/* Active Tool Section */}
            {activeTool && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Active Tool
                    </h2>
                  </div>
                </div>

                <Card className="border-border bg-card shadow-card">
                  <CardHeader className="border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${activeTool.iconBg} rounded-lg flex items-center justify-center`}>
                        <activeTool.icon className={`w-5 h-5 ${activeTool.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{activeTool.title}</CardTitle>
                        <CardDescription>{activeTool.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {activeTool.component}
                  </CardContent>
                </Card>
              </section>
            )}

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
                        <h3 className="font-semibold text-foreground">Workflow Tip</h3>
                        <p className="text-sm text-muted-foreground">
                          Start with Lead Search to find businesses, then use Verify Leads to validate emails and score them with AI. Finally, send personalized emails with AI-drafted messages.
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
          <footer className="border-t border-border py-6 bg-muted/30">
            <div className="px-6">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
