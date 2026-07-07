// Skeleton placeholders for perceived-speed loading (1mg-style shimmer).

function Card() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-6 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-9 w-full animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

export default function ProductSkeleton({ count = 8, cols = 4 }) {
  const colClass =
    cols === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  )
}

// A single skeleton card, for reuse inside carousels.
export function SkeletonCard() {
  return <Card />
}
