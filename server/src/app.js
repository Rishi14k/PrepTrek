import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import testRoutes from './routes/testRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import studySessionRoutes from './routes/studySessionRoutes.js';
import studyTaskRoutes from './routes/studyTaskRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Trust reverse proxy (Render, AWS, Heroku, Cloudflare)
// This fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR and enables correct req.ip / req.secure behind proxies
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible chart rendering and client communication
  })
);

// Dynamic CORS configuration allowing configured client, localhost, and cloud deployment domains
const cleanClientUrl = env.CLIENT_URL ? env.CLIENT_URL.replace(/\/$/, '') : '';
const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:4173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (
        cleanClientUrl === origin ||
        localOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      // Allow all origins in production to prevent cross-origin deployment blocks
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/study-tasks', studyTaskRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
