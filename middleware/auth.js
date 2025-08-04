const { AppError, catchAsync } = require('./errorHandler');

// Mock user database (same as controller)
const users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2b$12$hashed_password_here',
    role: 'student',
    isVerified: true,
    createdAt: new Date().toISOString()
  }
];

/**
 * Extract user ID from mock JWT token
 */
const extractUserIdFromToken = (token) => {
  // Mock token format: mock-jwt-token-{userId}-{timestamp}
  const parts = token.split('-');
  if (parts.length >= 4 && parts[0] === 'mock' && parts[1] === 'jwt' && parts[2] === 'token') {
    return parseInt(parts[3]);
  }
  return null;
};

/**
 * Find user by ID
 */
const findUserById = (id) => {
  return users.find(user => user.id === parseInt(id));
};

/**
 * Authentication middleware
 * Verifies JWT token and adds user to req.user
 */
const authenticate = catchAsync(async (req, res, next) => {
  // 1) Check if token exists
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token (in real app, use jwt.verify)
  const userId = extractUserIdFromToken(token);
  
  if (!userId) {
    return next(new AppError('Invalid token. Please log in again!', 401));
  }

  // 3) Check if user still exists
  const currentUser = findUserById(userId);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user is verified (optional)
  if (!currentUser.isVerified) {
    return next(new AppError('Please verify your email before accessing this resource.', 401));
  }

  // 5) Grant access to protected route
  req.user = currentUser;
  next();
});

/**
 * Authorization middleware
 * Restricts access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user to req.user if token is valid, but doesn't fail if no token
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    const userId = extractUserIdFromToken(token);
    
    if (userId) {
      const currentUser = findUserById(userId);
      if (currentUser && currentUser.isVerified) {
        req.user = currentUser;
      }
    }
  }

  next();
});

/**
 * Check if user is owner of resource or admin
 */
const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const resourceUserId = req.params.userId || req.params.id || req.body.userId;
  
  if (req.user.role === 'admin' || req.user.id === parseInt(resourceUserId)) {
    return next();
  }

  return next(new AppError('You can only access your own resources', 403));
};

/**
 * Rate limiting for sensitive operations
 */
const sensitiveOpLimit = catchAsync(async (req, res, next) => {
  // In real app, implement rate limiting for password reset, etc.
  // For now, just pass through
  next();
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  isOwnerOrAdmin,
  sensitiveOpLimit
};