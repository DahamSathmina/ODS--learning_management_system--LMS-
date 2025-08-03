const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * User Model
 * This is a simplified model structure. In a real application,
 * you would use an ORM like Mongoose (MongoDB) or Sequelize (SQL)
 */

class User {
  constructor(userData) {
    this.id = userData.id || this.generateId();
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.role = userData.role || 'student'; // 'student', 'instructor', 'admin'
    this.profileImage = userData.profileImage || null;
    this.bio = userData.bio || null;
    this.phone = userData.phone || null;
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    this.isEmailVerified = userData.isEmailVerified || false;
    this.emailVerificationToken = userData.emailVerificationToken || null;
    this.passwordResetToken = userData.passwordResetToken || null;
    this.passwordResetExpires = userData.passwordResetExpires || null;
    this.passwordChangedAt = userData.passwordChangedAt || null;
    this.loginAttempts = userData.loginAttempts || 0;
    this.lockUntil = userData.lockUntil || null;
    this.lastLogin = userData.lastLogin || null;
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = userData.updatedAt || new Date().toISOString();
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
      this.passwordChangedAt = new Date();
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Check if password was changed after JWT was issued
  changedPasswordAfter(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }

  // Generate password reset token
  createPasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
  }

  // Generate email verification token
  createEmailVerificationToken() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    return verificationToken;
  }

  // Check if account is locked
  get isLocked() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  }

  // Increment login attempts
  incLoginAttempts() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
      return this.update({
        loginAttempts: 1,
        lockUntil: null
      });
    }
    
    const updates = { loginAttempts: this.loginAttempts + 1 };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
      updates.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }
    
    return this.update(updates);
  }

  // Reset login attempts
  resetLoginAttempts() {
    return this.update({
      loginAttempts: 0,
      lockUntil: null
    });
  }

  // Update user data
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date().toISOString();
    return this.save();
  }

  // Save user to storage
  async save() {
    // This would interact with your database
    // For now, we'll just update the in-memory storage
    const users = require('../data/users'); // Assuming in-memory storage
    const index = users.findIndex(u => u.id === this.id);
    
    if (index !== -1) {
      users[index] = this;
    } else {
      users.push(this);
    }
    
    return this;
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    const userObject = { ...this };
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    delete userObject.emailVerificationToken;
    delete userObject.loginAttempts;
    delete userObject.lockUntil;
    return userObject;
  }

  // Get public profile
  getPublicProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      profileImage: this.profileImage,
      bio: this.bio
    };
  }

  // Static methods for database operations
  static async findById(id) {
    const users = require('../data/users');
    const userData = users.find(u => u.id === id);
    return userData ? new User(userData) : null;
  }

  static async findByEmail(email) {
    const users = require('../data/users');
    const userData = users.find(u => u.email === email);
    return userData ? new User(userData) : null;
  }

  static async findOne(query) {
    const users = require('../data/users');
    const userData = users.find(u => {
      return Object.keys(query).every(key => u[key] === query[key]);
    });
    return userData ? new User(userData) : null;
  }

  static async find(query = {}) {
    const users = require('../data/users');
    let filteredUsers = users;

    if (Object.keys(query).length > 0) {
      filteredUsers = users.filter(u => {
        return Object.keys(query).every(key => u[key] === query[key]);
      });
    }

    return filteredUsers.map(userData => new User(userData));
  }

  static async create(userData) {
    const user = new User(userData);
    await user.hashPassword();
    await user.save();
    return user;
  }

  static async deleteById(id) {
    const users = require('../data/users');
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  }

  // Validation methods
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateRole(role) {
    const validRoles = ['student', 'instructor', 'admin'];
    return validRoles.includes(role);
  }

  // Search users
  static async search(searchTerm, filters = {}) {
    const users = require('../data/users');
    
    let results = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilters = Object.keys(filters).every(key => 
        user[key] === filters[key]
      );

      return matchesSearch && matchesFilters;
    });

    return results.map(userData => new User(userData));
  }

  // Get user statistics
  static async getStatistics() {
    const users = require('../data/users');
    
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const recentRegistrations = users.filter(u => {
      const userDate = new Date(u.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return userDate > weekAgo;
    }).length;

    return {
      total,
      active,
      inactive: total - active,
      byRole,
      recentRegistrations
    };
  }
}

module.exports = User;