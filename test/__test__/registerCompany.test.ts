import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import BusinessBuilder from './builders/businessBuilder';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import db from '../setup/db';

// Import the mocked module to access mock functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockEmailService = require('../../src/app/services/emailService');

describe('Register Business', () => {


  it('should register a business if valid data provided', async () => {
    const testData = {
      email: 'businesstest@example.com',
      password: 'TestPassword123',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      businessName: 'Test Business Ltd',
      businessEmail: 'contact@testbusiness.com',
      businessDescription: 'A test business for testing purposes',
      categories: ['Beauty & Wellness'],
      businessAddress: {
        street: '123 Test Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      abn: '51824753556', // Valid ABN for testing
      businessWebsite: 'https://testbusiness.com',
      facebookUrl: 'https://facebook.com/testbusiness',
      twitterUrl: 'https://twitter.com/testbusiness',
      logo: 'https://testbusiness.com/logo.png',
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);
    expect(res.body.business.name).toBe(testData.businessName);
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
      businessName: 'Existing Business',
      businessEmail: 'contact@existing.com',
      businessDescription: 'An existing business for testing',
      categories: ['Professional Services'],
      businessAddress: {
        street: '456 Existing Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia',
      },
      businessWebsite: 'https://existing.com',
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
      businessName: 'Inactive User Business',
      businessEmail: 'contact@inactive.com',
      businessDescription: 'A business for inactive user testing',
      categories: ['Health & Fitness'],
      businessAddress: {
        street: '789 Inactive Street',
        city: 'Brisbane',
        state: 'QLD',
        postcode: '4000',
        country: 'Australia',
      },
      businessWebsite: 'https://inactive.com',
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

  it('should return 409 if business name already exists', async () => {
    // Use builder to create a business with the same name and required fields
    const owner = await new UserBuilder()
      .withEmail('owner@business.com')
      .withActive(true)
      .withFirstName('Owner')
      .withLastName('User')
      .save();
    await new BusinessBuilder()
      .withName('Existing Business Name')
      .withEmail('contact@newbusiness.com')
      .withCategories(['Technology'])
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
      businessName: 'Existing Business Name',
      businessEmail: 'contact@newbusiness.com',
      businessDescription: 'A business with existing name for testing',
      categories: ['Technology'],
      businessAddress: {
        street: '999 New Street',
        city: 'Perth',
        state: 'WA',
        postcode: '6000',
        country: 'Australia',
      },
      businessWebsite: 'https://newbusiness.com',
      abn: '51824753556',
    };
    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(testData);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Business already registered');
  });

  it('should return 422 for missing required fields', async () => {
    const invalidData = {
      email: 'test@example.com',
      // Missing password, name, and businessName
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
      businessName: 'Test Business',
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
      businessName: 'Test Business',
    };

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send(invalidData);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });
});
