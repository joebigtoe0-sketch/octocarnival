import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Inject production site URL into index.html for og:image / canonical (VITE_SITE_URL). */
function siteMetaPlugin() {
  return {
    name: 'scraprats-site-meta',
    transformIndexHtml(html) {
      const siteUrl = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');
      const ogImage = siteUrl
        ? `${siteUrl}/assets/scrapratslogo.png`
        : '/assets/scrapratslogo.png';
      const canonical = siteUrl ? `${siteUrl}/` : '/';
      return html
        .replaceAll('__SITE_URL__', siteUrl)
        .replaceAll('__OG_IMAGE__', ogImage)
        .replaceAll('__CANONICAL__', canonical);
    },
  };
}

export default defineConfig({
  plugins: [react(), siteMetaPlugin()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['buffer'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3001', ws: true, changeOrigin: true },
    },
  },
});
