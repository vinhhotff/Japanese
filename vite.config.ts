import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env variables - VITE_* prefix required for client-side
  const env = loadEnv(mode, process.cwd(), '')

  // Base path: use VITE_BASE_PATH env var if set, otherwise auto-detect
  // - On Vercel / root deployment: leave empty (root)
  // - On GitHub Pages subdirectory: set VITE_BASE_PATH=/Japanese/
  const base = env.VITE_BASE_PATH || '/'

  return {
    plugins: [react()],
    base,
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
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
  }
})

