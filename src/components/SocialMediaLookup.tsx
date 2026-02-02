import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Mail, Phone, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scrapeSocialContacts, SocialContactsResult } from '@/lib/api/socialContacts';
import { toast } from 'sonner';

interface SocialMediaLookupProps {
  businessName: string;
  location?: string;
  size?: 'sm' | 'md';
  onContactsFound?: (emails: string[], phones: string[]) => void;
}

const socialPlatforms = [
  {
    name: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20 hover:bg-blue-500/30',
    getSearchUrl: (name: string, location: string) => 
      `https://www.facebook.com/search/pages/?q=${encodeURIComponent(name + (location ? ' ' + location : ''))}`,
  },
  {
    name: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/20 hover:bg-blue-600/30',
    getSearchUrl: (name: string, location: string) => 
      `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name + (location ? ' ' + location : ''))}`,
  },
  {
    name: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20 hover:bg-pink-500/30',
    getSearchUrl: (name: string) => 
      `https://www.google.com/search?q=${encodeURIComponent(name + ' instagram')}`,
  },
  {
    name: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: 'text-red-500',
    bgColor: 'bg-red-500/20 hover:bg-red-500/30',
    getSearchUrl: (name: string) => 
      `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`,
  },
  {
    name: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    color: 'text-foreground',
    bgColor: 'bg-foreground/20 hover:bg-foreground/30',
    getSearchUrl: (name: string) => 
      `https://www.tiktok.com/search?q=${encodeURIComponent(name)}`,
  },
];

export default function SocialMediaLookup({
  businessName,
  location = '',
  size = 'sm',
  onContactsFound,
}: SocialMediaLookupProps) {
  const [openPlatform, setOpenPlatform] = useState<typeof socialPlatforms[0] | null>(null);
  const [searchUrl, setSearchUrl] = useState('');
  const [isScrapingContacts, setIsScrapingContacts] = useState(false);
  const [socialContacts, setSocialContacts] = useState<SocialContactsResult | null>(null);
  const [showContactsPanel, setShowContactsPanel] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  // Auto-scrape for contacts on mount if not already scraped
  useEffect(() => {
    const cacheKey = `social_contacts_${businessName}_${location}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSocialContacts(parsed);
        if (onContactsFound && (parsed.contacts?.emails?.length || parsed.contacts?.phones?.length)) {
          onContactsFound(parsed.contacts.emails || [], parsed.contacts.phones || []);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [businessName, location]);

  const handleScrapeContacts = async () => {
    if (isScrapingContacts) return;
    
    setIsScrapingContacts(true);
    try {
      const result = await scrapeSocialContacts(businessName, location);
      setSocialContacts(result);
      
      // Cache in session storage
      const cacheKey = `social_contacts_${businessName}_${location}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      
      if (result.success && (result.contacts.emails.length > 0 || result.contacts.phones.length > 0)) {
        toast.success(`Found ${result.contacts.emails.length} emails, ${result.contacts.phones.length} phones from social profiles`, {
          description: result.contacts.sources.join(', ')
        });
        if (onContactsFound) {
          onContactsFound(result.contacts.emails, result.contacts.phones);
        }
        setShowContactsPanel(true);
      } else {
        toast.info('No contact info found in public social profiles', {
          description: 'Try checking the website directly'
        });
      }
    } catch (error) {
      toast.error('Failed to scrape social contacts');
    } finally {
      setIsScrapingContacts(false);
    }
  };

  const handleClick = (platform: typeof socialPlatforms[0], e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = platform.getSearchUrl(businessName, location);
    setSearchUrl(url);
    setOpenPlatform(platform);
  };

  const hasContacts = socialContacts?.contacts && 
    (socialContacts.contacts.emails.length > 0 || socialContacts.contacts.phones.length > 0);

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5">
          {/* AI Scrape Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (hasContacts) {
                    setShowContactsPanel(true);
                  } else {
                    handleScrapeContacts();
                  }
                }}
                disabled={isScrapingContacts}
                className={cn(
                  'inline-flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 relative',
                  sizeClasses[size],
                  hasContacts 
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-500',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'
                )}
                aria-label="Find contacts from social profiles"
              >
                {isScrapingContacts ? (
                  <Loader2 className={cn(iconSize[size], 'animate-spin')} />
                ) : (
                  <Sparkles className={iconSize[size]} />
                )}
                {hasContacts && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover border-border">
              <p className="text-sm font-medium">
                {hasContacts 
                  ? `View ${socialContacts?.contacts.emails.length || 0} emails, ${socialContacts?.contacts.phones.length || 0} phones`
                  : 'AI Scrape Social Profiles for Contacts'
                }
              </p>
            </TooltipContent>
          </Tooltip>

          {socialPlatforms.map((platform) => (
            <Tooltip key={platform.name}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => handleClick(platform, e)}
                  className={cn(
                    'inline-flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110',
                    sizeClasses[size],
                    platform.bgColor,
                    platform.color,
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'
                  )}
                  aria-label={`Find ${businessName} on ${platform.name}`}
                >
                  <span className={iconSize[size]}>{platform.icon}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-popover border-border">
                <p className="text-sm font-medium">Find on {platform.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Contacts Found Panel */}
      <Dialog open={showContactsPanel} onOpenChange={setShowContactsPanel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Contacts Found for {businessName}
            </DialogTitle>
            <DialogDescription>
              Extracted from public social profiles
            </DialogDescription>
          </DialogHeader>

          {socialContacts?.contacts && (
            <div className="space-y-4 mt-4">
              {/* Emails */}
              {socialContacts.contacts.emails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Emails ({socialContacts.contacts.emails.length})
                  </div>
                  <div className="space-y-1">
                    {socialContacts.contacts.emails.map((email, i) => (
                      <a
                        key={i}
                        href={`mailto:${email}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-4 h-4 text-primary" />
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Phones */}
              {socialContacts.contacts.phones.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    Phones ({socialContacts.contacts.phones.length})
                  </div>
                  <div className="space-y-1">
                    {socialContacts.contacts.phones.map((phone, i) => (
                      <a
                        key={i}
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4 text-green-500" />
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {socialContacts.contacts.sources.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {socialContacts.contacts.sources.map((source, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Profiles Found */}
              {Object.keys(socialContacts.contacts.profiles).length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Profiles Found:</p>
                  <div className="space-y-1">
                    {Object.entries(socialContacts.contacts.profiles).map(([platform, profile]) => (
                      <a
                        key={platform}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium capitalize">{platform}</span>
                        {profile.username && <span className="text-muted-foreground">@{profile.username}</span>}
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowContactsPanel(false)}>
              Close
            </Button>
            <Button 
              size="sm" 
              onClick={handleScrapeContacts}
              disabled={isScrapingContacts}
              className="gap-2"
            >
              {isScrapingContacts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Refresh
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* In-app social search dialog */}
      <Dialog open={!!openPlatform} onOpenChange={(open) => !open && setOpenPlatform(null)}>
        <DialogContent className="w-[min(98vw,90rem)] h-[95vh] max-w-none p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              {openPlatform && (
                <span className={cn('w-5 h-5', openPlatform.color)}>
                  {openPlatform.icon}
                </span>
              )}
              {businessName} on {openPlatform?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between gap-3">
              <span className="truncate text-xs">{searchUrl}</span>
              <Button asChild size="sm" variant="outline" className="shrink-0 gap-2">
                <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
              </Button>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 w-full border-t border-border bg-muted/20 overflow-hidden">
            {/* Platforms that block iframes: Facebook, TikTok, LinkedIn */}
            {openPlatform && ['Facebook', 'TikTok', 'LinkedIn'].includes(openPlatform.name) ? (
              <div className="h-full w-full flex items-center justify-center p-8">
                <div className="max-w-md text-center space-y-6">
                  <div className={cn(
                    'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center',
                    openPlatform.bgColor
                  )}>
                    <span className={cn('w-10 h-10', openPlatform.color)}>
                      {openPlatform.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Open {openPlatform.name} to view profile
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {openPlatform.name} doesn't allow embedding for privacy reasons. 
                      Click the button below to search for <span className="font-medium text-foreground">{businessName}</span> directly on {openPlatform.name}.
                    </p>
                  </div>
                  <Button asChild size="lg" className={cn('gap-2 font-semibold', openPlatform.bgColor)}>
                    <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                      <span className={cn('w-5 h-5', openPlatform.color)}>
                        {openPlatform.icon}
                      </span>
                      Open {openPlatform.name}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    A new tab will open with your search results
                  </p>
                </div>
              </div>
            ) : (
              <iframe
                title={`${businessName} ${openPlatform?.name} search`}
                src={searchUrl}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className="p-3 border-t border-border text-xs text-muted-foreground">
            If the preview is blank, the site blocks in-app previews—use "Open in New Tab" to search.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
