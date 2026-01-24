import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import newsletterRoutes from './routes/newsletter.js';
import interactionRoutes from './routes/interactions.js';
import adminRoutes from './routes/admin.js';
import { cleanupExpiredSessions } from './services/auth.js';
import { runMigrations } from './db/migrate.js';

const app = express();

// Middleware
const allowedOrigins = [
  env.FRONTEND_URL,
  'https://newsletter.uddit.site',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/newsletter', interactionRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Cleanup expired sessions periodically (every hour)
setInterval(() => {
  cleanupExpiredSessions().catch(console.error);
}, 60 * 60 * 1000);

// Run migrations on startup
async function startServer() {
  try {
    console.log('Starting server...');
    console.log('Environment:', env.NODE_ENV);
    console.log('Port:', env.PORT);

    // Run database migrations
    console.log('Running migrations...');
    await runMigrations();
    console.log('Migrations completed successfully');

    // Start the server
    const port = parseInt(env.PORT);
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✓ Server running on http://0.0.0.0:${port}`);
      console.log(`✓ Environment: ${env.NODE_ENV}`);
      console.log(`✓ Health check: http://0.0.0.0:${port}/api/health`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

startServer();
