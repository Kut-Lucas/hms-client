// import axios from "axios";

// const baseURL =
//   import.meta.env.VITE_API_URL ||
//   (import.meta.env.PROD
//     ? "https://hms-server-odkt.onrender.com/api"
//     : "http://localhost:5000/api");

// console.log("======================================");
// console.log("HMS API");
// console.log("Environment:", import.meta.env.MODE);
// console.log("API URL:", baseURL);
// console.log("======================================");

// export const api = axios.create({
//   baseURL,

//   /*
//    * Keep this enabled because your authentication
//    * system may use cookies for refresh/logout.
//    */
//   withCredentials: true,

//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },

//   timeout: 30000,
// });

// /*
// |--------------------------------------------------------------------------
// | REQUEST INTERCEPTOR
// |--------------------------------------------------------------------------
// */

// api.interceptors.request.use(
//   (config) => {
//     const token =
//       localStorage.getItem("accessToken");

//     if (token) {
//       config.headers =
//         config.headers || {};

//       config.headers.Authorization =
//         `Bearer ${token}`;
//     }

//     console.log(
//       `[REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
//     );

//     return config;
//   },

//   (error) => {
//     return Promise.reject(error);
//   }
// );

// /*
// |--------------------------------------------------------------------------
// | RESPONSE INTERCEPTOR
// |--------------------------------------------------------------------------
// */

// let refreshing = null;

// api.interceptors.response.use(
//   (response) => {
//     console.log(
//       `[RESPONSE] ${response.status} ${response.config.url}`
//     );

//     return response;
//   },

//   async (error) => {
//     const originalRequest =
//       error.config;

//     /*
//      * Network error
//      */
//     if (!error.response) {
//       console.error(
//         "NETWORK ERROR:",
//         error.message
//       );

//       return Promise.reject(error);
//     }

//     const status =
//       error.response.status;

//     /*
//      * NEVER refresh after login failure
//      */
//     if (
//       originalRequest?.url?.includes(
//         "/auth/login"
//       )
//     ) {
//       return Promise.reject(error);
//     }

//     /*
//      * NEVER refresh the refresh request
//      */
//     if (
//       originalRequest?.url?.includes(
//         "/auth/refresh"
//       )
//     ) {
//       localStorage.removeItem(
//         "accessToken"
//       );

//       return Promise.reject(error);
//     }

//     /*
//      * Only refresh on 401
//      */
//     if (status !== 401) {
//       return Promise.reject(error);
//     }

//     /*
//      * Prevent infinite retry
//      */
//     if (originalRequest._retry) {
//       localStorage.removeItem(
//         "accessToken"
//       );

//       return Promise.reject(error);
//     }

//     originalRequest._retry = true;

//     try {
//       /*
//        * Only make one refresh request
//        */
//       if (!refreshing) {
//         refreshing = api
//           .post("/auth/refresh")
//           .finally(() => {
//             refreshing = null;
//           });
//       }

//       const { data } =
//         await refreshing;

//       if (!data?.accessToken) {
//         localStorage.removeItem(
//           "accessToken"
//         );

//         return Promise.reject(error);
//       }

//       /*
//        * Save new token
//        */
//       localStorage.setItem(
//         "accessToken",
//         data.accessToken
//       );

//       /*
//        * Attach new token
//        */
//       originalRequest.headers =
//         originalRequest.headers || {};

//       originalRequest.headers.Authorization =
//         `Bearer ${data.accessToken}`;

//       /*
//        * Retry original request
//        */
//       return api(originalRequest);

//     } catch (refreshError) {
//       localStorage.removeItem(
//         "accessToken"
//       );

//       return Promise.reject(
//         refreshError
//       );
//     }
//   }
// );

// /*
// |--------------------------------------------------------------------------
// | ACCESS TOKEN
// |--------------------------------------------------------------------------
// */

// export function setAccessToken(token) {
//   if (token) {
//     localStorage.setItem(
//       "accessToken",
//       token
//     );
//   } else {
//     localStorage.removeItem(
//       "accessToken"
//     );
//   }
// }

import axios from "axios";

const client = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "https://hms-server-odkt.onrender.com/api",
  timeout: 60000, // 60 seconds – enough for cold starts
  headers: {
    "Content-Type": "application/json",
  },
});

// Retry on timeout up to 2 times (exponential backoff)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || !config.retry) config.retry = 0;
    // Only retry on timeout (ECONNABORTED) and if we haven't exhausted retries
    if (error.code === "ECONNABORTED" && config.retry < 2) {
      config.retry += 1;
      console.log(`[RETRY] Attempt ${config.retry}/2 for ${config.url}`);
      // Wait 2, 4 seconds between retries
      await new Promise((resolve) => setTimeout(resolve, 2000 * config.retry));
      return client(config);
    }
    return Promise.reject(error);
  },
);

export default client;