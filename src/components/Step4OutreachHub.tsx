import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Phone, Calendar as CalendarIcon, Database, ArrowLeft, Home,
  CheckCircle2, ExternalLink, Clock, Users, Video, Link2,
  Sparkles, Info, AlertTriangle, Plus, Settings2, Send, Loader2, RefreshCw
} from 'lucide-react';
import { 
  connectGoogleCalendar, 
  checkGoogleCalendarStatus, 
  disconnectGoogleCalendar,
  listCalendarEvents,
  scheduleMeetingWithLead,
  CalendarEvent
} from '@/lib/api/googleCalendar';
import VoiceAgentSetupWizard from './VoiceAgentSetupWizard';

interface Lead {
  id?: string;
  email?: string;
  business_name?: string;
  name?: string;
  phone?: string;
  website?: string;
}

interface Step4OutreachHubProps {
  leads: Lead[];
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenCRMModal: () => void;
}

// All CRM options
const ALL_CRM_OPTIONS = [
  { id: 'bamlead', name: 'BAMLEAD CRM', icon: '🎯', color: 'from-emerald-500 to-teal-500', description: 'Built-in CRM (14-day free trial)', featured: true },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: 'from-orange-500 to-orange-600', description: 'Export as contacts with company' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: 'from-blue-500 to-blue-600', description: 'Create leads with full info' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', color: 'from-green-500 to-green-600', description: 'Add to your pipeline' },
  { id: 'zoho', name: 'Zoho CRM', icon: '🔴', color: 'from-red-500 to-red-600', description: 'Sync to Zoho modules' },
  { id: 'freshsales', name: 'Freshsales', icon: '🍋', color: 'from-lime-500 to-lime-600', description: 'Add contacts and accounts' },
  { id: 'close', name: 'Close', icon: '📞', color: 'from-indigo-500 to-indigo-600', description: 'Create leads in Close' },
  { id: 'monday', name: 'Monday.com', icon: '📋', color: 'from-pink-500 to-pink-600', description: 'Add items to boards' },
  { id: 'airtable', name: 'Airtable', icon: '📊', color: 'from-cyan-500 to-cyan-600', description: 'Add records to base' },
  { id: 'notion', name: 'Notion', icon: '📝', color: 'from-gray-500 to-gray-600', description: 'Create database entries' },
  { id: 'systeme', name: 'Systeme.io', icon: '🚀', color: 'from-violet-500 to-violet-600', description: 'Add to funnels' },
];

// Calendar options
const CALENDAR_OPTIONS = [
  { id: 'google', name: 'Google Calendar', icon: '📅', provider: 'Gmail, Google Workspace', color: 'from-blue-500 to-blue-600' },
  { id: 'outlook', name: 'Microsoft Outlook', icon: '📧', provider: 'Outlook, Office 365', color: 'from-cyan-500 to-cyan-600' },
  { id: 'apple', name: 'Apple Calendar', icon: '🍎', provider: 'iCloud Calendar', color: 'from-red-500 to-red-600' },
];

interface LocalMeeting {
  date: Date;
  leadName: string;
  type: string;
  googleEventId?: string;
}

export default function Step4OutreachHub({ 
  leads, 
  onBack, 
  onOpenSettings,
  onOpenCRMModal 
}: Step4OutreachHubProps) {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Check if Voice Agent is configured and if we should show wizard
  useEffect(() => {
    const savedAgentId = localStorage.getItem('elevenlabs_agent_id');
    const wizardCompleted = localStorage.getItem('bamlead_voice_wizard_completed');
    const wizardSkipped = localStorage.getItem('bamlead_voice_wizard_skipped');
    
    setAgentId(savedAgentId);
    
    // Show wizard if: no agent configured AND wizard not completed AND not skipped
    if (!savedAgentId && !wizardCompleted && !wizardSkipped) {
      setShowWizard(true);
    }
  }, []);
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<LocalMeeting[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [connectedCalendars, setConnectedCalendars] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bamlead_connected_calendars');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isScheduling, setIsScheduling] = useState<string | null>(null);

  const callableLeads = leads.filter(l => l.phone);
  const emailableLeads = leads.filter(l => l.email);

  // Check Google Calendar connection on mount and URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_connected') === 'true') {
      toast.success('Google Calendar connected successfully!');
      const newConnected = new Set([...connectedCalendars, 'google']);
      setConnectedCalendars(newConnected);
      localStorage.setItem('bamlead_connected_calendars', JSON.stringify([...newConnected]));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Load events
      loadGoogleEvents();
    }
    if (urlParams.get('calendar_error')) {
      toast.error(`Calendar connection failed: ${urlParams.get('calendar_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Check actual Google Calendar status
    checkGoogleCalendarStatus().then(status => {
      if (status.connected && !connectedCalendars.has('google')) {
        const newConnected = new Set([...connectedCalendars, 'google']);
        setConnectedCalendars(newConnected);
        localStorage.setItem('bamlead_connected_calendars', JSON.stringify([...newConnected]));
        loadGoogleEvents();
      } else if (!status.connected && connectedCalendars.has('google')) {
        const newConnected = new Set(connectedCalendars);
        newConnected.delete('google');
        setConnectedCalendars(newConnected);
        localStorage.setItem('bamlead_connected_calendars', JSON.stringify([...newConnected]));
      } else if (status.connected) {
        loadGoogleEvents();
      }
    });
  }, []);

  const loadGoogleEvents = async () => {
    setIsLoadingEvents(true);
    const result = await listCalendarEvents();
    if (result.success && result.events) {
      setGoogleEvents(result.events);
    }
    setIsLoadingEvents(false);
  };

  // Handle Calendar OAuth - Real for Google, simulated for others
  const handleConnectCalendar = async (calendarId: string) => {
    setIsConnecting(calendarId);
    
    if (calendarId === 'google') {
      // Real Google Calendar OAuth
      const success = await connectGoogleCalendar();
      if (!success) {
        setIsConnecting(null);
      }
      // Connection will be confirmed via URL callback
      setIsConnecting(null);
      return;
    }
    
    // Simulated for Outlook and Apple (show coming soon)
    const providerName = CALENDAR_OPTIONS.find(c => c.id === calendarId)?.name || 'Calendar';
    toast.info(`${providerName} integration coming soon! Currently only Google Calendar is fully supported.`, { duration: 4000 });
    setIsConnecting(null);
  };

  const handleDisconnectCalendar = async (calendarId: string) => {
    if (calendarId === 'google') {
      const result = await disconnectGoogleCalendar();
      if (result.success) {
        const newConnected = new Set(connectedCalendars);
        newConnected.delete(calendarId);
        setConnectedCalendars(newConnected);
        localStorage.setItem('bamlead_connected_calendars', JSON.stringify([...newConnected]));
        setGoogleEvents([]);
        toast.success('Google Calendar disconnected');
      } else {
        toast.error(result.error || 'Failed to disconnect');
      }
      return;
    }
    
    const newConnected = new Set(connectedCalendars);
    newConnected.delete(calendarId);
    setConnectedCalendars(newConnected);
    localStorage.setItem('bamlead_connected_calendars', JSON.stringify([...newConnected]));
    toast.success('Calendar disconnected');
  };

  const handleScheduleMeeting = async (lead: Lead) => {
    if (!selectedDate) {
      toast.error('Please select a date first');
      return;
    }
    
    const leadName = lead.business_name || lead.name || 'Unknown';
    setIsScheduling(lead.id || leadName);
    
    // If Google Calendar is connected, create real event
    if (connectedCalendars.has('google')) {
      const meetingTime = new Date(selectedDate);
      meetingTime.setHours(10, 0, 0, 0); // Default to 10 AM
      
      const result = await scheduleMeetingWithLead(
        leadName,
        lead.email,
        meetingTime,
        30,
        true
      );
      
      if (result.success) {
        setMeetings(prev => [...prev, {
          date: selectedDate,
          leadName,
          type: 'call',
          googleEventId: result.event?.id
        }]);
        // Refresh events
        loadGoogleEvents();
      }
    } else {
      // Local-only meeting
      setMeetings(prev => [...prev, {
        date: selectedDate,
        leadName,
        type: 'call'
      }]);
      toast.success(`Meeting scheduled with ${leadName}`);
      toast.info('Connect Google Calendar to sync meetings automatically', { duration: 3000 });
    }
    
    setIsScheduling(null);
  };

  const handleSelectCRM = (crmId: string) => {
    setSelectedCRM(crmId);
    if (crmId === 'bamlead') {
      toast.success('BAMLEAD CRM selected! Your 14-day free trial is active.');
    } else {
      onOpenCRMModal();
    }
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    setAgentId(localStorage.getItem('elevenlabs_agent_id'));
    toast.success('🎉 You can now make AI calls to your leads!');
  };

  const handleWizardSkip = () => {
    setShowWizard(false);
  };

  return (
    <>
      {/* Voice Agent Setup Wizard */}
      <AnimatePresence>
        {showWizard && (
          <VoiceAgentSetupWizard 
            onComplete={handleWizardComplete}
            onSkip={handleWizardSkip}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Back Buttons - Home and Previous */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Email
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 py-6 px-8 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10 rounded-2xl border border-green-500/30"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl">📞</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            STEP 4: Call, Schedule & Save
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          You have <span className="font-bold text-foreground">{leads.length} leads</span> ready. 
          Now you can <span className="text-green-500 font-semibold">📞 Call them</span>, 
          <span className="text-blue-500 font-semibold"> 📅 Schedule meetings</span>, or 
          <span className="text-purple-500 font-semibold"> 💾 Save to your CRM</span>!
        </p>
      </motion.div>

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Make Calls Card - Special handling for wizard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => {
            if (!agentId) {
              // No agent configured - show setup wizard
              setShowWizard(true);
            } else {
              setActiveTab('calls');
            }
          }}
        >
          <Card className={`h-full border-2 transition-all ${activeTab === 'calls' ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-primary/50'}`}>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">📞 Make Calls</h3>
              <p className="text-sm text-muted-foreground">Call leads with AI voice agent</p>
              <Badge className={`mt-3 ${agentId ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-amber-500/20 text-amber-600 border-amber-500/30 animate-pulse'}`}>
                {agentId ? 'Ready to call' : 'Setup required'}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setActiveTab('calendar')}
        >
          <Card className={`h-full border-2 transition-all ${activeTab === 'calendar' ? 'border-blue-500 bg-blue-500/5' : 'border-border hover:border-primary/50'}`}>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">📅 Schedule</h3>
              <p className="text-sm text-muted-foreground">Book meetings with your leads</p>
              <Badge className="mt-3 bg-blue-500/20 text-blue-600 border-blue-500/30">
                {meetings.length} meetings
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save to CRM Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => setActiveTab('crm')}
        >
          <Card className={`h-full border-2 transition-all ${activeTab === 'crm' ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-primary/50'}`}>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">💾 Save to CRM</h3>
              <p className="text-sm text-muted-foreground">Export leads to your favorite CRM</p>
              <Badge className="mt-3 bg-purple-500/20 text-purple-600 border-purple-500/30">
                11 CRMs available
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-muted/50 p-1">
          <TabsTrigger 
            value="overview" 
            className="gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white transition-all"
          >
            <Sparkles className="w-4 h-4" />Overview
          </TabsTrigger>
          <TabsTrigger 
            value="calls" 
            className="gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all"
          >
            <Phone className="w-4 h-4" />Calls
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all"
          >
            <CalendarIcon className="w-4 h-4" />Calendar
          </TabsTrigger>
          <TabsTrigger 
            value="crm" 
            className="gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all"
          >
            <Database className="w-4 h-4" />CRM
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Your Leads Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-3xl font-bold text-green-500">{callableLeads.length}</p>
                    <p className="text-sm text-muted-foreground">Ready to Call</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-3xl font-bold text-blue-500">{emailableLeads.length}</p>
                    <p className="text-sm text-muted-foreground">Have Email</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <p className="font-semibold text-amber-700 dark:text-amber-300">What happens next?</p>
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>📞 Call leads using AI voice agent</li>
                    <li>📅 Schedule follow-up meetings</li>
                    <li>💾 Save everything to your CRM</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
            <Card className={`border-2 ${agentId ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className={`w-5 h-5 ${agentId ? 'text-green-500' : 'text-amber-500'}`} />
                  Voice Agent Status
                  {agentId ? (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Setup Required
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-6">
                {agentId ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-green-600 mb-2">Voice Agent Configured!</h3>
                    <p className="text-sm text-muted-foreground mb-4">Your ElevenLabs agent is connected and ready to make calls</p>
                    <Button onClick={onOpenSettings} variant="outline" className="gap-2">
                      <Settings2 className="w-4 h-4" />
                      Manage Settings
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                      <Phone className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-amber-600 mb-2">Voice Agent Not Configured</h3>
                    <p className="text-sm text-muted-foreground mb-4">Connect your ElevenLabs agent to enable AI-powered calls</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button 
                        onClick={() => setShowWizard(true)} 
                        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      >
                        <Sparkles className="w-4 h-4" />
                        Setup Wizard
                      </Button>
                      <Button 
                        onClick={onOpenSettings} 
                        variant="outline"
                        className="gap-2"
                      >
                        <Settings2 className="w-4 h-4" />
                        Manual Setup
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calls */}
        <TabsContent value="calls" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-green-500" />Call Queue ({callableLeads.length} leads)</CardTitle>
                  <CardDescription>Click "Call" to start an AI-powered voice call</CardDescription>
                </div>
                <Button onClick={onOpenSettings} variant="outline" size="sm" className="gap-2"><Settings2 className="w-4 h-4" />Voice Settings</Button>
              </div>
            </CardHeader>
            <CardContent>
              {callableLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No leads with phone numbers</h3>
                  <p className="text-sm text-muted-foreground mb-4">Go back and select leads that have phone numbers</p>
                  <Button onClick={onBack} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to leads</Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {callableLeads.map((lead, index) => (
                      <motion.div
                        key={lead.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-green-500/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <span className="text-lg">{(lead.business_name || lead.name || 'B')[0]}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{lead.business_name || lead.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleScheduleMeeting(lead)} 
                            disabled={isScheduling === (lead.id || lead.business_name || lead.name)}
                            className="gap-1"
                          >
                            {isScheduling === (lead.id || lead.business_name || lead.name) ? (
                              <><Loader2 className="w-3 h-3 animate-spin" />Scheduling...</>
                            ) : (
                              <><CalendarIcon className="w-3 h-3" />Schedule</>
                            )}
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => toast.success(`Starting call to ${lead.business_name || lead.name}...`)}>
                            <Phone className="w-3 h-3" />Call Now
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-500" />Schedule Meetings</CardTitle>
                <CardDescription>Select a date and schedule meetings with your leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
                </div>
                {selectedDate && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      📅 Selected: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" />Connect Your Calendar</CardTitle>
                <CardDescription>Sync meetings with your calendar app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {CALENDAR_OPTIONS.map((cal) => {
                  const isConnected = connectedCalendars.has(cal.id);
                  const isLoading = isConnecting === cal.id;
                  
                  return (
                    <motion.div
                      key={cal.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isConnected 
                          ? 'border-success/50 bg-success/5 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {isConnected && <div className="absolute inset-0 bg-gradient-to-r from-success/10 via-transparent to-success/10 animate-shimmer" />}
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cal.color} flex items-center justify-center`}>
                          <span className="text-xl">{cal.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{cal.name}</p>
                            {isConnected && (
                              <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" />Connected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{cal.provider}</p>
                        </div>
                      </div>
                      {isConnected ? (
                        <Button variant="ghost" size="sm" onClick={() => handleDisconnectCalendar(cal.id)} className="text-muted-foreground hover:text-destructive relative z-10">
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleConnectCalendar(cal.id)} disabled={isLoading} className={`gap-1 relative z-10 ${cal.id === 'google' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                          {isLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Connecting...</> : <><Plus className="w-3 h-3" />Connect</>}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}

                {connectedCalendars.size === 0 ? (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">No calendars connected</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Connect at least one calendar to sync your meetings</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30 animate-glow-pulse">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success">{connectedCalendars.size} calendar{connectedCalendars.size > 1 ? 's' : ''} connected</p>
                        <p className="text-xs text-success/80">Meetings will automatically sync to your calendar</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Upcoming Meetings ({googleEvents.length + meetings.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {connectedCalendars.has('google') && (
                    <Button variant="outline" size="sm" onClick={loadGoogleEvents} disabled={isLoadingEvents} className="gap-1">
                      <RefreshCw className={`w-3 h-3 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1"><Plus className="w-3 h-3" />Add Event</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-muted-foreground">Loading calendar events...</p>
                </div>
              ) : googleEvents.length === 0 && meetings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No upcoming events</p>
                  <p className="text-sm text-muted-foreground">Schedule your first meeting with a lead</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Google Calendar Events */}
                  {googleEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          {event.hangoutLink ? <Video className="w-5 h-5 text-blue-500" /> : <CalendarIcon className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.start?.dateTime || event.start?.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.hangoutLink && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(event.hangoutLink, '_blank')} className="gap-1 text-blue-600">
                            <Video className="w-3 h-3" />Meet
                          </Button>
                        )}
                        <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />Synced
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {/* Local Meetings */}
                  {meetings.map((meeting, index) => (
                    <div key={`local-${index}`} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{meeting.leadName}</p>
                          <p className="text-xs text-muted-foreground">{meeting.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {meeting.googleEventId ? 'synced' : 'local only'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM */}
        <TabsContent value="crm" className="space-y-6">
          {/* BamLead CRM Trial Notice */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-glow-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-300">BAMLEAD CRM</h3>
                  <Badge className="bg-amber-500 text-white border-0">14-Day Free Trial</Badge>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  You're currently using BAMLEAD CRM. After 14 days, a subscription is required to continue using premium CRM features.
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10">
                <Info className="w-3 h-3" />Learn More
              </Button>
            </div>
          </motion.div>

          {/* CRM Selection Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-purple-500" />Choose Your CRM</CardTitle>
              <CardDescription>Select where you want to save your {leads.length} leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALL_CRM_OPTIONS.map((crm) => (
                  <motion.div
                    key={crm.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectCRM(crm.id)}
                    className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      selectedCRM === crm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    } ${crm.featured ? 'ring-2 ring-emerald-500/30' : ''}`}
                  >
                    {crm.featured && <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px]">Built-in</Badge>}
                    <div className="text-center">
                      <span className="text-3xl block mb-2">{crm.icon}</span>
                      <p className="font-semibold text-sm">{crm.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{crm.description}</p>
                    </div>
                    {selectedCRM === crm.id && <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-primary" /></div>}
                  </motion.div>
                ))}
              </div>

              {/* Export Button */}
              <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
                <div>
                  <p className="font-semibold">Ready to export {leads.length} leads</p>
                  <p className="text-sm text-muted-foreground">{selectedCRM ? `To ${ALL_CRM_OPTIONS.find(c => c.id === selectedCRM)?.name}` : 'Select a CRM above'}</p>
                </div>
                <Button disabled={!selectedCRM} onClick={() => {
                  if (selectedCRM === 'bamlead') {
                    toast.success(`${leads.length} leads saved to BAMLEAD CRM!`);
                  } else {
                    onOpenCRMModal();
                  }
                }} className="gap-2">
                  <Send className="w-4 h-4" />Export Leads
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* External CRMs Setup */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ExternalLink className="w-4 h-4" />Connect External CRMs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                To export leads to external CRMs like HubSpot, Salesforce, or Pipedrive, you'll need to connect your API keys.
              </p>
              <Button variant="outline" onClick={onOpenCRMModal} className="gap-2"><Settings2 className="w-4 h-4" />Manage CRM Connections</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
