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
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | LOAD SAVED USER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("hms_user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);

        console.log("[AUTH] Saved user loaded:", parsedUser);
      }
    } catch (error) {
      console.error(
        "[AUTH] Failed to load saved user:",
        error
      );

      localStorage.removeItem("user");
      localStorage.removeItem("hms_user");
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const login = useCallback(
    async (email, password, rememberMe = false) => {
      console.log("======================================");
      console.log("HMS LOGIN");
      console.log("Email:", email);
      console.log("Endpoint: /auth/login");
      console.log("======================================");

      try {
        /*
        |--------------------------------------------------------------------------
        | Validate input
        |--------------------------------------------------------------------------
        */

        if (!email || !email.trim()) {
          throw new Error(
            "Please enter your email address."
          );
        }

        if (!password) {
          throw new Error(
            "Please enter your password."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Send login request
        |--------------------------------------------------------------------------
        */

        console.log(
          "[AUTH] Sending login request..."
        );

        const response = await api.post(
          "/auth/login",
          {
            email: email.trim().toLowerCase(),
            password: password,
          }
        );

        console.log(
          "[AUTH] Login response:",
          response.data
        );

        const data = response.data;

        /*
        |--------------------------------------------------------------------------
        | Check backend response
        |--------------------------------------------------------------------------
        */

        if (!data) {
          throw new Error(
            "The server returned an empty response."
          );
        }

        if (data.success === false) {
          throw new Error(
            data.message ||
              "Login failed. Please check your credentials."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Find returned user
        |--------------------------------------------------------------------------
        */

        const loggedInUser =
          data.user ||
          data.data?.user ||
          data.account ||
          data.data?.account ||
          null;

        /*
        |--------------------------------------------------------------------------
        | Find returned token
        |--------------------------------------------------------------------------
        */

        const token =
          data.token ||
          data.accessToken ||
          data.data?.token ||
          data.data?.accessToken ||
          null;

        /*
        |--------------------------------------------------------------------------
        | Save authentication token
        |--------------------------------------------------------------------------
        */

        if (token) {
          localStorage.setItem(
            "token",
            token
          );

          localStorage.setItem(
            "hms_token",
            token
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Save user
        |--------------------------------------------------------------------------
        */

        if (loggedInUser) {
          localStorage.setItem(
            "user",
            JSON.stringify(loggedInUser)
          );

          localStorage.setItem(
            "hms_user",
            JSON.stringify(loggedInUser)
          );

          setUser(loggedInUser);
        }

        /*
        |--------------------------------------------------------------------------
        | Remember Me
        |--------------------------------------------------------------------------
        */

        localStorage.setItem(
          "rememberMe",
          rememberMe ? "true" : "false"
        );

        /*
        |--------------------------------------------------------------------------
        | Successful login
        |--------------------------------------------------------------------------
        */

        console.log("======================================");
        console.log("LOGIN SUCCESS");
        console.log("User:", loggedInUser);
        console.log(
          "Has token:",
          Boolean(token)
        );
        console.log("======================================");

        return {
          success: true,
          user: loggedInUser,
          token: token,
          data: data,
        };
      } catch (error) {
        /*
        |--------------------------------------------------------------------------
        | LOGIN ERROR
        |--------------------------------------------------------------------------
        */

        console.error("======================================");
        console.error("LOGIN FAILED");
        console.error("======================================");

        console.error("Error:", error);
        console.error(
          "Name:",
          error?.name
        );
        console.error(
          "Code:",
          error?.code
        );
        console.error(
          "Message:",
          error?.message
        );

        /*
        |--------------------------------------------------------------------------
        | Axios error details
        |--------------------------------------------------------------------------
        */

        if (error?.response) {
          console.error(
            "HTTP Status:",
            error.response.status
          );

          console.error(
            "Server Response:",
            error.response.data
          );

          console.error(
            "Request URL:",
            error.config?.url
          );

          console.error(
            "Base URL:",
            error.config?.baseURL
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Convert server error into useful message
        |--------------------------------------------------------------------------
        */

        let message =
          "The hospital server encountered an error. Please try again.";

        if (
          error?.response?.data?.message
        ) {
          message =
            error.response.data.message;
        } else if (
          error?.response?.status === 400
        ) {
          message =
            "Invalid login request. Please check your email and password.";
        } else if (
          error?.response?.status === 401
        ) {
          message =
            "Invalid email or password.";
        } else if (
          error?.response?.status === 403
        ) {
          message =
            "Your account does not have permission to log in.";
        } else if (
          error?.response?.status === 404
        ) {
          message =
            "The login endpoint could not be found on the hospital server.";
        } else if (
          error?.response?.status >= 500
        ) {
          message =
            "The hospital server encountered an internal error. Please try again.";
        } else if (
          !error?.response
        ) {
          message =
            "Unable to connect to the hospital server. Please check your internet connection.";
        } else if (
          error?.message
        ) {
          message = error.message;
        }

        /*
        |--------------------------------------------------------------------------
        | Throw normal Error
        |--------------------------------------------------------------------------
        |
        | Login.jsx can now simply use error.message.
        |--------------------------------------------------------------------------
        */

        throw new Error(message);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = useCallback(() => {
    console.log("[AUTH] Logging out...");

    localStorage.removeItem("token");
    localStorage.removeItem("hms_token");
    localStorage.removeItem("authToken");

    localStorage.removeItem("user");
    localStorage.removeItem("hms_user");

    localStorage.removeItem("rememberMe");

    setUser(null);

    console.log("[AUTH] Logout complete");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATION STATE
  |--------------------------------------------------------------------------
  */

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/*
|--------------------------------------------------------------------------
| useAuth Hook
|--------------------------------------------------------------------------
*/

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};

export default AuthContext;
