import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import CompanyBuilder from './builders/companyBuilder';
import Role from '../../src/app/model/role';
import { RoleName } from '../../src/app/enum/roles';

const validOwner = { email: 'owner@example.com', password: 'OwnerPass123' };
const validMember = { email: 'member@example.com', password: 'MemberPass123' };

describe('GET /api/v1/company/:companyId/me/role', () => {
  it('should return owner role for company owner', async () => {
    // Create owner user and company
    const owner = await new UserBuilder()
      .withEmail(validOwner.email)
      .withPassword(validOwner.password)
      .withActive(true)
      .save();
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    const company = await new CompanyBuilder()
      .withName('Owner Test Company')
      .withOwner(owner._id)
      .withContact(owner._id)
      .withMember(owner._id, ownerRole?._id)
      .save();
    // Login as owner to get JWT
    const loginRes = await request(app.application)
      .post('/api/v1/login')
      .send({ email: validOwner.email, password: validOwner.password });
    const token = loginRes.body.data.accessToken;
    // Call endpoint
    const res = await request(app.application)
      .get(`/api/v1/company/${company._id}/me/role`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBeDefined();
    expect(res.body.role.name.toLowerCase()).toBe('owner');
    expect(res.body.role.slug.toLowerCase()).toBe('owner');
  });

  it('should return member role for company member', async () => {
    // Create owner, member, and company
    const owner = await new UserBuilder()
      .withEmail('owner2@example.com')
      .withPassword('OwnerPass123')
      .withActive(true)
      .save();
    const member = await new UserBuilder()
      .withEmail(validMember.email)
      .withPassword(validMember.password)
      .withActive(true)
      .save();
    const memberRole = await Role.findOne({ name: RoleName.EMPLOYEE });
    const company = await new CompanyBuilder()
      .withName('Member Test Company')
      .withOwner(owner._id)
      .withContact(owner._id)
      .withMember(member._id, memberRole?._id)
      .save();
    // Login as member to get JWT
    const loginRes = await request(app.application)
      .post('/api/v1/login')
      .send({ email: validMember.email, password: validMember.password });
    const token = loginRes.body.data.accessToken;
    // Call endpoint
    const res = await request(app.application)
      .get(`/api/v1/company/${company._id}/me/role`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBeDefined();
    expect(res.body.role.name.toLowerCase()).toBe('employee');
    expect(res.body.role.slug.toLowerCase()).toBe('employee');
  });

  it('should return 404 for non-existent company', async () => {
    // Create and login a user
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await new UserBuilder()
      .withEmail('ghost@example.com')
      .withPassword('GhostPass123')
      .withActive(true)
      .save();
    const loginRes = await request(app.application)
      .post('/api/v1/login')
      .send({ email: 'ghost@example.com', password: 'GhostPass123' });
    const token = loginRes.body.data.accessToken;
    // Use a fake companyId that does not exist
    const fakeCompanyId = '507f1f77bcf86cd799439099';
    const res = await request(app.application)
      .get(`/api/v1/company/${fakeCompanyId}/me/role`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/company not found/i);
  });
});
