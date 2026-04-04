import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 80,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    // Ensures env vars are properly injected
  }
});
