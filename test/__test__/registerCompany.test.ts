import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import CompanyBuilder from './builders/companyBuilder';
import db from '../setup/db';

// Import the mocked module to access mock functions
const mockEmailService = require('../../src/app/services/emailService');

describe('Register Company', () => {
   
  
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
  });

  it('should return 409 if email is already registered and activated', async () => {
    // Use builder to create an active user with all required fields
    await new UserBuilder()
      .withEmail('existing@example.com')
      .withActive(true)
      .withFirstName('John')
      .withLastName('Doe')
      .save();
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
    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already registered and activated');
  });

  it('should resend activation email if user exists but not activated', async () => {
    // Use builder to create an inactive user with all required fields
    await new UserBuilder()
      .withEmail('inactive@example.com')
      .withActive(false)
      .withFirstName('John')
      .withLastName('Doe')
      .save();
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
    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account exists but not activated. A new verification email has been sent.');
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);
  });

  it('should return 409 if company name already exists', async () => {
    // Use builder to create a company with the same name and required fields
    const owner = await new UserBuilder()
      .withEmail('owner@company.com')
      .withActive(true)
      .withFirstName('Owner')
      .withLastName('User')
      .save();
    await new CompanyBuilder()
      .withName('Existing Company Name')
      .withEmail('contact@newcompany.com')
      .withServiceCategory('Technology')
      .withBusinessAddress({
        street: '999 New Street',
        city: 'Perth',
        state: 'WA',
        postcode: '6000',
        country: 'Australia',
      })
      .withAbn('51824753556')
      .withOwner(owner._id)
      .withContact(owner._id)
      .save();
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
      abn: '51824753556',
    };
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
});
