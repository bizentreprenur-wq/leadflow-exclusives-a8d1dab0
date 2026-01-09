import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, 
  Server, Database, FileCode, Shield, Wifi, WifiOff
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';
import { cn } from '@/lib/utils';

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

type ConnectionState = 'checking' | 'connected' | 'degraded' | 'offline';

interface BackendStatusIndicatorProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function BackendStatusIndicator({ 
  compact = false, 
  showLabel = true,
  className 
}: BackendStatusIndicatorProps) {
  const [state, setState] = useState<ConnectionState>('checking');
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('application/json')) {
        setState('offline');
        setHealth(null);
        setLastChecked(new Date());
        setIsRefreshing(false);
        return;
      }
      
      const data: HealthCheck = await response.json();
      setHealth(data);
      setState(data.status === 'ok' ? 'connected' : 'degraded');
      setLastChecked(new Date());
    } catch (err) {
      setState('offline');
      setHealth(null);
      setLastChecked(new Date());
    }
    
    setIsRefreshing(false);
  }, []);

  // Initial check and polling
  useEffect(() => {
    checkHealth();
    
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  const getStatusConfig = () => {
    switch (state) {
      case 'connected':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          pulseColor: 'bg-green-500',
          label: 'Online',
          description: 'All systems operational',
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          pulseColor: 'bg-yellow-500',
          label: 'Degraded',
          description: 'Some services unavailable',
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          pulseColor: 'bg-destructive',
          label: 'Offline',
          description: 'Contact support immediately',
        };
      default:
        return {
          icon: RefreshCw,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-border',
          pulseColor: 'bg-muted-foreground',
          label: 'Checking',
          description: 'Verifying connection...',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    const seconds = Math.floor((Date.now() - lastChecked.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 120) return '1 min ago';
    return `${Math.floor(seconds / 60)} mins ago`;
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1.5 cursor-pointer', className)}>
            <div className="relative">
              <div className={cn('w-2 h-2 rounded-full', config.pulseColor)} />
              {state === 'connected' && (
                <div className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', config.pulseColor, 'opacity-75')} />
              )}
            </div>
            {showLabel && (
              <span className={cn('text-xs', config.color)}>{config.label}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-2 h-auto py-2',
            config.bgColor,
            'hover:' + config.bgColor,
            className
          )}
        >
          <div className="relative">
            <StatusIcon className={cn('w-4 h-4', config.color, state === 'checking' && 'animate-spin')} />
            {state === 'connected' && (
              <div className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full', config.pulseColor)} />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className={cn('text-xs font-medium', config.color)}>{config.label}</div>
            <div className="text-[10px] text-muted-foreground">API Status</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-72">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Backend Status</h4>
            <Badge variant={state === 'connected' ? 'default' : 'destructive'} className={state === 'connected' ? 'bg-green-500' : ''}>
              {config.label}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">{config.description}</p>
          
          {health?.checks && (
            <div className="space-y-2 pt-2 border-t">
              <StatusRow 
                icon={Server} 
                label="API Server" 
                ok={health.checks.api} 
              />
              <StatusRow 
                icon={FileCode} 
                label="Config Files" 
                ok={health.checks.config_exists && health.checks.includes_exists} 
              />
              <StatusRow 
                icon={Shield} 
                label="Auth System" 
                ok={health.checks.auth_exists} 
              />
              <StatusRow 
                icon={Database} 
                label="Database" 
                ok={health.checks.database_connected}
                error={health.checks.database_error}
              />
            </div>
          )}
          
          {state === 'offline' && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p className="font-medium text-destructive mb-1">Cannot reach backend</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Check if files are deployed to /api/</li>
                <li>Verify config.php exists</li>
                <li>Check PHP error logs</li>
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span>Last checked: {formatLastChecked()}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={checkHealth}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-3 h-3 mr-1', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          
          {health?.version && (
            <div className="text-[10px] text-muted-foreground">
              v{health.version} • PHP {health.checks?.php_version}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatusRow({ 
  icon: Icon, 
  label, 
  ok, 
  error 
}: { 
  icon: React.ElementType; 
  label: string; 
  ok: boolean;
  error?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <XCircle className="w-3.5 h-3.5 text-destructive" />
          </TooltipTrigger>
          {error && (
            <TooltipContent>
              <p className="text-xs">{error}</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </div>
  );
}

export default BackendStatusIndicator;
