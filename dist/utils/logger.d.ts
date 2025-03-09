import winston from 'winston';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
declare const logger: winston.Logger;
export default logger;
