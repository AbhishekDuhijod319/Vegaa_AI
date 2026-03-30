// Logger utility for consistent logging across the application

/**
 * Logger levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * Current log level (can be configured via environment)
 */
const CURRENT_LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL 
  ? LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL.toUpperCase()] 
  : LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @returns {string} - Formatted log message
 */
const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (data !== undefined) {
    return `${prefix} ${message}`;
  }
  
  return `${prefix} ${message}`;
};

/**
 * Log error messages
 * @param {string} message - Error message
 * @param {any} data - Additional error data
 */
const error = (message, data) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message), data || '');
  }
};

/**
 * Log warning messages
 * @param {string} message - Warning message
 * @param {any} data - Additional warning data
 */
const warn = (message, data) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message), data || '');
  }
};

/**
 * Log info messages
 * @param {string} message - Info message
 * @param {any} data - Additional info data
 */
const info = (message, data) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
    console.info(formatMessage('INFO', message), data || '');
  }
};

/**
 * Log debug messages
 * @param {string} message - Debug message
 * @param {any} data - Additional debug data
 */
const debug = (message, data) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
    console.debug(formatMessage('DEBUG', message), data || '');
  }
};

/**
 * Log API requests
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {any} data - Request data
 */
const apiRequest = (method, url, data) => {
  debug(`API Request: ${method} ${url}`, data);
};

/**
 * Log API responses
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} status - Response status
 * @param {any} data - Response data
 */
const apiResponse = (method, url, status, data) => {
  if (status >= 400) {
    error(`API Error: ${method} ${url} - Status: ${status}`, data);
  } else {
    debug(`API Response: ${method} ${url} - Status: ${status}`, data);
  }
};

/**
 * Log user actions for analytics
 * @param {string} action - User action
 * @param {any} data - Action data
 */
const userAction = (action, data) => {
  info(`User Action: ${action}`, data);
};

export const logger = {
  error,
  warn,
  info,
  debug,
  apiRequest,
  apiResponse,
  userAction,
};

export default logger;