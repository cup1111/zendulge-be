import app from '../setup/app';

describe('Register Company', () => {
  it('should register a company if valid data provided', async () => {
    const company = 'testcompany';
    const email = 'companytest@example.com';

    const res = await request(app.application)
      .post('/api/v1/business-register')
      .send({
        company: company,
        email: email,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.newUser.email).toBe(email);
  });
});