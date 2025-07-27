// Cloudflare Worker para o Backend
import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import das rotas existentes
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import contractsRoutes from './routes/contracts';
import optionsRoutes from './routes/options';
import positionsRoutes from './routes/positions';
import pricesRoutes from './routes/prices';
import settingsRoutes from './routes/settings';
import transactionsRoutes from './routes/transactions';
import brokeragesRoutes from './routes/brokerages';
import userBrokeragesRoutes from './routes/user-brokerages';

const app = new Hono();

// CORS configuration
app.use('/*', cors({
  origin: ['https://seudominio.com.br', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.route('/api/analytics', analyticsRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/contracts', contractsRoutes);
app.route('/api/options', optionsRoutes);
app.route('/api/positions', positionsRoutes);
app.route('/api/prices', pricesRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/transactions', transactionsRoutes);
app.route('/api/brokerages', brokeragesRoutes);
app.route('/api/user-brokerages', userBrokeragesRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;