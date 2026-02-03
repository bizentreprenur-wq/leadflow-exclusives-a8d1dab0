import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Gift,
  DollarSign,
  Users,
  Share2,
  Copy,
  CheckCircle2,
  TrendingUp,
  Wallet,
  ArrowRight,
  Sparkles,
  Star,
  Trophy,
  Coins,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AffiliateStats {
  referralCode: string;
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface AffiliateProgramState {
  isJoined: boolean;
  email: string;
  stats: AffiliateStats;
}

const AFFILIATE_PROGRAM_STORAGE_KEY = "bamlead_affiliate_program_v1";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_STATS: AffiliateStats = {
  referralCode: "",
  totalEarnings: 0,
  pendingEarnings: 0,
  totalReferrals: 0,
  activeReferrals: 0,
  conversionRate: 0,
  tier: "bronze",
};

const tiers = [
  { key: "bronze", name: "Bronze", color: "text-amber-600", requirement: "0-5 referrals", commission: "20%", minReferrals: 0 },
  { key: "silver", name: "Silver", color: "text-slate-400", requirement: "6-15 referrals", commission: "25%", minReferrals: 6 },
  { key: "gold", name: "Gold", color: "text-yellow-500", requirement: "16-30 referrals", commission: "30%", minReferrals: 16 },
  { key: "platinum", name: "Platinum", color: "text-violet-400", requirement: "31+ referrals", commission: "35%", minReferrals: 31 },
] as const;

function getTierByReferrals(referrals: number): AffiliateStats["tier"] {
  if (referrals >= 31) return "platinum";
  if (referrals >= 16) return "gold";
  if (referrals >= 6) return "silver";
  return "bronze";
}

function createReferralCode(seed: string): string {
  const sanitized = seed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const prefix = sanitized.slice(0, 4) || "BAM";
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export default function AffiliateProgram() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AffiliateStats>(DEFAULT_STATS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(AFFILIATE_PROGRAM_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<AffiliateProgramState>;
      if (typeof parsed.email === "string") setEmail(parsed.email);
      if (typeof parsed.isJoined === "boolean") setIsJoined(parsed.isJoined);
      if (parsed.stats) {
        const savedStats = parsed.stats as AffiliateStats;
        setStats({
          ...DEFAULT_STATS,
          ...savedStats,
          tier: getTierByReferrals(savedStats.totalReferrals || 0),
          referralCode:
            typeof savedStats.referralCode === "string" && savedStats.referralCode.trim()
              ? savedStats.referralCode
              : createReferralCode(parsed.email || user?.email || "BAM"),
        });
      }
    } catch {
      // ignore invalid saved state
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  useEffect(() => {
    if (!stats.referralCode) {
      const seed = email || user?.email || "BAM";
      setStats((prev) => ({
        ...prev,
        referralCode: createReferralCode(seed),
      }));
    }
  }, [stats.referralCode, email, user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state: AffiliateProgramState = {
      isJoined,
      email,
      stats: {
        ...stats,
        tier: getTierByReferrals(stats.totalReferrals),
      },
    };
    localStorage.setItem(AFFILIATE_PROGRAM_STORAGE_KEY, JSON.stringify(state));
  }, [isJoined, email, stats]);

  const normalizedTier = useMemo(
    () => getTierByReferrals(stats.totalReferrals),
    [stats.totalReferrals]
  );
  const currentTierIndex = useMemo(
    () => tiers.findIndex((tier) => tier.key === normalizedTier),
    [normalizedTier]
  );
  const currentTier = tiers[currentTierIndex] ?? tiers[0];
  const nextTier = tiers[currentTierIndex + 1];
  const neededForNextTier = nextTier ? Math.max(0, nextTier.minReferrals - stats.totalReferrals) : 0;
  const tierProgress = nextTier
    ? Math.min(
        100,
        ((stats.totalReferrals - currentTier.minReferrals) /
          Math.max(1, nextTier.minReferrals - currentTier.minReferrals)) *
          100
      )
    : 100;
  const isEmailValid = EMAIL_PATTERN.test(email.trim());
  const referralLink = `https://bamlead.com/?ref=${stats.referralCode}`;

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success(successMessage);
      return true;
    } catch {
      toast.error("Copy failed. Please copy manually.");
      return false;
    }
  };

  const openShare = (url: string) => {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      toast.error("Popup blocked. Please allow popups and try again.");
      return;
    }
    popup.opener = null;
  };

  const handleJoin = () => {
    if (!isEmailValid) {
      toast.error("Please enter a valid email");
      return;
    }
    setIsJoined(true);
    setStats((prev) => ({
      ...prev,
      tier: getTierByReferrals(prev.totalReferrals),
      referralCode: prev.referralCode || createReferralCode(email),
    }));
    toast.success("Welcome to the BamLead Affiliate Program!");
  };

  const handleCopy = async () => {
    const didCopy = await copyToClipboard(referralLink, "Link copied to clipboard!");
    if (!didCopy) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!isJoined) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/30">
                <Gift className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-success border-2 border-background">
                <DollarSign className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">Earn Money Referring Friends</CardTitle>
          <CardDescription className="text-base">
            Join our affiliate program and earn up to 35% commission on every referral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <DollarSign className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="font-bold text-foreground">20-35%</p>
              <p className="text-xs text-muted-foreground">Commission Rate</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-bold text-foreground">Recurring</p>
              <p className="text-xs text-muted-foreground">Monthly Payouts</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <Wallet className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-foreground">$50 Min</p>
              <p className="text-xs text-muted-foreground">Payout Threshold</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
              <p className="font-bold text-foreground">Lifetime</p>
              <p className="text-xs text-muted-foreground">Cookie Duration</p>
            </div>
          </div>

          {/* Tier Info */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Commission Tiers:</p>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 text-sm">
                  <Trophy className={`w-4 h-4 ${tier.color}`} />
                  <div>
                    <span className={`font-medium ${tier.color}`}>{tier.name}</span>
                    <span className="text-muted-foreground ml-1">({tier.commission})</span>
                    <p className="text-[11px] text-muted-foreground">{tier.requirement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sign Up Form */}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
          >
            <Input
              type="email"
              placeholder="Enter your email to join"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center"
              aria-label="Affiliate program email"
            />
            <Button type="submit" className="w-full gap-2" size="lg" disabled={!isEmailValid}>
              <Sparkles className="w-4 h-4" />
              Join Affiliate Program
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By joining, you agree to our affiliate terms. No spam, ever.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <CardTitle>Affiliate Dashboard</CardTitle>
              <CardDescription>Track your referrals and earnings</CardDescription>
            </div>
          </div>
          <Badge className="gap-1 capitalize">
            <Trophy className="w-3 h-3" />
            {normalizedTier} Tier
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
            <DollarSign className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-success">${stats.totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
            <Coins className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-warning">${stats.pendingEarnings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <Users className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-cyan-500">{stats.activeReferrals}</p>
            <p className="text-xs text-muted-foreground">Active Referrals</p>
          </div>
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
            <TrendingUp className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-violet-500">{stats.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Conversion</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={() => void handleCopy()} variant="outline" className="shrink-0 gap-2">
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Referral Code */}
        <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Referral Code</p>
            <p className="text-xl font-bold font-mono text-foreground">{stats.referralCode}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void copyToClipboard(stats.referralCode, "Code copied!");
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Share & Earn</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              openShare(`https://twitter.com/intent/tweet?text=Check out BamLead for B2B lead generation!&url=${encodeURIComponent(referralLink)}`);
            }}>
              <Share2 className="w-4 h-4" />
              Twitter
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`);
            }}>
              <Share2 className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              openShare(`mailto:?subject=Check out BamLead&body=I've been using BamLead for lead generation and thought you might like it: ${referralLink}`);
            }}>
              <Share2 className="w-4 h-4" />
              Email
            </Button>
          </div>
        </div>

        {/* Next Tier Info */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
          <Star className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            {nextTier ? (
              <>
                <p className="text-sm font-medium text-foreground">Reach {nextTier.name} Tier</p>
                <p className="text-xs text-muted-foreground">
                  Refer {neededForNextTier} more {neededForNextTier === 1 ? "person" : "people"} to unlock {nextTier.commission} commission
                </p>
                <Progress value={tierProgress} className="h-1.5 mt-2" />
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">Top Tier Unlocked</p>
                <p className="text-xs text-muted-foreground">
                  You are at {currentTier.name} tier with maximum commission.
                </p>
              </>
            )}
          </div>
          <Badge variant="outline">{nextTier ? `+${Number.parseInt(nextTier.commission, 10) - Number.parseInt(currentTier.commission, 10)}%` : "Max"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
