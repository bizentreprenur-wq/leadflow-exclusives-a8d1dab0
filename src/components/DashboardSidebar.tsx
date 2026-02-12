import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Globe,
  Mail,
  LayoutDashboard,
  HelpCircle,
  Crown,
  LogOut,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Send,
  FileText,
  Chrome,
  Zap,
  Trophy,
  Bot,
  Gift,
  Brain,
  Server,
  CreditCard,
  RefreshCw,
  Wrench,
  Settings,
  HardDrive,
  Phone,
  History,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import bamMascot from '@/assets/bamlead-mascot.png';
import { BackendStatusIndicator } from '@/components/BackendStatusIndicator';
import { getTwilioConfig } from '@/lib/api/twilio';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const mainWorkflow = [
  {
    id: 'workflow',
    title: '🚀 Start Finding Leads',
    icon: Search,
    description: 'Step-by-step workflow',
    highlight: true,
    iconColor: 'text-primary',
  },
];

const aiCallingTools = [
  {
    id: 'voice-calling',
    title: 'Voice Calling',
    icon: Phone,
    description: 'AI voice calls',
    badge: 'New',
    iconColor: 'text-amber-400',
  },
  {
    id: 'call-history',
    title: 'Call History',
    icon: History,
    description: 'View call logs',
    iconColor: 'text-orange-400',
  },
];

const emailTools = [
  {
    id: 'sequences',
    title: 'Sequences',
    icon: Zap,
    description: 'Multi-channel flows',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'auto-followup',
    title: 'Auto Follow-ups',
    icon: RefreshCw,
    description: 'Smart re-engagement',
    badge: 'AI',
    iconColor: 'text-sky-400',
  },
  {
    id: 'templates',
    title: 'Email Templates',
    icon: FileText,
    description: 'Pre-built templates',
    iconColor: 'text-teal-400',
  },
];

const generalTools = [
  {
    id: 'subscription',
    title: 'Subscription',
    icon: CreditCard,
    description: 'Manage your plan',
    iconColor: 'text-violet-400',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    description: 'Integrations & account',
    iconColor: 'text-slate-400',
  },
];

const resourceTools = [
  {
    id: 'search-guide',
    title: 'Search Options Guide',
    icon: HelpCircle,
    description: 'Compare search methods',
    badge: 'Guide',
  },
  {
    id: 'video-tutorials',
    title: 'Video Tutorials',
    icon: Video,
    description: 'SMTP & campaign guides',
    badge: 'New',
  },
  {
    id: 'user-manual',
    title: 'User Manual',
    icon: FileText,
    description: 'Download PDF guide',
    badge: 'PDF',
  },
  {
    id: 'ai-journey',
    title: 'AI Features Guide',
    icon: Brain,
    description: 'How AI works',
    badge: 'Learn',
  },
  {
    id: 'scalability',
    title: 'System Status',
    icon: Server,
    description: 'Performance & scaling',
  },
  {
    id: 'diagnostics',
    title: 'Backend Diagnostics',
    icon: Wrench,
    description: 'Test all APIs',
    badge: 'Admin',
  },
  {
    id: 'mentor',
    title: 'AI Sales Mentor',
    icon: Bot,
    description: 'Practice & improve',
    badge: 'Exclusive',
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    icon: Trophy,
    description: 'Top affiliates',
  },
  {
    id: 'affiliate',
    title: 'Affiliate Program',
    icon: Gift,
    description: 'Earn money',
  },
  {
    id: 'extension',
    title: 'Chrome Extension',
    icon: Chrome,
    description: 'Prospect from any site',
  },
];

export default function DashboardSidebar({ activeTab, onTabChange, onLogout }: DashboardSidebarProps) {
  const isAICallingActive = aiCallingTools.some(t => t.id === activeTab);
  const isEmailActive = emailTools.some(t => t.id === activeTab);

  const { user } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isDark, setIsDark] = useState(false);
  // Initialize Twilio number from localStorage first for instant display
  const savedNumber = localStorage.getItem('twilio_phone_number');
  const savedActive = localStorage.getItem('twilio_phone_active') === 'true';
  const [twilioNumber, setTwilioNumber] = useState<string | null>(savedNumber || '+18882935813');
  const [twilioActive, setTwilioActive] = useState<boolean>(savedActive || true);

  // Also fetch from API to stay in sync
  useEffect(() => {
    getTwilioConfig().then(res => {
      if (res.success && res.config?.phone_number) {
        setTwilioNumber(res.config.phone_number);
        setTwilioActive(res.config.provisioned || res.config.enabled);
        localStorage.setItem('twilio_phone_number', res.config.phone_number);
        localStorage.setItem('twilio_phone_active', String(res.config.provisioned || res.config.enabled));
      }
    }).catch(() => {});
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const trialDaysRemaining = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Header */}
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src={bamMascot}
                alt="Bam"
                className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
              />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-foreground leading-none">BamLead</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lead Generation</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Main Content */}
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.pathname === '/dashboard' && activeTab === 'search'}
                tooltip="Dashboard"
                onClick={() => onTabChange('search')}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Main Workflow */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Sparkles className="w-3 h-3 mr-2" />
            Lead Generation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainWorkflow.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    isActive={activeTab === tool.id}
                    tooltip={tool.title}
                    onClick={() => onTabChange(tool.id)}
                    className={tool.highlight ? 'bg-primary/10 hover:bg-primary/20' : ''}
                  >
                    <tool.icon className={`w-4 h-4 ${tool.highlight ? 'text-primary' : ''}`} />
                    <span className={tool.highlight ? 'font-semibold' : ''}>{tool.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* AI Calling Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-400">
            <Phone className="w-3 h-3 mr-2 text-amber-400" />
            AI Calling
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Twilio Number Display */}
              {!isCollapsed && twilioNumber && (
                <div className="px-3 py-2 mb-2">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-semibold">Your Twilio Number</span>
                      <span className="text-base font-extrabold text-emerald-300 tracking-wide">
                        {twilioNumber.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}
                      </span>
                    </div>
                    {twilioActive && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {aiCallingTools.map((tool) => {
                const isPhoneSetup = tool.id === 'voice-calling';
                const isGreyedOut = isPhoneSetup && twilioActive;
                return (
                  <SidebarMenuItem key={tool.id}>
                    <SidebarMenuButton
                      isActive={activeTab === tool.id}
                      tooltip={tool.title}
                      onClick={() => onTabChange(tool.id)}
                      className={`${isGreyedOut ? 'opacity-50' : ''} ${
                        isAICallingActive && activeTab === tool.id
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                          : isAICallingActive
                          ? 'hover:bg-amber-500/10'
                          : ''
                      }`}
                    >
                      <tool.icon className={`w-4 h-4 ${activeTab === tool.id && isAICallingActive ? 'text-amber-400' : (tool.iconColor || '')}`} />
                      <span>{tool.title}</span>
                      {'badge' in tool && tool.badge && (
                        <Badge variant="secondary" className={`ml-auto text-[10px] px-1.5 py-0 ${
                          isAICallingActive ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-primary/10 text-primary'
                        }`}>
                          {tool.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Drip Feed Email Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-emerald-400">
            <Mail className="w-3 h-3 mr-2 text-emerald-400" />
            Drip Feed Email
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {emailTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    isActive={activeTab === tool.id}
                    tooltip={tool.title}
                    onClick={() => onTabChange(tool.id)}
                    className={isEmailActive && activeTab === tool.id
                      ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                      : isEmailActive
                      ? 'hover:bg-primary/10'
                      : ''
                    }
                  >
                    <tool.icon className={`w-4 h-4 ${activeTab === tool.id && isEmailActive ? 'text-primary' : (tool.iconColor || '')}`} />
                    <span>{tool.title}</span>
                    {'badge' in tool && tool.badge && (
                      <Badge variant="secondary" className={`ml-auto text-[10px] px-1.5 py-0 ${
                        isEmailActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-primary/10 text-primary'
                      }`}>
                        {tool.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* General */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="w-3 h-3 mr-2" />
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    isActive={activeTab === tool.id}
                    tooltip={tool.title}
                    onClick={() => onTabChange(tool.id)}
                  >
                    <tool.icon className={`w-4 h-4 ${tool.iconColor || ''}`} />
                    <span>{tool.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Sparkles className="w-3 h-3 mr-2" />
            Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    isActive={activeTab === tool.id}
                    tooltip={tool.title}
                    onClick={() => onTabChange(tool.id)}
                  >
                    <tool.icon className="w-4 h-4" />
                    <span>{tool.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {(user?.role === 'admin' || user?.is_owner) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Panel">
                    <Link to="/admin">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Support */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help Center">
                  <Link to="/contact">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help Center</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer */}
      <SidebarFooter className="p-4">
        {/* Subscription Badge */}
        {!isCollapsed && (
          <div className="mb-4">
            {user?.subscription_status === 'trial' && (
              <Badge className="w-full justify-center gap-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 py-1.5">
                <Clock className="w-3 h-3" />
                {trialDaysRemaining} days left
              </Badge>
            )}
            {user?.subscription_status === 'active' && (
              <Badge className="w-full justify-center gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-1.5">
                <Star className="w-3 h-3 fill-current" />
                Pro Plan
              </Badge>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground mb-2"
          onClick={toggleTheme}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </Button>

        {/* Status Indicator */}
        <div className="mb-3">
          {!isCollapsed ? (
            <>
              <BackendStatusIndicator className="mb-1" />
              <p className="text-[10px] text-muted-foreground text-center">
                Dashboard offline? <a href="/contact" className="text-primary hover:underline">Contact us now</a>
              </p>
            </>
          ) : (
            <BackendStatusIndicator compact showLabel={false} className="justify-center" />
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sign out</span>}
        </Button>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center mt-2 text-muted-foreground"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
