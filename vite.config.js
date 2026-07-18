import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        producto: resolve(__dirname, 'producto.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
