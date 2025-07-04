import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ai': ['@genkit-ai/googleai'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@utils': resolve(__dirname, './src/utils'),
      '@ai': resolve(__dirname, './src/ai'),
      '@auth': resolve(__dirname, './src/auth'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
