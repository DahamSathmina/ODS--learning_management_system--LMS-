# ODS Learning Management System API

A comprehensive REST API for a Learning Management System built with Node.js, Express, and modern best practices.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Students, instructors, and administrators
- 📚 **Course Management** - Create, manage, and publish courses
- 📖 **Lesson System** - Video lessons with progress tracking
- 📊 **Progress Tracking** - Student progress and completion rates
- 📈 **Analytics** - Course and user analytics
- 🔒 **Security** - Rate limiting, input validation, and sanitization
- 📧 **Email Integration** - Email verification and notifications
- 🧪 **Testing** - Comprehensive test suite
- 📖 **Documentation** - API documentation and examples

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Email**: Nodemailer
- **Testing**: Jest & Supertest
- **Linting**: ESLint with Airbnb config
- **Code Formatting**: Prettier

## Project Structure

```
lms-api/
├── controllers/       # Request handlers
├── middleware/        # Custom middleware
├── models/            # Data models
├── routes/            # API routes
├── services/          # Business services
├── utils/             # Utility functions
├── config/            # Configuration files
├── database/          # Database setup and migrations
├── tests/             # Test files
├── uploads/           # File uploads
├── logs/              # Application logs
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DahamSathmina/ODS-LMS-API.git
   cd ODS-LMS-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=24h
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| POST | `/api/auth/change-password` | Change password (authenticated) |
| GET | `/api/auth/verify-email/:token` | Verify email address |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update current user profile |
| GET | `/api/users` | Get all users (admin only) |
| POST | `/api/users/check-email` | Check if email exists |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses` | Create new course |
| GET | `/api/courses` | Get all published courses |
| GET | `/api/courses/:id` | Get course by ID |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| GET | `/api/courses/featured` | Get featured courses |
| GET | `/api/courses/popular` | Get popular courses |

### Lessons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/:courseId/lessons` | Create lesson |
| GET | `/api/courses/:courseId/lessons` | Get course lessons |
| PUT | `/api/lessons/:id` | Update lesson |
| DELETE | `/api/lessons/:id` | Delete lesson |

### Enrollments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/:courseId/enroll` | Enroll in course |
| GET | `/api/users/enrollments` | Get user enrollments |
| DELETE | `/api/enrollments/:id` | Unenroll from course |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lessons/:lessonId/complete` | Mark lesson complete |
| GET | `/api/courses/:courseId/progress` | Get course progress |
| GET | `/api/users/progress` | Get user progress |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:courseId/analytics` | Get course analytics |
| GET | `/api/analytics/overview` | Get system overview |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **Student**: Can enroll in courses, track progress, submit assignments
- **Instructor**: Can create and manage courses, view analytics
- **Admin**: Full system access, user management, system analytics

## Request/Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

### Response
```json
{
  "status": "success",
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "abc123",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

### Create Course
```bash
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to Web Development",
  "description": "Learn the basics of HTML, CSS, and JavaScript",
  "category": "Programming",
  "difficulty": "beginner",
  "duration": 40,
  "price": 99.99
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2023-08-03T10:30:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint        # Check code style
npm run lint:fix    # Fix code style issues
npm run format      # Format code with Prettier

# Database
npm run migrate     # Run database migrations
npm run seed        # Seed database with sample data
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 24h |
| `SMTP_HOST` | Email SMTP host | - |
| `SMTP_PORT` | Email SMTP port | 587 |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.js
```

### Test Structure

- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test API endpoints and workflows
- **Fixtures**: Sample data for testing

## Deployment

### Production Setup

1. **Set environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   # ... other production configs
   ```

2. **Install production dependencies**
   ```bash
   npm ci --only=production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- **Rate Limiting**: Prevents abuse and DoS attacks
- **Helmet**: Sets security headers
- **Input Validation**: Validates and sanitizes user input
- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **CORS**: Configurable cross-origin resource sharing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/lms-api/issues)
- 📖 Docs: [API Documentation](https://docs.google.com/document/d/1wzOq13DjH5xsGICiYuE3ZA9Ei5s4bH69i2zXVw2suGE/edit?usp=sharing)

## Roadmap

- [ ] Real-time notifications
- [ ] Video streaming integration
- [ ] Mobile app API endpoints
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Discussion forums
- [ ] Assignment submissions
- [ ] Quiz/exam system
- [ ] Certificate generation
