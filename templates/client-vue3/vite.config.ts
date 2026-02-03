import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 支持 symlink（shared 目录）
    preserveSymlinks: true,
  },
  server: {
    port: 3001,
    open: true,
  },
})
