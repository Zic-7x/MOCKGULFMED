import './env-bootstrap.js';
import express from 'express';
import cors from 'cors';

import adminUsersHandler from './api/admin-users.js';
import adminExamGrantsHandler from './api/admin-exam-grants.js';
import publicCatalogHandler from './api/public-catalog.js';
import registerHandler from './api/register.js';
import freemiusWebhookHandler from './api/freemius-webhook.js';

const app = express();

/** Express 4 does not catch async handler rejections; wrap to avoid silent 500s */
const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res)).catch(next);
};

// Basic CORS (align with your Vite dev server origin)
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

app.use(express.json());

// Wire the existing handler to the REST route
app.all('/api/admin-users', asyncRoute(adminUsersHandler));

app.all('/api/admin-exam-grants', asyncRoute(adminExamGrantsHandler));

app.all('/api/public-catalog', asyncRoute(publicCatalogHandler));

app.all('/api/register', asyncRoute(registerHandler));

app.all('/api/freemius/webhook', asyncRoute(freemiusWebhookHandler));
app.all('/api/freemius-webhook', asyncRoute(freemiusWebhookHandler));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error('[api] Unhandled error:', err?.stack || err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


