import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    open: true,
    port: 3000,
    host: true
  },
  preview: {
    open: true,
    port: 3000,
    host: true
  },
  resolve: {
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1')
      }
    ]
  },
  plugins: [react()]
});