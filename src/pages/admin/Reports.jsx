import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client.js';
import ListNumber from '../../components/ListNumber.jsx';
import VisitReceiptButton from '../../components/VisitReceiptButton.jsx';
import { formatDdMmYyyy, formatDdMmYyyyAtTime } from '../../utils/datetime.js';

export default function AdminReports() {
  const [period, setPeriod] = useState('week');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [patientId, setPatientId] = useState('');
  const [searchName, setSearchName] = useState('');

  const params = useMemo(() => {
    const p = { period };
    if (period === 'custom' && custom.from && custom.to) {
      p.from = custom.from;
      p.to = custom.to;
    }
    return p;
  }, [period, custom]);

  async function downloadReportPdf() {
    const res = await api.get('/finance/report/pdf', { params, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  const { data: fin } = useQuery({
    queryKey: ['finance-report', params],
    queryFn: async () => (await api.get('/finance/report', { params })).data,
  });

  const { data: search } = useQuery({
    queryKey: ['pat-search', searchName],
    enabled: searchName.length >= 2,
    queryFn: async () => (await api.get('/patients/search', { params: { q: searchName } })).data,
  });

  const { data: payPatient } = useQuery({
    queryKey: ['patient-payments', patientId],
    enabled: !!patientId,
    queryFn: async () => (await api.get(`/finance/patient/${patientId}`)).data,
  });

  const chartData = (fin?.daily_revenue || []).map((d) => ({
    date: formatDdMmYyyy(String(d.d).slice(0, 10)),
    total: Number(d.total),
  }));

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">Financial reports</h2>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Period
          <select
            className="ml-1 rounded border px-2 py-1"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {['week', 'halfmonth', 'month', 'year', 'custom'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        {period === 'custom' && (
          <>
            <input
              type="date"
              className="rounded border px-2 py-1"
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
            />
            <input
              type="date"
              className="rounded border px-2 py-1"
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
            />
          </>
        )}
        <button
          type="button"
          className="rounded bg-slate-800 px-3 py-1 text-sm text-white"
          onClick={() => downloadReportPdf()}
        >
          Export PDF
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Consultation', fin?.totals?.consultation],
          ['Pharmacy', fin?.totals?.pharmacy],
          ['Lab', fin?.totals?.lab],
          ['Procurement (est.)', fin?.totals?.procurement],
          ['Net', fin?.totals?.net],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">{k}</p>
            <p className="text-lg font-semibold">KES {Number(v || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mb-10 h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-slate-600">Daily revenue</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#0284c7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-lg font-medium">Patient payments</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="rounded border px-2 py-1"
          placeholder="Search patient name or ID"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>
      <ul className="mb-4 max-h-40 overflow-auto rounded border bg-white text-sm">
        {(search?.patients || []).map((p, idx) => (
          <li key={p.id}>
            <button
              type="button"
              className="flex w-full items-center px-2 py-1 text-left hover:bg-slate-50"
              onClick={() => setPatientId(p.id)}
            >
              <ListNumber n={idx + 1} />
              {p.full_name} — {p.unique_id}
            </button>
          </li>
        ))}
      </ul>
      {patientId && (
        <>
          <p className="mb-3 text-sm text-slate-600">
            One consolidated PDF per visit includes consultation, lab, and pharmacy charges together.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="w-10 p-2">#</th>
                <th className="p-2">Session</th>
                <th className="p-2">Charges</th>
                <th className="p-2">Total (KES)</th>
                <th className="p-2">Consolidated receipt</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const byVisit = {};
                for (const p of payPatient?.payments || []) {
                  const vid = p.visit_id;
                  if (!byVisit[vid]) byVisit[vid] = { visit_id: vid, lines: [], total: 0 };
                  byVisit[vid].lines.push(p);
                  byVisit[vid].total += Number(p.amount);
                }
                const visits = Object.values(byVisit);
                if (!visits.length) {
                  return (
                    <tr>
                      <td colSpan={5} className="p-3 text-slate-500">
                        No payments recorded for this patient.
                      </td>
                    </tr>
                  );
                }
                return visits.map((v, idx) => (
                  <tr key={v.visit_id} className="border-t">
                    <td className="p-2">
                      <ListNumber n={idx + 1} />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {v.lines[0]?.created_at ? formatDdMmYyyyAtTime(v.lines[0].created_at) : '—'}
                    </td>
                    <td className="p-2">
                      {v.lines.map((p) => (
                        <span key={p.id} className="mr-2 block text-slate-600">
                          {p.payment_type}: {p.amount}
                        </span>
                      ))}
                    </td>
                    <td className="p-2 font-medium">{v.total.toFixed(2)}</td>
                    <td className="p-2">
                      <VisitReceiptButton visitId={v.visit_id} label="Full visit PDF" />
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
