import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  Monitor, Smartphone, Moon, Sun, Mail, Star, Archive, 
  Trash2, Reply, Forward, MoreHorizontal, Paperclip,
  ChevronDown, Clock, CheckCircle2, Pencil, X, Save, BookmarkPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { saveCustomTemplate } from '@/lib/customTemplates';
import { getUserLogoFromStorage } from '@/hooks/useUserBranding';

interface EmailClientPreviewPanelProps {
  subject: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  templateName?: string;
  editable?: boolean;
  onSaveEdit?: (subject: string, body: string) => void;
}

type EmailClient = 'gmail' | 'outlook' | 'apple';
type DeviceType = 'desktop' | 'mobile';

export default function EmailClientPreviewPanel({
  subject,
  body,
  senderName = 'Your Business',
  senderEmail = 'you@company.com',
  templateName = 'Selected Template',
  editable = false,
  onSaveEdit,
}: EmailClientPreviewPanelProps) {
  const [client, setClient] = useState<EmailClient>('gmail');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isDark, setIsDark] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState(subject);
  const [editBody, setEditBody] = useState(body.replace(/<[^>]*>/g, ''));
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

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
          {personalizeContent(displaySubject) || 'No Subject'}
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
          {/* User Logo */}
          {(() => {
            const logoUrl = getUserLogoFromStorage();
            return logoUrl ? (
              <div className="flex justify-center mb-4">
                <img src={logoUrl} alt="Company Logo" className="max-h-12 max-w-[180px] object-contain" />
              </div>
            ) : null;
          })()}
          <iframe
            srcDoc={personalizeContent(displayBody)}
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
          {personalizeContent(displaySubject) || 'No Subject'}
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
          {/* User Logo */}
          {(() => {
            const logoUrl = getUserLogoFromStorage();
            return logoUrl ? (
              <div className="flex justify-center mb-4">
                <img src={logoUrl} alt="Company Logo" className="max-h-12 max-w-[180px] object-contain" />
              </div>
            ) : null;
          })()}
          <iframe
            srcDoc={personalizeContent(displayBody)}
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
            {personalizeContent(displaySubject) || 'No Subject'}
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
              {personalizeContent(displaySubject) || 'No Subject'}
            </h3>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1">
        <div className={cn('p-4', colors.text)}>
          {/* User Logo */}
          {(() => {
            const logoUrl = getUserLogoFromStorage();
            return logoUrl ? (
              <div className="flex justify-center mb-4">
                <img src={logoUrl} alt="Company Logo" className="max-h-12 max-w-[180px] object-contain" />
              </div>
            ) : null;
          })()}
          <iframe
            srcDoc={personalizeContent(displayBody)}
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

  // Get the content to display (edited or original)
  const displaySubject = isEditing ? editSubject : subject;
  const displayBody = isEditing ? editBody : body;

  const handleSave = () => {
    if (onSaveEdit) {
      onSaveEdit(editSubject, editBody);
      toast.success('Template changes saved!');
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditSubject(subject);
    setEditBody(body.replace(/<[^>]*>/g, ''));
    setIsEditing(false);
  };

  const handleSaveToLibrary = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    saveCustomTemplate({
      id: '',
      name: newTemplateName.trim(),
      category: 'general',
      industry: 'Custom',
      subject: editSubject,
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${editBody.split('\n').map(p => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${p}</p>`).join('')}
      </div>`,
      description: `Custom template: ${newTemplateName}`,
      previewImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=300&fit=crop',
      conversionTip: 'Personalized template for your specific needs',
    });
    
    // Also save current edits
    if (onSaveEdit) {
      onSaveEdit(editSubject, editBody);
    }
    
    setShowSaveDialog(false);
    setNewTemplateName('');
    toast.success('🎉 Template saved to your library!');
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
          <div className="flex items-center gap-2">
            {editable && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Pencil className="w-4 h-4" />
                Edit Template
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="gap-1 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Save to Library
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" />
              Personalized
            </Badge>
          </div>
        </div>

        {/* Inline Editor - Shown when editing */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preview-edit-subject" className="text-sm font-medium">Subject Line</Label>
              <Input
                id="preview-edit-subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Enter subject line..."
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-edit-body" className="text-sm font-medium">Email Body</Label>
              <textarea
                id="preview-edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Enter email content..."
                className="w-full h-40 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Add tokens:</span>
              {['{{business_name}}', '{{first_name}}', '{{website}}', '{{phone}}'].map(token => (
                <button
                  key={token}
                  onClick={() => setEditBody(editBody + ' ' + token)}
                  className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        )}

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

      {/* Save to Library Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Save Template to Library
            </DialogTitle>
            <DialogDescription>
              Save this customized template so you can reuse it in future campaigns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="My Custom Outreach Template..."
                autoFocus
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Subject Preview:</p>
              <p className="text-sm font-medium truncate">{editSubject}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveToLibrary}
              disabled={!newTemplateName.trim()}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Star className="w-4 h-4" />
              Save to Library
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
