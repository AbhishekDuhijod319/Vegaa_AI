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
          // Only split Firebase - it's large and has no React dependencies
          if (id.includes('node_modules/firebase/') ||
            id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }

          // Keep all other dependencies together in vendor chunk
          // This ensures React and all React-dependent packages load together
          if (id.includes('node_modules/')) {
            return 'vendor';
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