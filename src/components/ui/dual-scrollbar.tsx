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
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [scrollWidth, setScrollWidth] = React.useState(0);
    const isSyncing = React.useRef(false);

    // Update scroll width when content changes
    React.useEffect(() => {
      const updateScrollWidth = () => {
        if (contentRef.current) {
          setScrollWidth(contentRef.current.scrollWidth);
        }
      };

      updateScrollWidth();

      // Use ResizeObserver to detect content size changes
      const resizeObserver = new ResizeObserver(updateScrollWidth);
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [children]);

    // Sync scroll positions
    const handleTopScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (contentRef.current && topScrollRef.current) {
        contentRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const handleContentScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      if (topScrollRef.current && contentRef.current) {
        topScrollRef.current.scrollLeft = contentRef.current.scrollLeft;
      }
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {/* Top scrollbar */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto overflow-y-hidden h-3 border-b border-border bg-muted/30"
          style={{ direction: "ltr" }}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>

        {/* Main content with bottom scrollbar */}
        <div
          ref={contentRef}
          onScroll={handleContentScroll}
          className="overflow-auto"
        >
          {children}
        </div>
      </div>
    );
  }
);

DualScrollbar.displayName = "DualScrollbar";

export { DualScrollbar };
