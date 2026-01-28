import { useState } from "react";
import { GMBResult } from "@/lib/api/gmb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Globe, Phone, MapPin, Star, CheckCircle, XCircle, 
  ExternalLink, Smartphone, AlertTriangle, X
} from "lucide-react";

interface GMBResultModalProps {
  result: GMBResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GMBResultModal = ({ result, open, onOpenChange }: GMBResultModalProps) => {
  const [websitePreviewOpen, setWebsitePreviewOpen] = useState(false);
  
  if (!result) return null;

  const { websiteAnalysis } = result;

  // Normalize the URL for iframe
  const getNormalizedUrl = (url: string | undefined): string => {
    if (!url) return '';
    try {
      const withProtocol = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(withProtocol);
      return urlObj.origin;
    } catch {
      const cleaned = url.replace(/^https?:\/\//, '').split('/')[0];
      return `https://${cleaned}`;
    }
  };

  const normalizedUrl = getNormalizedUrl(result.url);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display pr-8">{result.name}</DialogTitle>
          <DialogDescription>Business details and website analysis</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {websiteAnalysis.needsUpgrade ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm">Needs Website Upgrade</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium text-sm">Good Website</span>
              </div>
            )}
            {websiteAnalysis.platform && (
              <span className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                {websiteAnalysis.platform}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            {result.phone && (
              <a 
                href={`tel:${result.phone}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{result.phone}</p>
                </div>
              </a>
            )}
            {result.address && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground text-sm">{result.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          {result.rating && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Google Rating</p>
                <p className="font-medium text-foreground">
                  {result.rating} stars ({result.reviewCount} reviews)
                </p>
              </div>
            </div>
          )}

          {/* Website Analysis */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-foreground">Website Analysis</h4>
            
            <div className="p-4 rounded-xl border border-border bg-card">
              {websiteAnalysis.hasWebsite ? (
                <div className="space-y-4">
                  {/* Website URL */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{result.displayLink}</span>
                    </div>
                    {result.url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5"
                        onClick={() => setWebsitePreviewOpen(true)}
                      >
                        <Globe className="w-3 h-3" />
                        Preview Site
                      </Button>
                    )}
                  </div>

                  {/* Mobile Score */}
                  {websiteAnalysis.mobileScore !== null && (
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Mobile Score</span>
                          <span className={`font-medium ${
                            websiteAnalysis.mobileScore >= 70 ? 'text-success' : 
                            websiteAnalysis.mobileScore >= 50 ? 'text-amber-500' : 'text-destructive'
                          }`}>
                            {websiteAnalysis.mobileScore}/100
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              websiteAnalysis.mobileScore >= 70 ? 'bg-success' : 
                              websiteAnalysis.mobileScore >= 50 ? 'bg-amber-500' : 'bg-destructive'
                            }`}
                            style={{ width: `${websiteAnalysis.mobileScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {websiteAnalysis.issues.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Issues Detected:</p>
                      <div className="flex flex-wrap gap-2">
                        {websiteAnalysis.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive font-medium"
                          >
                            <XCircle className="w-3 h-3" />
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <XCircle className="w-8 h-8 text-destructive mx-auto mb-2 opacity-60" />
                  <p className="font-medium text-foreground">No Website Found</p>
                  <p className="text-sm text-muted-foreground">This business doesn't have a website</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {result.snippet && (
            <div>
              <h4 className="font-display font-semibold text-foreground mb-2">Description</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{result.snippet}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {result.phone && (
              <a href={`tel:${result.phone}`} className="flex-1">
                <Button className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  Call Business
                </Button>
              </a>
            )}
            {result.url && (
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => setWebsitePreviewOpen(true)}
              >
                <Globe className="w-4 h-4" />
                View Website
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Website Preview Dialog */}
    <Dialog open={websitePreviewOpen} onOpenChange={setWebsitePreviewOpen}>
      <DialogContent className="w-[min(96vw,72rem)] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            {result.name}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-3">
            <span className="truncate text-muted-foreground">{normalizedUrl}</span>
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-2">
              <a href={normalizedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </a>
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 h-[calc(100%-120px)] w-full border-t border-border bg-muted/20">
          <iframe
            title={`${result.name} website preview`}
            src={normalizedUrl}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="p-3 border-t border-border text-xs text-muted-foreground bg-card">
          💡 If the preview is blank, the site blocks in-app previews — use "Open in New Tab" above.
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default GMBResultModal;
