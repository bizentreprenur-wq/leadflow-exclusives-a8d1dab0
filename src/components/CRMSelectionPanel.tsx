import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Database, Check, ExternalLink, Loader2, Link2, Clock, AlertCircle, Unplug } from 'lucide-react';
import {
  connectCRM,
  disconnectCRM,
  getCRMStatus,
  saveCRMApiKey,
  CRMProvider,
  CRMConnection,
} from '@/lib/api/crmIntegration';

type CRMOptionId =
  | 'bamlead'
  | 'hubspot'
  | 'salesforce'
  | 'pipedrive'
  | 'zoho'
  | 'freshsales'
  | 'close'
  | 'monday'
  | 'airtable'
  | 'notion'
  | 'systeme';

interface CRMOption {
  id: CRMOptionId;
  name: string;
  icon: string;
  description: string;
  isBuiltIn?: boolean;
  trialDays?: number;
  hasOAuth?: boolean;
  supportsApiKey?: boolean;
  requiresInstanceUrl?: boolean;
  instanceUrlLabel?: string;
  supported: boolean;
}

const SUPPORTED_PROVIDERS: CRMProvider[] = ['hubspot', 'salesforce', 'pipedrive'];

const CRM_OPTIONS: CRMOption[] = [
  { id: 'bamlead', name: 'BAMLEAD CRM', icon: '🎯', description: 'Built-in CRM (14-day free trial)', isBuiltIn: true, trialDays: 14, supported: true },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', description: 'Export as contacts with company', hasOAuth: true, supportsApiKey: true, supported: true },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'Create leads with full info', hasOAuth: true, supportsApiKey: true, requiresInstanceUrl: true, instanceUrlLabel: 'Instance URL (optional)', supported: true },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', description: 'Add to your pipeline', hasOAuth: true, supportsApiKey: true, requiresInstanceUrl: true, instanceUrlLabel: 'API domain (optional)', supported: true },
  { id: 'zoho', name: 'Zoho CRM', icon: '🔴', description: 'Not wired in backend yet', supported: false },
  { id: 'freshsales', name: 'Freshsales', icon: '🍊', description: 'Not wired in backend yet', supported: false },
  { id: 'close', name: 'Close', icon: '📞', description: 'Not wired in backend yet', supported: false },
  { id: 'monday', name: 'Monday.com', icon: '📋', description: 'Not wired in backend yet', supported: false },
  { id: 'airtable', name: 'Airtable', icon: '📊', description: 'Not wired in backend yet', supported: false },
  { id: 'notion', name: 'Notion', icon: '📝', description: 'Not wired in backend yet', supported: false },
  { id: 'systeme', name: 'Systeme.io', icon: '🚀', description: 'Not wired in backend yet', supported: false },
];

interface CRMSelectionPanelProps {
  leadCount: number;
  onCRMSelected?: (crmId: string) => void;
}

function isSupportedProvider(provider: string): provider is CRMProvider {
  return SUPPORTED_PROVIDERS.includes(provider as CRMProvider);
}

export default function CRMSelectionPanel({ leadCount, onCRMSelected }: CRMSelectionPanelProps) {
  const [selectedCRM, setSelectedCRM] = useState<string>(() => {
    return localStorage.getItem('bamlead_selected_crm') || 'bamlead';
  });
  const [connectingCRM, setConnectingCRM] = useState<string | null>(null);
  const [disconnectingCRM, setDisconnectingCRM] = useState<string | null>(null);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [connectedCRMs, setConnectedCRMs] = useState<Record<string, boolean>>({});
  const [connections, setConnections] = useState<Partial<Record<CRMProvider, CRMConnection>>>({});
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [instanceUrlValue, setInstanceUrlValue] = useState('');

  const externalCRMRef = useRef<HTMLDivElement>(null);

  const selectedOption = CRM_OPTIONS.find((c) => c.id === selectedCRM) || CRM_OPTIONS[0];
  const selectedConnection = isSupportedProvider(selectedCRM) ? connections[selectedCRM] : undefined;
  const selectedConnected = Boolean(connectedCRMs[selectedCRM]);
  const requiresApiKey = Boolean(selectedConnection?.requires_api_key);

  const refreshCRMStatus = async (showToast = false) => {
    setRefreshingStatus(true);
    try {
      const status = await getCRMStatus();
      if (!status.success || !status.connections) {
        if (showToast) {
          toast.error(status.error || 'Failed to refresh CRM status');
        }
        return;
      }

      const nextConnected: Record<string, boolean> = {};
      const nextConnections: Partial<Record<CRMProvider, CRMConnection>> = {};
      Object.entries(status.connections).forEach(([provider, conn]) => {
        nextConnected[provider] = conn.connected;
        if (isSupportedProvider(provider)) {
          nextConnections[provider] = conn;
        }
      });

      setConnections(nextConnections);
      setConnectedCRMs(nextConnected);
      setMigrationNeeded(Boolean(status.migration_needed));
      setMigrationHint(status.migration_sql || null);

      if (showToast) {
        toast.success('CRM status refreshed');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Failed to refresh CRM status');
      }
    } finally {
      setRefreshingStatus(false);
    }
  };

  useEffect(() => {
    void refreshCRMStatus(false);
  }, []);

  useEffect(() => {
    if (!selectedOption.supported && !selectedOption.isBuiltIn) {
      setSelectedCRM('bamlead');
      return;
    }
    localStorage.setItem('bamlead_selected_crm', selectedCRM);
  }, [selectedCRM, selectedOption.supported, selectedOption.isBuiltIn]);

  const handleSelectCRM = (crmId: string) => {
    const crm = CRM_OPTIONS.find((c) => c.id === crmId);
    if (!crm) return;

    if (!crm.supported && !crm.isBuiltIn) {
      toast.info(`${crm.name} is not wired in the backend yet.`);
      return;
    }

    setSelectedCRM(crmId);
    toast.success(`${crm.name} selected as your CRM`);
    onCRMSelected?.(crmId);

    if (crmId !== 'bamlead') {
      setTimeout(() => {
        externalCRMRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleConnectOAuth = async (crmId: string) => {
    if (!isSupportedProvider(crmId)) return;
    setConnectingCRM(crmId);
    try {
      const result = await connectCRM(crmId);
      if (result.success) {
        toast.success(`${CRM_OPTIONS.find((c) => c.id === crmId)?.name} authorization started`);
        window.setTimeout(() => {
          void refreshCRMStatus(false);
        }, 5000);
      } else if (result.requires_api_key) {
        toast.info(`${CRM_OPTIONS.find((c) => c.id === crmId)?.name} needs API credentials.`);
      } else {
        toast.error(result.error || 'Failed to connect');
      }
    } catch (error) {
      toast.error('Connection failed. Please try again.');
    } finally {
      setConnectingCRM(null);
    }
  };

  const handleSaveApiCredentials = async () => {
    if (!isSupportedProvider(selectedCRM)) return;
    if (!apiKeyValue.trim()) {
      toast.error('API key is required');
      return;
    }

    setSavingApiKey(true);
    try {
      const result = await saveCRMApiKey(selectedCRM, apiKeyValue.trim(), instanceUrlValue.trim() || undefined);
      if (result.success) {
        toast.success(`${selectedOption.name} credentials saved`);
        setApiKeyValue('');
        void refreshCRMStatus(false);
      } else {
        toast.error(result.error || 'Failed to save API key');
      }
    } catch (error) {
      toast.error('Failed to save API credentials');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isSupportedProvider(selectedCRM)) return;
    setDisconnectingCRM(selectedCRM);
    try {
      const result = await disconnectCRM(selectedCRM);
      if (result.success) {
        toast.success(`${selectedOption.name} disconnected`);
        void refreshCRMStatus(false);
      } else {
        toast.error(result.error || 'Failed to disconnect CRM');
      }
    } catch (error) {
      toast.error('Failed to disconnect CRM');
    } finally {
      setDisconnectingCRM(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-amber-500 border-t-0 border-r-0 border-b-0 bg-gradient-to-r from-amber-500/15 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base">BamLead CRM - Free Trial</h3>
              <p className="text-sm text-muted-foreground">
                Your CRM is <span className="font-bold text-amber-500">FREE for 14 days</span>, then $29/month. External CRM integrations are free.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Choose Your CRM</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void refreshCRMStatus(true)}
          disabled={refreshingStatus}
        >
          {refreshingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Refresh Status
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Select where you want to save your {leadCount} leads
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CRM_OPTIONS.map((crm) => {
          const isConnected = Boolean(connectedCRMs[crm.id]);
          const isSelected = selectedCRM === crm.id;
          const isAvailable = crm.isBuiltIn || crm.supported;
          const connectionMeta = isSupportedProvider(crm.id) ? connections[crm.id] : null;

          return (
            <button
              key={crm.id}
              onClick={() => handleSelectCRM(crm.id)}
              disabled={!isAvailable}
              className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer
                ${isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/50'}
                ${!isAvailable ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {crm.isBuiltIn && (
                <Badge className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5">
                  Built-in
                </Badge>
              )}

              {isConnected && (
                <Badge className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                  Connected
                </Badge>
              )}

              {!crm.supported && !crm.isBuiltIn && (
                <Badge variant="outline" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">
                  Roadmap
                </Badge>
              )}

              {crm.supported && !crm.isBuiltIn && connectionMeta && !connectionMeta.configured && !isConnected && (
                <Badge variant="outline" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">
                  Server Setup
                </Badge>
              )}

              <div className="text-center">
                <div className="text-3xl mb-2 mt-2">{crm.icon}</div>
                <p className="font-semibold text-sm">{crm.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{crm.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedCRM !== 'bamlead' && (
        <div ref={externalCRMRef}>
          <Card className="mt-4 border-2 border-primary bg-gradient-to-r from-primary/20 to-violet-500/20 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                  {selectedOption.icon}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-foreground">{selectedOption.name} Selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOption.supported
                      ? (selectedConnected ? '✅ Connected and ready to sync your leads' : 'Set up authentication to enable exports')
                      : 'This provider is visible in UI but not wired in backend yet.'}
                  </p>
                </div>
                {selectedConnected && (
                  <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                    <Check className="w-4 h-4 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>

              {migrationNeeded && (
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    CRM token columns are missing in DB. Run: <code className="px-1 rounded bg-black/10">{migrationHint || 'api/database/crm_tokens.sql'}</code>
                  </div>
                </div>
              )}

              {!selectedOption.supported && (
                <div className="p-4 rounded-xl bg-muted/60 border border-border">
                  <div className="flex items-start gap-3">
                    <Unplug className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Not Wired Yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedOption.name} does not have backend export/auth handlers in this build.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOption.supported && !selectedConnected && requiresApiKey && (
                <div className="space-y-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">API credentials required</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    OAuth client credentials are not configured on server for this provider. Save an API key fallback.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="crm-api-key">API Key / Access Token</Label>
                    <Input
                      id="crm-api-key"
                      type="password"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      placeholder="Paste API key"
                    />
                  </div>
                  {selectedOption.requiresInstanceUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="crm-instance-url">{selectedOption.instanceUrlLabel || 'Instance URL'}</Label>
                      <Input
                        id="crm-instance-url"
                        value={instanceUrlValue}
                        onChange={(e) => setInstanceUrlValue(e.target.value)}
                        placeholder="https://your-instance.example.com"
                      />
                    </div>
                  )}
                  <Button
                    className="gap-2"
                    onClick={handleSaveApiCredentials}
                    disabled={savingApiKey || !apiKeyValue.trim()}
                  >
                    {savingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save API Credentials
                  </Button>
                </div>
              )}

              {selectedOption.supported && !selectedConnected && selectedOption.hasOAuth && selectedConnection?.configured && !requiresApiKey && (
                <Button
                  size="lg"
                  onClick={() => handleConnectOAuth(selectedCRM)}
                  disabled={connectingCRM === selectedCRM}
                  className="w-full gap-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {connectingCRM === selectedCRM ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting to {selectedOption.name}...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5" />
                      Connect {selectedOption.name} Account
                    </>
                  )}
                </Button>
              )}

              {selectedOption.supported && !selectedConnected && selectedOption.hasOAuth && selectedConnection && !selectedConnection.configured && !requiresApiKey && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Server OAuth credentials missing</p>
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                        Configure {selectedOption.name} OAuth credentials in backend `config.php` first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedConnected && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <Check className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-green-400">Ready to Sync!</p>
                        <p className="text-xs text-green-400/70">
                          Your {leadCount} leads will be exported to {selectedOption.name} when you proceed.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDisconnect}
                    disabled={disconnectingCRM === selectedCRM}
                  >
                    {disconnectingCRM === selectedCRM ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    Disconnect {selectedOption.name}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-4 border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-500" />
            Quick Connect (OAuth)
          </h4>
          <div className="flex flex-wrap gap-2">
            {CRM_OPTIONS.filter((c) => c.supported && c.hasOAuth).map((crm) => {
              const providerId = crm.id as CRMProvider;
              const providerConnection = connections[providerId];
              const isConnected = Boolean(connectedCRMs[providerId]);
              const disabled = connectingCRM === providerId || isConnected || !providerConnection?.configured;

              return (
                <Button
                  key={crm.id}
                  size="sm"
                  variant={isConnected ? 'secondary' : 'outline'}
                  onClick={() => !disabled && handleConnectOAuth(providerId)}
                  disabled={disabled}
                  className="gap-2"
                >
                  {connectingCRM === providerId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isConnected ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <span>{crm.icon}</span>
                  )}
                  {crm.name}
                  {!providerConnection?.configured && <span className="text-xs text-amber-500">setup needed</span>}
                  {isConnected && <span className="text-green-500 text-xs">✓</span>}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            OAuth providers are enabled only when backend credentials are configured.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
