/**
 * AI Calling Dashboard Card
 * Shows status and provides actions based on user's plan tier
 * 
 * PRICING STRUCTURE (2026):
 * - Free: Script preview only
 * - Basic ($49/mo): +$8/mo add-on for AI scripts generation
 * - Pro ($99/mo): +$8/mo add-on for supervised AI calling
 * - Autopilot ($249/mo): AI Calling + phone included
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneCall,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Mic,
  Settings,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import PhoneNumberSetupModal from '@/components/PhoneNumberSetupModal';
import { Link } from 'react-router-dom';

interface AICallingCardProps {
  onSettingsClick?: () => void;
  onStartCalling?: () => void;
  compact?: boolean;
}

export default function AICallingCard({ 
  onSettingsClick, 
  onStartCalling,
  compact = false 
}: AICallingCardProps) {
  const { 
    status, 
    statusMessage, 
    callingModeDescription,
    capabilities, 
    phoneSetup, 
    isLoading, 
    needsUpgrade,
    needsAddon,
    addon,
    addonMessage,
    purchaseAddon,
    addonPrice
  } = useAICalling();
  const { tier, tierInfo } = usePlanFeatures();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseAddon = async () => {
    setIsPurchasing(true);
    try {
      const result = await purchaseAddon();
      if (result.success) {
        setShowPhoneModal(true);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'ready':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </Badge>
        );
      case 'addon_needed':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
            <DollarSign className="w-3 h-3" />
            +${addonPrice}/mo
          </Badge>
        );
      case 'phone_provisioning':
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Setting Up
          </Badge>
        );
      case 'phone_needed':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
            <Phone className="w-3 h-3" />
            Configuring
          </Badge>
        );
      case 'calling':
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 animate-pulse">
            <PhoneCall className="w-3 h-3" />
            Calling
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <Lock className="w-3 h-3" />
            {tier === 'free' ? 'Preview Only' : 'Scripts Only'}
          </Badge>
        );
    }
  };

  const getActionButton = () => {
    if (needsUpgrade) {
      return (
        <Link to="/pricing">
          <Button variant="outline" className="gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Upgrade Plan
          </Button>
        </Link>
      );
    }

    if (needsAddon) {
      return (
        <Button onClick={handlePurchaseAddon} disabled={isPurchasing} className="gap-2">
          {isPurchasing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add AI Calling (${addonPrice}/mo)
        </Button>
      );
    }

    if (status === 'phone_provisioning' || status === 'phone_needed') {
      return (
        <Button onClick={() => setShowPhoneModal(true)} variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          View Setup Status
        </Button>
      );
    }

    if (status === 'ready') {
      return (
        <div className="flex gap-2">
          <Button onClick={onStartCalling} className="gap-2">
            <PhoneCall className="w-4 h-4" />
            Start Calling
          </Button>
          {onSettingsClick && (
            <Button variant="outline" size="icon" onClick={onSettingsClick}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status === 'ready' ? 'bg-emerald-500/10' : 'bg-muted'}`}>
              <Phone className={`w-5 h-5 ${status === 'ready' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">AI Calling</span>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          </div>
          {getActionButton()}
        </div>
        
        <PhoneNumberSetupModal 
          open={showPhoneModal} 
          onOpenChange={setShowPhoneModal}
          onComplete={() => onStartCalling?.()}
        />
      </>
    );
  }

  return (
    <>
      <Card className={`border-2 ${
        status === 'ready' 
          ? 'border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]' 
          : status === 'addon_needed'
          ? 'border-amber-500/30'
          : 'border-border'
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status === 'ready' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : status === 'addon_needed'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-muted'
              }`}>
                <Phone className={`w-6 h-6 ${status !== 'disabled' ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Calling
                  {getStatusBadge()}
                </CardTitle>
                <CardDescription className="mt-1">
                  {callingModeDescription}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={tierInfo.bgColor + ' ' + tierInfo.color}>
              {tierInfo.name}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Capabilities List */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-center gap-2 text-sm ${capabilities.canViewScripts ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canViewScripts ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span>View Scripts</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${capabilities.canGenerateScripts ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canGenerateScripts ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span>AI Script Generation</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${capabilities.canMakeCalls ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canMakeCalls ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span>AI Outbound Calls</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${capabilities.canAutoCall ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canAutoCall ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
              <span>Autonomous Mode</span>
            </div>
          </div>

          {/* Phone Status - Only for users with addon */}
          {addon.status === 'active' && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">AI Phone Number</span>
                </div>
                {phoneSetup.hasPhone ? (
                  <span className="font-mono text-sm text-foreground">{phoneSetup.phoneNumber}</span>
                ) : phoneSetup.isProvisioning ? (
                  <span className="text-sm text-amber-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Setting up...
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Pending configuration</span>
                )}
              </div>
            </div>
          )}

          {/* Addon Message */}
          {needsAddon && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="text-muted-foreground">{addonMessage}</p>
                  {capabilities.addonIncluded && (
                    <p className="text-amber-600 font-medium mt-1">Included with your plan!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Message for Free tier */}
          {needsUpgrade && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowUpRight className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Upgrade to Basic or Pro to access AI Calling features
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {getActionButton()}
          </div>
        </CardContent>
      </Card>
      
      <PhoneNumberSetupModal 
        open={showPhoneModal} 
        onOpenChange={setShowPhoneModal}
        onComplete={() => onStartCalling?.()}
      />
    </>
  );
}
