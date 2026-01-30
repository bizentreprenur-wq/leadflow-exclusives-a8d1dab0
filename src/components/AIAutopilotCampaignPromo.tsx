import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Crown, Bot, Zap, Rocket, Brain, Clock, 
  Mail, Target, CheckCircle2, Play, ArrowRight,
  Users, FileText, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const wizardSteps = [
  { step: 1, label: 'Leads', icon: Users },
  { step: 2, label: 'Template', icon: FileText },
  { step: 3, label: 'Sequence', icon: Zap },
  { step: 4, label: 'Launch', icon: Rocket },
];

const stepContent = [
  {
    title: 'Select Your Leads',
    description: 'Choose from your verified leads or let AI automatically select the highest-scoring prospects.',
    features: [
      { icon: Target, title: 'Smart Selection', desc: 'AI picks leads with highest conversion potential' },
      { icon: Brain, title: 'Lead Scoring', desc: 'Prioritizes leads with verified emails (+35 points)' },
      { icon: Users, title: 'Bulk Import', desc: 'Import from search results or CSV files' },
    ],
  },
  {
    title: 'Choose Your Template',
    description: 'Select from high-converting templates or let AI generate personalized messages.',
    features: [
      { icon: FileText, title: 'Template Gallery', desc: 'Pre-built templates for every industry' },
      { icon: Sparkles, title: 'AI Personalization', desc: 'Dynamic content based on lead data' },
      { icon: Mail, title: 'A/B Testing', desc: 'Test multiple versions automatically' },
    ],
  },
  {
    title: 'Configure Sequence',
    description: 'Set up intelligent drip sequences with smart timing and response detection.',
    features: [
      { icon: Zap, title: 'Smart Timing', desc: 'Sends at optimal engagement hours' },
      { icon: Clock, title: 'Follow-up Logic', desc: 'Automatic escalation patterns' },
      { icon: Brain, title: 'AI Strategy', desc: 'The brain that guides all decisions' },
    ],
  },
  {
    title: 'Review & Launch',
    description: 'Final verification before AI takes full control of your outreach campaign.',
    features: [
      { icon: CheckCircle2, title: 'Campaign Preview', desc: 'Review all emails before sending' },
      { icon: Rocket, title: 'One-Click Launch', desc: 'AI handles everything from here' },
      { icon: Target, title: 'Real-time Monitoring', desc: 'Track responses and conversions live' },
    ],
  },
];

export default function AIAutopilotCampaignPromo() {
  const [activeStep, setActiveStep] = useState(0);
  const currentContent = stepContent[activeStep];

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setActiveStep((prev) => Math.min(wizardSteps.length - 1, prev + 1));
  };

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

        {/* Interactive Wizard Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-1 md:gap-2 bg-card/80 backdrop-blur-sm rounded-full p-2 max-w-2xl mx-auto border border-border">
            {wizardSteps.map((item, index) => (
              <button
                key={item.step}
                onClick={() => setActiveStep(index)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all cursor-pointer ${
                  activeStep === index
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">{item.step}. {item.label}</span>
                <span className="text-sm sm:hidden">{item.step}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Feature Card with Dynamic Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTllMGIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0YzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
            
            <CardContent className="relative z-10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Dynamic Step Content */}
                <div className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                          <Bot className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                              Step {activeStep + 1} of 4
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-foreground">{currentContent.title}</h3>
                        </div>
                      </div>

                      <p className="text-muted-foreground">{currentContent.description}</p>

                      {/* Dynamic Feature List */}
                      <div className="space-y-4">
                        {currentContent.features.map((feature) => (
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

                      {/* Navigation Buttons */}
                      <div className="flex items-center gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                          disabled={activeStep === 0}
                          className="gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          onClick={handleNextStep}
                          disabled={activeStep === wizardSteps.length - 1}
                          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          Next Step
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
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
                        7-Day Free Trial
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
                      <Link to="/pricing">
                        <Rocket className="w-5 h-5" />
                        Subscribe Now
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      7-day free trial • Then $19.99/mo
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
