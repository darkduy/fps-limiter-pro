// vite.config.js
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import { resolve } from 'path';

// Định nghĩa đường dẫn tuyệt đối đến thư mục src
const srcDir = resolve(__dirname, 'src');

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Chúng ta sẽ chỉ định trực tiếp các file "đầu vào" cho Vite
      input: {
        popup: resolve(srcDir, 'popup', 'popup.html'), // Đầu vào cho popup
        background: resolve(srcDir, 'background.js'),     // Đầu vào cho background script
      },
      // Cấu hình đầu ra để tên tệp gọn gàng
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
