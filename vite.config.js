import { defineConfig } from 'vite';

export default defineConfig({
  base: '/amadeus/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['phaser']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  test: {
    globals: true
  }
});
