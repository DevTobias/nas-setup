import { join, resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],

    resolve: {
      alias: [{ find: /\$(.*)/, replacement: join(resolve(__dirname, 'src'), '$1') }],
    },

    server: {
      host: true,
      port: 3000,
    },
  };
});
