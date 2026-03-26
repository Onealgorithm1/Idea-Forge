import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import ideaRoutes from './routes/ideaRoutes.js';
import scoringRoutes from './routes/scoringRoutes.js';
import { createServer } from 'http';
import { initSocket } from './lib/socket.js';
import adminRoutes from './routes/adminRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import registerRoutes from './routes/registerRoutes.js';
import { getTenantBySlug } from './controllers/tenantController.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/api/tenants/by-slug/:slug', getTenantBySlug);
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/org', organizationRoutes);
app.use('/api/register', registerRoutes);

import { query } from './config/db.js';

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error instanceof Error ? error.message : String(error) });
  }
});

// Diagnostic route
app.get('/api/diag/email', async (req, res) => {
  const envVars = {
    FRONTEND_URL: process.env.FRONTEND_URL ? 'Set' : 'MISSING',
    SMTP_USER: process.env.SMTP_USER ? 'Set' : 'MISSING',
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID ? 'Set' : 'MISSING',
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET ? 'Set' : 'MISSING',
    OAUTH_REFRESH_TOKEN: process.env.OAUTH_REFRESH_TOKEN ? 'Set' : 'MISSING',
  };

  try {
    const { sendEmail } = await import('./config/mail.js');
    res.json({
      status: 'ok',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      environment: envVars, 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (host 0.0.0.0)`);
});
