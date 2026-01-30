import { useMemo, useState } from 'react';
import { ExternalLink, Globe, Maximize2, Minimize2, Facebook, Instagram, Youtube, Linkedin, AlertCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface WebsitePreviewIconProps {
  website: string | undefined | null;
  businessName?: string;
  size?: 'sm' | 'md' | 'lg';
  showInline?: boolean;
  /** Optional: override trigger button styling (useful to match existing table icon buttons) */
  triggerClassName?: string;
  /** Optional: override globe icon styling */
  iconClassName?: string;
  /** Optional: tooltip title */
  tooltipTitle?: string;
}

// Social media domains that block iframe embedding
const SOCIAL_MEDIA_DOMAINS = [
  'facebook.com', 'fb.com', 'fb.me',
  'instagram.com', 'instagr.am',
  'tiktok.com',
  'twitter.com', 'x.com',
  'linkedin.com',
  'youtube.com', 'youtu.be',
  'pinterest.com',
  'snapchat.com',
  'reddit.com',
  'tumblr.com',
  'whatsapp.com',
  'telegram.org', 't.me',
];

const getSocialPlatformInfo = (url: string): { name: string; icon: React.ElementType; color: string } | null => {
  const domain = url.toLowerCase();
  if (domain.includes('facebook.com') || domain.includes('fb.com') || domain.includes('fb.me')) {
    return { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' };
  }
  if (domain.includes('instagram.com') || domain.includes('instagr.am')) {
    return { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400' };
  }
  if (domain.includes('tiktok.com')) {
    return { name: 'TikTok', icon: () => <span className="text-2xl">🎵</span>, color: 'bg-black' };
  }
  if (domain.includes('twitter.com') || domain.includes('x.com')) {
    return { name: 'X (Twitter)', icon: () => <span className="text-2xl font-bold">𝕏</span>, color: 'bg-black' };
  }
  if (domain.includes('linkedin.com')) {
    return { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' };
  }
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    return { name: 'YouTube', icon: Youtube, color: 'bg-red-600' };
  }
  if (domain.includes('pinterest.com')) {
    return { name: 'Pinterest', icon: () => <span className="text-2xl">📌</span>, color: 'bg-red-700' };
  }
  return null;
};

const isSocialMediaUrl = (url: string): boolean => {
  const domain = url.toLowerCase();
  return SOCIAL_MEDIA_DOMAINS.some(social => domain.includes(social));
};

export default function WebsitePreviewIcon({
  website,
  businessName = 'Business',
  size = 'sm',
  showInline = true,
  triggerClassName,
  iconClassName,
  tooltipTitle = 'Preview Website',
}: WebsitePreviewIconProps) {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract homepage URL only (strip paths like /about, /contact, etc.)
  const getHomepageUrl = (url: string): string => {
    try {
      const withProtocol = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(withProtocol);
      return urlObj.origin;
    } catch {
      const cleaned = url.replace(/^https?:\/\//, '').split('/')[0];
      return `https://${cleaned}`;
    }
  };

  const normalizedUrl = useMemo(() => (website ? getHomepageUrl(website) : ''), [website]);
  const fullUrl = useMemo(() => {
    if (!website) return '';
    return website.startsWith('http') ? website : `https://${website}`;
  }, [website]);
  const displayUrl = useMemo(
    () => (website ? website.replace(/^https?:\/\//, '').split('/')[0] : ''),
    [website],
  );
  const isSocial = useMemo(() => website ? isSocialMediaUrl(website) : false, [website]);
  const socialInfo = useMemo(() => website ? getSocialPlatformInfo(website) : null, [website]);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  } as const;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!normalizedUrl) return;
    setOpen(true);
  };

  if (!website) return null;

  const layoutClass = `${showInline ? 'inline-flex' : 'flex'} items-center justify-center cursor-pointer transition-all duration-200`;

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className={cn(
                layoutClass,
                triggerClassName ?? 'p-1 rounded-md text-primary/70 hover:text-primary hover:bg-primary/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
              aria-label={`View ${businessName} website`}
            >
              <Globe className={cn(sizeClasses[size], 'transition-transform hover:scale-110', iconClassName)} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-popover border-border">
            <p className="text-sm font-medium">{tooltipTitle}</p>
            <p className="text-xs text-muted-foreground">{displayUrl}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setIsFullscreen(false); }}>
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden transition-all duration-300",
            isFullscreen 
              ? "!max-w-[100vw] w-[100vw] h-[100vh] rounded-none" 
              : "!max-w-[98vw] w-[98vw] h-[95vh]"
          )}
        >
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {businessName} website
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between gap-3">
              <span className="truncate">{normalizedUrl}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="gap-2"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4" />
                      Fullscreen
                    </>
                  )}
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <a href={normalizedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>

          {isSocial && socialInfo ? (
            /* Social media - show branded card with direct link */
            <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-muted/30">
              <div className={cn("w-32 h-32 rounded-2xl flex items-center justify-center text-white mb-6", socialInfo.color)}>
                <socialInfo.icon className="w-16 h-16" />
              </div>
              <div className="flex items-center gap-2 mb-4 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Social media sites cannot be previewed in-app</span>
              </div>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {socialInfo.name} blocks embedded previews for security. Click below to view {businessName}'s {socialInfo.name} page directly.
              </p>
              <Button asChild size="lg" className="gap-2">
                <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5" />
                  Open {socialInfo.name} Page
                </a>
              </Button>
            </div>
          ) : (
            /* Regular website - show iframe */
            <iframe
              title={`${businessName} website preview`}
              src={normalizedUrl}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}

          <div className="p-3 border-t border-border text-xs text-muted-foreground">
            {isSocial 
              ? "Social platforms restrict in-app previews. Use the button above to visit directly."
              : "If the preview is blank, the site blocks in-app previews—use \"Open\" to view it in a new tab."
            }
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
