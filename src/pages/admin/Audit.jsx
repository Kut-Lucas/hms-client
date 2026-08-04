import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client.js';
import ListNumber from '../../components/ListNumber.jsx';
import { formatDdMmYyyyAtTime } from '../../utils/datetime.js';

export default function AdminAudit() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: async () => (await api.get('/admin/audit-log', { params: { page, limit: 40 } })).data,
  });

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">Audit log</h2>
      {isLoading && <p>Loading…</p>}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="w-10 p-2">#</th>
              <th className="p-2">When</th>
              <th className="p-2">User</th>
              <th className="p-2">Action</th>
              <th className="p-2">Entity</th>
              <th className="p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {(data?.logs || []).map((l, idx) => (
              <tr key={l.id} className="border-t">
                <td className="p-2">
                  <ListNumber n={(page - 1) * 40 + idx + 1} />
                </td>
                <td className="p-2 whitespace-nowrap">{formatDdMmYyyyAtTime(l.created_at)}</td>
                <td className="p-2">{l.email || '—'}</td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">
                  {l.entity} {l.entity_id}
                </td>
                <td className="p-2 max-w-md truncate">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded border px-3 py-1"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </>
  );
}
