import * as React from "react";
import { cn } from "@/lib/utils";

interface DualScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * DualScrollbar - Provides horizontal scrollbars at both top and bottom
 * The two scrollbars are synced so scrolling one scrolls the other
 */
const DualScrollbar = React.forwardRef<HTMLDivElement, DualScrollbarProps>(
  ({ className, children, ...props }, ref) => {
    const topScrollRef = React.useRef<HTMLDivElement>(null);
    const bottomScrollRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [scrollWidth, setScrollWidth] = React.useState(0);
    const [scrollLeft, setScrollLeft] = React.useState(0);
    const [clientWidth, setClientWidth] = React.useState(0);
    const isSyncing = React.useRef(false);

    // Update scroll width when content changes
    React.useEffect(() => {
      const updateMetrics = () => {
        if (!contentRef.current) return;
        setScrollWidth(contentRef.current.scrollWidth);
        setClientWidth(contentRef.current.clientWidth);
        setScrollLeft(contentRef.current.scrollLeft);
      };

      updateMetrics();

      // Use ResizeObserver to detect content size changes
      const resizeObserver = new ResizeObserver(updateMetrics);
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [children]);

    const updateScrollState = () => {
      if (!contentRef.current) return;
      setScrollLeft(contentRef.current.scrollLeft);
      setClientWidth(contentRef.current.clientWidth);
      setScrollWidth(contentRef.current.scrollWidth);
    };

    // Sync scroll positions
    const handleTopScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (contentRef.current && topScrollRef.current && bottomScrollRef.current) {
        const left = topScrollRef.current.scrollLeft;
        contentRef.current.scrollLeft = left;
        bottomScrollRef.current.scrollLeft = left;
      }
      updateScrollState();
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const handleBottomScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (contentRef.current && topScrollRef.current && bottomScrollRef.current) {
        const left = bottomScrollRef.current.scrollLeft;
        contentRef.current.scrollLeft = left;
        topScrollRef.current.scrollLeft = left;
      }
      updateScrollState();
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const handleContentScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (topScrollRef.current && bottomScrollRef.current && contentRef.current) {
        const left = contentRef.current.scrollLeft;
        topScrollRef.current.scrollLeft = left;
        bottomScrollRef.current.scrollLeft = left;
      }
      updateScrollState();
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const showThumb = scrollWidth > clientWidth;
    const trackWidth = clientWidth || 1;
    const thumbWidth = showThumb
      ? Math.max(48, Math.round((clientWidth / scrollWidth) * trackWidth))
      : trackWidth;
    const maxScrollLeft = Math.max(1, scrollWidth - clientWidth);
    const maxThumbLeft = Math.max(0, trackWidth - thumbWidth);
    const thumbLeft = showThumb
      ? Math.round((scrollLeft / maxScrollLeft) * maxThumbLeft)
      : 0;

    return (
      <div ref={ref} className={cn("relative flex flex-col overflow-hidden", className)} {...props}>
        {/* Top scrollbar - Enhanced visibility */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="relative shrink-0 overflow-x-auto overflow-y-hidden h-4 border-b-2 border-primary/40 bg-primary/10 rounded-t-lg sticky top-0 z-10"
          style={{ 
            direction: "ltr",
            scrollbarWidth: "auto",
            scrollbarColor: "hsl(var(--primary)) hsl(var(--muted))",
          }}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
          <div
            className="pointer-events-none absolute left-0 top-0 h-4"
            style={{ width: trackWidth }}
          >
            <div
              className="h-2 mt-1 rounded-full bg-primary/60 shadow-sm"
              style={{ width: thumbWidth, transform: `translateX(${thumbLeft}px)` }}
            />
          </div>
        </div>

        {/* Main content with bottom scrollbar */}
        <div
          ref={contentRef}
          onScroll={handleContentScroll}
          className="flex-1 min-h-0 overflow-auto scrollbar-thick"
          style={{
            scrollbarWidth: "auto",
            scrollbarColor: "hsl(var(--primary)) hsl(var(--muted))",
          }}
        >
          {children}
        </div>

        {/* Bottom scrollbar - always visible */}
        <div
          ref={bottomScrollRef}
          onScroll={handleBottomScroll}
          className="relative shrink-0 overflow-x-auto overflow-y-hidden h-4 border-t-2 border-primary/40 bg-primary/10 rounded-b-lg"
          style={{ 
            direction: "ltr",
            scrollbarWidth: "auto",
            scrollbarColor: "hsl(var(--primary)) hsl(var(--muted))",
          }}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
          <div
            className="pointer-events-none absolute left-0 top-0 h-4"
            style={{ width: trackWidth }}
          >
            <div
              className="h-2 mt-1 rounded-full bg-primary/60 shadow-sm"
              style={{ width: thumbWidth, transform: `translateX(${thumbLeft}px)` }}
            />
          </div>
        </div>
      </div>
    );
  }
);

DualScrollbar.displayName = "DualScrollbar";

export { DualScrollbar };
