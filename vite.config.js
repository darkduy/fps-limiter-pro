// vite.config.js
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  // Chỉ định thư mục build và đảm bảo nó luôn sạch
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
