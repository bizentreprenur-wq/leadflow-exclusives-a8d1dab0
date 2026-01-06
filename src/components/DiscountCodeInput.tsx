import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Tag,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Gift,
  Percent,
} from "lucide-react";

interface DiscountCode {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  expiresAt?: string;
  minPurchase?: number;
}

// Demo discount codes (frontend-only validation)
const validCodes: Record<string, DiscountCode> = {
  "WELCOME20": {
    code: "WELCOME20",
    type: "percent",
    value: 20,
    description: "20% off your first month",
  },
  "LAUNCH50": {
    code: "LAUNCH50",
    type: "percent",
    value: 50,
    description: "50% off for early adopters",
    expiresAt: "2025-12-31",
  },
  "FRIEND10": {
    code: "FRIEND10",
    type: "percent",
    value: 10,
    description: "10% friend referral discount",
  },
  "YEARLYBONUS": {
    code: "YEARLYBONUS",
    type: "fixed",
    value: 100,
    description: "$100 off yearly plans",
    minPurchase: 400,
  },
  "TRYITFREE": {
    code: "TRYITFREE",
    type: "percent",
    value: 100,
    description: "First week free trial",
  },
};

interface DiscountCodeInputProps {
  onApply?: (discount: DiscountCode) => void;
  originalPrice?: number;
  compact?: boolean;
}

export default function DiscountCodeInput({ 
  onApply, 
  originalPrice = 99,
  compact = false 
}: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }

    setIsValidating(true);
    setError("");

    // Simulate API call
    await new Promise(r => setTimeout(r, 800));

    const upperCode = code.toUpperCase().trim();
    const discount = validCodes[upperCode];

    if (discount) {
      // Check expiry
      if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
        setError("This code has expired");
        setIsValidating(false);
        return;
      }

      // Check min purchase
      if (discount.minPurchase && originalPrice < discount.minPurchase) {
        setError(`Minimum purchase of $${discount.minPurchase} required`);
        setIsValidating(false);
        return;
      }

      setAppliedDiscount(discount);
      onApply?.(discount);
      toast.success(`🎉 ${discount.description} applied!`);
    } else {
      setError("Invalid discount code");
    }

    setIsValidating(false);
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    setCode("");
    setError("");
  };

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === "percent") {
      return (originalPrice * appliedDiscount.value) / 100;
    }
    return Math.min(appliedDiscount.value, originalPrice);
  };

  const finalPrice = originalPrice - calculateDiscount();

  if (appliedDiscount) {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">{appliedDiscount.code}</p>
              <p className="text-sm text-muted-foreground">{appliedDiscount.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove} className="text-muted-foreground">
            Remove
          </Button>
        </div>

        {!compact && (
          <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Price</span>
              <span className="text-foreground">${originalPrice}/mo</span>
            </div>
            <div className="flex items-center justify-between text-sm text-success">
              <span>Discount</span>
              <span>-${calculateDiscount().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-bold pt-2 border-t border-border">
              <span className="text-foreground">Final Price</span>
              <span className="text-lg text-success">${finalPrice.toFixed(2)}/mo</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Have a discount code?</span>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Enter code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            className={`uppercase ${error ? "border-destructive" : ""}`}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
          {error && (
            <p className="absolute -bottom-5 left-0 text-xs text-destructive">{error}</p>
          )}
        </div>
        <Button 
          onClick={handleApply} 
          disabled={isValidating || !code}
          variant="outline"
          className="shrink-0"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-2 pt-1">
          <p className="text-xs text-muted-foreground w-full">Try these codes:</p>
          {["WELCOME20", "LAUNCH50", "TRYITFREE"].map((demoCode) => (
            <Badge 
              key={demoCode}
              variant="outline" 
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => {
                setCode(demoCode);
                setError("");
              }}
            >
              <Gift className="w-3 h-3 mr-1" />
              {demoCode}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
