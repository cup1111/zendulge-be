import * as winston from 'winston';
import * as path from 'path';
import 'winston-daily-rotate-file';
import * as fs from 'fs';

const logDir = 'storage/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const createLogger = (logSourceFilePath?: string) => {

  const dailyRotateFileTransport = new (winston.transports as any).DailyRotateFile({
    filename: path.join(logDir, 'logger-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  });

  const transports: winston.transport[] = [dailyRotateFileTransport];

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
    transports.push(new winston.transports.Console());
  }

  const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
      file: logSourceFilePath ? path.basename(logSourceFilePath) : undefined,
    },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(
        (info: any) => {
          const { timestamp, level, message, file, requestPath, method, error, stack, ...meta } = info;
          const fileInfo = file ? `[${String(file)}]` : '';
          const requestInfo = requestPath && method ? `[${String(method)} ${String(requestPath)}]` : '';
          
          // Handle error object properly
          let errorDetails = '';
          if (error && typeof error === 'object') {
            errorDetails = `\nERROR DETAILS: ${JSON.stringify(error, null, 2)}`;
          }
          
          // Handle stack trace
          let stackTrace = '';
          if (stack) {
            stackTrace = `\nSTACK TRACE:\n${String(stack)}`;
          } else if (error && typeof error === 'object' && 'stack' in error && error.stack) {
            stackTrace = `\nSTACK TRACE:\n${String(error.stack)}`;
          }
          
          // Handle additional metadata
          let metadata = '';
          if (Object.keys(meta).length > 0) {
            metadata = `\nMETADATA: ${JSON.stringify(meta, null, 2)}`;
          }
          
          return `[${timestamp}]${fileInfo}${requestInfo} [${level.toUpperCase()}]: ${message}${errorDetails}${stackTrace}${metadata}`;
        },
      ),
    ),
    transports,
  });
  return logger;
};

const logger = createLogger();
export { createLogger, logger };