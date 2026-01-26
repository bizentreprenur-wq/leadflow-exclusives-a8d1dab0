import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Mail,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  Send,
  Settings,
  Users,
  Phone,
  MessageSquare,
  TrendingUp,
  Download,
  FileText,
  ExternalLink,
  Sparkles,
  Shield,
} from 'lucide-react';

interface DeliverySettings {
  emailReports: boolean;
  emailAddress: string;
  reportFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  calendarSync: boolean;
  calendarProvider: 'google' | 'outlook' | 'apple';
  crmExport: boolean;
  crmProvider: string;
  notifyHotLeads: boolean;
  notifyMeetings: boolean;
  notifyResponses: boolean;
}

interface DeliveredResult {
  id: string;
  type: 'meeting' | 'response' | 'hot_lead' | 'qualification';
  leadName: string;
  businessName: string;
  details: string;
  timestamp: string;
  delivered: boolean;
  deliveryMethod: 'email' | 'calendar' | 'crm';
}

const DEFAULT_SETTINGS: DeliverySettings = {
  emailReports: true,
  emailAddress: '',
  reportFrequency: 'daily',
  calendarSync: true,
  calendarProvider: 'google',
  crmExport: false,
  crmProvider: '',
  notifyHotLeads: true,
  notifyMeetings: true,
  notifyResponses: true,
};

const DEMO_RESULTS: DeliveredResult[] = [
  {
    id: 'r1',
    type: 'meeting',
    leadName: 'John Smith',
    businessName: 'ABC Corp',
    details: 'Meeting scheduled for tomorrow at 2:00 PM',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    delivered: true,
    deliveryMethod: 'calendar',
  },
  {
    id: 'r2',
    type: 'response',
    leadName: 'Sarah Johnson',
    businessName: 'XYZ Inc',
    details: 'Replied: "Very interested, please send more info"',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    delivered: true,
    deliveryMethod: 'email',
  },
  {
    id: 'r3',
    type: 'hot_lead',
    leadName: 'Mike Davis',
    businessName: 'Tech Solutions',
    details: 'Clicked pricing page 3 times, opened all emails',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    delivered: true,
    deliveryMethod: 'email',
  },
  {
    id: 'r4',
    type: 'qualification',
    leadName: 'Emily Brown',
    businessName: 'Design Co',
    details: 'AI Call completed: Qualified for enterprise plan',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    delivered: true,
    deliveryMethod: 'crm',
  },
];

export default function AutomationResultsDelivery() {
  const [settings, setSettings] = useState<DeliverySettings>(() => {
    const saved = localStorage.getItem('automation_delivery_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [results, setResults] = useState<DeliveredResult[]>(DEMO_RESULTS);
  const [showSettings, setShowSettings] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('automation_delivery_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof DeliverySettings>(key: K, value: DeliverySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getResultIcon = (type: DeliveredResult['type']) => {
    switch (type) {
      case 'meeting': return Calendar;
      case 'response': return MessageSquare;
      case 'hot_lead': return TrendingUp;
      case 'qualification': return CheckCircle2;
      default: return Mail;
    }
  };

  const getResultColor = (type: DeliveredResult['type']) => {
    switch (type) {
      case 'meeting': return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      case 'response': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'hot_lead': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'qualification': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getDeliveryIcon = (method: DeliveredResult['deliveryMethod']) => {
    switch (method) {
      case 'email': return Mail;
      case 'calendar': return Calendar;
      case 'crm': return FileText;
      default: return Send;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            Results Delivery
          </h2>
          <p className="text-slate-400 text-sm">
            All results automatically delivered to your inbox and calendar
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Delivery Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`bg-slate-900 border-slate-800 ${settings.emailReports ? 'border-emerald-500/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Email Reports</span>
              </div>
              <Badge className={settings.emailReports ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}>
                {settings.emailReports ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {settings.reportFrequency === 'realtime' ? 'Instant notifications' :
               settings.reportFrequency === 'hourly' ? 'Hourly digest' :
               settings.reportFrequency === 'daily' ? 'Daily summary at 9 AM' :
               'Weekly report on Mondays'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900 border-slate-800 ${settings.calendarSync ? 'border-emerald-500/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-400" />
                <span className="font-medium text-white">Calendar Sync</span>
              </div>
              <Badge className={settings.calendarSync ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}>
                {settings.calendarSync ? 'Connected' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {settings.calendarSync 
                ? `Syncing with ${settings.calendarProvider === 'google' ? 'Google Calendar' : 
                   settings.calendarProvider === 'outlook' ? 'Outlook' : 'Apple Calendar'}`
                : 'Not connected'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900 border-slate-800 ${settings.crmExport ? 'border-emerald-500/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">CRM Export</span>
              </div>
              <Badge className={settings.crmExport ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}>
                {settings.crmExport ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {settings.crmExport && settings.crmProvider
                ? `Exporting to ${settings.crmProvider}`
                : 'No CRM connected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Delivery Settings</CardTitle>
              <CardDescription>Configure how and where results are delivered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Email Reports</Label>
                    <p className="text-sm text-slate-400">Receive results via email</p>
                  </div>
                  <Switch
                    checked={settings.emailReports}
                    onCheckedChange={(checked) => updateSetting('emailReports', checked)}
                  />
                </div>
                {settings.emailReports && (
                  <div className="grid md:grid-cols-2 gap-4 pl-4 border-l-2 border-slate-800">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email Address</Label>
                      <Input
                        type="email"
                        value={settings.emailAddress}
                        onChange={(e) => updateSetting('emailAddress', e.target.value)}
                        placeholder="your@email.com"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Frequency</Label>
                      <select
                        value={settings.reportFrequency}
                        onChange={(e) => updateSetting('reportFrequency', e.target.value as any)}
                        className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="realtime">Real-time (instant)</option>
                        <option value="hourly">Hourly digest</option>
                        <option value="daily">Daily summary</option>
                        <option value="weekly">Weekly report</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Calendar Sync</Label>
                    <p className="text-sm text-slate-400">Auto-schedule meetings</p>
                  </div>
                  <Switch
                    checked={settings.calendarSync}
                    onCheckedChange={(checked) => updateSetting('calendarSync', checked)}
                  />
                </div>
                {settings.calendarSync && (
                  <div className="pl-4 border-l-2 border-slate-800">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Calendar Provider</Label>
                      <select
                        value={settings.calendarProvider}
                        onChange={(e) => updateSetting('calendarProvider', e.target.value as any)}
                        className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="google">Google Calendar</option>
                        <option value="outlook">Microsoft Outlook</option>
                        <option value="apple">Apple Calendar</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <Label className="text-white">Instant Notifications</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-white">Hot Leads</span>
                    </div>
                    <Switch
                      checked={settings.notifyHotLeads}
                      onCheckedChange={(checked) => updateSetting('notifyHotLeads', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-white">Meetings</span>
                    </div>
                    <Switch
                      checked={settings.notifyMeetings}
                      onCheckedChange={(checked) => updateSetting('notifyMeetings', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-white">Responses</span>
                    </div>
                    <Switch
                      checked={settings.notifyResponses}
                      onCheckedChange={(checked) => updateSetting('notifyResponses', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-violet-500 hover:bg-violet-600"
                  onClick={() => {
                    toast.success('Delivery settings saved!');
                    setShowSettings(false);
                  }}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Results */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Recently Delivered Results
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {results.filter(r => r.delivered).length} delivered
            </Badge>
          </CardTitle>
          <CardDescription>Results automatically sent to your inbox and calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {results.map((result) => {
                const Icon = getResultIcon(result.type);
                const colorClass = getResultColor(result.type);
                const DeliveryIcon = getDeliveryIcon(result.deliveryMethod);
                return (
                  <div
                    key={result.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">
                          {result.leadName}
                          <span className="text-slate-400 font-normal"> - {result.businessName}</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                            <DeliveryIcon className="w-3 h-3 mr-1" />
                            {result.deliveryMethod}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{result.details}</p>
                      {result.delivered && (
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivered successfully
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Hands-Off Promise */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">100% Hands-Off Operation</h3>
              <p className="text-slate-400 text-sm mb-4">
                BamLead AI handles everything automatically. You'll only see qualified leads, scheduled
                meetings, and positive responses in your inbox. The AI does all the heavy lifting.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Auto Email Sequences
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Auto SMS Follow-ups
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  AI Voice Calls
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Calendar Sync
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
