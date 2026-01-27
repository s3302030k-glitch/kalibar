import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

const CabinCardSkeleton = () => {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-5">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16 mt-1" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

const PriceSkeleton = () => {
  return (
    <div className="p-3 sm:p-4 bg-forest-medium/10 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
};

export { Skeleton, CabinCardSkeleton, PriceSkeleton };
