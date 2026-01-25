import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AIResponseInbox from "@/components/AIResponseInbox";

import mailboxImage from "@/assets/mailbox-3d.png";

type MailboxDockProps = {
  /** Render nothing when false */
  enabled?: boolean;
  /** Small badge count shown on the mailbox (defaults to 1 to match the mock) */
  badgeCount?: number;
  className?: string;
};

export default function MailboxDock({
  enabled = true,
  badgeCount = 1,
  className,
}: MailboxDockProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!enabled || !mounted) return null;

  const badgeText = badgeCount > 9 ? "9+" : String(badgeCount);

  const dock = (
    <div
      className={cn(
        "fixed right-4 z-50 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2",
        className,
      )}
    >
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "group relative",
              "rounded-2xl border border-border bg-background/80 backdrop-blur",
              "shadow-lg hover:shadow-xl",
              "transition-transform duration-200 hover:translate-x-1",
              "p-3 w-[104px]",
            )}
            aria-label="Open mailbox"
          >
            <div className="relative">
              <img
                src={mailboxImage}
                alt="Mailbox"
                loading="lazy"
                className="w-full h-auto"
              />
              {badgeCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-2 -right-2",
                    "inline-flex h-6 w-6 items-center justify-center",
                    "rounded-full bg-destructive text-destructive-foreground",
                    "text-xs font-bold",
                  )}
                >
                  {badgeText}
                </span>
              )}
            </div>

            <div className="mt-2 text-center text-xs font-semibold text-foreground">
              Mailbox
            </div>
            <div className="text-[10px] text-center text-muted-foreground">
              Ready to send mail
            </div>
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[min(1100px,95vw)] p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Mailbox
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-73px)] overflow-hidden">
            <AIResponseInbox />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return createPortal(dock, document.body);
}

