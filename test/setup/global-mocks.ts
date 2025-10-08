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