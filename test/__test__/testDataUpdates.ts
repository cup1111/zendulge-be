// This file contains the corrected test data for registerCustomer.test.ts

const testDataUpdates = {
  // Update test data structure
  validCustomerData: {
    email: 'customer@example.com',
    password: 'TestPassword123',
    firstName: 'Jane',
    lastName: 'Smith',
    jobTitle: 'Designer',
  },

  // Update mock user builder to use firstName/lastName
  mockUser: {
    _id: 'mockUserId',
    email: 'customer@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    jobTitle: 'Designer',
    active: true,
  },

  // Update assertions to check firstName/lastName instead of name
  assertions: {
    // Instead of: expect(res.body.user.name).toBe(testData.name);
    // Use: expect(res.body.user.firstName).toBe(testData.firstName);
    //      expect(res.body.user.lastName).toBe(testData.lastName);
  },
};

export default testDataUpdates;
