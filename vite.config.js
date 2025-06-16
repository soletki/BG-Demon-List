import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.VITE_BACKEND_URL;
  const proxyPaths = ['/levels', '/records', '/users', '/players', '/claims'];

  const proxy = Object.fromEntries(
    proxyPaths.map((path) => [path, { target: backendUrl, changeOrigin: true }])
  );

  return {
    plugins: [react()],
    server: {
      proxy,
    },
  };
});
