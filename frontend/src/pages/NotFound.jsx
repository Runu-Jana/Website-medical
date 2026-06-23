import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-7xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </div>
  )
}
