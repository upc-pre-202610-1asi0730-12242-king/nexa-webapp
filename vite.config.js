import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

const apiProxyTarget = process.env.VITE_DEV_PROXY_TARGET
  || process.env.NEXA_API_PROXY_TARGET
  || 'http://localhost:5068';

export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined;
          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: process.env.VITE_SERVER_OPEN !== 'false',
    proxy: {
      '/api/v1': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

