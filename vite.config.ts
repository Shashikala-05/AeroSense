// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Proxy /device-api/* to the SmartDevice (ESP32). The device firmware doesn't
// send CORS headers, so the browser can't fetch it directly — Vite proxies
// server-side, where CORS doesn't apply.
// We use the SoftAP IP rather than the mDNS hostname: Node's resolver on
// Windows doesn't reliably handle `.local` names even when the OS does, so
// `http://smartdevice.local` times out from inside Vite. Override via the
// DEVICE_TARGET env var when needed.
const DEVICE_TARGET = process.env.DEVICE_TARGET || "http://192.168.4.1";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/device-api": {
          target: DEVICE_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/device-api/, ""),
          timeout: 4000,
        },
      },
    },
  },
});
