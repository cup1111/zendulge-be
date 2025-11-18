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

describe('Public deals listing', () => {
  it('returns only active deals from ACTIVE businesses, excluding pending/disabled and non-active deals', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    // Create users
    const owner = await new UserBuilder()
      .withEmail('publicdeals-owner@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    // ACTIVE business
    const activeBusiness = await new BusinessBuilder()
      .withName('Active Biz')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withActive()
      .save();

    const siteActive = await new OperateSiteBuilder()
      .withBusiness(activeBusiness._id)
      .withName('Active Site')
      .save();

    // Create categories using builder
    const cleaningCategory = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();

    const commercialCategory = await new CategoryBuilder()
      .withName('Commercial')
      .withSlug('commercial')
      .withIcon('🏢')
      .withActive()
      .save();

    const specializedCategory = await new CategoryBuilder()
      .withName('Specialized')
      .withSlug('specialized')
      .withIcon('🔧')
      .withActive()
      .save();

    const generalCategory = await new CategoryBuilder()
      .withName('General')
      .withSlug('general')
      .withIcon('📋')
      .withActive()
      .save();

    // Create service using builder
    const serviceActive = await new ServiceBuilder()
      .withName('Active Service')
      .withCategory('Cleaning')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(activeBusiness._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // These three should be returned
    await new DealBuilder()
      .withTitle('Spring Cleaning Special')
      .withDescription('Active deal')
      .withPrice(150)
      .withOriginalPrice(200)
      .withDuration(180)
      .withOperatingSite(siteActive._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    await new DealBuilder()
      .withTitle('Office Deep Clean')
      .withDescription('Active deal')
      .withPrice(300)
      .withOriginalPrice(400)
      .withDuration(240)
      .withOperatingSite(siteActive._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    await new DealBuilder()
      .withTitle('Carpet Cleaning Package')
      .withDescription('Active deal')
      .withPrice(120)
      .withOriginalPrice(150)
      .withDuration(90)
      .withOperatingSite(siteActive._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    // These should NOT be returned (different statuses/time)
    await new DealBuilder()
      .withTitle('Post-Construction Cleanup')
      .withDescription('Expired deal')
      .withPrice(500)
      .withOriginalPrice(650)
      .withDuration(360)
      .withOperatingSite(siteActive._id)
      .withStartDate(past)
      .withEndDate(past)
      .withCurrentBookings(0)
      .withExpired()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    await new DealBuilder()
      .withTitle('Window Cleaning Service')
      .withDescription('Sold out deal')
      .withPrice(80)
      .withOriginalPrice(100)
      .withDuration(60)
      .withOperatingSite(siteActive._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withSoldOut()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    await new DealBuilder()
      .withTitle('Monthly Maintenance Package')
      .withDescription('Inactive deal')
      .withPrice(200)
      .withOriginalPrice(250)
      .withDuration(120)
      .withOperatingSite(siteActive._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withInactive()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    // PENDING business with active deal (should be excluded)
    const pendingBusiness = await new BusinessBuilder()
      .withName('Pending Biz')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withPending()
      .save();
    const pendingSite = await new OperateSiteBuilder()
      .withBusiness(pendingBusiness._id)
      .withName('Pending Site')
      .save();

    const pendingService = await new ServiceBuilder()
      .withName('Pending Service')
      .withCategory('General')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(pendingBusiness._id)
      .withActive()
      .save();

    await new DealBuilder()
      .withTitle('pendingBusinessDeal - Intro Offer')
      .withDescription('Pending business deal')
      .withPrice(49)
      .withOriginalPrice(79)
      .withDuration(60)
      .withOperatingSite(pendingSite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(pendingBusiness._id)
      .withService(pendingService._id)
      .withCreatedBy(owner._id)
      .save();

    // DISABLED business with active deal (should be excluded)
    const disabledBusiness = await new BusinessBuilder()
      .withName('Disabled Biz')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withDisabled()
      .save();
    const disabledSite = await new OperateSiteBuilder()
      .withBusiness(disabledBusiness._id)
      .withName('Disabled Site')
      .save();

    const disabledService = await new ServiceBuilder()
      .withName('Disabled Service')
      .withCategory('General')
      .withDuration(60)
      .withBasePrice(110)
      .withBusiness(disabledBusiness._id)
      .withActive()
      .save();

    await new DealBuilder()
      .withTitle('disabledBusinessDeal - Intro Offer')
      .withDescription('Disabled business deal')
      .withPrice(59)
      .withOriginalPrice(89)
      .withDuration(60)
      .withOperatingSite(disabledSite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(disabledBusiness._id)
      .withService(disabledService._id)
      .withCreatedBy(owner._id)
      .save();

    const res = await request(app.getApp()).get('/api/v1/public/deals').expect(200);
    expect(res.body.success).toBe(true);
    const titles: string[] = res.body.data.map((d: any) => d.title);

    // Included
    expect(titles).toEqual(
      expect.arrayContaining([
        'Spring Cleaning Special',
        'Office Deep Clean',
        'Carpet Cleaning Package',
      ]),
    );
    // Excluded
    expect(titles).not.toEqual(expect.arrayContaining(['Post-Construction Cleanup']));
    expect(titles).not.toEqual(expect.arrayContaining(['Window Cleaning Service']));
    expect(titles).not.toEqual(expect.arrayContaining(['Monthly Maintenance Package']));
    expect(titles).not.toEqual(expect.arrayContaining(['pendingBusinessDeal - Intro Offer']));
    expect(titles).not.toEqual(expect.arrayContaining(['disabledBusinessDeal - Intro Offer']));
  });

  it('should return a deal by ID when it exists and is within 2-week window', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    const owner = await new UserBuilder()
      .withEmail('publicdealbyid-owner@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    const activeBusiness = await new BusinessBuilder()
      .withName('Active Biz for GetById')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withActive()
      .save();

    const siteActive = await new OperateSiteBuilder()
      .withBusiness(activeBusiness._id)
      .withName('Active Site')
      .save();

    const cleaningCategory = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();

    const serviceActive = await new ServiceBuilder()
      .withName('Active Service')
      .withCategory('Cleaning')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(activeBusiness._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const deal = await new DealBuilder()
      .withTitle('Test Deal for GetById')
      .withDescription('Active deal')
      .withPrice(150)
      .withOriginalPrice(200)
      .withDuration(180)
      .withOperatingSite(siteActive._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(serviceActive._id)
      .withCreatedBy(owner._id)
      .save();

    const res = await request(app.getApp())
      .get(`/api/v1/public/deals/${deal._id.toString()}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data._id).toBe(deal._id.toString());
    expect(res.body.data.title).toBe('Test Deal for GetById');
  });

  it('should return 400 (BadRequest) when deal is not found', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist

    const res = await request(app.getApp())
      .get(`/api/v1/public/deals/${fakeId}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Deal not found');
    expect(res.body.statusCode).toBe(400);
  });
});


