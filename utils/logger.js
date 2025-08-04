const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = {
  /**
   * Log info messages
   */
  info: (message) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] INFO: ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
    
    console.log(`ℹ️  ${log.trim()}`);
    
    // Write to file
    fs.appendFileSync(path.join(logsDir, 'app.log'), log);
  },

  /**
   * Log error messages
   */
  error: (message) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ERROR: ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
    
    console.error(`❌ ${log.trim()}`);
    
    // Write to file
    fs.appendFileSync(path.join(logsDir, 'error.log'), log);
    fs.appendFileSync(path.join(logsDir, 'app.log'), log);
  },

  /**
   * Log warning messages
   */
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] WARN: ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
    
    console.warn(`⚠️  ${log.trim()}`);
    
    // Write to file
    fs.appendFileSync(path.join(logsDir, 'app.log'), log);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const log = `[${timestamp}] DEBUG: ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
      
      console.log(`🐛 ${log.trim()}`);
      
      // Write to file
      fs.appendFileSync(path.join(logsDir, 'debug.log'), log);
    }
  }
};

module.exports = logger;