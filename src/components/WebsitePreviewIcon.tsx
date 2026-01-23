import { useState, useCallback } from 'react';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WebsitePreviewIconProps {
  website: string | undefined | null;
  businessName?: string;
  size?: 'sm' | 'md' | 'lg';
  showInline?: boolean;
}

const WebsitePreviewIcon = ({ 
  website, 
  businessName = 'Business',
  size = 'sm',
  showInline = true
}: WebsitePreviewIconProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Normalize URL (computed values, not hooks)
  const normalizedUrl = website ? (website.startsWith('http') ? website : `https://${website}`) : '';
  const displayUrl = website ? website.replace(/^https?:\/\//, '').split('/')[0] : '';

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLoading(true);
    setIframeError(false);
    setIsModalOpen(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setIframeError(true);
    // Auto-fallback: open in new tab
    if (normalizedUrl) {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
    setIsModalOpen(false);
  }, [normalizedUrl]);

  const openInNewTab = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (normalizedUrl) {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
    setIsModalOpen(false);
  }, [normalizedUrl]);

  // Don't render if no website - placed after all hooks
  if (!website) return null;

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className={`
                ${showInline ? 'inline-flex' : 'flex'} 
                items-center justify-center 
                p-1 rounded-md 
                text-primary/70 hover:text-primary 
                hover:bg-primary/10 
                transition-all duration-200 
                cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-primary/30
              `}
              aria-label={`View ${businessName} website`}
            >
              <Globe className={`${sizeClasses[size]} transition-transform hover:scale-110`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-popover border-border">
            <p className="text-sm font-medium">View Live Website</p>
            <p className="text-xs text-muted-foreground">{displayUrl}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Website Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="px-4 py-3 border-b bg-card flex flex-row items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold truncate">
                {businessName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {displayUrl}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                className="gap-1.5 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in New Tab
              </Button>
            </div>
          </DialogHeader>

          <div className="relative flex-1 h-full bg-muted/30">
            {/* Loading State */}
            {isLoading && !iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading website...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Some sites may block previews
                </p>
              </div>
            )}

            {/* Iframe */}
            <iframe
              src={normalizedUrl}
              title={`Preview of ${businessName} website`}
              className="w-full h-[calc(85vh-60px)] border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebsitePreviewIcon;
