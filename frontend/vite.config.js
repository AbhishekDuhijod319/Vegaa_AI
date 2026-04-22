import path from "path"
import { createRequire } from "module"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const require = createRequire(import.meta.url)
const tailwindcss = require("tailwindcss")
const autoprefixer = require("autoprefixer")

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: "./tailwind.config.cjs" }),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep all dependencies together in one vendor chunk.
        // This prevents React hook errors caused by split React chunks.
        manualChunks(id) {
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})