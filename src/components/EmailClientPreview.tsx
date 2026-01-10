import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Mail, Star, Archive, Trash2, MoreHorizontal, 
  ChevronLeft, ChevronRight, Printer, ExternalLink,
  Reply, Forward, Search, Settings, Menu
} from 'lucide-react';

interface EmailClientPreviewProps {
  subject: string;
  htmlContent: string;
  senderName?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
}

type EmailClient = 'gmail' | 'outlook' | 'apple';

export function EmailClientPreview({
  subject,
  htmlContent,
  senderName = 'Your Name',
  senderEmail = 'noreply@bamlead.com',
  recipientName = 'John Smith',
  recipientEmail = 'john@example.com',
}: EmailClientPreviewProps) {
  const [activeClient, setActiveClient] = useState<EmailClient>('gmail');
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Process HTML content with placeholder replacements
  const processedContent = htmlContent
    .replace(/\{\{first_name\}\}/g, recipientName.split(' ')[0] || 'John')
    .replace(/\{\{business_name\}\}/g, 'Acme Corp')
    .replace(/\{\{sender_name\}\}/g, senderName)
    .replace(/\{\{company_name\}\}/g, 'BamLead')
    .replace(/\{\{website\}\}/g, 'www.example.com')
    .replace(/\{\{phone\}\}/g, '(555) 123-4567');

  return (
    <div className="h-full flex flex-col">
      {/* Client Selector Tabs */}
      <div className="shrink-0 px-4 py-3 border-b bg-muted/30">
        <Tabs value={activeClient} onValueChange={(v) => setActiveClient(v as EmailClient)}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="gmail" className="gap-2">
              <GmailIcon className="w-4 h-4" />
              Gmail
            </TabsTrigger>
            <TabsTrigger value="outlook" className="gap-2">
              <OutlookIcon className="w-4 h-4" />
              Outlook
            </TabsTrigger>
            <TabsTrigger value="apple" className="gap-2">
              <AppleMailIcon className="w-4 h-4" />
              Apple Mail
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Email Client Simulation */}
      <div className="flex-1 overflow-hidden">
        {activeClient === 'gmail' && (
          <GmailPreview
            subject={subject}
            content={processedContent}
            senderName={senderName}
            senderEmail={senderEmail}
            currentTime={currentTime}
          />
        )}
        {activeClient === 'outlook' && (
          <OutlookPreview
            subject={subject}
            content={processedContent}
            senderName={senderName}
            senderEmail={senderEmail}
            currentDate={currentDate}
            currentTime={currentTime}
          />
        )}
        {activeClient === 'apple' && (
          <AppleMailPreview
            subject={subject}
            content={processedContent}
            senderName={senderName}
            senderEmail={senderEmail}
            currentDate={currentDate}
            currentTime={currentTime}
            recipientEmail={recipientEmail}
          />
        )}
      </div>
    </div>
  );
}

// Gmail Icon
function GmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22 6L12 13L2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="#EA4335"/>
      <path d="M22 6L12 13L2 6" stroke="#C5221F" strokeWidth="0.5"/>
      <path d="M4 6L12 13L20 6H4Z" fill="#FBBC04"/>
      <path d="M2 6L12 13V20H4C2.9 20 2 19.1 2 18V6Z" fill="#34A853"/>
      <path d="M22 6L12 13V20H20C21.1 20 22 19.1 22 18V6Z" fill="#4285F4"/>
    </svg>
  );
}

// Outlook Icon
function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
      <path d="M2 8L12 14L22 8" stroke="white" strokeWidth="1.5"/>
      <ellipse cx="9" cy="12" rx="4" ry="3" fill="white"/>
    </svg>
  );
}

// Apple Mail Icon  
function AppleMailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="url(#appleGradient)"/>
      <path d="M2 7L12 14L22 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="appleGradient" x1="2" y1="4" x2="22" y2="20">
          <stop stopColor="#5AC8FA"/>
          <stop offset="1" stopColor="#007AFF"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Gmail Preview Component
function GmailPreview({
  subject,
  content,
  senderName,
  senderEmail,
  currentTime,
}: {
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  currentTime: string;
}) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950">
      {/* Gmail Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <Printer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Email Header */}
      <div className="shrink-0 px-6 py-4 border-b bg-white dark:bg-zinc-950">
        <h2 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-4">{subject}</h2>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{senderName}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <span>to me</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{currentTime}</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
              <Star className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
              <Reply className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        <iframe
          srcDoc={content}
          className="w-full h-full border-0"
          title="Gmail Email Preview"
          sandbox="allow-same-origin"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Gmail Reply Box */}
      <div className="shrink-0 px-6 py-4 border-t bg-gray-50 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
            <Reply className="w-4 h-4" />
            Reply
          </button>
          <button className="px-4 py-2 border rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
            <Forward className="w-4 h-4" />
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}

// Outlook Preview Component
function OutlookPreview({
  subject,
  content,
  senderName,
  senderEmail,
  currentDate,
  currentTime,
}: {
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  currentDate: string;
  currentTime: string;
}) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950">
      {/* Outlook Ribbon */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b bg-[#f3f2f1] dark:bg-zinc-900">
        <button className="px-3 py-1.5 text-sm font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-800 rounded flex items-center gap-2">
          <Reply className="w-4 h-4" />
          Reply
        </button>
        <button className="px-3 py-1.5 text-sm font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-800 rounded flex items-center gap-2">
          <Forward className="w-4 h-4" />
          Forward
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700 mx-2" />
        <button className="px-3 py-1.5 text-sm font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-800 rounded">
          Delete
        </button>
        <button className="px-3 py-1.5 text-sm font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-800 rounded">
          Archive
        </button>
        <button className="px-3 py-1.5 text-sm font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-800 rounded">
          Junk
        </button>
        <div className="flex-1" />
        <button className="p-1.5 hover:bg-[#e1dfdd] dark:hover:bg-zinc-800 rounded">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Email Header */}
      <div className="shrink-0 px-6 py-5 border-b bg-white dark:bg-zinc-950">
        <h2 className="text-xl font-semibold text-[#323130] dark:text-gray-100 mb-4">{subject}</h2>
        <div className="flex items-start gap-3">
          {/* Outlook-style Avatar */}
          <div className="w-12 h-12 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-semibold text-lg shrink-0">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-[#323130] dark:text-gray-100 text-base">{senderName}</span>
              <span className="text-[#605e5c] dark:text-gray-400 text-sm">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="text-sm text-[#605e5c] dark:text-gray-400 mt-1">
              To: You
            </div>
          </div>
          <div className="shrink-0 text-sm text-[#605e5c] dark:text-gray-400">
            {currentDate}, {currentTime}
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        <iframe
          srcDoc={content}
          className="w-full h-full border-0"
          title="Outlook Email Preview"
          sandbox="allow-same-origin"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}

// Apple Mail Preview Component
function AppleMailPreview({
  subject,
  content,
  senderName,
  senderEmail,
  currentDate,
  currentTime,
  recipientEmail,
}: {
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  currentDate: string;
  currentTime: string;
  recipientEmail: string;
}) {
  return (
    <div className="h-full flex flex-col bg-[#f5f5f7] dark:bg-zinc-950">
      {/* Apple Mail Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-[#e8e8ed] dark:bg-zinc-900">
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-[#d1d1d6] dark:hover:bg-zinc-800 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-[#007aff]" />
          </button>
          <button className="p-2 hover:bg-[#d1d1d6] dark:hover:bg-zinc-800 rounded-lg">
            <ChevronRight className="w-5 h-5 text-[#007aff]" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-[#d1d1d6] dark:hover:bg-zinc-800 rounded-lg">
            <Archive className="w-5 h-5 text-[#007aff]" />
          </button>
          <button className="p-2 hover:bg-[#d1d1d6] dark:hover:bg-zinc-800 rounded-lg">
            <Trash2 className="w-5 h-5 text-[#007aff]" />
          </button>
          <button className="p-2 hover:bg-[#d1d1d6] dark:hover:bg-zinc-800 rounded-lg">
            <Reply className="w-5 h-5 text-[#007aff]" />
          </button>
          <button className="p-2 hover:bg-[#d1d1d6] dark:hover:bg-zinc-800 rounded-lg">
            <Forward className="w-5 h-5 text-[#007aff]" />
          </button>
        </div>
      </div>

      {/* Email Header - Apple Style */}
      <div className="shrink-0 px-6 py-4 bg-white dark:bg-zinc-950 border-b">
        <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-gray-100 mb-3">{subject}</h2>
        
        {/* From/To Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            {/* Apple-style gradient avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5ac8fa] to-[#007aff] flex items-center justify-center text-white font-medium text-sm shrink-0">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-[#1d1d1f] dark:text-gray-100">{senderName}</span>
                <span className="text-[#86868b] dark:text-gray-400">&lt;{senderEmail}&gt;</span>
              </div>
            </div>
            <span className="text-[#86868b] dark:text-gray-400 text-xs">
              {currentDate} at {currentTime}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#86868b] dark:text-gray-400 pl-11">
            <span className="text-xs font-medium">To:</span>
            <span className="text-xs">{recipientEmail}</span>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        <iframe
          srcDoc={content}
          className="w-full h-full border-0"
          title="Apple Mail Email Preview"
          sandbox="allow-same-origin"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Apple Mail Quick Reply */}
      <div className="shrink-0 px-6 py-3 border-t bg-[#f5f5f7] dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full border border-[#d1d1d6] dark:border-zinc-700">
          <input
            type="text"
            placeholder="Reply..."
            className="flex-1 bg-transparent text-sm outline-none text-[#1d1d1f] dark:text-gray-100 placeholder-[#86868b]"
            readOnly
          />
          <button className="text-[#007aff] font-medium text-sm">Send</button>
        </div>
      </div>
    </div>
  );
}

export default EmailClientPreview;
