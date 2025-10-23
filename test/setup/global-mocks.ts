// Global mocks for Jest tests

// Mock AWS SDK v3 SES client
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  SendEmailCommand: jest.fn(),
}));

// Mock email service
jest.mock('../../src/app/services/emailService', () => ({
  __esModule: true,
  default: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  },
}));

// Mock custom exceptions
jest.mock('../../src/app/exceptions', () => {
  const originalModule = jest.requireActual('../../src/app/exceptions');
  return {
    ...originalModule,
    // Keep the actual exception classes for instanceof checks
  };
});

// Mock helmet to disable CSRF and other security features during testing
jest.mock('helmet', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Mock compression middleware
jest.mock('compression', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Mock rate limiter
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Mock authentication middleware
jest.mock('../../src/app/middleware/authMiddleware', () => ({
  authenticationTokenMiddleware: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const { AuthenticationException } = require('../../src/app/exceptions');
      return next(new AuthenticationException('Access token is required'));
    }

    const token = authHeader.substring(7);
    
    if (token === 'invalid-token' || token === 'expired-token') {
      const { AuthenticationException } = require('../../src/app/exceptions');
      return next(new AuthenticationException('Invalid access token'));
    }

    // Mock valid token
    req.user = {
      _id: 'user123',
      email: 'test@example.com',
      active: true,
      refreshToken: 'current-refresh-token',
      save: jest.fn().mockResolvedValue(true),
      toJSON: () => ({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
    next();
  }),
  optionalAuthenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
