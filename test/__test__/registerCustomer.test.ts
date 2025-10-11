import request from 'supertest';
import app from '../setup/app';

// Import the mocked module to access mock functions
const mockEmailService = require('../../src/app/services/emailService');

describe('Register Customer', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset mocks to default successful state
    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail.mockResolvedValue(null);
    
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.default.store.mockImplementation((userData: any) => Promise.resolve({
      _id: 'user123',
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }));
    
    mockEmailService.default.sendVerificationEmail.mockResolvedValue(true);
  });

  it('should register a customer if valid data provided', async () => {
    const testData = {
      email: 'customer@example.com',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Designer',
    };

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);
    expect(res.body.message).toBe('Customer registered successfully. Please check your email to verify your account.');

    // Verify that the email service was called with correct parameters
    expect(mockEmailService.default.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.default.sendVerificationEmail).toHaveBeenCalledWith(
      testData.email,
      expect.any(String), // activation code is randomly generated
    );
  });

  it('should return 409 if email is already registered and activated', async () => {
    const testData = {
      email: 'existing@example.com',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    // Mock User.findByEmail to return an active user
    const mockUser = {
      _id: 'user123',
      email: testData.email,
      firstName: testData.firstName,
      lastName: testData.lastName,
      active: true,
    };

    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail = jest.fn().mockResolvedValue(mockUser);

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already registered and activated');
  });

  it('should resend activation email if user exists but not activated', async () => {
    const testData = {
      email: 'inactive@example.com',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    // Mock User.findByEmail to return an inactive user
    const mockUser = {
      _id: 'user456',
      email: testData.email,
      firstName: testData.firstName,
      lastName: testData.lastName,
      active: false,
    };

    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail = jest.fn().mockResolvedValue(mockUser);

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account exists but not activated. A new verification email has been sent.');
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);

    // Verify email service was called for resending activation
    expect(mockEmailService.default.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('should return 422 for missing required fields', async () => {
    const invalidData = {
      email: 'test@example.com',
      // Missing password and name
    };

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should return 422 for invalid email format', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should return 422 for weak password', async () => {
    const invalidData = {
      email: 'test@example.com',
      password: '123', // Too weak
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should handle database connection errors gracefully', async () => {
    const testData = {
      email: 'dbtest@example.com',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    // Mock User.findByEmail to throw a database error
    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An internal server error occurred');
  });

  it('should handle email service failures gracefully', async () => {
    const testData = {
      email: 'emailfail@example.com',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    // Mock successful user creation but email service failure
    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail.mockResolvedValue(null);

    const mockUserService = require('../../src/app/services/userService');
    const mockNewUser = {
      _id: 'emailfailuser123',
      email: testData.email,
      firstName: testData.firstName,
      lastName: testData.lastName,
    };
    mockUserService.default.store.mockResolvedValue(mockNewUser);
    mockUserService.default.updateActivationCode.mockResolvedValue(true);

    // Mock email service to fail
    mockEmailService.default.sendVerificationEmail = jest.fn().mockRejectedValue(new Error('Email service unavailable'));

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An internal server error occurred');
  });

  it('should register customer without optional jobTitle', async () => {
    const testData = {
      email: 'minimal@example.com',
      password: 'TestPassword123',
      firstName: 'Minimal',
      lastName: 'User',
      // No jobTitle provided
    };

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);
    expect(res.body.message).toBe('Customer registered successfully. Please check your email to verify your account.');
  });
});
