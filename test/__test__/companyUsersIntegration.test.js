const request = require('supertest');
const app = require('../setup/app').default;
const UserBuilder = require('./builders/userBuilder').default;
const BusinessBuilder = require('./builders/businessBuilder').default;
const OperateSiteBuilder = require('./builders/operateSiteBuilder').default;
const { RoleName } = require('../../src/app/enum/roles');
const Business = require('../../src/app/model/business').default;
const OperateSite = require('../../src/app/model/operateSite').default;
const User = require('../../src/app/model/user').default;
const Role = require('../../src/app/model/role').default;

let testBusiness;
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

describe('Business Users Endpoint Integration', () => {
  it('should return business users with their operate sites', async () => {
    // Clean up collections
    // Fetch already-seeded employee role
    testRole = await Role.findOne({ name: RoleName.EMPLOYEE });
    // Create owner user
    ownerUser = await new UserBuilder()
      .withEmail('owner@test.com')
      .withPassword('OwnerPass123')
      .withActive(true)
      .save();
    // Create business with owner
    testBusiness = await new BusinessBuilder()
      .withName('Test Business Ltd')
      .withEmail('business@test.com')
      .withDescription('Test business description for integration tests')
      .withCategories(['Technology'])
      .withOwner(ownerUser._id)
      .withContact(ownerUser._id)
      .withActive()
      .save();
    // Create operate site
    testOperateSite = await new OperateSiteBuilder()
      .withName('Test Site Integration')
      .withBusiness(testBusiness._id)
      .save();
    // Create member user
    testUser = await new UserBuilder()
      .withEmail('member@test.com')
      .withPassword('MemberPass123')
      .withActive(true)
      .save();
    // Add member to business
    await Business.findByIdAndUpdate(testBusiness._id, {
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
      .get(`/api/v1/business/${testBusiness._id}/users`)
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
