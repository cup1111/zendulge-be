import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import { InvalidActivationTokenException } from '../../src/app/exceptions';

describe('Account Activation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should activate account with valid activation code', async () => {
    const activationCode = 'validactivationcode123';
    // Create an inactive user with the activation code using the builder
    await new UserBuilder()
      .withEmail('testa@example.com')
      .withFirstName('Test')
      .withLastName('User')
      .withActive(false)
      .withActiveCode(activationCode)
      .save();

    const res = await request(app.application)
      .get(`/api/v1/verify/${activationCode}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account activated successfully');
    expect(res.body.user.email).toBe('testa@example.com');
    expect(res.body.user.firstName).toBe('Test');
    expect(res.body.user.lastName).toBe('User');
    expect(res.body.user.active).toBe(true);
  });

  it('should return 401 for invalid activation code', async () => {
    const invalidActivationCode = 'invalidcode123';

    // Mock userService.activateUser to throw InvalidActivationTokenException for invalid code
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.activateUser = jest.fn().mockRejectedValue(new InvalidActivationTokenException('Invalid or expired activation token'));

    const res = await request(app.application)
      .get(`/api/v1/verify/${invalidActivationCode}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired activation token');
  });

  it('should return 401 for expired activation code', async () => {
    const expiredActivationCode = 'expiredcode123';

    // Mock userService.activateUser to throw InvalidActivationTokenException for expired code
    const mockUserService = require('../../src/app/services/userService');
    mockUserService.activateUser = jest.fn().mockRejectedValue(new InvalidActivationTokenException('Invalid or expired activation token'));

    const res = await request(app.application)
      .get(`/api/v1/verify/${expiredActivationCode}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired activation token');
  });

  it.skip('should return 409 for already activated account', async () => {
    const activationCode = 'alreadyactivated123';

    await new UserBuilder()
      .withEmail('testa@example.com')
      .withFirstName('Test')
      .withLastName('User')
      .withActive(true)
      .save();

    const res = await request(app.application)
      .get(`/api/v1/verify/${activationCode}`);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account is already activated');
  });
});
