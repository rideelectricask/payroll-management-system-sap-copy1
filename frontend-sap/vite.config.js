import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@material-tailwind/react': path.resolve(__dirname, './node_modules/@material-tailwind/react'),
    },
  },
  optimizeDeps: {
    include: ['@material-tailwind/react', 'react-window'],
    esbuildOptions: {
      mainFields: ['module', 'main'],
    },
  },
  build: {
    commonjsOptions: {
      include: [/react-window/, /@material-tailwind\/react/, /node_modules/],
      transformMixedEsModules: true,
    },
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://backend-pms-production-0cec.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    allowedHosts: ['.trycloudflare.com']
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://backend-pms-production-0cec.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
});