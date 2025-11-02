import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/jp-words/',        // ← GitHub Pages のサブパス
  build: {
    outDir: 'docs',          // ← Pages 直出し
    emptyOutDir: true        // ← 既定のままでOK（毎回クリーン）
  },
  publicDir: 'public'        // ← 既定。ここに置いた物はそのまま docs へコピー
})


