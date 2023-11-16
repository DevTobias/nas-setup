import { fileURLToPath, URL } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],

    resolve: {
      alias: [{ find: '$', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    },

    server: {
      host: true,
      port: 3000,
    },
  };
});
