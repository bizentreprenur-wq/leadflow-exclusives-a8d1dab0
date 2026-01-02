import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Phone, Building2, CheckCircle2, Zap, DollarSign } from "lucide-react";
import { GMBResult } from "@/lib/api/gmb";

interface LeadVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: GMBResult[];
  onVerify: (leads: GMBResult[]) => void;
}

const VERIFICATION_PRICE_PER_LEAD = 0.50;

export default function LeadVerificationModal({
  open,
  onOpenChange,
  selectedLeads,
  onVerify,
}: LeadVerificationModalProps) {
  const totalPrice = selectedLeads.length * VERIFICATION_PRICE_PER_LEAD;

  const handleVerify = () => {
    onVerify(selectedLeads);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Verify Your Leads</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Get verified leads with confirmed contact information and business status for higher conversion rates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <Phone className="w-5 h-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">Contact Validation</p>
                <p className="text-xs text-muted-foreground">We verify phone numbers and emails are real and active</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <Building2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">Business Validation</p>
                <p className="text-xs text-muted-foreground">Confirm the business is still operating with current info</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">Higher Conversion</p>
                <p className="text-xs text-muted-foreground">Verified leads convert 3x better than unverified ones</p>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Leads to verify</span>
              <Badge variant="secondary" className="font-semibold">
                {selectedLeads.length} lead{selectedLeads.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Price per lead</span>
              <span className="text-sm font-medium text-foreground">${VERIFICATION_PRICE_PER_LEAD.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Selected leads preview */}
          {selectedLeads.length > 0 && selectedLeads.length <= 5 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Selected leads:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedLeads.map((lead) => (
                  <Badge key={lead.id} variant="outline" className="text-xs">
                    {lead.name.length > 25 ? lead.name.slice(0, 25) + "..." : lead.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleVerify} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Verify {selectedLeads.length} Lead{selectedLeads.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
