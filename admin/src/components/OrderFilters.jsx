import { useEffect, useRef, useState } from 'react';
import { FiFilter, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

// ── Field + operator definitions (Airtable-style) ─────────────────────────
const STATUS_OPTS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((v) => ({
  value: v,
  label: v[0].toUpperCase() + v.slice(1),
}));
const FULFILLMENT_OPTS = [
  { value: 'packed', label: 'Order Packed' },
  { value: 'verified', label: 'Order Verified' },
  { value: 'ready', label: 'Ready for Dispatch' },
  { value: 'dispatched', label: 'Order Dispatched' },
];

const OPS = {
  select: [
    { value: 'is', label: 'is' },
    { value: 'isNot', label: 'is not' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
  ],
  singleSelect: [{ value: 'is', label: 'is' }],
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'is', label: 'is' },
  ],
  customer: [
    { value: 'contains', label: 'contains' },
    { value: 'is', label: 'is' },
    { value: 'isEmpty', label: 'is empty (guest)' },
    { value: 'isNotEmpty', label: 'is registered' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'ne', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'gte', label: '≥' },
    { value: 'lte', label: '≤' },
  ],
  date: [
    { value: 'is', label: 'is on' },
    { value: 'onOrAfter', label: 'is on or after' },
    { value: 'onOrBefore', label: 'is on or before' },
  ],
};

const FIELDS = [
  { key: 'status', label: 'Status', type: 'select', opsKey: 'select', options: STATUS_OPTS },
  { key: 'fulfillmentStatus', label: 'Order Status', type: 'select', opsKey: 'select', options: FULFILLMENT_OPTS },
  { key: 'isPaid', label: 'Payment', type: 'select', opsKey: 'singleSelect', options: [
      { value: 'paid', label: 'Paid' },
      { value: 'unpaid', label: 'Unpaid' },
    ] },
  { key: 'paymentMethod', label: 'Payment Method', type: 'select', opsKey: 'singleSelect', options: [
      { value: 'Cash on Delivery', label: 'Cash on Delivery' },
      { value: 'Razorpay', label: 'Online (Razorpay)' },
    ] },
  { key: 'totalPrice', label: 'Order Total (₹)', type: 'number', opsKey: 'number' },
  { key: 'customer', label: 'Customer', type: 'text', opsKey: 'customer' },
  { key: 'orderNumber', label: 'Order #', type: 'text', opsKey: 'text' },
  { key: 'createdAt', label: 'Date', type: 'date', opsKey: 'date' },
];

const fieldDef = (key) => FIELDS.find((f) => f.key === key) || FIELDS[0];
const noValueOp = (op) => op === 'isEmpty' || op === 'isNotEmpty';

let idc = 0;
const newCondition = () => {
  const f = FIELDS[0];
  return { id: ++idc, field: f.key, operator: OPS[f.opsKey][0].value, value: '' };
};

// A condition counts once it has enough to run.
export const isComplete = (c) => {
  const f = fieldDef(c.field);
  if (noValueOp(c.operator)) return true;
  if (f.type === 'select') return c.value !== '';
  return String(c.value).trim() !== '';
};

export default function OrderFilters({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const conditions = value.conditions;
  const activeCount = conditions.filter(isComplete).length;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const update = (next) => onChange(next);

  const setConjunction = (conjunction) => update({ ...value, conjunction });

  const patchCondition = (id, patch) =>
    update({
      ...value,
      conditions: conditions.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...patch };
        // Reset operator/value when the field changes.
        if (patch.field && patch.field !== c.field) {
          const f = fieldDef(patch.field);
          merged.operator = OPS[f.opsKey][0].value;
          merged.value = '';
        }
        return merged;
      }),
    });

  const addCondition = () => update({ ...value, conditions: [...conditions, newCondition()] });
  const removeCondition = (id) =>
    update({ ...value, conditions: conditions.filter((c) => c.id !== id) });
  const clearAll = () => update({ conjunction: 'and', conditions: [] });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
          activeCount
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <FiFilter size={15} />
        Filter{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,640px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          {conditions.length === 0 ? (
            <p className="px-1 py-2 text-sm text-slate-500">No filters applied to this view.</p>
          ) : (
            <div className="space-y-2">
              {conditions.map((c, i) => {
                const f = fieldDef(c.field);
                const ops = OPS[f.opsKey];
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-2">
                    {/* Conjunction */}
                    <div className="w-16 shrink-0 text-sm text-slate-500">
                      {i === 0 ? (
                        'Where'
                      ) : i === 1 ? (
                        <select
                          value={value.conjunction}
                          onChange={(e) => setConjunction(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-1.5 py-1 text-sm outline-none focus:border-primary"
                        >
                          <option value="and">And</option>
                          <option value="or">Or</option>
                        </select>
                      ) : (
                        <span className="pl-1.5 font-medium capitalize">{value.conjunction}</span>
                      )}
                    </div>

                    {/* Field */}
                    <select
                      value={c.field}
                      onChange={(e) => patchCondition(c.id, { field: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                    >
                      {FIELDS.map((fl) => (
                        <option key={fl.key} value={fl.key}>
                          {fl.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={c.operator}
                      onChange={(e) => patchCondition(c.id, { operator: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                    >
                      {ops.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* Value */}
                    {!noValueOp(c.operator) &&
                      (f.type === 'select' ? (
                        <select
                          value={c.value}
                          onChange={(e) => patchCondition(c.id, { value: e.target.value })}
                          className="min-w-[9rem] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                        >
                          <option value="">Select…</option>
                          {f.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                          value={c.value}
                          onChange={(e) => patchCondition(c.id, { value: e.target.value })}
                          placeholder="Enter a value"
                          className="min-w-[9rem] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                        />
                      ))}

                    <button
                      onClick={() => removeCondition(c.id)}
                      className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove condition"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              onClick={addCondition}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <FiPlus size={15} /> Add condition
            </button>
            {conditions.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500"
              >
                <FiTrash2 size={14} /> Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
