/**
 * AI Calling Hook
 * Manages AI calling state, phone number setup, and tier-based access
 * 
 * V1 RULES:
 * - One phone number per customer
 * - Free: Script preview only
 * - Basic: AI generates scripts, no calling
 * - Pro: AI calls, customer supervises, 1 phone required
 * - Autopilot: Fully autonomous calling, phone included
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePlanFeatures, PlanTier } from '@/hooks/usePlanFeatures';
import { getTelnyxConfig, saveTelnyxConfig, type TelnyxConfig } from '@/lib/api/telnyx';

export type AICallingStatus = 'disabled' | 'phone_needed' | 'ready' | 'calling';
export type PhoneNumberType = 'own' | 'bamlead';

export interface AICallingCapabilities {
  canViewScripts: boolean;
  canEditScripts: boolean;
  canMakeCalls: boolean;
  canAutoCall: boolean;
  requiresPhone: boolean;
  phoneIncluded: boolean;
  callLimitType: 'none' | 'limited' | 'higher';
  scriptGeneration: 'preview' | 'basic' | 'full' | 'advanced';
}

export interface PhoneSetup {
  hasPhone: boolean;
  phoneNumber: string | null;
  phoneType: PhoneNumberType | null;
  isVerified: boolean;
}

const TIER_CAPABILITIES: Record<PlanTier, AICallingCapabilities> = {
  free: {
    canViewScripts: true,
    canEditScripts: false,
    canMakeCalls: false,
    canAutoCall: false,
    requiresPhone: false,
    phoneIncluded: false,
    callLimitType: 'none',
    scriptGeneration: 'preview',
  },
  basic: {
    canViewScripts: true,
    canEditScripts: false,
    canMakeCalls: false,
    canAutoCall: false,
    requiresPhone: false,
    phoneIncluded: false,
    callLimitType: 'none',
    scriptGeneration: 'basic',
  },
  pro: {
    canViewScripts: true,
    canEditScripts: true,
    canMakeCalls: true,
    canAutoCall: false,
    requiresPhone: true,
    phoneIncluded: false,
    callLimitType: 'limited',
    scriptGeneration: 'full',
  },
  autopilot: {
    canViewScripts: true,
    canEditScripts: true,
    canMakeCalls: true,
    canAutoCall: true,
    requiresPhone: true,
    phoneIncluded: true,
    callLimitType: 'higher',
    scriptGeneration: 'advanced',
  },
};

const STORAGE_KEY = 'bamlead_phone_setup';

export function useAICalling() {
  const { tier, isLoading: planLoading, isPro, isAutopilot } = usePlanFeatures();
  const [config, setConfig] = useState<TelnyxConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneSetup, setPhoneSetup] = useState<PhoneSetup>({
    hasPhone: false,
    phoneNumber: null,
    phoneType: null,
    isVerified: false,
  });
  
  // Get capabilities for current tier
  const capabilities = useMemo(() => TIER_CAPABILITIES[tier], [tier]);
  
  // Determine current status
  const status = useMemo<AICallingStatus>(() => {
    if (!capabilities.canMakeCalls) return 'disabled';
    if (capabilities.requiresPhone && !phoneSetup.hasPhone) return 'phone_needed';
    if (config?.enabled && phoneSetup.isVerified) return 'ready';
    return 'disabled';
  }, [capabilities, phoneSetup, config]);
  
  // Load config on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load Telnyx config
        const result = await getTelnyxConfig();
        if (result.success && result.config) {
          setConfig(result.config);
          
          // Derive phone setup from config
          if (result.config.phone_number) {
            setPhoneSetup({
              hasPhone: true,
              phoneNumber: result.config.phone_number,
              phoneType: 'own', // We'll enhance this later
              isVerified: result.config.enabled,
            });
          }
        }
        
        // Also check localStorage for cached phone type
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.phoneType) {
              setPhoneSetup(prev => ({ ...prev, phoneType: parsed.phoneType }));
            }
          }
        } catch {}
      } catch (error) {
        console.error('Failed to load AI calling config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!planLoading) {
      loadData();
    }
  }, [planLoading]);
  
  // Save phone setup
  const savePhoneSetup = useCallback(async (
    phoneNumber: string,
    phoneType: PhoneNumberType
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Update config with new phone number
      const newConfig: TelnyxConfig = {
        ...(config || {
          api_key: '',
          connection_id: '',
          voice: 'Polly.Matthew',
          greeting_message: '',
          system_prompt: '',
          enabled: false,
        }),
        phone_number: phoneNumber,
      };
      
      const result = await saveTelnyxConfig(newConfig);
      
      if (result.success) {
        const newPhoneSetup: PhoneSetup = {
          hasPhone: true,
          phoneNumber,
          phoneType,
          isVerified: false, // Needs verification
        };
        setPhoneSetup(newPhoneSetup);
        setConfig(newConfig);
        
        // Cache phone type
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ phoneType }));
        
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to save phone setup' };
    }
  }, [config]);
  
  // Verify phone number (API handshake)
  const verifyPhone = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!phoneSetup.phoneNumber) {
      return { success: false, error: 'No phone number to verify' };
    }
    
    // In a real implementation, this would call the Telnyx API to verify
    // For now, we'll simulate verification success
    setPhoneSetup(prev => ({ ...prev, isVerified: true }));
    
    // Enable calling in config
    if (config) {
      const newConfig = { ...config, enabled: true };
      await saveTelnyxConfig(newConfig);
      setConfig(newConfig);
    }
    
    return { success: true };
  }, [phoneSetup, config]);
  
  // Clear phone setup
  const clearPhoneSetup = useCallback(async () => {
    setPhoneSetup({
      hasPhone: false,
      phoneNumber: null,
      phoneType: null,
      isVerified: false,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  // Get upgrade message based on tier
  const upgradeMessage = useMemo(() => {
    switch (tier) {
      case 'free':
        return 'Upgrade to Basic to generate AI call scripts, or Pro to enable AI calling.';
      case 'basic':
        return 'Upgrade to Pro to enable AI outbound calling with your leads.';
      case 'pro':
        return 'Upgrade to Autopilot for fully autonomous calling with higher limits.';
      default:
        return '';
    }
  }, [tier]);
  
  // Get status message
  const statusMessage = useMemo(() => {
    switch (status) {
      case 'disabled':
        if (tier === 'free') return 'AI script preview only';
        if (tier === 'basic') return 'AI generates scripts. You make the call.';
        return 'AI calling is disabled';
      case 'phone_needed':
        return 'Add a phone number to enable AI calling';
      case 'ready':
        return 'AI calling is ready';
      case 'calling':
        return 'AI call in progress';
    }
  }, [status, tier]);
  
  return {
    // Status
    status,
    statusMessage,
    isLoading: isLoading || planLoading,
    
    // Capabilities
    capabilities,
    tier,
    isPro,
    isAutopilot,
    
    // Phone setup
    phoneSetup,
    savePhoneSetup,
    verifyPhone,
    clearPhoneSetup,
    
    // Config
    config,
    
    // Helpers
    upgradeMessage,
    needsUpgrade: tier === 'free' || tier === 'basic',
    needsPhone: capabilities.requiresPhone && !phoneSetup.hasPhone,
    isReady: status === 'ready',
  };
}
