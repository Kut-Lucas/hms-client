// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import {
//   api,
//   setAccessToken,
// } from "../api/client.js";

// const AuthContext =
//   createContext(null);

// export function AuthProvider({
//   children,
// }) {
//   const [user, setUser] =
//     useState(null);

//   const [loading, setLoading] =
//     useState(true);

//   /*
//   |--------------------------------------------------------------------------
//   | LOAD CURRENT USER
//   |--------------------------------------------------------------------------
//   */

//   const loadMe =
//     useCallback(async () => {
//       const token =
//         localStorage.getItem(
//           "accessToken"
//         );

//       if (!token) {
//         setUser(null);
//         setLoading(false);
//         return;
//       }

//       try {
//         const { data } =
//           await api.get(
//             "/auth/me"
//           );

//         if (
//           data?.success &&
//           data?.user
//         ) {
//           setUser(data.user);
//         } else {
//           setUser(null);
//           setAccessToken(null);
//         }

//       } catch (error) {
//         console.warn(
//           "Authentication check failed. Trying refresh..."
//         );

//         try {
//           const { data } =
//             await api.post(
//               "/auth/refresh"
//             );

//           if (
//             data?.accessToken
//           ) {
//             setAccessToken(
//               data.accessToken
//             );

//             const me =
//               await api.get(
//                 "/auth/me"
//               );

//             if (
//               me.data?.success &&
//               me.data?.user
//             ) {
//               setUser(
//                 me.data.user
//               );
//             } else {
//               setUser(null);
//               setAccessToken(null);
//             }

//           } else {
//             setUser(null);
//             setAccessToken(null);
//           }

//         } catch (refreshError) {
//           console.error(
//             "Refresh failed:",
//             refreshError
//           );

//           setUser(null);
//           setAccessToken(null);
//         }
//       } finally {
//         setLoading(false);
//       }
//     }, []);

//   /*
//   |--------------------------------------------------------------------------
//   | INITIAL AUTH CHECK
//   |--------------------------------------------------------------------------
//   */

//   useEffect(() => {
//     loadMe();
//   }, [loadMe]);

//   /*
//   |--------------------------------------------------------------------------
//   | LOGIN
//   |--------------------------------------------------------------------------
//   */

//   const login = async (
//     email,
//     password
//   ) => {
//     try {
//       console.log(
//         "======================================"
//       );

//       console.log(
//         "LOGIN REQUEST"
//       );

//       console.log(
//         "Email:",
//         email
//       );

//       console.log(
//         "API:",
//         api.defaults.baseURL
//       );

//       console.log(
//         "======================================"
//       );

//       const { data } =
//         await api.post(
//           "/auth/login",
//           {
//             email,
//             password,
//           }
//         );

//       console.log(
//         "LOGIN RESPONSE:",
//         data
//       );

//       if (
//         data?.accessToken
//       ) {
//         setAccessToken(
//           data.accessToken
//         );
//       }

//       if (data?.user) {
//         setUser(data.user);
//       }

//       return data;

//     } catch (error) {
//       console.error(
//         "======================================"
//       );

//       console.error(
//         "LOGIN FAILED"
//       );

//       console.error(
//         "======================================"
//       );

//       console.error(
//         "Status:",
//         error.response?.status
//       );

//       console.error(
//         "Response:",
//         error.response?.data
//       );

//       console.error(
//         "URL:",
//         error.config?.url
//       );

//       console.error(
//         "Base URL:",
//         error.config?.baseURL
//       );

//       console.error(
//         "Message:",
//         error.message
//       );

//       throw error;
//     }
//   };

//   /*
//   |--------------------------------------------------------------------------
//   | LOGOUT
//   |--------------------------------------------------------------------------
//   */

//   const logout =
//     async () => {
//       try {
//         await api.post(
//           "/auth/logout"
//         );
//       } catch (error) {
//         console.warn(
//           "Logout failed:",
//           error.message
//         );
//       }

//       setAccessToken(null);
//       setUser(null);
//     };

//   /*
//   |--------------------------------------------------------------------------
//   | CONTEXT
//   |--------------------------------------------------------------------------
//   */

//   const value =
//     useMemo(
//       () => ({
//         user,
//         loading,
//         isAuthenticated:
//           !!user,
//         login,
//         logout,
//         refreshUser:
//           loadMe,
//       }),
//       [
//         user,
//         loading,
//         loadMe,
//       ]
//     );

//   return (
//     <AuthContext.Provider
//       value={value}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx =
//     useContext(
//       AuthContext
//     );

//   if (!ctx) {
//     throw new Error(
//       "useAuth outside provider"
//     );
//   }

//   return ctx;
// }

import React, { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client"; // adjust path to your client.js

const API_URL =
  process.env.REACT_APP_API_URL || "https://hms-server-odkt.onrender.com/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount, restore token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setAuthState({
          user: parsedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e) {
        console.error("Failed to restore auth state", e);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email, password) => {
    console.log("======================================");
    console.log("LOGIN REQUEST");
    console.log("Email:", email);
    console.log("API:", API_URL);
    console.log("======================================");

    try {
      // --- Warm up the server (health check) to wake it from cold start ---
      try {
        await client.get("/health", { timeout: 5000 });
        console.log("[HEALTH] Server responded quickly");
      } catch (pingError) {
        // Ignore – the server might still be waking up, and the actual login will retry
        console.log(
          "[HEALTH] Ping failed or timed out – server may be waking up",
        );
      }

      // --- Actual login request ---
      const response = await client.post("/auth/login", { email, password });

      const { accessToken, user } = response.data;

      // Save token and user
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      // Set axios default header
      client.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setAuthState({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("LOGIN SUCCESS");
      return { success: true, user };
    } catch (error) {
      console.log("======================================");
      console.log("LOGIN FAILED");
      console.log("======================================");
      console.log("Status:", error.response?.status);
      console.log("Response:", error.response?.data);
      console.log("URL:", error.config?.url);
      console.log("Base URL:", error.config?.baseURL);
      console.log("Message:", error.message);
      console.log("======================================");

      let errorMessage = "Login failed. Please try again.";
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage =
          "The server is waking up. Please wait a moment and try again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await client.post("/auth/logout");
    } catch (e) {
      console.error("Logout API error:", e);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      delete client.defaults.headers.common["Authorization"];
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshToken = async () => {
    try {
      const response = await client.post("/auth/refresh");
      const { accessToken, user } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      client.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setAuthState({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      console.error("Refresh token failed:", error);
      logout();
      return { success: false };
    }
  };

  const value = {
    ...authState,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};