/**
 * Telnyx Voice Provider Settings Panel
 * Configure Telnyx API credentials and phone numbers for AI calling
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Save, 
  ExternalLink,
  Loader2,
  TestTube,
  Settings,
  Key,
  PhoneCall,
  Mic,
  Volume2,
  Brain,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  getTelnyxConfig, 
  saveTelnyxConfig, 
  testTelnyxConnection,
  getTelnyxPhoneNumbers,
  type TelnyxConfig 
} from '@/lib/api/telnyx';

interface TelnyxVoiceSettingsProps {
  onBackToStep4?: () => void;
}

export default function TelnyxVoiceSettings({ onBackToStep4 }: TelnyxVoiceSettingsProps) {
  const [config, setConfig] = useState<TelnyxConfig>({
    api_key: '',
    connection_id: '',
    phone_number: '',
    voice: 'Polly.Brian',
    greeting_message: 'Hello! This is an AI assistant calling on behalf of our company. How can I help you today?',
    system_prompt: 'You are a helpful sales assistant. Be friendly, professional, and concise. Your goal is to qualify leads and schedule appointments.',
    enabled: false
  });
  const [savedConfig, setSavedConfig] = useState<TelnyxConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);

  // Available Telnyx TTS voices
  const voiceOptions = [
    { value: 'Polly.Brian', label: 'Brian (British Male)' },
    { value: 'Polly.Amy', label: 'Amy (British Female)' },
    { value: 'Polly.Matthew', label: 'Matthew (US Male)' },
    { value: 'Polly.Joanna', label: 'Joanna (US Female)' },
    { value: 'Polly.Joey', label: 'Joey (US Male)' },
    { value: 'Polly.Salli', label: 'Salli (US Female)' },
    { value: 'Polly.Ivy', label: 'Ivy (US Child Female)' },
    { value: 'Polly.Kendra', label: 'Kendra (US Female)' },
    { value: 'Polly.Kimberly', label: 'Kimberly (US Female)' },
  ];

  // Load saved config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const result = await getTelnyxConfig();
      if (result.success && result.config) {
        setConfig(result.config);
        setSavedConfig(result.config);
      }
    } catch (error) {
      console.error('Failed to load Telnyx config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhoneNumbers = async () => {
    if (!config.api_key) {
      toast.error('Please enter your API key first');
      return;
    }
    
    setIsLoadingNumbers(true);
    try {
      const result = await getTelnyxPhoneNumbers();
      if (result.success && result.phone_numbers) {
        setPhoneNumbers(result.phone_numbers);
        toast.success(`Found ${result.phone_numbers.length} phone numbers`);
      } else {
        toast.error(result.error || 'Failed to load phone numbers');
      }
    } catch (error) {
      toast.error('Failed to load phone numbers from Telnyx');
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const result = await saveTelnyxConfig(config);
      
      if (result.success) {
        setSavedConfig(config);
        toast.success('Telnyx configuration saved successfully!', {
          action: onBackToStep4 ? {
            label: '📞 Start Calling',
            onClick: onBackToStep4
          } : undefined
        });
      } else {
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.api_key) {
      toast.error('Please enter your API key first');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setTestMessage('');

    try {
      const result = await testTelnyxConnection(config);
      
      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message || 'Connection successful!');
        toast.success('Telnyx connection verified!');
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Connection failed');
        toast.error(result.error || 'Connection test failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Network error - could not reach server');
      toast.error('Could not verify Telnyx connection');
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = savedConfig?.api_key && savedConfig?.enabled;
  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

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
    <Card className="border-emerald-500/30 shadow-lg">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                Telnyx Voice Provider
                {isConfigured ? (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <XCircle className="w-3 h-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Configure Telnyx for AI-powered outbound voice calls with built-in STT/TTS
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credentials" className="gap-2">
              <Key className="w-4 h-4" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Settings
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="w-4 h-4" />
              AI Script
            </TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Enable Telnyx Calling</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on AI voice calling via Telnyx
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">Telnyx API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="KEY_..."
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Find your API key at{' '}
                <a 
                  href="https://portal.telnyx.com/#/app/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Telnyx Portal → API Keys
                </a>
              </p>
            </div>

            {/* Connection ID */}
            <div className="space-y-2">
              <Label htmlFor="connection-id">Connection ID (SIP Connection)</Label>
              <Input
                id="connection-id"
                placeholder="Enter your Telnyx Connection ID"
                value={config.connection_id}
                onChange={(e) => setConfig({ ...config, connection_id: e.target.value })}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Create a SIP connection at{' '}
                <a 
                  href="https://portal.telnyx.com/#/app/connections" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Telnyx Portal → Voice → SIP Connections
                </a>
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone-number">Outbound Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone-number"
                  placeholder="+1XXXXXXXXXX"
                  value={config.phone_number}
                  onChange={(e) => setConfig({ ...config, phone_number: e.target.value })}
                  className="font-mono flex-1"
                />
                <Button
                  variant="outline"
                  onClick={loadPhoneNumbers}
                  disabled={!config.api_key || isLoadingNumbers}
                  className="gap-2"
                >
                  {isLoadingNumbers ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Load
                </Button>
              </div>
              {phoneNumbers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {phoneNumbers.map((num) => (
                    <Badge 
                      key={num}
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setConfig({ ...config, phone_number: num })}
                    >
                      {num}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                The phone number calls will originate from
              </p>
            </div>

            {/* Test Connection */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!config.api_key || isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Test Connection
              </Button>
            </div>

            {/* Test Status */}
            {testStatus !== 'idle' && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                testStatus === 'success' 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {testStatus === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {testStatus === 'success' ? 'Connection Successful' : 'Connection Failed'}
                  </p>
                  <p className="text-sm opacity-80">{testMessage}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Voice Settings Tab */}
          <TabsContent value="voice" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="voice">TTS Voice</Label>
              <select
                id="voice"
                value={config.voice}
                onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {voiceOptions.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select the voice for your AI agent
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea
                id="greeting"
                placeholder="Hello! This is an AI assistant..."
                value={config.greeting_message}
                onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                The first message spoken when the call connects
              </p>
            </div>

            {/* Voice Preview */}
            <div className="bg-muted/50 border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4" />
                Voice Preview
              </h4>
              <p className="text-sm text-muted-foreground italic">
                "{config.greeting_message || 'Enter a greeting message to preview'}"
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Voice: {voiceOptions.find(v => v.value === config.voice)?.label}
              </p>
            </div>
          </TabsContent>

          {/* AI Script Tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="system-prompt">AI System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="You are a helpful sales assistant..."
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Instructions for how the AI should behave during calls
              </p>
            </div>

            {/* AI Behavior Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-3 text-primary">
                <Brain className="w-4 h-4" />
                Script Tips
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be specific about your company and offerings</li>
                <li>• Define clear goals (qualify lead, schedule meeting, etc.)</li>
                <li>• Include objection handling guidelines</li>
                <li>• Keep responses concise for natural conversation</li>
                <li>• Specify when to end the call or request callback</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <p className="text-sm text-muted-foreground">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <div className="flex gap-3">
            {onBackToStep4 && isConfigured && (
              <Button variant="outline" onClick={onBackToStep4} className="gap-2">
                <PhoneCall className="w-4 h-4" />
                Back to Calls
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <h4 className="font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            About Telnyx AI Calling
          </h4>
          <ul className="space-y-1 text-sm text-emerald-600 dark:text-emerald-400">
            <li>• <strong>Cost-effective:</strong> ~$0.007/min for calls + ~$1/mo per number</li>
            <li>• <strong>Built-in AI:</strong> Native STT and TTS, no external voice provider needed</li>
            <li>• <strong>LLM Integration:</strong> Connects to OpenAI for intelligent conversations</li>
            <li>• <strong>Call Recording:</strong> Optional call recording and transcription</li>
          </ul>
        </div>

        {/* Telnyx Link */}
        <div className="mt-4 flex items-center justify-between p-4 rounded-lg border bg-card">
          <div>
            <h4 className="font-medium">Need a Telnyx account?</h4>
            <p className="text-sm text-muted-foreground">
              Sign up and get $10 free credit to test calls
            </p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <a href="https://telnyx.com/sign-up" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Get Started
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
