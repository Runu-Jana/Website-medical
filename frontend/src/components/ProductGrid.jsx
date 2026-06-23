import ProductCard from './ProductCard'
import Spinner from './Spinner'

export default function ProductGrid({ products, loading, cols = 4, empty = 'No products found.' }) {
  if (loading) return <Spinner />
  if (!products || products.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-slate-500">{empty}</p>
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
