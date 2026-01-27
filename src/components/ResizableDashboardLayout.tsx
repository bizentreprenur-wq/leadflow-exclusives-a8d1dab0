// Resizable Dashboard Layout Wrapper - Allows adjustable sidebar width
import { ReactNode, useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

interface ResizableDashboardLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  defaultSidebarSize?: number;
  minSidebarSize?: number;
  maxSidebarSize?: number;
  className?: string;
}

export default function ResizableDashboardLayout({
  sidebar,
  content,
  defaultSidebarSize = 20,
  minSidebarSize = 12,
  maxSidebarSize = 35,
  className
}: ResizableDashboardLayoutProps) {
  const [sidebarSize, setSidebarSize] = useState(defaultSidebarSize);

  const handleResize = useCallback((sizes: number[]) => {
    if (sizes[0]) {
      setSidebarSize(sizes[0]);
      // Persist to localStorage for user preference
      localStorage.setItem('bamlead_sidebar_size', String(sizes[0]));
    }
  }, []);

  // Load saved preference on mount
  const getSavedSize = () => {
    try {
      const saved = localStorage.getItem('bamlead_sidebar_size');
      if (saved) {
        const size = parseFloat(saved);
        if (size >= minSidebarSize && size <= maxSidebarSize) {
          return size;
        }
      }
    } catch {}
    return defaultSidebarSize;
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("min-h-screen w-full", className)}
      onLayout={handleResize}
    >
      {/* Sidebar Panel */}
      <ResizablePanel
        defaultSize={getSavedSize()}
        minSize={minSidebarSize}
        maxSize={maxSidebarSize}
        className="bg-sidebar"
      >
        {sidebar}
      </ResizablePanel>

      {/* Resize Handle */}
      <ResizableHandle 
        withHandle 
        className="bg-border hover:bg-primary/20 transition-colors"
      />

      {/* Main Content Panel */}
      <ResizablePanel defaultSize={100 - getSavedSize()}>
        {content}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
