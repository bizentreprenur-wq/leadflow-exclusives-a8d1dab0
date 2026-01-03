import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  version?: string;
  checks?: {
    api: boolean;
    php_version: string;
    timestamp: string;
    includes_exists: boolean;
    auth_exists: boolean;
    database_exists: boolean;
    config_exists: boolean;
    database_connected: boolean;
    database_error?: string;
  };
}

type ConnectionState = 'idle' | 'loading' | 'success' | 'error' | 'html-error';

export function BackendStatus() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  const testConnection = async () => {
    setState('loading');
    setHealth(null);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/health.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (!contentType.includes('application/json')) {
        setState('html-error');
        setErrorMessage(text.slice(0, 500));
        return;
      }

      const data: HealthCheck = JSON.parse(text);
      setHealth(data);
      setState(data.status === 'ok' ? 'success' : 'error');
    } catch (err: any) {
      setState('error');
      setErrorMessage(err.message || 'Unknown error');
    }
  };

  const getStatusIcon = () => {
    switch (state) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
      case 'html-error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Degraded</Badge>;
      case 'html-error':
        return <Badge variant="destructive">Not Found / 500</Badge>;
      case 'loading':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Backend Status</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-xs">
          API: {API_BASE_URL}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={state === 'loading'}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {state === 'loading' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>

        {state === 'html-error' && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm space-y-2">
            <p className="font-medium text-destructive">Backend returned HTML (not JSON)</p>
            <p className="text-muted-foreground text-xs">This usually means:</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li><code>health.php</code> is missing from <code>public_html/api/</code></li>
              <li>The <code>includes/</code> folder is missing or has wrong casing</li>
              <li>A PHP fatal error is occurring</li>
            </ul>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-2"
            >
              {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {expanded ? 'Hide' : 'Show'} Response
            </Button>
            {expanded && (
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                {errorMessage || 'No response body'}
              </pre>
            )}
          </div>
        )}

        {state === 'error' && health && (
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm space-y-2">
            <p className="font-medium text-yellow-600">Backend is degraded</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {!health.checks?.includes_exists && <li>❌ Missing: includes/functions.php</li>}
              {!health.checks?.auth_exists && <li>❌ Missing: includes/auth.php</li>}
              {!health.checks?.database_exists && <li>❌ Missing: includes/database.php</li>}
              {!health.checks?.config_exists && <li>❌ Missing: config.php</li>}
              {!health.checks?.database_connected && (
                <li>❌ Database not connected{health.checks?.database_error ? `: ${health.checks.database_error}` : ''}</li>
              )}
            </ul>
          </div>
        )}

        {state === 'success' && health && (
          <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm space-y-1">
            <p className="font-medium text-green-600">All systems operational</p>
            <p className="text-xs text-muted-foreground">
              PHP {health.checks?.php_version} • v{health.version}
            </p>
          </div>
        )}

        {state === 'error' && !health && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Connection failed</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
