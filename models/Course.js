/**
 * Course Model
 * Represents a course in the Learning Management System
 */

class Course {
  constructor(courseData) {
    this.id = courseData.id || this.generateId();
    this.title = courseData.title;
    this.description = courseData.description;
    this.shortDescription = courseData.shortDescription || null;
    this.category = courseData.category || null;
    this.subcategory = courseData.subcategory || null;
    this.difficulty = courseData.difficulty || 'beginner'; // 'beginner', 'intermediate', 'advanced'
    this.duration = courseData.duration || null; // in hours
    this.language = courseData.language || 'en';
    this.price = courseData.price || 0;
    this.currency = courseData.currency || 'USD';
    this.thumbnail = courseData.thumbnail || null;
    this.previewVideo = courseData.previewVideo || null;
    this.instructorId = courseData.instructorId;
    this.coInstructors = courseData.coInstructors || []; // Array of instructor IDs
    this.tags = courseData.tags || [];
    this.prerequisites = courseData.prerequisites || [];
    this.learningObjectives = courseData.learningObjectives || [];
    this.targetAudience = courseData.targetAudience || [];
    this.isPublished = courseData.isPublished || false;
    this.publishedAt = courseData.publishedAt || null;
    this.isFeatured = courseData.isFeatured || false;
    this.enrollmentCount = courseData.enrollmentCount || 0;
    this.maxEnrollments = courseData.maxEnrollments || null;
    this.rating = courseData.rating || 0;
    this.reviewCount = courseData.reviewCount || 0;
    this.completionRate = courseData.completionRate || 0;
    this.certificateTemplate = courseData.certificateTemplate || null;
    this.allowDiscussions = courseData.allowDiscussions !== false;
    this.allowDownloads = courseData.allowDownloads !== false;
    this.startDate = courseData.startDate || null;
    this.endDate = courseData.endDate || null;
    this.timezone = courseData.timezone || 'UTC';
    this.status = courseData.status || 'draft'; // 'draft', 'published', 'archived'
    this.createdAt = courseData.createdAt || new Date().toISOString();
    this.updatedAt = courseData.updatedAt || new Date().toISOString();
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Update course data
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date().toISOString();
    return this.save();
  }

  // Publish course
  publish() {
    this.isPublished = true;
    this.publishedAt = new Date().toISOString();
    this.status = 'published';
    return this.save();
  }

  // Unpublish course
  unpublish() {
    this.isPublished = false;
    this.publishedAt = null;
    this.status = 'draft';
    return this.save();
  }

  // Archive course
  archive() {
    this.status = 'archived';
    this.isPublished = false;
    return this.save();
  }

  // Check if course is full
  get isFull() {
    return this.maxEnrollments && this.enrollmentCount >= this.maxEnrollments;
  }

  // Check if enrollment is open
  get isEnrollmentOpen() {
    if (!this.isPublished) return false;
    if (this.isFull) return false;
    
    const now = new Date();
    if (this.startDate && new Date(this.startDate) > now) return false;
    if (this.endDate && new Date(this.endDate) < now) return false;
    
    return true;
  }

  // Calculate average rating
  updateRating(newRating, isNewReview = true) {
    if (isNewReview) {
      this.rating = ((this.rating * this.reviewCount) + newRating) / (this.reviewCount + 1);
      this.reviewCount += 1;
    } else {
      // Update existing review
      this.rating = this.rating; // Recalculate from all reviews
    }
    return this.save();
  }

  // Add instructor
  addCoInstructor(instructorId) {
    if (!this.coInstructors.includes(instructorId)) {
      this.coInstructors.push(instructorId);
      return this.save();
    }
    return this;
  }

  // Remove instructor
  removeCoInstructor(instructorId) {
    this.coInstructors = this.coInstructors.filter(id => id !== instructorId);
    return this.save();
  }

  // Add tag
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      return this.save();
    }
    return this;
  }

  // Remove tag
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
  }

  // Save course to storage
  async save() {
    const courses = require('../data/courses');
    const index = courses.findIndex(c => c.id === this.id);
    
    if (index !== -1) {
      courses[index] = this;
    } else {
      courses.push(this);
    }
    
    return this;
  }

  // Convert to JSON
  toJSON() {
    return { ...this };
  }

  // Get public course info
  getPublicInfo() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      shortDescription: this.shortDescription,
      category: this.category,
      subcategory: this.subcategory,
      difficulty: this.difficulty,
      duration: this.duration,
      language: this.language,
      price: this.price,
      currency: this.currency,
      thumbnail: this.thumbnail,
      previewVideo: this.previewVideo,
      tags: this.tags,
      rating: this.rating,
      reviewCount: this.reviewCount,
      enrollmentCount: this.enrollmentCount,
      isFeatured: this.isFeatured,
      createdAt: this.createdAt
    };
  }

  // Static methods for database operations
  static async findById(id) {
    const courses = require('../data/courses');
    const courseData = courses.find(c => c.id === id);
    return courseData ? new Course(courseData) : null;
  }

  static async findOne(query) {
    const courses = require('../data/courses');
    const courseData = courses.find(c => {
      return Object.keys(query).every(key => c[key] === query[key]);
    });
    return courseData ? new Course(courseData) : null;
  }

  static async find(query = {}) {
    const courses = require('../data/courses');
    let filteredCourses = courses;

    if (Object.keys(query).length > 0) {
      filteredCourses = courses.filter(c => {
        return Object.keys(query).every(key => {
          if (Array.isArray(c[key])) {
            return c[key].includes(query[key]);
          }
          return c[key] === query[key];
        });
      });
    }

    return filteredCourses.map(courseData => new Course(courseData));
  }

  static async create(courseData) {
    const course = new Course(courseData);
    await course.save();
    return course;
  }

  static async deleteById(id) {
    const courses = require('../data/courses');
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
      courses.splice(index, 1);
      return true;
    }
    return false;
  }

  // Search courses
  static async search(searchTerm, filters = {}) {
    const courses = require('../data/courses');
    
    let results = courses.filter(course => {
      // Text search
      const matchesSearch = !searchTerm || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filters
      const matchesFilters = Object.keys(filters).every(key => {
        if (key === 'priceRange') {
          const [min, max] = filters[key];
          return course.price >= min && course.price <= max;
        }
        if (key === 'rating') {
          return course.rating >= filters[key];
        }
        if (key === 'duration') {
          const [min, max] = filters[key];
          return course.duration >= min && course.duration <= max;
        }
        return course[key] === filters[key];
      });

      return matchesSearch && matchesFilters;
    });

    return results.map(courseData => new Course(courseData));
  }

  // Get featured courses
  static async getFeatured(limit = 10) {
    const courses = require('../data/courses');
    const featured = courses
      .filter(c => c.isFeatured && c.isPublished)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return featured.map(courseData => new Course(courseData));
  }

  // Get popular courses
  static async getPopular(limit = 10) {
    const courses = require('../data/courses');
    const popular = courses
      .filter(c => c.isPublished)
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);

    return popular.map(courseData => new Course(courseData));
  }

  // Get courses by instructor
  static async getByInstructor(instructorId) {
    const courses = require('../data/courses');
    const instructorCourses = courses.filter(c => 
      c.instructorId === instructorId || c.coInstructors.includes(instructorId)
    );

    return instructorCourses.map(courseData => new Course(courseData));
  }

  // Get course statistics
  static async getStatistics() {
    const courses = require('../data/courses');
    
    const total = courses.length;
    const published = courses.filter(c => c.isPublished).length;
    const draft = courses.filter(c => c.status === 'draft').length;
    const archived = courses.filter(c => c.status === 'archived').length;

    const byCategory = courses.reduce((acc, course) => {
      if (course.category) {
        acc[course.category] = (acc[course.category] || 0) + 1;
      }
      return acc;
    }, {});

    const byDifficulty = courses.reduce((acc, course) => {
      acc[course.difficulty] = (acc[course.difficulty] || 0) + 1;
      return acc;
    }, {});

    const totalEnrollments = courses.reduce((sum, course) => sum + course.enrollmentCount, 0);
    const averageRating = courses.length > 0 
      ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length 
      : 0;

    return {
      total,
      published,
      draft,
      archived,
      byCategory,
      byDifficulty,
      totalEnrollments,
      averageRating: Math.round(averageRating * 100) / 100
    };
  }

  // Validation methods
  static validateTitle(title) {
    return title && title.length >= 3 && title.length <= 200;
  }

  static validateDescription(description) {
    return description && description.length >= 10 && description.length <= 5000;
  }

  static validateDifficulty(difficulty) {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    return validDifficulties.includes(difficulty);
  }

  static validatePrice(price) {
    return typeof price === 'number' && price >= 0;
  }
}

module.exports = Course;