import express    from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// Gzip everything (JS bundle shrinks ~70%, HTML/CSS ~60%)
app.use(compression());

// Serve static files with smart cache headers:
//  - Vite hashes asset filenames (e.g. index-Ab3xYz.js) → 1-year immutable cache
//  - index.html is never hashed → no-cache so updates are picked up immediately
app.use(express.static(path.join(__dirname, 'dist'), {
  etag: true,
  setHeaders(res, filePath) {
    const isHashed = /\.[0-9a-f]{8,}\.\w+$/.test(path.basename(filePath));
    res.setHeader(
      'Cache-Control',
      isHashed ? 'public, max-age=31536000, immutable' : 'no-cache'
    );
  },
}));

// SPA fallback — serve index.html for all unknown routes
app.get('/*splat', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Scraprats frontend on port ${PORT}`);
});
