import winston from 'winston';

// Create custom logger levels if needed
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Define logger configuration type
interface LoggerConfig {
  level: LogLevel;
  format: winston.Logform.Format;
  transports: winston.transport[];
}

// Create logger instance with proper configuration
const logger = winston.createLogger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
} as LoggerConfig);

export default logger;