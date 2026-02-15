/**
 * AI Calling Hook
 * Manages AI calling state, phone number setup, and tier-based access
 * 
 * PRICING STRUCTURE (2026):
 * - Free: Script preview only (can see what AI would say)
 * - Basic ($49/mo): AI generates scripts, you dial manually — phone INCLUDED
 * - Pro ($99/mo): AI calls your leads, you supervise — phone INCLUDED
 * - Autopilot ($249/mo): Fully autonomous calling — phone INCLUDED
 * 
 * V1 RULES:
 * - One phone number per customer
 * - BamLead provisions phone numbers via Twilio API
 * - AI Calling included in ALL paid tiers (no add-on required)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePlanFeatures, PlanTier } from '@/hooks/usePlanFeatures';
import { getTwilioConfig, saveTwilioConfig, type TwilioConfig } from '@/lib/api/twilio';
import { provisionNumber as apiProvisionNumber } from '@/lib/api/calling';
import { createAddonCheckoutSession } from '@/lib/api/stripe';
import { toast } from 'sonner';

export type AICallingStatus = 'disabled' | 'addon_needed' | 'phone_provisioning' | 'phone_needed' | 'ready' | 'calling';
export type PhoneNumberType = 'bamlead'; // Only BamLead-provisioned numbers in V1
export type AICallingAddonStatus = 'not_purchased' | 'pending' | 'active';

export const AI_CALLING_ADDON_PRICE = 0; // Included in all paid plans

export interface AICallingCapabilities {
  canViewScripts: boolean;
  canEditScripts: boolean;
  canGenerateScripts: boolean;
  canMakeCalls: boolean;
  canAutoCall: boolean;
  requiresAddon: boolean;
  addonIncluded: boolean;
  phoneIncluded: boolean;
  callLimitType: 'none' | 'manual_dial' | 'supervised' | 'autonomous';
  scriptGeneration: 'preview' | 'basic' | 'full' | 'advanced';
}

export interface PhoneSetup {
  hasPhone: boolean;
  phoneNumber: string | null;
  phoneType: PhoneNumberType | null;
  isVerified: boolean;
  isProvisioning: boolean;
}

export interface AICallingAddon {
  status: AICallingAddonStatus;
  purchasedAt: string | null;
  phoneNumber: string | null;
}

const TIER_CAPABILITIES: Record<PlanTier, AICallingCapabilities> = {
  free: {
    canViewScripts: true,
    canEditScripts: false,
    canGenerateScripts: false,
    canMakeCalls: false,
    canAutoCall: false,
    requiresAddon: true,
    addonIncluded: false,
    phoneIncluded: false,
    callLimitType: 'none',
    scriptGeneration: 'preview',
  },
  basic: {
    canViewScripts: true,
    canEditScripts: true,
    canGenerateScripts: true,
    canMakeCalls: false,
    canAutoCall: false,
    requiresAddon: false,
    addonIncluded: true,
    phoneIncluded: true,
    callLimitType: 'manual_dial',
    scriptGeneration: 'basic',
  },
  pro: {
    canViewScripts: true,
    canEditScripts: true,
    canGenerateScripts: true,
    canMakeCalls: true,
    canAutoCall: false,
    requiresAddon: false,
    addonIncluded: true,
    phoneIncluded: true,
    callLimitType: 'supervised',
    scriptGeneration: 'full',
  },
  autopilot: {
    canViewScripts: true,
    canEditScripts: true,
    canGenerateScripts: true,
    canMakeCalls: true,
    canAutoCall: true,
    requiresAddon: false,
    addonIncluded: true,
    phoneIncluded: true,
    callLimitType: 'autonomous',
    scriptGeneration: 'advanced',
  },
  unlimited: {
    canViewScripts: true,
    canEditScripts: true,
    canGenerateScripts: true,
    canMakeCalls: true,
    canAutoCall: true,
    requiresAddon: false,
    addonIncluded: true,
    phoneIncluded: true,
    callLimitType: 'autonomous',
    scriptGeneration: 'advanced',
  },
};

const STORAGE_KEY = 'bamlead_phone_setup';
const ADDON_STORAGE_KEY = 'bamlead_ai_calling_addon';

export function useAICalling() {
  const { tier, isLoading: planLoading, isPro, isAutopilot } = usePlanFeatures();
  const [config, setConfig] = useState<TwilioConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneSetup, setPhoneSetup] = useState<PhoneSetup>({
    hasPhone: false,
    phoneNumber: null,
    phoneType: null,
    isVerified: false,
    isProvisioning: false,
  });
  const [addon, setAddon] = useState<AICallingAddon>({
    status: 'not_purchased',
    purchasedAt: null,
    phoneNumber: null,
  });
  
  const capabilities = useMemo(() => TIER_CAPABILITIES[tier], [tier]);
  const needsAddonPurchase = capabilities.requiresAddon && addon.status === 'not_purchased';
  
  const status = useMemo<AICallingStatus>(() => {
    if (tier === 'free') return 'disabled';
    
    if (capabilities.addonIncluded) {
      if (phoneSetup.isProvisioning) return 'phone_provisioning';
      if (!phoneSetup.hasPhone) return 'phone_needed';
      if (phoneSetup.isVerified) return 'ready';
      return 'phone_needed';
    }
    
    if (capabilities.requiresAddon && addon.status !== 'active') {
      return 'addon_needed';
    }
    
    if (phoneSetup.isProvisioning) return 'phone_provisioning';
    if (!phoneSetup.hasPhone) return 'phone_needed';
    if (phoneSetup.isVerified) return 'ready';
    
    return 'phone_needed';
  }, [capabilities, phoneSetup, addon, tier]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await getTwilioConfig();
        let phoneLoaded = false;
        if (result.success && result.config) {
          setConfig(result.config);
          
          if (result.config.phone_number) {
            setPhoneSetup({
              hasPhone: true,
              phoneNumber: result.config.phone_number,
              phoneType: 'bamlead',
              isVerified: result.config.enabled,
              isProvisioning: false,
            });
            phoneLoaded = true;
          }
        }
        
        // Fallback: load from localStorage if API didn't return a phone number
        if (!phoneLoaded) {
          const cachedPhone = localStorage.getItem('twilio_phone_number');
          const cachedActive = localStorage.getItem('twilio_phone_active');
          if (cachedPhone && cachedActive === 'true') {
            setPhoneSetup({
              hasPhone: true,
              phoneNumber: cachedPhone,
              phoneType: 'bamlead',
              isVerified: true,
              isProvisioning: false,
            });
          }
        }
        
        try {
          const cachedAddon = localStorage.getItem(ADDON_STORAGE_KEY);
          if (cachedAddon) {
            const parsed = JSON.parse(cachedAddon);
            setAddon(parsed);
          }
        } catch {}
        
        if (tier === 'autopilot' && !result?.config?.phone_number) {
          setPhoneSetup(prev => ({ ...prev, isProvisioning: true }));
        }
      } catch (error) {
        console.error('Failed to load AI calling config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!planLoading) {
      loadData();
    }
  }, [planLoading, tier]);
  
  const purchaseAddon = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const pendingAddon: AICallingAddon = {
        status: 'pending',
        purchasedAt: null,
        phoneNumber: null,
      };
      setAddon(pendingAddon);
      
      const result = await createAddonCheckoutSession('ai_calling');
      
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return { success: true };
      }
      
      setAddon({ status: 'not_purchased', purchasedAt: null, phoneNumber: null });
      return { success: false, error: 'Failed to create checkout session' };
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
      setAddon({ status: 'not_purchased', purchasedAt: null, phoneNumber: null });
      return { success: false, error: error.message || 'Failed to purchase addon' };
    }
  }, []);
  
  const requestPhoneProvisioning = useCallback(async (options?: { country_code?: string; area_code?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      setPhoneSetup(prev => ({ ...prev, isProvisioning: true }));
      
      const result = await apiProvisionNumber(options);
      
      if (result.success && result.phone_number) {
        const newPhoneSetup: PhoneSetup = {
          hasPhone: true,
          phoneNumber: result.phone_number,
          phoneType: 'bamlead',
          isVerified: true,
          isProvisioning: false,
        };
        setPhoneSetup(newPhoneSetup);
        setAddon(prev => ({ ...prev, status: 'active', phoneNumber: result.phone_number! }));
        localStorage.setItem(ADDON_STORAGE_KEY, JSON.stringify({ ...addon, status: 'active', phoneNumber: result.phone_number }));
        toast.success(`Phone number provisioned: ${result.phone_number}`);
        return { success: true };
      }
      
      setPhoneSetup(prev => ({ ...prev, isProvisioning: false }));
      
      if (result.error?.includes('add-on')) {
        toast.error('Purchase the AI Calling add-on first');
        return { success: false, error: result.error };
      }
      
      toast.error(result.error || 'Failed to provision number');
      return { success: false, error: result.error || 'Provisioning failed' };
    } catch (error: any) {
      setPhoneSetup(prev => ({ ...prev, isProvisioning: false }));
      toast.error('Failed to provision phone number');
      return { success: false, error: 'Failed to provision phone number' };
    }
  }, [addon]);
  
  const savePhoneSetup = useCallback(async (
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const newConfig: TwilioConfig = {
        ...(config || {
          voice: 'Polly.Joanna',
          greeting_message: '',
          system_prompt: '',
          enabled: false,
          provisioned: false,
          provision_status: 'none' as const,
        }),
        phone_number: phoneNumber,
      };
      
      const result = await saveTwilioConfig(newConfig);
      
      if (result.success) {
        const newPhoneSetup: PhoneSetup = {
          hasPhone: true,
          phoneNumber,
          phoneType: 'bamlead',
          isVerified: false,
          isProvisioning: false,
        };
        setPhoneSetup(newPhoneSetup);
        setConfig(newConfig);
        // Persist to localStorage for sidebar display
        localStorage.setItem('twilio_phone_number', phoneNumber);
        localStorage.setItem('twilio_phone_active', 'true');
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to save phone setup' };
    }
  }, [config]);
  
  const verifyPhone = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!phoneSetup.phoneNumber) {
      return { success: false, error: 'No phone number to verify' };
    }
    
    setPhoneSetup(prev => ({ ...prev, isVerified: true }));
    
    if (config) {
      const newConfig = { ...config, enabled: true };
      await saveTwilioConfig(newConfig);
      setConfig(newConfig);
    }
    
    return { success: true };
  }, [phoneSetup, config]);
  
  const clearPhoneSetup = useCallback(async () => {
    setPhoneSetup({
      hasPhone: false,
      phoneNumber: null,
      phoneType: null,
      isVerified: false,
      isProvisioning: false,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  const addonMessage = useMemo(() => {
    if (tier === 'free') {
      return 'Upgrade to any paid plan to access AI Calling — phone number included!';
    }
    return 'AI Calling phone number is included with your plan!';
  }, [tier]);
  
  const statusMessage = useMemo(() => {
    switch (status) {
      case 'disabled':
        return 'AI script preview only';
      case 'addon_needed':
        return 'AI Calling included — set up your phone';
      case 'phone_provisioning':
        return 'Setting up your AI phone number...';
      case 'phone_needed':
        return 'BamLead is configuring your AI phone number';
      case 'ready':
        return 'AI calling is ready';
      case 'calling':
        return 'AI call in progress';
      default:
        return '';
    }
  }, [status]);
  
  const callingModeDescription = useMemo(() => {
    switch (tier) {
      case 'free':
        return 'Preview what AI would say (read-only)';
      case 'basic':
        return 'AI generates scripts, you dial manually';
      case 'pro':
        return 'AI makes calls, you supervise the conversation';
      case 'autopilot':
        return 'Fully autonomous AI calling with auto-booking';
      default:
        return '';
    }
  }, [tier]);
  
  return {
    status,
    statusMessage,
    callingModeDescription,
    isLoading: isLoading || planLoading,
    capabilities,
    tier,
    isPro,
    isAutopilot,
    addon,
    addonMessage,
    needsAddonPurchase,
    purchaseAddon,
    addonPrice: AI_CALLING_ADDON_PRICE,
    phoneSetup,
    requestPhoneProvisioning,
    savePhoneSetup,
    verifyPhone,
    clearPhoneSetup,
    config,
    needsUpgrade: tier === 'free',
    needsAddon: needsAddonPurchase,
    needsPhone: addon.status === 'active' && !phoneSetup.hasPhone,
    isReady: status === 'ready',
  };
}
