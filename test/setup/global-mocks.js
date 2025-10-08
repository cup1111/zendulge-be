// Global test setup for mocking services

// Mock email service globally for all tests
jest.mock('../../src/app/services/emailService', () => ({
  __esModule: true,
  default: {
    sendVerificationEmail: jest.fn().mockResolvedValue({
      MessageId: 'mock-message-id',
      ResponseMetadata: {
        RequestId: 'mock-request-id',
      },
    }),
  },
}));

// You can add other global mocks here
// jest.mock('../src/app/services/otherService', () => ({ ... }));
