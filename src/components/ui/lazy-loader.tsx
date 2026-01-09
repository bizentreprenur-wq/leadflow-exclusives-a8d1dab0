import { useState, useEffect, ReactNode, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ============================================
// Skeleton Presets for common UI patterns
// ============================================

type SkeletonPreset = 
  | 'card' 
  | 'card-grid' 
  | 'list' 
  | 'table' 
  | 'stats' 
  | 'form' 
  | 'text' 
  | 'avatar-list'
  | 'chart'
  | 'custom';

interface SkeletonConfig {
  preset?: SkeletonPreset;
  count?: number;
  columns?: number;
  rows?: number;
  className?: string;
}

// Preset skeleton components
function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

function CardGridSkeleton({ count = 4, columns = 2 }: { count?: number; columns?: number }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg animate-pulse">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-muted/50 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-3 border-b last:border-0 animate-pulse">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 text-center">
            <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-2" />
            <Skeleton className="h-8 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

function TextSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4" 
          style={{ width: `${70 + Math.random() * 30}%` }} 
        />
      ))}
    </div>
  );
}

function AvatarListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t" 
              style={{ height: `${30 + Math.random() * 70}%` }} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Get skeleton component based on preset
function getSkeletonComponent(config: SkeletonConfig): ReactNode {
  const { preset = 'card', count, columns, rows } = config;
  
  switch (preset) {
    case 'card':
      return <CardSkeleton />;
    case 'card-grid':
      return <CardGridSkeleton count={count} columns={columns} />;
    case 'list':
      return <ListSkeleton rows={rows} />;
    case 'table':
      return <TableSkeleton rows={rows} columns={columns} />;
    case 'stats':
      return <StatsSkeleton count={count} />;
    case 'form':
      return <FormSkeleton rows={rows} />;
    case 'text':
      return <TextSkeleton rows={rows} />;
    case 'avatar-list':
      return <AvatarListSkeleton rows={rows} />;
    case 'chart':
      return <ChartSkeleton />;
    default:
      return <CardSkeleton />;
  }
}

// ============================================
// LazyLoader Component
// ============================================

interface LazyLoaderProps {
  /** Whether the content is currently loading */
  isLoading: boolean;
  /** The content to show when loaded */
  children: ReactNode;
  /** Skeleton configuration */
  skeleton?: SkeletonConfig;
  /** Custom skeleton component (overrides preset) */
  customSkeleton?: ReactNode;
  /** Minimum time to show skeleton (prevents flashing) */
  minLoadTime?: number;
  /** Delay before showing skeleton (prevents flash for fast loads) */
  delay?: number;
  /** Error state */
  error?: Error | string | null;
  /** Error fallback component */
  errorFallback?: ReactNode;
  /** Wrapper className */
  className?: string;
}

export function LazyLoader({
  isLoading,
  children,
  skeleton = { preset: 'card' },
  customSkeleton,
  minLoadTime = 0,
  delay = 0,
  error,
  errorFallback,
  className,
}: LazyLoaderProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(minLoadTime === 0);

  // Handle delay before showing skeleton
  useEffect(() => {
    if (isLoading && delay > 0) {
      const timer = setTimeout(() => setShowSkeleton(true), delay);
      return () => clearTimeout(timer);
    }
    setShowSkeleton(isLoading);
  }, [isLoading, delay]);

  // Handle minimum load time
  useEffect(() => {
    if (isLoading && minLoadTime > 0) {
      setMinTimeElapsed(false);
      const timer = setTimeout(() => setMinTimeElapsed(true), minLoadTime);
      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadTime]);

  // Show error state
  if (error) {
    if (errorFallback) return <div className={className}>{errorFallback}</div>;
    return (
      <Card className={`border-destructive/50 bg-destructive/5 ${className}`}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground mt-1">
            {typeof error === 'string' ? error : error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show skeleton while loading
  const shouldShowSkeleton = showSkeleton && (!minTimeElapsed || isLoading);
  
  if (shouldShowSkeleton) {
    return (
      <div className={className}>
        {customSkeleton || getSkeletonComponent(skeleton)}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// ============================================
// Async Content Loader
// ============================================

interface AsyncLoaderProps<T> {
  /** Async function to fetch data */
  loader: () => Promise<T>;
  /** Render function for loaded data */
  children: (data: T) => ReactNode;
  /** Skeleton configuration */
  skeleton?: SkeletonConfig;
  /** Custom skeleton component */
  customSkeleton?: ReactNode;
  /** Dependencies that trigger reload */
  deps?: any[];
  /** Callback when data is loaded */
  onLoad?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Wrapper className */
  className?: string;
}

export function AsyncLoader<T>({
  loader,
  children,
  skeleton = { preset: 'card' },
  customSkeleton,
  deps = [],
  onLoad,
  onError,
  className,
}: AsyncLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await loader();
        if (!cancelled) {
          setData(result);
          onLoad?.(result);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          onError?.(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, deps);

  return (
    <LazyLoader
      isLoading={isLoading}
      error={error}
      skeleton={skeleton}
      customSkeleton={customSkeleton}
      className={className}
    >
      {data !== null ? children(data) : null}
    </LazyLoader>
  );
}

// ============================================
// Suspense-like Wrapper for Components
// ============================================

interface SuspenseLoaderProps {
  /** Fallback to show while loading */
  fallback?: ReactNode;
  /** Skeleton preset (used if no fallback provided) */
  skeleton?: SkeletonConfig;
  /** The component to load */
  children: ReactNode;
}

// Export preset skeletons for direct use
export {
  CardSkeleton,
  CardGridSkeleton,
  ListSkeleton,
  TableSkeleton,
  StatsSkeleton,
  FormSkeleton,
  TextSkeleton,
  AvatarListSkeleton,
  ChartSkeleton,
};

export type { SkeletonPreset, SkeletonConfig };
