// vite.config.js
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import path from 'path';

export default defineConfig({
  // Chỉ định thư mục gốc là thư mục hiện tại
  root: '.', 
  
  plugins: [
    crx({ manifest }),
  ],
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    // Giúp Vite xử lý các đường dẫn một cách chính xác hơn
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup.html'),
      },
      output: {
        // Đảm bảo các tệp đầu ra có tên nhất quán
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
