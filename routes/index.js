const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const courseRoutes = require('./courses');
const lessonRoutes = require('./lessons');
const enrollmentRoutes = require('./enrollments');
const progressRoutes = require('./progress');
const analyticsRoutes = require('./analytics');

// API documentation endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Learning Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      lessons: '/api/lessons',
      enrollments: '/api/enrollments',
      progress: '/api/progress',
      analytics: '/api/analytics'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/progress', progressRoutes);
router.use('/analytics', analyticsRoutes);

// 404 handler for unknown endpoints
router.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});