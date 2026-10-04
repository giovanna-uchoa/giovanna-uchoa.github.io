
  import { defineConfig, type Plugin } from 'vite';
  import fs from 'fs';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  // GitHub Pages serves 404.html for unknown paths. Copying the SPA shell there
  // lets deep links like /post/15 load the app and be routed client-side.
  const spaFallback = (): Plugin => ({
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const out = path.resolve(__dirname, 'build');
      fs.copyFileSync(path.join(out, 'index.html'), path.join(out, '404.html'));
    },
  });

  export default defineConfig({
    base: '/',
    plugins: [react(), spaFallback()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      chunkSizeWarningLimit: 700,
    }
  });