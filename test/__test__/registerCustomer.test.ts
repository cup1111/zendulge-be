import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';

describe('Register Customer', () => {
  beforeEach(async () => {
    // No mocks to clear
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
  });

  it('should return 409 if email is already registered and activated', async () => {
    const testData = {
      email: 'existing@example.com',
      password: 'TestPassword123',
      firstName: 'Jane',
      lastName: 'Smith',
    };
    // Create an already activated user
    await new UserBuilder()
      .withEmail(testData.email)
      .withPassword(testData.password)
      .withFirstName(testData.firstName)
      .withLastName(testData.lastName)
      .withActive(true)
      .save();

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
    // Create an inactive user
    await new UserBuilder()
      .withEmail(testData.email)
      .withPassword(testData.password)
      .withFirstName(testData.firstName)
      .withLastName(testData.lastName)
      .withActive(false)
      .save();

    const res = await request(app.application)
      .post('/api/v1/register')
      .send(testData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account exists but not activated. A new verification email has been sent.');
    expect(res.body.user.email).toBe(testData.email);
    expect(res.body.user.firstName).toBe(testData.firstName);
    expect(res.body.user.lastName).toBe(testData.lastName);
  });

  it('should return 422 for missing required fields', async () => {
    const invalidData = {
      email: 'test@example.com',
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
      password: '123',
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

  it('should register customer without optional jobTitle', async () => {
    const testData = {
      email: 'minimal@example.com',
      password: 'TestPassword123',
      firstName: 'Minimal',
      lastName: 'User',
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
