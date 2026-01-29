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
import { useSMTPConfig } from '@/hooks/useSMTPConfig';

export default function SMTPConfigPanel() {
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showTestEmailInput, setShowTestEmailInput] = useState(false);
  
  const {
    config,
    status,
    isTesting,
    isSendingTest,
    updateConfig,
    saveConfig,
    testConnection,
    sendTestEmail,
  } = useSMTPConfig();

  const handleSaveConfig = () => {
    saveConfig();
    toast.success('SMTP configuration saved!');
  };

  const handleTestConnection = async () => {
    const result = await testConnection();
    if (result.success) {
      toast.success('SMTP connection successful!', {
        description: 'Your email server is ready to send.'
      });
    } else {
      toast.error('SMTP connection failed', {
        description: result.error || 'Please check your credentials and try again.',
      });
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter a test email address');
      return;
    }
    
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
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.isConnected ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                {status.isConnected ? (
                  <Wifi className="w-6 h-6 text-emerald-500" />
                ) : (
                  <WifiOff className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {status.isConnected ? 'Connected' : 'Not Connected'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {status.isConnected 
                    ? 'Your SMTP server is configured and ready to send emails'
                    : 'Configure your SMTP settings to start sending emails'}
                </p>
              </div>
            </div>
            <Badge className={status.isConnected ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
              {status.isVerified ? 'Verified' : status.isConnected ? 'Connected' : 'Inactive'}
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
                value={config.host}
                onChange={(e) => updateConfig({ host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Port *</Label>
              <Input
                id="smtp-port"
                placeholder="465"
                value={config.port}
                onChange={(e) => updateConfig({ port: e.target.value })}
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
                value={config.username}
                onChange={(e) => updateConfig({ username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Password *</Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={config.password}
                  onChange={(e) => updateConfig({ password: e.target.value })}
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
                value={config.fromEmail}
                onChange={(e) => updateConfig({ fromEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="BamLead"
                value={config.fromName}
                onChange={(e) => updateConfig({ fromName: e.target.value })}
              />
            </div>
          </div>

          {/* Secure Connection */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div>
                <Label className="text-sm font-medium">Use SSL/TLS</Label>
                <p className="text-xs text-muted-foreground">Encrypt email transmission (recommended)</p>
              </div>
            </div>
            <Switch
              checked={config.secure}
              onCheckedChange={(v) => updateConfig({ secure: v })}
            />
          </div>

          {/* Test SMTP Section - Prominent */}
          <div className="p-4 rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-400">Test Your SMTP Before Sending</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Click below to verify your SMTP credentials work. If the test fails, double-check your host, port, username, and password.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={isTesting}
                className={`gap-2 ${
                  status.isVerified 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-amber-500 hover:bg-amber-600 text-black'
                }`}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : status.isVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    SMTP Verified ✓
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Test SMTP Connection
                  </>
                )}
              </Button>

              {status.isVerified && (
                <Button
                  variant="outline"
                  onClick={() => setShowTestEmailInput(!showTestEmailInput)}
                  className="gap-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Send className="w-4 h-4" />
                  Send Test Email
                </Button>
              )}
            </div>

            {/* Connection Result Feedback */}
            {!isTesting && !status.isConnected && config.username && config.password && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">SMTP Not Verified</p>
                  <p className="text-destructive/70">Click "Test SMTP Connection" to verify your credentials work.</p>
                </div>
              </div>
            )}

            {status.isVerified && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-400">SMTP Connection Verified!</p>
                  <p className="text-emerald-400/70">Your email server is ready to send outreach emails.</p>
                </div>
              </div>
            )}
          </div>

          {/* Test Email Input */}
          {showTestEmailInput && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Input
                type="email"
                placeholder="Enter your email to receive a test..."
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
                    Send Test
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleSaveConfig}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Common SMTP Settings</p>
              <ul className="text-muted-foreground space-y-1">
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
