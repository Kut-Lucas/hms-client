import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { HOSPITAL } from '../config/hospital.js';

export default function AppLayout({ title, children, links = [] }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-base">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={HOSPITAL.logo} alt="logo" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-xs font-semibold text-hospital-900">{HOSPITAL.name}</p>
              <h1 className="text-lg font-semibold text-hospital-900">{title}</h1>
              <p className="text-xs text-slate-500">
                {user?.full_name} · {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded px-2 py-1 text-hospital-800 hover:bg-slate-100">
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100"
              onClick={async () => {
                await logout();
                nav('/login');
              }}
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
