import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Cloud, Database, Link2, CheckCircle2, ExternalLink,
  Unlink, Settings2, RefreshCw, FileSpreadsheet, Users
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  description: string;
}

interface CloudCRMIntegrationsPanelProps {
  onManageCRMs?: () => void;
}

export default function CloudCRMIntegrationsPanel({ onManageCRMs }: CloudCRMIntegrationsPanelProps) {
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const crmIntegrations: Integration[] = [
    { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: 'bg-orange-500', connected: false, description: 'Export leads as contacts' },
    { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: 'bg-blue-500', connected: false, description: 'Sync to your Salesforce CRM' },
    { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', color: 'bg-green-500', connected: false, description: 'Add to your pipeline' },
    { id: 'zoho', name: 'Zoho', icon: '🔴', color: 'bg-red-500', connected: false, description: 'Connect Zoho CRM modules' },
    { id: 'systeme', name: 'Systeme.io', icon: '🚀', color: 'bg-violet-500', connected: false, description: 'Add to your funnels' },
  ];

  // Check for saved connections
  useEffect(() => {
    const driveToken = localStorage.getItem('google_drive_token');
    setGoogleDriveConnected(!!driveToken);
  }, []);

  const handleConnectGoogleDrive = async () => {
    setIsConnecting('google-drive');
    
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would redirect to Google OAuth
    localStorage.setItem('google_drive_token', 'demo_token_' + Date.now());
    setGoogleDriveConnected(true);
    setIsConnecting(null);
    toast.success('Google Drive connected successfully!');
  };

  const handleDisconnectGoogleDrive = () => {
    localStorage.removeItem('google_drive_token');
    setGoogleDriveConnected(false);
    toast.success('Google Drive disconnected');
  };

  const connectedCRMCount = crmIntegrations.filter(c => {
    const savedKeys = localStorage.getItem('crm_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        return !!parsed[c.id];
      } catch { return false; }
    }
    return false;
  }).length;

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Cloud & CRM Integrations</CardTitle>
            <CardDescription>
              Connect external services to enhance your lead management
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google Drive Integration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Google Drive</h3>
                {googleDriveConnected ? (
                  <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Connected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Export verified leads directly to your Google Drive as spreadsheets
              </p>
            </div>
          </div>
          
          {googleDriveConnected ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDisconnectGoogleDrive}>
                <Unlink className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleConnectGoogleDrive}
              disabled={isConnecting === 'google-drive'}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isConnecting === 'google-drive' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect Google Drive
            </Button>
          )}
        </motion.div>

        {/* CRM Integrations Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">CRM Integrations</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {connectedCRMCount > 0 ? `${connectedCRMCount} Connected` : '10 Available'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect HubSpot, Salesforce, Pipedrive, Zoho, Systeme.io & more
              </p>
              
              {/* CRM Icons Row */}
              <div className="flex items-center gap-2 mt-2">
                {crmIntegrations.slice(0, 5).map((crm) => (
                  <span 
                    key={crm.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                  >
                    <span className="text-sm">{crm.icon}</span>
                    {crm.name}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">+5 more</span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline"
            onClick={onManageCRMs}
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Manage CRMs
          </Button>
        </motion.div>

        {/* Why Connect Section */}
        <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-muted/10">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Why connect integrations?</h4>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Export verified leads with one click to your CRM
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Automatic data sync keeps everything up to date
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Share leads with your sales team instantly
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Track lead status across platforms
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
