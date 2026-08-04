import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client.js';
import ListNumber from '../../components/ListNumber.jsx';

/** Shows the generated one-time code with a live 2-minute countdown */
function CodeDisplay({ code, userName, onDismiss }) {
  const TOTAL = 120;
  const [remaining, setRemaining] = useState(TOTAL);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(timerRef.current); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, '0');
  const expired = remaining === 0;

  return (
    <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${expired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      {expired ? (
        <>
          <p className="font-semibold text-red-700">⏰ Code expired</p>
          <p className="mt-1 text-red-600">Generate a new code if the user still needs to reset their password.</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-amber-800">Reset code for <span className="text-slate-900">{userName}</span></p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-slate-900">{code}</p>
          <p className="mt-1 text-xs text-amber-700">
            Give this code to the staff member to enter on the login page.{' '}
            <span className="font-semibold">Expires in {mins}:{secs}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">This code is shown only once and cannot be retrieved.</p>
        </>
      )}
      <button
        type="button"
        className="mt-2 text-xs text-slate-400 underline hover:text-slate-600"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}

const roles = ['receptionist', 'triage', 'doctor', 'pharmacist', 'lab_technician', 'admin'];

export default function AdminUsers() {
  const qc = useQueryClient();
  const [rolePick, setRolePick]   = useState({});
  const [codeInfo, setCodeInfo]   = useState(null); // { code, userId, userName }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const approve = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/approve`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const deactivate = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const generateCode = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/reset-code`),
    onSuccess: (res, id) => {
      const d = res.data;
      setCodeInfo({ code: d.code, userId: id, userName: d.user?.full_name || 'User' });
    },
  });

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">User management</h2>
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Could not load users: {error?.response?.data?.message || error?.message}
        </p>
      )}
      <p className="mb-4 text-sm text-slate-600">
        <strong>Staff</strong> who registered appear below with{' '}
        <span className="text-amber-800">Approved: No</span> until you pick a role and click{' '}
        <strong>Approve</strong>. Use <strong>Reset Password</strong> to generate a 2-minute code
        for a staff member who forgot their password.
      </p>

      {/* Code display banner */}
      {codeInfo && (
        <CodeDisplay
          code={codeInfo.code}
          userName={codeInfo.userName}
          onDismiss={() => setCodeInfo(null)}
        />
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="w-10 p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Approved</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((u, idx) => {
              const approved = Boolean(u.is_approved);
              const active   = Boolean(u.is_active);
              return (
                <tr key={u.id} className={`border-t border-slate-100 ${!approved ? 'bg-amber-50' : ''}`}>
                  <td className="p-3"><ListNumber n={idx + 1} /></td>
                  <td className="p-3 font-medium text-slate-900">{u.full_name}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <select
                      className="rounded border px-2 py-1"
                      value={u.role}
                      disabled={!approved}
                      onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                    >
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-3">{approved ? 'Yes' : <span className="text-amber-700 font-medium">No</span>}</td>
                  <td className="p-3">{active ? 'Yes' : <span className="text-red-600">No</span>}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Approve pending users */}
                      {!approved && (
                        <>
                          <select
                            className="rounded border px-2 py-1"
                            value={rolePick[u.id] || 'receptionist'}
                            onChange={(e) => setRolePick((p) => ({ ...p, [u.id]: e.target.value }))}
                          >
                            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button
                            type="button"
                            className="rounded bg-green-700 px-2 py-1 text-white hover:bg-green-800"
                            onClick={() => approve.mutate({ id: u.id, role: rolePick[u.id] || 'receptionist' })}
                          >
                            Approve
                          </button>
                        </>
                      )}

                      {/* Deactivate active users */}
                      {active && approved && (
                        <button
                          type="button"
                          className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                          onClick={() => deactivate.mutate(u.id)}
                        >
                          Deactivate
                        </button>
                      )}

                      {/* Reset password — available for approved active users */}
                      {approved && active && (
                        <button
                          type="button"
                          disabled={generateCode.isPending && generateCode.variables === u.id}
                          className="rounded border border-hospital-700 bg-white px-2 py-1 text-xs font-medium text-hospital-900 hover:bg-hospital-50 disabled:opacity-50"
                          onClick={() => {
                            setCodeInfo(null);
                            generateCode.mutate(u.id);
                          }}
                        >
                          🔑 Reset password
                        </button>
                      )}

                      {generateCode.isError && generateCode.variables === u.id && (
                        <p className="text-xs text-red-600">
                          {generateCode.error?.response?.data?.message || 'Failed'}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
