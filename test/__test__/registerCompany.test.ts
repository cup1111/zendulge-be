import request from 'supertest';
import app from '../setup/app';

// Import the mocked module to access mock functions
const mockEmailService = require('../../src/app/services/emailService');

describe('Register Company', () => {
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
    
    const mockCompany = require('../../src/app/model/company');
    mockCompany.default.isNameTaken.mockResolvedValue(null);
    
    mockEmailService.default.sendVerificationEmail.mockResolvedValue(true);
  });

  it('should register a company if valid data provided', async () => {
    const testData = {
      email: 'companytest@example.com',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'Test Company Ltd',
      companyEmail: 'contact@testcompany.com',
      companyDescription: 'A test company for testing purposes',
      serviceCategory: 'Beauty & Wellness',
      businessAddress: {
        street: '123 Test Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      abn: '51824753556', // Valid ABN for testing
      companyWebsite: 'https://testcompany.com',
      facebookUrl: 'https://facebook.com/testcompany',
      twitterUrl: 'https://twitter.com/testcompany',
      logo: 'https://testcompany.com/logo.png',
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);
    expect(res.body.company.name).toBe(testData.companyName);
    expect(res.body.message).toBe('Registration successful. Please check your email to verify your account.');

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
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'Existing Company',
      companyEmail: 'contact@existing.com',
      companyDescription: 'An existing company for testing',
      serviceCategory: 'Professional Services',
      businessAddress: {
        street: '456 Existing Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia',
      },
      companyWebsite: 'https://existing.com',
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
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already registered and activated');
  });

  it('should resend activation email if user exists but not activated', async () => {
    const testData = {
      email: 'inactive@example.com',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'Inactive User Company',
      companyEmail: 'contact@inactive.com',
      companyDescription: 'A company for inactive user testing',
      serviceCategory: 'Health & Fitness',
      businessAddress: {
        street: '789 Inactive Street',
        city: 'Brisbane',
        state: 'QLD',
        postcode: '4000',
        country: 'Australia',
      },
      companyWebsite: 'https://inactive.com',
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
      .post('/api/v1/business-register')
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

  it('should return 409 if company name already exists', async () => {
    const testData = {
      email: 'newuser@example.com',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'Existing Company Name',
      companyEmail: 'contact@newcompany.com',
      companyDescription: 'A company with existing name for testing',
      serviceCategory: 'Technology',
      businessAddress: {
        street: '999 New Street',
        city: 'Perth',
        state: 'WA',
        postcode: '6000',
        country: 'Australia',
      },
      companyWebsite: 'https://newcompany.com',
    };

    // Mock User.findByEmail to return null (user doesn't exist)
    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail = jest.fn().mockResolvedValue(null);

    // Mock userService.store to return a new user
    const mockUserService = require('../../src/app/services/userService');
    const mockNewUser = {
      _id: 'newuser123',
      email: testData.email,
      firstName: testData.firstName,
      lastName: testData.lastName,
    };
    mockUserService.default.store = jest.fn().mockResolvedValue(mockNewUser);

    // Mock Company.isNameTaken to return true (company exists)
    const mockCompany = require('../../src/app/model/company');
    mockCompany.default.isNameTaken = jest.fn().mockResolvedValue({ name: testData.companyName });

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Company already registered');
  });

  it('should return 422 for missing required fields', async () => {
    const invalidData = {
      email: 'test@example.com',
      // Missing password, name, and companyName
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should return 422 for invalid email format', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Test Company',
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should return 422 for weak password', async () => {
    const invalidData = {
      email: 'test@example.com',
      password: '123', // Too weak
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Test Company',
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should handle database connection errors gracefully', async () => {
    const testData = {
      email: 'dbtest@example.com',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'DB Test Company',
      companyEmail: 'contact@dbtestcompany.com',
      serviceCategory: 'Technology',
      businessAddress: {
        street: '123 Test Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      abn: '51824753556',
    };

    // Mock User.findByEmail to throw a database error
    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An internal server error occurred');
  });

  it('should handle email service failures gracefully', async () => {
    const testData = {
      email: 'emailfail@example.com',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'Email Fail Company',
      companyEmail: 'contact@emailfailcompany.com',
      serviceCategory: 'Technology',
      businessAddress: {
        street: '123 Test Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      abn: '51824753556',
    };

    // Mock successful user and company creation but email service failure
    const mockUserFindByEmail = require('../../src/app/model/user');
    mockUserFindByEmail.default.findByEmail = jest.fn().mockResolvedValue(null);

    const mockUserService = require('../../src/app/services/userService');
    const mockNewUser = {
      _id: 'emailfailuser123',
      email: testData.email,
      firstName: testData.firstName,
      lastName: testData.lastName,
    };
    mockUserService.default.store = jest.fn().mockResolvedValue(mockNewUser);
    mockUserService.default.updateActivationCode = jest.fn().mockResolvedValue(true);

    const mockCompany = require('../../src/app/model/company');
    mockCompany.default.isNameTaken = jest.fn().mockResolvedValue(null);

    // Mock email service to fail
    mockEmailService.default.sendVerificationEmail = jest.fn().mockRejectedValue(new Error('Email service unavailable'));

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An internal server error occurred');
  });
});
