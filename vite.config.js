// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],

//   server: {
//     host: "0.0.0.0",
//     port: 5173,
//     allowedHosts: ["hms-client-f8lm.onrender.com"],
//   },

//   preview: {
//     host: "0.0.0.0",
//     allowedHosts: ["hms-client-f8lm.onrender.com"],
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "hms-client-1.onrender.com",
    ],
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [
      "hms-client-1.onrender.com",
    ],
  },
});
