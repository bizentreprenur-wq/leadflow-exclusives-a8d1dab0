import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Server, Eye, EyeOff, CheckCircle2, XCircle, Loader2, 
  Send, Shield, Key, AlertCircle, Wifi, WifiOff
} from 'lucide-react';

interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export default function SMTPConfigPanel() {
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showTestEmailInput, setShowTestEmailInput] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem('bamlead_smtp_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      host: 'smtp.hostinger.com',
      port: '465',
      username: '',
      password: '',
      fromEmail: 'noreply@bamlead.com',
      fromName: 'BamLead',
      secure: true,
    };
  });

  const saveSMTPConfig = () => {
    localStorage.setItem('bamlead_smtp_config', JSON.stringify(smtpConfig));
    toast.success('SMTP configuration saved!');
    setIsConnected(true);
  };

  const handleTestConnection = async () => {
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }
    
    setIsTesting(true);
    
    try {
      // Save config first
      localStorage.setItem('bamlead_smtp_config', JSON.stringify(smtpConfig));
      
      // Call real backend test
      const { testSMTPConnection } = await import('@/lib/emailService');
      const result = await testSMTPConnection(smtpConfig);
      
      if (result.success) {
        setIsConnected(true);
        toast.success('SMTP connection successful!', {
          description: result.message || 'Your email server is ready to send.'
        });
      } else {
        setIsConnected(false);
        toast.error('SMTP connection failed', {
          description: result.error || 'Please check your credentials and try again.',
        });
      }
    } catch (error: any) {
      setIsConnected(false);
      toast.error('SMTP connection failed', {
        description: error.message || 'Network error - check your connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter a test email address');
      return;
    }
    
    setIsSendingTest(true);
    
    try {
      // Use real backend
      const { sendTestEmail } = await import('@/lib/emailService');
      const result = await sendTestEmail(testEmailAddress);
      
      if (result.success) {
        toast.success('Test email sent!', {
          description: `Check ${testEmailAddress} for the test message.`,
        });
        setShowTestEmailInput(false);
        setTestEmailAddress('');
      } else {
        toast.error('Failed to send test email', {
          description: result.error || 'Please check your SMTP settings.',
        });
      }
    } catch (error: any) {
      toast.error('Failed to send test email', {
        description: error.message || 'Network error occurred.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {isConnected ? (
                  <Wifi className="w-6 h-6 text-emerald-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isConnected 
                    ? 'Your SMTP server is configured and ready to send emails'
                    : 'Configure your SMTP settings to start sending emails'}
                </p>
              </div>
            </div>
            <Badge className={isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
              {isConnected ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">SMTP Configuration</CardTitle>
              <CardDescription>Configure your email server for sending outreach emails</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Host and Port */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host *</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.hostinger.com"
                value={smtpConfig.host}
                onChange={(e) => setSMTPConfig(prev => ({ ...prev, host: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Port *</Label>
              <Input
                id="smtp-port"
                placeholder="465"
                value={smtpConfig.port}
                onChange={(e) => setSMTPConfig(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
          </div>

          {/* Username and Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-username">Username (Email) *</Label>
              <Input
                id="smtp-username"
                type="email"
                placeholder="noreply@bamlead.com"
                value={smtpConfig.username}
                onChange={(e) => setSMTPConfig(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Password *</Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={smtpConfig.password}
                  onChange={(e) => setSMTPConfig(prev => ({ ...prev, password: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* From Email and Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                placeholder="noreply@bamlead.com"
                value={smtpConfig.fromEmail}
                onChange={(e) => setSMTPConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="BamLead"
                value={smtpConfig.fromName}
                onChange={(e) => setSMTPConfig(prev => ({ ...prev, fromName: e.target.value }))}
              />
            </div>
          </div>

          {/* Secure Connection */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <Label className="text-sm font-medium">Use SSL/TLS</Label>
                <p className="text-xs text-slate-500">Encrypt email transmission for security</p>
              </div>
            </div>
            <Switch
              checked={smtpConfig.secure}
              onCheckedChange={(v) => setSMTPConfig(prev => ({ ...prev, secure: v }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              disabled={isTesting}
              className="gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Connected
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </Button>

            <Button
              onClick={saveSMTPConfig}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600"
            >
              Save Configuration
            </Button>

            {isConnected && (
              <Button
                variant="outline"
                onClick={() => setShowTestEmailInput(!showTestEmailInput)}
                className="gap-2 ml-auto"
              >
                <Send className="w-4 h-4" />
                Send Test Email
              </Button>
            )}
          </div>

          {/* Test Email Input */}
          {showTestEmailInput && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Input
                type="email"
                placeholder="Enter email for test..."
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmailAddress}
                className="gap-2 bg-emerald-500 hover:bg-emerald-600"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-slate-900 mb-1">Common SMTP Settings</p>
              <ul className="text-slate-600 space-y-1">
                <li><strong>Gmail:</strong> smtp.gmail.com, Port 587, TLS enabled</li>
                <li><strong>Hostinger:</strong> smtp.hostinger.com, Port 465, SSL enabled</li>
                <li><strong>Outlook:</strong> smtp.office365.com, Port 587, TLS enabled</li>
                <li><strong>SendGrid:</strong> smtp.sendgrid.net, Port 587, TLS enabled</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
