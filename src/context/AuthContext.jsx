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


