const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root endpoint - welcome message
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to ODS Learning Management System API',
    version: '1.9.0.2',
    status: 'running',
    documentation: '/api',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      lessons: '/api/lessons',
      enrollments: '/api/enrollments',
      progress: '/api/progress',
      analytics: '/api/analytics'
    },
    timestamp: new Date().toISOString()
  });
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Safe import function
function safeRequire(modulePath, fallback = null) {
  try {
    const fullPath = path.resolve(__dirname, modulePath);
    if (fs.existsSync(fullPath + '.js') || fs.existsSync(fullPath + '/index.js') || fs.existsSync(fullPath)) {
      const module = require(modulePath);
      return module;
    } else {
      console.warn(`⚠️  Module not found: ${modulePath}`);
      return fallback;
    }
  } catch (error) {
    console.error(`❌ Error loading module ${modulePath}:`, error.message);
    return fallback;
  }
}

// Import routes safely
const routes = safeRequire('./routes');

// Import error handler safely
const errorHandlerModule = safeRequire('./middleware/errorHandler');
const { globalErrorHandler, notFound } = errorHandlerModule || {};

// API routes - only use if routes exist and is a function/router
if (routes && (typeof routes === 'function' || routes.constructor.name === 'router')) {
  console.log('✅ Routes loaded successfully');
  app.use('/api', routes);
} else {
  console.warn('⚠️  No routes found, creating basic API endpoint');
  // Fallback basic API routes
  app.get('/api', (req, res) => {
    res.json({ 
      message: 'API is running', 
      timestamp: new Date().toISOString() 
    });
  });
  
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    });
  });
}

// 404 handler - use custom notFound if available
if (notFound && typeof notFound === 'function') {
  console.log('✅ Custom 404 handler loaded');
  app.use('*', notFound);
} else {
  console.warn('⚠️  Using default 404 handler');
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });
}

// Global error handler - use custom one if available, otherwise use default
if (globalErrorHandler && typeof globalErrorHandler === 'function') {
  console.log('✅ Custom error handler loaded');
  app.use(globalErrorHandler);
} else {
  console.warn('⚠️  Using default error handler');
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  });
}

const PORT = process.env.PORT || 3000;

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;