import { Request, Response, NextFunction } from 'express';
import { winstonLogger } from '../logger';
import { BaseException } from '../../app/exceptions';

// Async wrapper that passes errors to Express error handler
const asyncMiddleware =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Global error handling middleware - Express best practices
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
) => {
  // Extract error details
  const errorName = error?.name || 'UnknownError';
  const errorMessage = error?.message || 'An unknown error occurred';
  const errorStack = error?.stack || 'No stack trace available';
  const requestUrl = req?.url || req?.originalUrl || 'Unknown URL';
  const requestMethod = req?.method || 'Unknown method';
  const userAgent = req?.get('User-Agent') || 'Unknown user agent';
  const requestId =
    (req as any)?.id || req?.headers['x-request-id'] || 'No request ID';

  // Create comprehensive error context
  const errorContext = {
    error: {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
    },
    request: {
      method: requestMethod,
      url: requestUrl,
      userAgent,
      requestId,
      body: req?.body ? JSON.stringify(req.body) : 'No body',
      query: req?.query ? JSON.stringify(req.query) : 'No query',
      params: req?.params ? JSON.stringify(req.params) : 'No params',
      headers: req?.headers ? JSON.stringify(req.headers) : 'No headers',
    },
    timestamp: new Date().toISOString(),
  };

  // Log error with full context and stack trace
  try {
    winstonLogger.error(`${errorName}: ${errorMessage}`, errorContext);

    // Also log a formatted version with stack trace for readability
    winstonLogger.error(`STACK TRACE FOR ${errorName}:\n${errorStack}`);
  } catch (loggingError) {
    // Fallback logging if winston fails - only in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('WINSTON LOGGER FAILED:', loggingError);
      // eslint-disable-next-line no-console
      console.error('ORIGINAL ERROR:', error);
      // eslint-disable-next-line no-console
      console.error('ERROR CONTEXT:', errorContext);
    }
  }

  // Handle custom exceptions (Laravel-style)
  if (error instanceof BaseException) {
    const response = error.toResponse();
    return res.status(response.statusCode).json(response);
  }

  // Handle common HTTP errors
  let statusCode = 500;
  let message = 'An internal server error occurred';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Prepare response
  const response = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: errorName,
        message: errorMessage,
        stack: errorStack,
      },
      request: {
        method: requestMethod,
        url: requestUrl,
      },
    }),
  };

  res.status(statusCode).json(response);
};

export const globalAsyncErrorHandler = (router: any) => {
  if (router?.stack) {
    for (const item of router.stack) {
      const { route } = item;
      if (route?.stack) {
        for (const routeItem of route.stack) {
          routeItem.handle = asyncMiddleware(routeItem.handle);
        }
      }
    }
  }
  return router;
};
