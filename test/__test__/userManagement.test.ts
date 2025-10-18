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

  describe('GET /api/v1/company/:id/roles', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/roles`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/roles`)
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });

    it('should return roles for company admins', async () => {
      // First, let's create some test roles
      const Role = require('../../src/app/model/role').default;
      const { RoleName } = require('../../src/app/enum/roles');
      
      // Create test roles
      await Role.deleteMany({}); // Clean up first
      const testRoles = [
        {
          name: RoleName.OWNER,
          description: 'Business owner',
          isActive: true,
        },
        {
          name: RoleName.EMPLOYEE,
          description: 'Employee',
          isActive: true,
        },
        {
          name: RoleName.CUSTOMER,
          description: 'Customer role',
          isActive: true,
        },
      ];
      
      await Role.insertMany(testRoles);

      const response = await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/roles`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
    });
  });



  describe('GET /api/v1/company/:id/roles', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/roles`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/roles`)
        .set('Authorization', 'Bearer regular-token')
        .expect(403);
    });

    it('should return roles for company admin', async () => {
      // Mock the models
      const Role = require('../../src/app/model/role').default;
      const { RoleName } = require('../../src/app/enum/roles');
      
      // Create test roles if they don't exist
      const existingRoles = await Role.find({ isActive: true });
      if (existingRoles.length === 0) {
        const testRoles = [
          {
            name: RoleName.OWNER,
            description: 'Owner role',
            isActive: true,
          },
          {
            name: RoleName.EMPLOYEE,
            description: 'Employee role',
            isActive: true,
          },
          {
            name: RoleName.CUSTOMER,
            description: 'Customer role',
            isActive: true,
          },
        ];
        
        await Role.insertMany(testRoles);
      }

      const response = await request(app.getApp())
        .get(`/api/v1/company/${TEST_COMPANY_ID}/roles`)
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
    });
  });
});
