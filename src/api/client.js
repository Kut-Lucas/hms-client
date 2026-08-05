// import axios from 'axios';

// const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// export const api = axios.create({
//   baseURL,
//   withCredentials: true,
// });

// api.interceptors.request.use((config) => {
//   const t = localStorage.getItem('accessToken');
//   if (t) {
//     config.headers.Authorization = `Bearer ${t}`;
//   }
//   return config;
// });

// let refreshing = null;

// api.interceptors.response.use(
//   (r) => r,
//   async (error) => {
//     const original = error.config;
//     if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
//       if (original.url?.includes('/auth/refresh')) {
//         return Promise.reject(error);
//       }
//       original._retry = true;
//       try {
//         if (!refreshing) {
//           refreshing = api.post('/auth/refresh').finally(() => {
//             refreshing = null;
//           });
//         }
//         const { data } = await refreshing;
//         if (data?.accessToken) {
//           localStorage.setItem('accessToken', data.accessToken);
//           original.headers.Authorization = `Bearer ${data.accessToken}`;
//           return api(original);
//         }
//       } catch {
//         localStorage.removeItem('accessToken');
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export function setAccessToken(token) {
//   if (token) localStorage.setItem('accessToken', token);
//   else localStorage.removeItem('accessToken');
// }

import axios from "axios";

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
|
| Production backend:
| https://hms-server-odkt.onrender.com/api
|
| Local development backend:
| http://localhost:5000/api
|
| VITE_API_URL from Render takes priority.
|
*/

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://hms-server-odkt.onrender.com/api"
    : "http://localhost:5000/api");

console.log("======================================");
console.log("HMS API CONFIGURATION");
console.log("Environment:", import.meta.env.MODE);
console.log("Production:", import.meta.env.PROD);
console.log("API Base URL:", baseURL);
console.log("======================================");


/*
|--------------------------------------------------------------------------
| AXIOS INSTANCE
|--------------------------------------------------------------------------
*/

export const api = axios.create({
  baseURL,

  // Required because your backend uses credentials/cookies
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 30000,
});


/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Automatically attaches the access token to every protected request.
|
*/

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;
    }

    // Useful for debugging
    console.log(
      `[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );

    return config;
  },

  (error) => {
    console.error("[API REQUEST ERROR]", error);

    return Promise.reject(error);
  }
);


/*
|--------------------------------------------------------------------------
| TOKEN REFRESH MANAGEMENT
|--------------------------------------------------------------------------
|
| Prevents multiple simultaneous refresh requests.
|
*/

let refreshing = null;


/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
|
| If a protected request returns 401:
|
| 1. Try /auth/refresh
| 2. Save the new access token
| 3. Retry the original request
|
| Login and refresh requests are excluded to prevent loops.
|
*/

api.interceptors.response.use(
  (response) => {
    console.log(
      `[API RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
    );

    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    /*
    |--------------------------------------------------------------------------
    | NETWORK ERROR
    |--------------------------------------------------------------------------
    */

    if (!error.response) {
      console.error("======================================");
      console.error("HMS API NETWORK ERROR");
      console.error("======================================");
      console.error("Message:", error.message);
      console.error("Base URL:", error.config?.baseURL);
      console.error("URL:", error.config?.url);
      console.error(
        "Full URL:",
        error.config?.baseURL
          ? `${error.config.baseURL}${error.config.url}`
          : "Unknown"
      );

      return Promise.reject(error);
    }

    const status = error.response.status;

    console.error("======================================");
    console.error("HMS API ERROR");
    console.error("======================================");
    console.error("Status:", status);
    console.error("Message:", error.message);
    console.error("URL:", error.config?.url);
    console.error("Response:", error.response?.data);
    console.error("======================================");


    /*
    |--------------------------------------------------------------------------
    | NEVER REFRESH AFTER LOGIN FAILURE
    |--------------------------------------------------------------------------
    */

    if (originalRequest?.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }


    /*
    |--------------------------------------------------------------------------
    | NEVER REFRESH THE REFRESH REQUEST
    |--------------------------------------------------------------------------
    */

    if (originalRequest?.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");

      return Promise.reject(error);
    }


    /*
    |--------------------------------------------------------------------------
    | ONLY REFRESH ON 401
    |--------------------------------------------------------------------------
    */

    if (status !== 401) {
      return Promise.reject(error);
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT INFINITE RETRY LOOP
    |--------------------------------------------------------------------------
    */

    if (originalRequest._retry) {
      localStorage.removeItem("accessToken");

      return Promise.reject(error);
    }

    originalRequest._retry = true;


    /*
    |--------------------------------------------------------------------------
    | REFRESH TOKEN
    |--------------------------------------------------------------------------
    */

    try {
      /*
      |--------------------------------------------------------------
      | If another request is already refreshing, wait for it.
      |--------------------------------------------------------------
      */

      if (!refreshing) {
        refreshing = api
          .post("/auth/refresh")
          .finally(() => {
            refreshing = null;
          });
      }


      /*
      |--------------------------------------------------------------
      | Wait for refresh request
      |--------------------------------------------------------------
      */

      const { data } = await refreshing;


      /*
      |--------------------------------------------------------------
      | Make sure a new token was returned
      |--------------------------------------------------------------
      */

      if (!data?.accessToken) {
        console.error(
          "Token refresh succeeded but no accessToken was returned."
        );

        localStorage.removeItem("accessToken");

        return Promise.reject(error);
      }


      /*
      |--------------------------------------------------------------
      | Save new token
      |--------------------------------------------------------------
      */

      localStorage.setItem(
        "accessToken",
        data.accessToken
      );


      /*
      |--------------------------------------------------------------
      | Add new token to original request
      |--------------------------------------------------------------
      */

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${data.accessToken}`;


      /*
      |--------------------------------------------------------------
      | Retry original request
      |--------------------------------------------------------------
      */

      console.log(
        "[AUTH] Retrying request with refreshed access token:",
        originalRequest.url
      );

      return api(originalRequest);

    } catch (refreshError) {
      console.error(
        "======================================"
      );

      console.error(
        "TOKEN REFRESH FAILED"
      );

      console.error(
        "======================================"
      );

      console.error(
        "Status:",
        refreshError.response?.status
      );

      console.error(
        "Response:",
        refreshError.response?.data
      );

      console.error(
        "Message:",
        refreshError.message
      );


      /*
      |--------------------------------------------------------------
      | Remove invalid token
      |--------------------------------------------------------------
      */

      localStorage.removeItem("accessToken");

      return Promise.reject(refreshError);
    }
  }
);


/*
|--------------------------------------------------------------------------
| ACCESS TOKEN HELPER
|--------------------------------------------------------------------------
|
| Used by AuthContext.
|
*/

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(
      "accessToken",
      token
    );
  } else {
    localStorage.removeItem(
      "accessToken"
    );
  }
}


/*
|--------------------------------------------------------------------------
| GET CURRENT API URL
|--------------------------------------------------------------------------
|
| Optional helper useful for debugging.
|
*/

export function getApiBaseUrl() {
  return baseURL;
}
