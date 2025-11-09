import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import CompanyBuilder from './builders/companyBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import { RoleName } from '../../src/app/enum/roles';
import Role from '../../src/app/model/role';

let ownerUser: any;
let memberUser: any;
let managerUser: any;
let otherManagerUser: any;
let company: any;
let ownerRole: any;
let managerRole: any;
let employeeRole: any;
let ownerToken: string;
let managerToken: string;
let outsiderToken: string;
let operateSite1: any;
let operateSite2: any;

async function loginAndGetToken(email: string, password: string) {
  const res = await request(app.getApp())
    .post('/api/v1/login')
    .send({ email, password });
  return res.body.data.accessToken;
}

describe('User Management Endpoints', () => {
  beforeEach(async () => {
    // Fetch already-seeded roles
    ownerRole = await Role.findOne({ name: RoleName.OWNER });
    managerRole = await Role.findOne({ name: RoleName.MANAGER });
    employeeRole = await Role.findOne({ name: RoleName.EMPLOYEE });
    // Create users
    ownerUser = await new UserBuilder()
      .withEmail('owner@example.com')
      .withPassword('OwnerPass123')
      .withActive(true)
      .save();
    memberUser = await new UserBuilder()
      .withEmail('member@example.com')
      .withPassword('MemberPass123')
      .withActive(true)
      .save();
    managerUser = await new UserBuilder()
      .withEmail('manager@example.com')
      .withPassword('ManagerPass123')
      .withActive(true)
      .save();
    otherManagerUser = await new UserBuilder()
      .withEmail('manager2@example.com')
      .withPassword('Manager2Pass123')
      .withActive(true)
      .save();
    await new UserBuilder()
      .withEmail('outsider@example.com')
      .withPassword('OutsiderPass123')
      .withActive(true)
      .save();
    // Create company with owner and member
    company = await new CompanyBuilder()
      .withOwner(ownerUser._id)
      .withContact(ownerUser._id)
      .withMember(ownerUser._id, ownerRole._id)
      .withMember(memberUser._id, employeeRole._id)
      .withMember(managerUser._id, managerRole._id)
      .withMember(otherManagerUser._id, managerRole._id)
      .save();
    // Create operate sites for this company
    operateSite1 = await new OperateSiteBuilder().withCompany(company._id).withName('Site 1').save();
    operateSite2 = await new OperateSiteBuilder().withCompany(company._id).withName('Site 2').save();
    // Login users
    ownerToken = await loginAndGetToken('owner@example.com', 'OwnerPass123');
    managerToken = await loginAndGetToken('manager@example.com', 'ManagerPass123');
    outsiderToken = await loginAndGetToken('outsider@example.com', 'OutsiderPass123');
  });

  describe('POST /api/v1/company/:id/invite', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .post(`/api/v1/company/${company._id}/invite`)
        .send({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .post(`/api/v1/company/${company._id}/invite`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(403);
    });

    it('should accept operate site IDs in the request', async () => {
      const response = await request(app.getApp())
        .post(`/api/v1/company/${company._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'unique-invitee@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: employeeRole._id,
          operateSiteIds: [operateSite1._id.toString(), operateSite2._id.toString()],
        });
      // Log response for debugging
      if (response.status === 400) {
        // eslint-disable-next-line no-console
        console.log('Invite validation error:', response.body);
      }
      expect(response.status).not.toBe(400);
    });
  });

  describe('GET /api/v1/company/:id/users/:userId', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/v1/company/:id/users/:userId', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .send({ role: employeeRole._id })
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ role: employeeRole._id })
        .expect(403);
    });

    it('should accept comprehensive user update data', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: employeeRole._id,
          firstName: 'Updated',
          lastName: 'User',
          phoneNumber: '+1234567890',
          jobTitle: 'Senior Developer',
          operateSiteIds: [operateSite1._id.toString()],
        });
      expect(response.status).not.toBe(400);
    });

    it('should return 403 when manager attempts to update another manager', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${otherManagerUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ firstName: 'Blocked' })
        .expect(403);

      expect(response.body.message).toContain('Managers cannot manage other managers');
    });

    it('should return 403 when manager attempts to update the owner', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${ownerUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ firstName: 'BlockedOwner' })
        .expect(403);

      expect(response.body.message).toContain('Managers cannot manage company owners');
    });

    it('should return 403 when manager attempts to assign manager role', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ role: managerRole._id })
        .expect(403);

      expect(response.body.message).toContain('Managers cannot assign owner or manager roles');
    });

    it('should allow manager to update employees in their company', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ firstName: 'ManagerUpdated' })
        .expect(200);

      expect(response.body.firstName).toBe('ManagerUpdated');
    });
  });

  describe('DELETE /api/v1/company/:id/users/:userId', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .delete(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .delete(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });

    it('should return 403 when manager attempts to delete another manager', async () => {
      const response = await request(app.getApp())
        .delete(`/api/v1/company/${company._id}/users/${otherManagerUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Managers cannot delete other managers');
    });

    it('should return 403 when manager attempts to delete the owner', async () => {
      const response = await request(app.getApp())
        .delete(`/api/v1/company/${company._id}/users/${ownerUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Managers cannot delete company owners');
    });

    it('should allow manager to delete employees in their company', async () => {
      const response = await request(app.getApp())
        .delete(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User deleted successfully');
    });
  });

  describe('GET /api/v1/company/:id/roles', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${company._id}/roles`)
        .expect(401);
    });

    it('should return 403 for users without company access', async () => {
      await request(app.getApp())
        .get(`/api/v1/company/${company._id}/roles`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });

    it('should return roles for company owners', async () => {
      const response = await request(app.getApp())
        .get(`/api/v1/company/${company._id}/roles`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
    });
  });

  describe('Operate Sites Assignment', () => {
    it('should validate operateSiteIds field in PATCH request', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          operateSiteIds: [operateSite1._id.toString(), operateSite2._id.toString()],
        });
      expect(response.status).not.toBe(400);
    });

    it('should reject invalid operateSiteIds format', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          operateSiteIds: ['invalid-id', 'another-invalid-id'],
        });
      expect(response.status).toBe(422);
    });

    it('should accept empty operateSiteIds array', async () => {
      const response = await request(app.getApp())
        .patch(`/api/v1/company/${company._id}/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          operateSiteIds: [],
        });
      expect(response.status).not.toBe(400);
    });

    it('should validate operateSiteIds in POST /invite request', async () => {
      const response = await request(app.getApp())
        .post(`/api/v1/company/${company._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          role: employeeRole._id,
          operateSiteIds: [operateSite1._id.toString()],
        });
      expect(response.status).not.toBe(400);
    });
  });
});