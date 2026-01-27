import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Mail, 
  Settings, 
  Send, 
  CheckCircle2, 
  Clock, 
  Rocket,
  Video,
  BookOpen,
  ChevronRight,
  Star,
  Zap,
  Target,
  Brain,
  Heart,
  Search,
  LineChart,
  UserCircle,
  Handshake,
  Wand2,
  User,
  Phone,
  Database,
  FileSpreadsheet,
  Bot
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  steps: string[];
  category: 'setup' | 'campaign' | 'advanced' | 'ai-agents';
  videoPlaceholder: string;
}

const tutorials: Tutorial[] = [
  // Setup Tutorials
  {
    id: 'smtp-setup',
    title: 'Set Up Your SMTP Server',
    description: 'Connect your email (Gmail, Outlook, or custom domain) to start sending campaigns',
    duration: '3 min',
    icon: <Settings className="h-5 w-5" />,
    category: 'setup',
    videoPlaceholder: 'SMTP Setup Tutorial',
    steps: [
      'Go to Settings → Email Configuration',
      'Enter your SMTP host (smtp.gmail.com for Gmail)',
      'Add port number (587 for TLS, 465 for SSL)',
      'Enter your email username and app password',
      'Click "Test Connection" to verify',
      'Save your settings and you\'re ready!'
    ]
  },
  {
    id: 'gmail-app-password',
    title: 'Create Gmail App Password',
    description: 'Step-by-step guide to generate an app password for Gmail SMTP',
    duration: '2 min',
    icon: <Mail className="h-5 w-5" />,
    category: 'setup',
    videoPlaceholder: 'Gmail App Password Tutorial',
    steps: [
      'Go to Google Account → Security',
      'Enable 2-Step Verification if not active',
      'Search for "App passwords"',
      'Select "Mail" and your device',
      'Click Generate and copy the 16-character password',
      'Use this password in BamLead SMTP settings'
    ]
  },
  {
    id: 'crm-integration',
    title: 'Connect Your CRM',
    description: 'Integrate with HubSpot, Salesforce, Pipedrive, or Google Sheets',
    duration: '4 min',
    icon: <Database className="h-5 w-5" />,
    category: 'setup',
    videoPlaceholder: 'CRM Integration Tutorial',
    steps: [
      'Go to Step 4: Outreach Hub → CRM Integration',
      'Select your preferred CRM platform',
      'Click "Connect" to start OAuth flow',
      'Authorize BamLead access to your CRM',
      'Map lead fields to your CRM properties',
      'Export leads directly with one click'
    ]
  },
  // Campaign Tutorials
  {
    id: 'first-campaign',
    title: 'Send Your First Campaign',
    description: 'Learn how to create and send your first email outreach campaign',
    duration: '5 min',
    icon: <Send className="h-5 w-5" />,
    category: 'campaign',
    videoPlaceholder: 'First Campaign Tutorial',
    steps: [
      'Search for leads using the Lead Finder',
      'Review and verify your leads with AI',
      'Select leads and click "Send Email"',
      'Choose a template or write custom email',
      'Preview your email and personalize',
      'Select delivery mode (Instant, Drip, or Scheduled)',
      'Click Send and monitor your campaign!'
    ]
  },
  {
    id: 'drip-campaigns',
    title: 'Set Up Drip Campaigns',
    description: 'Automate your outreach with staggered email delivery',
    duration: '3 min',
    icon: <Target className="h-5 w-5" />,
    category: 'campaign',
    videoPlaceholder: 'Drip Campaign Tutorial',
    steps: [
      'Select your verified leads',
      'Click "Send Email" to open composer',
      'Choose "Drip" delivery mode',
      'Set emails per hour (recommended: 20-30)',
      'Configure delay between emails',
      'Start campaign and watch the mailbox animation',
      'Monitor delivery progress and ETA'
    ]
  },
  {
    id: 'template-gallery',
    title: 'Using Email Templates',
    description: 'Access 80+ high-converting templates for any industry',
    duration: '4 min',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    category: 'campaign',
    videoPlaceholder: 'Template Gallery Tutorial',
    steps: [
      'Open Email Composer from any lead selection',
      'Click "Template Gallery" tab',
      'Browse by category: Sales, Marketing, Recruiting, etc.',
      'Preview template with sample data',
      'Click "Use Template" to load into composer',
      'Customize subject line and body as needed',
      'Use {{placeholders}} for personalization'
    ]
  },
  // Advanced Features
  {
    id: 'ai-scoring',
    title: 'Using AI Lead Scoring',
    description: 'Understand how AI prioritizes your leads for maximum conversions',
    duration: '4 min',
    icon: <Zap className="h-5 w-5" />,
    category: 'advanced',
    videoPlaceholder: 'AI Lead Scoring Tutorial',
    steps: [
      'Click "AI Verify Leads" on your lead list',
      'AI analyzes each lead\'s website and data',
      'View Hot, Warm, and Nurture categories',
      'Check AI Insights for patterns and pain points',
      'Use "AI Write" to generate personalized emails',
      'Focus on highest-scoring leads first'
    ]
  },
  {
    id: 'voice-calling',
    title: 'Voice Calling & Call Logging',
    description: 'Make calls directly from the dashboard and log outcomes',
    duration: '3 min',
    icon: <Phone className="h-5 w-5" />,
    category: 'advanced',
    videoPlaceholder: 'Voice Calling Tutorial',
    steps: [
      'Click the phone icon next to any lead',
      'View AI-generated call script suggestions',
      'Click to initiate call (uses your phone)',
      'Log call outcome: Answered, Voicemail, No Answer',
      'Add notes for follow-up actions',
      'View call history in Call Log panel'
    ]
  },
  {
    id: 'ai-autopilot-campaign',
    title: 'AI Autopilot Campaign',
    description: 'Let AI create and optimize your entire outreach campaign',
    duration: '5 min',
    icon: <Bot className="h-5 w-5" />,
    category: 'advanced',
    videoPlaceholder: 'AI Autopilot Campaign Tutorial',
    steps: [
      'Open the AI Autopilot Campaign from dashboard',
      'Select your target industry and audience',
      'Let AI analyze your lead data',
      'Review AI-suggested email sequences',
      'Customize timing and follow-up rules',
      'Activate campaign with one click',
      'Monitor AI-optimized delivery in real-time'
    ]
  },
  // AI Agents Tutorials
  {
    id: 'pre-intent-detection',
    title: 'Pre-Intent Detection Agent',
    description: 'Detects buying signals before prospects even know they\'re ready',
    duration: '4 min',
    icon: <Brain className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Pre-Intent Detection Tutorial',
    steps: [
      'Access AI Agents from the Secret AI section',
      'Select "Pre-Intent Detection" agent',
      'AI scans prospect digital footprints',
      'Identifies behavioral micro-signals (job posts, tech changes)',
      'View intent score and buying readiness level',
      'Get optimal outreach timing recommendations',
      'Launch campaigns when intent peaks'
    ]
  },
  {
    id: 'emotional-state-detection',
    title: 'Emotional State Detection Agent',
    description: 'Analyzes prospect emotional state for optimal outreach timing',
    duration: '3 min',
    icon: <Heart className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Emotional State Detection Tutorial',
    steps: [
      'Open the Emotional State Detection agent',
      'AI analyzes prospect\'s recent communications',
      'Detects frustration, urgency, or satisfaction levels',
      'View emotional timeline and patterns',
      'Get "Best Time to Reach" recommendations',
      'Adjust email tone based on emotional state',
      'Increase response rates by 3x'
    ]
  },
  {
    id: 'reverse-lead-discovery',
    title: 'Reverse Lead Discovery Agent',
    description: 'Finds leads that are actively searching for your services',
    duration: '4 min',
    icon: <Search className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Reverse Lead Discovery Tutorial',
    steps: [
      'Define your service offerings and keywords',
      'AI monitors search intent signals',
      'Identifies companies researching your solutions',
      'View "Actively Searching" lead list',
      'See what specific terms they\'re researching',
      'Prioritize these high-intent leads',
      'Craft messages addressing their exact needs'
    ]
  },
  {
    id: 'outcome-simulator',
    title: 'Outcome Simulator Agent',
    description: 'Predicts campaign outcomes before you send',
    duration: '3 min',
    icon: <LineChart className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Outcome Simulator Tutorial',
    steps: [
      'Create your email campaign as usual',
      'Click "Simulate Outcomes" before sending',
      'AI predicts open rates, reply rates, conversions',
      'View expected ROI and revenue projections',
      'Get suggestions to improve predictions',
      'Compare different subject lines and content',
      'Send with confidence knowing expected results'
    ]
  },
  {
    id: 'psychological-profiler',
    title: 'Psychological Profiler Agent',
    description: 'Creates detailed buyer personas for personalized outreach',
    duration: '4 min',
    icon: <UserCircle className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Psychological Profiler Tutorial',
    steps: [
      'Select a lead to analyze',
      'AI builds psychological profile from public data',
      'View communication style preferences',
      'Understand decision-making patterns',
      'See persuasion triggers and pain points',
      'Get personalized email angle suggestions',
      'Match your message to their psychology'
    ]
  },
  {
    id: 'invisible-negotiator',
    title: 'Invisible Negotiator Agent',
    description: 'AI-powered negotiation assistance for closing deals',
    duration: '5 min',
    icon: <Handshake className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Invisible Negotiator Tutorial',
    steps: [
      'Activate when lead shows purchase interest',
      'AI analyzes negotiation leverage points',
      'Get real-time response suggestions',
      'View optimal pricing strategies',
      'Handle objections with AI-crafted responses',
      'Track negotiation progress and sentiment',
      'Close deals faster with AI guidance'
    ]
  },
  {
    id: 'live-page-mutation',
    title: 'Live Page Mutation Agent',
    description: 'Real-time content personalization for each prospect',
    duration: '3 min',
    icon: <Wand2 className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'Live Page Mutation Tutorial',
    steps: [
      'Share your landing page with prospects',
      'AI detects visitor identity and company',
      'Page content adapts in real-time',
      'Headlines, images, and CTAs personalize',
      'View engagement analytics per visitor',
      'Track conversion improvements',
      'No coding required for personalization'
    ]
  },
  {
    id: 'founder-mirror',
    title: 'AI Founder Mirror Agent',
    description: 'Learns your communication style for authentic AI responses',
    duration: '4 min',
    icon: <User className="h-5 w-5" />,
    category: 'ai-agents',
    videoPlaceholder: 'AI Founder Mirror Tutorial',
    steps: [
      'Connect your email and calendar',
      'AI learns your writing patterns and style',
      'Review your "communication DNA" profile',
      'Enable AI to draft responses in your voice',
      'Approve or edit AI-drafted emails',
      'Train the model with feedback',
      'Scale your personal touch to 1000s of leads'
    ]
  }
];

export function VideoTutorialSection() {
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    const saved = localStorage.getItem('bamlead_completed_tutorials');
    return saved ? JSON.parse(saved) : [];
  });

  const markComplete = (tutorialId: string) => {
    const updated = [...completedTutorials, tutorialId];
    setCompletedTutorials(updated);
    localStorage.setItem('bamlead_completed_tutorials', JSON.stringify(updated));
  };

  const setupTutorials = tutorials.filter(t => t.category === 'setup');
  const campaignTutorials = tutorials.filter(t => t.category === 'campaign');
  const advancedTutorials = tutorials.filter(t => t.category === 'advanced');
  const aiAgentsTutorials = tutorials.filter(t => t.category === 'ai-agents');

  const TutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
    const isCompleted = completedTutorials.includes(tutorial.id);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Card 
            className={`cursor-pointer hover:border-primary/50 transition-all hover:shadow-md ${
              isCompleted ? 'border-green-500/30 bg-green-500/5' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20' : 'bg-primary/10'}`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : tutorial.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{tutorial.title}</h4>
                    {isCompleted && <Badge variant="outline" className="text-green-600 border-green-500/50 text-xs">Done</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tutorial.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {tutorial.duration}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Play className="h-3 w-3 mr-1" />
                      Watch
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tutorial.icon}
              {tutorial.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Video Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">{tutorial.videoPlaceholder}</p>
                <p className="text-xs text-muted-foreground mt-1">Video coming soon • Follow steps below</p>
              </div>
            </div>

            {/* Step-by-step Guide */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Step-by-Step Guide
              </h4>
              <ol className="space-y-2">
                {tutorial.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {tutorial.duration}
              </Badge>
              {!isCompleted ? (
                <Button onClick={() => markComplete(tutorial.id)} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Complete
                </Button>
              ) : (
                <Badge className="bg-green-500 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const progress = Math.round((completedTutorials.length / tutorials.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Quick Start Tutorials
          </h2>
          <p className="text-muted-foreground mt-1">
            Master BamLead's AI-powered features in minutes
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{progress}%</div>
          <p className="text-xs text-muted-foreground">{completedTutorials.length}/{tutorials.length} complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Quick Start - Essential Setup */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Essential Setup
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Start Here</Badge>
          </CardTitle>
          <CardDescription>Complete these first to start sending campaigns</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {setupTutorials.map(tutorial => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </CardContent>
      </Card>

      {/* Your First Campaign */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            Campaign Mastery
          </CardTitle>
          <CardDescription>Learn the complete outreach workflow</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {campaignTutorials.map(tutorial => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Advanced Features
            <Badge variant="outline">Pro Tips</Badge>
          </CardTitle>
          <CardDescription>Master these to maximize your results</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {advancedTutorials.map(tutorial => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </CardContent>
      </Card>

      {/* Revolutionary AI Agents */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Revolutionary AI Agents
            <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">8 AI Agents</Badge>
          </CardTitle>
          <CardDescription>Unlock the power of BamLead's exclusive AI capabilities</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {aiAgentsTutorials.map(tutorial => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <p>
          💡 <strong>Pro Tip:</strong> Complete "Essential Setup" first, then explore AI Agents to 10x your outreach effectiveness!
        </p>
      </div>
    </div>
  );
}