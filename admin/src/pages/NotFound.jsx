import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-content p-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-warning">
        <FiAlertTriangle size={32} />
      </div>
      <h1 className="text-5xl font-extrabold text-slate-800">404</h1>
      <p className="mt-2 text-lg font-semibold text-slate-600">Page not found</p>
      <p className="mt-1 text-sm text-slate-500">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}
