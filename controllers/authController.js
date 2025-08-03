const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

/**
 * Register a new user
 */
const register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, role = 'student' } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return next(new AppError('All fields are required', 400));
  }

  if (!User.validateEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  if (!User.validatePassword(password)) {
    return next(new AppError(
      'Password must be at least 8 characters long and contain uppercase, lowercase, and number', 
      400
    ));
  }

  if (!User.validateRole(role)) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const userData = {
    email,
    password,
    firstName,
    lastName,
    role,
    emailVerificationToken: crypto.randomBytes(32).toString('hex')
  };

  const user = await User.create(userData);

  // Send verification email
  try {
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${userData.emailVerificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <h2>Welcome to our Learning Management System!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't fail registration if email fails
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully. Please check your email for verification.',
    token,
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Login user
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password
  const user = await User.findByEmail(email);
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is temporarily locked due to too many failed login attempts', 423));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    await user.incLoginAttempts();
    return next(new AppError('Invalid email or password', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  await user.update({ lastLogin: new Date().toISOString() });

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    message: 'Login successful',
    token,
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Logout user (optional - mainly for clearing client-side token)
 */
const logout = (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
};

/**
 * Forgot password
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address', 400));
  }

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save();

  try {
    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({
      status: 'success',
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return next(new AppError('Error sending email. Please try again later.', 500));
  }
});

/**
 * Reset password
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return next(new AppError('Please provide password and password confirmation', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  if (!User.validatePassword(password)) {
    return next(new AppError(
      'Password must be at least 8 characters long and contain uppercase, lowercase, and number', 
      400
    ));
  }

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by token and check if not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired password reset token', 400));
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  
  await user.hashPassword();
  await user.save();

  // Generate new JWT token
  const jwtToken = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    message: 'Password reset successful',
    token: jwtToken,
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Change password (authenticated user)
 */
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(new AppError('Please provide current password, new password, and confirmation', 400));
  }

  if (newPassword !== newPasswordConfirm) {
    return next(new AppError('New passwords do not match', 400));
  }

  if (!User.validatePassword(newPassword)) {
    return next(new AppError(
      'Password must be at least 8 characters long and contain uppercase, lowercase, and number', 
      400
    ));
  }

  // Get current user
  const user = await User.findById(req.user.id);

  // Verify current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  
  await user.hashPassword();
  await user.save();

  // Generate new JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    message: 'Password changed successfully',
    token,
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Verify email address
 */
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by verification token
  const user = await User.findOne({
    emailVerificationToken: hashedToken
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // Update user as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({
    status: 'success',
    message: 'Email verified successfully',
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Resend email verification
 */
const resendEmailVerification = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save();

  try {
    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <h2>Email Verification</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    res.json({
      status: 'success',
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    await user.save();

    return next(new AppError('Error sending verification email. Please try again later.', 500));
  }
});

/**
 * Refresh JWT token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  // User is already authenticated via middleware
  const user = await User.findById(req.user.id);

  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive', 404));
  }

  // Generate new JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    message: 'Token refreshed successfully',
    token,
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Get current user info
 */
const getMe = (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user.toJSON()
    }
  });
};

/**
 * Update current user profile
 */
const updateMe = catchAsync(async (req, res, next) => {
  // Don't allow password updates through this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /change-password', 400));
  }

  // Filter allowed fields
  const allowedFields = ['firstName', 'lastName', 'bio', 'phone', 'profileImage'];
  const filteredBody = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Update user
  const updatedUser = await req.user.update(filteredBody);

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.toJSON()
    }
  });
});

/**
 * Deactivate user account
 */
const deactivateAccount = catchAsync(async (req, res, next) => {
  await req.user.update({ isActive: false });

  res.json({
    status: 'success',
    message: 'Account deactivated successfully'
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

  if (!User.validateEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  const existingUser = await User.findByEmail(email);

  res.json({
    status: 'success',
    data: {
      exists: !!existingUser
    }
  });
});

/**
 * Social login (placeholder for OAuth integration)
 */
const socialLogin = catchAsync(async (req, res, next) => {
  const { provider, accessToken, profile } = req.body;

  // This would integrate with OAuth providers like Google, Facebook, etc.
  // For now, it's a placeholder implementation

  if (!provider || !accessToken || !profile) {
    return next(new AppError('Invalid social login data', 400));
  }

  // Verify token with provider (implementation depends on provider)
  // const isValidToken = await verifySocialToken(provider, accessToken);
  
  // For demo, we'll assume token is valid
  const { email, firstName, lastName, picture } = profile;

  // Check if user exists
  let user = await User.findByEmail(email);

  if (!user) {
    // Create new user
    user = await User.create({
      email,
      firstName,
      lastName,
      profileImage: picture,
      isEmailVerified: true, // Social logins are pre-verified
      password: crypto.randomBytes(32).toString('hex') // Random password
    });
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    message: 'Social login successful',
    token,
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * Two-factor authentication setup (placeholder)
 */
const setup2FA = catchAsync(async (req, res, next) => {
  // This would implement 2FA using libraries like speakeasy
  // For now, it's a placeholder

  res.json({
    status: 'success',
    message: '2FA setup not implemented yet'
  });
});

/**
 * Verify 2FA token (placeholder)
 */
const verify2FA = catchAsync(async (req, res, next) => {
  // This would verify 2FA tokens
  // For now, it's a placeholder

  res.json({
    status: 'success',
    message: '2FA verification not implemented yet'
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
  deactivateAccount,
  checkEmail,
  socialLogin,
  setup2FA,
  verify2FA
};