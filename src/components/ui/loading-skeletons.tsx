import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Dashboard stat card skeleton
export function StatCardSkeleton() {
  return (
    <Card className="border-2 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Lead result row skeleton
export function LeadRowSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b animate-pulse">
      <Skeleton className="w-5 h-5 rounded shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded shrink-0" />
    </div>
  );
}

// Lead results panel skeleton
export function LeadResultsPanelSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      
      {/* AI recommendation skeleton */}
      <Card className="border-2 border-violet-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lead rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <LeadRowSkeleton key={i} />
      ))}
    </div>
  );
}

// Email template card skeleton
export function TemplateCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// Email outreach stats skeleton
export function EmailStatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 text-center">
              <Skeleton className="h-4 w-16 mx-auto mb-2" />
              <Skeleton className="h-8 w-12 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Email history row skeleton
export function EmailHistoryRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg animate-pulse">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Saved leads list skeleton
export function SavedLeadsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
          <Skeleton className="w-5 h-5 rounded shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Verification progress skeleton
export function VerificationSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Progress header */}
      <div className="text-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-full max-w-md mx-auto" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Lead cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Search results loading skeleton (for the report modal)
export function SearchResultsLoadingSkeleton() {
  return (
    <div className="p-8 space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="text-left space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
      
      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0">
              <Skeleton className="w-5 h-5 rounded shrink-0" />
              <Skeleton className="h-4 w-48 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard workflow skeleton
export function WorkflowStepSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Step header */}
      <div className="text-center py-6 bg-muted/50 rounded-2xl">
        <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-72 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>
      
      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse h-96">
            <CardHeader className="pb-0">
              <div className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
              <Skeleton className="h-20 w-full rounded-xl mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
