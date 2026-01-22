import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2, 
  Server, Database, Mail, Key, Shield, Zap, Globe, Clock,
  Activity, Wrench, FileCode
} from 'lucide-react';
import { toast } from 'sonner';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'pending';
  message?: string;
  details?: string;
}

interface HealthResponse {
  status: string;
  version: string;
  deployed: string;
  checks: {
    api: boolean;
    php_version: string;
    timestamp: string;
    includes_exists: boolean;
    auth_exists: boolean;
    database_exists: boolean;
    config_exists: boolean;
    database_connected: boolean;
  };
}

interface CRMStatus {
  success: boolean;
  connections?: Record<string, {
    configured: boolean;
    connected: boolean;
    requires_api_key: boolean;
    migration_needed?: boolean;
  }>;
  migration_needed?: boolean;
  migration_sql?: string;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

export default function BackendHealthDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [crmStatus, setCrmStatus] = useState<CRMStatus | null>(null);
  const [checks, setChecks] = useState<HealthCheck[]>([]);

  const runHealthCheck = async () => {
    setIsLoading(true);
    const newChecks: HealthCheck[] = [];

    try {
      // Check main API health
      const healthRes = await fetch(`${API_BASE}/health.php`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealthData(data);
        
        newChecks.push({
          name: 'API Server',
          status: data.status === 'ok' ? 'ok' : 'error',
          message: data.status === 'ok' ? `v${data.version} running` : 'API not responding',
          details: `PHP ${data.checks?.php_version || 'unknown'}`
        });

        newChecks.push({
          name: 'Database Connection',
          status: data.checks?.database_connected ? 'ok' : 'error',
          message: data.checks?.database_connected ? 'MySQL connected' : 'Database offline',
        });

        newChecks.push({
          name: 'Config Files',
          status: data.checks?.config_exists ? 'ok' : 'warning',
          message: data.checks?.config_exists ? 'config.php found' : 'Config missing',
        });

        newChecks.push({
          name: 'Auth System',
          status: data.checks?.auth_exists ? 'ok' : 'error',
          message: data.checks?.auth_exists ? 'Auth module ready' : 'Auth module missing',
        });
      } else {
        newChecks.push({
          name: 'API Server',
          status: 'error',
          message: `HTTP ${healthRes.status}`,
        });
      }
    } catch (error) {
      newChecks.push({
        name: 'API Server',
        status: 'error',
        message: 'Connection failed',
        details: String(error)
      });
    }

    // Check CRM OAuth status
    try {
      const token = localStorage.getItem('auth_token');
      const crmRes = await fetch(`${API_BASE}/crm-oauth.php?action=status`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const crmData = await crmRes.json();
      setCrmStatus(crmData);
      
      if (crmData.success) {
        if (crmData.migration_needed) {
          newChecks.push({
            name: 'CRM Integration',
            status: 'warning',
            message: 'Database migration needed',
            details: crmData.migration_sql || 'Run crm_tokens.sql'
          });
        } else {
          const connectedCrms = Object.entries(crmData.connections || {})
            .filter(([_, v]) => (v as any).connected)
            .map(([k]) => k);
          
          newChecks.push({
            name: 'CRM Integration',
            status: connectedCrms.length > 0 ? 'ok' : 'warning',
            message: connectedCrms.length > 0 
              ? `${connectedCrms.length} CRM(s) connected` 
              : 'No CRMs connected',
            details: connectedCrms.join(', ') || 'Configure in settings'
          });
        }
      } else if (crmData.error) {
        newChecks.push({
          name: 'CRM Integration',
          status: 'error',
          message: crmData.error,
        });
      }
    } catch (error) {
      newChecks.push({
        name: 'CRM Integration',
        status: 'warning',
        message: 'Could not check CRM status',
      });
    }

    // Check email service
    try {
      const smtpConfig = localStorage.getItem('smtp_config');
      if (smtpConfig) {
        const config = JSON.parse(smtpConfig);
        newChecks.push({
          name: 'Email (SMTP)',
          status: config.username && config.password ? 'ok' : 'warning',
          message: config.host || 'Not configured',
          details: config.username ? `User: ${config.username}` : undefined
        });
      } else {
        newChecks.push({
          name: 'Email (SMTP)',
          status: 'warning',
          message: 'SMTP not configured',
          details: 'Configure in Mailbox settings'
        });
      }
    } catch {
      newChecks.push({
        name: 'Email (SMTP)',
        status: 'warning',
        message: 'Could not read config',
      });
    }

    // Check branding
    const brandingConfig = localStorage.getItem('email_branding');
    if (brandingConfig) {
      const branding = JSON.parse(brandingConfig);
      newChecks.push({
        name: 'Email Branding',
        status: branding.enabled && branding.logoUrl ? 'ok' : 'warning',
        message: branding.enabled ? 'Branding enabled' : 'Branding disabled',
        details: branding.logoUrl ? 'Logo uploaded' : 'No logo'
      });
    } else {
      newChecks.push({
        name: 'Email Branding',
        status: 'warning',
        message: 'Not configured',
        details: 'Upload logo in Mailbox'
      });
    }

    setChecks(newChecks);
    setLastChecked(new Date());
    setIsLoading(false);
    
    const errorCount = newChecks.filter(c => c.status === 'error').length;
    const warningCount = newChecks.filter(c => c.status === 'warning').length;
    
    if (errorCount > 0) {
      toast.error(`${errorCount} system error(s) detected`);
    } else if (warningCount > 0) {
      toast.warning(`${warningCount} warning(s) - review recommended`);
    } else {
      toast.success('All systems operational!');
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending': return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'ok': return <Badge className="bg-success/20 text-success border-success/40">Healthy</Badge>;
      case 'warning': return <Badge className="bg-warning/20 text-warning border-warning/40">Warning</Badge>;
      case 'error': return <Badge className="bg-destructive/20 text-destructive border-destructive/40">Error</Badge>;
      case 'pending': return <Badge variant="outline">Checking...</Badge>;
    }
  };

  const overallStatus = checks.some(c => c.status === 'error') 
    ? 'error' 
    : checks.some(c => c.status === 'warning') 
      ? 'warning' 
      : 'ok';

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              overallStatus === 'ok' ? 'bg-success/20' : 
              overallStatus === 'warning' ? 'bg-warning/20' : 'bg-destructive/20'
            }`}>
              <Activity className={`w-6 h-6 ${
                overallStatus === 'ok' ? 'text-success' : 
                overallStatus === 'warning' ? 'text-warning' : 'text-destructive'
              }`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Backend Health Dashboard
                {getStatusBadge(overallStatus)}
              </CardTitle>
              <CardDescription>
                {lastChecked 
                  ? `Last checked: ${lastChecked.toLocaleTimeString()}` 
                  : 'Checking system status...'}
              </CardDescription>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runHealthCheck}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Version Info */}
        {healthData && (
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Version {healthData.version}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Deployed: {new Date(healthData.deployed).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Health Checks */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {checks.map((check, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border transition-all ${
                  check.status === 'ok' ? 'bg-success/5 border-success/20' :
                  check.status === 'warning' ? 'bg-warning/5 border-warning/20' :
                  check.status === 'error' ? 'bg-destructive/5 border-destructive/20' :
                  'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium text-sm">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                  {check.details && (
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                      {check.details}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Migration Notice */}
        {crmStatus?.migration_needed && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Database Migration Required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Run the following SQL to enable CRM integrations:
                </p>
                <code className="block mt-2 p-2 bg-background rounded text-xs font-mono">
                  {crmStatus.migration_sql || 'Run api/database/crm_tokens.sql'}
                </code>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
