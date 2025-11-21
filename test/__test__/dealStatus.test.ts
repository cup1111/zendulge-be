import request from 'supertest';
import app from '../setup/app';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import CategoryBuilder from './builders/categoryBuilder';
import ServiceBuilder from './builders/serviceBuilder';
import DealBuilder from './builders/dealBuilder';
import Role from '../../src/app/model/role';
import { RoleName } from '../../src/app/enum/roles';

let ownerUser: any;
let managerUser: any;
let business: any;
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

    business = await new BusinessBuilder()
      .withOwner(ownerUser._id)
      .withContact(ownerUser._id)
      .withMember(ownerUser._id, ownerRole._id)
      .withMember(managerUser._id, managerRole._id)
      .save();

    operateSite = await new OperateSiteBuilder()
      .withBusiness(business._id)
      .withName('Deal Status Site')
      .save();
    operateSite.members = [ownerUser._id, managerUser._id];
    await operateSite.save();

    // Create category using builder
    const category = await new CategoryBuilder()
      .withName('Massage')
      .withSlug('massage')
      .withIcon('💆')
      .withActive()
      .save();

    // Create service using builder
    service = await new ServiceBuilder()
      .withName('Test Service')
      .withCategory('Wellness')
      .withDuration(60)
      .withBasePrice(120)
      .withBusiness(business._id)
      .withActive()
      .save();

    // Create deal using builder
    deal = await new DealBuilder()
      .withTitle('Status Deal')
      .withDescription('Deal used for status change tests')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(60)
      .withOperatingSite(operateSite._id)
      .withStartDate(new Date())
      .withEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(business._id)
      .withService(service._id)
      .withCreatedBy(ownerUser._id)
      .save();

    ownerToken = await loginAndGetToken('owner-deal@example.com', 'OwnerDealPass123');
    managerToken = await loginAndGetToken('manager-deal@example.com', 'ManagerDealPass123');
  });

  it('allows the business owner to set status to inactive', async () => {
    const response = await request(app.getApp())
      .patch(`/api/v1/business/${business._id}/deals/${deal._id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'inactive' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('inactive');
  });

  it('allows a manager to set status back to active', async () => {
    deal.status = 'inactive';
    await deal.save();

    const response = await request(app.getApp())
      .patch(`/api/v1/business/${business._id}/deals/${deal._id}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'active' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('active');
  });

  it('rejects status values other than active or inactive', async () => {
    const response = await request(app.getApp())
      .patch(`/api/v1/business/${business._id}/deals/${deal._id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'expired' })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Status must be one of: active, inactive');
  });

  it('rejects creating a deal when start date is before today', async () => {
    // Create category for the test
    const cleaningCategory = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.getApp())
      .post(`/api/v1/business/${business._id}/deals`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Past Start Date Deal',
        description: 'Deal with past start date',
        category: cleaningCategory.slug,
        price: 100,
        duration: 60,
        operatingSite: [operateSite._id.toString()],
        service: service._id.toString(),
        allDay: false,
        startDate: `${yesterday.toISOString().split('T')[0]}T00:00:00.000Z`,
        endDate: `${tomorrow.toISOString().split('T')[0]}T00:00:00.000Z`,
        recurrenceType: 'none',
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Start date cannot be before today');
  });

  it('allows updating a deal when start date is set before today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isoUtc = `${yesterday.toISOString().split('T')[0]}T00:00:00.000Z`;

    const response = await request(app.getApp())
      .patch(`/api/v1/business/${business._id}/deals/${deal._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        startDate: isoUtc,
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Start date cannot be before today');
  });

  it('updates deal price successfully', async () => {
    // Price cannot exceed service base price
    // The service base price is 120, deal originalPrice is 120, so we need to use a price less than basePrice
    const newPrice = deal.originalPrice - 10; // 110, which is still less than basePrice (120)

    const response = await request(app.getApp())
      .patch(`/api/v1/business/${business._id}/deals/${deal._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        price: newPrice,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.price).toBe(newPrice);
  });
});

