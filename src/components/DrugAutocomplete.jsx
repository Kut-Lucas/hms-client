import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Drug name autocomplete backed by the inventory DB.
 * Props:
 *   value        – controlled string value
 *   onChange(name, drugObj|null) – called when value changes or a suggestion is selected
 *   id, placeholder, required
 */
export default function DrugAutocomplete({ value, onChange, id, placeholder = 'Type drug name…', required }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const debounce                      = useRef(null);
  const wrapRef                       = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleInput(e) {
    const q = e.target.value;
    onChange(q, null);          // update parent with typed text, no selection yet
    clearTimeout(debounce.current);
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/doctor/drug-search?q=${encodeURIComponent(q)}`);
        setSuggestions(data.drugs || []);
        setOpen(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 250);
  }

  function handleSelect(drug) {
    onChange(drug.name, drug);  // pass full drug object to parent
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        onFocus={() => suggestions.length && setOpen(true)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
      />
      {loading && (
        <span className="absolute right-3 top-3 text-xs text-slate-400">searching…</span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-hospital-50"
                onMouseDown={() => handleSelect(d)}
              >
                <span className="font-medium text-slate-800">{d.name}</span>
                <span className="ml-4 shrink-0 text-xs text-slate-500">
                  Stock: {d.current_stock} {d.unit} · KES {Number(d.selling_price).toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && suggestions.length === 0 && value.trim().length > 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
          No matching drug found in inventory.
        </div>
      )}
    </div>
  );
}
