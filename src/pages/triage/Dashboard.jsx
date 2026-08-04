import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client.js';
import AppLayout from '../../components/AppLayout.jsx';
import ListNumber from '../../components/ListNumber.jsx';
import SimpleModal from '../../components/SimpleModal.jsx';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';

/** Returns Tailwind colour classes + label for a temperature reading */
function tempAlert(t) {
  const v = Number(t);
  if (!t || isNaN(v)) return null;
  if (v >= 39.5) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400', label: '🔴 HIGH FEVER — urgent' };
  if (v >= 38.5) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-400', label: '🟠 Fever — see doctor soon' };
  if (v >= 37.5) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', label: '🟡 Low-grade fever' };
  if (v < 35.5) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', label: '🔵 Hypothermia — urgent' };
  return null;
}

function calcBmi(weight, height) {
  const w = Number(weight);
  const h = Number(height);
  if (!w || !h) return null;
  return (w / ((h / 100) ** 2)).toFixed(1);
}

export default function TriageDashboard() {
  const qc = useQueryClient();
  const [sel, setSel] = useState(null);
  const [historyVitalsId, setHistoryVitalsId] = useState(null);
  const [vitals, setVitals] = useState({
    weight_kg: '',
    height_cm: '',
    bp_systolic: '',
    bp_diastolic: '',
    temperature_c: '',
    spo2: '',
    notes: '',
  });

  const { data } = useQuery({
    queryKey: ['triage-queue'],
    queryFn: async () => (await api.get('/triage/queue')).data,
    refetchInterval: 15000,
  });

  const { data: completedToday } = useQuery({
    queryKey: ['triage-completed-today'],
    queryFn: async () => (await api.get('/triage/completed-today')).data,
    refetchInterval: 30000,
  });

  const { data: vitalsRecord } = useQuery({
    queryKey: ['triage-vitals-record', historyVitalsId],
    enabled: historyVitalsId != null,
    queryFn: async () => (await api.get(`/triage/record/vitals/${historyVitalsId}`)).data,
  });

  const mut = useMutation({
    mutationFn: () =>
      api.post('/triage/vitals', {
        visit_id: sel.id,
        ...vitals,
        weight_kg: vitals.weight_kg ? Number(vitals.weight_kg) : null,
        height_cm: vitals.height_cm ? Number(vitals.height_cm) : null,
        bp_systolic: vitals.bp_systolic ? Number(vitals.bp_systolic) : null,
        bp_diastolic: vitals.bp_diastolic ? Number(vitals.bp_diastolic) : null,
        temperature_c: vitals.temperature_c ? Number(vitals.temperature_c) : null,
        spo2: vitals.spo2 ? Number(vitals.spo2) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['triage-queue'] });
      qc.invalidateQueries({ queryKey: ['triage-completed-today'] });
      setSel(null);
      setVitals({ weight_kg: '', height_cm: '', bp_systolic: '', bp_diastolic: '', temperature_c: '', spo2: '', notes: '' });
    },
  });

  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-hospital-600';
  const lbl = 'block text-sm font-medium text-slate-700';
  const bmi = calcBmi(vitals.weight_kg, vitals.height_cm);
  const tAlert = tempAlert(vitals.temperature_c);

  return (
    <AppLayout title="Triage">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 text-lg font-medium text-slate-900">Queue</h2>
          <p className="mb-3 text-sm text-slate-600">Patients appear here after reception opens a visit.</p>
          <ul className="space-y-2">
            {(data?.queue || []).map((v, idx) => (
              <li key={v.id}>
                <button
                  type="button"
                  className={`flex w-full items-start rounded-lg border px-3 py-2 text-left ${sel?.id === v.id ? 'border-hospital-800 bg-hospital-50' : 'bg-white'}`}
                  onClick={() => setSel(v)}
                >
                  <ListNumber n={idx + 1} />
                  <span>
                    <span className="font-medium">{v.full_name}</span>
                    <span className="block text-xs text-slate-500">{v.unique_id}</span>
                  </span>
                </button>
              </li>
            ))}
            {(data?.queue || []).length === 0 && (
              <li className="text-sm text-slate-500">No patients in queue.</li>
            )}
          </ul>
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Assisted today</h3>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {(completedToday?.items || []).length === 0 && (
                <li className="text-slate-500">No vitals recorded by you today yet.</li>
              )}
              {(completedToday?.items || []).map((row, idx) => (
                <li key={row.ref_id}>
                  <button
                    type="button"
                    className="flex w-full items-start rounded-lg border border-slate-100 bg-white px-3 py-2 text-left hover:bg-hospital-50/40"
                    onClick={() => setHistoryVitalsId(row.ref_id)}
                  >
                    <ListNumber n={idx + 1} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900">{row.patient_name}</span>
                      <span className="block text-xs text-slate-500">{row.unique_id}</span>
                      <span className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">Attended</span>
                      <span className="mt-1 block text-xs text-slate-500">{row.recorded_at ? formatDdMmYyyyAtTime(row.recorded_at) : ''}</span>
                      <span className="mt-1 block text-xs text-hospital-800">View vitals →</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          {sel ? (
            <form
              className="space-y-4"
              onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
            >
              <h3 className="font-semibold text-slate-900">Vitals — <span className="text-hospital-800">{sel.full_name}</span></h3>

              {/* Weight + Height + BMI */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tri-weight" className={lbl}>Weight (kg)</label>
                  <input id="tri-weight" className={field} inputMode="decimal"
                    value={vitals.weight_kg}
                    onChange={(e) => setVitals((x) => ({ ...x, weight_kg: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="tri-height" className={lbl}>Height (cm)</label>
                  <input id="tri-height" className={field} inputMode="decimal"
                    value={vitals.height_cm}
                    onChange={(e) => setVitals((x) => ({ ...x, height_cm: e.target.value }))} />
                </div>
              </div>
              {bmi && (
                <div className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  Number(bmi) < 18.5 ? 'bg-blue-50 text-blue-800' :
                  Number(bmi) < 25 ? 'bg-green-50 text-green-800' :
                  Number(bmi) < 30 ? 'bg-amber-50 text-amber-800' :
                  'bg-red-50 text-red-800'
                }`}>
                  BMI: {bmi} — {
                    Number(bmi) < 18.5 ? 'Underweight' :
                    Number(bmi) < 25 ? 'Normal weight' :
                    Number(bmi) < 30 ? 'Overweight' : 'Obese'
                  }
                </div>
              )}

              {/* Blood Pressure */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tri-bp-sys" className={lbl}>BP — Systolic</label>
                  <input id="tri-bp-sys" className={field} inputMode="numeric"
                    value={vitals.bp_systolic}
                    onChange={(e) => setVitals((x) => ({ ...x, bp_systolic: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="tri-bp-dia" className={lbl}>BP — Diastolic</label>
                  <input id="tri-bp-dia" className={field} inputMode="numeric"
                    value={vitals.bp_diastolic}
                    onChange={(e) => setVitals((x) => ({ ...x, bp_diastolic: e.target.value }))} />
                </div>
              </div>

              {/* Temperature + SpO2 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tri-temp" className={lbl}>Temperature (°C)</label>
                  <input
                    id="tri-temp"
                    className={`${field} ${tAlert ? `border-2 ${tAlert.border}` : ''}`}
                    inputMode="decimal"
                    value={vitals.temperature_c}
                    onChange={(e) => setVitals((x) => ({ ...x, temperature_c: e.target.value }))}
                  />
                  {tAlert && (
                    <p className={`mt-1 rounded px-2 py-1 text-xs font-semibold ${tAlert.bg} ${tAlert.text}`}>
                      {tAlert.label}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="tri-spo2" className={lbl}>SpO₂ (%)</label>
                  <input
                    id="tri-spo2"
                    className={`${field} ${vitals.spo2 && Number(vitals.spo2) < 94 ? 'border-2 border-red-400' : ''}`}
                    inputMode="decimal"
                    placeholder="e.g. 98"
                    value={vitals.spo2}
                    onChange={(e) => setVitals((x) => ({ ...x, spo2: e.target.value }))}
                  />
                  {vitals.spo2 && Number(vitals.spo2) < 94 && (
                    <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                      🔴 Low SpO₂ — oxygen support may be needed
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="tri-notes" className={lbl}>
                  Notes <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea id="tri-notes" className={field} rows={3}
                  value={vitals.notes}
                  onChange={(e) => setVitals((x) => ({ ...x, notes: e.target.value }))} />
              </div>

              <button type="submit" disabled={mut.isPending}
                className="rounded-lg bg-hospital-800 px-5 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:opacity-50">
                {mut.isPending ? 'Submitting…' : 'Submit vitals → send to doctor'}
              </button>
              {mut.isError && <p className="text-sm text-red-600">{mut.error?.response?.data?.message}</p>}
            </form>
          ) : (
            <p className="text-slate-500">Select a patient from the queue.</p>
          )}
        </div>
      </div>

      {historyVitalsId != null && (
        <SimpleModal title="Vitals recorded" onClose={() => setHistoryVitalsId(null)}>
          {vitalsRecord?.record ? (
            <div className="space-y-3">
              <p><span className="text-slate-500">Patient:</span> <strong>{vitalsRecord.record.patient_name}</strong> · {vitalsRecord.record.unique_id}</p>
              <p><span className="text-slate-500">Recorded:</span> {vitalsRecord.record.recorded_at ? formatDdMmYyyyAtTime(vitalsRecord.record.recorded_at) : '—'}</p>
              <ul className="list-none space-y-1 rounded-lg bg-slate-50 p-3 text-slate-800">
                <li>Weight: {vitalsRecord.record.weight_kg ?? '—'} kg</li>
                <li>Height: {vitalsRecord.record.height_cm ?? '—'} cm</li>
                {vitalsRecord.record.weight_kg && vitalsRecord.record.height_cm && (
                  <li>BMI: {calcBmi(vitalsRecord.record.weight_kg, vitalsRecord.record.height_cm)}</li>
                )}
                <li>BP: {vitalsRecord.record.bp_systolic ?? '—'}/{vitalsRecord.record.bp_diastolic ?? '—'}</li>
                <li>Temperature: {vitalsRecord.record.temperature_c ?? '—'} °C</li>
                <li>SpO₂: {vitalsRecord.record.spo2 ?? '—'} %</li>
                {vitalsRecord.record.notes ? (
                  <li className="border-t border-slate-200 pt-2"><span className="text-slate-500">Notes:</span> {vitalsRecord.record.notes}</li>
                ) : null}
              </ul>
            </div>
          ) : (
            <p className="text-slate-500">Loading…</p>
          )}
        </SimpleModal>
      )}
    </AppLayout>
  );
}
