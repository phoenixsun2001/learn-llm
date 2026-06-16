import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendProxy = {
  target: 'http://localhost:8400',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api/, ''),
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': backendProxy,
    },
  },
  preview: {
    proxy: {
      '/api': backendProxy,
    },
  },
  build: {
    outDir: 'dist',
  },
});
