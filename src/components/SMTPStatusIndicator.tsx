import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';
import { getSMTPConfig, isSMTPConfigured } from '@/lib/emailService';
import { cn } from '@/lib/utils';

interface SMTPStatusIndicatorProps {
  compact?: boolean;
  showConfigureButton?: boolean;
  onConfigure?: () => void;
  className?: string;
}

export default function SMTPStatusIndicator({
  compact = false,
  showConfigureButton = true,
  onConfigure,
  className,
}: SMTPStatusIndicatorProps) {
  const smtpStatus = useMemo(() => {
    const config = getSMTPConfig();
    const isConfigured = isSMTPConfigured();
    
    return {
      isConfigured,
      email: config?.username || config?.fromEmail || null,
      host: config?.host || null,
    };
  }, []);

  // Mask email for privacy (show first 3 chars + domain)
  const maskedEmail = useMemo(() => {
    if (!smtpStatus.email) return null;
    const [localPart, domain] = smtpStatus.email.split('@');
    if (!domain) return smtpStatus.email;
    const masked = localPart.slice(0, 3) + '***';
    return `${masked}@${domain}`;
  }, [smtpStatus.email]);

  if (compact) {
    return (
      <Badge
        className={cn(
          "text-[10px] gap-1.5 px-2 py-1",
          smtpStatus.isConfigured
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-amber-500/20 text-amber-400 border-amber-500/30",
          className
        )}
      >
        {smtpStatus.isConfigured ? (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>{maskedEmail || 'SMTP Ready'}</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3" />
            <span>SMTP Not Set</span>
          </>
        )}
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        smtpStatus.isConfigured
          ? "bg-emerald-900/10 border-emerald-500/30"
          : "bg-amber-900/10 border-amber-500/30",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            smtpStatus.isConfigured ? "bg-emerald-500/20" : "bg-amber-500/20"
          )}
        >
          <Mail
            className={cn(
              "w-4 h-4",
              smtpStatus.isConfigured ? "text-emerald-400" : "text-amber-400"
            )}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            {smtpStatus.isConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                smtpStatus.isConfigured ? "text-emerald-300" : "text-amber-300"
              )}
            >
              {smtpStatus.isConfigured ? 'Sending From' : 'SMTP Not Configured'}
            </span>
          </div>
          {smtpStatus.isConfigured ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {smtpStatus.email}
              {smtpStatus.host && (
                <span className="text-muted-foreground/60"> via {smtpStatus.host}</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure your email server to send emails
            </p>
          )}
        </div>
      </div>

      {showConfigureButton && !smtpStatus.isConfigured && onConfigure && (
        <Button
          size="sm"
          variant="outline"
          onClick={onConfigure}
          className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Configure
        </Button>
      )}
      
      {showConfigureButton && smtpStatus.isConfigured && onConfigure && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onConfigure}
          className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Change
        </Button>
      )}
    </div>
  );
}
