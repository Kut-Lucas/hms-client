import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { HOSPITAL } from '../config/hospital.js';

export default function Register() {
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base';
  const lbl = 'block text-sm font-medium text-slate-700';

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    try {
      const { data } = await api.post('/auth/register', { full_name, email, password });
      if (data?.success) {
        setMsg(
          `${data.message || 'Registered.'} Your hospital admin can find you under Admin → Users (or the dashboard “Staff waiting for approval”) to assign your role and approve your account.`
        );
      } else setErr(data?.message || 'Failed');
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-base shadow">
        <div className="flex items-center gap-3 mb-4">
          <img src={HOSPITAL.logo} alt="logo" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">{HOSPITAL.name}</h1>
            <p className="text-xs italic text-slate-500">{HOSPITAL.tagline}</p>
          </div>
        </div>
        <h2 className="text-base font-semibold text-slate-900">Staff Registration</h2>
        <p className="mt-1 text-sm text-slate-500">An administrator must approve your account before you can log in.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{err}</p>}
          {msg && <p className="rounded-lg bg-green-50 p-2 text-sm text-green-800">{msg}</p>}
          <div>
            <label htmlFor="reg-full-name" className={lbl}>
              Full name
            </label>
            <input
              id="reg-full-name"
              className={field}
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-email" className={lbl}>
              Work email
            </label>
            <input
              id="reg-email"
              className={field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-password" className={lbl}>
              Password <span className="font-normal text-slate-500">(min. 8 characters)</span>
            </label>
            <input
              id="reg-password"
              className={field}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-confirm" className={lbl}>
              Confirm password
            </label>
            <input
              id="reg-confirm"
              className={field}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900">
            Submit registration
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          <Link to="/login" className="text-hospital-800 underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
