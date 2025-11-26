import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import adminUsersHandler from './api/admin-users.js';

const app = express();

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
app.all('/api/admin-users', (req, res) => {
  return adminUsersHandler(req, res);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


