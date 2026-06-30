import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'
import { FaRegHeart } from 'react-icons/fa'

export default function Wishlist() {
  const { items } = useWishlist()

  return (
    <div className="container-x py-8">
      <nav className="mb-5 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{' '}
        / <span className="text-dark">Wishlist</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-dark">
        My Wishlist {items.length > 0 && <span className="text-slate-400">({items.length})</span>}
      </h1>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <FaRegHeart size={44} className="text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-dark">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-slate-500">
            Tap the heart on any product to save it here.
          </p>
          <Link to="/shop" className="btn-primary mt-6">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
