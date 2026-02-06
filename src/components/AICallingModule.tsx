/**
 * AI Calling Module
 * Complete AI Calling interface for BamLead
 * 
 * INFRASTRUCTURE: calling.io (NOT 11Labs or Telnyx)
 * - Calling infrastructure is hidden from customers
 * - Customers only see BamLead branding
 * - AI generates scripts automatically based on search/strategy
 * 
 * V1 RULES:
 * - One phone number per customer
 * - Free: Script preview only
 * - Basic: AI generates scripts, no calling
 * - Pro: AI calls, customer supervises
 * - Autopilot: Fully autonomous calling
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneMissed,
  Plus,
  Play,
  Pause,
  Square,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Mic,
  MicOff,
  Settings,
  FileText,
  Users,
  Clock,
  Calendar,
  BarChart3,
  MessageSquare,
  Target,
  Zap,
  RefreshCw,
  Volume2,
  Brain,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAICalling, AICallingStatus } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import PhoneNumberSetupModal from '@/components/PhoneNumberSetupModal';
import AIScriptPreviewPanel from '@/components/AIScriptPreviewPanel';
import { Link } from 'react-router-dom';

interface AICallingModuleProps {
  leads?: Array<{
    id: string | number;
    name: string;
    phone?: string;
    business?: string;
    status?: string;
  }>;
  searchQuery?: string;
  searchLocation?: string;
  selectedStrategy?: string;
}

interface CallQueueItem {
  id: string | number;
  name: string;
  phone: string;
  business?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer';
  outcome?: string;
  duration?: number;
}

export default function AICallingModule({
  leads = [],
  searchQuery = '',
  searchLocation = '',
  selectedStrategy = ''
}: AICallingModuleProps) {
  const { 
    status, 
    statusMessage, 
    capabilities, 
    phoneSetup, 
    isLoading, 
    needsUpgrade, 
    upgradeMessage,
    isReady 
  } = useAICalling();
  const { tier, tierInfo, isAutopilot, isPro } = usePlanFeatures();
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [callStats, setCallStats] = useState({
    total: 0,
    completed: 0,
    answered: 0,
    noAnswer: 0,
    interested: 0,
    avgDuration: 0
  });

  // Filter leads with phone numbers
  const callableLeads = useMemo(() => {
    return leads.filter(lead => lead.phone && lead.phone.length >= 10);
  }, [leads]);

  // Initialize call queue from leads
  useEffect(() => {
    if (callableLeads.length > 0 && callQueue.length === 0) {
      setCallQueue(callableLeads.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone!,
        business: lead.business,
        status: 'pending' as const
      })));
    }
  }, [callableLeads]);

  const handleStartCalling = () => {
    if (!isReady) {
      if (needsUpgrade) {
        toast.error('Upgrade your plan to enable AI calling');
      } else if (status === 'phone_needed') {
        setShowPhoneModal(true);
      }
      return;
    }

    if (callQueue.filter(c => c.status === 'pending').length === 0) {
      toast.error('No leads in queue to call');
      return;
    }

    setIsCallingActive(true);
    simulateCall();
    toast.success('AI calling started');
  };

  const handleStopCalling = () => {
    setIsCallingActive(false);
    toast.info('AI calling paused');
  };

  // Simulate a call (in production, this would use the calling.io API)
  const simulateCall = () => {
    const pendingCalls = callQueue.filter(c => c.status === 'pending');
    if (pendingCalls.length === 0 || !isCallingActive) {
      setIsCallingActive(false);
      return;
    }

    const currentCall = pendingCalls[0];
    
    // Set to calling
    setCallQueue(prev => prev.map(c => 
      c.id === currentCall.id ? { ...c, status: 'calling' as const } : c
    ));

    // Simulate call duration (3-15 seconds for demo)
    const duration = Math.floor(Math.random() * 12000) + 3000;
    
    setTimeout(() => {
      // Random outcome
      const outcomes = ['completed', 'no_answer', 'completed', 'completed', 'failed'] as const;
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const interested = outcome === 'completed' && Math.random() > 0.6;
      
      setCallQueue(prev => prev.map(c => 
        c.id === currentCall.id ? { 
          ...c, 
          status: outcome,
          outcome: interested ? 'Interested' : outcome === 'completed' ? 'Callback' : undefined,
          duration: Math.floor(duration / 1000)
        } : c
      ));

      // Update stats
      setCallStats(prev => ({
        total: prev.total + 1,
        completed: prev.completed + (outcome === 'completed' ? 1 : 0),
        answered: prev.answered + (outcome === 'completed' ? 1 : 0),
        noAnswer: prev.noAnswer + (outcome === 'no_answer' ? 1 : 0),
        interested: prev.interested + (interested ? 1 : 0),
        avgDuration: Math.floor((prev.avgDuration * prev.total + duration / 1000) / (prev.total + 1))
      }));

      // Continue to next call if still active
      if (isCallingActive) {
        setTimeout(simulateCall, 1500);
      }
    }, duration);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'phone_needed':
        return <Phone className="w-5 h-5 text-amber-500" />;
      default:
        return <Lock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCallStatusIcon = (callStatus: CallQueueItem['status']) => {
    switch (callStatus) {
      case 'calling':
        return <PhoneCall className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'no_answer':
        return <PhoneMissed className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Phone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-border overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                status === 'ready' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : status === 'phone_needed'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-muted to-muted-foreground/20'
              }`}>
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  AI Calling
                  <Badge className={tierInfo.bgColor + ' ' + tierInfo.color + ' border-0'}>
                    {tierInfo.name}
                  </Badge>
                  {isCallingActive && (
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1 animate-pulse">
                      <Volume2 className="w-3 h-3" />
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  {getStatusIcon()}
                  <span>{statusMessage}</span>
                </CardDescription>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {!needsUpgrade && status === 'phone_needed' && (
                <Button onClick={() => setShowPhoneModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Phone Number
                </Button>
              )}
              {isReady && !isCallingActive && callQueue.filter(c => c.status === 'pending').length > 0 && (
                <Button onClick={handleStartCalling} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4" />
                  Start Calling
                </Button>
              )}
              {isCallingActive && (
                <Button onClick={handleStopCalling} variant="destructive" className="gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              )}
              {needsUpgrade && (
                <Link to="/pricing">
                  <Button variant="outline" className="gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6">
              <TabsList className="h-12 bg-transparent gap-4">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/10">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-primary/10">
                  <Users className="w-4 h-4" />
                  Call Queue
                  {callQueue.filter(c => c.status === 'pending').length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {callQueue.filter(c => c.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="script" className="gap-2 data-[state=active]:bg-primary/10">
                  <FileText className="w-4 h-4" />
                  AI Script
                </TabsTrigger>
                <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-primary/10">
                  <Target className="w-4 h-4" />
                  Results
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Tier Capabilities */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${capabilities.canViewScripts ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {capabilities.canViewScripts ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">AI Scripts</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {capabilities.scriptGeneration === 'advanced' ? 'Advanced generation with live adaptation' :
                     capabilities.scriptGeneration === 'full' ? 'Full script generation & editing' :
                     capabilities.scriptGeneration === 'basic' ? 'AI generates scripts for you' :
                     'Preview only'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${capabilities.canMakeCalls ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {capabilities.canMakeCalls ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">Outbound Calls</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {capabilities.canMakeCalls ? 'AI calls your leads automatically' : 'Upgrade to Pro to enable'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${capabilities.canAutoCall ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/50 border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {capabilities.canAutoCall ? (
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">Autonomous Mode</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {capabilities.canAutoCall ? 'Fully autonomous calling & booking' : 'Autopilot plan only'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${phoneSetup.hasPhone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/50 border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {phoneSetup.hasPhone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Phone className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">Phone Number</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {phoneSetup.phoneNumber || 'Not configured'}
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              {(isPro || isAutopilot) && (
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-card border">
                    <div className="text-2xl font-bold text-foreground">{callStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Calls</div>
                  </div>
                  <div className="p-4 rounded-xl bg-card border">
                    <div className="text-2xl font-bold text-emerald-500">{callStats.answered}</div>
                    <div className="text-xs text-muted-foreground">Answered</div>
                  </div>
                  <div className="p-4 rounded-xl bg-card border">
                    <div className="text-2xl font-bold text-amber-500">{callStats.noAnswer}</div>
                    <div className="text-xs text-muted-foreground">No Answer</div>
                  </div>
                  <div className="p-4 rounded-xl bg-card border">
                    <div className="text-2xl font-bold text-primary">{callStats.interested}</div>
                    <div className="text-xs text-muted-foreground">Interested</div>
                  </div>
                  <div className="p-4 rounded-xl bg-card border">
                    <div className="text-2xl font-bold text-foreground">{callStats.avgDuration}s</div>
                    <div className="text-xs text-muted-foreground">Avg Duration</div>
                  </div>
                </div>
              )}

              {/* Upgrade Prompt */}
              {needsUpgrade && (
                <div className="p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Unlock AI Calling</h4>
                      <p className="text-sm text-muted-foreground mb-4">{upgradeMessage}</p>
                      <Link to="/pricing">
                        <Button className="gap-2">
                          View Plans
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Call Queue Tab */}
            <TabsContent value="queue" className="p-6">
              {callQueue.length > 0 ? (
                <div className="space-y-3">
                  {/* Progress */}
                  {isCallingActive && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Calling Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {callQueue.filter(c => c.status !== 'pending').length} / {callQueue.length}
                        </span>
                      </div>
                      <Progress 
                        value={(callQueue.filter(c => c.status !== 'pending').length / callQueue.length) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Queue List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {callQueue.map((call, index) => (
                      <div 
                        key={call.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          call.status === 'calling' 
                            ? 'bg-primary/5 border-primary/30' 
                            : call.status === 'completed'
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : call.status === 'no_answer'
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : call.status === 'failed'
                            ? 'bg-destructive/5 border-destructive/20'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getCallStatusIcon(call.status)}
                          <div>
                            <p className="font-medium text-foreground text-sm">{call.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{call.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {call.outcome && (
                            <Badge className={
                              call.outcome === 'Interested' 
                                ? 'bg-emerald-500/20 text-emerald-600' 
                                : 'bg-muted text-muted-foreground'
                            }>
                              {call.outcome}
                            </Badge>
                          )}
                          {call.duration && (
                            <span className="text-xs text-muted-foreground">{call.duration}s</span>
                          )}
                          {call.status === 'calling' && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Calling...
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No leads with phone numbers</p>
                  <p className="text-xs text-muted-foreground">Search for leads with phone numbers to add them to your call queue</p>
                </div>
              )}
            </TabsContent>

            {/* Script Tab */}
            <TabsContent value="script" className="p-6">
              <AIScriptPreviewPanel
                searchQuery={searchQuery}
                searchLocation={searchLocation}
                selectedStrategy={selectedStrategy}
              />
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="p-6">
              {callStats.total > 0 ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-xl border bg-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="font-medium text-foreground">Success Rate</span>
                      </div>
                      <div className="text-3xl font-bold text-emerald-500">
                        {callStats.total > 0 ? Math.round((callStats.answered / callStats.total) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {callStats.answered} answered / {callStats.total} total
                      </p>
                    </div>

                    <div className="p-6 rounded-xl border bg-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">Interest Rate</span>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {callStats.answered > 0 ? Math.round((callStats.interested / callStats.answered) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {callStats.interested} interested / {callStats.answered} answered
                      </p>
                    </div>

                    <div className="p-6 rounded-xl border bg-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="font-medium text-foreground">Avg Duration</span>
                      </div>
                      <div className="text-3xl font-bold text-foreground">
                        {callStats.avgDuration}s
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per answered call
                      </p>
                    </div>
                  </div>

                  {/* Interested Leads */}
                  {callQueue.filter(c => c.outcome === 'Interested').length > 0 && (
                    <div className="rounded-xl border bg-card p-4">
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Hot Leads
                      </h4>
                      <div className="space-y-2">
                        {callQueue.filter(c => c.outcome === 'Interested').map(lead => (
                          <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <div>
                              <p className="font-medium text-foreground">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.phone}</p>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-600">Interested</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No call results yet</p>
                  <p className="text-xs text-muted-foreground">Start calling to see your results here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PhoneNumberSetupModal 
        open={showPhoneModal} 
        onOpenChange={setShowPhoneModal}
      />
    </>
  );
}
