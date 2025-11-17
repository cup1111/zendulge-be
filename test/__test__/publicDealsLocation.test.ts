import request from 'supertest';
import app from '../setup/app';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import Role from '../../src/app/model/role';
import Service from '../../src/app/model/service';
import Deal from '../../src/app/model/deal';
import Category from '../../src/app/model/category';
import OperateSite from '../../src/app/model/operateSite';
import { RoleName } from '../../src/app/enum/roles';
import { BusinessStatus } from '../../src/app/enum/businessStatus';

// Sydney CBD coordinates (test user location)
const SYDNEY_LAT = -33.909199253157;
const SYDNEY_LON = 151.2371819267105;

// Test operate site coordinates (Sydney CBD - within 5-10km)
const SITE_LAT = -33.8690;
const SITE_LON = 151.2095;

// Melbourne CBD coordinates (far away, ~700km)
const MELBOURNE_LAT = -37.8136;
const MELBOURNE_LON = 144.9631;

describe('Public deals listing with location filtering', () => {
  it('should return deals from nearby operating sites when location parameters are provided', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    // Create category
    let category = await Category.findOne({ slug: 'cleaning' });
    if (!category) {
      category = await Category.create({
        name: 'Cleaning',
        slug: 'cleaning',
        icon: '🧹',
        isActive: true,
      });
    }
    expect(category).toBeTruthy();

    // Create users
    const owner = await new UserBuilder()
      .withEmail('location-test-owner@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    // ACTIVE business with nearby site (Sydney)
    const activeBusiness = await new BusinessBuilder()
      .withName('Active Biz Sydney')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    // Create operate site in Sydney (nearby)
    const sydneySite = await new OperateSiteBuilder()
      .withBusiness(activeBusiness._id)
      .withName('Sydney CBD Site')
      .withLatitude(SITE_LAT)
      .withLongitude(SITE_LON)
      .save();

    // Ensure location field is set for geospatial queries
    const siteAny = sydneySite as any;
    siteAny.location = {
      type: 'Point',
      coordinates: [SITE_LON, SITE_LAT],
    };
    await sydneySite.save();

    const service = await Service.create({
      name: 'Active Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: activeBusiness._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create active deal linked to Sydney site
    const deal1 = await Deal.create({
      title: 'Sydney Cleaning Deal',
      description: 'Active deal in Sydney',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [sydneySite._id.toString()], // String IDs
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: activeBusiness._id.toString(),
      service: service._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Create another active deal linked to Sydney site
    const deal2 = await Deal.create({
      title: 'Sydney Office Clean',
      description: 'Another active deal in Sydney',
      category: category!._id,
      price: 150,
      originalPrice: 200,
      duration: 240,
      operatingSite: [sydneySite._id.toString()], // String IDs
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: activeBusiness._id.toString(),
      service: service._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Create active business with far site (Melbourne)
    const melbourneBusiness = await new BusinessBuilder()
      .withName('Active Biz Melbourne')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    const melbourneSite = await new OperateSiteBuilder()
      .withBusiness(melbourneBusiness._id)
      .withName('Melbourne CBD Site')
      .withLatitude(MELBOURNE_LAT)
      .withLongitude(MELBOURNE_LON)
      .save();

    // Ensure location field is set
    const melbourneSiteAny = melbourneSite as any;
    melbourneSiteAny.location = {
      type: 'Point',
      coordinates: [MELBOURNE_LON, MELBOURNE_LAT],
    };
    await melbourneSite.save();

    const melbourneService = await Service.create({
      name: 'Melbourne Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: melbourneBusiness._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    // Create active deal linked to Melbourne site (should NOT appear in results)
    await Deal.create({
      title: 'Melbourne Cleaning Deal',
      description: 'Active deal in Melbourne (too far)',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [melbourneSite._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: melbourneBusiness._id.toString(),
      service: melbourneService._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Verify sites are saved with location field
    const savedSydneySite = await OperateSite.findById(sydneySite._id).lean();
    const savedMelbourneSite = await OperateSite.findById(melbourneSite._id).lean();
    
    expect(savedSydneySite).toBeTruthy();
    expect(savedMelbourneSite).toBeTruthy();
    expect(savedSydneySite?.latitude).toBe(SITE_LAT);
    expect(savedSydneySite?.longitude).toBe(SITE_LON);
    expect(savedMelbourneSite?.latitude).toBe(MELBOURNE_LAT);
    expect(savedMelbourneSite?.longitude).toBe(MELBOURNE_LON);

    // Verify deals are created correctly
    const createdDeals = await Deal.find({ business: activeBusiness._id }).lean();
    expect(createdDeals.length).toBeGreaterThanOrEqual(2);
    expect(createdDeals.some((d: any) => d.title === 'Sydney Cleaning Deal')).toBe(true);
    expect(createdDeals.some((d: any) => d.title === 'Sydney Office Clean')).toBe(true);
    expect(createdDeals.every((d: any) => Array.isArray(d.operatingSite))).toBe(true);
    expect(createdDeals.every((d: any) => d.operatingSite.includes(sydneySite._id.toString()))).toBe(true);

    // Test with location parameters (100km radius should include Sydney but not Melbourne)
    const res = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: SYDNEY_LAT.toString(),
        longitude: SYDNEY_LON.toString(),
        radiusKm: '100',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Debug: Log the response if empty
    if (res.body.data.length === 0) {
      console.log('DEBUG: No deals returned');
      console.log('DEBUG: Query params:', {
        latitude: SYDNEY_LAT,
        longitude: SYDNEY_LON,
        radiusKm: 100,
      });
      console.log('DEBUG: Created deals:', createdDeals.map((d: any) => ({
        title: d.title,
        status: d.status,
        operatingSite: d.operatingSite,
        business: d.business,
      })));
    }

    const titles: string[] = res.body.data.map((d: any) => d.title);

    // Should include Sydney deals
    expect(titles).toEqual(
      expect.arrayContaining([
        'Sydney Cleaning Deal',
        'Sydney Office Clean',
      ]),
    );

    // Should NOT include Melbourne deal (too far)
    expect(titles).not.toEqual(expect.arrayContaining(['Melbourne Cleaning Deal']));
  });

  it('should return all deals when location parameters are not provided', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    let category = await Category.findOne({ slug: 'cleaning' });
    if (!category) {
      category = await Category.create({
        name: 'Cleaning',
        slug: 'cleaning',
        icon: '🧹',
        isActive: true,
      });
    }
    expect(category).toBeTruthy();

    const owner = await new UserBuilder()
      .withEmail('location-test-owner2@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    const business = await new BusinessBuilder()
      .withName('Active Biz No Location')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    const site = await new OperateSiteBuilder()
      .withBusiness(business._id)
      .withName('Test Site')
      .withLatitude(SITE_LAT)
      .withLongitude(SITE_LON)
      .save();

    const service = await Service.create({
      name: 'Test Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: business._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Deal.create({
      title: 'Deal Without Location Filter',
      description: 'Should appear when no location params',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [site._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: business._id.toString(),
      service: service._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Test without location parameters
    const res = await request(app.getApp())
      .get('/api/v1/public/deals')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const titles: string[] = res.body.data.map((d: any) => d.title);
    expect(titles).toEqual(expect.arrayContaining(['Deal Without Location Filter']));
  });

  it('should handle fallback distance calculation when $geoNear fails', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    let category = await Category.findOne({ slug: 'cleaning' });
    if (!category) {
      category = await Category.create({
        name: 'Cleaning',
        slug: 'cleaning',
        icon: '🧹',
        isActive: true,
      });
    }
    expect(category).toBeTruthy();

    const owner = await new UserBuilder()
      .withEmail('location-test-fallback@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    const business = await new BusinessBuilder()
      .withName('Active Biz Fallback')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    // Create site with coordinates but might not have location field/index
    const site = await new OperateSiteBuilder()
      .withBusiness(business._id)
      .withName('Fallback Test Site')
      .withLatitude(SITE_LAT)
      .withLongitude(SITE_LON)
      .save();

    // Don't set location field to force fallback
    // The fallback should use latitude/longitude directly

    const service = await Service.create({
      name: 'Fallback Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: business._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Deal.create({
      title: 'Fallback Test Deal',
      description: 'Should work with fallback calculation',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [site._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: business._id.toString(),
      service: service._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Test with location parameters - fallback should work
    const res = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: SYDNEY_LAT.toString(),
        longitude: SYDNEY_LON.toString(),
        radiusKm: '100',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const titles: string[] = res.body.data.map((d: any) => d.title);
    // Should include the deal (fallback calculation should find it within 100km)
    expect(titles).toEqual(expect.arrayContaining(['Fallback Test Deal']));
  });

  it('should only return deals with status "active"', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    let category = await Category.findOne({ slug: 'cleaning' });
    if (!category) {
      category = await Category.create({
        name: 'Cleaning',
        slug: 'cleaning',
        icon: '🧹',
        isActive: true,
      });
    }
    expect(category).toBeTruthy();

    const owner = await new UserBuilder()
      .withEmail('location-test-status@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    const business = await new BusinessBuilder()
      .withName('Active Biz Status Test')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    const site = await new OperateSiteBuilder()
      .withBusiness(business._id)
      .withName('Status Test Site')
      .withLatitude(SITE_LAT)
      .withLongitude(SITE_LON)
      .save();

    const siteAny = site as any;
    siteAny.location = {
      type: 'Point',
      coordinates: [SITE_LON, SITE_LAT],
    };
    await site.save();

    const service = await Service.create({
      name: 'Status Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: business._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Active deal (should appear)
    await Deal.create({
      title: 'Active Status Deal',
      description: 'Should appear',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [site._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: business._id.toString(),
      service: service._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Inactive deal (should NOT appear)
    await Deal.create({
      title: 'Inactive Status Deal',
      description: 'Should NOT appear',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [site._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'inactive',
      business: business._id.toString(),
      service: service._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Test with location parameters
    const res = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: SYDNEY_LAT.toString(),
        longitude: SYDNEY_LON.toString(),
        radiusKm: '100',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const titles: string[] = res.body.data.map((d: any) => d.title);

    // Should include active deal
    expect(titles).toEqual(expect.arrayContaining(['Active Status Deal']));

    // Should NOT include inactive deal
    expect(titles).not.toEqual(expect.arrayContaining(['Inactive Status Deal']));
  });

  it('should only return deals from businesses with status "active"', async () => {
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    let category = await Category.findOne({ slug: 'cleaning' });
    if (!category) {
      category = await Category.create({
        name: 'Cleaning',
        slug: 'cleaning',
        icon: '🧹',
        isActive: true,
      });
    }
    expect(category).toBeTruthy();

    const owner = await new UserBuilder()
      .withEmail('location-test-business-status@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    // Active business
    const activeBusiness = await new BusinessBuilder()
      .withName('Active Business Status')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    const activeSite = await new OperateSiteBuilder()
      .withBusiness(activeBusiness._id)
      .withName('Active Business Site')
      .withLatitude(SITE_LAT)
      .withLongitude(SITE_LON)
      .save();

    const activeSiteAny = activeSite as any;
    activeSiteAny.location = {
      type: 'Point',
      coordinates: [SITE_LON, SITE_LAT],
    };
    await activeSite.save();

    const activeService = await Service.create({
      name: 'Active Business Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: activeBusiness._id.toString(),
      status: BusinessStatus.ACTIVE,
    });

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Active deal from active business (should appear)
    await Deal.create({
      title: 'Active Business Deal',
      description: 'Should appear',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [activeSite._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: activeBusiness._id.toString(),
      service: activeService._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Pending business
    const pendingBusiness = await new BusinessBuilder()
      .withName('Pending Business Status')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.PENDING)
      .save();

    const pendingSite = await new OperateSiteBuilder()
      .withBusiness(pendingBusiness._id)
      .withName('Pending Business Site')
      .withLatitude(SITE_LAT)
      .withLongitude(SITE_LON)
      .save();

    const pendingSiteAny = pendingSite as any;
    pendingSiteAny.location = {
      type: 'Point',
      coordinates: [SITE_LON, SITE_LAT],
    };
    await pendingSite.save();

    const pendingService = await Service.create({
      name: 'Pending Business Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 100,
      business: pendingBusiness._id.toString(),
      status: 'active',
    });

    // Active deal from pending business (should NOT appear)
    await Deal.create({
      title: 'Pending Business Deal',
      description: 'Should NOT appear',
      category: category!._id,
      price: 90,
      originalPrice: 120,
      duration: 180,
      operatingSite: [pendingSite._id.toString()],
      startDate: now,
      endDate: future,
      currentBookings: 0,
      status: 'active',
      business: pendingBusiness._id.toString(),
      service: pendingService._id.toString(),
      createdBy: owner._id.toString(),
    });

    // Test with location parameters
    const res = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: SYDNEY_LAT.toString(),
        longitude: SYDNEY_LON.toString(),
        radiusKm: '100',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const titles: string[] = res.body.data.map((d: any) => d.title);

    // Should include active business deal
    expect(titles).toEqual(expect.arrayContaining(['Active Business Deal']));

    // Should NOT include pending business deal
    expect(titles).not.toEqual(expect.arrayContaining(['Pending Business Deal']));
  });
});

