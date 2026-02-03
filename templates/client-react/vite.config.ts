import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 支持 symlink（shared 目录）
    preserveSymlinks: true,
  },
  server: {
    port: 3001,
    open: true,
  },
})
