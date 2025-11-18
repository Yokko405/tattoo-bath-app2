import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  // 認証などでプロジェクトルートの `.env` を使っているため、envDirをプロジェクトルートに設定
  envDir: process.cwd(),
  publicDir: '../public',
  base: process.env.NODE_ENV === 'production' ? '/tattoo-bath-app2/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // タイムスタンプを含めて確実にハッシュを変える
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        chunkFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        assetFileNames: `assets/[name]-${Date.now()}-[hash][extname]`
      }
    }
  },
  server: {
    port: 3000,
    hmr: {
      host: '192.168.68.54',
      port: 3000,
      protocol: 'ws',
    },
  },
});
