import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!enabled || !mounted) return null;

  const badgeText = badgeCount > 9 ? "9+" : String(badgeCount);

  const dock = (
    <>
      {/* Floating Mailbox Dock Button */}
      <div
        className={cn(
          "fixed right-4 z-50 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2",
          isOpen && "pointer-events-none opacity-0",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "group relative",
            "rounded-2xl border border-border bg-background/80 backdrop-blur",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200 hover:translate-x-1",
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
      </div>

      {/* Full Screen Mailbox Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-200">
          {/* Close Button - floating on top */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-[110] p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white shadow-lg transition-colors backdrop-blur"
            aria-label="Close mailbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Full Screen Inbox - fills entire viewport */}
          <div className="w-full h-full">
            <AIResponseInbox />
          </div>
        </div>
      )}
    </>
  );

  return createPortal(dock, document.body);
}
