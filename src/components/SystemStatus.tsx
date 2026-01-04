import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, Server, Database, Mail, FileCode, 
  CheckCircle2, XCircle, AlertTriangle, Clock
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';

interface HealthChecks {
  api: boolean;
  php_version: string;
  timestamp: string;
  includes_exists: boolean;
  auth_exists: boolean;
  database_exists: boolean;
  config_exists: boolean;
  database_connected: boolean;
  database_error?: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  checks: HealthChecks;
}

interface StatusItemProps {
  label: string;
  status: boolean | undefined;
  icon: React.ReactNode;
  detail?: string;
}

function StatusItem({ label, status, icon, detail }: StatusItemProps) {
  const isOk = status === true;
  const isError = status === false;
  const isUnknown = status === undefined;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isOk ? 'bg-emerald-500/10 text-emerald-500' :
          isError ? 'bg-destructive/10 text-destructive' :
          'bg-muted text-muted-foreground'
        }`}>
          {icon}
        </div>
        <div>
          <p className="font-medium">{label}</p>
          {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isOk && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        {isError && <XCircle className="w-5 h-5 text-destructive" />}
        {isUnknown && <AlertTriangle className="w-5 h-5 text-amber-500" />}
        <Badge variant={isOk ? 'default' : isError ? 'destructive' : 'secondary'} className={isOk ? 'bg-emerald-500' : ''}>
          {isOk ? 'OK' : isError ? 'Error' : 'Unknown'}
        </Badge>
      </div>
    </div>
  );
}

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/health.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        setHealth(data);
        setLastChecked(new Date());
      } catch {
        setError(`Invalid JSON response: ${text.slice(0, 100)}...`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const overallStatus = health?.status === 'ok' ? 'healthy' : 
    health?.status === 'degraded' ? 'degraded' : 
    error ? 'unreachable' : 'unknown';

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              System Status
            </CardTitle>
            <CardDescription>
              Real-time health checks from /api/health.php
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastChecked.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchHealth} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status Banner */}
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          overallStatus === 'healthy' ? 'bg-emerald-500/10 border border-emerald-500/30' :
          overallStatus === 'degraded' ? 'bg-amber-500/10 border border-amber-500/30' :
          'bg-destructive/10 border border-destructive/30'
        }`}>
          <div className="flex items-center gap-3">
            {overallStatus === 'healthy' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            {overallStatus === 'degraded' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
            {(overallStatus === 'unreachable' || overallStatus === 'unknown') && <XCircle className="w-6 h-6 text-destructive" />}
            <div>
              <p className="font-semibold">
                {overallStatus === 'healthy' && 'All Systems Operational'}
                {overallStatus === 'degraded' && 'System Degraded'}
                {overallStatus === 'unreachable' && 'API Unreachable'}
                {overallStatus === 'unknown' && 'Status Unknown'}
              </p>
              {health?.version && (
                <p className="text-sm text-muted-foreground">API Version: {health.version}</p>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <Badge 
            variant={overallStatus === 'healthy' ? 'default' : 'destructive'}
            className={overallStatus === 'healthy' ? 'bg-emerald-500' : overallStatus === 'degraded' ? 'bg-amber-500' : ''}
          >
            {overallStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Individual Checks */}
        {health?.checks && (
          <div className="grid gap-3">
            <StatusItem 
              label="API Endpoint"
              status={health.checks.api}
              icon={<Server className="w-4 h-4" />}
              detail={health.checks.php_version ? `PHP ${health.checks.php_version}` : undefined}
            />
            
            <StatusItem 
              label="Database Connection"
              status={health.checks.database_connected}
              icon={<Database className="w-4 h-4" />}
              detail={health.checks.database_error || (health.checks.database_connected ? 'MySQL connected' : 'Connection failed')}
            />
            
            <StatusItem 
              label="Configuration File"
              status={health.checks.config_exists}
              icon={<FileCode className="w-4 h-4" />}
              detail={health.checks.config_exists ? 'config.php loaded' : 'config.php missing'}
            />
            
            <StatusItem 
              label="Auth Module"
              status={health.checks.auth_exists}
              icon={<Mail className="w-4 h-4" />}
              detail={health.checks.auth_exists ? 'includes/auth.php found' : 'Auth module missing'}
            />
            
            <StatusItem 
              label="Core Includes"
              status={health.checks.includes_exists && health.checks.database_exists}
              icon={<FileCode className="w-4 h-4" />}
              detail="functions.php & database.php"
            />
          </div>
        )}

        {/* No Data State */}
        {!health && !error && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No health data available</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchHealth}>
              Check Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
