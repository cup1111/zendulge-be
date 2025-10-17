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

// Mock User model
jest.mock('../../src/app/model/user', () => ({
  __esModule: true,
  default: {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

// Mock Company model
const mockCompanyConstructor = jest.fn().mockImplementation((data) => ({
  ...data,
  _id: 'company123',
  save: jest.fn().mockResolvedValue({
    _id: 'company123',
    name: data.name,
  }),
}));

// Add static methods to the constructor
(mockCompanyConstructor as any).isNameTaken = jest.fn().mockResolvedValue(null);

jest.mock('../../src/app/model/company', () => ({
  __esModule: true,
  default: mockCompanyConstructor,
}));

// Mock userService
jest.mock('../../src/app/services/userService', () => ({
  __esModule: true,
  default: {
    store: jest.fn().mockResolvedValue({
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    }),
    updateActivationCode: jest.fn().mockResolvedValue(true),
    activateUser: jest.fn(),
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

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 'user123' }),
}));

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

// Mock company access middleware
jest.mock('../../src/app/middleware/companyAccessMiddleware', () => ({
  requireCompanyAccess: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.header('Authorization');
    const companyId = req.params.id;
    
    // If no authentication header, let the auth middleware handle it
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    // Simulate unauthorized access for regular tokens
    if (token === 'regular-token') {
      const { AuthorizationException } = require('../../src/app/exceptions');
      return next(new AuthorizationException('Access denied: You do not have permission to access this company'));
    }

    // For admin tokens or valid company access, attach mock company
    req.company = {
      _id: companyId,
      name: 'Test Company',
      owner: 'user123',
      isActive: true,
    };
    
    next();
  }),
  validateCompanyAccess: jest.fn((req: any, res: any, next: any) => next()),
}));

// Mock super admin middleware
jest.mock('../../src/app/middleware/operateSitePermissionMiddleware', () => ({
  isSuperAdmin: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.header('Authorization');
    
    // If no authentication header, let the auth middleware handle it
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    // Simulate unauthorized access for regular tokens
    if (token === 'regular-token') {
      const { AuthorizationException } = require('../../src/app/exceptions');
      return next(new AuthorizationException('Admin access required'));
    }

    // For admin tokens, continue
    next();
  }),
  operateSiteOwnershipOrAdminMiddleware: jest.fn((req: any, res: any, next: any) => next()),
  isSuperAdminOrCompanyAccess: jest.fn((req: any, res: any, next: any) => next()),
}));