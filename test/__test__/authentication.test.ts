import request from 'supertest';
import app from '../setup/app';

describe('Authentication', () => {
  const validUserCredentials = {
    email: 'testuser@example.com',
    password: 'SecurePass123',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/v1/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: validUserCredentials.email,
        name: 'Test User',
        active: true,
        toJSON: () => ({
          id: 'user123',
          email: validUserCredentials.email,
          name: 'Test User'
        }),
        generateAuthToken: jest.fn().mockResolvedValue({
          token: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        })
      };

      // Mock User.findByCredentials to return valid user
      const mockUserModel = require('../../src/app/model/user');
      mockUserModel.default.findByCredentials = jest.fn().mockResolvedValue(mockUser);

      const res = await request(app.application)
        .post('/api/v1/login')
        .send(validUserCredentials);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBe('mock-access-token');
      expect(res.body.tokens.refreshToken).toBe('mock-refresh-token');
    });

    it('should return 401 for invalid credentials', async () => {
      // Mock User.findByCredentials to return null (invalid credentials)
      const mockUserModel = require('../../src/app/model/user');
      mockUserModel.default.findByCredentials = jest.fn().mockResolvedValue(null);

      const res = await request(app.application)
        .post('/api/v1/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for unactivated account', async () => {
      // Mock User.findByCredentials to return undefined (unactivated account)
      const mockUserModel = require('../../src/app/model/user');
      mockUserModel.default.findByCredentials = jest.fn().mockResolvedValue(undefined);

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
          password: ''
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/me', () => {
    it('should return user profile with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        active: true,
        toJSON: () => ({
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      };

      // Mock JWT verification and User.findById
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user123' });
      
      const mockUserModel = require('../../src/app/model/user');
      jest.spyOn(mockUserModel.default, 'findById').mockResolvedValue(mockUser);

      const res = await request(app.application)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile retrieved successfully');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe('user123');
    });

    it('should return 401 without authorization header', async () => {
      const res = await request(app.application)
        .get('/api/v1/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access token is required');
    });

    it('should return 401 with invalid token', async () => {
      // Mock JWT verification to throw error
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const res = await request(app.application)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid access token');
    });

    it('should return 401 with expired token', async () => {
      // Mock JWT verification to throw expired error
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

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
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        active: true,
        generateAuthToken: jest.fn().mockResolvedValue({
          token: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      };

      // Mock User.findOne to return user with matching refresh token
      const mockUserModel = require('../../src/app/model/user');
      mockUserModel.default.findOne = jest.fn().mockResolvedValue(mockUser);

      const res = await request(app.application)
        .post('/api/v1/refresh-token')
        .send({
          refreshToken: 'valid-refresh-token'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed successfully');
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBe('new-access-token');
      expect(res.body.tokens.refreshToken).toBe('new-refresh-token');
    });

    it('should return 401 for invalid refresh token', async () => {
      // Mock User.findOne to return null (no user with this refresh token)
      const mockUserModel = require('../../src/app/model/user');
      mockUserModel.default.findOne = jest.fn().mockResolvedValue(null);

      const res = await request(app.application)
        .post('/api/v1/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token'
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
      const res = await request(app.application)
        .post('/api/v1/logout')
        .set('Authorization', 'Bearer valid-token');

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
