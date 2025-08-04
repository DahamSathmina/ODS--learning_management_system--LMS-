const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Mock user database (replace with real database)
const users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2b$12$hashed_password_here', // bcrypt hash
    role: 'student',
    isVerified: true,
    createdAt: new Date().toISOString()
  }
];

// Helper function to generate mock JWT
const generateToken = (userId) => {
  return `mock-jwt-token-${userId}-${Date.now()}`;
};

// Helper function to find user by email
const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

// Helper function to find user by ID
const findUserById = (id) => {
  return users.find(user => user.id === parseInt(id));
};

/**
 * Register a new user
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role = 'student' } = req.body;

  // Validation
  if (!name || !email || !password) {
    return next(new AppError('Name, email and password are required', 400));
  }

  // Check if user already exists
  if (findUserByEmail(email)) {
    return next(new AppError('User with this email already exists', 409));
  }

  // Create new user (in real app, hash password with bcrypt)
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: `$2b$12$hashed_${password}`, // Mock hash
    role,
    isVerified: false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  // Generate token
  const token = generateToken(newUser.id);

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    status: 'success',
    message: 'Registration successful',
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      token,
      expiresIn: '24h'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Login user
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  // Find user
  const user = findUserByEmail(email);
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // In real app, compare password with bcrypt
  // const isValidPassword = await bcrypt.compare(password, user.password);
  const isValidPassword = true; // Mock validation

  if (!isValidPassword) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Generate token
  const token = generateToken(user.id);

  logger.info(`User logged in: ${email}`);

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      token,
      expiresIn: '24h'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Logout user
 */
const logout = catchAsync(async (req, res, next) => {
  // In real app, invalidate token or add to blacklist
  
  res.json({
    status: 'success',
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

/**
 * Forgot password
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = findUserByEmail(email);
  if (!user) {
    return next(new AppError('No user found with this email', 404));
  }

  // In real app, generate reset token and send email
  const resetToken = `reset-token-${Date.now()}`;

  logger.info(`Password reset requested for: ${email}`);

  res.json({
    status: 'success',
    message: 'Password reset link sent to your email',
    data: {
      resetToken // Remove this in production
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Reset password
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new AppError('New password is required', 400));
  }

  // In real app, verify reset token and update password
  logger.info(`Password reset completed for token: ${token}`);

  res.json({
    status: 'success',
    message: 'Password reset successful',
    timestamp: new Date().toISOString()
  });
});

/**
 * Change password
 */
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  const user = findUserById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // In real app, verify current password and update
  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    status: 'success',
    message: 'Password changed successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify email
 */
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // In real app, verify email token
  logger.info(`Email verification attempted with token: ${token}`);

  res.json({
    status: 'success',
    message: 'Email verified successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Resend email verification
 */
const resendEmailVerification = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const user = findUserById(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // In real app, send verification email
  logger.info(`Email verification resent for: ${user.email}`);

  res.json({
    status: 'success',
    message: 'Verification email sent',
    timestamp: new Date().toISOString()
  });
});

/**
 * Refresh token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const newToken = generateToken(userId);

  res.json({
    status: 'success',
    message: 'Token refreshed successfully',
    data: {
      token: newToken,
      expiresIn: '24h'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Get current user
 */
const getMe = catchAsync(async (req, res, next) => {
  const user = req.user;

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Update current user
 */
const updateMe = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  const user = findUserById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update user (in real app, update database)
  if (name) user.name = name;
  if (email) user.email = email;

  logger.info(`User profile updated: ${user.email}`);

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Check if email exists
 */
const checkEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const exists = !!findUserByEmail(email);

  res.json({
    status: 'success',
    data: {
      exists,
      email
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendEmailVerification,
  refreshToken,
  getMe,
  updateMe,
  checkEmail
};