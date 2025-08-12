// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // 不设置 root，让 Vite 从项目根开始
  server: {
    port: 3000
  },
  // 可选：优化 pnpm 的依赖解析
  resolve: {
    dedupe: ['helia'] // 避免重复依赖
  }
})