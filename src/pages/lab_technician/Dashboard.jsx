import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client.js';
import AppLayout from '../../components/AppLayout.jsx';
import ListNumber from '../../components/ListNumber.jsx';
import SimpleModal from '../../components/SimpleModal.jsx';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';
import { downloadLabReport } from '../../utils/receiptDownload.js';

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

function parseTests(selectedTests) {
  if (!selectedTests) return [];
  if (typeof selectedTests === 'string') {
    try { return JSON.parse(selectedTests); } catch { return []; }
  }
  return Array.isArray(selectedTests) ? selectedTests : [];
}

function calcFeeFromTests(tests) {
  return tests.reduce((sum, t) => sum + Number(t.price || 0), 0);
}

export default function LabDashboard() {
  const qc = useQueryClient();
  const [sel, setSel] = useState(null);
  const [results, setResults] = useState('');
  const [lab_fee, setLabFee] = useState('');
  const [payment_method, setPaymentMethod] = useState('cash');
  const [historyResultId, setHistoryResultId] = useState(null);
  const [lastResultId, setLastResultId] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Dressing charge state
  const [dressingFee, setDressingFee] = useState('');
  const [dressingPayMethod, setDressingPayMethod] = useState('cash');

  const { data } = useQuery({
    queryKey: ['lab-queue'],
    queryFn: async () => (await api.get('/lab/queue')).data,
    refetchInterval: 15000,
  });

  const { data: completedToday } = useQuery({
    queryKey: ['lab-completed-today'],
    queryFn: async () => (await api.get('/lab/completed-today')).data,
    refetchInterval: 30000,
  });

  const { data: resultDetail } = useQuery({
    queryKey: ['lab-my-result', historyResultId],
    enabled: historyResultId != null,
    queryFn: async () => (await api.get(`/lab/my-result/${historyResultId}`)).data,
  });

  const start = useMutation({
    mutationFn: (id) => api.patch(`/lab/orders/${id}/start`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-queue'] }),
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post('/lab/results', {
        lab_order_id: sel.id,
        results,
        lab_fee: lab_fee === '' ? 0 : Number(lab_fee),
        payment_method,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lab-queue'] });
      qc.invalidateQueries({ queryKey: ['lab-completed-today'] });
      setLastResultId(res.data?.result_id || null);
      setSubmitSuccess(true);
      setSel(null); setResults(''); setLabFee('');
    },
  });

  const dressingCharge = useMutation({
    mutationFn: () =>
      api.post('/lab/dressing-charge', {
        visit_id: sel.visit_id,
        lab_fee: dressingFee === '' ? 0 : Number(dressingFee),
        payment_method: dressingPayMethod,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-queue'] });
      qc.invalidateQueries({ queryKey: ['lab-completed-today'] });
      setSel(null); setDressingFee(''); setDressingPayMethod('cash');
    },
  });

  const field = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-hospital-600';
  const lbl = 'mb-1 block text-sm font-medium text-slate-700';

  function selectOrder(o) {
    setSel(o);
    if (!o.is_dressing) {
      const tests = parseTests(o.selected_tests);
      const autoFee = calcFeeFromTests(tests);
      setLabFee(autoFee > 0 ? String(autoFee) : (o.lab_fee ? String(o.lab_fee) : ''));
    }
  }

  return (
    <AppLayout title="Laboratory">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 font-medium">Orders</h2>
          <ul className="space-y-2">
            {(data?.queue || []).map((o, idx) => (
              <li key={`${o.is_dressing ? 'dress' : 'order'}-${o.id}`}>
                <button
                  type="button"
                  className={`flex w-full items-start rounded-lg border px-3 py-2 text-left ${sel?.id === o.id && sel?.is_dressing === o.is_dressing ? 'border-hospital-800 bg-hospital-50' : 'bg-white'}`}
                  onClick={() => selectOrder(o)}
                >
                  <ListNumber n={idx + 1} />
                  <span>
                    {o.is_dressing ? (
                      <>
                        <span className="font-medium text-teal-700">Dressing</span>
                        <span className="ml-1 rounded bg-teal-100 px-1.5 py-0.5 text-xs text-teal-800">Direct</span>
                      </>
                    ) : (
                      <span className="font-medium">Order #{o.id}</span>
                    )}
                    <span className="block text-xs text-slate-500">{o.patient_name}</span>
                    <span className="block text-xs text-slate-400">{o.is_dressing ? 'Dressing visit' : o.status}</span>
                  </span>
                </button>
              </li>
            ))}
            {(data?.queue || []).length === 0 && (
              <li className="text-sm text-slate-500">No orders in queue.</li>
            )}
          </ul>
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Completed today</h3>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {(completedToday?.items || []).length === 0 && (
                <li className="text-slate-500">No results submitted by you today yet.</li>
              )}
              {(completedToday?.items || []).map((row, idx) => (
                <li key={row.ref_id}>
                  <button
                    type="button"
                    className="flex w-full items-start rounded-lg border border-slate-100 bg-white px-3 py-2 text-left hover:bg-hospital-50/40"
                    onClick={() => setHistoryResultId(row.ref_id)}
                  >
                    <ListNumber n={idx + 1} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900">{row.patient_name}</span>
                      <span className="block text-xs text-slate-500">{row.unique_id} · Order #{row.lab_order_id}</span>
                      <span className="mt-1 inline-block rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">Submitted</span>
                      <span className="mt-1 block text-xs text-slate-500">{row.recorded_at ? formatDdMmYyyyAtTime(row.recorded_at) : ''}</span>
                      <span className="mt-1 block text-xs text-hospital-800">View results →</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-2">
          {sel ? (
            sel.is_dressing ? (
              /* ── Dressing charge form ── */
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-teal-800">Dressing visit</h3>
                  <p className="text-sm text-slate-600">Patient: <strong>{sel.patient_name}</strong></p>
                  <p className="text-xs text-slate-500">This patient came directly for dressing — no lab order.</p>
                </div>
                <div>
                  <label className={lbl}>Dressing fee (KES)</label>
                  <input type="number" min="0" step="0.01" className={field}
                    value={dressingFee} onChange={(e) => setDressingFee(e.target.value)} placeholder="Enter amount charged" />
                </div>
                <div>
                  <label className={lbl}>Payment method</label>
                  <select className={field} value={dressingPayMethod} onChange={(e) => setDressingPayMethod(e.target.value)}>
                    {['cash','card','mpesa','insurance','other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button type="button" disabled={dressingCharge.isPending}
                  className="rounded-lg bg-teal-700 px-5 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                  onClick={() => dressingCharge.mutate()}>
                  {dressingCharge.isPending ? 'Processing…' : 'Charge & complete visit'}
                </button>
                {dressingCharge.isError && (
                  <p className="text-sm text-red-600">{dressingCharge.error?.response?.data?.message}</p>
                )}
              </div>
            ) : (
              /* ── Regular lab order form ── */
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Doctor: <strong>{sel.doctor_name}</strong></p>
                  <p className="text-sm text-slate-600">Patient: <strong>{sel.patient_name}</strong></p>
                </div>

                {/* Prescribed tests */}
                {parseTests(sel.selected_tests).length > 0 && (
                  <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-sky-900">Tests ordered by doctor</p>
                    <ul className="space-y-1 text-sm">
                      {parseTests(sel.selected_tests).map((t, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="text-slate-800">{t.name}</span>
                          <span className="font-medium text-sky-800">KES {Number(t.price || 0).toFixed(0)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 border-t border-sky-200 pt-2 text-sm font-semibold text-sky-900">
                      Total: KES {calcFeeFromTests(parseTests(sel.selected_tests)).toFixed(0)}
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                  <p className="mb-1 text-xs font-medium uppercase text-slate-500">Doctor instructions</p>
                  {sel.instructions}
                </div>

                <div>
                  <label className={lbl}>Lab fee to charge patient (KES)</label>
                  <input type="number" step="0.01" min="0" className={field}
                    value={lab_fee} onChange={(e) => setLabFee(e.target.value)} placeholder="Auto-filled from test prices" />
                  <p className="mt-1 text-xs text-slate-500">Pre-filled from the test prices. Adjust if needed.</p>
                </div>

                <button type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => start.mutate(sel.id)}>
                  Mark order in progress
                </button>

                <div>
                  <label className={lbl}>Test results</label>
                  <textarea className={`${field} font-mono text-sm`} rows={8}
                    value={results} onChange={(e) => setResults(e.target.value)}
                    placeholder="Enter results for each test…" />
                </div>

                <div>
                  <label className={lbl}>Payment method <span className="font-normal text-slate-500">(when lab fee &gt; 0)</span></label>
                  <select className={field} value={payment_method} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {['cash','card','mpesa','insurance','other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <button type="button" disabled={submit.isPending || !results.trim()}
                  className="rounded-lg bg-hospital-800 px-5 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:opacity-40"
                  onClick={() => submit.mutate()}>
                  {submit.isPending ? 'Submitting…' : 'Submit results → send to doctor'}
                </button>
                {submit.isError && <p className="mt-2 text-sm text-red-600">{submit.error?.response?.data?.message}</p>}
              </div>
            )
          ) : (
            <p className="text-slate-500">Select an order from the queue.</p>
          )}
        </div>
      </div>

      {/* Success banner with download after submitting results */}
      {submitSuccess && lastResultId && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">✔ Results submitted successfully.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DownloadPdfButton
              label="🖨 Download lab report (PDF for patient)"
              onDownload={() => downloadLabReport(lastResultId)}
            />
          </div>
          <button type="button" className="mt-2 text-xs text-slate-400 hover:text-slate-600"
            onClick={() => setSubmitSuccess(false)}>
            Dismiss
          </button>
        </div>
      )}

      {historyResultId != null && (
        <SimpleModal title="Results you submitted" onClose={() => setHistoryResultId(null)}>
          {resultDetail?.result ? (
            <div className="space-y-2">
              <p><span className="text-slate-500">Patient:</span> {resultDetail.result.patient_name} · {resultDetail.result.unique_id}</p>
              <p><span className="text-slate-500">Submitted:</span> {resultDetail.result.submitted_at ? formatDdMmYyyyAtTime(resultDetail.result.submitted_at) : '—'}</p>
              <p><span className="text-slate-500">Lab fee charged:</span> KES {resultDetail.result.lab_fee}</p>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Doctor instructions</p>
                <p className="mt-1 text-slate-800">{resultDetail.result.instructions}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Your result text</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-900">{resultDetail.result.results}</p>
              </div>
              <DownloadPdfButton
                label="🖨 Download lab report (PDF for patient)"
                onDownload={() => downloadLabReport(historyResultId)}
              />
            </div>
          ) : (
            <p className="text-slate-500">Loading…</p>
          )}
        </SimpleModal>
      )}
    </AppLayout>
  );
}
