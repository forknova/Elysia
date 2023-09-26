import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.FRONTEND_PORT),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api', ''),
      },
      '/auth/callback': {
        target: `http://localhost:${process.env.BACKEND_PORT}`,
        changeOrigin: true,
      }
    }
  },
})
