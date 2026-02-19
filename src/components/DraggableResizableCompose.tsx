import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripHorizontal, Maximize2, Minimize2, Minus } from 'lucide-react';

interface DraggableResizableComposeProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function DraggableResizableCompose({ children, onClose }: DraggableResizableComposeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Position & size state
  const [pos, setPos] = useState({ x: window.innerWidth - 560, y: window.innerHeight - 540 });
  const [size, setSize] = useState({ w: 520, h: 500 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prevState, setPrevState] = useState<{ pos: typeof pos; size: typeof size } | null>(null);

  // Drag state
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize state
  const isResizing = useRef(false);
  const resizeDir = useRef<string>('');
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

  const MIN_W = 380;
  const MIN_H = 350;

  // Drag handlers
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos, isMaximized]);

  // Resize handlers
  const onResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    if (isMaximized) return;
    isResizing.current = true;
    resizeDir.current = dir;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, px: pos.x, py: pos.y };
    e.preventDefault();
    e.stopPropagation();
  }, [size, pos, isMaximized]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.current.y));
        setPos({ x: newX, y: newY });
      }
      if (isResizing.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const dir = resizeDir.current;
        let newW = resizeStart.current.w;
        let newH = resizeStart.current.h;
        let newX = resizeStart.current.px;
        let newY = resizeStart.current.py;

        if (dir.includes('e')) newW = Math.max(MIN_W, resizeStart.current.w + dx);
        if (dir.includes('w')) {
          newW = Math.max(MIN_W, resizeStart.current.w - dx);
          newX = resizeStart.current.px + (resizeStart.current.w - newW);
        }
        if (dir.includes('s')) newH = Math.max(MIN_H, resizeStart.current.h + dy);
        if (dir.includes('n')) {
          newH = Math.max(MIN_H, resizeStart.current.h - dy);
          newY = resizeStart.current.py + (resizeStart.current.h - newH);
        }

        setSize({ w: newW, h: newH });
        setPos({ x: newX, y: newY });
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const toggleMaximize = () => {
    if (isMaximized && prevState) {
      setPos(prevState.pos);
      setSize(prevState.size);
      setIsMaximized(false);
    } else {
      setPrevState({ pos, size });
      setPos({ x: 40, y: 40 });
      setSize({ w: window.innerWidth - 80, h: window.innerHeight - 80 });
      setIsMaximized(true);
    }
  };

  const style: React.CSSProperties = isMinimized
    ? { position: 'fixed', bottom: 0, right: 24, width: 280, height: 36, zIndex: 100 }
    : { position: 'fixed', left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: 100 };

  return (
    <div
      ref={containerRef}
      style={style}
      className={cn(
        "rounded-t-xl border border-border shadow-2xl bg-background overflow-hidden flex flex-col transition-all duration-200",
        isMinimized ? "rounded-xl" : "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      {/* Draggable title bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border cursor-move select-none shrink-0"
        onMouseDown={isMinimized ? undefined : onDragStart}
        onDoubleClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="font-medium">Compose</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title={isMinimized ? "Restore" : "Minimize"}
          >
            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {!isMinimized && (
            <button
              onClick={toggleMaximize}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      )}

      {/* Resize handles */}
      {!isMaximized && !isMinimized && (
        <>
          {/* Edges */}
          <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" onMouseDown={(e) => onResizeStart(e, 'n')} />
          <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" onMouseDown={(e) => onResizeStart(e, 's')} />
          <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize" onMouseDown={(e) => onResizeStart(e, 'w')} />
          <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize" onMouseDown={(e) => onResizeStart(e, 'e')} />
          {/* Corners */}
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={(e) => onResizeStart(e, 'nw')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={(e) => onResizeStart(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={(e) => onResizeStart(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={(e) => onResizeStart(e, 'se')} />
        </>
      )}
    </div>
  );
}
