/**
 * AI Autopilot Trial Warning Banner
 * Displays prominently in compose modal and dashboard when trial is active or expired
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, Crown, CreditCard, AlertTriangle, Sparkles, 
  X, ChevronRight, Zap, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutopilotTrial } from '@/hooks/useAutopilotTrial';

interface AutopilotTrialWarningProps {
  variant?: 'banner' | 'compact' | 'inline';
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function AutopilotTrialWarning({
  variant = 'banner',
  showUpgradeButton = true,
  onUpgrade,
  onDismiss,
  className,
}: AutopilotTrialWarningProps) {
  const { status, badgeColor, upgradeToPaid, TRIAL_DURATION_DAYS, MONTHLY_PRICE } = useAutopilotTrial();

  // Don't show if paid or no trial started
  if (status.isPaid || !status.hasStartedTrial) {
    return null;
  }

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      await upgradeToPaid();
    }
  };

  const progressPercentage = ((TRIAL_DURATION_DAYS - status.trialDaysRemaining) / TRIAL_DURATION_DAYS) * 100;

  // Expired state - full width prominent banner
  if (status.isExpired) {
    if (variant === 'compact') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-3 rounded-lg bg-red-500/10 border-2 border-red-500/30 flex items-center gap-3",
            className
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400 truncate">Trial Expired</p>
            <p className="text-xs text-muted-foreground">Subscribe to continue</p>
          </div>
          {showUpgradeButton && (
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              ${MONTHLY_PRICE}/mo
            </Button>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 rounded-xl bg-gradient-to-r from-red-500/20 via-red-500/10 to-orange-500/10 border-2 border-red-500/30",
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-red-400">AI Autopilot Trial Expired</h4>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                EXPIRED
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Your 7-day free trial has ended. Subscribe now to continue using AI-powered automated outreach.
            </p>
          </div>
          {showUpgradeButton && (
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade for ${MONTHLY_PRICE}/month
              </Button>
              <span className="text-[10px] text-muted-foreground text-center">Cancel anytime</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Active trial warning - Yellow/Amber theme with urgency variations
  if (variant === 'inline') {
    return (
      <Badge className={cn(
        "text-xs gap-1.5",
        status.warningLevel === 'high' || status.warningLevel === 'expired'
          ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
          : "bg-amber-500/20 text-amber-400 border-amber-500/30",
        className
      )}>
        <Clock className="w-3 h-3" />
        {status.trialDaysRemaining} day{status.trialDaysRemaining !== 1 ? 's' : ''} left
      </Badge>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "p-3 rounded-lg flex items-center gap-3 border-2",
          status.warningLevel === 'high' && "bg-red-500/10 border-red-500/30",
          status.warningLevel === 'medium' && "bg-amber-500/10 border-amber-500/30",
          (status.warningLevel === 'low' || status.warningLevel === 'none') && "bg-amber-500/10 border-amber-500/30",
          className
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          status.warningLevel === 'high' && "bg-red-500/20",
          status.warningLevel === 'medium' && "bg-amber-500/20",
          (status.warningLevel === 'low' || status.warningLevel === 'none') && "bg-amber-500/20",
        )}>
          <Crown className={cn(
            "w-4 h-4",
            status.warningLevel === 'high' && "text-red-400",
            status.warningLevel === 'medium' && "text-amber-400",
            (status.warningLevel === 'low' || status.warningLevel === 'none') && "text-amber-400",
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            status.warningLevel === 'high' && "text-red-400",
            status.warningLevel === 'medium' && "text-amber-400",
            (status.warningLevel === 'low' || status.warningLevel === 'none') && "text-amber-400",
          )}>
            AI Autopilot: {status.trialDaysRemaining} day{status.trialDaysRemaining !== 1 ? 's' : ''} left
          </p>
        </div>
        {showUpgradeButton && (
          <Button 
            size="sm" 
            onClick={handleUpgrade}
            className="gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Upgrade
          </Button>
        )}
      </motion.div>
    );
  }

  // Full banner variant - Yellow/Amber theme
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border-2 relative overflow-hidden",
        status.warningLevel === 'high' && "bg-gradient-to-r from-red-500/10 to-amber-500/10 border-red-500/30",
        status.warningLevel === 'medium' && "bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/40",
        (status.warningLevel === 'low' || status.warningLevel === 'none') && "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30",
        className
      )}
    >
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded hover:bg-muted/50 text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          status.warningLevel === 'high' && "bg-red-500/20",
          status.warningLevel === 'medium' && "bg-amber-500/20",
          (status.warningLevel === 'low' || status.warningLevel === 'none') && "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20",
        )}>
          <Crown className={cn(
            "w-6 h-6",
            status.warningLevel === 'high' && "text-red-400",
            status.warningLevel === 'medium' && "text-amber-400",
            (status.warningLevel === 'low' || status.warningLevel === 'none') && "text-white",
          )} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              AI Autopilot Trial
              <Badge className={cn(
                status.warningLevel === 'high' 
                  ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              )}>
                {status.trialDaysRemaining} day{status.trialDaysRemaining !== 1 ? 's' : ''} remaining
              </Badge>
            </h4>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <Progress 
              value={progressPercentage} 
              className={cn(
                "h-2",
                status.warningLevel === 'high' && "[&>div]:bg-red-500",
                status.warningLevel === 'medium' && "[&>div]:bg-amber-500",
                (status.warningLevel === 'low' || status.warningLevel === 'none') && "[&>div]:bg-amber-500",
              )}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {status.warningMessage}
          </p>
        </div>
        
        {showUpgradeButton && (
          <div className="flex flex-col gap-2 shrink-0">
            <Button 
              onClick={handleUpgrade}
              className={cn(
                "gap-2",
                status.warningLevel === 'high' 
                  ? "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white animate-pulse"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
              )}
            >
              <Crown className="w-4 h-4" />
              Upgrade ${MONTHLY_PRICE}/mo
            </Button>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Cancel anytime</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
