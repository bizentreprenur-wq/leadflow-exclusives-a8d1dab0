import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Gift,
  Trophy,
  Users,
  Star,
  Zap,
  ArrowRight,
  Brain,
  Target,
  Mail,
  Mic,
  Palette,
  BarChart3,
  Shield,
  Wand2,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-Time Website Analysis",
    description: "Live website scraping analyzes CMS, page speed, mobile score, SSL, SEO gaps, and tech stack in real-time",
    badge: "NEW",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Full Research Report Export",
    description: "Export complete AI intelligence reports as PDF, Excel, or directly to Google Drive for client presentations",
    badge: "NEW",
    badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Brain,
    title: "10 AI Research Categories",
    description: "Website health, online presence, reputation, AI opportunities, tech stack, buying signals, competitors, sales readiness, compliance, and smart actions",
    badge: "EXCLUSIVE",
    badgeColor: "bg-gradient-to-r from-primary to-accent text-white",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "AI Template Suggestions",
    description: "Smart AI analyzes your leads' industry and recommends the highest-converting email templates automatically",
    badge: "AI Powered",
    badgeColor: "bg-warning text-warning-foreground",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Wand2,
    title: "AI Email Assistant",
    description: "Get AI-powered subject lines, opening hooks, and CTAs personalized for each lead with one click",
    badge: "Smart",
    badgeColor: "bg-violet-500 text-white",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Bot,
    title: "AI Sales Mentor",
    description: "Personal AI coach that helps you practice pitches, handle objections, and close more deals",
    badge: "Exclusive",
    badgeColor: "bg-primary text-primary-foreground",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Trophy,
    title: "Referral Leaderboard",
    description: "Compete with other affiliates, earn badges, and climb the ranks for exclusive rewards",
    badge: "Gamified",
    badgeColor: "bg-amber-500 text-white",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Gift,
    title: "Affiliate Program",
    description: "Earn up to 35% commission on every referral with lifetime cookie tracking",
    badge: "Earn Money",
    badgeColor: "bg-success text-success-foreground",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Mic,
    title: "Voice Search",
    description: "Find leads using just your voice - speak and we'll search",
    badge: "Hands-free",
    badgeColor: "bg-blue-500 text-white",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Mail,
    title: "Smart Email Builder",
    description: "Build and customize email campaigns with real-time preview and personalization tokens",
    badge: "Pro",
    badgeColor: "bg-cyan-500 text-white",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Interactive Analytics",
    description: "Beautiful charts and real-time stats to track your outreach performance",
    badge: "Visual",
    badgeColor: "bg-pink-500 text-white",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "AI Lead Verification",
    description: "Verify emails, validate phones, and score leads automatically with 95% accuracy",
    badge: "Accurate",
    badgeColor: "bg-orange-500 text-white",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export default function NewFeaturesShowcase() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 gap-1">
              <Sparkles className="w-3 h-3" />
              What's New
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Packed with Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time website analysis, full research report exports, 10 AI categories, and 100+ data points — everything you need to find, analyze, and close deals
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg"
              >
                {/* Badge */}
                <Badge className={`absolute top-4 right-4 text-xs ${feature.badgeColor}`}>
                  {feature.badge}
                </Badge>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 px-8">
                  <Zap className="w-5 h-5" />
                  Try All Features Free
                </Button>
              </Link>
              <Link to="/reviews">
                <Button size="lg" variant="outline" className="gap-2">
                  <Star className="w-5 h-5" />
                  See Customer Reviews
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 7-day Pro trial included
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
