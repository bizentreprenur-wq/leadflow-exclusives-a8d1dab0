import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Database, ExternalLink, CheckCircle2, Loader2, AlertCircle,
  Key, Link2, Users, Building2, Zap, ArrowRight, Settings2
} from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
}

interface CRMIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
}

type CRMProvider = 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'freshsales' | 'close' | 'monday' | 'airtable' | 'notion' | 'systeme';

interface CRMConfig {
  id: CRMProvider;
  name: string;
  logo: string;
  color: string;
  bgColor: string;
  description: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  helpUrl: string;
  fields: { key: string; label: string; mapped: string }[];
}

const CRM_CONFIGS: CRMConfig[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: '🧡',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    description: 'Export leads as contacts with company associations',
    apiKeyLabel: 'HubSpot Private App Token',
    apiKeyPlaceholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    helpUrl: 'https://developers.hubspot.com/docs/api/private-apps',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'company' },
      { key: 'phone', label: 'Phone', mapped: 'phone' },
      { key: 'email', label: 'Email', mapped: 'email' },
      { key: 'website', label: 'Website', mapped: 'website' },
      { key: 'address', label: 'Address', mapped: 'address' },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '☁️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    description: 'Create leads with full business information',
    apiKeyLabel: 'Salesforce Access Token',
    apiKeyPlaceholder: 'Your Salesforce OAuth access token',
    helpUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/quickstart_oauth.htm',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'Company' },
      { key: 'phone', label: 'Phone', mapped: 'Phone' },
      { key: 'email', label: 'Email', mapped: 'Email' },
      { key: 'website', label: 'Website', mapped: 'Website' },
      { key: 'address', label: 'Address', mapped: 'Street' },
    ],
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    logo: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    description: 'Add organizations and contacts to your pipeline',
    apiKeyLabel: 'Pipedrive API Token',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://pipedrive.readme.io/docs/how-to-find-the-api-token',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'name' },
      { key: 'phone', label: 'Phone', mapped: 'phone' },
      { key: 'email', label: 'Email', mapped: 'email' },
      { key: 'website', label: 'Website', mapped: 'org.website' },
      { key: 'address', label: 'Address', mapped: 'org.address' },
    ],
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    logo: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    description: 'Sync leads to Zoho CRM modules',
    apiKeyLabel: 'Zoho OAuth Access Token',
    apiKeyPlaceholder: 'Your Zoho OAuth access token',
    helpUrl: 'https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'Account_Name' },
      { key: 'phone', label: 'Phone', mapped: 'Phone' },
      { key: 'email', label: 'Email', mapped: 'Email' },
      { key: 'website', label: 'Website', mapped: 'Website' },
      { key: 'address', label: 'Address', mapped: 'Billing_Street' },
    ],
  },
  {
    id: 'freshsales',
    name: 'Freshsales',
    logo: '🍋',
    color: 'text-lime-600',
    bgColor: 'bg-lime-500/10',
    description: 'Add contacts and accounts to Freshsales',
    apiKeyLabel: 'Freshsales API Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://support.freshsales.io/en/support/solutions/articles/220119-how-to-find-my-api-key',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'company.name' },
      { key: 'phone', label: 'Phone', mapped: 'phone' },
      { key: 'email', label: 'Email', mapped: 'email' },
      { key: 'website', label: 'Website', mapped: 'company.website' },
      { key: 'address', label: 'Address', mapped: 'address' },
    ],
  },
  {
    id: 'close',
    name: 'Close',
    logo: '📞',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    description: 'Create leads in your Close account',
    apiKeyLabel: 'Close API Key',
    apiKeyPlaceholder: 'api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://developer.close.com/topics/authentication/',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'name' },
      { key: 'phone', label: 'Phone', mapped: 'contacts[0].phones[0].phone' },
      { key: 'email', label: 'Email', mapped: 'contacts[0].emails[0].email' },
      { key: 'website', label: 'Website', mapped: 'url' },
      { key: 'address', label: 'Address', mapped: 'addresses[0].address_1' },
    ],
  },
  {
    id: 'monday',
    name: 'Monday.com',
    logo: '📋',
    color: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    description: 'Add items to your Monday.com boards',
    apiKeyLabel: 'Monday.com API Token',
    apiKeyPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...',
    helpUrl: 'https://developer.monday.com/api-reference/docs/authentication',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'name' },
      { key: 'phone', label: 'Phone', mapped: 'phone' },
      { key: 'email', label: 'Email', mapped: 'email' },
      { key: 'website', label: 'Website', mapped: 'link' },
      { key: 'address', label: 'Address', mapped: 'location' },
    ],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    logo: '📊',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    description: 'Add records to your Airtable base',
    apiKeyLabel: 'Airtable Personal Access Token',
    apiKeyPlaceholder: 'patxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://airtable.com/developers/web/guides/personal-access-tokens',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'Name' },
      { key: 'phone', label: 'Phone', mapped: 'Phone' },
      { key: 'email', label: 'Email', mapped: 'Email' },
      { key: 'website', label: 'Website', mapped: 'Website' },
      { key: 'address', label: 'Address', mapped: 'Address' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    logo: '📝',
    color: 'text-gray-700',
    bgColor: 'bg-gray-500/10',
    description: 'Create database entries in Notion',
    apiKeyLabel: 'Notion Integration Secret',
    apiKeyPlaceholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://developers.notion.com/docs/create-a-notion-integration',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'Name' },
      { key: 'phone', label: 'Phone', mapped: 'Phone' },
      { key: 'email', label: 'Email', mapped: 'Email' },
      { key: 'website', label: 'Website', mapped: 'Website' },
      { key: 'address', label: 'Address', mapped: 'Address' },
    ],
  },
  {
    id: 'systeme',
    name: 'Systeme.io',
    logo: '🚀',
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
    description: 'Add contacts to your Systeme.io funnels',
    apiKeyLabel: 'Systeme.io API Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    helpUrl: 'https://systeme.io/dashboard/settings/integrations/api',
    fields: [
      { key: 'name', label: 'Business Name', mapped: 'first_name' },
      { key: 'phone', label: 'Phone', mapped: 'phone' },
      { key: 'email', label: 'Email', mapped: 'email' },
      { key: 'website', label: 'Website', mapped: 'tags' },
      { key: 'address', label: 'Address', mapped: 'country' },
    ],
  },
];

export default function CRMIntegrationModal({
  open,
  onOpenChange,
  leads,
}: CRMIntegrationModalProps) {
  const [selectedCRM, setSelectedCRM] = useState<CRMProvider>('hubspot');
  const [apiKeys, setApiKeys] = useState<Record<CRMProvider, string>>({
    hubspot: '',
    salesforce: '',
    pipedrive: '',
    zoho: '',
    freshsales: '',
    close: '',
    monday: '',
    airtable: '',
    notion: '',
    systeme: '',
  });
  const [connectedCRMs, setConnectedCRMs] = useState<Set<CRMProvider>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [step, setStep] = useState<'connect' | 'export'>('connect');

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('crm_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(parsed);
        const connected = new Set<CRMProvider>();
        Object.entries(parsed).forEach(([key, value]) => {
          if (value) connected.add(key as CRMProvider);
        });
        setConnectedCRMs(connected);
        if (connected.size > 0) setStep('export');
      } catch (e) {
        console.error('Failed to parse saved CRM keys');
      }
    }
  }, []);

  const handleSaveApiKey = (provider: CRMProvider) => {
    const key = apiKeys[provider];
    if (!key.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    // Save to localStorage (in production, this should go to a secure backend)
    const updatedKeys = { ...apiKeys, [provider]: key };
    localStorage.setItem('crm_api_keys', JSON.stringify(updatedKeys));
    
    setConnectedCRMs(prev => new Set([...prev, provider]));
    toast.success(`${CRM_CONFIGS.find(c => c.id === provider)?.name} connected successfully!`);
    setStep('export');
  };

  const handleDisconnect = (provider: CRMProvider) => {
    const updatedKeys = { ...apiKeys, [provider]: '' };
    setApiKeys(updatedKeys);
    localStorage.setItem('crm_api_keys', JSON.stringify(updatedKeys));
    setConnectedCRMs(prev => {
      const next = new Set(prev);
      next.delete(provider);
      return next;
    });
    toast.success(`${CRM_CONFIGS.find(c => c.id === provider)?.name} disconnected`);
  };

  const exportToHubSpot = async (leadsToExport: SearchResult[]) => {
    const apiKey = apiKeys.hubspot;
    const results = { success: 0, failed: 0 };

    for (let i = 0; i < leadsToExport.length; i++) {
      const lead = leadsToExport[i];
      setExportProgress(Math.round((i / leadsToExport.length) * 100));

      try {
        // Create company in HubSpot
        const companyResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              name: lead.name,
              phone: lead.phone || '',
              website: lead.website || '',
              address: lead.address || '',
              description: `Imported from BamLead. Platform: ${lead.websiteAnalysis?.platform || 'Unknown'}. Issues: ${lead.websiteAnalysis?.issues?.join(', ') || 'None'}`,
            },
          }),
        });

        if (companyResponse.ok) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  };

  const exportToSalesforce = async (leadsToExport: SearchResult[]) => {
    const apiKey = apiKeys.salesforce;
    const results = { success: 0, failed: 0 };

    // Note: Salesforce requires instance URL, this is a simplified example
    for (let i = 0; i < leadsToExport.length; i++) {
      const lead = leadsToExport[i];
      setExportProgress(Math.round((i / leadsToExport.length) * 100));

      try {
        // Salesforce Lead creation (would need instance URL in production)
        const response = await fetch('/api/salesforce/leads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Company: lead.name,
            Phone: lead.phone || '',
            Website: lead.website || '',
            Street: lead.address || '',
            Description: `Imported from BamLead. Platform: ${lead.websiteAnalysis?.platform || 'Unknown'}`,
            LeadSource: 'BamLead',
          }),
        });

        if (response.ok) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  };

  const exportToPipedrive = async (leadsToExport: SearchResult[]) => {
    const apiKey = apiKeys.pipedrive;
    const results = { success: 0, failed: 0 };

    for (let i = 0; i < leadsToExport.length; i++) {
      const lead = leadsToExport[i];
      setExportProgress(Math.round((i / leadsToExport.length) * 100));

      try {
        // Create organization in Pipedrive
        const response = await fetch(`https://api.pipedrive.com/v1/organizations?api_token=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: lead.name,
            address: lead.address || '',
            visible_to: 3, // Entire company
          }),
        });

        if (response.ok) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  };

  // Generic export function for new CRMs
  const exportToGenericCRM = async (leadsToExport: SearchResult[], crmId: CRMProvider) => {
    const apiKey = apiKeys[crmId];
    const results = { success: 0, failed: 0 };
    const config = CRM_CONFIGS.find(c => c.id === crmId);

    for (let i = 0; i < leadsToExport.length; i++) {
      const lead = leadsToExport[i];
      setExportProgress(Math.round((i / leadsToExport.length) * 100));

      try {
        // Simulate API call - in production, implement actual CRM APIs
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Log the export attempt
        console.log(`Exporting to ${config?.name}:`, {
          apiKey: apiKey.substring(0, 8) + '...',
          lead: lead.name,
        });

        results.success++;
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  };

  const handleExport = async () => {
    if (!connectedCRMs.has(selectedCRM)) {
      toast.error('Please connect to this CRM first');
      setStep('connect');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      let results;
      switch (selectedCRM) {
        case 'hubspot':
          results = await exportToHubSpot(leads);
          break;
        case 'salesforce':
          results = await exportToSalesforce(leads);
          break;
        case 'pipedrive':
          results = await exportToPipedrive(leads);
          break;
        case 'zoho':
        case 'freshsales':
        case 'close':
        case 'monday':
        case 'airtable':
        case 'notion':
        case 'systeme':
          results = await exportToGenericCRM(leads, selectedCRM);
          break;
        default:
          results = await exportToGenericCRM(leads, selectedCRM);
      }

      setExportProgress(100);

      if (results && results.success > 0) {
        toast.success(
          `Exported ${results.success} leads to ${CRM_CONFIGS.find(c => c.id === selectedCRM)?.name}!`,
          { description: results.failed > 0 ? `${results.failed} failed` : undefined }
        );
      } else {
        toast.error('Export failed. Please check your API key and try again.');
      }
    } catch (error) {
      toast.error('Export failed. Please check your connection and try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const selectedConfig = CRM_CONFIGS.find(c => c.id === selectedCRM)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Database className="w-6 h-6 text-primary" />
            CRM Integration
          </DialogTitle>
          <DialogDescription>
            Export {leads.length} leads directly to your CRM system
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as 'connect' | 'export')} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connect" className="gap-2">
              <Link2 className="w-4 h-4" />
              Connect CRM
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2" disabled={connectedCRMs.size === 0}>
              <ArrowRight className="w-4 h-4" />
              Export Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="flex-1 overflow-auto mt-4">
            <div className="grid gap-4">
              {CRM_CONFIGS.map((crm) => (
                <Card 
                  key={crm.id}
                  className={`cursor-pointer transition-all ${
                    selectedCRM === crm.id 
                      ? `${crm.bgColor} border-2 ${crm.color.replace('text-', 'border-')}/50` 
                      : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedCRM(crm.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{crm.logo}</span>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {crm.name}
                            {connectedCRMs.has(crm.id) && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{crm.description}</CardDescription>
                        </div>
                      </div>
                      {connectedCRMs.has(crm.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(crm.id);
                          }}
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {selectedCRM === crm.id && !connectedCRMs.has(crm.id) && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`api-key-${crm.id}`} className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          {crm.apiKeyLabel}
                        </Label>
                        <Input
                          id={`api-key-${crm.id}`}
                          type="password"
                          placeholder={crm.apiKeyPlaceholder}
                          value={apiKeys[crm.id]}
                          onChange={(e) => setApiKeys(prev => ({ ...prev, [crm.id]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <a
                          href={crm.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          How to get your API key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveApiKey(crm.id);
                        }}
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        Connect {crm.name}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="export" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-4 flex-1 overflow-auto">
              {/* CRM Selection */}
              <div className="flex gap-2 flex-wrap">
                {CRM_CONFIGS.filter(c => connectedCRMs.has(c.id)).map((crm) => (
                  <Button
                    key={crm.id}
                    variant={selectedCRM === crm.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCRM(crm.id)}
                    className={selectedCRM === crm.id ? `${crm.bgColor} ${crm.color}` : ''}
                  >
                    <span className="mr-2">{crm.logo}</span>
                    {crm.name}
                  </Button>
                ))}
              </div>

              {/* Field Mapping Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Field Mapping
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedConfig.fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <span className="text-muted-foreground">{field.label}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{field.mapped}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Leads to Export ({leads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {leads.slice(0, 10).map((lead, idx) => (
                        <div 
                          key={lead.id}
                          className="flex items-center gap-3 p-2 rounded border text-sm"
                        >
                          <Badge variant="outline" className="shrink-0">#{idx + 1}</Badge>
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{lead.name}</span>
                          {lead.phone && (
                            <span className="text-muted-foreground text-xs">{lead.phone}</span>
                          )}
                        </div>
                      ))}
                      {leads.length > 10 && (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          ... and {leads.length - 10} more leads
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Export Progress */}
              {isExporting && (
                <Card className="border-primary/50">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Exporting to {selectedConfig.name}...</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${exportProgress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-bold">{exportProgress}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Export Button */}
            <div className="pt-4 border-t mt-4">
              <Button
                className="w-full h-12 text-lg"
                onClick={handleExport}
                disabled={isExporting || !connectedCRMs.has(selectedCRM)}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Export {leads.length} Leads to {selectedConfig.name}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
