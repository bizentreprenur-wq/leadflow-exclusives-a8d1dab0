import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, Archive, Trash2, MoreHorizontal, 
  ChevronLeft, ChevronRight, Printer, ExternalLink,
  Reply, Forward
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

// Wrapper function to make email HTML responsive inside iframe
function wrapEmailContent(html: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        html, body { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          height: 100%;
          overflow-x: hidden;
        }
        body > table, body > div { 
          max-width: 100% !important; 
          width: 100% !important;
        }
        img { 
          max-width: 250px !important; 
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
          border-radius: 6px !important;
        }
        td[width="35%"] img {
          width: 100% !important;
          max-width: 200px !important;
          height: 150px !important;
          object-fit: cover !important;
          min-height: unset !important;
        }
        @media (max-width: 600px) {
          td[width="35%"], td[width="65%"] {
            display: block !important;
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}

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
  const processedContent = wrapEmailContent(
    htmlContent
      .replace(/\{\{first_name\}\}/g, recipientName.split(' ')[0] || 'John')
      .replace(/\{\{business_name\}\}/g, 'Acme Corp')
      .replace(/\{\{sender_name\}\}/g, senderName)
      .replace(/\{\{company_name\}\}/g, 'BamLead')
      .replace(/\{\{website\}\}/g, 'www.example.com')
      .replace(/\{\{phone\}\}/g, '(555) 123-4567')
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Client Selector Tabs */}
      <div className="shrink-0 px-4 py-3 border-b bg-muted/30">
        <Tabs value={activeClient} onValueChange={(v) => setActiveClient(v as EmailClient)}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="gmail" className="gap-2 text-xs sm:text-sm">
              <GmailIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Gmail</span>
            </TabsTrigger>
            <TabsTrigger value="outlook" className="gap-2 text-xs sm:text-sm">
              <OutlookIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Outlook</span>
            </TabsTrigger>
            <TabsTrigger value="apple" className="gap-2 text-xs sm:text-sm">
              <AppleMailIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Apple Mail</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Email Client Simulation */}
      <div className="flex-1 overflow-hidden min-h-0">
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
    <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f] overflow-hidden">
      {/* Gmail Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-[#f6f8fc] dark:bg-[#2d2d2d]">
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full">
            <ChevronLeft className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full hidden sm:block">
            <Archive className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full hidden sm:block">
            <Trash2 className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full hidden sm:block">
            <Printer className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full">
            <MoreHorizontal className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Email Header */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-b bg-white dark:bg-[#1f1f1f]">
        <h2 className="text-base sm:text-lg font-normal text-[#202124] dark:text-gray-100 mb-3 line-clamp-2">{subject}</h2>
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Gmail Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-medium text-sm shrink-0">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-[#202124] dark:text-gray-100">{senderName}</span>
              <span className="text-[#5f6368] dark:text-gray-400 text-xs truncate">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">
              <span>to me</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-[#5f6368] dark:text-gray-400 hidden sm:block">{currentTime}</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">
              <Star className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded hidden sm:block">
              <Reply className="w-4 h-4 text-[#5f6368] dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Body - Scrollable */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#1f1f1f] min-h-0">
        <div className="p-2 sm:p-4">
          <iframe
            srcDoc={content}
            className="w-full border-0 rounded-lg bg-white"
            style={{ height: '400px' }}
            title="Gmail Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Gmail Reply Box */}
      <div className="shrink-0 px-3 sm:px-6 py-3 border-t bg-[#f6f8fc] dark:bg-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-[#dadce0] dark:border-zinc-600 rounded-full text-xs font-medium text-[#3c4043] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-1.5">
            <Reply className="w-3.5 h-3.5" />
            Reply
          </button>
          <button className="px-3 py-1.5 border border-[#dadce0] dark:border-zinc-600 rounded-full text-xs font-medium text-[#3c4043] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 hidden sm:flex">
            <Forward className="w-3.5 h-3.5" />
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
    <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f] overflow-hidden">
      {/* Outlook Ribbon */}
      <div className="shrink-0 flex items-center gap-1 px-2 sm:px-4 py-2 border-b bg-[#f3f2f1] dark:bg-[#2d2d2d]">
        <button className="px-2 py-1 text-xs font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-700 rounded flex items-center gap-1">
          <Reply className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reply</span>
        </button>
        <button className="px-2 py-1 text-xs font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-700 rounded flex items-center gap-1">
          <Forward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Forward</span>
        </button>
        <div className="w-px h-5 bg-[#c8c6c4] dark:bg-zinc-600 mx-1" />
        <button className="px-2 py-1 text-xs font-medium hover:bg-[#e1dfdd] dark:hover:bg-zinc-700 rounded hidden sm:block">
          Delete
        </button>
        <div className="flex-1" />
        <button className="p-1 hover:bg-[#e1dfdd] dark:hover:bg-zinc-700 rounded">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Email Header */}
      <div className="shrink-0 px-3 sm:px-6 py-4 border-b bg-white dark:bg-[#1f1f1f]">
        <h2 className="text-base sm:text-lg font-semibold text-[#323130] dark:text-gray-100 mb-3 line-clamp-2">{subject}</h2>
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Outlook Avatar */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-semibold text-base shrink-0">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-[#323130] dark:text-gray-100 text-sm">{senderName}</span>
              <span className="text-[#605e5c] dark:text-gray-400 text-xs truncate">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="text-xs text-[#605e5c] dark:text-gray-400 mt-1">
              To: You
            </div>
          </div>
          <div className="shrink-0 text-xs text-[#605e5c] dark:text-gray-400 hidden sm:block">
            {currentDate}, {currentTime}
          </div>
        </div>
      </div>

      {/* Email Body - Scrollable */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#1f1f1f] min-h-0">
        <div className="p-2 sm:p-4">
          <iframe
            srcDoc={content}
            className="w-full border-0 rounded bg-white"
            style={{ height: '400px' }}
            title="Outlook Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
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
    <div className="h-full flex flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e] overflow-hidden">
      {/* Apple Mail Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-[#e8e8ed] dark:bg-[#2c2c2e]">
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 hover:bg-[#d1d1d6] dark:hover:bg-zinc-700 rounded-lg">
            <ChevronLeft className="w-4 h-4 text-[#007aff]" />
          </button>
          <button className="p-1.5 hover:bg-[#d1d1d6] dark:hover:bg-zinc-700 rounded-lg">
            <ChevronRight className="w-4 h-4 text-[#007aff]" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 hover:bg-[#d1d1d6] dark:hover:bg-zinc-700 rounded-lg hidden sm:block">
            <Archive className="w-4 h-4 text-[#007aff]" />
          </button>
          <button className="p-1.5 hover:bg-[#d1d1d6] dark:hover:bg-zinc-700 rounded-lg">
            <Trash2 className="w-4 h-4 text-[#007aff]" />
          </button>
          <button className="p-1.5 hover:bg-[#d1d1d6] dark:hover:bg-zinc-700 rounded-lg">
            <Reply className="w-4 h-4 text-[#007aff]" />
          </button>
        </div>
      </div>

      {/* Email Header - Apple Style */}
      <div className="shrink-0 px-3 sm:px-6 py-3 bg-white dark:bg-[#1c1c1e] border-b">
        <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-gray-100 mb-2 line-clamp-2">{subject}</h2>
        
        {/* From/To Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            {/* Apple Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5ac8fa] to-[#007aff] flex items-center justify-center text-white font-medium text-xs shrink-0">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium text-[#1d1d1f] dark:text-gray-100 text-sm">{senderName}</span>
                <span className="text-[#86868b] dark:text-gray-400 text-xs truncate">&lt;{senderEmail}&gt;</span>
              </div>
            </div>
            <span className="text-[#86868b] dark:text-gray-400 text-[10px] hidden sm:block">
              {currentDate}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#86868b] dark:text-gray-400 pl-9">
            <span className="text-[10px] font-medium">To:</span>
            <span className="text-[10px] truncate">{recipientEmail}</span>
          </div>
        </div>
      </div>

      {/* Email Body - Scrollable */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#1c1c1e] min-h-0">
        <div className="p-2 sm:p-4">
          <iframe
            srcDoc={content}
            className="w-full border-0 rounded-lg bg-white"
            style={{ height: '400px' }}
            title="Apple Mail Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Apple Mail Quick Reply */}
      <div className="shrink-0 px-3 sm:px-6 py-2 border-t bg-[#f5f5f7] dark:bg-[#2c2c2e]">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full border border-[#d1d1d6] dark:border-zinc-600">
          <input
            type="text"
            placeholder="Reply..."
            className="flex-1 bg-transparent text-xs outline-none text-[#1d1d1f] dark:text-gray-100 placeholder-[#86868b]"
            readOnly
          />
          <button className="text-[#007aff] font-medium text-xs">Send</button>
        </div>
      </div>
    </div>
  );
}

export default EmailClientPreview;
