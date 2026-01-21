import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Webhook, CheckCircle2, ExternalLink, Mail, Info } from 'lucide-react';

interface ProviderConfig {
  id: string;
  name: string;
  logo: string;
  webhookDocsUrl: string;
  instructions: string[];
  supportedEvents: string[];
}

const emailProviders: ProviderConfig[] = [
  {
    id: 'sendgrid',
    name: 'SendGrid',
    logo: '📧',
    webhookDocsUrl: 'https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook',
    instructions: [
      'Go to SendGrid Dashboard → Settings → Mail Settings',
      'Click on "Event Webhook"',
      'Paste the webhook URL below into the "HTTP POST URL" field',
      'Select events: Delivered, Opened, Clicked, Bounced, Dropped',
      'Enable the webhook and save',
    ],
    supportedEvents: ['delivered', 'opened', 'clicked', 'bounced', 'dropped', 'deferred'],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    logo: '📬',
    webhookDocsUrl: 'https://documentation.mailgun.com/en/latest/api-webhooks.html',
    instructions: [
      'Go to Mailgun Dashboard → Sending → Webhooks',
      'Click "Add webhook" for each event type',
      'Paste the webhook URL and select the event type',
      'Repeat for: Delivered, Opened, Clicked, Permanent Fail, Temporary Fail',
      'Save each webhook configuration',
    ],
    supportedEvents: ['delivered', 'opened', 'clicked', 'permanent_fail', 'temporary_fail', 'complained'],
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    logo: '☁️',
    webhookDocsUrl: 'https://docs.aws.amazon.com/ses/latest/dg/configure-sns-notifications.html',
    instructions: [
      'Go to AWS SNS Console → Create Topic',
      'Create an HTTPS subscription with the webhook URL',
      'Go to SES Console → Configuration Sets',
      'Add event destinations pointing to your SNS topic',
      'Select events: Delivery, Open, Click, Bounce, Complaint',
    ],
    supportedEvents: ['Delivery', 'Open', 'Click', 'Bounce', 'Complaint', 'Reject'],
  },
  {
    id: 'postmark',
    name: 'Postmark',
    logo: '📮',
    webhookDocsUrl: 'https://postmarkapp.com/developer/webhooks/webhooks-overview',
    instructions: [
      'Go to Postmark → Servers → Your Server → Webhooks',
      'Click "Add webhook"',
      'Paste the webhook URL',
      'Select events: Delivery, Open, Link Click, Bounce',
      'Save the webhook',
    ],
    supportedEvents: ['Delivery', 'Open', 'Click', 'Bounce', 'SpamComplaint'],
  },
];

export default function WebhookURLConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState('sendgrid');
  const [copied, setCopied] = useState(false);
  
  // Generate the webhook URL based on current environment
  const API_BASE = import.meta.env.VITE_API_URL || window.location.origin + '/api';
  const webhookUrl = `${API_BASE}/email-webhook.php?provider=${selectedProvider}`;
  
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success('Webhook URL copied!', {
        description: 'Paste this URL in your email provider settings',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };
  
  const currentProvider = emailProviders.find(p => p.id === selectedProvider)!;

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Email Tracking Webhooks</CardTitle>
            <CardDescription>
              Track email opens, clicks, and bounces in real-time
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selector */}
        <div className="space-y-2">
          <Label>Select Your Email Provider</Label>
          <Tabs value={selectedProvider} onValueChange={setSelectedProvider}>
            <TabsList className="grid grid-cols-4 w-full">
              {emailProviders.map(provider => (
                <TabsTrigger 
                  key={provider.id} 
                  value={provider.id}
                  className="gap-1.5 text-xs"
                >
                  <span>{provider.logo}</span>
                  <span className="hidden sm:inline">{provider.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Webhook URL Display */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Webhook URL for {currentProvider.name}
            <Badge variant="outline" className="text-xs font-normal">
              Copy & Paste
            </Badge>
          </Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={webhookUrl}
              className="font-mono text-xs bg-muted"
            />
            <Button
              variant={copied ? "default" : "outline"}
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Setup Instructions for {currentProvider.name}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => window.open(currentProvider.webhookDocsUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
              View Docs
            </Button>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {currentProvider.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Supported Events */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Supported Events</Label>
          <div className="flex flex-wrap gap-2">
            {currentProvider.supportedEvents.map(event => (
              <Badge 
                key={event} 
                variant="secondary" 
                className="text-xs capitalize"
              >
                <Mail className="w-3 h-3 mr-1" />
                {event.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Webhook endpoint is ready to receive events. Configure your provider to start tracking.</span>
        </div>
      </CardContent>
    </Card>
  );
}
