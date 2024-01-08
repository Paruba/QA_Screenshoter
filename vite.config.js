import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import copy from 'rollup-plugin-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    copy({
      targets: [
        { src: 'src/manifest.json', dest: 'dist' },
        { src: 'src/popup.html', dest: 'dist' },
        { src: 'src/images/*', dest: 'dist/images' }
      ],
      hook: 'writeBundle'
    })
  ],
  build: {
    rollupOptions: {
      external: [], // Make sure Vite doesn't treat any modules as external
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        format: 'esm',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
});
