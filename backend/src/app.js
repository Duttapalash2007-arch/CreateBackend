import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { envConfig } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import reportRoutes from './routes/report.routes.js';
import adminRoutes from './routes/admin.routes.js';
import diseaseRoutes from './routes/disease.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '../uploads');
const allowedOrigins = envConfig.corsOrigins;

// ============= MIDDLEWARE =============

// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// ============= ROUTES =============

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare Assistant API is running',
    docs: '/api',
    health: '/health',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/chat', chatbotRoutes);

// Backward-compatible route aliases
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/diseases', diseaseRoutes);
app.use('/chat', chatbotRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Healthcare Assistant API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      reports: '/api/reports',
      admin: '/api/admin',
      diseases: '/api/diseases',
      chat: '/api/chat',
    },
  });
});

// ============= ERROR HANDLING =============

// 404 handler
app.use(notFoundMiddleware);

// Error handler (must be last)
app.use(errorMiddleware);

logger.info('Express app configured');

export default app;
