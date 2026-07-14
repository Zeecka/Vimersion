import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Optional accounts/score backend (server/). Outside Docker it's on localhost;
// inside the dev container the API is another service reachable as `api`
// (set VITE_API_TARGET=http://api:3001). When it isn't running the proxy 502s,
// /api/config fails, and the app degrades to offline mode.
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3001'

// Bind-mounted source in a container may not deliver inotify events reliably;
// VITE_USE_POLLING=true switches the watcher to polling so HMR still fires.
const usePolling = process.env.VITE_USE_POLLING === 'true'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Relative base only helps the static build (subpath / file:// hosting).
  // The dev server serves from '/', where a relative base breaks HMR client URLs.
  base: command === 'build' ? './' : '/',
  server: {
    proxy: { '/api': apiTarget },
    ...(usePolling ? { watch: { usePolling: true } } : {}),
  },
  preview: {
    proxy: { '/api': apiTarget },
  },
}))
