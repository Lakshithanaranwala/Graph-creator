import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // One chunk for all Plotly code so it's never duplicated.
          // Both the lazy <Plot> component and the export functions reference this chunk.
          'plotly-vendor': ['plotly.js/dist/plotly', 'react-plotly.js'],
          // PDF export deps are large but only needed on demand
          'pdf-vendor': ['jspdf', 'svg2pdf.js'],
        },
      },
    },
  },
})
