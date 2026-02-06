import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React ecosystem - loaded on every page
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // Firebase - large library used across app
          if (id.includes('node_modules/firebase/') ||
            id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }

          // UI and animation libraries
          if (id.includes('node_modules/framer-motion/') ||
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/@radix-ui/')) {
            return 'vendor-ui';
          }

          // Google and AI libraries
          if (id.includes('node_modules/@google/generative-ai/') ||
            id.includes('node_modules/@react-oauth/google/')) {
            return 'vendor-google';
          }

          // Date libraries
          if (id.includes('node_modules/date-fns/') ||
            id.includes('node_modules/react-datepicker/') ||
            id.includes('node_modules/react-day-picker/')) {
            return 'vendor-date';
          }

          // Other node_modules dependencies
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
        // Chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit to 600KB (from default 500KB)
    // This is still monitored but allows for slightly larger vendor chunks
    chunkSizeWarningLimit: 600,
  },
})