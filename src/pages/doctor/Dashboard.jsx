import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api/client.js';
import AppLayout from '../../components/AppLayout.jsx';
import DrugAutocomplete from '../../components/DrugAutocomplete.jsx';
import LabTestPicker from '../../components/LabTestPicker.jsx';
import ListNumber from '../../components/ListNumber.jsx';
import SimpleModal from '../../components/SimpleModal.jsx';
import { ageInYears } from '../../utils/age.js';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';

function QueueList({ items, sel, onSelect, startNum = 1 }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">None waiting.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((v, idx) => (
        <li key={v.id}>
          <button
            type="button"
            className={`flex w-full items-start rounded-lg border px-3 py-2 text-left ${sel?.id === v.id ? 'border-hospital-800 bg-hospital-50' : 'bg-white'}`}
            onClick={() => onSelect(v)}
          >
            <ListNumber n={startNum + idx} />
            <span>
              <span className="font-medium">{v.full_name}</span>
              <span className="block text-xs text-slate-500">{v.unique_id}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ items, onOpen }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">No entries yet today.</p>;
  }
  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
      {items.map((row, idx) => (
        <li key={`${row.outcome}-${row.ref_id}`}>
          <button
            type="button"
            className="flex w-full items-start rounded-lg border border-slate-100 bg-white px-3 py-2 text-left hover:border-hospital-300 hover:bg-hospital-50/40"
            onClick={() =>
              onOpen({
                kind: row.outcome === 'sent_to_lab' ? 'lab' : 'rx',
                id: row.ref_id,
              })
            }
          >
            <ListNumber n={idx + 1} />
            <span className="min-w-0 flex-1">
              <span className="font-medium text-slate-900">{row.patient_name}</span>
              <span className="block text-xs text-slate-500">
                {row.unique_id}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {row.recorded_at ? formatDdMmYyyyAtTime(row.recorded_at) : ''}
              </span>
              <span className="mt-1 block text-xs text-hospital-800">View what you entered →</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function DoctorDashboard() {
  const qc = useQueryClient();
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [staffHistory, setStaffHistory] = useState(null);
  const [lab, setLab] = useState({ selectedTests: [], extraInstructions: '' });
  const [rx, setRx] = useState({ diagnosis: '', notes: '', items: [{ drug_name: '', dosage: '', frequency: '', duration_days: '', quantity: 1 }] });

  const { data: queue } = useQuery({
    queryKey: ['doctor-queue'],
    queryFn: async () => (await api.get('/doctor/queue')).data,
    refetchInterval: 15000,
  });

  const { data: handledToday } = useQuery({
    queryKey: ['doctor-handled-today'],
    queryFn: async () => (await api.get('/doctor/handled-today')).data,
    refetchInterval: 30000,
  });

  const { data: myLabOrder } = useQuery({
    queryKey: ['doctor-my-lab', staffHistory?.id],
    enabled: staffHistory?.kind === 'lab' && !!staffHistory?.id,
    queryFn: async () => (await api.get(`/doctor/my-lab-order/${staffHistory.id}`)).data,
  });

  const { data: myPrescription } = useQuery({
    queryKey: ['doctor-my-rx', staffHistory?.id],
    enabled: staffHistory?.kind === 'rx' && !!staffHistory?.id,
    queryFn: async () => (await api.get(`/doctor/my-prescription/${staffHistory.id}`)).data,
  });

  const { data: vitalsTrend } = useQuery({
    queryKey: ['vitals', detail?.visit?.patient_id],
    enabled: !!detail?.visit?.patient_id,
    queryFn: async () => (await api.get(`/patients/${detail.visit.patient_id}/vitals`)).data,
  });

  const loadVisit = async (v) => {
    setSel(v);
    const { data } = await api.get(`/visits/${v.id}`);
    setDetail(data);
  };

  const labMut = useMutation({
    mutationFn: () =>
      api.post('/doctor/lab-order', {
        visit_id: sel.id,
        selected_tests: lab.selectedTests,
        instructions: lab.extraInstructions,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-queue'] });
      qc.invalidateQueries({ queryKey: ['doctor-handled-today'] });
      setSel(null);
      setDetail(null);
      setLab({ selectedTests: [], extraInstructions: '' });
    },
  });

  const rxMut = useMutation({
    mutationFn: () =>
      api.post('/doctor/prescription', {
        visit_id: sel.id,
        diagnosis: rx.diagnosis,
        notes: rx.notes,
        items: rx.items.map((i) => ({
          drug_name: i.drug_name,
          dosage: i.dosage || null,
          frequency: i.frequency || null,
          duration_days: i.duration_days ? Number(i.duration_days) : null,
          quantity: Number(i.quantity),
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-queue'] });
      qc.invalidateQueries({ queryKey: ['doctor-handled-today'] });
      setSel(null);
      setDetail(null);
      setRx({ diagnosis: '', notes: '', items: [{ drug_name: '', dosage: '', frequency: '', duration_days: '', quantity: 1 }] });
    },
  });

  const chartData = (vitalsTrend?.vitals || []).map((r, idx) => ({
    n: idx + 1,
    weight: r.weight_kg != null ? Number(r.weight_kg) : null,
    sbp: r.bp_systolic,
  }));

  const patientAge =
    detail?.visit?.date_of_birth != null ? ageInYears(detail.visit.date_of_birth) : null;

  return (
    <AppLayout title="Doctor">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 font-medium">Queue</h2>
          <section className="mb-6">
            <h3 className="mb-1 text-sm font-semibold text-slate-800">Awaiting consultation</h3>
            <p className="mb-2 text-xs text-slate-500">From triage — not yet sent to lab.</p>
            <QueueList
              items={queue?.awaiting_consultation}
              sel={sel}
              onSelect={loadVisit}
              startNum={1}
            />
          </section>
          <section className="mb-6">
            <h3 className="mb-1 text-sm font-semibold text-amber-900">Returned from laboratory</h3>
            <p className="mb-2 text-xs text-slate-500">Lab results ready — review and prescribe.</p>
            <QueueList
              items={queue?.returned_from_lab}
              sel={sel}
              onSelect={loadVisit}
              startNum={(queue?.awaiting_consultation?.length || 0) + 1}
            />
          </section>
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Sent to lab today</h3>
            <ActivityList items={handledToday?.sent_to_lab} onOpen={setStaffHistory} />
          </section>
          <section className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="mb-2 text-sm font-semibold text-emerald-900">Sent to pharmacy today</h3>
            <ActivityList items={handledToday?.sent_to_pharmacy} onOpen={setStaffHistory} />
          </section>
        </div>
        <div className="space-y-4 lg:col-span-2">
          {detail && (
            <>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="font-medium">Patient</h3>
                <p className="text-sm">
                  {detail.visit.full_name} · {detail.visit.unique_id}
                  {patientAge != null ? (
                    <>
                      {' '}
                      · Age {patientAge} years
                    </>
                  ) : null}
                </p>
                <h4 className="mt-3 text-sm font-medium text-slate-600">Current vitals</h4>
                {(detail.vitals || []).slice(-1).map((vi) => {
                  const tempHigh = vi.temperature_c && Number(vi.temperature_c) >= 38.5;
                  const spo2Low = vi.spo2 && Number(vi.spo2) < 94;
                  const bmiVal = vi.weight_kg && vi.height_cm
                    ? (Number(vi.weight_kg) / ((Number(vi.height_cm) / 100) ** 2)).toFixed(1)
                    : null;
                  return (
                    <div key={vi.id} className="mt-1 flex flex-wrap gap-2 text-sm">
                      <span className="rounded bg-slate-100 px-2 py-0.5">W {vi.weight_kg ?? '—'} kg</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5">H {vi.height_cm ?? '—'} cm</span>
                      {bmiVal && <span className="rounded bg-slate-100 px-2 py-0.5">BMI {bmiVal}</span>}
                      <span className="rounded bg-slate-100 px-2 py-0.5">BP {vi.bp_systolic ?? '—'}/{vi.bp_diastolic ?? '—'}</span>
                      <span className={`rounded px-2 py-0.5 font-medium ${tempHigh ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                        T {vi.temperature_c ?? '—'}°C{tempHigh ? ' ⚠' : ''}
                      </span>
                      <span className={`rounded px-2 py-0.5 font-medium ${spo2Low ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                        SpO₂ {vi.spo2 ?? '—'}%{spo2Low ? ' ⚠' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-48 rounded-xl border bg-white p-2 shadow-sm">
                <p className="px-2 text-xs text-slate-500">Weight & systolic BP trend (all visits)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="n" />
                    <YAxis yAxisId="left" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#0284c7" name="Weight kg" dot />
                    <Line yAxisId="left" type="monotone" dataKey="sbp" stroke="#b45309" name="SBP" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h4 className="font-medium">Lab results (this visit)</h4>
                {(detail.lab_orders || []).map((lo) => (
                  <p key={lo.id} className="text-sm text-slate-700">
                    {lo.latest_result ? lo.latest_result.slice(0, 200) : '—'}
                  </p>
                ))}
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h4 className="font-medium text-slate-900">Send to lab</h4>
                <p className="mt-1 mb-3 text-xs text-slate-500">
                  Select the tests to be performed. Estimated fees are calculated from the hospital price list.
                </p>
                <LabTestPicker
                  selected={lab.selectedTests}
                  onChange={(tests) => setLab((l) => ({ ...l, selectedTests: tests }))}
                />
                <div className="mt-3">
                  <label htmlFor="doc-lab-extra" className="mb-1 block text-sm font-medium text-slate-700">
                    Additional instructions <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="doc-lab-extra"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
                    rows={2}
                    placeholder="e.g. urgent, fasting sample…"
                    value={lab.extraInstructions}
                    onChange={(e) => setLab((l) => ({ ...l, extraInstructions: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  disabled={lab.selectedTests.length === 0 && !lab.extraInstructions.trim()}
                  className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-40"
                  onClick={() => labMut.mutate()}
                >
                  Send to lab
                </button>
                {labMut.isError && <p className="mt-2 text-sm text-red-600">{labMut.error?.response?.data?.message}</p>}
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h4 className="font-medium text-slate-900">Prescription (send to pharmacy)</h4>
                <div className="mt-2 mb-3">
                  <label htmlFor="doc-rx-diagnosis" className="mb-1 block text-sm font-medium text-slate-700">
                    Diagnosis / Clinical notes <span className="font-normal text-slate-500">(required for record)</span>
                  </label>
                  <textarea
                    id="doc-rx-diagnosis"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-hospital-600"
                    rows={3}
                    placeholder="Enter diagnosis, clinical findings, or explanation…"
                    value={rx.diagnosis}
                    onChange={(e) => setRx((r) => ({ ...r, diagnosis: e.target.value }))}
                  />
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  Start typing to search drugs in stock. Only drugs in the inventory can be prescribed.
                </p>
                {rx.items.map((it, idx) => (
                  <div key={idx} className="mb-3 rounded-lg border border-slate-100 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`doc-rx-drug-${idx}`} className="mb-1 block text-sm font-medium text-slate-700">
                          Drug name
                        </label>
                        <DrugAutocomplete
                          id={`doc-rx-drug-${idx}`}
                          value={it.drug_name}
                          onChange={(name, drugObj) => {
                            const copy = [...rx.items];
                            copy[idx] = { ...copy[idx], drug_name: name, _confirmed: !!drugObj };
                            setRx((r) => ({ ...r, items: copy }));
                          }}
                        />
                        {it.drug_name && !it._confirmed && (
                          <p className="mt-1 text-xs text-amber-700">⚠ Select a drug from the dropdown</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`doc-rx-qty-${idx}`} className="mb-1 block text-sm font-medium text-slate-700">
                          Quantity
                        </label>
                        <input
                          id={`doc-rx-qty-${idx}`}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => {
                            const copy = [...rx.items];
                            copy[idx] = { ...copy[idx], quantity: e.target.value };
                            setRx((r) => ({ ...r, items: copy }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Dosage</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="e.g. 500mg"
                          value={it.dosage || ''}
                          onChange={(e) => {
                            const copy = [...rx.items];
                            copy[idx] = { ...copy[idx], dosage: e.target.value };
                            setRx((r) => ({ ...r, items: copy }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Frequency</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="e.g. TDS"
                          value={it.frequency || ''}
                          onChange={(e) => {
                            const copy = [...rx.items];
                            copy[idx] = { ...copy[idx], frequency: e.target.value };
                            setRx((r) => ({ ...r, items: copy }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Duration (days)</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          type="number"
                          min="1"
                          placeholder="e.g. 5"
                          value={it.duration_days || ''}
                          onChange={(e) => {
                            const copy = [...rx.items];
                            copy[idx] = { ...copy[idx], duration_days: e.target.value };
                            setRx((r) => ({ ...r, items: copy }));
                          }}
                        />
                      </div>
                    </div>
                    {rx.items.length > 1 && (
                      <button
                        type="button"
                        className="mt-2 text-xs text-red-500 hover:underline"
                        onClick={() => setRx((r) => ({ ...r, items: r.items.filter((_, i) => i !== idx) }))}
                      >
                        Remove this line
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-hospital-800 underline"
                  onClick={() => setRx((r) => ({ ...r, items: [...r.items, { drug_name: '', dosage: '', frequency: '', duration_days: '', quantity: 1, _confirmed: false }] }))}
                >
                  + Add another drug line
                </button>
                <div className="mt-3">
                  <label htmlFor="doc-rx-notes" className="mb-1 block text-sm font-medium text-slate-700">
                    Prescription notes <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="doc-rx-notes"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
                    rows={3}
                    value={rx.notes}
                    onChange={(e) => setRx((r) => ({ ...r, notes: e.target.value }))}
                  />
                </div>
                {rx.items.some((it) => it.drug_name && !it._confirmed) && (
                  <p className="mt-2 text-sm text-amber-700">
                    ⚠ Please select each drug from the autocomplete dropdown before submitting.
                  </p>
                )}
                <button
                  type="button"
                  disabled={rx.items.some((it) => it.drug_name && !it._confirmed) || rx.items.every((it) => !it.drug_name)}
                  className="mt-3 rounded-lg bg-hospital-800 px-4 py-2 text-sm font-medium text-white hover:bg-hospital-900 disabled:opacity-40"
                  onClick={() => rxMut.mutate()}
                >
                  Send to pharmacy
                </button>
                {rxMut.isError && <p className="mt-2 text-sm text-red-600">{rxMut.error?.response?.data?.message}</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {staffHistory && (
        <SimpleModal
          title={staffHistory.kind === 'lab' ? 'Lab order you placed' : 'Prescription you wrote'}
          onClose={() => setStaffHistory(null)}
        >
          {staffHistory.kind === 'lab' && (
            <>
              {myLabOrder?.order ? (
                <div className="space-y-2">
                  <p>
                    <span className="text-slate-500">Patient:</span> {myLabOrder.order.patient_name} ·{' '}
                    {myLabOrder.order.unique_id}
                  </p>
                  <p>
                    <span className="text-slate-500">Ordered:</span>{' '}
                    {myLabOrder.order.created_at ? formatDdMmYyyyAtTime(myLabOrder.order.created_at) : '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Status:</span> {myLabOrder.order.status}
                  </p>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">Instructions</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">{myLabOrder.order.instructions}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Loading…</p>
              )}
            </>
          )}
          {staffHistory.kind === 'rx' && (
            <>
              {myPrescription?.prescription ? (
                <div className="space-y-2">
                  <p>
                    <span className="text-slate-500">Patient:</span> {myPrescription.prescription.patient_name} ·{' '}
                    {myPrescription.prescription.unique_id}
                  </p>
                  <p>
                    <span className="text-slate-500">Written:</span>{' '}
                    {myPrescription.prescription.created_at
                      ? formatDdMmYyyyAtTime(myPrescription.prescription.created_at)
                      : '—'}
                  </p>
                  {myPrescription.prescription.notes ? (
                    <p>
                      <span className="text-slate-500">Notes:</span> {myPrescription.prescription.notes}
                    </p>
                  ) : null}
                  <table className="mt-2 w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="p-1">Drug</th>
                        <th className="p-1">Qty</th>
                        <th className="p-1">Dosage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(myPrescription.prescription.items || []).map((it) => (
                        <tr key={it.id} className="border-t border-slate-100">
                          <td className="p-1">{it.drug_name}</td>
                          <td className="p-1">{it.quantity}</td>
                          <td className="p-1 text-slate-600">{it.dosage || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">Loading…</p>
              )}
            </>
          )}
        </SimpleModal>
      )}
    </AppLayout>
  );
}
