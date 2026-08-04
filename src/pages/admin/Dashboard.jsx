import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import ListNumber from '../../components/ListNumber.jsx';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
    refetchInterval: 15000,
  });

  const s = data?.stats;
  const pending = s?.pendingUsers || [];

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">Dashboard overview</h2>
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Could not load dashboard: {error?.response?.data?.message || error?.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Patients today (visits)', value: s?.patientsToday },
          { label: 'Active visits', value: s?.activeVisits },
          { label: 'Pending staff approvals', value: s?.pendingApprovals },
          { label: 'Low stock SKUs', value: s?.lowStockItems },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-hospital-900">{c.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-800">Staff waiting for approval</h2>
          <Link
            to="/admin/users"
            className="text-sm font-medium text-hospital-800 underline hover:text-hospital-900"
          >
            Open full user list →
          </Link>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          People who used <strong>Register</strong> on the login page appear here until you assign a role and click
          <strong> Approve</strong> on the Users page.
        </p>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No pending staff accounts.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-100/80 text-slate-700">
                <tr>
                  <th className="w-10 p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u, idx) => (
                  <tr key={u.id} className="border-t border-amber-100 bg-white">
                    <td className="p-3">
                      <ListNumber n={idx + 1} />
                    </td>
                    <td className="p-3 font-medium">{u.full_name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 text-slate-600">
                      {u.created_at ? formatDdMmYyyyAtTime(u.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-8 text-sm text-slate-600">
        <Link to="/admin/patients" className="font-medium text-hospital-800 underline">
          View all patients, daily queue, and attended visits →
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Use the navigation above to manage users, inventory, financial reports, and audit trail.
      </p>
    </>
  );
}
