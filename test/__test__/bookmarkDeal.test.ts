import request from 'supertest';
import app from '../setup/app';
import UserBuilder from './builders/userBuilder';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import ServiceBuilder from './builders/serviceBuilder';
import DealBuilder from './builders/dealBuilder';
import Deal from '../../src/app/model/deal';

const loginAndGetToken = async (email: string, password: string) => {
  const res = await request(app.getApp())
    .post('/api/v1/login')
    .send({ email, password });
  return res.body.data.accessToken;
};

describe('Bookmark deal endpoints', () => {
  let user: any;
  let token: string;
  let business: any;
  let operateSite: any;
  let service: any;

  beforeEach(async () => {
    user = await new UserBuilder()
      .withEmail('bookmark-user@example.com')
      .withPassword('BookmarkPass123!')
      .withActive(true)
      .save();

    business = await new BusinessBuilder()
      .withOwner(user._id)
      .withContact(user._id)
      .withActive()
      .save();

    operateSite = await new OperateSiteBuilder()
      .withBusiness(business._id)
      .withName('Bookmark Site')
      .save();

    service = await new ServiceBuilder()
      .withBusiness(business._id)
      .withName('Bookmark Service')
      .withCategory('Wellness')
      .withDuration(60)
      .withBasePrice(120)
      .withActive()
      .save();

    token = await loginAndGetToken('bookmark-user@example.com', 'BookmarkPass123!');
  });

  it('adds a bookmark for an active deal', async () => {
    const activeDeal = await new DealBuilder()
      .withBusiness(business._id)
      .withService(service._id)
      .withOperatingSite(operateSite._id)
      .withCreatedBy(user._id)
      .withActive()
      .save();

    const res = await request(app.getApp())
      .post('/api/v1/bookmark-deal')
      .set('Authorization', `Bearer ${token}`)
      .send({ dealId: activeDeal._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.deal.toString()).toBe(activeDeal._id.toString());
  });

  it('lists only bookmarks whose deals are still active', async () => {
    const activeDeal = await new DealBuilder()
      .withBusiness(business._id)
      .withService(service._id)
      .withOperatingSite(operateSite._id)
      .withCreatedBy(user._id)
      .withActive()
      .save();

    const inactiveDeal = await new DealBuilder()
      .withBusiness(business._id)
      .withService(service._id)
      .withOperatingSite(operateSite._id)
      .withCreatedBy(user._id)
      .withActive()
      .save();

    await request(app.getApp())
      .post('/api/v1/bookmark-deal')
      .set('Authorization', `Bearer ${token}`)
      .send({ dealId: activeDeal._id.toString() })
      .expect(201);

    await request(app.getApp())
      .post('/api/v1/bookmark-deal')
      .set('Authorization', `Bearer ${token}`)
      .send({ dealId: inactiveDeal._id.toString() })
      .expect(201);

    await Deal.findByIdAndUpdate(inactiveDeal._id, { status: 'inactive' });

    const res = await request(app.getApp())
      .get('/api/v1/bookmark-deal')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].deal.toString()).toBe(activeDeal._id.toString());
    expect(res.body.pagination.total).toBe(1);
  });

  it('removes a bookmark', async () => {
    const activeDeal = await new DealBuilder()
      .withBusiness(business._id)
      .withService(service._id)
      .withOperatingSite(operateSite._id)
      .withCreatedBy(user._id)
      .withActive()
      .save();

    await request(app.getApp())
      .post('/api/v1/bookmark-deal')
      .set('Authorization', `Bearer ${token}`)
      .send({ dealId: activeDeal._id.toString() })
      .expect(201);

    const res = await request(app.getApp())
      .delete(`/api/v1/bookmark-deal/${activeDeal._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Bookmark deal removed');
  });
});
