import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    // 支持 symlink（shared 目录）
    preserveSymlinks: true,
  },
  server: {
    port: 3001,
    open: true,
  },
})
