import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Brain,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  BarChart3,
  Users,
  Play,
  Pause,
  Settings,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Send,
  Bot,
  Sparkles,
  Globe,
  Filter,
  RefreshCw,
  Activity,
  ChevronRight,
  Eye,
  MousePointer,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  Layers,
  Loader2,
  Crown,
} from 'lucide-react';
import { getCampaigns, getSends, getEmailStats, EmailCampaign, EmailStats as APIEmailStats } from '@/lib/api/email';
import { searchGMB, GMBResult } from '@/lib/api/gmb';
import { quickScoreLeads } from '@/lib/api/aiLeadScoring';
import MultiChannelAutomation from './MultiChannelAutomation';
import AutomationResultsDelivery from './AutomationResultsDelivery';
import LeadSyncPricingModal from './LeadSyncPricingModal';
import LeadSyncUsageMeter from './LeadSyncUsageMeter';
import { LeadSyncTier, LEADSYNC_PLANS } from '@/lib/leadsyncPricing';

// Types
interface LeadSyncStats {
  leadsGenerated: number;
  emailsSent: number;
  callsMade: number;
  chatsHandled: number;
  conversionRate: number;
  responseRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled' | 'completed';
  type: 'email' | 'call' | 'multi-channel';
  leads: number;
  sent: number;
  opened: number;
  replied: number;
  startedAt: string;
}

interface LeadSyncAIProps {
  onNavigateToSearch?: () => void;
}

// Demo data
const DEMO_STATS: LeadSyncStats = {
  leadsGenerated: 1847,
  emailsSent: 3256,
  callsMade: 428,
  chatsHandled: 156,
  conversionRate: 12.4,
  responseRate: 34.7,
  openRate: 47.3,
  clickRate: 12.8,
  replyRate: 8.4,
};

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Q1 Local Business Outreach',
    status: 'active',
    type: 'multi-channel',
    leads: 250,
    sent: 187,
    opened: 94,
    replied: 23,
    startedAt: '2025-01-20',
  },
  {
    id: '2',
    name: 'Agency Website Audit Campaign',
    status: 'active',
    type: 'email',
    leads: 500,
    sent: 312,
    opened: 156,
    replied: 47,
    startedAt: '2025-01-18',
  },
  {
    id: '3',
    name: 'Follow-up Sequence - Hot Leads',
    status: 'paused',
    type: 'email',
    leads: 78,
    sent: 78,
    opened: 45,
    replied: 12,
    startedAt: '2025-01-15',
  },
];

const AI_CAPABILITIES = [
  {
    id: 'lead-gen',
    title: 'AI Lead Generation',
    description: 'Automatically collect leads based on location, industry, and custom criteria',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    status: 'active',
  },
  {
    id: 'email-nurture',
    title: 'Smart Email Sequences',
    description: 'AI writes and optimizes personalized email campaigns based on engagement',
    icon: Mail,
    color: 'from-emerald-500 to-teal-500',
    status: 'active',
  },
  {
    id: 'ai-calls',
    title: 'AI Voice Calling',
    description: 'Automated outbound calls with AI-driven conversations and lead qualification',
    icon: Phone,
    color: 'from-amber-500 to-orange-500',
    status: 'active',
  },
  {
    id: 'chat-ai',
    title: 'Chat Conversations',
    description: 'NLP-powered responses to inbound messages with intelligent routing',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
    status: 'coming-soon',
  },
  {
    id: 'analytics',
    title: 'Reporting & Analytics',
    description: 'Track interactions, analyze behavior, and continuously improve AI responses',
    icon: BarChart3,
    color: 'from-rose-500 to-red-500',
    status: 'active',
  },
];

export default function LeadSyncAI({ onNavigateToSearch }: LeadSyncAIProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [stats, setStats] = useState<LeadSyncStats>(DEMO_STATS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscription & Usage State
  const [currentTier, setCurrentTier] = useState<LeadSyncTier>('starter');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [usage, setUsage] = useState({
    leadsUsed: 247,
    emailsSent: 512,
    smsSent: 34,
    callMinutesUsed: 8,
    sequencesActive: 2,
  });

  // Lead Generation State
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [generatedLeads, setGeneratedLeads] = useState<GMBResult[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState<{ industry: string; location: string } | null>(null);

  // Lead Generation Settings
  const [leadGenSettings, setLeadGenSettings] = useState({
    industry: 'Local Services',
    location: 'United States',
    companySize: '10-50 employees',
    autoCollect: false,
    dailyLimit: 100,
  });

  // Handle tier selection
  const handleSelectTier = (tier: LeadSyncTier) => {
    setCurrentTier(tier);
    // Reset usage on tier change (in real app, this would sync with backend)
    setUsage(prev => ({
      ...prev,
      // Keep current usage but allow higher limits
    }));
  };

  // Fetch real-time data from API
  const fetchLiveData = useCallback(async () => {
    setIsPolling(true);
    try {
      // Fetch campaigns and stats in parallel
      const [campaignsResponse, statsResponse, sendsResponse] = await Promise.all([
        getCampaigns(),
        getEmailStats(30), // Last 30 days
        getSends({ limit: 100 }),
      ]);

      // Update campaigns from API
      if (campaignsResponse.success && campaignsResponse.campaigns.length > 0) {
        const mappedCampaigns: Campaign[] = campaignsResponse.campaigns.map((c: EmailCampaign) => ({
          id: c.id.toString(),
          name: c.name,
          status: c.status === 'sending' ? 'active' : c.status === 'draft' ? 'scheduled' : c.status,
          type: 'email' as const,
          leads: c.total_recipients,
          sent: c.sent_count,
          opened: c.opened_count,
          replied: c.replied_count,
          startedAt: c.started_at || c.created_at,
        }));
        setCampaigns(prev => mappedCampaigns.length > 0 ? mappedCampaigns : prev);
      }

      // Update stats from API
      if (statsResponse.success && statsResponse.stats) {
        const apiStats = statsResponse.stats;
        setStats(prev => ({
          ...prev,
          emailsSent: apiStats.total_sent || prev.emailsSent,
          openRate: apiStats.open_rate || prev.openRate,
          clickRate: apiStats.click_rate || prev.clickRate,
          replyRate: apiStats.reply_rate || prev.replyRate,
          responseRate: apiStats.reply_rate || prev.responseRate,
        }));
      }

      // Count leads from sends
      if (sendsResponse.success) {
        const uniqueRecipients = new Set(sendsResponse.sends.map(s => s.recipient_email));
        setStats(prev => ({
          ...prev,
          leadsGenerated: Math.max(uniqueRecipients.size, prev.leadsGenerated),
        }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('[LeadSyncAI] Polling error:', error);
    } finally {
      setIsPolling(false);
    }
  }, []);

  // Set up polling when autopilot is active
  useEffect(() => {
    if (isAutoPilot) {
      // Fetch immediately when autopilot is enabled
      fetchLiveData();
      
      // Set up 10-second polling interval
      pollingIntervalRef.current = setInterval(() => {
        fetchLiveData();
      }, 10000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Clear interval when autopilot is disabled
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [isAutoPilot, fetchLiveData]);

  // Handlers
  const toggleAutoPilot = () => {
    setIsAutoPilot(!isAutoPilot);
    toast.success(
      !isAutoPilot 
        ? '🚀 LeadSync AI Autopilot activated! Real-time monitoring every 10 seconds.' 
        : 'Autopilot paused. Real-time polling stopped.'
    );
  };

  const toggleCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } 
        : c
    ));
    toast.success('Campaign status updated');
  };

  // Perform actual GMB search with configured criteria
  const startLeadGeneration = async () => {
    if (isSearching) return;
    
    const { industry, location, dailyLimit } = leadGenSettings;
    
    if (!industry.trim() || !location.trim()) {
      toast.error('Please enter both industry and location');
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setGeneratedLeads([]);
    
    toast.loading(`🎯 AI Lead Generation starting for "${industry}" in "${location}"...`, { id: 'lead-gen' });

    try {
      const response = await searchGMB(
        industry,
        location,
        Math.min(dailyLimit, 200), // Cap at 200 for initial generation
        (results, progress) => {
          // Progressive loading callback
          setSearchProgress(progress);
          setGeneratedLeads(results);
          
          if (results.length > 0 && results.length % 25 === 0) {
            toast.loading(`Found ${results.length} leads so far...`, { id: 'lead-gen' });
          }
        }
      );

      if (response.success && response.data) {
        // Apply AI scoring to all leads
        const scoredLeads = quickScoreLeads(response.data.map(r => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          website: r.url || r.displayLink,
          email: undefined,
          address: r.address,
          rating: r.rating,
          source: 'gmb' as const,
          websiteAnalysis: r.websiteAnalysis,
        })));

        // Store in sessionStorage for dashboard access
        sessionStorage.setItem('bamlead_search_results', JSON.stringify(scoredLeads));
        sessionStorage.setItem('bamlead_query', industry);
        sessionStorage.setItem('bamlead_location', location);
        sessionStorage.setItem('bamlead_search_type', 'gmb');
        sessionStorage.setItem('bamlead_current_step', '2');

        setGeneratedLeads(response.data);
        setLastSearchQuery({ industry, location });
        
        // Update stats
        setStats(prev => ({
          ...prev,
          leadsGenerated: prev.leadsGenerated + response.data!.length,
        }));

        const hotCount = scoredLeads.filter(l => l.aiClassification === 'hot').length;
        const warmCount = scoredLeads.filter(l => l.aiClassification === 'warm').length;

        toast.success(
          `🎉 Found ${response.data.length} leads! ${hotCount} hot, ${warmCount} warm. Ready for outreach!`,
          { id: 'lead-gen', duration: 5000 }
        );
      } else {
        throw new Error(response.error || 'No leads found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      toast.error(`Lead generation failed: ${message}`, { id: 'lead-gen' });
      console.error('[LeadSyncAI] Search error:', error);
    } finally {
      setIsSearching(false);
      setSearchProgress(100);
    }
  };

  // Navigate to dashboard with leads loaded
  const viewLeadsInDashboard = () => {
    if (onNavigateToSearch) {
      onNavigateToSearch();
    }
  };

  const manualRefresh = () => {
    fetchLiveData();
    toast.success('📊 Data refreshed!');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                LeadSync AI
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by AI
                </Badge>
              </h1>
              <p className="text-slate-400">
                Autonomous lead generation, nurturing, calling, and engagement system
              </p>
            </div>
          </div>

          {/* Plan & Autopilot Controls */}
          <div className="flex items-center gap-3">
            {/* Current Plan Badge */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPricingModal(true)}
              className="gap-2 border-violet-500/50 text-violet-300 hover:bg-violet-500/10"
            >
              <Crown className="w-4 h-4" />
              {LEADSYNC_PLANS[currentTier].name} Plan
              <Badge className="ml-1 bg-violet-500/30 text-violet-200 text-[10px]">
                ${LEADSYNC_PLANS[currentTier].price}/mo
              </Badge>
            </Button>

            {/* Autopilot Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-sm text-slate-400">AI Autopilot</span>
              <Switch
                checked={isAutoPilot}
                onCheckedChange={toggleAutoPilot}
                className="data-[state=checked]:bg-violet-500"
              />
              {isAutoPilot && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Autopilot Status Banner */}
        {isAutoPilot && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              <Bot className="w-5 h-5 text-violet-400" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-violet-300">LeadSync AI is running</span>
                  {isPolling && (
                    <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                  )}
                </div>
                <span className="text-slate-400 text-sm">
                  Auto-refreshing every 10 seconds
                  {lastUpdated && (
                    <span className="ml-2 text-slate-500">
                      • Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={manualRefresh}
                disabled={isPolling}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-violet-300 hover:text-white hover:bg-violet-500/20"
                onClick={toggleAutoPilot}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Leads Generated', value: stats.leadsGenerated.toLocaleString(), icon: Users, color: 'text-blue-400', live: true },
            { label: 'Emails Sent', value: stats.emailsSent.toLocaleString(), icon: Mail, color: 'text-emerald-400', live: true },
            { label: 'Calls Made', value: stats.callsMade.toLocaleString(), icon: Phone, color: 'text-amber-400', live: false },
            { label: 'Chats Handled', value: stats.chatsHandled.toLocaleString(), icon: MessageSquare, color: 'text-purple-400', live: false },
            { label: 'Open Rate', value: `${stats.openRate}%`, icon: Eye, color: 'text-cyan-400', live: true },
            { label: 'Reply Rate', value: `${stats.replyRate}%`, icon: TrendingUp, color: 'text-rose-400', live: true },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-slate-900 border-slate-800 relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</span>
                  {isAutoPilot && stat.live && (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 uppercase">Live</span>
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
              {/* Subtle gradient overlay when live */}
              {isAutoPilot && stat.live && (
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
              )}
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Layers className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="lead-gen" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />
              Lead Generation
            </TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Zap className="w-4 h-4 mr-2" />
              Multi-Channel
              <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">NEW</Badge>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Send className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Usage Meter + AI Capabilities Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Usage Meter - Takes 1 column */}
              <div className="lg:col-span-1">
                <LeadSyncUsageMeter
                  tier={currentTier}
                  usage={usage}
                  onUpgrade={() => setShowPricingModal(true)}
                />
              </div>

              {/* AI Capabilities - Takes 2 columns */}
              <div className="lg:col-span-2">
                <div className="grid md:grid-cols-2 gap-4">
                  {AI_CAPABILITIES.map((cap) => (
                    <Card 
                      key={cap.id} 
                      className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                      onClick={() => setActiveTab(cap.id === 'lead-gen' ? 'lead-gen' : cap.id === 'email-nurture' ? 'campaigns' : cap.id === 'ai-calls' ? 'calls' : cap.id === 'chat-ai' ? 'chat' : 'analytics')}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.color} flex items-center justify-center shadow-lg`}>
                            <cap.icon className="w-6 h-6 text-white" />
                          </div>
                          {cap.status === 'active' ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-700 text-slate-400 border-slate-600">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">
                          {cap.title}
                        </h3>
                        <p className="text-sm text-slate-400">{cap.description}</p>
                        <div className="flex items-center gap-1 mt-3 text-violet-400 text-sm">
                          <span>Configure</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Campaigns */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Active Campaigns</CardTitle>
                    <CardDescription>AI-managed outreach sequences currently running</CardDescription>
                  </div>
                  <Button 
                    className="bg-violet-500 hover:bg-violet-600"
                    onClick={() => setActiveTab('campaigns')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.filter(c => c.status === 'active').map((campaign) => (
                    <div 
                      key={campaign.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          campaign.type === 'multi-channel' 
                            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                            : campaign.type === 'email'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-br from-amber-500 to-orange-500'
                        }`}>
                          {campaign.type === 'multi-channel' ? <Layers className="w-5 h-5 text-white" /> :
                           campaign.type === 'email' ? <Mail className="w-5 h-5 text-white" /> :
                           <Phone className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{campaign.name}</h4>
                          <p className="text-sm text-slate-400">
                            {campaign.sent} / {campaign.leads} sent • {campaign.opened} opened • {campaign.replied} replied
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={(campaign.sent / campaign.leads) * 100} 
                          className="w-24 h-2 bg-slate-700"
                        />
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <Activity className="w-3 h-3 mr-1" />
                          {Math.round((campaign.sent / campaign.leads) * 100)}%
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCampaign(campaign.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Generation Tab */}
          <TabsContent value="lead-gen" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Settings Card */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Lead Collection Criteria
                  </CardTitle>
                  <CardDescription>
                    Define what types of leads AI should automatically collect
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-slate-300">Industry / Niche</Label>
                    <Input
                      value={leadGenSettings.industry}
                      onChange={(e) => setLeadGenSettings(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Local Services, SaaS, Healthcare"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-300">Location</Label>
                    <Input
                      value={leadGenSettings.location}
                      onChange={(e) => setLeadGenSettings(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., United States, California, New York City"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-300">Company Size</Label>
                    <Input
                      value={leadGenSettings.companySize}
                      onChange={(e) => setLeadGenSettings(prev => ({ ...prev, companySize: e.target.value }))}
                      placeholder="e.g., 10-50 employees"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-300">Daily Lead Limit</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={10}
                        max={500}
                        value={leadGenSettings.dailyLimit}
                        onChange={(e) => setLeadGenSettings(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-white font-medium w-12">{leadGenSettings.dailyLimit}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700">
                    <div>
                      <div className="font-medium text-white">Auto-Collect Mode</div>
                      <div className="text-sm text-slate-400">AI continuously finds and adds leads</div>
                    </div>
                    <Switch
                      checked={leadGenSettings.autoCollect}
                      onCheckedChange={(checked) => setLeadGenSettings(prev => ({ ...prev, autoCollect: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Start AI-powered lead generation instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Progress */}
                  {isSearching && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          <span className="font-medium text-blue-300">Finding leads...</span>
                        </div>
                        <span className="text-sm text-slate-400">{generatedLeads.length} found</span>
                      </div>
                      <Progress value={searchProgress} className="h-2 bg-slate-700" />
                      <p className="text-xs text-slate-500">
                        Searching "{leadGenSettings.industry}" in "{leadGenSettings.location}"
                      </p>
                    </div>
                  )}

                  {/* Results Summary */}
                  {!isSearching && generatedLeads.length > 0 && lastSearchQuery && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-emerald-300">
                            {generatedLeads.length} leads found!
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          Ready
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        "{lastSearchQuery.industry}" in "{lastSearchQuery.location}"
                      </p>
                      <Button 
                        size="sm"
                        className="w-full bg-emerald-500 hover:bg-emerald-600"
                        onClick={viewLeadsInDashboard}
                      >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        View Leads in Dashboard
                      </Button>
                    </div>
                  )}

                  <Button 
                    className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-lg disabled:opacity-50"
                    onClick={startLeadGeneration}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Start AI Lead Generation
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-14 border-slate-700 text-slate-300 hover:bg-slate-800 text-lg"
                    onClick={onNavigateToSearch}
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Manual Search Mode
                  </Button>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-blue-300">AI Learning</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      The AI analyzes your successful conversions to identify patterns and find more leads like your best customers.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generated Leads Preview */}
            {generatedLeads.length > 0 && !isSearching && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Recently Generated Leads
                      </CardTitle>
                      <CardDescription>
                        Preview of leads found from your last search
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      onClick={viewLeadsInDashboard}
                    >
                      View All {generatedLeads.length} Leads
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {generatedLeads.slice(0, 6).map((lead, idx) => (
                      <div 
                        key={lead.id || idx}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                      >
                        <h4 className="font-medium text-white truncate">{lead.name}</h4>
                        <p className="text-sm text-slate-400 truncate">{lead.address || 'No address'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {lead.phone && (
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                              <Phone className="w-3 h-3 mr-1" />
                              Phone
                            </Badge>
                          )}
                          {lead.websiteAnalysis?.hasWebsite && (
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                              <Globe className="w-3 h-3 mr-1" />
                              Website
                            </Badge>
                          )}
                          {lead.rating && (
                            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                              ★ {lead.rating}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {generatedLeads.length > 6 && (
                    <p className="text-center text-sm text-slate-500 mt-4">
                      +{generatedLeads.length - 6} more leads available
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Multi-Channel Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <MultiChannelAutomation leads={generatedLeads.map(l => ({
              id: l.id,
              name: l.name,
              email: undefined,
              phone: l.phone,
              businessName: l.name,
              website: l.url || l.displayLink,
            }))} />
          </TabsContent>

          {/* Results Delivery Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <AutomationResultsDelivery />
          </TabsContent>

          {/* Email Sequences Tab (legacy) */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-emerald-400" />
                      AI Email Sequences
                    </CardTitle>
                    <CardDescription>
                      Personalized email campaigns that learn and optimize
                    </CardDescription>
                  </div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create AI Sequence
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id}
                      className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-white">{campaign.name}</h4>
                          <Badge className={
                            campaign.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : campaign.status === 'paused'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCampaign(campaign.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-slate-900">
                          <div className="text-lg font-bold text-white">{campaign.leads}</div>
                          <div className="text-xs text-slate-500">Total Leads</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-900">
                          <div className="text-lg font-bold text-emerald-400">{campaign.sent}</div>
                          <div className="text-xs text-slate-500">Sent</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-900">
                          <div className="text-lg font-bold text-blue-400">{campaign.opened}</div>
                          <div className="text-xs text-slate-500">Opened</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-900">
                          <div className="text-lg font-bold text-violet-400">{campaign.replied}</div>
                          <div className="text-xs text-slate-500">Replied</div>
                        </div>
                      </div>
                      <Progress 
                        value={(campaign.sent / campaign.leads) * 100} 
                        className="h-2 bg-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Calls Tab */}
          <TabsContent value="calls" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-amber-400" />
                  AI Voice Calling
                </CardTitle>
                <CardDescription>
                  Automated outbound calls with AI-driven conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-center">
                    <Phone className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.callsMade}</div>
                    <div className="text-sm text-slate-400">Total Calls Made</div>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-800 border border-slate-700 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">67%</div>
                    <div className="text-sm text-slate-400">Answer Rate</div>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-800 border border-slate-700 text-center">
                    <Calendar className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">24</div>
                    <div className="text-sm text-slate-400">Meetings Booked</div>
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-amber-300">AI Voice Agent Ready</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Configure your ElevenLabs agent to start making AI-powered calls. The AI learns from successful conversations to improve over time.
                  </p>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                    Configure Voice Agent
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat AI Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Chat Conversations AI
                </CardTitle>
                <CardDescription>
                  NLP-powered responses for inbound messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                  <p className="text-slate-400 max-w-md mb-6">
                    AI-powered chat will understand customer intent and provide intelligent responses, escalating to humans when needed.
                  </p>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    In Development
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-rose-400" />
                  AI Performance Analytics
                </CardTitle>
                <CardDescription>
                  Track interactions and optimize AI responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Open Rate', value: '47.3%', change: '+5.2%', positive: true },
                    { label: 'Reply Rate', value: '12.8%', change: '+2.1%', positive: true },
                    { label: 'Bounce Rate', value: '2.4%', change: '-0.8%', positive: true },
                    { label: 'Unsubscribe', value: '0.3%', change: '-0.1%', positive: true },
                  ].map((metric, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                      <div className="text-sm text-slate-400 mb-1">{metric.label}</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{metric.value}</span>
                        <span className={`text-sm ${metric.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-rose-400" />
                    <span className="font-medium text-rose-300">AI Insights</span>
                  </div>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li>• Emails sent on Tuesday at 10 AM have 23% higher open rates</li>
                    <li>• Subject lines with questions get 18% more replies</li>
                    <li>• Follow-up on day 3 converts 2x better than day 7</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pricing Modal */}
      <LeadSyncPricingModal
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
        currentTier={currentTier}
        onSelectPlan={handleSelectTier}
      />
    </div>
  );
}
