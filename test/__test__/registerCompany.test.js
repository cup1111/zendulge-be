import request from 'supertest';
import app from '../setup/app';

describe('Register Company', () => {
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
  });
});