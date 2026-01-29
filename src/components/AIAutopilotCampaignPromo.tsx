import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Crown, Bot, Zap, Sparkles, Rocket, Brain, Clock, 
  Mail, Target, TrendingUp, CheckCircle2, Play, ArrowRight
} from 'lucide-react';

export default function AIAutopilotCampaignPromo() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-background to-muted/30 overflow-hidden">
      <div className="container px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm mb-4">
            <Crown className="w-4 h-4 mr-2" />
            NEW: AI Autopilot Campaign
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Let AI Handle Your
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Entire Outreach</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Set it and forget it. Our AI Autopilot Campaign manages drip sequences, detects responses, 
            and nurtures leads automatically until they're ready to talk.
          </p>
        </motion.div>

        {/* Main Feature Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTllMGIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0YzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
            
            <CardContent className="relative z-10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Features */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">AI Autopilot Campaign</h3>
                      <p className="text-muted-foreground">Fully automated lead nurturing</p>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-4">
                    {[
                      { icon: Brain, title: 'Smart Lead Analysis', desc: 'AI classifies leads by intent & priority' },
                      { icon: Zap, title: 'Intelligent Sequences', desc: 'Context-aware follow-up patterns' },
                      { icon: Clock, title: 'Optimal Timing', desc: 'Sends at peak engagement hours' },
                      { icon: Mail, title: 'Response Detection', desc: 'Pauses sequences when leads reply' },
                      { icon: Target, title: 'Intent Classification', desc: 'Routes hot leads for immediate action' },
                    ].map((feature) => (
                      <div key={feature.title} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{feature.title}</p>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Pricing & CTA */}
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: '40%', label: 'Higher Opens' },
                      { value: '3x', label: 'More Replies' },
                      { value: '24/7', label: 'Automated' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-2xl font-bold text-amber-500">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Box */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subscription</p>
                        <p className="text-3xl font-bold text-foreground">
                          $19.99<span className="text-lg font-normal text-muted-foreground">/month</span>
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm py-1">
                        14-Day Free Trial
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {['Unlimited AI sequences', 'Smart response detection', 'Priority lead routing', 'Performance analytics'].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {item}
                        </div>
                      ))}
                    </div>

                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 py-6 text-lg font-bold"
                    >
                      <Link to="/mailbox-demo">
                        <Rocket className="w-5 h-5" />
                        Try AI Autopilot Free
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      No credit card required for trial
                    </p>
                  </div>

                  {/* How it works mini */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Play className="w-4 h-4" />
                    See how it works in the Mailbox Demo
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { step: 1, title: 'Search Leads', desc: 'Find businesses with AI' },
            { step: 2, title: 'AI Analyzes', desc: 'Classifies by priority' },
            { step: 3, title: 'Auto Sequences', desc: 'Smart drip campaigns' },
            { step: 4, title: 'You Close Deals', desc: 'Only talk to hot leads' },
          ].map((item) => (
            <div 
              key={item.step}
              className="p-4 rounded-xl bg-card border border-border text-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
