import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Proxy /api to the Flask server so the browser never hits CORS issues in development.
export default defineConfig({ plugins: [react()], server: { port: 5173, proxy: { "/api": "http://127.0.0.1:5000" } } });
