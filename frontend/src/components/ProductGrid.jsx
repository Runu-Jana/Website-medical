import ProductCard from './ProductCard'
import ProductSkeleton from './ProductSkeleton'

export default function ProductGrid({
  products,
  loading,
  cols = 4,
  view = 'grid',
  empty = 'No products found.',
}) {
  if (loading) return <ProductSkeleton count={cols === 4 ? 8 : 6} cols={cols} />
  if (!products || products.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-slate-500">{empty}</p>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} list />
        ))}
      </div>
    )
  }

  const colClass =
    cols === 4
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3'
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  )
}
