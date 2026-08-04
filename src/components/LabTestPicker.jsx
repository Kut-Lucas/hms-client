import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

/**
 * Multi-select lab test picker.
 * Props:
 *   selected   – array of {id, name, price}
 *   onChange(newSelected) – called whenever selection changes
 */
export default function LabTestPicker({ selected = [], onChange }) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lab-tests-catalog'],
    queryFn: async () => (await api.get('/doctor/lab-tests')).data,
    staleTime: 5 * 60 * 1000,
  });

  const tests = data?.tests || [];
  const filtered = search.trim()
    ? tests.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tests;

  const selectedIds = new Set(selected.map((s) => s.id));

  function toggle(test) {
    if (selectedIds.has(test.id)) {
      onChange(selected.filter((s) => s.id !== test.id));
    } else {
      onChange([...selected, { id: test.id, name: test.name, price: test.price_min }]);
    }
  }

  const totalFee = selected.reduce((sum, t) => sum + Number(t.price), 0);

  function priceLabel(t) {
    if (t.price_min === t.price_max) {
      return t.price_min === 0 ? 'TBD' : `KES ${t.price_min.toLocaleString()}`;
    }
    return `KES ${t.price_min.toLocaleString()} – ${t.price_max.toLocaleString()}`;
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Filter tests…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {isLoading && <p className="text-sm text-slate-500">Loading tests…</p>}

      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
        {filtered.map((t) => {
          const checked = selectedIds.has(t.id);
          return (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50 ${checked ? 'bg-hospital-50' : ''}`}
            >
              <span className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(t)}
                  className="h-4 w-4 accent-hospital-800"
                />
                <span className={`${checked ? 'font-medium text-hospital-900' : 'text-slate-800'}`}>
                  {t.name}
                </span>
              </span>
              <span className="ml-4 shrink-0 text-xs text-slate-500">{priceLabel(t)}</span>
            </label>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <p className="px-3 py-3 text-sm text-slate-500">No tests match.</p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-lg border border-hospital-200 bg-hospital-50 px-3 py-2 text-sm">
          <p className="font-medium text-hospital-900">
            {selected.length} test{selected.length !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-slate-600">
            {selected.map((s) => s.name).join(' · ')}
          </p>
          <p className="mt-1 text-xs font-semibold text-hospital-800">
            Estimated fee: KES {totalFee.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
