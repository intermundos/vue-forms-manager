import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export const LIBRARY_NAME = 'vue-forms-manger';

export default defineConfig({
  plugins: [vue()],
  build: {
    minify: true,
    lib: {
      entry: resolve(__dirname, '../src/index.ts'),
      name: LIBRARY_NAME,
      fileName: 'index',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: ['vue', 'vue-demi'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-demi': 'VueDemi',
        },
      },
    },
    outDir: resolve(__dirname, '../dist'),
  },
});
