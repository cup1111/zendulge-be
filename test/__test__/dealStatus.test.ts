import request from 'supertest';
import app from '../setup/app';
import CompanyBuilder from './builders/companyBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import Role from '../../src/app/model/role';
import Deal from '../../src/app/model/deal';
import Service from '../../src/app/model/service';
import { RoleName } from '../../src/app/enum/roles';

let ownerUser: any;
let managerUser: any;
let company: any;
let operateSite: any;
let service: any;
let deal: any;
let ownerToken: string;
let managerToken: string;
let ownerRole: any;
let managerRole: any;

async function loginAndGetToken(email: string, password: string) {
  const res = await request(app.getApp())
    .post('/api/v1/login')
    .send({ email, password });
  return res.body.data.accessToken;
}

describe('Deal status management', () => {
  beforeEach(async () => {
    ownerRole = await Role.findOne({ name: RoleName.OWNER });
    managerRole = await Role.findOne({ name: RoleName.MANAGER });

    ownerUser = await new UserBuilder()
      .withEmail('owner-deal@example.com')
      .withPassword('OwnerDealPass123')
      .withActive(true)
      .save();

    managerUser = await new UserBuilder()
      .withEmail('manager-deal@example.com')
      .withPassword('ManagerDealPass123')
      .withActive(true)
      .save();

    company = await new CompanyBuilder()
      .withOwner(ownerUser._id)
      .withContact(ownerUser._id)
      .withMember(ownerUser._id, ownerRole._id)
      .withMember(managerUser._id, managerRole._id)
      .save();

    operateSite = await new OperateSiteBuilder()
      .withCompany(company._id)
      .withName('Deal Status Site')
      .save();
    operateSite.members = [ownerUser._id, managerUser._id];
    await operateSite.save();

    service = await Service.create({
      name: 'Test Service',
      category: 'Wellness',
      duration: 60,
      basePrice: 120,
      company: company._id.toString(),
      status: 'active',
    });

    deal = await Deal.create({
      title: 'Status Deal',
      description: 'Deal used for status change tests',
      category: 'Massage',
      price: 90,
      originalPrice: 120,
      discount: 25,
      duration: 60,
      operatingSite: [operateSite._id.toString()],
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentBookings: 0,
      },
      status: 'active',
      company: company._id.toString(),
      service: service._id.toString(),
      createdBy: ownerUser._id.toString(),
    });

    ownerToken = await loginAndGetToken('owner-deal@example.com', 'OwnerDealPass123');
    managerToken = await loginAndGetToken('manager-deal@example.com', 'ManagerDealPass123');
  });

  it('allows the company owner to set status to inactive', async () => {
    const response = await request(app.getApp())
      .patch(`/api/v1/company/${company._id}/deals/${deal._id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'inactive' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('inactive');
  });

  it('allows a manager to set status back to active', async () => {
    await Deal.updateOne({ _id: deal._id }, { status: 'inactive' });

    const response = await request(app.getApp())
      .patch(`/api/v1/company/${company._id}/deals/${deal._id}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'active' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('active');
  });

  it('rejects status values other than active or inactive', async () => {
    const response = await request(app.getApp())
      .patch(`/api/v1/company/${company._id}/deals/${deal._id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'expired' })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Status must be one of: active, inactive');
  });

  it('rejects creating a deal when end date is before start date', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date(startDate);

    const response = await request(app.getApp())
      .post(`/api/v1/company/${company._id}/deals`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Invalid Date Deal',
        description: 'Deal with invalid end date',
        category: 'Cleaning',
        price: 100,
        duration: 60,
        operatingSite: [operateSite._id.toString()],
        service: service._id.toString(),
        availability: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('End date must be after start date');
  });

  it('rejects creating a deal when start date is before today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.getApp())
      .post(`/api/v1/company/${company._id}/deals`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Past Start Date Deal',
        description: 'Deal with past start date',
        category: 'Cleaning',
        price: 100,
        duration: 60,
        operatingSite: [operateSite._id.toString()],
        service: service._id.toString(),
        availability: {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
        },
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Start date cannot be before today');
  });

  it('allows updating a deal when start date is set before today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const response = await request(app.getApp())
      .patch(`/api/v1/company/${company._id}/deals/${deal._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        availability: {
          startDate: yesterday.toISOString().split('T')[0],
        },
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.availability.startDate).toContain(
      yesterday.toISOString().split('T')[0],
    );
  });

  it('normalizes discount to zero when price exceeds original price', async () => {
    const response = await request(app.getApp())
      .patch(`/api/v1/company/${company._id}/deals/${deal._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        price: deal.originalPrice + 50,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.price).toBe(deal.originalPrice + 50);
    expect(response.body.data.discount).toBe(0);
  });

  it('rejects updating a deal when end date is before or equal to start date', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const response = await request(app.getApp())
      .patch(`/api/v1/company/${company._id}/deals/${deal._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        availability: {
          endDate: today.toISOString().split('T')[0],
        },
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('End date must be after start date');
  });
});

