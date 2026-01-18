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
  Target
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  steps: string[];
  category: 'setup' | 'campaign' | 'advanced';
  videoPlaceholder: string;
}

const tutorials: Tutorial[] = [
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
    id: 'drip-campaigns',
    title: 'Set Up Drip Campaigns',
    description: 'Automate your outreach with staggered email delivery',
    duration: '3 min',
    icon: <Target className="h-5 w-5" />,
    category: 'advanced',
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
  }
];

export function VideoTutorialSection() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
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

  const TutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
    const isCompleted = completedTutorials.includes(tutorial.id);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Card 
            className={`cursor-pointer hover:border-primary/50 transition-all hover:shadow-md ${
              isCompleted ? 'border-green-500/30 bg-green-500/5' : ''
            }`}
            onClick={() => setSelectedTutorial(tutorial)}
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
        <DialogContent className="max-w-2xl">
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
            Learn how to set up SMTP and send your first campaign in minutes
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
        <CardContent className="grid gap-3">
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
            Send Your First Campaign
          </CardTitle>
          <CardDescription>Learn the complete outreach workflow</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
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
        <CardContent className="grid gap-3">
          {advancedTutorials.map(tutorial => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <p>
          💡 <strong>Pro Tip:</strong> Complete the "Essential Setup" tutorials first, 
          then you'll be ready to send your first campaign!
        </p>
      </div>
    </div>
  );
}
