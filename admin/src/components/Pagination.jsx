import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) {
    return total != null ? (
      <div className="px-4 py-3 text-sm text-slate-500">{total} item(s)</div>
    ) : null;
  }

  const nums = [];
  const add = (n) => nums.push(n);
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  if (start > 1) add(1);
  if (start > 2) add('...');
  for (let i = start; i <= end; i++) add(i);
  if (end < pages - 1) add('...');
  if (end < pages) add(pages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of {pages}
        {total != null && <span className="ml-2 text-slate-500">({total} total)</span>}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost px-2 py-1.5"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <FiChevronLeft />
        </button>
        {nums.map((n, i) =>
          n === '...' ? (
            <span key={`e${i}`} className="px-2 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium ${
                n === page ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {n}
            </button>
          )
        )}
        <button
          className="btn-ghost px-2 py-1.5"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
