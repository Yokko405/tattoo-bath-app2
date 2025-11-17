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
  },
  server: {
    port: 3000,
  },
});
