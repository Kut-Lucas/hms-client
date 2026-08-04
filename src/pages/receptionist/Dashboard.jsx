import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client.js';
import AppLayout from '../../components/AppLayout.jsx';
import ListNumber from '../../components/ListNumber.jsx';
import { formatDdMmYyyy, formatTime12h } from '../../utils/datetime.js';

export default function ReceptionistDashboard() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    id_type: 'national_id',
    id_number: '',
    passport_number: '',
    guardian_unique_id: '',
  });
  const [visit, setVisit] = useState({
    patient_id: '',
    patient_name: '',   // display only — not sent to API
    consultation_fee: '',
    fee_paid: true,
    payment_method: 'cash',
    visit_type: 'consultation',
  });

  const { data: visits } = useQuery({
    queryKey: ['visits-active'],
    queryFn: async () => (await api.get('/visits/active')).data,
    refetchInterval: 15000,
  });

  const { data: visitsCompletedToday } = useQuery({
    queryKey: ['visits-today-completed'],
    queryFn: async () => (await api.get('/visits/today-completed')).data,
    refetchInterval: 15000,
  });

  const { data: todayPatients } = useQuery({
    queryKey: ['patients-today'],
    queryFn: async () => (await api.get('/patients/today')).data,
    refetchInterval: 15000,
  });

  const { data: searchRes } = useQuery({
    queryKey: ['rx-search', search],
    enabled: search.trim().length >= 2,
    queryFn: async () => (await api.get('/patients/search', { params: { q: search } })).data,
  });

  const [regMsg, setRegMsg] = useState('');
  const [visitMsg, setVisitMsg] = useState('');

  function selectPatient(id, name) {
    setVisit((v) => ({ ...v, patient_id: String(id), patient_name: name }));
    setSearch('');
    // Scroll to open visit section
    document.getElementById('open-visit-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const reg = useMutation({
    mutationFn: () => api.post('/patients/', form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['rx-search'] });
      qc.invalidateQueries({ queryKey: ['visits-active'] });
      qc.invalidateQueries({ queryKey: ['patients-today'] });
      qc.invalidateQueries({ queryKey: ['visits-today-completed'] });
      const d = res.data;
      if (d?.patient?.id) {
        setVisit((v) => ({ ...v, patient_id: String(d.patient.id), patient_name: d.patient.full_name || form.full_name }));
        setRegMsg(`✔ Patient saved (${d.patient.unique_id}). Now scroll down to Open visit.`);
        setForm({ full_name: '', date_of_birth: '', gender: 'male', phone: '', id_type: 'national_id', id_number: '', passport_number: '', guardian_unique_id: '' });
      } else {
        setRegMsg(d?.message || 'OK');
      }
    },
    onError: (err) => {
      const d = err.response?.data;
      if (d?.patient?.id) {
        qc.invalidateQueries({ queryKey: ['patients-today'] });
        qc.invalidateQueries({ queryKey: ['rx-search'] });
        setVisit((v) => ({ ...v, patient_id: String(d.patient.id), patient_name: d.patient.full_name || '' }));
        setRegMsg(`ℹ ${d.message || 'Patient already on file.'} Selected for you — open the visit below.`);
        return;
      }
      setRegMsg(d?.message || err.message);
    },
  });

  const openVisit = useMutation({
    mutationFn: () =>
      api.post('/visits/', {
        patient_id: Number(visit.patient_id),
        consultation_fee: Number(visit.consultation_fee),
        fee_paid: visit.fee_paid,
        payment_method: visit.payment_method,
        visit_type: visit.visit_type,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['visits-active'] });
      qc.invalidateQueries({ queryKey: ['patients-today'] });
      qc.invalidateQueries({ queryKey: ['visits-today-completed'] });
      const statusLabel = res.data?.visit?.visit_type === 'dressing' ? 'lab queue' : 'triage queue';
      setVisitMsg(`✔ Visit opened — patient is now in the ${statusLabel}.`);
      setVisit({ patient_id: '', patient_name: '', consultation_fee: '', fee_paid: true, payment_method: 'cash', visit_type: 'consultation' });
    },
    onError: (err) => setVisitMsg(err.response?.data?.message || err.message),
  });

  const fc = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-hospital-600';
  const lc = 'block text-sm font-medium text-slate-700';

  return (
    <AppLayout title="Reception" links={[]}>

      {/* ── Register new patient ── */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Register new patient</h2>
        <p className="mt-1 text-sm text-slate-500">
          Returning patient? Search below in <em>Open visit</em> — no need to re-register.
        </p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); reg.mutate(); }}>
          <div>
            <label htmlFor="rx-full-name" className={lc}>Patient full name</label>
            <input id="rx-full-name" className={fc} value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="rx-dob" className={lc}>Date of birth</label>
            <input id="rx-dob" className={fc} type="date" value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="rx-gender" className={lc}>Gender</label>
            <select id="rx-gender" className={fc} value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
              {['male','female','other'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rx-phone" className={lc}>Phone <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="rx-phone" className={fc} type="tel" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="rx-id-type" className={lc}>ID type</label>
            <select id="rx-id-type" className={fc} value={form.id_type}
              onChange={(e) => setForm((f) => ({ ...f, id_type: e.target.value }))}>
              <option value="national_id">National ID (adult)</option>
              <option value="passport">Passport</option>
              <option value="minor">Minor (auto ID + guardian)</option>
              <option value="temporary">Temporary (foreigner)</option>
            </select>
          </div>
          {(form.id_type === 'national_id' || form.id_type === 'minor') && (
            <div>
              <label htmlFor="rx-id-num" className={lc}>
                {form.id_type === 'minor' ? 'Guardian national ID' : 'National ID number'}
              </label>
              <input id="rx-id-num" className={fc}
                value={form.id_type === 'minor' ? form.guardian_unique_id : form.id_number}
                onChange={(e) => setForm((f) => f.id_type === 'minor'
                  ? { ...f, guardian_unique_id: e.target.value }
                  : { ...f, id_number: e.target.value })}
                required />
            </div>
          )}
          {form.id_type === 'passport' && (
            <div>
              <label htmlFor="rx-passport" className={lc}>Passport number</label>
              <input id="rx-passport" className={fc} value={form.passport_number}
                onChange={(e) => setForm((f) => ({ ...f, passport_number: e.target.value }))} required />
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={reg.isPending}
              className="rounded-lg bg-hospital-800 px-5 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:opacity-50">
              {reg.isPending ? 'Saving…' : 'Save patient record'}
            </button>
          </div>
        </form>
        {regMsg && (
          <p className={`mt-3 text-sm ${regMsg.startsWith('✔') ? 'text-green-700' : regMsg.startsWith('ℹ') ? 'text-sky-700' : 'text-red-700'}`}>
            {regMsg}
          </p>
        )}
      </div>

      {/* ── Patients registered today ── */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Patients registered today</h2>
        <p className="mt-1 mb-3 text-sm text-slate-500">Click a name to auto-select them for opening a visit.</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-10 p-2">#</th>
                <th className="p-2">Name</th>
                <th className="p-2">Unique ID</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(todayPatients?.patients || []).length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-slate-500">No patients registered yet today.</td></tr>
              ) : (
                (todayPatients?.patients || []).map((p, idx) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2"><ListNumber n={idx + 1} /></td>
                    <td className="p-2">
                      <button type="button"
                        className="font-medium text-hospital-800 underline-offset-2 hover:underline"
                        onClick={() => selectPatient(p.id, p.full_name)}>
                        {p.full_name}
                      </button>
                    </td>
                    <td className="p-2 text-slate-600">{p.unique_id}</td>
                    <td className="p-2">
                      {Number(p.has_open_visit_today) === 1
                        ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">In visit queue</span>
                        : <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Not yet in queue</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Open visit ── */}
      <div id="open-visit-section" className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Open visit</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search a returning patient or select from the list above, then set the fee and open the visit.
        </p>

        {/* Search */}
        <div className="mt-4">
          <label htmlFor="rx-search" className={lc}>Search patient (returning or new)</label>
          <input id="rx-search" className={fc} value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type name, national ID or unique ID…" />
        </div>
        {(searchRes?.patients || []).length > 0 && (
          <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white text-sm shadow-sm">
            {(searchRes.patients).map((p, idx) => (
              <li key={p.id}>
                <button type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-hospital-50"
                  onClick={() => selectPatient(p.id, p.full_name)}>
                  <ListNumber n={idx + 1} />
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-slate-500">— {p.unique_id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Selected patient indicator */}
        {visit.patient_name && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            <span>✔ Selected:</span>
            <strong>{visit.patient_name}</strong>
            <button type="button" className="ml-auto text-xs text-slate-500 hover:text-red-600"
              onClick={() => setVisit((v) => ({ ...v, patient_id: '', patient_name: '' }))}>
              Clear
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Visit type */}
          <div className="sm:col-span-2">
            <label className={lc}>Visit type</label>
            <div className="mt-2 flex gap-3">
              {[
                { v: 'consultation', label: 'Consultation (goes to triage)', desc: 'Normal patient visit' },
                { v: 'dressing', label: 'Dressing only (goes directly to lab)', desc: 'Skip triage, nurse does dressing' },
              ].map((opt) => (
                <label key={opt.v}
                  className={`flex flex-1 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${visit.visit_type === opt.v ? 'border-hospital-800 bg-hospital-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <input type="radio" className="mt-0.5" name="visit-type"
                    checked={visit.visit_type === opt.v}
                    onChange={() => setVisit((v) => ({ ...v, visit_type: opt.v }))} />
                  <span>
                    <span className="font-medium text-slate-900">{opt.label}</span>
                    <span className="block text-xs text-slate-500">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rx-fee" className={lc}>Consultation fee (KES)</label>
            <input id="rx-fee" className={fc} type="number" step="0.01" min="0"
              value={visit.consultation_fee}
              onChange={(e) => setVisit((v) => ({ ...v, consultation_fee: e.target.value }))} />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input id="rx-fee-paid" type="checkbox" className="h-4 w-4 rounded border-slate-300"
              checked={visit.fee_paid}
              onChange={(e) => setVisit((v) => ({ ...v, fee_paid: e.target.checked }))} />
            <label htmlFor="rx-fee-paid" className="text-sm text-slate-700">
              Consultation fee paid now
            </label>
          </div>

          <div>
            <label htmlFor="rx-pay-method" className={lc}>Payment method</label>
            <select id="rx-pay-method" className={fc} value={visit.payment_method}
              onChange={(e) => setVisit((v) => ({ ...v, payment_method: e.target.value }))}>
              {['cash','card','mpesa','insurance','other'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button type="button" disabled={!visit.patient_id || openVisit.isPending}
              className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-40"
              onClick={() => openVisit.mutate()}>
              {openVisit.isPending ? 'Opening…' : 'Open visit →'}
            </button>
          </div>
        </div>
        {visitMsg && (
          <p className={`mt-3 text-sm ${visitMsg.startsWith('✔') ? 'text-green-700' : 'text-red-700'}`}>{visitMsg}</p>
        )}
      </div>

      {/* ── Today's active visits ── */}
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Today's active visits</h2>
      <div className="mb-10 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 p-2">#</th>
              <th className="p-2">Patient</th>
              <th className="p-2">Type</th>
              <th className="p-2">Status</th>
              <th className="p-2">Fee (KES)</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Opened</th>
            </tr>
          </thead>
          <tbody>
            {(visits?.visits || []).length === 0 ? (
              <tr><td colSpan={7} className="p-3 text-slate-500">No active visits today yet.</td></tr>
            ) : (
              (visits?.visits || []).map((v, idx) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="p-2"><ListNumber n={idx + 1} /></td>
                  <td className="p-2 font-medium">{v.full_name} <span className="text-xs text-slate-400">({v.unique_id})</span></td>
                  <td className="p-2">
                    {v.visit_type === 'dressing'
                      ? <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">Dressing</span>
                      : <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Consultation</span>}
                  </td>
                  <td className="p-2 capitalize">{v.status}</td>
                  <td className="p-2">{v.consultation_fee}</td>
                  <td className="p-2">{v.fee_paid ? 'Yes' : 'No'}</td>
                  <td className="p-2 whitespace-nowrap text-slate-500">
                    <span className="block">{formatDdMmYyyy(v.created_at)}</span>
                    <span className="text-xs">{formatTime12h(v.created_at)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Completed today ── */}
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Completed / discharged today</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 p-2">#</th>
              <th className="p-2">Patient</th>
              <th className="p-2">Fee (KES)</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Opened</th>
              <th className="p-2">Completed</th>
            </tr>
          </thead>
          <tbody>
            {(visitsCompletedToday?.visits || []).length === 0 ? (
              <tr><td colSpan={6} className="p-3 text-slate-500">No completed visits yet today.</td></tr>
            ) : (
              (visitsCompletedToday?.visits || []).map((v, idx) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="p-2"><ListNumber n={idx + 1} /></td>
                  <td className="p-2 font-medium">{v.full_name} <span className="text-xs text-slate-400">({v.unique_id})</span></td>
                  <td className="p-2">{v.consultation_fee}</td>
                  <td className="p-2">{v.fee_paid ? 'Yes' : 'No'}</td>
                  <td className="p-2 whitespace-nowrap text-slate-500">
                    <span className="block">{formatDdMmYyyy(v.created_at)}</span>
                    <span className="text-xs">{formatTime12h(v.created_at)}</span>
                  </td>
                  <td className="p-2 whitespace-nowrap text-slate-500">
                    {v.completed_at ? (
                      <>
                        <span className="block">{formatDdMmYyyy(v.completed_at)}</span>
                        <span className="text-xs">{formatTime12h(v.completed_at)}</span>
                      </>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
