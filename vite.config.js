// vite.config.js（全部置き換え）
import { defineConfig } from 'vite';

export default defineConfig({
  // ← Vite の作業ディレクトリを app/public に固定
  root: 'app/public',

  // 相対パスで出力（GitHub Pages / docs にそのまま置ける）
  base: './',

  build: {
    // ルート（jp-words/）直下に docs を作る
    outDir: '../../docs',
    emptyOutDir: true,

    // root を app/public にしているので、entry は 'index.html' でOK
    rollupOptions: { input: 'index.html' },
  },

  // 開発時にスマホから見られるように（任意）
  server: { host: true, port: 5500 },
});
