import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  HardDrive, CheckCircle2, XCircle, Loader2, ExternalLink,
  RefreshCw, Unlink, Settings, Bell, Shield,
  Download, Trash2, Mail, Database, ArrowLeft, Home, Palette
} from 'lucide-react';
import {
  checkGoogleDriveStatus,
  connectGoogleDrive,
  disconnectGoogleDrive
} from '@/lib/api/googleDrive';
import { useAuth } from '@/contexts/AuthContext';
import EmailConfigurationPanel from './EmailConfigurationPanel';
import CRMIntegrationModal from './CRMIntegrationModal';
import BackendHealthDashboard from './BackendHealthDashboard';
import BrandingSettingsPanel from './BrandingSettingsPanel';

interface SettingsPanelProps {
  initialTab?: string;
  onBackToStep4?: () => void;
  hideWebhooks?: boolean;
}

export default function SettingsPanel({ initialTab = 'integrations', onBackToStep4, hideWebhooks = false }: SettingsPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [driveConnected, setDriveConnected] = useState(false);
  const [isCheckingDrive, setIsCheckingDrive] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showCRMModal, setShowCRMModal] = useState(false);

  // Check Google Drive connection status on mount
  useEffect(() => {
    checkDriveStatus();
  }, []);

  const checkDriveStatus = async () => {
    setIsCheckingDrive(true);
    try {
      const status = await checkGoogleDriveStatus();
      setDriveConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Drive status:', error);
    } finally {
      setIsCheckingDrive(false);
    }
  };

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    try {
      const success = await connectGoogleDrive();
      if (success) {
        // Poll for connection status after OAuth
        setTimeout(() => {
          checkDriveStatus();
        }, 5000);
      }
    } catch (error) {
      toast.error('Failed to start Google Drive connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectDrive = async () => {
    setIsDisconnecting(true);
    try {
      const result = await disconnectGoogleDrive();
      if (result.success) {
        setDriveConnected(false);
        toast.success('Google Drive disconnected');
      } else {
        toast.error(result.error || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect Google Drive');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Buttons - ALWAYS VISIBLE */}
      <div className="flex items-center gap-2">
        {/* Primary Back Button - Always shows */}
        <Button
          variant="outline"
          onClick={() => {
            if (onBackToStep4) {
              onBackToStep4();
            } else {
              window.location.href = '/dashboard';
            }
          }}
          className="gap-2 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
        >
          <ArrowLeft className="w-4 h-4" />
          SMTP Setup
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, integrations, and email configuration</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
          <TabsTrigger 
            value="integrations" 
            className="gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger 
            value="branding" 
            className="gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger 
            value="email" 
            className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="account" 
            className="gap-2 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Cloud & CRM Integrations
              </CardTitle>
              <CardDescription>
                Connect external services to enhance your lead management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Drive */}
              <div className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Google Drive</h3>
                      {isCheckingDrive ? (
                        <Badge variant="outline" className="gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Checking...
                        </Badge>
                      ) : driveConnected ? (
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1">
                          <XCircle className="w-3 h-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Export verified leads directly to your Google Drive as spreadsheets
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {driveConnected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkDriveStatus}
                        disabled={isCheckingDrive}
                        className="gap-1"
                      >
                        <RefreshCw className={`w-4 h-4 ${isCheckingDrive ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnectDrive}
                        disabled={isDisconnecting}
                        className="gap-1"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleConnectDrive}
                      disabled={isConnecting || isCheckingDrive}
                      className="gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-4 h-4" />
                          Connect Google Drive
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* CRM Integrations */}
              <div className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">CRM Integrations</h3>
                      <Badge variant="secondary">10 Available</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect HubSpot, Salesforce, Pipedrive, Zoho, Systeme.io & more
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['🧡 HubSpot', '☁️ Salesforce', '🟢 Pipedrive', '🔴 Zoho', '🚀 Systeme.io'].map((crm) => (
                        <Badge key={crm} variant="outline" className="text-xs">
                          {crm}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">+5 more</Badge>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setShowCRMModal(true)} className="gap-2">
                  <Database className="w-4 h-4" />
                  Manage CRMs
                </Button>
              </div>

              {/* Info about integrations */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Why connect integrations?
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-primary/80">
                  <li>• Export verified leads with one click to your CRM</li>
                  <li>• Automatic data sync keeps everything up to date</li>
                  <li>• Share leads with your sales team instantly</li>
                  <li>• Track lead status across platforms</li>
                </ul>
              </div>

              {/* Backend Health Dashboard */}
              <BackendHealthDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <BrandingSettingsPanel />
        </TabsContent>

        {/* Email & SMTP Tab */}
        <TabsContent value="email">
          <EmailConfigurationPanel hideWebhooks={hideWebhooks} />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive updates about your leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates about new leads</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lead-alerts">Lead verification alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when AI verification completes</p>
                </div>
                <Switch id="lead-alerts" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-digest">Weekly digest</Label>
                  <p className="text-sm text-muted-foreground">Summary of your lead generation activity</p>
                </div>
                <Switch id="weekly-digest" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="outreach-notifications">Outreach notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified about email delivery and replies</p>
                </div>
                <Switch id="outreach-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account settings and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p className="text-sm text-muted-foreground">{user?.email || 'Not logged in'}</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Change Email
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Reset Tutorial</h4>
                  <p className="text-sm text-muted-foreground">Re-experience first-time popups and guides</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    localStorage.removeItem('bamlead_step2_visited');
                    localStorage.removeItem('bamlead_tour_completed');
                    toast.success('Tutorial reset! You\'ll see the welcome guides again.');
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Export All Data</h4>
                  <p className="text-sm text-muted-foreground">Download all your leads and settings</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30">
                <div>
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CRM Integration Modal */}
      <CRMIntegrationModal
        open={showCRMModal}
        onOpenChange={setShowCRMModal}
        leads={[]}
      />
    </div>
  );
}
