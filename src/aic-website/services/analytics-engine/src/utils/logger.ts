/**
 * Logger Utility
 * Centralized logging configuration
 */

import winston from 'winston';

export function createLogger(config: { level: string; format: string }): winston.Logger {
  const formats = [];

  // Add timestamp
  formats.push(winston.format.timestamp());

  // Add error stack traces
  formats.push(winston.format.errors({ stack: true }));

  // Format based on configuration
  if (config.format === 'json') {
    formats.push(winston.format.json());
  } else {
    formats.push(
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        return log;
      })
    );
  }

  return winston.createLogger({
    level: config.level,
    format: winston.format.combine(...formats),
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
  });
}
