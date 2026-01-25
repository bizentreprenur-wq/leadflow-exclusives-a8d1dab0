import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import AIResponseInbox from "@/components/AIResponseInbox";

type MailboxDockProps = {
  /** Render nothing when false */
  enabled?: boolean;
  /** Small badge count shown on the mailbox (defaults to 1 to match the mock) */
  badgeCount?: number;
  className?: string;
  /** Controlled open state - when provided, component becomes controlled */
  isOpen?: boolean;
  /** Callback when the mailbox should open */
  onOpen?: () => void;
  /** Callback when the mailbox should close */
  onClose?: () => void;
  /** Campaign context to show in mailbox header */
  campaignContext?: {
    isActive: boolean;
    sentCount: number;
    totalLeads: number;
  };
};

export default function MailboxDock({
  enabled = true,
  badgeCount = 1,
  className,
  isOpen: controlledIsOpen,
  onOpen,
  onClose,
  campaignContext,
}: MailboxDockProps) {
  const [mounted, setMounted] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpen = useCallback(() => {
    if (isControlled && onOpen) {
      onOpen();
    } else {
      setInternalIsOpen(true);
    }
  }, [isControlled, onOpen]);

  const handleClose = useCallback(() => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

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
          onClick={handleOpen}
          className={cn(
            "group relative flex flex-col items-center gap-1",
            "rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-emerald-700",
            "shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30",
            "transition-all duration-200 hover:scale-105",
            "p-3",
          )}
          aria-label="Open mailbox"
        >
          <div className="relative">
            <Mail className="w-8 h-8 text-white" strokeWidth={1.5} />
            {badgeCount > 0 && (
              <span
                className={cn(
                  "absolute -top-2 -right-2",
                  "inline-flex h-5 w-5 items-center justify-center",
                  "rounded-full bg-red-500 text-white",
                  "text-[10px] font-bold",
                  "animate-pulse",
                )}
              >
                {badgeText}
              </span>
            )}
          </div>

          <span className="text-[10px] font-medium text-white/90">
            Mailbox
          </span>
        </button>
      </div>

      {/* Full Screen Mailbox Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-200">
          {/* Campaign Running Indicator */}
          {campaignContext?.isActive && (
            <div className="absolute top-4 left-4 z-[110] flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/90 text-white text-sm shadow-lg backdrop-blur">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Campaign running: {campaignContext.sentCount}/{campaignContext.totalLeads} sent</span>
            </div>
          )}

          {/* Close Button - floating on top */}
          <button
            onClick={handleClose}
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
