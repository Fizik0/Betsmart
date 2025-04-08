import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

// Additional skeleton components for common UI elements
function EventCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border bg-card shadow-sm">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-10" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-6 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-12 w-[30%]" />
          <Skeleton className="h-12 w-[30%]" />
          <Skeleton className="h-12 w-[30%]" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

function BettingSlipSkeleton() {
  return (
    <div className="p-4 rounded-xl border bg-card shadow-sm">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-3">
        <div className="p-3 border rounded-lg">
          <div className="flex justify-between mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="p-3 border rounded-lg">
          <div className="flex justify-between mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function LiveStreamSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-md mx-auto p-4 rounded-xl border bg-card shadow-sm">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export { 
  Skeleton,
  EventCardSkeleton,
  BettingSlipSkeleton,
  LiveStreamSkeleton,
  ProfileSkeleton
}