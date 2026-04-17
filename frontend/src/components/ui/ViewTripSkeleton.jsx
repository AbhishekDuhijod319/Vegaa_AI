import React from "react";

/**
 * ViewTripSkeleton — full-page skeleton loading for the trip view.
 * Mimics the exact layout of the real page for seamless transition.
 */
export default function ViewTripSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero section skeleton */}
      <div className="relative min-h-[100svh] bg-muted/30 overflow-hidden">
        {/* Background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/20 to-primary/5 animate-pulse" />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        {/* Hero content skeleton */}
        <div className="relative grid md:grid-cols-2 min-h-[100svh] px-6 md:px-12 lg:px-20">
          {/* Left: text content */}
          <div className="flex flex-col justify-center gap-6 py-20">
            <div className="space-y-4">
              <div className="h-10 md:h-14 bg-white/10 rounded-xl w-3/4 animate-pulse" />
              <div className="h-6 bg-white/8 rounded-lg w-1/2 animate-pulse" style={{ animationDelay: "150ms" }} />
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 bg-white/8 rounded-full animate-pulse"
                  style={{ width: `${70 + i * 20}px`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Right: stats cards */}
          <div className="hidden md:flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 animate-pulse"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content sections skeleton */}
      <div className="px-2 md:px-4 lg:px-6 xl:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
          {/* Sidebar nav skeleton */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div
                  key={i}
                  className="h-9 bg-muted/60 rounded-lg animate-pulse"
                  style={{ animationDelay: `${i * 60}ms`, width: `${85 + (i % 3) * 5}%` }}
                />
              ))}
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="space-y-12">
            {/* Section: Hotels */}
            <SectionSkeleton title count={3} />

            <hr className="border-t border-border/30 mx-4 md:mx-8" />

            {/* Section: Restaurants */}
            <SectionSkeleton title count={3} />

            <hr className="border-t border-border/30 mx-4 md:mx-8" />

            {/* Section: Places */}
            <SectionSkeleton title count={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SectionSkeleton — skeleton for a single content section (Hotels, Restaurants, etc.)
 */
function SectionSkeleton({ count = 3, title = true }) {
  return (
    <div className="px-2 md:px-6 lg:px-8 xl:px-10 py-8 md:py-10">
      {title && (
        <div className="h-8 bg-muted/60 rounded-lg w-48 mb-6 animate-pulse" />
      )}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 min-[1200px]:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <CardSkeleton key={i} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}

/**
 * CardSkeleton — skeleton for a single entity card.
 */
function CardSkeleton({ delay = 0 }) {
  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image area */}
      <div className="w-full bg-muted aspect-[4/3] sm:aspect-[3/2]" />

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-muted/80 rounded-md w-3/4" />

        {/* Location */}
        <div className="h-4 bg-muted/50 rounded-md w-1/2" />

        {/* Rating + price row */}
        <div className="flex gap-4">
          <div className="h-4 bg-muted/40 rounded-md w-16" />
          <div className="h-4 bg-muted/40 rounded-md w-20" />
        </div>

        {/* Description lines */}
        <div className="space-y-2 pt-1">
          <div className="h-3 bg-muted/30 rounded w-full" />
          <div className="h-3 bg-muted/30 rounded w-5/6" />
        </div>

        {/* Button */}
        <div className="h-9 bg-muted/40 rounded-lg w-full mt-2" />
      </div>
    </div>
  );
}

export { SectionSkeleton, CardSkeleton };
