export default function MiniStat({ title, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-primary',
    green: 'bg-emerald-50 text-accent',
    amber: 'bg-amber-50 text-warning',
    red: 'bg-red-50 text-danger',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card flex items-center gap-4 p-4">
      {Icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
