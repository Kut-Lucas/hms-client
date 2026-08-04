import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { api } from '../../api/client.js';
import { formatDdMmYyyy } from '../../utils/datetime.js';

function downloadInventoryTemplate() {
  const lines = [
    'product_name,category,current_stock,reorder_level,cost_price,selling_price,unit,expiry_date',
    'Paracetamol 500mg tablets,drug,500,100,12.00,25.00,blister,2027-12-31',
    'Gauze pads 10cm,supply,200,40,5.50,12.00,pack,',
  ];
  const csv = `\uFEFF${lines.join('\n')}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminInventory() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState({
    product_name: '',
    category: 'drug',
    current_stock: 0,
    reorder_level: 50,
    cost_price: '',
    selling_price: '',
    expiry_date: '',
  });
  const [usageRange, setUsageRange] = useState({ from: '', to: '' });

  const { data: inv } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => (await api.get('/inventory/')).data,
    refetchInterval: 15000,
  });

  const { data: usage } = useQuery({
    queryKey: ['usage', usageRange.from, usageRange.to],
    enabled: tab === 'usage' && !!usageRange.from && !!usageRange.to,
    queryFn: async () =>
      (await api.get('/inventory/usage-report', { params: usageRange })).data,
  });

  const { data: prescribed } = useQuery({
    queryKey: ['prescribed', usageRange.from, usageRange.to],
    enabled: tab === 'prescribed' && !!usageRange.from && !!usageRange.to,
    queryFn: async () =>
      (await api.get('/inventory/prescribed-report', { params: usageRange })).data,
  });

  const add = useMutation({
    mutationFn: () =>
      api.post('/inventory/', {
        ...form,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        current_stock: Number(form.current_stock),
        reorder_level: Number(form.reorder_level),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const restock = useMutation({
    mutationFn: ({ id, quantity }) => api.post(`/inventory/${id}/restock`, { quantity: Number(quantity) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const bulkImport = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/inventory/bulk-import', fd);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      const d = res.data;
      setBulkErrors(d.errors || []);
      setBulkFeedback(
        `Done: ${d.created ?? 0} product(s) added.${d.failed ? ` ${d.failed} row(s) skipped or failed — see below.` : ''}`
      );
      if (bulkFileRef.current) bulkFileRef.current.value = '';
    },
    onError: (err) => {
      setBulkErrors([]);
      setBulkFeedback(err.response?.data?.message || err.message || 'Upload failed');
    },
  });

  const [qtyById, setQtyById] = useState({});
  const [bulkFeedback, setBulkFeedback] = useState(null);
  const [bulkErrors, setBulkErrors] = useState([]);
  const bulkFileRef = useRef(null);

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">Inventory</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded px-3 py-1 ${tab === 'list' ? 'bg-hospital-800 text-white' : 'bg-slate-200'}`}
          onClick={() => setTab('list')}
        >
          Stock
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1 ${tab === 'usage' ? 'bg-hospital-800 text-white' : 'bg-slate-200'}`}
          onClick={() => setTab('usage')}
        >
          Dispensed (usage)
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1 ${tab === 'prescribed' ? 'bg-hospital-800 text-white' : 'bg-slate-200'}`}
          onClick={() => setTab('prescribed')}
        >
          Prescribed quantities
        </button>
      </div>

      {tab === 'list' && (
        <>
          <form
            className="mb-6 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              add.mutate();
            }}
          >
            <h2 className="col-span-full font-medium text-slate-900">Add product</h2>
            <div>
              <label htmlFor="inv-product-name" className="mb-1 block text-xs font-medium text-slate-600">
                Product name
              </label>
              <input
                id="inv-product-name"
                className="w-full rounded border px-2 py-1"
                value={form.product_name}
                onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="inv-category" className="mb-1 block text-xs font-medium text-slate-600">
                Category
              </label>
              <select
                id="inv-category"
                className="w-full rounded border px-2 py-1"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {['drug', 'supply', 'equipment', 'other'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inv-initial-stock" className="mb-1 block text-xs font-medium text-slate-600">
                Initial stock (units)
              </label>
              <input
                id="inv-initial-stock"
                className="w-full rounded border px-2 py-1"
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => setForm((f) => ({ ...f, current_stock: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="inv-reorder" className="mb-1 block text-xs font-medium text-slate-600">
                Reorder level (alert when at or below)
              </label>
              <input
                id="inv-reorder"
                className="w-full rounded border px-2 py-1"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={(e) => setForm((f) => ({ ...f, reorder_level: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="inv-cost" className="mb-1 block text-xs font-medium text-slate-600">
                Cost price per unit (KES)
              </label>
              <input
                id="inv-cost"
                className="w-full rounded border px-2 py-1"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="inv-sell" className="mb-1 block text-xs font-medium text-slate-600">
                Selling price per unit (KES)
              </label>
              <input
                id="inv-sell"
                className="w-full rounded border px-2 py-1"
                type="number"
                step="0.01"
                min="0"
                value={form.selling_price}
                onChange={(e) => setForm((f) => ({ ...f, selling_price: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="inv-expiry" className="mb-1 block text-xs font-medium text-slate-600">
                Expiry date <span className="font-normal">(optional)</span>
              </label>
              <input
                id="inv-expiry"
                className="w-full rounded border px-2 py-1"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
              />
            </div>
            <div className="col-span-full flex items-end">
              <button type="submit" className="rounded bg-hospital-800 px-4 py-2 text-white">
                Add product
              </button>
            </div>
          </form>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Bulk import (Excel or CSV)</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use the <strong>first sheet only</strong> (for Excel). Row 1 must be the column headers. You can add many
              products in one upload; valid rows are saved even if some rows fail.
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 font-medium text-slate-800">
                  <tr>
                    <th className="p-2">Column</th>
                    <th className="p-2">Required</th>
                    <th className="p-2">Allowed / notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 font-mono">product_name</td>
                    <td className="p-2">Yes</td>
                    <td className="p-2">Also accepted: Product, Item, Name, Drug</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">category</td>
                    <td className="p-2">No</td>
                    <td className="p-2">drug, supply, equipment, other (default: drug)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">current_stock</td>
                    <td className="p-2">No</td>
                    <td className="p-2">Number; aliases: stock, quantity, qty (default: 0)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">reorder_level</td>
                    <td className="p-2">No</td>
                    <td className="p-2">Number; aliases: reorder, min_stock (default: 50)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">cost_price</td>
                    <td className="p-2">Yes</td>
                    <td className="p-2">KES per unit; aliases: cost, unit_cost</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">selling_price</td>
                    <td className="p-2">Yes</td>
                    <td className="p-2">KES per unit; aliases: sell, price, unit_price</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">unit</td>
                    <td className="p-2">No</td>
                    <td className="p-2">e.g. units, blister, pack (default: units)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">expiry_date</td>
                    <td className="p-2">No</td>
                    <td className="p-2">
                      <strong>YYYY-MM-DD</strong> or <strong>DD/MM/YYYY</strong> (or DD-MM-YYYY). Excel date cells are
                      supported. Leave blank if unknown.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                onClick={() => downloadInventoryTemplate()}
              >
                Download CSV template
              </button>
              <label htmlFor="inv-bulk-file" className="sr-only">
                Spreadsheet file to import
              </label>
              <input
                id="inv-bulk-file"
                ref={bulkFileRef}
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="max-w-xs text-sm"
              />
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                disabled={bulkImport.isPending}
                onClick={() => {
                  setBulkFeedback(null);
                  setBulkErrors([]);
                  const f = bulkFileRef.current?.files?.[0];
                  if (!f) {
                    setBulkFeedback('Choose a .csv or .xlsx file first.');
                    return;
                  }
                  bulkImport.mutate(f);
                }}
              >
                {bulkImport.isPending ? 'Uploading…' : 'Upload & import'}
              </button>
            </div>
            {bulkFeedback && (
              <p className={`mt-3 text-sm ${bulkFeedback.startsWith('Done') ? 'text-green-800' : 'text-red-700'}`}>
                {bulkFeedback}
              </p>
            )}
            {bulkErrors.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded border border-amber-200 bg-amber-50/80 p-2 text-xs">
                <p className="font-medium text-amber-900">Row issues (Excel row number)</p>
                <ul className="mt-1 list-inside list-disc text-amber-950">
                  {bulkErrors.slice(0, 50).map((e, idx) => (
                    <li key={`${e.row}-${idx}`}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
                {bulkErrors.length > 50 && <p className="mt-1 text-amber-800">…and {bulkErrors.length - 50} more</p>}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2">Product</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Reorder</th>
                  <th className="p-2">Cost</th>
                  <th className="p-2">Sell</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2">Restock</th>
                </tr>
              </thead>
              <tbody>
                {(inv?.items || []).map((row) => {
                  const critical = row.current_stock < 10;
                  const low = !critical && row.current_stock <= row.reorder_level;
                  return (
                    <tr key={row.id} className={critical ? 'bg-red-50' : low ? 'bg-amber-50' : ''}>
                      <td className="p-2">{row.product_name}</td>
                      <td className={`p-2 font-medium ${critical ? 'text-red-700' : low ? 'text-amber-700' : ''}`}>
                        {row.current_stock}{critical ? ' ⚠' : ''}
                      </td>
                      <td className="p-2">{row.reorder_level}</td>
                      <td className="p-2">{row.cost_price}</td>
                      <td className="p-2">{row.selling_price}</td>
                      <td className="p-2">{row.expiry_date ? formatDdMmYyyy(row.expiry_date) : '—'}</td>
                      <td className="p-2">
                        <label htmlFor={`restock-qty-${row.id}`} className="sr-only">
                          Restock quantity for {row.product_name}
                        </label>
                        <div className="flex flex-wrap items-center gap-1">
                          <input
                            id={`restock-qty-${row.id}`}
                            type="number"
                            min="1"
                            className="w-24 rounded border px-2 py-1 text-sm"
                            aria-label={`Units to add for ${row.product_name}`}
                            value={qtyById[row.id] || ''}
                            onChange={(e) => setQtyById((q) => ({ ...q, [row.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="rounded bg-slate-800 px-2 py-1 text-xs text-white"
                            onClick={() => restock.mutate({ id: row.id, quantity: qtyById[row.id] })}
                          >
                            Add stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'usage' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm text-slate-600">
            Stock removed when the pharmacy dispenses from inventory. For medicines ordered by doctors (including
            before dispense), use the <strong>Prescribed quantities</strong> tab.
          </p>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="usage-from" className="mb-1 block text-sm font-medium text-slate-700">
                From date
              </label>
              <input
                id="usage-from"
                type="date"
                className="rounded border px-2 py-1"
                value={usageRange.from}
                onChange={(e) => setUsageRange((r) => ({ ...r, from: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="usage-to" className="mb-1 block text-sm font-medium text-slate-700">
                To date
              </label>
              <input
                id="usage-to"
                type="date"
                className="rounded border px-2 py-1"
                value={usageRange.to}
                onChange={(e) => setUsageRange((r) => ({ ...r, to: e.target.value }))}
              />
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="p-2">Product</th>
                <th className="p-2">Qty dispensed</th>
                <th className="p-2">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {(usage?.report || []).map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.product_name}</td>
                  <td className="p-2">{r.qty_dispensed}</td>
                  <td className="p-2">{Number(r.est_cost_value || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'prescribed' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm text-slate-600">
            Totals from prescription lines created in the date range (when the doctor sends the patient to pharmacy).
            Drug names are free text; align names with inventory products for easier comparison with dispensed usage.
          </p>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="rx-from" className="mb-1 block text-sm font-medium text-slate-700">
                From date
              </label>
              <input
                id="rx-from"
                type="date"
                className="rounded border px-2 py-1"
                value={usageRange.from}
                onChange={(e) => setUsageRange((r) => ({ ...r, from: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="rx-to" className="mb-1 block text-sm font-medium text-slate-700">
                To date
              </label>
              <input
                id="rx-to"
                type="date"
                className="rounded border px-2 py-1"
                value={usageRange.to}
                onChange={(e) => setUsageRange((r) => ({ ...r, to: e.target.value }))}
              />
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="p-2">Drug name (as prescribed)</th>
                <th className="p-2">Qty prescribed</th>
              </tr>
            </thead>
            <tbody>
              {(prescribed?.report || []).map((r) => (
                <tr key={r.drug_name} className="border-t">
                  <td className="p-2">{r.drug_name}</td>
                  <td className="p-2">{r.qty_prescribed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
