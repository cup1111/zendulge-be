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