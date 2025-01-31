import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "VITE_");
  /** @type {import('vite').UserConfig} */
  return defineConfig({
    plugins: [
      react(),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "gareths-projects",
        project: "nsilweb",
      }),
    ],
    envDir: "..",
    root: ".",

    server: {
      host: true,
      port: env.VITE_PORT,
    },

    build: {
      manifest: true,
      sourcemap: true,
    },
  });
});
