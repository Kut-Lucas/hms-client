// import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// import { api, setAccessToken } from '../api/client.js';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const loadMe = useCallback(async () => {
//     const token = localStorage.getItem('accessToken');
//     if (!token) {
//       setUser(null);
//       setLoading(false);
//       return;
//     }
//     try {
//       const { data } = await api.get('/auth/me');
//       if (data?.success) setUser(data.user);
//       else setUser(null);
//     } catch {
//       try {
//         const { data } = await api.post('/auth/refresh');
//         if (data?.accessToken) {
//           setAccessToken(data.accessToken);
//           const me = await api.get('/auth/me');
//           if (me.data?.success) setUser(me.data.user);
//           else setUser(null);
//         } else setUser(null);
//       } catch {
//         setUser(null);
//         setAccessToken(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadMe();
//   }, [loadMe]);

//   const login = async (email, password) => {
//     const { data } = await api.post('/auth/login', { email, password });
//     if (data?.accessToken) {
//       setAccessToken(data.accessToken);
//       setUser(data.user);
//     }
//     return data;
//   };

//   const logout = async () => {
//     try {
//       await api.post('/auth/logout');
//     } catch {
//       /* ignore */
//     }
//     setAccessToken(null);
//     setUser(null);
//   };

//   const value = useMemo(
//     () => ({
//       user,
//       loading,
//       isAuthenticated: !!user,
//       login,
//       logout,
//       refreshUser: loadMe,
//     }),
//     [user, loading, loadMe]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth outside provider');
//   return ctx;
// }


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, setAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // LOAD CURRENT USER
  // --------------------------------------------------

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("accessToken");

    // No token means user is not logged in
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log("Checking current authenticated user...");

      const { data } = await api.get("/auth/me");

      if (data?.success && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setAccessToken(null);
      }

    } catch (error) {
      console.warn(
        "Current token is invalid or expired. Attempting refresh..."
      );

      try {
        const { data } = await api.post("/auth/refresh");

        if (data?.accessToken) {
          setAccessToken(data.accessToken);

          const meResponse = await api.get("/auth/me");

          if (
            meResponse.data?.success &&
            meResponse.data?.user
          ) {
            setUser(meResponse.data.user);
          } else {
            setUser(null);
            setAccessToken(null);
          }

        } else {
          setUser(null);
          setAccessToken(null);
        }

      } catch (refreshError) {
        console.error(
          "Unable to refresh authentication:",
          refreshError
        );

        setUser(null);
        setAccessToken(null);
      }

    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // INITIAL AUTHENTICATION CHECK
  // --------------------------------------------------

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const login = async (email, password) => {
    try {
      console.log("=================================");
      console.log("HMS LOGIN");
      console.log("Email:", email);
      console.log("API:", api.defaults.baseURL);
      console.log("=================================");

      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("Login response:", data);

      if (data?.accessToken) {
        setAccessToken(data.accessToken);
      }

      if (data?.user) {
        setUser(data.user);
      }

      return data;

    } catch (error) {
      console.error("=================================");
      console.error("HMS LOGIN FAILED");
      console.error("=================================");

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
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
        error.config?.baseURL
          ? `${error.config.baseURL}${error.config.url}`
          : "Unknown"
      );

      console.error(
        "Error:",
        error.message
      );

      throw error;
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn(
        "Logout request failed:",
        error.message
      );
    }

    setAccessToken(null);
    setUser(null);
  };

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: loadMe,
    }),
    [user, loading, loadMe]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// --------------------------------------------------
// USE AUTH HOOK
// --------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth outside provider");
  }

  return ctx;
}

