import request from 'supertest';
import app from '../setup/app';

describe('Account Activation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should activate account with valid activation code', async () => {
    const activationCode = 'validactivationcode123';
    const mockActivatedUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      active: true,
    };

    // Mock userService.activateUser to return activated user
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.default.activateUser = jest.fn().mockResolvedValue(mockActivatedUser);

    const res = await request(app.application)
      .get(`/api/v1/verify/${activationCode}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account activated successfully');
    expect(res.body.user.id).toBe(mockActivatedUser._id);
    expect(res.body.user.email).toBe(mockActivatedUser.email);
    expect(res.body.user.name).toBe(mockActivatedUser.name);
    expect(res.body.user.active).toBe(true);

    // Verify that activateUser was called with correct parameter
    expect(mockUserService.default.activateUser).toHaveBeenCalledTimes(1);
    expect(mockUserService.default.activateUser).toHaveBeenCalledWith(activationCode);
  });

  it('should return 401 for invalid activation code', async () => {
    const invalidActivationCode = 'invalidcode123';

    // Import InvalidActivationTokenException for proper error mocking
    const { InvalidActivationTokenException } = require('../../src/app/exceptions');

    // Mock userService.activateUser to throw InvalidActivationTokenException for invalid code
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.default.activateUser = jest.fn().mockRejectedValue(new InvalidActivationTokenException('Invalid or expired activation token'));

    const res = await request(app.application)
      .get(`/api/v1/verify/${invalidActivationCode}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired activation token');
  });

  it('should return 401 for expired activation code', async () => {
    const expiredActivationCode = 'expiredcode123';

    // Import InvalidActivationTokenException for proper error mocking
    const { InvalidActivationTokenException } = require('../../src/app/exceptions');

    // Mock userService.activateUser to throw InvalidActivationTokenException for expired code
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.default.activateUser = jest.fn().mockRejectedValue(new InvalidActivationTokenException('Invalid or expired activation token'));

    const res = await request(app.application)
      .get(`/api/v1/verify/${expiredActivationCode}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired activation token');
  });

  it('should return 409 for already activated account', async () => {
    const activationCode = 'alreadyactivated123';

    // Import AccountAlreadyActivatedException for proper error mocking
    const { AccountAlreadyActivatedException } = require('../../src/app/exceptions');

    // Mock userService.activateUser to throw AccountAlreadyActivatedException for already active user
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.default.activateUser = jest.fn().mockRejectedValue(new AccountAlreadyActivatedException('Account is already activated'));

    const res = await request(app.application)
      .get(`/api/v1/verify/${activationCode}`);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account is already activated');
  });

  it('should handle database errors gracefully', async () => {
    const activationCode = 'dbfail123';

    // Mock userService.activateUser to throw database error
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.default.activateUser = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const res = await request(app.application)
      .get(`/api/v1/verify/${activationCode}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An internal server error occurred');
  });
});
