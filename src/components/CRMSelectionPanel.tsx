import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, Check, ExternalLink, HelpCircle, Loader2, Link2, Clock } from 'lucide-react';
import { connectCRM, getCRMStatus, CRMProvider } from '@/lib/api/crmIntegration';

interface CRMOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isBuiltIn?: boolean;
  trialDays?: number;
  hasOAuth?: boolean;
}

const CRM_OPTIONS: CRMOption[] = [
  { id: 'bamlead', name: 'BAMLEAD CRM', icon: '🎯', description: 'Built-in CRM (14-day free trial)', isBuiltIn: true, trialDays: 14 },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', description: 'Export as contacts with company', hasOAuth: true },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'Create leads with full info', hasOAuth: true },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', description: 'Add to your pipeline', hasOAuth: true },
  { id: 'zoho', name: 'Zoho CRM', icon: '🔴', description: 'Sync to Zoho modules' },
  { id: 'freshsales', name: 'Freshsales', icon: '🍊', description: 'Add contacts and accounts' },
  { id: 'close', name: 'Close', icon: '📞', description: 'Create leads in Close' },
  { id: 'monday', name: 'Monday.com', icon: '📋', description: 'Add items to boards' },
  { id: 'airtable', name: 'Airtable', icon: '📊', description: 'Add records to base' },
  { id: 'notion', name: 'Notion', icon: '📝', description: 'Create database entries' },
  { id: 'systeme', name: 'Systeme.io', icon: '🚀', description: 'Add to funnels' },
];

interface CRMSelectionPanelProps {
  leadCount: number;
  onCRMSelected?: (crmId: string) => void;
}

export default function CRMSelectionPanel({ leadCount, onCRMSelected }: CRMSelectionPanelProps) {
  const [selectedCRM, setSelectedCRM] = useState<string>(() => {
    return localStorage.getItem('bamlead_selected_crm') || 'bamlead';
  });
  const [connectingCRM, setConnectingCRM] = useState<string | null>(null);
  const [connectedCRMs, setConnectedCRMs] = useState<Record<string, boolean>>({});

  // Check CRM connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getCRMStatus();
        if (status.success && status.connections) {
          const connected: Record<string, boolean> = {};
          Object.entries(status.connections).forEach(([provider, conn]) => {
            connected[provider] = conn.connected;
          });
          setConnectedCRMs(connected);
        }
      } catch (error) {
        console.error('Failed to check CRM status:', error);
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('bamlead_selected_crm', selectedCRM);
  }, [selectedCRM]);

  const handleSelectCRM = (crmId: string) => {
    setSelectedCRM(crmId);
    const crm = CRM_OPTIONS.find(c => c.id === crmId);
    toast.success(`${crm?.name} selected as your CRM`);
    onCRMSelected?.(crmId);
  };

  const handleConnectOAuth = async (crmId: string) => {
    setConnectingCRM(crmId);
    try {
      const result = await connectCRM(crmId as CRMProvider);
      if (result.success) {
        toast.success(`${CRM_OPTIONS.find(c => c.id === crmId)?.name} authorization started`);
        // Check status after a delay to see if connection completed
        setTimeout(async () => {
          const status = await getCRMStatus();
          if (status.success && status.connections) {
            const connected: Record<string, boolean> = {};
            Object.entries(status.connections).forEach(([provider, conn]) => {
              connected[provider] = conn.connected;
            });
            setConnectedCRMs(connected);
          }
        }, 5000);
      } else if (result.requires_api_key) {
        toast.error(`${CRM_OPTIONS.find(c => c.id === crmId)?.name} requires API credentials to be configured on the server`);
      } else {
        toast.error(result.error || 'Failed to connect');
      }
    } catch (error) {
      toast.error('Connection failed. Please try again.');
    } finally {
      setConnectingCRM(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* BamLead CRM Free Trial Banner */}
      <Card className="border-l-4 border-l-amber-500 border-t-0 border-r-0 border-b-0 bg-gradient-to-r from-amber-500/15 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base">BamLead CRM - Free Trial</h3>
              <p className="text-sm text-muted-foreground">
                Your CRM is <span className="font-bold text-amber-500">FREE for 14 days</span>, then $29/month. External CRM integrations below are always free!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM Selection Header */}
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Choose Your CRM</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Select where you want to save your {leadCount} leads
      </p>

      {/* CRM Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CRM_OPTIONS.map((crm) => (
          <button
            key={crm.id}
            onClick={() => handleSelectCRM(crm.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-105 cursor-pointer
              ${selectedCRM === crm.id 
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                : 'border-border bg-card hover:border-primary/50'
              }`}
          >
            {/* Selected Checkmark */}
            {selectedCRM === crm.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            
            {/* Built-in Badge */}
            {crm.isBuiltIn && (
              <Badge className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5">
                Built-in
              </Badge>
            )}

            {/* Connected Badge */}
            {connectedCRMs[crm.id] && (
              <Badge className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                Connected
              </Badge>
            )}
            
            <div className="text-center">
              <div className="text-3xl mb-2 mt-2">{crm.icon}</div>
              <p className="font-semibold text-sm">{crm.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{crm.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* External CRM Integration Notice with OAuth */}
      {selectedCRM !== 'bamlead' && (
        <Card className="mt-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  External CRM Selected: {CRM_OPTIONS.find(c => c.id === selectedCRM)?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectedCRMs[selectedCRM] 
                    ? '✅ Connected and ready to sync leads' 
                    : 'Connect your account via OAuth to sync leads automatically.'
                  }
                </p>
              </div>
              {CRM_OPTIONS.find(c => c.id === selectedCRM)?.hasOAuth && !connectedCRMs[selectedCRM] && (
                <Button 
                  size="sm" 
                  onClick={() => handleConnectOAuth(selectedCRM)}
                  disabled={connectingCRM === selectedCRM}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
                >
                  {connectingCRM === selectedCRM ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Connect {CRM_OPTIONS.find(c => c.id === selectedCRM)?.name}
                    </>
                  )}
                </Button>
              )}
              {connectedCRMs[selectedCRM] && (
                <Badge className="bg-green-500 text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OAuth CRMs Quick Connect Section */}
      <Card className="mt-4 border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-500" />
            Quick Connect (OAuth)
          </h4>
          <div className="flex flex-wrap gap-2">
            {CRM_OPTIONS.filter(c => c.hasOAuth).map((crm) => (
              <Button
                key={crm.id}
                size="sm"
                variant={connectedCRMs[crm.id] ? "secondary" : "outline"}
                onClick={() => !connectedCRMs[crm.id] && handleConnectOAuth(crm.id)}
                disabled={connectingCRM === crm.id || connectedCRMs[crm.id]}
                className="gap-2"
              >
                {connectingCRM === crm.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : connectedCRMs[crm.id] ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <span>{crm.icon}</span>
                )}
                {crm.name}
                {connectedCRMs[crm.id] && <span className="text-green-500 text-xs">✓</span>}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click to authorize and connect your CRM accounts securely via OAuth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
