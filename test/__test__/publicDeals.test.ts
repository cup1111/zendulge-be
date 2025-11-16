import request from 'supertest';
import app from '../setup/app';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import Role from '../../src/app/model/role';
import Service from '../../src/app/model/service';
import Deal from '../../src/app/model/deal';
import { RoleName } from '../../src/app/enum/roles';
import { BusinessStatus } from '../../src/app/enum/businessStatus';

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

    const serviceActive = await Service.create({
      name: 'Active Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: activeBusiness._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // These three should be returned
    await Deal.create({
      title: 'Spring Cleaning Special',
      description: 'Active deal',
      category: 'Cleaning',
      price: 150,
      originalPrice: 200,
      duration: 180,
      operatingSite: [siteActive._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: activeBusiness._id.toString(),
      service: serviceActive._id.toString(),
      createdBy: owner._id.toString(),
    });
    await Deal.create({
      title: 'Office Deep Clean',
      description: 'Active deal',
      category: 'Commercial',
      price: 300,
      originalPrice: 400,
      duration: 240,
      operatingSite: [siteActive._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: activeBusiness._id.toString(),
      service: serviceActive._id.toString(),
      createdBy: owner._id.toString(),
    });
    await Deal.create({
      title: 'Carpet Cleaning Package',
      description: 'Active deal',
      category: 'Specialized',
      price: 120,
      originalPrice: 150,
      duration: 90,
      operatingSite: [siteActive._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: activeBusiness._id.toString(),
      service: serviceActive._id.toString(),
      createdBy: owner._id.toString(),
    });

    // These should NOT be returned (different statuses/time)
    await Deal.create({
      title: 'Post-Construction Cleanup',
      description: 'Expired deal',
      category: 'Specialized',
      price: 500,
      originalPrice: 650,
      duration: 360,
      operatingSite: [siteActive._id.toString()],
      startDate: past,
      endDate: past,
      currentBookings: 0,
      status: 'expired',
      business: activeBusiness._id.toString(),
      service: serviceActive._id.toString(),
      createdBy: owner._id.toString(),
    });
    await Deal.create({
      title: 'Window Cleaning Service',
      description: 'Sold out deal',
      category: 'Specialized',
      price: 80,
      originalPrice: 100,
      duration: 60,
      operatingSite: [siteActive._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'sold_out',
      business: activeBusiness._id.toString(),
      service: serviceActive._id.toString(),
      createdBy: owner._id.toString(),
    });
    await Deal.create({
      title: 'Monthly Maintenance Package',
      description: 'Inactive deal',
      category: 'Cleaning',
      price: 200,
      originalPrice: 250,
      duration: 120,
      operatingSite: [siteActive._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'inactive',
      business: activeBusiness._id.toString(),
      service: serviceActive._id.toString(),
      createdBy: owner._id.toString(),
    });

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
    const pendingService = await Service.create({
      name: 'Pending Service',
      category: 'General',
      duration: 60,
      basePrice: 100,
      business: pendingBusiness._id.toString(),
      status: BusinessStatus.PENDING,
    });
    await Deal.create({
      title: 'pendingBusinessDeal - Intro Offer',
      description: 'Pending business deal',
      category: 'General',
      price: 49,
      originalPrice: 79,
      duration: 60,
      operatingSite: [pendingSite._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: pendingBusiness._id.toString(),
      service: pendingService._id.toString(),
      createdBy: owner._id.toString(),
    });

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
    const disabledService = await Service.create({
      name: 'Disabled Service',
      category: 'General',
      duration: 60,
      basePrice: 110,
      business: disabledBusiness._id.toString(),
      status: BusinessStatus.DISABLED,
    });
    await Deal.create({
      title: 'disabledBusinessDeal - Intro Offer',
      description: 'Disabled business deal',
      category: 'General',
      price: 59,
      originalPrice: 89,
      duration: 60,
      operatingSite: [disabledSite._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: disabledBusiness._id.toString(),
      service: disabledService._id.toString(),
      createdBy: owner._id.toString(),
    });

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
});


