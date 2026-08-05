// import { useState } from 'react';
// import { Link, Navigate, useNavigate } from 'react-router-dom';
// import { api } from '../api/client.js';
// import { useAuth } from '../context/AuthContext.jsx';
// import { HOSPITAL } from '../config/hospital.js';

// const field =
//   'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-hospital-600';

// // ─── Forgot-password panel ────────────────────────────────────────────────────
// function ForgotPasswordPanel({ onBack }) {
//   const [email, setEmail]           = useState('');
//   const [code, setCode]             = useState('');
//   const [newPw, setNewPw]           = useState('');
//   const [confirmPw, setConfirmPw]   = useState('');
//   const [loading, setLoading]       = useState(false);
//   const [err, setErr]               = useState('');
//   const [success, setSuccess]       = useState('');

//   async function onSubmit(e) {
//     e.preventDefault();
//     setErr(''); setSuccess('');
//     if (newPw !== confirmPw) { setErr('New passwords do not match'); return; }
//     if (newPw.length < 8)    { setErr('Password must be at least 8 characters'); return; }
//     setLoading(true);
//     try {
//       const { data } = await api.post('/auth/reset-password', {
//         email: email.trim().toLowerCase(),
//         code: code.trim().toUpperCase(),
//         new_password: newPw,
//         confirm_password: confirmPw,
//       });
//       if (data?.success) {
//         setSuccess(data.message || 'Password changed! You can now sign in.');
//         setEmail(''); setCode(''); setNewPw(''); setConfirmPw('');
//       } else {
//         setErr(data?.message || 'Reset failed');
//       }
//     } catch (ex) {
//       setErr(ex.response?.data?.message || 'Reset failed. Check the code and try again.');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="w-full max-w-md rounded-2xl bg-white p-8 text-base shadow-xl">
//       <div className="flex flex-col items-center gap-2">
//         <img src={HOSPITAL.logo} alt="Multicare Hospital logo" className="h-16 w-16 object-contain" />
//         <h1 className="text-center text-xl font-bold text-slate-800">Reset your password</h1>
//         <p className="text-center text-xs text-slate-500">
//           Ask your administrator to generate a reset code, then enter it below.
//         </p>
//       </div>

//       {success ? (
//         <div className="mt-6 space-y-4">
//           <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
//             ✔ {success}
//           </div>
//           <button
//             type="button"
//             className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900"
//             onClick={onBack}
//           >
//             Back to sign in
//           </button>
//         </div>
//       ) : (
//         <form className="mt-6 space-y-4" onSubmit={onSubmit}>
//           {err && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}

//           <div>
//             <label className="text-sm font-medium text-slate-700">Your email address</label>
//             <input
//               className={field}
//               type="email"
//               autoComplete="email"
//               placeholder="staff@multicare.co.ke"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium text-slate-700">Reset code</label>
//             <p className="mb-1 text-xs text-slate-500">
//               Contact your administrator — they will generate a code that expires in&nbsp;2&nbsp;minutes.
//             </p>
//             <input
//               className={`${field} font-mono tracking-widest uppercase`}
//               type="text"
//               placeholder="e.g. AB3K7MX2"
//               maxLength={8}
//               value={code}
//               onChange={(e) => setCode(e.target.value.toUpperCase())}
//               required
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium text-slate-700">New password</label>
//             <input
//               className={field}
//               type="password"
//               autoComplete="new-password"
//               placeholder="At least 8 characters"
//               value={newPw}
//               onChange={(e) => setNewPw(e.target.value)}
//               required
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium text-slate-700">Confirm new password</label>
//             <input
//               className={field}
//               type="password"
//               autoComplete="new-password"
//               placeholder="Repeat the new password"
//               value={confirmPw}
//               onChange={(e) => setConfirmPw(e.target.value)}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:opacity-50"
//           >
//             {loading ? 'Resetting…' : 'Reset password'}
//           </button>

//           <button
//             type="button"
//             className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
//             onClick={onBack}
//           >
//             ← Back to sign in
//           </button>
//         </form>
//       )}
//     </div>
//   );
// }

// // ─── Main login page ──────────────────────────────────────────────────────────
// export default function Login() {
//   const { login, isAuthenticated, user } = useAuth();
//   const [email, setEmail]       = useState('');
//   const [password, setPassword] = useState('');
//   const [err, setErr]           = useState('');
//   const [showForgot, setShowForgot] = useState(false);
//   const nav = useNavigate();

//   if (isAuthenticated && user) {
//     return <Navigate to={`/${user.role}/dashboard`} replace />;
//   }

//   async function onSubmit(e) {
//     e.preventDefault();
//     setErr('');
//     try {
//       const data = await login(email, password);
//       if (!data?.success) { setErr(data?.message || 'Login failed'); return; }
//       nav(`/${data.user.role}/dashboard`, { replace: true });
//     } catch (ex) {
//       setErr(ex.response?.data?.message || 'Login failed');
//     }
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 p-4">
//       {showForgot ? (
//         <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
//       ) : (
//         <div className="w-full max-w-md rounded-2xl bg-white p-8 text-base shadow-xl">
//           <div className="flex flex-col items-center gap-2">
//             <img src={HOSPITAL.logo} alt="Multicare Hospital logo" className="h-20 w-20 object-contain" />
//             <h1 className="text-center text-xl font-bold text-slate-800">{HOSPITAL.name}</h1>
//             <p className="text-center text-xs italic text-slate-500">{HOSPITAL.tagline}</p>
//           </div>
//           <p className="mt-4 text-center text-sm font-medium text-slate-600">Staff Sign In</p>
//           <form className="mt-8 space-y-4" onSubmit={onSubmit}>
//             {err && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}
//             <div>
//               <label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</label>
//               <input
//                 id="login-email"
//                 className={field}
//                 type="email"
//                 autoComplete="username"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div>
//               <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
//               <input
//                 id="login-password"
//                 className={field}
//                 type="password"
//                 autoComplete="current-password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//               <button
//                 type="button"
//                 className="mt-1 text-xs text-hospital-800 underline hover:text-hospital-900"
//                 onClick={() => setShowForgot(true)}
//               >
//                 Forgot password?
//               </button>
//             </div>
//             <button
//               type="submit"
//               className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900"
//             >
//               Sign in
//             </button>
//           </form>
//           <p className="mt-6 text-center text-sm text-slate-600">
//             New staff?{' '}
//             <Link className="text-hospital-800 underline" to="/register">
//               Register
//             </Link>
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }


import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { HOSPITAL } from "../config/hospital.js";

const field =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-hospital-600";

/* -------------------------------------------------------------------------- */
/* Forgot Password                                                            */
/* -------------------------------------------------------------------------- */

function ForgotPasswordPanel({ onBack }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();

    setErr("");
    setSuccess("");

    if (!email.trim()) {
      setErr("Please enter your email address.");
      return;
    }

    if (!code.trim()) {
      setErr("Please enter the reset code.");
      return;
    }

    if (newPw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    if (newPw !== confirmPw) {
      setErr("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      console.log("PASSWORD RESET REQUEST");
      console.log("Email:", email.trim().toLowerCase());

      const response = await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        code: code.trim().toUpperCase(),
        new_password: newPw,
        confirm_password: confirmPw,
      });

      const data = response.data;

      console.log("PASSWORD RESET RESPONSE:", data);

      if (data?.success) {
        setSuccess(
          data.message ||
            "Password changed successfully. You can now sign in."
        );

        setEmail("");
        setCode("");
        setNewPw("");
        setConfirmPw("");
      } else {
        setErr(data?.message || "Password reset failed.");
      }
    } catch (ex) {
      console.error("PASSWORD RESET ERROR:", ex);

      const status = ex.response?.status;
      const serverMessage = ex.response?.data?.message;

      if (serverMessage) {
        setErr(serverMessage);
      } else if (status) {
        setErr(
          `Password reset failed. Server returned HTTP ${status}.`
        );
      } else {
        setErr(
          "Unable to contact the server. Please check your internet connection."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-base shadow-xl">
      <div className="flex flex-col items-center gap-2">
        <img
          src={HOSPITAL.logo}
          alt="Multicare Hospital logo"
          className="h-16 w-16 object-contain"
        />

        <h1 className="text-center text-xl font-bold text-slate-800">
          Reset your password
        </h1>

        <p className="text-center text-xs text-slate-500">
          Ask your administrator to generate a reset code, then enter it
          below.
        </p>
      </div>

      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            ✔ {success}
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900"
            onClick={onBack}
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={onSubmit}
        >
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Your email address
            </label>

            <input
              className={field}
              type="email"
              autoComplete="email"
              placeholder="staff@multicare.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Reset code
            </label>

            <p className="mb-1 text-xs text-slate-500">
              Contact your administrator. The reset code expires in 2
              minutes.
            </p>

            <input
              className={`${field} font-mono uppercase tracking-widest`}
              type="text"
              placeholder="e.g. AB3K7MX2"
              maxLength={8}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase())
              }
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              New password
            </label>

            <input
              className={field}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Confirm new password
            </label>

            <input
              className={field}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat the new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>

          <button
            type="button"
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={onBack}
          >
            ← Back to sign in
          </button>
        </form>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Login Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);

  const nav = useNavigate();

  /* ------------------------------------------------------------------------ */
  /* Already authenticated                                                    */
  /* ------------------------------------------------------------------------ */

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={`/${user.role}/dashboard`}
        replace
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Login                                                                     */
  /* ------------------------------------------------------------------------ */

  async function onSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setErr("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErr("Please enter your email address.");
      return;
    }

    if (!password) {
      setErr("Please enter your password.");
      return;
    }

    setLoading(true);

    console.log("======================================");
    console.log("LOGIN REQUEST");
    console.log("Email:", cleanEmail);
    console.log(
      "API:",
      import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
    );
    console.log("======================================");

    try {
      const data = await login(
        cleanEmail,
        password
      );

      console.log("LOGIN RESPONSE:", data);

      if (!data?.success) {
        setErr(
          data?.message ||
            "Login failed. Please check your credentials."
        );
        return;
      }

      if (!data?.user) {
        setErr(
          "Login succeeded, but the server did not return user information."
        );
        return;
      }

      console.log(
        "LOGIN SUCCESS:",
        data.user
      );

      /*
       * Navigate using the role returned by the backend.
       */
      nav(
        `/${data.user.role}/dashboard`,
        {
          replace: true,
        }
      );
    } catch (ex) {
      console.error(
        "======================================"
      );

      console.error(
        "LOGIN ERROR"
      );

      console.error(ex);

      console.error(
        "Status:",
        ex.response?.status
      );

      console.error(
        "Response:",
        ex.response?.data
      );

      console.error(
        "======================================"
      );

      /*
       * Show the actual backend message.
       */

      if (ex.response?.data?.message) {
        setErr(
          ex.response.data.message
        );
      } else if (
        ex.response?.status === 401
      ) {
        setErr(
          "Invalid email or password."
        );
      } else if (
        ex.response?.status === 403
      ) {
        setErr(
          "Your account is not approved or has been deactivated."
        );
      } else if (
        ex.response?.status === 500
      ) {
        setErr(
          "The hospital server encountered an internal error. Please check the server logs."
        );
      } else if (!ex.response) {
        setErr(
          "Unable to contact the hospital server. Please check your internet connection."
        );
      } else {
        setErr(
          `Login failed. Server returned HTTP ${ex.response.status}.`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Forgot Password                                                           */
  /* ------------------------------------------------------------------------ */

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 p-4">
        <ForgotPasswordPanel
          onBack={() => {
            setShowForgot(false);
            setErr("");
          }}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-base shadow-xl">

        {/* Hospital Logo */}
        <div className="flex flex-col items-center gap-2">
          <img
            src={HOSPITAL.logo}
            alt="Multicare Hospital logo"
            className="h-20 w-20 object-contain"
          />

          <h1 className="text-center text-xl font-bold text-slate-800">
            {HOSPITAL.name}
          </h1>

          <p className="text-center text-xs italic text-slate-500">
            {HOSPITAL.tagline}
          </p>
        </div>

        <p className="mt-4 text-center text-sm font-medium text-slate-600">
          Staff Sign In
        </p>

        {/* Login Form */}
        <form
          className="mt-8 space-y-4"
          onSubmit={onSubmit}
        >
          {/* Error */}
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="font-semibold">
                Login failed
              </div>

              <div className="mt-1">
                {err}
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="login-email"
              className={field}
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="login-password"
              className={field}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              required
            />

            <button
              type="button"
              disabled={loading}
              className="mt-1 text-xs text-hospital-800 underline hover:text-hospital-900 disabled:opacity-50"
              onClick={() => {
                setErr("");
                setShowForgot(true);
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-slate-600">
          New staff?{" "}
          <Link
            className="text-hospital-800 underline"
            to="/register"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
