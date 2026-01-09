import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, 
  Database, Mail, Search, CreditCard, FileCode,
  Server, Loader2, Copy, ExternalLink, Shield
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';

interface DiagnosticsResult {
  timestamp: string;
  php_version: string;
  overall_status: string;
  issues: string[];
  checks: {
    files: { status: string; details: Record<string, boolean> };
    config: { status: string; details: Record<string, boolean> };
    database: { status: string; details: { connected: boolean; tables: Record<string, boolean>; error?: string } };
    smtp: { status: string; details: { configured: boolean; reachable?: boolean; test_result?: string } };
    serpapi: { status: string; details: { configured: boolean; test_result?: string; searches_remaining?: number } };
    stripe: { status: string; details: { configured: boolean; mode?: string; api_reachable?: boolean } };
  };
}

export function SystemDiagnostics() {
  const [cronKey, setCronKey] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    if (!cronKey.trim()) {
      toast.error('Please enter your CRON_SECRET_KEY');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/diagnostics.php?key=${encodeURIComponent(cronKey)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (!contentType.includes('application/json')) {
        setError(`Backend returned HTML instead of JSON. This usually means diagnostics.php is missing or PHP has an error.\n\nResponse:\n${text.slice(0, 500)}`);
        setResults(null);
        return;
      }

      const data = JSON.parse(text);
      
      if (data.error) {
        setError(data.error);
        setResults(null);
      } else {
        setResults(data);
        toast.success('Diagnostics complete');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run diagnostics');
      setResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'missing':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-500">OK</Badge>;
      case 'error':
      case 'missing':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Incomplete</Badge>;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          System Diagnostics
        </CardTitle>
        <CardDescription>
          Comprehensive check of all backend systems
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* API URL */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <span className="text-muted-foreground">API URL: </span>
          <code className="text-foreground">{API_BASE_URL}</code>
        </div>

        {/* Cron Key Input */}
        <div className="space-y-2">
          <Label htmlFor="cron-key">CRON_SECRET_KEY (from config.php)</Label>
          <div className="flex gap-2">
            <Input
              id="cron-key"
              type="password"
              placeholder="Enter your CRON_SECRET_KEY"
              value={cronKey}
              onChange={(e) => setCronKey(e.target.value)}
            />
            <Button onClick={runDiagnostics} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive font-medium mb-2">Diagnostics Failed</p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto">
              {error}
            </pre>
          </div>
        )}

        {/* Results */}
        {results && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border ${
                results.overall_status === 'all_systems_go' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {results.overall_status === 'all_systems_go' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {results.overall_status === 'all_systems_go' 
                      ? '✅ All Systems Operational' 
                      : '⚠️ Some Issues Detected'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PHP {results.php_version} • {results.timestamp}
                </p>
              </div>

              {/* Issues List */}
              {results.issues.length > 0 && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-2">Issues to Fix:</p>
                  <ul className="text-xs space-y-1">
                    {results.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* File Structure */}
              <CheckSection
                icon={FileCode}
                title="File Structure"
                status={results.checks.files.status}
                getStatusBadge={getStatusBadge}
              >
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(results.checks.files.details).map(([file, exists]) => (
                    <div key={file} className="flex items-center gap-2 text-xs">
                      {exists ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive" />
                      )}
                      <code className="text-muted-foreground">{file}</code>
                    </div>
                  ))}
                </div>
              </CheckSection>

              {/* Config */}
              <CheckSection
                icon={Shield}
                title="Configuration"
                status={results.checks.config.status}
                getStatusBadge={getStatusBadge}
              >
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(results.checks.config.details).map(([key, set]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {set ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive" />
                      )}
                      <code className="text-muted-foreground">{key}</code>
                    </div>
                  ))}
                </div>
              </CheckSection>

              {/* Database */}
              <CheckSection
                icon={Database}
                title="Database"
                status={results.checks.database.status}
                getStatusBadge={getStatusBadge}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    {results.checks.database.details.connected ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive" />
                    )}
                    <span>Connection: {results.checks.database.details.connected ? 'Connected' : 'Failed'}</span>
                  </div>
                  {results.checks.database.details.error && (
                    <p className="text-xs text-destructive">{results.checks.database.details.error}</p>
                  )}
                  {results.checks.database.details.tables && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {Object.entries(results.checks.database.details.tables).map(([table, exists]) => (
                        <div key={table} className="flex items-center gap-2 text-xs">
                          {exists ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                          <code className="text-muted-foreground">{table}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CheckSection>

              {/* SMTP */}
              <CheckSection
                icon={Mail}
                title="Email (SMTP)"
                status={results.checks.smtp.status}
                getStatusBadge={getStatusBadge}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {results.checks.smtp.details.configured ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive" />
                    )}
                    <span>Configured: {results.checks.smtp.details.configured ? 'Yes' : 'No'}</span>
                  </div>
                  {results.checks.smtp.details.test_result && (
                    <div className="flex items-center gap-2">
                      {results.checks.smtp.details.reachable ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive" />
                      )}
                      <span>{results.checks.smtp.details.test_result}</span>
                    </div>
                  )}
                </div>
              </CheckSection>

              {/* SerpAPI */}
              <CheckSection
                icon={Search}
                title="SerpAPI (Lead Search)"
                status={results.checks.serpapi.status}
                getStatusBadge={getStatusBadge}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {results.checks.serpapi.details.configured ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive" />
                    )}
                    <span>API Key: {results.checks.serpapi.details.configured ? 'Configured' : 'Missing'}</span>
                  </div>
                  {results.checks.serpapi.details.test_result && (
                    <div className="flex items-center gap-2">
                      {results.checks.serpapi.details.test_result === 'Valid' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive" />
                      )}
                      <span>{results.checks.serpapi.details.test_result}</span>
                    </div>
                  )}
                  {results.checks.serpapi.details.searches_remaining !== undefined && (
                    <p className="text-muted-foreground">
                      Searches remaining: {results.checks.serpapi.details.searches_remaining}
                    </p>
                  )}
                </div>
              </CheckSection>

              {/* Stripe */}
              <CheckSection
                icon={CreditCard}
                title="Stripe (Payments)"
                status={results.checks.stripe.status}
                getStatusBadge={getStatusBadge}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {results.checks.stripe.details.configured ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive" />
                    )}
                    <span>API Key: {results.checks.stripe.details.configured ? 'Configured' : 'Missing'}</span>
                  </div>
                  {results.checks.stripe.details.mode && (
                    <Badge variant="outline" className="text-xs">
                      {results.checks.stripe.details.mode.toUpperCase()} Mode
                    </Badge>
                  )}
                  {results.checks.stripe.details.api_reachable !== undefined && (
                    <div className="flex items-center gap-2">
                      {results.checks.stripe.details.api_reachable ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive" />
                      )}
                      <span>API: {results.checks.stripe.details.api_reachable ? 'Reachable' : 'Unreachable'}</span>
                    </div>
                  )}
                </div>
              </CheckSection>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function CheckSection({ 
  icon: Icon, 
  title, 
  status, 
  getStatusBadge,
  children 
}: { 
  icon: React.ElementType;
  title: string;
  status: string;
  getStatusBadge: (status: string) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {getStatusBadge(status)}
      </div>
      {children}
    </div>
  );
}

export default SystemDiagnostics;
