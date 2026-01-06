import { useState } from "react";
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

interface AffiliateStats {
  referralCode: string;
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export default function AffiliateProgram() {
  const [email, setEmail] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  // Demo affiliate stats
  const [stats] = useState<AffiliateStats>({
    referralCode: "BAM" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    totalEarnings: 0,
    pendingEarnings: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    tier: "bronze",
  });

  const referralLink = `https://bamlead.com/?ref=${stats.referralCode}`;

  const handleJoin = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setIsJoined(true);
    toast.success("Welcome to the BamLead Affiliate Program! 🎉");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const tiers = [
    { name: "Bronze", color: "text-amber-600", requirement: "0-5 referrals", commission: "20%" },
    { name: "Silver", color: "text-slate-400", requirement: "6-15 referrals", commission: "25%" },
    { name: "Gold", color: "text-yellow-500", requirement: "16-30 referrals", commission: "30%" },
    { name: "Platinum", color: "text-violet-400", requirement: "31+ referrals", commission: "35%" },
  ];

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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your email to join"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center"
            />
            <Button className="w-full gap-2" size="lg" onClick={handleJoin}>
              <Sparkles className="w-4 h-4" />
              Join Affiliate Program
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

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
            {stats.tier} Tier
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
            <DollarSign className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-success">${stats.totalEarnings}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
            <Coins className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-warning">${stats.pendingEarnings}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
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
            <Button onClick={handleCopy} variant="outline" className="shrink-0 gap-2">
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
          <Button variant="ghost" size="sm" onClick={() => {
            navigator.clipboard.writeText(stats.referralCode);
            toast.success("Code copied!");
          }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Share & Earn</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              window.open(`https://twitter.com/intent/tweet?text=Check out BamLead for B2B lead generation!&url=${encodeURIComponent(referralLink)}`, "_blank");
            }}>
              <Share2 className="w-4 h-4" />
              Twitter
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
            }}>
              <Share2 className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              window.open(`mailto:?subject=Check out BamLead&body=I've been using BamLead for lead generation and thought you might like it: ${referralLink}`, "_blank");
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
            <p className="text-sm font-medium text-foreground">Reach Silver Tier</p>
            <p className="text-xs text-muted-foreground">Refer 6 more people to unlock 25% commission</p>
          </div>
          <Badge variant="outline">+5%</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
