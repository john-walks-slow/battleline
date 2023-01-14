// vite.config.js

import { defineConfig } from 'vite';
import { fileURLToPath, URL } from "url";

import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

});