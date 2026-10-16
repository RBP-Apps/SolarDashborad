import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
      'date-fns'
    ]
  },
  build: {
    // vendor libraries in their own long-lived chunks: they change rarely, so returning users reuse them from the browser cache
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/recharts|d3-|victory/.test(id)) return 'charts';
          if (/jspdf|html2canvas|canvg|pdfkit|fontkit|@react-pdf|xlsx/.test(id)) return 'documents';
          if (/react-dom|react-router|[\/]react[\/]|scheduler/.test(id)) return 'react';
          return undefined;
        }
      }
    }
  },
  server: {
    host: true,
    port: 3000
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  }
});