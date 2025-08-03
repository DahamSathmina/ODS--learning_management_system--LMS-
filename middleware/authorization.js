/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin
 * @param {string} resourceUserIdField - Field name containing the user ID
 */
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Check if user is the course instructor or admin
 */
const authorizeCourseInstructorOrAdmin = (courseIdField = 'courseId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const Course = require('../models/Course');
      const courseId = req.params[courseIdField] || req.body[courseIdField];
      
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Course not found'
        });
      }

      // Check if user is the course instructor
      if (course.instructorId !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only course instructor or admin can perform this action'
        });
      }

      req.course = course; // Attach course to request for further use
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Server error',
        message: 'Error during authorization'
      });
    }
  };
};

/**
 * Check if user is enrolled in the course
 */
const authorizeEnrolledStudent = (courseIdField = 'courseId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      const Enrollment = require('../models/Enrollment');
      const courseId = req.params[courseIdField] || req.body[courseIdField];
      
      const enrollment = await Enrollment.findOne({
        courseId,
        userId: req.user.id,
        status: 'active'
      });

      if (!enrollment) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You must be enrolled in this course'
        });
      }

      req.enrollment = enrollment; // Attach enrollment to request
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Server error',
        message: 'Error during authorization'
      });
    }
  };
};

/**
 * Flexible authorization - allows multiple conditions
 */
const authorizeAny = (...conditions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    let authorized = false;
    
    for (const condition of conditions) {
      try {
        if (typeof condition === 'string') {
          // Role-based check
          if (req.user.role === condition) {
            authorized = true;
            break;
          }
        } else if (typeof condition === 'function') {
          // Custom function check
          const result = await condition(req);
          if (result) {
            authorized = true;
            break;
          }
        }
      } catch (error) {
        // Continue to next condition
        continue;
      }
    }

    if (!authorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  authorizeOwnerOrAdmin,
  authorizeCourseInstructorOrAdmin,
  authorizeEnrolledStudent,
  authorizeAny
};