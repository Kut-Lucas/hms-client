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


// src/context/AuthContext.jsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import client from "../api/client";

const AuthContext = createContext(null);

/*
|--------------------------------------------------------------------------
| AUTH PROVIDER
|--------------------------------------------------------------------------
*/

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /*
  |--------------------------------------------------------------------------
  | RESTORE LOGIN SESSION
  |--------------------------------------------------------------------------
  */

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

        client.defaults.headers.common.Authorization =
          `Bearer ${token}`;

        setAuthState({
          user: parsedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        console.log("[AUTH] Session restored");
      } catch (error) {
        console.error(
          "[AUTH] Failed to restore session:",
          error
        );

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

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    console.log("======================================");
    console.log("HMS LOGIN");
    console.log("======================================");
    console.log("Email:", cleanEmail);
    console.log(
      "API:",
      client.defaults.baseURL
    );
    console.log("Endpoint:", "/auth/login");
    console.log("======================================");

    try {
      const startTime = Date.now();

      /*
      |--------------------------------------------------------------------------
      | LOGIN REQUEST
      |--------------------------------------------------------------------------
      */

      const response = await client.post(
        "/auth/login",
        {
          email: cleanEmail,
          password,
        },
        {
          timeout: 30000,
        }
      );

      const elapsed =
        Date.now() - startTime;

      console.log(
        `[LOGIN] Server responded in ${elapsed}ms`
      );

      console.log(
        "[LOGIN] Response:",
        response.data
      );

      /*
      |--------------------------------------------------------------------------
      | EXTRACT RESPONSE
      |--------------------------------------------------------------------------
      */

      const {
        accessToken,
        token,
        user,
      } = response.data;

      const finalToken =
        accessToken || token;

      /*
      |--------------------------------------------------------------------------
      | VALIDATE SERVER RESPONSE
      |--------------------------------------------------------------------------
      */

      if (!finalToken) {
        console.error(
          "[LOGIN] Server did not return an access token"
        );

        throw new Error(
          "Login succeeded but the server did not return an authentication token."
        );
      }

      if (!user) {
        console.error(
          "[LOGIN] Server did not return user information"
        );

        throw new Error(
          "Login succeeded but no user information was returned."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE SESSION
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(
        "accessToken",
        finalToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      client.defaults.headers.common.Authorization =
        `Bearer ${finalToken}`;

      /*
      |--------------------------------------------------------------------------
      | UPDATE AUTH STATE
      |--------------------------------------------------------------------------
      */

      setAuthState({
        user,
        token: finalToken,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("======================================");
      console.log("LOGIN SUCCESS");
      console.log("User:", user);
      console.log(
        "Time:",
        `${elapsed}ms`
      );
      console.log("======================================");

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error("======================================");
      console.error("LOGIN FAILED");
      console.error("======================================");

      console.error(
        "Error name:",
        error.name
      );

      console.error(
        "Error code:",
        error.code
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "URL:",
        error.config?.url
      );

      console.error(
        "Base URL:",
        error.config?.baseURL
      );

      console.error(
        "HTTP status:",
        error.response?.status
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      console.error("======================================");

      /*
      |--------------------------------------------------------------------------
      | USER-FRIENDLY ERROR
      |--------------------------------------------------------------------------
      */

      let message =
        "Unable to login. Please try again.";

      if (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        error.message?.toLowerCase().includes("timeout")
      ) {
        message =
          "The server took too long to respond. Please try again in a few seconds.";
      } else if (
        error.response?.status === 401
      ) {
        message =
          error.response?.data?.message ||
          "Invalid email or password.";
      } else if (
        error.response?.status === 403
      ) {
        message =
          error.response?.data?.message ||
          "Your account is not allowed to login.";
      } else if (
        error.response?.status >= 500
      ) {
        message =
          "The hospital server encountered an error. Please try again.";
      } else if (
        error.response?.data?.message
      ) {
        message =
          error.response.data.message;
      }

      throw new Error(message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = async () => {
    try {
      await client.post(
        "/auth/logout",
        {},
        {
          timeout: 10000,
        }
      );
    } catch (error) {
      console.warn(
        "[LOGOUT] Server logout failed:",
        error.message
      );
    } finally {
      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem("user");

      delete client.defaults.headers.common.Authorization;

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      console.log(
        "[AUTH] Logged out"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH TOKEN
  |--------------------------------------------------------------------------
  */

  const refreshToken = async () => {
    try {
      const response =
        await client.post(
          "/auth/refresh",
          {},
          {
            timeout: 15000,
          }
        );

      const {
        accessToken,
        token,
        user,
      } = response.data;

      const finalToken =
        accessToken || token;

      if (!finalToken) {
        throw new Error(
          "No authentication token returned."
        );
      }

      localStorage.setItem(
        "accessToken",
        finalToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      client.defaults.headers.common.Authorization =
        `Bearer ${finalToken}`;

      setAuthState({
        user,
        token: finalToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error(
        "[AUTH] Refresh failed:",
        error
      );

      await logout();

      return {
        success: false,
      };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

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

/*
|--------------------------------------------------------------------------
| USE AUTH
|--------------------------------------------------------------------------
*/

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
