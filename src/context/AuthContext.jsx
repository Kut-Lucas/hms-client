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


import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import client from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // ==================================================
  // RESTORE LOGIN SESSION
  // ==================================================
  useEffect(() => {
    const restoreSession = () => {
      try {
        const token = localStorage.getItem("accessToken");
        const user = localStorage.getItem("user");

        if (!token || !user) {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          return;
        }

        const parsedUser = JSON.parse(user);

        client.defaults.headers.common.Authorization = `Bearer ${token}`;

        setAuthState({
          user: parsedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        console.log("[AUTH] Session restored");
      } catch (error) {
        console.error("[AUTH] Failed to restore session:", error);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        delete client.defaults.headers.common.Authorization;

        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    restoreSession();
  }, []);

  // ==================================================
  // LOGIN
  // ==================================================
  const login = async (email, password) => {
    console.log("======================================");
    console.log("HMS LOGIN");
    console.log("======================================");
    console.log("Email:", email);
    console.log("Endpoint: /auth/login");
    console.log("======================================");

    try {
      // ----------------------------------------------
      // Validate input
      // ----------------------------------------------
      if (!email || !email.trim()) {
        throw new Error("Please enter your email address.");
      }

      if (!password) {
        throw new Error("Please enter your password.");
      }

      const cleanEmail = email.trim().toLowerCase();

      // ----------------------------------------------
      // LOGIN
      // ----------------------------------------------
      console.log("[AUTH] Sending login request...");

      const response = await client.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      console.log("[AUTH] Login response:", response.data);

      // ----------------------------------------------
      // Validate backend response
      // ----------------------------------------------
      const { accessToken, user } = response.data || {};

      if (!accessToken) {
        console.error(
          "[AUTH] Backend did not return accessToken:",
          response.data
        );

        throw new Error(
          "Login succeeded but the server did not return an access token."
        );
      }

      if (!user) {
        console.error(
          "[AUTH] Backend did not return user:",
          response.data
        );

        throw new Error(
          "Login succeeded but the server did not return user information."
        );
      }

      // ----------------------------------------------
      // Save authentication
      // ----------------------------------------------
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      client.defaults.headers.common.Authorization =
        `Bearer ${accessToken}`;

      setAuthState({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("======================================");
      console.log("LOGIN SUCCESS");
      console.log("User:", user);
      console.log("======================================");

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error("======================================");
      console.error("LOGIN FAILED");
      console.error("======================================");

      console.error("Error:", error);
      console.error("Name:", error.name);
      console.error("Code:", error.code);
      console.error("Message:", error.message);

      console.error("HTTP Status:", error.response?.status);
      console.error("Server Response:", error.response?.data);
      console.error("Request URL:", error.config?.url);
      console.error("Base URL:", error.config?.baseURL);

      console.error("======================================");

      // ----------------------------------------------
      // Backend returned an HTTP error
      // ----------------------------------------------
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        if (status === 400) {
          throw new Error(
            serverMessage || "Please check the information you entered."
          );
        }

        if (status === 401) {
          throw new Error(
            serverMessage || "Invalid email or password."
          );
        }

        if (status === 403) {
          throw new Error(
            serverMessage ||
              "Your account does not currently have permission to log in."
          );
        }

        if (status === 404) {
          throw new Error(
            serverMessage || "Login service was not found."
          );
        }

        if (status === 500) {
          throw new Error(
            serverMessage ||
              "The hospital server encountered an internal error. Please try again."
          );
        }

        if (status === 502 || status === 503) {
          throw new Error(
            "The hospital server is temporarily unavailable. Please wait a moment and try again."
          );
        }

        throw new Error(
          serverMessage ||
            `Server returned HTTP ${status}. Please try again.`
        );
      }

      // ----------------------------------------------
      // Timeout
      // ----------------------------------------------
      if (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT"
      ) {
        throw new Error(
          "The hospital server is taking too long to respond. It may be waking up. Please wait a moment and try again."
        );
      }

      // ----------------------------------------------
      // Network error
      // ----------------------------------------------
      if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error"
      ) {
        throw new Error(
          "Unable to connect to the hospital server. Please check your internet connection and try again."
        );
      }

      // ----------------------------------------------
      // Normal JavaScript error
      // ----------------------------------------------
      throw error;
    }
  };

  // ==================================================
  // LOGOUT
  // ==================================================
  const logout = async () => {
    console.log("[AUTH] Logging out...");

    try {
      await client.post("/auth/logout");
    } catch (error) {
      console.warn(
        "[AUTH] Logout request failed:",
        error.response?.data || error.message
      );
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      delete client.defaults.headers.common.Authorization;

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      console.log("[AUTH] Logout complete");
    }
  };

  // ==================================================
  // REFRESH TOKEN
  // ==================================================
  const refreshToken = async () => {
    console.log("[AUTH] Refreshing token...");

    try {
      const response = await client.post("/auth/refresh");

      const { accessToken, user } = response.data || {};

      if (!accessToken || !user) {
        throw new Error("Invalid refresh response.");
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      client.defaults.headers.common.Authorization =
        `Bearer ${accessToken}`;

      setAuthState({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("[AUTH] Token refreshed");

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error(
        "[AUTH] Token refresh failed:",
        error.response?.data || error.message
      );

      await logout();

      return {
        success: false,
      };
    }
  };

  // ==================================================
  // CONTEXT VALUE
  // ==================================================
  const value = {
    ...authState,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ====================================================
// useAuth
// ====================================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
};
