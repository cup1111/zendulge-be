import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import BusinessBuilder from './builders/businessBuilder';
import { config } from '../../src/app/config/app';

const jwt = require('jsonwebtoken');

describe('Authentication', () => {
  const validUserCredentials = {
    email: 'testuser@example.com',
    password: 'SecurePass123',
  };

  describe('POST /api/v1/login', () => {
    it('should login user with valid credentials', async () => {
      // Create a user in the DB
      await new UserBuilder()
        .withEmail(validUserCredentials.email)
        .withPassword(validUserCredentials.password)
        .withActive(true)
        .withFirstName('Test')
        .withLastName('User')
        .save();

      const res = await request(app.application)
        .post('/api/v1/login')
        .send(validUserCredentials);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      // No user created, so credentials are invalid
      const res = await request(app.application)
        .post('/api/v1/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for unactivated account', async () => {
      // Create an inactive user
      await new UserBuilder()
        .withEmail(validUserCredentials.email)
        .withPassword(validUserCredentials.password)
        .withActive(false)
        .withFirstName('Test')
        .withLastName('User')
        .save();

      const res = await request(app.application)
        .post('/api/v1/login')
        .send(validUserCredentials);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Account not activated. Please check your email for activation instructions.');
    });

    it('should return 422 for validation errors', async () => {
      const res = await request(app.application)
        .post('/api/v1/login')
        .send({
          email: 'invalid-email',
          password: '',
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors).toBeDefined();
    });

    // CRITICAL BUSINESS ID BUG PREVENTION TESTS
    it('should return JWT with valid business ID strings (preventing business ID {} bug)', async () => {
      process.env.JWT_SECRET = 'test_jwt_secret';
      // Create user and business in DB
      const user = await new UserBuilder()
        .withEmail(validUserCredentials.email)
        .withPassword(validUserCredentials.password)
        .withActive(true)
        .withFirstName('Test')
        .withLastName('User')
        .save();
      await new BusinessBuilder()
        .withName('Test Company')
        .withOwner(user.id)
        .withContact(user.id)
        .save();

      const res = await request(app.application)
        .post('/api/v1/login')
        .send(validUserCredentials);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      // Decode JWT token to verify business ID format
      const decoded = jwt.verify(res.body.data.accessToken, config.accessSecret);
      expect(decoded).toBeDefined();
      expect(decoded.businesses).toBeDefined();
      expect(Array.isArray(decoded.businesses)).toBe(true);
      if (decoded.businesses.length > 0) {
        const firstBusiness = decoded.businesses[0];
        expect(firstBusiness).toBeDefined();
        expect(firstBusiness.id).toBeDefined();
        expect(firstBusiness.name).toBeDefined();
        expect(typeof firstBusiness.id).toBe('string');
        expect(firstBusiness.id).not.toBe('');
        expect(firstBusiness.id).not.toBe('{}');
        expect(firstBusiness.id).toMatch(/^[0-9a-fA-F]{24}$/);
        expect(firstBusiness.id).toBeTruthy();
      }
    });

    it('should validate all business IDs in JWT when user has multiple businesses', async () => {
      // Create user and multiple businesses in DB
      const user = await new UserBuilder()
        .withEmail(validUserCredentials.email)
        .withPassword(validUserCredentials.password)
        .withActive(true)
        .withFirstName('Test')
        .withLastName('User')
        .save();
      await new BusinessBuilder()
        .withName('Company 1')
        .withOwner(user._id)
        .withContact(user._id)
        .save();
      await new BusinessBuilder()
        .withName('Company 2')
        .withOwner(user._id)
        .withContact(user._id)
        .save();

      const res = await request(app.application)
        .post('/api/v1/login')
        .send(validUserCredentials);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      // Decode JWT token to verify all business ID formats
      const decoded = jwt.verify(res.body.data.accessToken, config.accessSecret);
      if (decoded.businesses && decoded.businesses.length > 0) {
        for (const business of decoded.businesses) {
          expect(business.id).toBeDefined();
          expect(typeof business.id).toBe('string');
          expect(business.id).not.toBe('');
          expect(business.id).not.toBe('{}');
          expect(business.id).toMatch(/^[0-9a-fA-F]{24}$/);
          expect(business.id).toBeTruthy();
          expect(business.name).toBeTruthy();
        }
      }
    });
  });

  describe('GET /api/v1/me', () => {
    it('should return user profile with valid token', async () => {
      // Create a user and login to get a real JWT
      await new UserBuilder()
        .withEmail('test2@example.com')
        .withPassword('SecurePass123')
        .withActive(true)
        .withFirstName('Test')
        .withLastName('User')
        .save();
      const loginRes = await request(app.application)
        .post('/api/v1/login')
        .send({ email: 'test2@example.com', password: 'SecurePass123' });
      const token = loginRes.body.data.accessToken;

      const res = await request(app.application)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile retrieved successfully');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test2@example.com');
    });

    it('should return 401 without authorization header', async () => {
      const res = await request(app.application)
        .get('/api/v1/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access token is required');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app.application)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid access token');
    });

    it('should return 401 with expired token', async () => {
      const res = await request(app.application)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer expired-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid access token');
    });
  });

  describe('POST /api/v1/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // Create a user and login to get a real refresh token
      await new UserBuilder()
        .withEmail('test2@example.com')
        .withPassword('SecurePass123')
        .withActive(true)
        .save();
      const loginRes = await request(app.application)
        .post('/api/v1/login')
        .send({ email: 'test2@example.com', password: 'SecurePass123' });
      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app.application)
        .post('/api/v1/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed successfully');
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app.application)
        .post('/api/v1/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid refresh token');
    });

    it('should return 422 for missing refresh token', async () => {
      const res = await request(app.application)
        .post('/api/v1/refresh-token')
        .send({});

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/v1/logout', () => {
    it('should logout user with valid token', async () => {
      // Create a user and login to get a real JWT
      await new UserBuilder()
        .withEmail('testlogout@example.com')
        .withPassword('LogoutPass123')
        .withActive(true)
        .save();
      const loginRes = await request(app.application)
        .post('/api/v1/login')
        .send({ email: 'testlogout@example.com', password: 'LogoutPass123' });
      const token = loginRes.body.data.accessToken;
      const res = await request(app.application)
        .post('/api/v1/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logout successful');
    });

    it('should return 401 without authorization header', async () => {
      const res = await request(app.application)
        .post('/api/v1/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access token is required');
    });
  });
});
