// Shown while a lazily-loaded route chunk is fetched. The navbar/footer stay
// mounted (this only fills the content area), so navigation feels instant:
// a slim progress bar sweeps at the top and a soft skeleton hints at content.

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-bordergray bg-white">
      <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-5 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}

export default function RouteLoader() {
  return (
    <>
      {/* Indeterminate progress bar pinned to the top of the viewport */}
      <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/10">
        <div className="h-full w-full origin-left animate-loadbar bg-primary" />
      </div>

      {/* Content skeleton */}
      <div className="container-x animate-pulse py-8">
        <div className="mb-6 h-7 w-48 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </>
  )
}
