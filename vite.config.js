import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'yet-another-react-lightbox',
      'yet-another-react-lightbox/plugins/zoom',
      'yet-another-react-lightbox/plugins/fullscreen',
      'yet-another-react-lightbox/plugins/video',
    ],
  },
  server: {
    proxy: {
      '/api': {
        // Use local backend during development:
     // target: 'http://127.0.0.1:8000',
        // For production testing via dev server, switch to:
       //  target: 'http://34.239.228.72',
        changeOrigin: true,
        secure: false,
        // Keep path as-is and rewrite cookies so the browser stores them for localhost:5173
        rewrite: (path) => path,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/'
      }
      ,
      '/media': {
        // Proxy media files served by backend (e.g., /media/...) so <img src="/media/..."> works in dev
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        // If backend serves static assets under /static
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
