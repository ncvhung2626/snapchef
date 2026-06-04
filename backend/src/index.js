require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('[Warn] Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in backend/.env');
  }

  await connectDB();

  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] SnapChef server http://0.0.0.0:${PORT}/api`);
  });
}

start().catch((err) => {
  console.error('[Fatal]', err.message);
  process.exit(1);
});
