// Dual-handle price range slider: two transparent range inputs over a shared track.
export default function PriceRangeSlider({ bounds, value, onChange }) {
  const min = bounds.min
  const max = bounds.max
  const span = Math.max(max - min, 1)
  const lowPct = ((value.min - min) / span) * 100
  const highPct = ((value.max - min) / span) * 100

  const setLow = (v) => onChange({ min: Math.min(Number(v), value.max), max: value.max })
  const setHigh = (v) => onChange({ min: value.min, max: Math.max(Number(v), value.min) })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="rounded-md bg-lightbg px-2 py-1 font-semibold text-dark">${value.min}</span>
        <span className="text-slate-400">—</span>
        <span className="rounded-md bg-lightbg px-2 py-1 font-semibold text-dark">${value.max}</span>
      </div>

      <div className="relative mx-1 h-1.5 rounded-full bg-bordergray">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value.min}
          onChange={(e) => setLow(e.target.value)}
          aria-label="Minimum price"
          className="range-input"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value.max}
          onChange={(e) => setHigh(e.target.value)}
          aria-label="Maximum price"
          className="range-input"
        />
      </div>
    </div>
  )
}
