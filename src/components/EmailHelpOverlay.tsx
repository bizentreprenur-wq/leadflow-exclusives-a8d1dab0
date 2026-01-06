import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  HelpCircle, 
  Play, 
  Mail, 
  Settings, 
  FileText, 
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Server,
  Shield,
  Zap
} from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  category: 'setup' | 'templates' | 'sending' | 'advanced';
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'smtp-setup',
    title: 'How to Set Up Your SMTP Server',
    description: 'Learn how to configure your email sending server for reliable delivery. Covers Gmail, Outlook, and custom SMTP.',
    duration: '5:30',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=225&fit=crop',
    category: 'setup'
  },
  {
    id: 'gmail-smtp',
    title: 'Gmail SMTP Configuration (App Passwords)',
    description: 'Step-by-step guide to setting up Gmail with app passwords for secure email sending.',
    duration: '4:15',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=400&h=225&fit=crop',
    category: 'setup'
  },
  {
    id: 'sendgrid-setup',
    title: 'SendGrid Integration Tutorial',
    description: 'How to connect SendGrid for high-volume email sending with better deliverability.',
    duration: '6:00',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
    category: 'setup'
  },
  {
    id: 'choosing-templates',
    title: 'Choosing the Right Email Template',
    description: 'Learn which template types work best for different industries and outreach goals.',
    duration: '7:45',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=225&fit=crop',
    category: 'templates'
  },
  {
    id: 'customize-templates',
    title: 'Customizing Email Templates',
    description: 'How to edit templates, add your branding, and personalize content for higher conversions.',
    duration: '8:20',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    category: 'templates'
  },
  {
    id: 'personalization',
    title: 'Using Personalization Tags',
    description: 'Master {{first_name}}, {{business_name}} and other merge tags for personal outreach.',
    duration: '3:45',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=225&fit=crop',
    category: 'templates'
  },
  {
    id: 'sending-basics',
    title: 'Sending Your First Campaign',
    description: 'Complete walkthrough of sending emails to verified leads, from selection to delivery.',
    duration: '10:00',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=225&fit=crop',
    category: 'sending'
  },
  {
    id: 'drip-campaigns',
    title: 'Setting Up Drip Campaigns',
    description: 'How to schedule emails over time for gradual, non-spammy outreach that gets responses.',
    duration: '6:30',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
    category: 'sending'
  },
  {
    id: 'tracking-results',
    title: 'Tracking Opens, Clicks & Replies',
    description: 'Understanding your campaign analytics and optimizing for better results.',
    duration: '5:15',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    category: 'sending'
  },
  {
    id: 'avoid-spam',
    title: 'Avoiding the Spam Folder',
    description: 'Best practices for email deliverability: warm-up, authentication, and content tips.',
    duration: '9:00',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=225&fit=crop',
    category: 'advanced'
  },
  {
    id: 'ab-testing',
    title: 'A/B Testing Your Emails',
    description: 'How to test subject lines, content, and CTAs to find what works best.',
    duration: '7:00',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    category: 'advanced'
  },
  {
    id: 'follow-up-sequences',
    title: 'Creating Follow-Up Sequences',
    description: 'Build automated follow-up chains that nurture leads without being annoying.',
    duration: '8:45',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop',
    category: 'advanced'
  },
];

const QUICK_TIPS = [
  { icon: Shield, title: 'Warm up new email accounts', description: 'Send 10-20 emails daily for 2 weeks before high-volume campaigns' },
  { icon: Zap, title: 'Keep subject lines under 50 chars', description: 'Short subjects have 12% higher open rates' },
  { icon: Clock, title: 'Best sending times', description: 'Tuesday-Thursday, 9-11am local time works best for B2B' },
  { icon: Sparkles, title: 'Personalize the first line', description: 'Mentioning their business name increases replies by 30%' },
];

interface EmailHelpOverlayProps {
  variant?: 'floating' | 'inline';
}

export default function EmailHelpOverlay({ variant = 'floating' }: EmailHelpOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup': return <Server className="w-4 h-4" />;
      case 'templates': return <FileText className="w-4 h-4" />;
      case 'sending': return <Mail className="w-4 h-4" />;
      case 'advanced': return <Settings className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const filteredTutorials = TUTORIALS.filter(t => t.category === activeTab);

  return (
    <>
      {/* Floating Help Button */}
      {variant === 'floating' && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 rounded-full w-14 h-14 shadow-lg bg-amber-500 hover:bg-amber-600 text-white"
          size="icon"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Inline Help Button */}
      {variant === 'inline' && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Help & Tutorials
        </Button>
      )}

      {/* Help Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-500" />
              Email Help Center
            </DialogTitle>
            <DialogDescription>
              Video tutorials and guides to help you send effective email campaigns
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6 pt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="setup" className="gap-2">
                  <Server className="w-4 h-4" />
                  SMTP Setup
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="sending" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Sending
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[55vh] px-6 py-4">
              {/* Quick Tips Section (only on setup tab) */}
              {activeTab === 'setup' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    QUICK TIPS
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {QUICK_TIPS.map((tip, i) => (
                      <Card key={i} className="bg-muted/30">
                        <CardContent className="p-4 flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <tip.icon className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tip.title}</p>
                            <p className="text-xs text-muted-foreground">{tip.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Tutorials Grid */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  VIDEO TUTORIALS
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {filteredTutorials.map((tutorial) => (
                    <Card 
                      key={tutorial.id} 
                      className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                      onClick={() => window.open(tutorial.videoUrl, '_blank')}
                    >
                      <div className="relative">
                        <img 
                          src={tutorial.thumbnail} 
                          alt={tutorial.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary-foreground fill-current" />
                          </div>
                        </div>
                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {tutorial.duration}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm line-clamp-1">{tutorial.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {tutorial.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* SMTP Configuration Reference */}
              {activeTab === 'setup' && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    COMMON SMTP SETTINGS
                  </h3>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-primary mb-2">Gmail</p>
                          <p className="text-muted-foreground">Server: smtp.gmail.com</p>
                          <p className="text-muted-foreground">Port: 587 (TLS) or 465 (SSL)</p>
                          <p className="text-muted-foreground">Auth: App Password</p>
                        </div>
                        <div>
                          <p className="font-semibold text-primary mb-2">Outlook/365</p>
                          <p className="text-muted-foreground">Server: smtp.office365.com</p>
                          <p className="text-muted-foreground">Port: 587</p>
                          <p className="text-muted-foreground">Auth: Email + Password</p>
                        </div>
                        <div>
                          <p className="font-semibold text-primary mb-2">SendGrid</p>
                          <p className="text-muted-foreground">Server: smtp.sendgrid.net</p>
                          <p className="text-muted-foreground">Port: 587</p>
                          <p className="text-muted-foreground">Auth: API Key</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="border-t p-4 flex items-center justify-between bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Need more help? Contact support@bamlead.com
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://docs.bamlead.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Documentation
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
