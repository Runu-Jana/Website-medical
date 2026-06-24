const MAP = {
  // order statuses
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  // product statuses
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-600',
  draft: 'bg-slate-100 text-slate-600',
  archived: 'bg-red-100 text-red-700',
  // generic
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-amber-100 text-amber-700',
  yes: 'bg-emerald-100 text-emerald-700',
  no: 'bg-slate-100 text-slate-600',
};

export default function StatusBadge({ status, className = '' }) {
  const key = String(status || '').toLowerCase();
  const cls = MAP[key] || 'bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls} ${className}`}
    >
      {status || '-'}
    </span>
  );
}
