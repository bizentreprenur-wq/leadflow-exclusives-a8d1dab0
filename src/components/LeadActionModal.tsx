import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Download, FileSpreadsheet, Sparkles, ArrowRight } from "lucide-react";

interface LeadActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadCount: number;
  onVerifyWithAI: () => void;
  onDownload: () => void;
  onSendToGoogleDrive: () => void;
}

export default function LeadActionModal({
  open,
  onOpenChange,
  leadCount,
  onVerifyWithAI,
  onDownload,
  onSendToGoogleDrive,
}: LeadActionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-success/10 border border-success/20">
              <Sparkles className="w-6 h-6 text-success" />
            </div>
            <div>
              <DialogTitle className="text-xl">Leads Generated!</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {leadCount} lead{leadCount !== 1 ? "s" : ""} found
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base">
            What would you like to do with your leads?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Verify with AI - Primary action */}
          <Button
            onClick={() => {
              onOpenChange(false);
              onVerifyWithAI();
            }}
            className="w-full h-auto p-4 justify-start gap-4"
            variant="default"
          >
            <div className="p-2 rounded-lg bg-background/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold">Verify Leads with AI</p>
              <p className="text-xs opacity-80 font-normal">
                Validate contacts, score leads, and get email drafts
              </p>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Download CSV */}
          <Button
            onClick={() => {
              onOpenChange(false);
              onDownload();
            }}
            className="w-full h-auto p-4 justify-start gap-4"
            variant="outline"
          >
            <div className="p-2 rounded-lg bg-muted">
              <Download className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground">Download as CSV</p>
              <p className="text-xs text-muted-foreground font-normal">
                Export raw leads to a spreadsheet file
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Button>

          {/* Send to Google Drive */}
          <Button
            onClick={() => {
              onOpenChange(false);
              onSendToGoogleDrive();
            }}
            className="w-full h-auto p-4 justify-start gap-4"
            variant="outline"
          >
            <div className="p-2 rounded-lg bg-muted">
              <FileSpreadsheet className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground">Send to Google Drive</p>
              <p className="text-xs text-muted-foreground font-normal">
                Create a Google Sheet with your leads
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Pro tip: Verified leads convert 3x better than unverified ones
        </p>
      </DialogContent>
    </Dialog>
  );
}
