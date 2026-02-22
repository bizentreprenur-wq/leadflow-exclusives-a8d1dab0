/**
 * Credit Counter — Shows running total of remaining credits
 * Tracks both SEARCH credits (daily) and VERIFICATION credits (monthly)
 * Fetches from database API for cross-device persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Plus, Search, ShieldCheck } from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { getCreditsFromDB } from '@/lib/api/stripe';
import AddCreditsModal from './AddCreditsModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CreditCounterProps {
  className?: string;
  compact?: boolean;
}

const CREDITS_STORAGE_KEY = 'bamlead_credits_remaining';
const SEARCH_CREDITS_KEY = 'bamlead_search_credits';
const SEARCH_CREDITS_DATE_KEY = 'bamlead_search_credits_date';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useSearchCredits() {
  const { tier, features } = usePlanFeatures();

  const dailyLimit = features.dailySearches;
  const isUnlimitedSearches = dailyLimit === 'unlimited';

  const [searchesUsed, setSearchesUsed] = useState<number>(() => {
    try {
      const dateKey = localStorage.getItem(SEARCH_CREDITS_DATE_KEY);
      if (dateKey !== getTodayKey()) return 0; // new day, reset
      const stored = localStorage.getItem(SEARCH_CREDITS_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  });

  // Reset on new day
  useEffect(() => {
    const dateKey = localStorage.getItem(SEARCH_CREDITS_DATE_KEY);
    if (dateKey !== getTodayKey()) {
      setSearchesUsed(0);
      localStorage.setItem(SEARCH_CREDITS_KEY, '0');
      localStorage.setItem(SEARCH_CREDITS_DATE_KEY, getTodayKey());
    }
  }, []);

  const searchesRemaining = isUnlimitedSearches ? Infinity : Math.max(0, (dailyLimit as number) - searchesUsed);
  const isSearchLow = !isUnlimitedSearches && searchesRemaining <= 3;
  const isSearchOut = !isUnlimitedSearches && searchesRemaining <= 0;

  const consumeSearch = useCallback(() => {
    if (isUnlimitedSearches) return true;
    if (searchesRemaining <= 0) return false;
    setSearchesUsed(prev => {
      const next = prev + 1;
      localStorage.setItem(SEARCH_CREDITS_KEY, String(next));
      localStorage.setItem(SEARCH_CREDITS_DATE_KEY, getTodayKey());
      return next;
    });
    return true;
  }, [isUnlimitedSearches, searchesRemaining]);

  return {
    searchesUsed,
    searchesRemaining,
    dailyLimit,
    isUnlimitedSearches,
    isSearchLow,
    isSearchOut,
    consumeSearch,
  };
}

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

  const isLow = credits <= 25 && tier !== 'unlimited';
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
  const { searchesRemaining, dailyLimit, isUnlimitedSearches, isSearchLow, isSearchOut } = useSearchCredits();
  const [showAddCredits, setShowAddCredits] = useState(false);
  const { tier } = usePlanFeatures();

  // Auto-show modal when credits drop to 25
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
      <TooltipProvider>
        <div className={`flex items-center gap-2 ${className}`}>
          {/* Search Credits (Daily) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isSearchOut
                  ? 'bg-destructive/10 text-destructive border-destructive/30'
                  : isSearchLow
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              }`}>
                {isSearchOut ? <AlertTriangle className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                {isUnlimitedSearches ? '∞' : searchesRemaining}/{isUnlimitedSearches ? '∞' : dailyLimit}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Daily Search Credits</p>
              <p className="text-xs text-muted-foreground">
                {isUnlimitedSearches 
                  ? 'Unlimited searches per day' 
                  : `${searchesRemaining} of ${dailyLimit} searches remaining today`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Resets daily at midnight</p>
            </TooltipContent>
          </Tooltip>

          {/* Verification Credits (Monthly) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowAddCredits(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:opacity-80 border ${
                  isOut
                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : isLow
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isOut || isLow ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                {compact ? credits : `${credits} verify`}
                <Plus className="w-3 h-3 ml-0.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">AI Verification Credits</p>
              <p className="text-xs text-muted-foreground">{credits} credits remaining this month</p>
              <p className="text-xs text-muted-foreground mt-1">Click to add more credits</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <AddCreditsModal
        open={showAddCredits}
        onOpenChange={setShowAddCredits}
        currentCredits={credits}
        isOutOfCredits={isOut}
      />
    </>
  );
}
