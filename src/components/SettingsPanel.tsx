import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  HardDrive, CheckCircle2, XCircle, Loader2, ExternalLink,
  RefreshCw, Unlink, Settings, Bell, Moon, Sun, Shield,
  Download, Upload, Trash2
} from 'lucide-react';
import {
  checkGoogleDriveStatus,
  connectGoogleDrive,
  disconnectGoogleDrive
} from '@/lib/api/googleDrive';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPanel() {
  const { user } = useAuth();
  const [driveConnected, setDriveConnected] = useState(false);
  const [isCheckingDrive, setIsCheckingDrive] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and integrations</p>
        </div>
      </div>

      {/* Integrations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Integrations
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
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Only accesses files created by BamLead</span>
                </div>
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

          {/* Info about Google Drive integration */}
          {!driveConnected && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Why connect Google Drive?
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                <li>• Export verified leads with one click</li>
                <li>• Automatic spreadsheet formatting</li>
                <li>• Access leads from anywhere</li>
                <li>• Share with your team easily</li>
              </ul>
            </div>
          )}

          <Separator />

          {/* More integrations coming soon */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-dashed opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-muted-foreground">More Integrations</h3>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Zapier, HubSpot, Salesforce, and more CRM integrations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
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
        </CardContent>
      </Card>

      {/* Account Section */}
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
    </div>
  );
}
