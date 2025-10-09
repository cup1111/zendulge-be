import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/winston';
import { BaseException } from '../../app/exceptions';

// Async wrapper that passes errors to Express error handler
const asyncMiddleware = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handling middleware - Laravel-style exception handling
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (error: any, req: Request, res: Response, _next: any) => {
  // Log error for debugging
  logger.error('Application error:', { 
    name: error.name,
    message: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  // Handle custom exceptions (Laravel-style)
  if (error instanceof BaseException) {
    const response = error.toResponse();
    return res.status(response.statusCode).json(response);
  }

  // Handle unexpected errors (fallback)
  const response = {
    success: false,
    message: 'An internal server error occurred',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.stack,
      details: error.message,
      name: error.name,
    }),
  };

  res.status(500).json(response);
};

export const globalAsyncErrorHandler = (router: any) => {
  router?.stack?.forEach((item: any) => {
    const { route } = item;
    route?.stack?.forEach((routeItem: any) => {
      routeItem.handle = asyncMiddleware(routeItem.handle);
    });
  });
  return router;
};
