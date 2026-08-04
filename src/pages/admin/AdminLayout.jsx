import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { HOSPITAL } from '../../config/hospital.js';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/patients', label: 'Patients' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/audit', label: 'Audit log' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-base">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={HOSPITAL.logo} alt="logo" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-xs font-semibold text-hospital-900">{HOSPITAL.name}</p>
              <h1 className="text-lg font-semibold text-hospital-900">Administration</h1>
              <p className="text-xs text-slate-500">
                {user?.full_name} · {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {adminNav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded px-2 py-1.5 ${
                    isActive ? 'bg-hospital-100 font-medium text-hospital-900' : 'text-hospital-800 hover:bg-slate-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              type="button"
              className="ml-1 rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
