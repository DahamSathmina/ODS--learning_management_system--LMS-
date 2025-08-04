const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Safe import function for route modules
function safeImportRoute(routePath, routeName) {
  try {
    const fullPath = path.resolve(__dirname, routePath);
    
    // Check if file exists
    if (fs.existsSync(fullPath + '.js')) {
      const routeModule = require(routePath);
      
      // Validate that it's a proper Express router
      if (routeModule && typeof routeModule === 'function') {
        console.log(`✅ ${routeName} routes loaded successfully`);
        return routeModule;
      } else {
        console.warn(`⚠️  ${routeName} route exists but doesn't export a router`);
        return null;
      }
    } else {
      console.warn(`⚠️  ${routeName} route file not found: ${routePath}.js`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error loading ${routeName} routes:`, error.message);
    return null;
  }
}

// Create fallback router for missing routes
function createFallbackRouter(routeName) {
  const fallbackRouter = express.Router();
  
  fallbackRouter.get('/', (req, res) => {
    res.json({
      message: `${routeName} endpoint is under development`,
      status: 'coming_soon',
      timestamp: new Date().toISOString()
    });
  });
  
  fallbackRouter.use('*', (req, res) => {
    res.status(501).json({
      error: 'Not Implemented',
      message: `${routeName} functionality is under development`,
      timestamp: new Date().toISOString()
    });
  });
  
  return fallbackRouter;
}

// Import route modules safely
const authRoutes = safeImportRoute('./auth', 'Auth') || createFallbackRouter('Authentication');
const userRoutes = safeImportRoute('./users', 'Users') || createFallbackRouter('Users');
const courseRoutes = safeImportRoute('./courses', 'Courses') || createFallbackRouter('Courses');
const lessonRoutes = safeImportRoute('./lessons', 'Lessons') || createFallbackRouter('Lessons');
const enrollmentRoutes = safeImportRoute('./enrollments', 'Enrollments') || createFallbackRouter('Enrollments');
const progressRoutes = safeImportRoute('./progress', 'Progress') || createFallbackRouter('Progress');
const analyticsRoutes = safeImportRoute('./analytics', 'Analytics') || createFallbackRouter('Analytics');

// API documentation endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Learning Management System API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    endpoints: {
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

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'API test endpoint working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// Mount routes with error handling
try {
  router.use('/auth', authRoutes);
  router.use('/users', userRoutes);
  router.use('/courses', courseRoutes);
  router.use('/lessons', lessonRoutes);
  router.use('/enrollments', enrollmentRoutes);
  router.use('/progress', progressRoutes);
  router.use('/analytics', analyticsRoutes);
  
  console.log('✅ All routes mounted successfully');
} catch (error) {
  console.error('❌ Error mounting routes:', error.message);
}

// 404 handler for unknown API endpoints
router.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;