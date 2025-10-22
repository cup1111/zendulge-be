const request = require('supertest');
const app = require('../setup/app').default;

describe('Company Users Endpoint Integration', () => {
  let testCompany;
  let testOperateSite;
  let testUser;
  let testRole;
  let authToken;

  beforeAll(async () => {
    await app.loadApp();
  });

  beforeEach(async () => {
    // Clean up and create test data
    const Company = require('../../src/app/model/company').default;
    const OperateSite = require('../../src/app/model/operateSite').default;
    const User = require('../../src/app/model/user').default;
    const Role = require('../../src/app/model/role').default;

    // Clean up existing data
    await Company.deleteMany({ name: /Test Company/ });
    await OperateSite.deleteMany({ name: /Test Site/ });
    await User.deleteMany({ email: /test\.com/ });

    // Create test role
    const existingRole = await Role.findOne({ name: 'employee' });
    testRole = existingRole || await Role.create({
      name: 'employee',
      description: 'Test employee role',
      isActive: true,
    });

    // Create test owner user
    const ownerUser = await User.create({
      email: 'owner@test.com',
      firstName: 'Test',
      lastName: 'Owner',
      active: true,
      role: testRole._id,
    });

    // Create test company
    testCompany = await Company.create({
      name: 'Test Company Ltd',
      email: 'company@test.com',
      description: 'Test company description for integration tests',
      serviceCategory: 'Technology',
      businessAddress: {
        street: '123 Test St',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      owner: ownerUser._id,
      contact: ownerUser._id,
      isActive: true,
    });

    // Create test operate site
    testOperateSite = await OperateSite.create({
      name: 'Test Site Integration',
      address: '123 Main St, Melbourne VIC 3000',
      phoneNumber: '+61412345678',
      emailAddress: 'site@test.com',
      operatingHours: {
        monday: { open: '09:00', close: '17:00', isClosed: false },
        tuesday: { open: '09:00', close: '17:00', isClosed: false },
        wednesday: { open: '09:00', close: '17:00', isClosed: false },
        thursday: { open: '09:00', close: '17:00', isClosed: false },
        friday: { open: '09:00', close: '17:00', isClosed: false },
        saturday: { open: '10:00', close: '16:00', isClosed: false },
        sunday: { open: '10:00', close: '16:00', isClosed: true },
      },
      specialInstruction: 'Test instructions',
      company: testCompany._id,
      latitude: -37.8136,
      longitude: 144.9631,
      isActive: true,
      members: [], // Start with no members
    });

    // Create test member user
    testUser = await User.create({
      email: 'member@test.com',
      firstName: 'Test',
      lastName: 'Member',
      active: true,
      role: testRole._id,
    });

    // Add user to company as member
    await Company.findByIdAndUpdate(testCompany._id, {
      $push: {
        members: {
          user: testUser._id,
          role: testRole._id,
          joinedAt: new Date(),
        },
      },
    });

    // Add user to operate site
    await OperateSite.findByIdAndUpdate(testOperateSite._id, {
      $push: { members: testUser._id },
    });

    // Mock authentication token
    authToken = 'Bearer test-token';
  });

  it('should return company users with their operate sites', async () => {
    // Mock the middleware to bypass authentication
    const authMiddleware = require('../../src/app/middleware/authMiddleware');
    const companyAccessMiddleware = require('../../src/app/middleware/companyAccessMiddleware');

    const originalAuth = authMiddleware.authenticationTokenMiddleware;
    const originalCompanyAccess = companyAccessMiddleware.validateCompanyAccess;

    // Mock authentication middleware
    authMiddleware.authenticationTokenMiddleware = (req, res, next) => {
      req.user = { id: testCompany.owner, email: 'owner@test.com' };
      next();
    };

    // Mock company access middleware
    companyAccessMiddleware.validateCompanyAccess = (req, res, next) => {
      req.company = testCompany;
      next();
    };

    try {
      const response = await request(app.getApp())
        .get(`/api/v1/company/${testCompany._id}/users`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Find the member user
      const memberUser = response.body.find(u => u.email === 'member@test.com');
      expect(memberUser).toBeDefined();
      expect(memberUser.operateSites).toBeDefined();
      expect(Array.isArray(memberUser.operateSites)).toBe(true);
      expect(memberUser.operateSites.length).toBe(1);
      expect(memberUser.operateSites[0].name).toBe('Test Site Integration');

      // Find the owner user
      const ownerUser = response.body.find(u => u.companyRole === 'owner');
      expect(ownerUser).toBeDefined();
      expect(ownerUser.operateSites).toBeDefined();
      expect(Array.isArray(ownerUser.operateSites)).toBe(true);
      expect(ownerUser.operateSites.length).toBe(1); // Should have access to all operate sites

    } finally {
      // Restore original middleware
      authMiddleware.authenticationTokenMiddleware = originalAuth;
      companyAccessMiddleware.validateCompanyAccess = originalCompanyAccess;
    }
  });

  afterEach(async () => {
    // Clean up test data
    const Company = require('../../src/app/model/company').default;
    const OperateSite = require('../../src/app/model/operateSite').default;
    const User = require('../../src/app/model/user').default;

    await Company.deleteMany({ name: /Test Company/ });
    await OperateSite.deleteMany({ name: /Test Site/ });
    await User.deleteMany({ email: /test\.com/ });
  });
});
