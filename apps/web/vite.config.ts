/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge', 'canvas-confetti'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
  server:{
    allowedHosts: ['localhost', 'f655-2804-77c-b004-4f01-3d79-d85a-43c4-f397.ngrok-free.app'],
  }
});
