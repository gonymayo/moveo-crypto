import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Makes "@/components/Foo" resolve to "src/components/Foo" — keeps imports clean.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Proxy API calls to the local backend in development so we avoid CORS issues.
    proxy: {
      '/auth': 'http://localhost:3000',
      '/onboarding': 'http://localhost:3000',
      '/dashboard': 'http://localhost:3000',
      '/votes': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
