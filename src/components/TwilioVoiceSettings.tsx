/**
 * Twilio Voice Provider Settings Panel
 * Configure voice settings and AI scripts for AI calling
 * API credentials are managed server-side (global config)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Loader2,
  TestTube,
  PhoneCall,
  Volume2,
  Brain,
  AlertCircle,
} from 'lucide-react';
import { 
  getTwilioConfig, 
  saveTwilioConfig, 
  testTwilioConnection,
  type TwilioConfig 
} from '@/lib/api/twilio';

interface TwilioVoiceSettingsProps {
  onBackToStep4?: () => void;
}

export default function TwilioVoiceSettings({ onBackToStep4 }: TwilioVoiceSettingsProps) {
  const [config, setConfig] = useState<TwilioConfig>({
    phone_number: '',
    voice: 'Polly.Joanna',
    greeting_message: 'Hello! This is an AI assistant calling on behalf of our company. How can I help you today?',
    system_prompt: 'You are a helpful sales assistant. Be friendly, professional, and concise. Your goal is to qualify leads and schedule appointments.',
    enabled: false,
    provisioned: false,
    provision_status: 'none'
  });
  const [savedConfig, setSavedConfig] = useState<TwilioConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const voiceOptions = [
    { value: 'Polly.Joanna', label: 'Joanna (US Female - Default)' },
    { value: 'Polly.Matthew', label: 'Matthew (US Male)' },
    { value: 'Polly.Amy', label: 'Amy (British Female)' },
    { value: 'Polly.Brian', label: 'Brian (British Male)' },
    { value: 'Polly.Joey', label: 'Joey (US Male)' },
    { value: 'Polly.Salli', label: 'Salli (US Female)' },
    { value: 'alice', label: 'Alice (Default Twilio)' },
    { value: 'man', label: 'Man (Classic)' },
    { value: 'woman', label: 'Woman (Classic)' },
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const result = await getTwilioConfig();
      if (result.success && result.config) {
        setConfig(result.config);
        setSavedConfig(result.config);
      }
    } catch (error) {
      console.error('Failed to load Twilio config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveTwilioConfig(config);
      if (result.success) {
        setSavedConfig(config);
        toast.success('Voice configuration saved!', {
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
    setIsTesting(true);
    setTestStatus('idle');
    setTestMessage('');
    try {
      const result = await testTwilioConnection();
      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message || 'Connection successful!');
        toast.success('Twilio connection verified!');
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Connection failed');
        toast.error(result.error || 'Connection test failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Network error - could not reach server');
      toast.error('Could not verify Twilio connection');
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = savedConfig?.enabled && savedConfig?.provisioned;
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
                BamLead Voice Settings
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
                Configure your AI voice agent settings. API credentials are managed server-side.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue="voice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice" className="gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Settings
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="w-4 h-4" />
              AI Script
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Enable AI Calling</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on AI-powered outbound voice calls
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            {config.phone_number && (
              <div className="space-y-2">
                <Label>Your Phone Number</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono font-medium">{config.phone_number}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {config.provision_status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Managed via the AI Calling Hub. To change, release and provision a new number.
                </p>
              </div>
            )}

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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Test Server Connection
              </Button>
            </div>

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

        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <h4 className="font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            About BamLead Voice (Powered by Twilio)
          </h4>
          <ul className="space-y-1 text-sm text-emerald-600 dark:text-emerald-400">
            <li>• <strong>Industry standard:</strong> Trusted by millions of businesses worldwide</li>
            <li>• <strong>Reliable:</strong> 99.95% uptime SLA with global infrastructure</li>
            <li>• <strong>Scalable:</strong> Handle thousands of concurrent calls</li>
            <li>• <strong>Auto-provisioning:</strong> Get a phone number instantly from the AI Calling Hub</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
