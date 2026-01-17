import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Monitor, Smartphone, Moon, Sun, Mail, Star, Archive, 
  Trash2, Reply, Forward, MoreHorizontal, Paperclip,
  ChevronDown, Clock, CheckCircle2
} from 'lucide-react';

interface EmailClientPreviewPanelProps {
  subject: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  templateName?: string;
}

type EmailClient = 'gmail' | 'outlook' | 'apple';
type DeviceType = 'desktop' | 'mobile';

export default function EmailClientPreviewPanel({
  subject,
  body,
  senderName = 'Your Business',
  senderEmail = 'you@company.com',
  templateName = 'Selected Template',
}: EmailClientPreviewPanelProps) {
  const [client, setClient] = useState<EmailClient>('gmail');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isDark, setIsDark] = useState(false);

  // Personalize placeholders
  const personalizeContent = (html: string) => {
    return html
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{business_name\}\}/g, 'Acme Corp')
      .replace(/\{\{sender_name\}\}/g, senderName)
      .replace(/\{\{company_name\}\}/g, 'BamLead')
      .replace(/\{\{website\}\}/g, 'www.example.com')
      .replace(/\{\{phone\}\}/g, '(555) 123-4567');
  };

  const clientConfigs = {
    gmail: {
      name: 'Gmail',
      icon: '📧',
      colors: {
        light: { bg: 'bg-white', header: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
        dark: { bg: 'bg-zinc-900', header: 'bg-zinc-800', text: 'text-zinc-100', border: 'border-zinc-700' },
      },
    },
    outlook: {
      name: 'Outlook',
      icon: '📬',
      colors: {
        light: { bg: 'bg-white', header: 'bg-blue-50', text: 'text-gray-900', border: 'border-blue-100' },
        dark: { bg: 'bg-slate-900', header: 'bg-slate-800', text: 'text-slate-100', border: 'border-slate-700' },
      },
    },
    apple: {
      name: 'Apple Mail',
      icon: '🍎',
      colors: {
        light: { bg: 'bg-gray-50', header: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-200' },
        dark: { bg: 'bg-neutral-900', header: 'bg-neutral-800', text: 'text-neutral-100', border: 'border-neutral-700' },
      },
    },
  };

  const currentConfig = clientConfigs[client];
  const theme = isDark ? 'dark' : 'light';
  const colors = currentConfig.colors[theme];

  const renderGmailUI = () => (
    <div className={cn('flex flex-col h-full', colors.bg)}>
      {/* Gmail Toolbar */}
      <div className={cn('flex items-center gap-2 px-4 py-2 border-b', colors.border, colors.header)}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Archive className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Mail className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Email Header */}
      <div className={cn('p-4 border-b', colors.border)}>
        <h2 className={cn('text-xl font-normal mb-3', colors.text)}>
          {personalizeContent(subject) || 'No Subject'}
        </h2>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-medium">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', colors.text)}>{senderName}</span>
              <span className="text-muted-foreground text-sm">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>to me</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Just now</span>
            <Star className="w-4 h-4" />
            <Reply className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1">
        <div className={cn('p-4', colors.text)}>
          <iframe
            srcDoc={personalizeContent(body)}
            className="w-full border-0"
            style={{ height: '400px', minHeight: '300px' }}
            title="Gmail Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </ScrollArea>
    </div>
  );

  const renderOutlookUI = () => (
    <div className={cn('flex flex-col h-full', colors.bg)}>
      {/* Outlook Ribbon */}
      <div className={cn('flex items-center gap-3 px-4 py-3 border-b', colors.border, colors.header)}>
        <Button size="sm" variant="outline" className="gap-2 text-blue-600 border-blue-200 bg-blue-50">
          <Reply className="w-4 h-4" />
          Reply
        </Button>
        <Button size="sm" variant="outline" className="gap-2">
          <Forward className="w-4 h-4" />
          Forward
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Archive className="w-4 h-4" />
        </Button>
      </div>

      {/* Email Header */}
      <div className={cn('p-4 border-b', colors.border)}>
        <h2 className={cn('text-lg font-semibold mb-2', colors.text)}>
          {personalizeContent(subject) || 'No Subject'}
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className={cn('font-semibold', colors.text)}>{senderName}</div>
            <div className="text-sm text-muted-foreground">
              {senderEmail}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              To: recipient@example.com
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Today, 10:30 AM</div>
            <div className="flex items-center gap-1 mt-1">
              <Paperclip className="w-3 h-3" />
              <span>No attachments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1">
        <div className={cn('p-4', colors.text)}>
          <iframe
            srcDoc={personalizeContent(body)}
            className="w-full border-0"
            style={{ height: '400px', minHeight: '300px' }}
            title="Outlook Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </ScrollArea>
    </div>
  );

  const renderAppleMailUI = () => (
    <div className={cn('flex flex-col h-full', colors.bg)}>
      {/* Apple Mail Header Bar */}
      <div className={cn('flex items-center gap-2 px-4 py-2 border-b', colors.border, colors.header)}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 text-center">
          <span className={cn('text-sm font-medium', colors.text)}>
            {personalizeContent(subject) || 'No Subject'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Reply className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Email Header */}
      <div className={cn('p-4 border-b', colors.border)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-medium">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={cn('font-semibold', colors.text)}>{senderName}</span>
              <span className="text-xs text-muted-foreground">10:30 AM</span>
            </div>
            <div className="text-sm text-blue-500">To: me</div>
            <h3 className={cn('font-medium mt-2', colors.text)}>
              {personalizeContent(subject) || 'No Subject'}
            </h3>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1">
        <div className={cn('p-4', colors.text)}>
          <iframe
            srcDoc={personalizeContent(body)}
            className="w-full border-0"
            style={{ height: '400px', minHeight: '300px' }}
            title="Apple Mail Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </ScrollArea>
    </div>
  );

  const renderClientUI = () => {
    switch (client) {
      case 'gmail':
        return renderGmailUI();
      case 'outlook':
        return renderOutlookUI();
      case 'apple':
        return renderAppleMailUI();
    }
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Template Preview</CardTitle>
              <p className="text-sm text-muted-foreground">{templateName}</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            Personalized
          </Badge>
        </div>

        {/* Client & Device Toggles */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Client:</span>
            <Tabs value={client} onValueChange={(v) => setClient(v as EmailClient)}>
              <TabsList className="h-8 bg-muted/50">
                <TabsTrigger value="gmail" className="h-7 px-3 gap-1.5 text-xs">
                  📧 Gmail
                </TabsTrigger>
                <TabsTrigger value="outlook" className="h-7 px-3 gap-1.5 text-xs">
                  📬 Outlook
                </TabsTrigger>
                <TabsTrigger value="apple" className="h-7 px-3 gap-1.5 text-xs">
                  🍎 Apple Mail
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={device} onValueChange={(v) => setDevice(v as DeviceType)}>
              <TabsList className="h-8 bg-muted/50">
                <TabsTrigger value="desktop" className="h-7 px-2.5 gap-1 text-xs">
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile" className="h-7 px-2.5 gap-1 text-xs">
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDark(!isDark)}
              className="h-8 w-8 p-0"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className={cn(
            'transition-all duration-300 mx-auto overflow-hidden',
            device === 'mobile' ? 'max-w-[375px] border-x border-border' : 'w-full'
          )}
          style={{ height: device === 'mobile' ? '600px' : '550px' }}
        >
          {renderClientUI()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 text-xs border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {currentConfig.icon} {currentConfig.name}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted">
              {device === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted">
              {isDark ? '🌙 Dark' : '☀️ Light'}
            </span>
          </div>
          <div className="text-muted-foreground">
            Exactly how recipients will see your email
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
