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
    icon: Bot,
    title: "AI Sales Mentor",
    description: "Personal AI coach that helps you practice pitches, handle objections, and close more deals",
    badge: "Exclusive",
    badgeColor: "bg-primary text-primary-foreground",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "Sentiment Analyzer",
    description: "AI analyzes your email tone and suggests improvements before sending",
    badge: "AI Powered",
    badgeColor: "bg-warning text-warning-foreground",
    color: "text-warning",
    bgColor: "bg-warning/10",
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
    badgeColor: "bg-violet-500 text-white",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Wand2,
    title: "AI Email Writer",
    description: "Generate personalized cold emails in seconds with AI",
    badge: "AI Powered",
    badgeColor: "bg-warning text-warning-foreground",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Interactive Analytics",
    description: "Beautiful charts and real-time stats to track your outreach performance",
    badge: "Visual",
    badgeColor: "bg-cyan-500 text-white",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Palette,
    title: "Background Remover",
    description: "Remove image backgrounds instantly for professional email graphics",
    badge: "Browser AI",
    badgeColor: "bg-pink-500 text-white",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "AI Lead Verification",
    description: "Verify emails, validate phones, and score leads automatically",
    badge: "Accurate",
    badgeColor: "bg-emerald-500 text-white",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export default function NewFeaturesShowcase() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-secondary/20 to-background">
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
              Everything you need to find leads, verify contacts, and close deals - all in one platform
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
