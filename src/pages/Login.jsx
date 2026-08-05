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

/* ========================================================================== */
/* FORGOT PASSWORD                                                            */
/* ========================================================================== */

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
      setErr("Please enter your email.");
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
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      console.log("======================================");
      console.log("PASSWORD RESET REQUEST");
      console.log("Email:", email.trim().toLowerCase());
      console.log("======================================");

      const response = await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        code: code.trim().toUpperCase(),
        new_password: newPw,
        confirm_password: confirmPw,
      });

      console.log("PASSWORD RESET RESPONSE:");
      console.log(response.data);

      if (response.data?.success) {
        setSuccess(
          response.data.message ||
            "Password changed successfully. You can now log in."
        );

        setEmail("");
        setCode("");
        setNewPw("");
        setConfirmPw("");
      } else {
        setErr(
          response.data?.message ||
            "Password reset failed."
        );
      }
    } catch (error) {
      console.error("PASSWORD RESET ERROR:", error);

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      console.error(
        "Message:",
        error.message
      );

      if (error.response?.data?.message) {
        setErr(error.response.data.message);
      } else if (error.response?.status) {
        setErr(
          `Password reset failed. HTTP ${error.response.status}`
        );
      } else {
        setErr(
          error.message ||
            "Unable to contact the server."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

      <div className="flex flex-col items-center gap-2">
        <img
          src={HOSPITAL.logo}
          alt="Hospital logo"
          className="h-16 w-16 object-contain"
        />

        <h1 className="text-center text-xl font-bold text-slate-800">
          Reset your password
        </h1>

        <p className="text-center text-xs text-slate-500">
          Ask your administrator for a reset code.
        </p>
      </div>

      {success ? (
        <div className="mt-6 space-y-4">

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            ✔ {success}
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900"
          >
            Back to sign in
          </button>

        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4"
        >

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              className={field}
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="staff@multicare.co.ke"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Reset code
            </label>

            <input
              className={`${field} font-mono uppercase tracking-widest`}
              type="text"
              maxLength={8}
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="AB3K7MX2"
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
              value={newPw}
              onChange={(e) =>
                setNewPw(e.target.value)
              }
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Confirm password
            </label>

            <input
              className={field}
              type="password"
              value={confirmPw}
              onChange={(e) =>
                setConfirmPw(e.target.value)
              }
              placeholder="Repeat password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:opacity-50"
          >
            {loading
              ? "Resetting..."
              : "Reset password"}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to sign in
          </button>

        </form>
      )}
    </div>
  );
}

/* ========================================================================== */
/* LOGIN PAGE                                                                 */
/* ========================================================================== */

export default function Login() {
  const {
    login,
    isAuthenticated,
    user,
  } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgot, setShowForgot] =
    useState(false);

  /* ------------------------------------------------------------------------ */
  /* Already logged in                                                        */
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
  /* LOGIN                                                                     */
  /* ------------------------------------------------------------------------ */

  async function handleLogin(e) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    console.log("======================================");
    console.log("HMS LOGIN TEST");
    console.log("======================================");

    console.log("Email:", cleanEmail);

    console.log(
      "API:",
      import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
    );

    console.log(
      "Backend login URL:",
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
      }/auth/login`
    );

    console.log("======================================");

    try {
      const data = await login(
        cleanEmail,
        password
      );

      console.log("======================================");
      console.log("LOGIN RESPONSE RECEIVED");
      console.log("======================================");

      console.log(data);

      if (!data) {
        setError(
          "The server returned an empty response."
        );
        return;
      }

      if (!data.success) {
        setError(
          data.message ||
            "Login failed."
        );
        return;
      }

      if (!data.user) {
        setError(
          "Login succeeded but no user information was returned."
        );
        return;
      }

      console.log(
        "LOGIN SUCCESSFUL"
      );

      console.log(
        "User:",
        data.user
      );

      console.log(
        "Role:",
        data.user.role
      );

      console.log(
        "Redirecting..."
      );

      navigate(
        `/${data.user.role}/dashboard`,
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error("======================================");
      console.error("LOGIN FAILED");
      console.error("======================================");

      console.error(
        "Error:",
        error
      );

      console.error(
        "Error name:",
        error.name
      );

      console.error(
        "Error message:",
        error.message
      );

      console.error(
        "HTTP status:",
        error.response?.status
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      console.error(
        "Request URL:",
        error.config?.url
      );

      console.error(
        "Base URL:",
        error.config?.baseURL
      );

      console.error(
        "Full URL:",
        error.config
          ? `${error.config.baseURL}${error.config.url}`
          : "Unknown"
      );

      console.error("======================================");

      /* -------------------------------------------------------------------- */
      /* Show the actual error                                                */
      /* -------------------------------------------------------------------- */

      if (
        error.code ===
        "ECONNABORTED"
      ) {
        setError(
          "The hospital server did not respond within 30 seconds. This is a backend/database timeout, not an internet connection problem."
        );
      } else if (
        error.code ===
        "ERR_NETWORK"
      ) {
        setError(
          "The browser could not reach the hospital server."
        );
      } else if (
        error.response?.status === 400
      ) {
        setError(
          error.response?.data?.message ||
            "Invalid login request."
        );
      } else if (
        error.response?.status === 401
      ) {
        setError(
          error.response?.data?.message ||
            "Invalid email or password."
        );
      } else if (
        error.response?.status === 403
      ) {
        setError(
          error.response?.data?.message ||
            "Your account has not been approved or is inactive."
        );
      } else if (
        error.response?.status === 500
      ) {
        setError(
          error.response?.data?.message ||
            "The hospital server encountered an internal error."
        );
      } else if (
        error.response?.status
      ) {
        setError(
          error.response?.data?.message ||
            `Server returned HTTP ${error.response.status}.`
        );
      } else {
        setError(
          error.message ||
            "Login failed."
        );
      }

    } finally {
      setLoading(false);

      console.log(
        "LOGIN LOADING COMPLETE"
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Forgot password                                                          */
  /* ------------------------------------------------------------------------ */

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 p-4">

        <ForgotPasswordPanel
          onBack={() => {
            setShowForgot(false);
            setError("");
          }}
        />

      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* LOGIN UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Hospital logo */}

        <div className="flex flex-col items-center gap-2">

          <img
            src={HOSPITAL.logo}
            alt="Hospital logo"
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

        {/* Error */}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <div className="font-bold">
              Login failed
            </div>

            <div className="mt-1">
              {error}
            </div>

          </div>
        )}

        {/* Form */}

        <form
          className="mt-6 space-y-4"
          onSubmit={handleLogin}
        >

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
              placeholder="staff@multicare.co.ke"
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
              className="mt-1 text-xs text-hospital-800 underline hover:text-hospital-900"
              onClick={() => {
                setError("");
                setShowForgot(true);
              }}
              disabled={loading}
            >
              Forgot password?
            </button>

          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-hospital-800 py-2.5 font-medium text-white hover:bg-hospital-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Testing server..."
              : "Sign in"}
          </button>

        </form>

        {/* Registration */}

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
