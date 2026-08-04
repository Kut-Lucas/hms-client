import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import AppLayout from '../../components/AppLayout.jsx';
import ListNumber from '../../components/ListNumber.jsx';
import SimpleModal from '../../components/SimpleModal.jsx';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';
import { downloadPharmacyReceipt } from '../../utils/receiptDownload.js';

function DownloadPdfButton({ label, onDownload }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <button
        type="button"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-hospital-700 bg-white px-3 py-1.5 text-sm font-medium text-hospital-900 hover:bg-hospital-50 disabled:opacity-50"
        onClick={async () => {
          setErr(''); setLoading(true);
          try { await onDownload(); }
          catch { setErr('Could not generate PDF. Try again.'); }
          finally { setLoading(false); }
        }}
      >
        {loading ? '⏳ Generating…' : label}
      </button>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function PharmacyDashboard() {
  const qc = useQueryClient();
  const [sel, setSel] = useState(null);
  const [alloc, setAlloc] = useState({});
  const [payment_method, setPaymentMethod] = useState('cash');
  const [msg, setMsg] = useState('');
  const [lastDispensedRxId, setLastDispensedRxId] = useState(null);
  const [historyPaymentId, setHistoryPaymentId] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfErr, setPdfErr] = useState('');

  const { data: queue } = useQuery({
    queryKey: ['pharmacy-queue'],
    queryFn: async () => (await api.get('/pharmacy/queue')).data,
    refetchInterval: 15000,
  });

  const { data: completedToday } = useQuery({
    queryKey: ['pharmacy-completed-today'],
    queryFn: async () => (await api.get('/pharmacy/completed-today')).data,
    refetchInterval: 30000,
  });

  const { data: saleDetail } = useQuery({
    queryKey: ['pharmacy-my-sale', historyPaymentId],
    enabled: historyPaymentId != null,
    queryFn: async () => (await api.get(`/pharmacy/my-sale/${historyPaymentId}`)).data,
  });

  const { data: inv } = useQuery({
    queryKey: ['pharmacy-inv'],
    queryFn: async () => (await api.get('/pharmacy/inventory')).data,
    refetchInterval: 30000,
  });

  const { data: low } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => (await api.get('/inventory/low-stock')).data,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!sel) return;
    const next = {};
    for (const it of sel.items || []) {
      const match = (inv?.inventory || []).find(
        (row) => row.product_name.toLowerCase() === String(it.drug_name).toLowerCase()
      );
      next[it.id] = match?.id || '';
    }
    setAlloc(next);
  }, [sel, inv]);

  const dispense = useMutation({
    mutationFn: () => {
      const allocations = (sel.items || []).map((it) => ({
        prescription_item_id: it.id,
        inventory_id: Number(alloc[it.id]),
      }));
      return api.post('/pharmacy/dispense', {
        prescription_id: sel.id,
        payment_method,
        allocations,
      });
    },
    onSuccess: (res) => {
      const d = res.data;
      setMsg(`Total KES ${d?.total} — dispensed successfully`);
      setLastDispensedRxId(sel?.id || null);
      qc.invalidateQueries({ queryKey: ['pharmacy-queue'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inv'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-completed-today'] });
      setSel(null);
    },
    onError: () => setMsg(''),
  });

  return (
    <AppLayout title="Pharmacy">
      {(low?.items || []).length > 0 && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm">
          <p className="mb-1 font-semibold text-red-800">⚠ Low stock — restock urgently:</p>
          <ul className="flex flex-wrap gap-2">
            {(low?.items || []).map((i) => (
              <li key={i.id} className={`rounded px-2 py-0.5 text-xs font-medium ${i.current_stock < 10 ? 'bg-red-200 text-red-900' : 'bg-amber-100 text-amber-900'}`}>
                {i.product_name} ({i.current_stock} left)
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 font-medium">Prescriptions</h2>
          <ul className="space-y-2">
            {(queue?.queue || []).map((p, idx) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`flex w-full items-start rounded-lg border px-3 py-2 text-left ${sel?.id === p.id ? 'border-hospital-800 bg-hospital-50' : 'bg-white'}`}
                  onClick={() => {
                    setSel(p);
                    setMsg('');
                  }}
                >
                  <ListNumber n={idx + 1} />
                  <span>
                    <span className="font-medium">Rx #{p.id}</span>
                    <span className="block text-xs">{p.patient_name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Dispensed today</h3>
            <p className="mb-3 text-xs text-slate-500">Pharmacy payments you recorded today.</p>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {(completedToday?.items || []).length === 0 && (
                <li className="text-slate-500">No pharmacy sales by you today yet.</li>
              )}
              {(completedToday?.items || []).map((row, idx) => (
                <li key={row.ref_id}>
                  <button
                    type="button"
                    className="flex w-full items-start rounded-lg border border-slate-100 bg-white px-3 py-2 text-left hover:border-hospital-300 hover:bg-hospital-50/40"
                    onClick={() => setHistoryPaymentId(row.ref_id)}
                  >
                    <ListNumber n={idx + 1} />
                    <span className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">{row.patient_name}</span>
                    <span className="block text-xs text-slate-500">
                      {row.unique_id}
                    </span>
                    <span className="mt-1 inline-block rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                      Dispensed
                    </span>
                    <span className="mt-1 block text-xs text-slate-600">KES {Number(row.amount || 0).toFixed(2)}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {row.recorded_at ? formatDdMmYyyyAtTime(row.recorded_at) : ''}
                    </span>
                    <span className="mt-1 block text-xs text-hospital-800">View sale details →</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-2">
          {sel ? (
            <>
              <p className="text-sm">Patient: <strong>{sel.patient_name}</strong></p>
              <p className="text-sm">Doctor: {sel.doctor_name}</p>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">Prescribed drug</th>
                    <th className="p-2">Quantity</th>
                    <th className="p-2">Match to stock (inventory)</th>
                  </tr>
                </thead>
                <tbody>
                  {(sel.items || []).map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="p-2 align-top">
                        <span className="text-xs font-medium text-slate-500 sm:hidden">Drug</span>
                        <div className="font-medium text-slate-900">{it.drug_name}</div>
                      </td>
                      <td className="p-2 align-top">
                        <span className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">Qty</span>
                        {it.quantity}
                      </td>
                      <td className="p-2 align-top">
                        <label htmlFor={`pharm-inv-${it.id}`} className="mb-1 block text-xs font-medium text-slate-700">
                          Stock item to dispense from
                        </label>
                        <select
                          id={`pharm-inv-${it.id}`}
                          className="w-full rounded-lg border border-slate-300 px-2 py-2 text-base"
                          value={alloc[it.id] ?? ''}
                          onChange={(e) => setAlloc((a) => ({ ...a, [it.id]: e.target.value }))}
                        >
                          <option value="">Select inventory product…</option>
                          {(inv?.inventory || []).map((row) => (
                            <option key={row.id} value={row.id}>
                              {row.product_name} (stock {row.current_stock})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <label htmlFor="pharm-payment-method" className="mt-4 block text-sm font-medium text-slate-700">
                Payment method for this sale
              </label>
              <select
                id="pharm-payment-method"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
                value={payment_method}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                  {['cash', 'card', 'mpesa', 'insurance', 'other'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="mt-4 rounded bg-hospital-800 px-4 py-2 text-white"
                onClick={() => dispense.mutate()}
              >
                Dispense &amp; sign out visit
              </button>
              {dispense.isError && (
                <p className="mt-2 text-sm text-red-600">{dispense.error?.response?.data?.message}</p>
              )}
            </>
          ) : (
            <p className="text-slate-500">Select a prescription.</p>
          )}
        </div>
      </div>

      {historyPaymentId != null && (
        <SimpleModal title="Dispensing record" onClose={() => setHistoryPaymentId(null)}>
          {saleDetail?.payment ? (
            <div className="space-y-3">
              <p>
                <span className="text-slate-500">Patient:</span> <strong>{saleDetail.payment.patient_name}</strong> · {saleDetail.payment.unique_id}
              </p>
              <p>
                <span className="text-slate-500">Sale time:</span>{' '}
                {saleDetail.payment.created_at ? formatDdMmYyyyAtTime(saleDetail.payment.created_at) : '—'}
              </p>
              <p>
                <span className="text-slate-500">Amount:</span> <strong>KES {Number(saleDetail.payment.amount || 0).toFixed(2)}</strong>
              </p>
              <p>
                <span className="text-slate-500">Payment method:</span> {saleDetail.payment.payment_method}
              </p>
              {saleDetail.prescription?.diagnosis && (
                <div className="rounded bg-slate-50 p-2 text-sm">
                  <span className="font-medium text-slate-600">Diagnosis: </span>
                  {saleDetail.prescription.diagnosis}
                </div>
              )}
              {saleDetail.items?.length ? (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Drugs dispensed</p>
                  <table className="mt-1 w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="p-1">Drug</th>
                        <th className="p-1">Qty</th>
                        <th className="p-1">Dosage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleDetail.items.map((it) => (
                        <tr key={it.id} className="border-t border-slate-100">
                          <td className="p-1">{it.drug_name}</td>
                          <td className="p-1">{it.quantity}</td>
                          <td className="p-1 text-slate-500">{it.dosage || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No linked prescription lines found.</p>
              )}
              {saleDetail.prescription?.id && (
                <DownloadPdfButton
                  label="🖨 Download dispensing receipt (PDF)"
                  onDownload={() => downloadPharmacyReceipt(saleDetail.prescription.id)}
                />
              )}
            </div>
          ) : (
            <p className="text-slate-500">Loading…</p>
          )}
        </SimpleModal>
      )}

      {msg && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">✔ {msg}</p>
          {lastDispensedRxId && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pdfLoading}
                className="flex items-center gap-1.5 rounded-lg border border-hospital-700 bg-white px-3 py-1.5 text-sm font-medium text-hospital-900 hover:bg-hospital-50 disabled:opacity-50"
                onClick={async () => {
                  setPdfErr(''); setPdfLoading(true);
                  try { await downloadPharmacyReceipt(lastDispensedRxId); }
                  catch { setPdfErr('Could not generate receipt PDF'); }
                  finally { setPdfLoading(false); }
                }}
              >
                🖨 {pdfLoading ? 'Generating…' : 'Download dispensing receipt (PDF)'}
              </button>
            </div>
          )}
          {pdfErr && <p className="mt-1 text-xs text-red-600">{pdfErr}</p>}
        </div>
      )}
    </AppLayout>
  );
}
