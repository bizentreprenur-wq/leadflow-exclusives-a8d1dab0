import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Crown,
  Check,
  ArrowRight,
  Sparkles,
  BarChart3,
  Target,
  Bot,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LEADSYNC_PLANS_ARRAY, formatLimit } from '@/lib/leadsyncPricing';

const tierColors = {
  starter: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  pro: {
    gradient: 'from-violet-500 to-fuchsia-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
  },
  agency: {
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

const tierIcons = {
  starter: Zap,
  pro: Crown,
  agency: Target,
};

const automationSteps = [
  { icon: Users, label: 'AI finds leads', color: 'text-blue-400' },
  { icon: Mail, label: 'Sends personalized emails', color: 'text-emerald-400' },
  { icon: MessageSquare, label: 'Follows up via SMS', color: 'text-amber-400' },
  { icon: Phone, label: 'AI calls & qualifies', color: 'text-violet-400' },
  { icon: BarChart3, label: 'Reports to your inbox', color: 'text-rose-400' },
];

export default function LeadSyncShowcase() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl" />

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-6"
          >
            <Bot className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">NEW: LeadSync AI</span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            100% Hands-Off Lead Generation
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              While You Sleep
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            LeadSync AI automates the entire outreach process—from finding leads to scheduling meetings—delivered straight to your inbox and calendar.
          </motion.p>
        </div>

        {/* Automation Flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          {automationSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700">
                <step.icon className={`w-4 h-4 ${step.color}`} />
                <span className="text-sm text-slate-300">{step.label}</span>
              </div>
              {index < automationSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {LEADSYNC_PLANS_ARRAY.map((plan, index) => {
            const colors = tierColors[plan.id];
            const Icon = tierIcons[plan.id];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className={`relative h-full bg-slate-900/80 backdrop-blur border-slate-700 hover:border-slate-600 transition-all ${
                    plan.popular ? 'ring-2 ring-violet-500 border-violet-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-400">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-400">/mo</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Users className="w-4 h-4" />
                          Leads/month
                        </div>
                        <span className="font-semibold text-white">
                          {formatLimit(plan.features.leadsPerMonth)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-4 h-4" />
                          Emails/month
                        </div>
                        <span className="font-semibold text-white">
                          {formatLimit(plan.features.emailsPerMonth)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-4 h-4" />
                          AI Call Minutes
                        </div>
                        <span className="font-semibold text-white">
                          {plan.features.aiCallMinutes} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <MessageSquare className="w-4 h-4" />
                          SMS Messages
                        </div>
                        <span className="font-semibold text-white">
                          {formatLimit(plan.features.smsPerMonth)}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-5 pt-4 border-t border-slate-800">
                      {plan.highlights.slice(4).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link to="/pricing">
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300">
              7-day free trial on all plans • No credit card required to start
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
