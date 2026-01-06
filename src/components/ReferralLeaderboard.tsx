import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  Zap,
  Target,
  Gift,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Lock,
} from "lucide-react";

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar?: string;
  referrals: number;
  earnings: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  badges: string[];
  streak: number;
  isCurrentUser?: boolean;
}

const tierConfig = {
  bronze: { color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30", icon: Medal },
  silver: { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/30", icon: Medal },
  gold: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Trophy },
  platinum: { color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", icon: Crown },
  diamond: { color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30", icon: Crown },
};

const badgeIcons: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "first-referral": { icon: Star, color: "text-yellow-500", label: "First Referral" },
  "streak-7": { icon: Flame, color: "text-orange-500", label: "7-Day Streak" },
  "streak-30": { icon: Flame, color: "text-red-500", label: "30-Day Streak" },
  "top-10": { icon: Trophy, color: "text-amber-500", label: "Top 10" },
  "top-3": { icon: Crown, color: "text-yellow-400", label: "Top 3" },
  "champion": { icon: Crown, color: "text-purple-500", label: "Champion" },
  "power-referrer": { icon: Zap, color: "text-blue-500", label: "Power Referrer" },
  "early-adopter": { icon: Sparkles, color: "text-pink-500", label: "Early Adopter" },
  "milestone-10": { icon: Target, color: "text-green-500", label: "10 Referrals" },
  "milestone-50": { icon: Award, color: "text-emerald-500", label: "50 Referrals" },
  "milestone-100": { icon: Award, color: "text-cyan-500", label: "100 Referrals" },
};

// Demo leaderboard data
const demoLeaderboard: LeaderboardUser[] = [
  { rank: 1, name: "Alex Thompson", referrals: 147, earnings: 2940, tier: "diamond", badges: ["champion", "streak-30", "milestone-100"], streak: 45 },
  { rank: 2, name: "Sarah Chen", referrals: 98, earnings: 1960, tier: "platinum", badges: ["top-3", "streak-30", "milestone-50"], streak: 32 },
  { rank: 3, name: "Mike Rodriguez", referrals: 76, earnings: 1520, tier: "platinum", badges: ["top-3", "power-referrer", "milestone-50"], streak: 21 },
  { rank: 4, name: "Emily Watson", referrals: 52, earnings: 1040, tier: "gold", badges: ["top-10", "streak-7", "milestone-50"], streak: 14 },
  { rank: 5, name: "David Kim", referrals: 43, earnings: 860, tier: "gold", badges: ["top-10", "milestone-10"], streak: 8 },
  { rank: 6, name: "Lisa Park", referrals: 31, earnings: 620, tier: "silver", badges: ["top-10", "streak-7"], streak: 12 },
  { rank: 7, name: "James Wilson", referrals: 24, earnings: 480, tier: "silver", badges: ["top-10", "first-referral"], streak: 5 },
  { rank: 8, name: "Anna Brown", referrals: 18, earnings: 360, tier: "silver", badges: ["milestone-10", "early-adopter"], streak: 3 },
  { rank: 9, name: "Chris Lee", referrals: 12, earnings: 240, tier: "bronze", badges: ["milestone-10"], streak: 2 },
  { rank: 10, name: "You", referrals: 0, earnings: 0, tier: "bronze", badges: ["early-adopter"], streak: 0, isCurrentUser: true },
];

const rewards = [
  { referrals: 5, reward: "Free month of Pro", unlocked: false },
  { referrals: 10, reward: "$50 Amazon Gift Card", unlocked: false },
  { referrals: 25, reward: "Exclusive Mastermind Access", unlocked: false },
  { referrals: 50, reward: "1-on-1 Strategy Call", unlocked: false },
  { referrals: 100, reward: "Lifetime Pro Account", unlocked: false },
];

export default function ReferralLeaderboard() {
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const currentUser = demoLeaderboard.find(u => u.isCurrentUser);
  const nextMilestone = rewards.find(r => !r.unlocked);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoLeaderboard.length}</p>
            <p className="text-xs text-muted-foreground">Active Affiliates</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">
              {demoLeaderboard.reduce((sum, u) => sum + u.referrals, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Gift className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-warning">
              ${demoLeaderboard.reduce((sum, u) => sum + u.earnings, 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Payouts</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-500">
              {Math.max(...demoLeaderboard.map(u => u.streak))}
            </p>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  Top Affiliates
                </CardTitle>
                <CardDescription>This month's referral champions</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {demoLeaderboard.map((user) => {
                  const config = tierConfig[user.tier];
                  const TierIcon = config.icon;
                  
                  return (
                    <button
                      key={user.rank}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                        user.isCurrentUser 
                          ? "border-primary bg-primary/5" 
                          : selectedUser?.rank === user.rank
                          ? "border-primary/50 bg-secondary/50"
                          : "border-border hover:border-primary/30 hover:bg-secondary/30"
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                        user.rank === 2 ? "bg-slate-400/20 text-slate-400" :
                        user.rank === 3 ? "bg-amber-600/20 text-amber-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {user.rank <= 3 ? (
                          user.rank === 1 ? <Crown className="w-4 h-4" /> :
                          user.rank === 2 ? <Medal className="w-4 h-4" /> :
                          <Medal className="w-4 h-4" />
                        ) : (
                          user.rank
                        )}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {user.name}
                            {user.isCurrentUser && (
                              <span className="text-primary ml-1">(You)</span>
                            )}
                          </span>
                          <div className={`p-0.5 rounded ${config.bg}`}>
                            <TierIcon className={`w-3 h-3 ${config.color}`} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{user.referrals} referrals</span>
                          {user.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-orange-500">
                              <Flame className="w-3 h-3" />
                              {user.streak}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges Preview */}
                      <div className="flex -space-x-1">
                        {user.badges.slice(0, 3).map((badge, idx) => {
                          const badgeConfig = badgeIcons[badge];
                          if (!badgeConfig) return null;
                          return (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center"
                              title={badgeConfig.label}
                            >
                              <badgeConfig.icon className={`w-3 h-3 ${badgeConfig.color}`} />
                            </div>
                          );
                        })}
                        {user.badges.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">
                            +{user.badges.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Earnings */}
                      <div className="text-right">
                        <p className="font-bold text-success">${user.earnings}</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Progress */}
          {currentUser && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Rank</span>
                  <span className="font-bold text-foreground">#{currentUser.rank}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Referrals</span>
                  <span className="font-bold text-foreground">{currentUser.referrals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-bold text-success">${currentUser.earnings}</span>
                </div>
                
                {nextMilestone && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Next reward at {nextMilestone.referrals} referrals</p>
                    <Progress value={(currentUser.referrals / nextMilestone.referrals) * 100} className="h-2" />
                    <p className="text-xs text-primary mt-1">{nextMilestone.reward}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rewards */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-warning" />
                Milestone Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewards.map((reward, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      reward.unlocked
                        ? "bg-success/10 border-success/30"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    {reward.unlocked ? (
                      <Award className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${reward.unlocked ? "text-success" : "text-foreground"}`}>
                        {reward.reward}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reward.referrals} referrals
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Badges Collection */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Badge Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(badgeIcons).map(([key, badge]) => {
                  const earned = currentUser?.badges.includes(key);
                  return (
                    <div
                      key={key}
                      className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                        earned
                          ? "bg-card border-2 border-primary/30"
                          : "bg-muted/30 border border-border opacity-40"
                      }`}
                      title={badge.label}
                    >
                      <badge.icon className={`w-5 h-5 ${earned ? badge.color : "text-muted-foreground"}`} />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {currentUser?.badges.length || 0} / {Object.keys(badgeIcons).length} badges earned
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
