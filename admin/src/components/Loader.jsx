export default function Loader({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-slate-500 ${className}`}>
      <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}
