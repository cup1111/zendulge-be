import request from 'supertest';
import app from '../setup/app';

// Import the mocked module to access mock functions
const mockEmailService = require('../../src/app/services/emailService');

describe('Register Company', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should register a company if valid data provided', async () => {
    const testData = {
      email: 'companytest@example.com',
      password: 'TestPassword123',
      name: 'John Doe',
      jobTitle: 'CEO',
      companyName: 'Test Company Ltd',
      companyDescription: 'A test company for testing purposes',
      companyWebsite: 'https://testcompany.com',
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.name).toBe(testData.name);
    expect(res.body.company.name).toBe(testData.companyName);
    expect(res.body.message).toBe('Registration successful. Please check your email to verify your account.');

    // Verify that the email service was called with correct parameters
    expect(mockEmailService.default.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.default.sendVerificationEmail).toHaveBeenCalledWith(
      testData.email,
      expect.any(String), // activation code is randomly generated
    );
  });
});
