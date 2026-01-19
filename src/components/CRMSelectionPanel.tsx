import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, Check, ExternalLink, HelpCircle } from 'lucide-react';

interface CRMOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isBuiltIn?: boolean;
  trialDays?: number;
}

const CRM_OPTIONS: CRMOption[] = [
  { id: 'bamlead', name: 'BAMLEAD CRM', icon: '🎯', description: 'Built-in CRM (14-day free trial)', isBuiltIn: true, trialDays: 14 },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', description: 'Export as contacts with company' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'Create leads with full info' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', description: 'Add to your pipeline' },
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

  useEffect(() => {
    localStorage.setItem('bamlead_selected_crm', selectedCRM);
  }, [selectedCRM]);

  const handleSelectCRM = (crmId: string) => {
    setSelectedCRM(crmId);
    const crm = CRM_OPTIONS.find(c => c.id === crmId);
    toast.success(`${crm?.name} selected as your CRM`);
    onCRMSelected?.(crmId);
  };

  return (
    <div className="space-y-4">
      {/* BAMLEAD CRM Banner */}
      <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/10 to-emerald-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">BAMLEAD CRM</h3>
                  <Badge className="bg-amber-500 text-white text-xs">14-Day Free Trial</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're currently using BAMLEAD CRM. After 14 days, a subscription is required to continue using premium CRM features.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Learn More
            </Button>
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
            
            <div className="text-center">
              <div className="text-3xl mb-2 mt-2">{crm.icon}</div>
              <p className="font-semibold text-sm">{crm.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{crm.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* External CRM Integration Notice */}
      {selectedCRM !== 'bamlead' && (
        <Card className="mt-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">
                External CRM Selected: {CRM_OPTIONS.find(c => c.id === selectedCRM)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                You'll need to connect your account via OAuth to sync leads automatically.
              </p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto">
              Connect Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
