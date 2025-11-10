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
});

