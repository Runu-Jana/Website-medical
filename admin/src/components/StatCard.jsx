import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

const gradients = {
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-green-600',
  amber: 'from-amber-400 to-orange-500',
  purple: 'from-violet-500 to-purple-600',
};

export default function StatCard({ title, value, icon: Icon, gradient = 'blue', growth, subtitle }) {
  const hasGrowth = growth !== undefined && growth !== null;
  const positive = Number(growth) >= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradients[gradient]} p-5 text-white shadow-card`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
          {hasGrowth && (
            <div className="mt-2 flex items-center gap-1 text-sm font-semibold">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
                  positive ? 'bg-white/20' : 'bg-black/20'
                }`}
              >
                {positive ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
                {Math.abs(Number(growth)).toFixed(1)}%
              </span>
              <span className="text-white/70 text-xs">vs last month</span>
            </div>
          )}
          {subtitle && !hasGrowth && <p className="mt-2 text-xs text-white/70">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-white/20 p-3">
            <Icon size={22} />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -right-6 -bottom-8 h-28 w-28 rounded-full bg-white/10" />
    </div>
  );
}
