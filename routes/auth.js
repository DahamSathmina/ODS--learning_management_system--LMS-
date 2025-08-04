const express = require('express');
const router = express.Router();

// Auth route info
router.get('/', (req, res) => {
  res.json({
    message: 'Authentication API',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      logout: 'POST /api/auth/logout',
      refresh: 'POST /api/auth/refresh',
      profile: 'GET /api/auth/profile',
      forgot_password: 'POST /api/auth/forgot-password',
      reset_password: 'POST /api/auth/reset-password'
    },
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email and password are required',
      timestamp: new Date().toISOString()
    });
  }

  // Mock login response (replace with actual authentication logic)
  res.json({
    message: 'Login successful',
    user: {
      id: 1,
      email: email,
      name: 'Demo User',
      role: 'student'
    },
    token: 'mock-jwt-token-here',
    expiresIn: '24h',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
router.post('/register', (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name, email and password are required',
      timestamp: new Date().toISOString()
    });
  }

  // Mock registration response
  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: Math.floor(Math.random() * 1000),
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    },
    token: 'mock-jwt-token-here',
    timestamp: new Date().toISOString()
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Refresh token is required',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    message: 'Token refreshed successfully',
    token: 'new-mock-jwt-token-here',
    expiresIn: '24h',
    timestamp: new Date().toISOString()
  });
});

// Get user profile endpoint
router.get('/profile', (req, res) => {
  // Mock profile response (in real app, extract from JWT)
  res.json({
    user: {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'student',
      joinedAt: '2024-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Forgot password endpoint
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email is required',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    message: 'Password reset link sent to your email',
    email: email,
    timestamp: new Date().toISOString()
  });
});

// Reset password endpoint
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Reset token and new password are required',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    message: 'Password reset successful',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;