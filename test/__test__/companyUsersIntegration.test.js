const request = require('supertest');
const app = require('../setup/app').default;
const UserBuilder = require('./builders/userBuilder').default;
const CompanyBuilder = require('./builders/companyBuilder').default;
const OperateSiteBuilder = require('./builders/operateSiteBuilder').default;
const { RoleName } = require('../../src/app/enum/roles');
const Company = require('../../src/app/model/company').default;
const OperateSite = require('../../src/app/model/operateSite').default;
const User = require('../../src/app/model/user').default;
const Role = require('../../src/app/model/role').default;

let testCompany;
let testOperateSite;
let testUser;
let testRole;
let ownerUser;
let ownerToken;

async function loginAndGetToken(email, password) {
  const res = await request(app.getApp())
    .post('/api/v1/login')
    .send({ email, password });
  return res.body.data.accessToken;
}

describe('Company Users Endpoint Integration', () => {
  it('should return company users with their operate sites', async () => {
    // Clean up collections
    // Fetch already-seeded employee role
    testRole = await Role.findOne({ name: RoleName.EMPLOYEE });
    // Create owner user
    ownerUser = await new UserBuilder()
      .withEmail('owner@test.com')
      .withPassword('OwnerPass123')
      .withActive(true)
      .save();
    // Create company with owner
    testCompany = await new CompanyBuilder()
      .withName('Test Company Ltd')
      .withEmail('company@test.com')
      .withDescription('Test company description for integration tests')
      .withServiceCategory('Technology')
      .withOwner(ownerUser._id)
      .withContact(ownerUser._id)
      .withActive()
      .save();
    // Create operate site
    testOperateSite = await new OperateSiteBuilder()
      .withName('Test Site Integration')
      .withCompany(testCompany._id)
      .save();
    // Create member user
    testUser = await new UserBuilder()
      .withEmail('member@test.com')
      .withPassword('MemberPass123')
      .withActive(true)
      .save();
    // Add member to company
    await Company.findByIdAndUpdate(testCompany._id, {
      $push: {
        members: {
          user: testUser._id,
          role: testRole._id,
          joinedAt: new Date(),
        },
      },
    });
    // Add member to operate site
    await OperateSite.findByIdAndUpdate(testOperateSite._id, {
      $push: { members: testUser._id },
    });
    // Login as owner
    ownerToken = await loginAndGetToken('owner@test.com', 'OwnerPass123');


    const response = await request(app.getApp())
      .get(`/api/v1/company/${testCompany._id}/users`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    // Find the member user
    const memberUser = response.body.find(u => u.email === 'member@test.com');
    expect(memberUser).toBeDefined();
    expect(memberUser.operatingSites).toBeDefined();
    expect(Array.isArray(memberUser.operatingSites)).toBe(true);
    expect(memberUser.operatingSites.length).toBe(1);
    expect(memberUser.operatingSites[0].name).toBe('Test Site Integration');
  });
});
