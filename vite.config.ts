import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/necromancy-ritual-calculator',
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '$data': path.resolve(__dirname, './data'),
      '$src': path.resolve(__dirname, './src'),
      '$lib': path.resolve(__dirname, './src/lib'),
      '$assets': path.resolve(__dirname, './src/assets'),
      '$constants': path.resolve(__dirname, './src/constants.ts'),
    },
  },
})
