import request from 'supertest';
import app from '../setup/app';

describe('User Management Endpoints', () => {
  const TEST_USER_ID = '507f1f77bcf86cd799439011';
  const TEST_ROLE_ID = '507f1f77bcf86cd799439012';
  const TEST_COMPANY_ID = '507f1f77bcf86cd799439013';

  beforeAll(async () => {
    await app.loadApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get('/api/v1/admin/users')
        .expect(401);
    });

    it('should return 403 for non-super-admin users', async () => {
      await request(app.getApp())
        .get('/api/v1/admin/users')
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });
  });

  describe('POST /api/v1/company/:id/users', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .post(`/api/v1/company/${TEST_COMPANY_ID}/users`)
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',     
        })
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .post(`/api/v1/company/${TEST_COMPANY_ID}/users`)
        .set('Authorization', 'Bearer regular-token')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/company/:id/users/:userId', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}`)
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });
  });

  describe('PATCH /api/v1/company/:id/users/:userId/role', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .patch(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}/role`)
        .send({ role: TEST_ROLE_ID })
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .patch(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}/role`)
        .set('Authorization', 'Bearer regular-token')
        .send({ role: TEST_ROLE_ID })
        .expect(403);
    });
  });

  describe('PATCH /api/v1/company/:id/users/:userId/remove-role', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .patch(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}/remove-role`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .patch(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}/remove-role`)
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });
  });

  describe('DELETE /api/v1/company/:id/users/:userId', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .delete(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .delete(`/api/v1/company/${TEST_COMPANY_ID}/users/${TEST_USER_ID}`)
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/roles', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get('/api/v1/admin/roles')
        .expect(401);
    });

    it('should return 403 for non-super-admin users', async () => {
      await request(app.getApp())
        .get('/api/v1/admin/roles')
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });
  });
});
