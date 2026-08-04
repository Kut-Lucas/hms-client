import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client.js';
import ListNumber from '../../components/ListNumber.jsx';
import VisitReceiptButton from '../../components/VisitReceiptButton.jsx';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';

const tabs = [
  { id: 'all', label: 'All patients' },
  { id: 'queue', label: 'In queue (selected day)' },
  { id: 'attended', label: 'Attended (selected day)' },
  { id: 'visits', label: 'All visits (selected day)' },
];

function statusLabel(s) {
  const map = {
    registered: 'Reception / registered',
    triage: 'Triage',
    doctor: 'Doctor',
    lab: 'Laboratory',
    pharmacy: 'Pharmacy',
    completed: 'Completed',
  };
  return map[s] || s;
}

export default function AdminPatients() {
  const [tab, setTab] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');

  const { data: allPatients } = useQuery({
    queryKey: ['admin-all-patients', search],
    queryFn: async () =>
      (await api.get('/admin/patients', { params: search.trim().length >= 2 ? { q: search } : {} })).data,
    enabled: tab === 'all',
  });

  const { data: queueDay } = useQuery({
    queryKey: ['admin-queue-day', date],
    queryFn: async () => (await api.get('/admin/visits/queue', { params: { date } })).data,
    enabled: tab === 'queue',
  });

  const { data: attendedDay } = useQuery({
    queryKey: ['admin-attended-day', date],
    queryFn: async () => (await api.get('/admin/visits/attended', { params: { date } })).data,
    enabled: tab === 'attended',
  });

  const { data: visitsDay } = useQuery({
    queryKey: ['admin-visits-day', date],
    queryFn: async () => (await api.get('/admin/visits', { params: { date } })).data,
    enabled: tab === 'visits',
  });

  const showDatePicker = tab !== 'all';

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold text-slate-800">Patients & visits</h2>
      <p className="mb-4 text-sm text-slate-600">
        View everyone in the system, who is still in the queue for a given day, and who has been attended.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.id ? 'bg-hospital-800 text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showDatePicker && (
        <label className="mb-4 block text-sm">
          <span className="font-medium text-slate-700">Date</span>
          <input
            type="date"
            className="ml-2 rounded border border-slate-300 px-2 py-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      )}

      {tab === 'all' && (
        <>
          <input
            className="mb-4 w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search name or ID (optional, min 2 characters)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="w-10 p-2">#</th>
                  <th className="p-2">Patient ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Gender</th>
                  <th className="p-2">DOB</th>
                  <th className="p-2">Visits</th>
                  <th className="p-2">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {(allPatients?.patients || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-slate-500">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  (allPatients?.patients || []).map((p, idx) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="p-2">
                        <ListNumber n={idx + 1} />
                      </td>
                      <td className="p-2">{p.unique_id}</td>
                      <td className="p-2 font-medium">{p.full_name}</td>
                      <td className="p-2">{p.gender}</td>
                      <td className="p-2">{p.date_of_birth}</td>
                      <td className="p-2">{p.visit_count}</td>
                      <td className="p-2 whitespace-nowrap text-slate-600">
                        {p.last_visit_at ? formatDdMmYyyyAtTime(p.last_visit_at) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'queue' && (
        <VisitTable
          rows={queueDay?.visits}
          empty="No patients in queue for this date."
          showReceipt
        />
      )}

      {tab === 'attended' && (
        <VisitTable rows={attendedDay?.visits} empty="No completed visits for this date." showReceipt />
      )}

      {tab === 'visits' && (
        <VisitTable rows={visitsDay?.visits} empty="No visits opened on this date." showReceipt />
      )}
    </>
  );
}

function VisitTable({ rows = [], empty, showReceipt }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="w-10 p-2">#</th>
            <th className="p-2">Patient</th>
            <th className="p-2">Status</th>
            <th className="p-2">Fee (KES)</th>
            <th className="p-2">Opened</th>
            {showReceipt && <th className="p-2">Receipt</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showReceipt ? 6 : 5} className="p-4 text-slate-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((v, idx) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="p-2">
                  <ListNumber n={idx + 1} />
                </td>
                <td className="p-2">
                  {v.full_name} <span className="text-slate-500">({v.unique_id})</span>
                </td>
                <td className="p-2">{statusLabel(v.status)}</td>
                <td className="p-2">{v.consultation_fee}</td>
                <td className="p-2 whitespace-nowrap">{formatDdMmYyyyAtTime(v.created_at)}</td>
                {showReceipt && (
                  <td className="p-2">
                    <VisitReceiptButton visitId={v.id} label="PDF" />
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
