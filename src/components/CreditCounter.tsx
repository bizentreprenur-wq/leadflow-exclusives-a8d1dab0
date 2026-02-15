/**
 * Credit Counter — Shows running total of remaining credits
 * Fetches from database API for cross-device persistence
 * Triggers AddCreditsModal when credits drop below 50
 */

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Plus } from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { getCreditsFromDB } from '@/lib/api/stripe';
import AddCreditsModal from './AddCreditsModal';

interface CreditCounterProps {
  className?: string;
  compact?: boolean;
}

const CREDITS_STORAGE_KEY = 'bamlead_credits_remaining';

export function useCredits() {
  const { tier, features } = usePlanFeatures();
  const { isAuthenticated } = useAuth();
  
  const [credits, setCredits] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(CREDITS_STORAGE_KEY);
      if (stored) return parseInt(stored, 10);
      return features.monthlyVerifications === Infinity ? 99999 : features.monthlyVerifications;
    } catch {
      return features.monthlyVerifications === Infinity ? 99999 : features.monthlyVerifications;
    }
  });
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch credits from database on mount
  useEffect(() => {
    if (!isAuthenticated || hasFetched) return;
    
    const fetchCredits = async () => {
      try {
        const data = await getCreditsFromDB();
        if (data.is_unlimited) {
          setCredits(99999);
          localStorage.setItem(CREDITS_STORAGE_KEY, '99999');
        } else {
          setCredits(data.credits_remaining);
          localStorage.setItem(CREDITS_STORAGE_KEY, String(data.credits_remaining));
        }
      } catch (err) {
        // Fallback to localStorage value — already set in useState
        console.warn('Failed to fetch credits from API, using cached value');
      } finally {
        setHasFetched(true);
      }
    };

    fetchCredits();
  }, [isAuthenticated, hasFetched]);

  // Sync with plan changes
  useEffect(() => {
    if (tier === 'unlimited') {
      setCredits(99999);
      localStorage.setItem(CREDITS_STORAGE_KEY, '99999');
    }
  }, [tier]);

  const isLow = credits <= 50 && tier !== 'unlimited';
  const isOut = credits <= 0 && tier !== 'unlimited';
  const isUnlimited = tier === 'unlimited';

  const consumeCredit = useCallback((amount: number = 1) => {
    if (isUnlimited) return true;
    if (credits < amount) return false;
    setCredits(prev => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem(CREDITS_STORAGE_KEY, String(next));
      return next;
    });
    return true;
  }, [credits, isUnlimited]);

  const addCredits = useCallback((amount: number) => {
    setCredits(prev => {
      const next = prev + amount;
      localStorage.setItem(CREDITS_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Force refresh from database
  const refreshCredits = useCallback(async () => {
    try {
      const data = await getCreditsFromDB();
      const newCredits = data.is_unlimited ? 99999 : data.credits_remaining;
      setCredits(newCredits);
      localStorage.setItem(CREDITS_STORAGE_KEY, String(newCredits));
    } catch {}
  }, []);

  return { credits, isLow, isOut, isUnlimited, consumeCredit, addCredits, setCredits, refreshCredits };
}

export default function CreditCounter({ className = '', compact = false }: CreditCounterProps) {
  const { credits, isLow, isOut, isUnlimited } = useCredits();
  const [showAddCredits, setShowAddCredits] = useState(false);

  // Auto-show modal when credits drop to 50
  useEffect(() => {
    if (isLow && !isUnlimited) {
      const dismissed = sessionStorage.getItem('bamlead_credits_warning_dismissed');
      if (!dismissed) {
        setShowAddCredits(true);
        sessionStorage.setItem('bamlead_credits_warning_dismissed', 'true');
      }
    }
  }, [isLow, isUnlimited]);

  if (isUnlimited) {
    return (
      <div className={className}>
        <Badge className="bg-red-500/10 text-red-500 border-red-500/30 gap-1.5">
          <Sparkles className="w-3 h-3" />
          Unlimited
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => setShowAddCredits(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${
            isOut
              ? 'bg-destructive/10 text-destructive border border-destructive/30'
              : isLow
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
              : 'bg-primary/10 text-primary border border-primary/30'
          }`}
        >
          {isOut ? (
            <AlertTriangle className="w-3 h-3" />
          ) : isLow ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {compact ? credits : `${credits} credits`}
          <Plus className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      <AddCreditsModal
        open={showAddCredits}
        onOpenChange={setShowAddCredits}
        currentCredits={credits}
        isOutOfCredits={isOut}
      />
    </>
  );
}
