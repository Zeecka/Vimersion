import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps asset URLs relative so the static build works when served
// from a subpath (e.g. GitHub Pages) or the local `vite preview`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
