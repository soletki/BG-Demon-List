import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/levels': 'http://localhost:3000',
      '/records': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/players': 'http://localhost:3000',
      '/claims': 'http://localhost:3000',
    },
  },
});
