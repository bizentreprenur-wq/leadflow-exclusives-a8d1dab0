import { Globe } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  // Normalize URL
  const normalizedUrl = website ? (website.startsWith('http') ? website : `https://${website}`) : '';
  const displayUrl = website ? website.replace(/^https?:\/\//, '').split('/')[0] : '';

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (normalizedUrl) {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if no website
  if (!website) return null;

  return (
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
  );
};

export default WebsitePreviewIcon;
