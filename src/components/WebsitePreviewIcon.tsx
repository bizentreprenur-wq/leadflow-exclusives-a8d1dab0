import { useMemo, useState } from 'react';
import { ExternalLink, Globe, Maximize2, Minimize2 } from 'lucide-react';
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
  const displayUrl = useMemo(
    () => (website ? website.replace(/^https?:\/\//, '').split('/')[0] : ''),
    [website],
  );

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

          <div className="h-full w-full border-t border-border bg-muted/20">
            <iframe
              title={`${businessName} website preview`}
              src={normalizedUrl}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-3 border-t border-border text-xs text-muted-foreground">
            If the preview is blank, the site blocks in-app previews—use "Open" to view it in a new tab.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
