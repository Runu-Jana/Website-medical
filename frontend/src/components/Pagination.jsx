export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  const nums = []
  for (let i = 1; i <= pages; i++) nums.push(i)
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn-outline px-3 py-2 disabled:opacity-40"
      >
        Prev
      </button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
            n === page
              ? 'bg-primary text-white'
              : 'border border-bordergray bg-white text-dark hover:border-primary hover:text-primary'
          }`}
        >
          {n}
        </button>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="btn-outline px-3 py-2 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
