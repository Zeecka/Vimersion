import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps asset URLs relative so the static build works when served
// from a subpath (e.g. GitHub Pages) or the local `vite preview`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  // No manualChunks: Stage3D/Hero3D are the only entries into the 3D module
  // graph and both are dynamic imports, so rolldown's default chunking already
  // isolates three/r3f/drei into async chunks the lite tier never fetches.
  // (Hand-grouping a 'vendor-3d' chunk backfired: rolldown merged the shared
  // `scheduler` helper into it, statically chaining index → vendor-3d.)
})
