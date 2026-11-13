import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import authRouter from './routes/auth.js';
import contentRouter from './routes/content.js';
import sectionsRouter from './routes/sections.js';
import settingsRouter from './routes/settings.js';
import uploadsRouter, { UPLOADS_DIR } from './routes/uploads.js';
import usersRouter from './routes/users.js';
import revisionsRouter from './routes/revisions.js';
import analyticsRouter from './routes/analytics.js';
import contactRouter from './routes/contact.js';
import { getPort, isProd } from './lib/config.js';
import { bootstrap } from './db/bootstrap.js';
import { catchAsync } from './lib/catchAsync.js';

// Last-resort safety net: log instead of crashing the whole site.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

await bootstrap();

const app = express();

// Trust reverse proxy headers (nginx) so req.ip works behind it in prod.
app.set('trust proxy', isProd() ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: isProd()
      ? {
          useDefaults: true,
          directives: {
            // Allow Google Fonts + same-origin images (the SVG favicon and /uploads).
            'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
            'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
            'script-src': ["'self'"],
          },
        }
      : false, // dev: CSP off so Vite HMR/eval works
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', catchAsync(authRouter));
app.use('/api/content', catchAsync(contentRouter));
app.use('/api/sections', catchAsync(sectionsRouter));
app.use('/api/settings', catchAsync(settingsRouter));
app.use('/api/uploads', catchAsync(uploadsRouter));
app.use('/api/users', catchAsync(usersRouter));
app.use('/api/revisions', catchAsync(revisionsRouter));
app.use('/api/analytics', catchAsync(analyticsRouter));
app.use('/api/contact', catchAsync(contactRouter));

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
// A missing upload must be a real 404, not the SPA's index.html.
app.use('/uploads', (_req, res) => res.status(404).end());

// In production, serve the built client.
if (isProd()) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  // body-parser errors carry a 4xx status (413 too large, 400 malformed JSON).
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'payload_too_large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid_json' });
  console.error('[server error]', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error' });
});

const port = getPort();
app.listen(port, () => {
  console.log(`[fyh-server] listening on http://localhost:${port}`);
});
