/**
 * AI Calling Dashboard Card
 * Shows status and provides actions based on user's plan tier
 * 
 * States:
 * - Disabled (Free/Basic): Show upgrade CTA
 * - Phone Needed (Pro/Autopilot): Show add phone CTA
 * - Ready: Show calling interface
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneCall,
  PhoneOff,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Mic,
  Settings
} from 'lucide-react';
import { useAICalling } from '@/hooks/useAICalling';
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
  const { status, statusMessage, capabilities, phoneSetup, isLoading, needsUpgrade, upgradeMessage } = useAICalling();
  const { tier, tierInfo } = usePlanFeatures();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'ready':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </Badge>
        );
      case 'phone_needed':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
            <Phone className="w-3 h-3" />
            Phone Needed
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
            Upgrade to Enable
          </Button>
        </Link>
      );
    }

    if (status === 'phone_needed') {
      return (
        <Button onClick={() => setShowPhoneModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Phone Number
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

  const getTierDescription = () => {
    switch (tier) {
      case 'free':
        return 'AI script preview only. Upgrade to enable AI calling.';
      case 'basic':
        return 'AI prepares your call script. You make the call.';
      case 'pro':
        return 'AI calls your leads using a dedicated business number.';
      case 'autopilot':
        return 'AI handles calls from first contact to booked conversation.';
      default:
        return '';
    }
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
          : status === 'phone_needed'
          ? 'border-amber-500/30'
          : 'border-border'
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status === 'ready' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : status === 'phone_needed'
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
                  {getTierDescription()}
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
              <span>AI Script Generation</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${capabilities.canEditScripts ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canEditScripts ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span>Edit Scripts</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${capabilities.canMakeCalls ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canMakeCalls ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span>Outbound AI Calls</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${capabilities.canAutoCall ? 'text-foreground' : 'text-muted-foreground'}`}>
              <CheckCircle2 className={`w-4 h-4 ${capabilities.canAutoCall ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
              <span>Autonomous Mode</span>
            </div>
          </div>

          {/* Phone Status */}
          {(tier === 'pro' || tier === 'autopilot') && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Phone Number</span>
                </div>
                {phoneSetup.hasPhone ? (
                  <span className="font-mono text-sm text-foreground">{phoneSetup.phoneNumber}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not configured</span>
                )}
              </div>
            </div>
          )}

          {/* Upgrade Message */}
          {needsUpgrade && upgradeMessage && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">{upgradeMessage}</p>
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
