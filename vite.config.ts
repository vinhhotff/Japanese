import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/jisho': {
        target: 'https://jisho.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jisho/, '/api/v1/search'),
        secure: false,
      }
    }
  }
})

