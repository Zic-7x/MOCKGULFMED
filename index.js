import './env-bootstrap.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import adminUsersHandler from './api/admin-users.js';
import adminExamGrantsHandler from './api/admin-exam-grants.js';
import publicCatalogHandler from './api/public-catalog.js';
import registerHandler from './api/register.js';
import freemiusWebhookHandler from './api/freemius-webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/** Express 4 does not catch async handler rejections; wrap to avoid silent 500s */
const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res)).catch(next);
};

// Basic CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// NOTE: Freemius webhook signature validation requires the raw request body.
// We mount raw parsing for the webhook routes before express.json().
app.post('/api/freemius/webhook', express.raw({ type: '*/*' }), asyncRoute(freemiusWebhookHandler));
app.post('/api/freemius-webhook', express.raw({ type: '*/*' }), asyncRoute(freemiusWebhookHandler));

app.use(express.json());

// Dedicated Android APK Download endpoint
const sendApkFile = (req, res) => {
  const publicApkPath = path.join(__dirname, 'client', 'public', 'MockGulfMed.apk');
  const distApkPath = path.join(__dirname, 'client', 'dist', 'MockGulfMed.apk');
  const apkPath = path.join(__dirname, 'client', 'public', 'MockGulfMed.apk');

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="MockGulfMed.apk"');
  res.sendFile(apkPath, (err) => {
    if (err) {
      console.error('[apk-download] Error serving APK:', err);
      res.status(404).send('APK package not found. Please try again shortly.');
    }
  });
};

app.get('/api/download-apk', sendApkFile);
app.get('/MockGulfMed.apk', sendApkFile);
app.get('/downloads/MockGulfMed.apk', sendApkFile);
app.get('/download/MockGulfMed.apk', sendApkFile);

// Wire the existing handlers to the REST routes
app.all('/api/admin-users', asyncRoute(adminUsersHandler));
app.all('/api/admin-exam-grants', asyncRoute(adminExamGrantsHandler));
app.all('/api/public-catalog', asyncRoute(publicCatalogHandler));
app.all('/api/register', asyncRoute(registerHandler));
app.all('/api/freemius/webhook', asyncRoute(freemiusWebhookHandler));
app.all('/api/freemius-webhook', asyncRoute(freemiusWebhookHandler));

const clientDir = path.join(__dirname, 'client');
const distDir = path.join(clientDir, 'dist');

if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, host: '0.0.0.0' },
    appType: 'spa',
    root: clientDir,
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error('[api] Unhandled error:', err?.stack || err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${PORT}`);
});



