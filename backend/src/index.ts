import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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
import { env } from './config/env.js';
import { getTenantBySlug } from './controllers/tenantController.js';

const app = express();
const server = createServer(app);
const PORT = env.PORT;

// Initialize Socket.io
initSocket(server);

// Middleware
const getAllowedOrigins = () => {
  if (!env.FRONTEND_URL) return [];
  // Strip literal quotes that might be injected by hosting providers, split, trim, and filter
  return env.FRONTEND_URL
    .replace(/['"]/g, '')
    .split(',')
    .map(url => url.trim().replace(/\/$/, '')) // Also remove any trailing slash
    .filter(Boolean);
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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
    FRONTEND_URL: env.FRONTEND_URL ? `Set (${env.FRONTEND_URL.split(',').length} URLs)` : 'MISSING',
    SMTP_USER: env.SMTP_USER ? 'Set' : 'MISSING',
    OAUTH_CLIENT_ID: env.OAUTH_CLIENT_ID ? 'Set' : 'MISSING',
    OAUTH_CLIENT_SECRET: env.OAUTH_CLIENT_SECRET ? 'Set' : 'MISSING',
    OAUTH_REFRESH_TOKEN: env.OAUTH_REFRESH_TOKEN ? 'Set' : 'MISSING',
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

// Test email diagnostic route
app.get('/api/diag/send-test-email', async (req, res) => {
  const to = req.query.to as string || env.SMTP_USER;
  if (!to) return res.status(400).json({ message: 'SMTP_USER not set and no "to" query param provided' });

  try {
    const { sendEmail } = await import('./config/mail.js');
    console.log(`[Diag] Attempting to send test email to ${to}...`);
    const result = await sendEmail(to, 'IdeaForge Diagnostic Test', 'This is a test email from the IdeaForge diagnostic route.');
    
    res.json({ 
      status: 'ok', 
      message: `Test email sent successfully to ${to}`,
      result 
    });
  } catch (error: any) {
    console.error('[Diag] Test email failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Email sending failed',
      details: {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (host 0.0.0.0)`);
});
