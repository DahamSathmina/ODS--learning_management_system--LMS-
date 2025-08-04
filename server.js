const app = require('./app');
const config = require('./config/database');

// Try multiple ports if the default is busy
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', () => {
      // Port is busy, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

const PORT = process.env.PORT || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server with port fallback
const startServer = async () => {
  try {
    let serverPort = PORT;
    
    // If PORT is set via environment, use it directly
    // Otherwise, find an available port starting from 3000
    if (!process.env.PORT) {
      serverPort = await findAvailablePort(3000);
      if (serverPort !== 3000) {
        console.log(`⚠️  Port 3000 is busy, using port ${serverPort} instead`);
      }
    }
    
    const server = app.listen(serverPort, () => {
      console.log(`🚀 LMS API Server running on port ${serverPort}`);
      console.log(`📍 Local: http://localhost:${serverPort}`);
      console.log(`🏥 Health check: http://localhost:${serverPort}/health`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${config.database || 'in-memory'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

    return server;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

module.exports = app;