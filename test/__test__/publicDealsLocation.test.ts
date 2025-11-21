import request from 'supertest';
import app from '../setup/app';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import CategoryBuilder from './builders/categoryBuilder';
import ServiceBuilder from './builders/serviceBuilder';
import DealBuilder from './builders/dealBuilder';
import Role from '../../src/app/model/role';
import OperateSite from '../../src/app/model/operateSite';
import Deal from '../../src/app/model/deal';
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

    // Create category using builder
    let category = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();
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

    const service = await new ServiceBuilder()
      .withName('Active Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(activeBusiness._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create active deal linked to Sydney site
    const deal1 = await new DealBuilder()
      .withTitle('Sydney Cleaning Deal')
      .withDescription('Active deal in Sydney')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(sydneySite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(service._id)
      .withCreatedBy(owner._id)
      .save();

    // Create another active deal linked to Sydney site
    const deal2 = await new DealBuilder()
      .withTitle('Sydney Office Clean')
      .withDescription('Another active deal in Sydney')
      .withPrice(150)
      .withOriginalPrice(200)
      .withDuration(240)
      .withOperatingSite(sydneySite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(service._id)
      .withCreatedBy(owner._id)
      .save();

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

    const melbourneService = await new ServiceBuilder()
      .withName('Melbourne Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(melbourneBusiness._id)
      .withActive()
      .save();

    // Create active deal linked to Melbourne site (should NOT appear in results)
    await new DealBuilder()
      .withTitle('Melbourne Cleaning Deal')
      .withDescription('Active deal in Melbourne (too far)')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(melbourneSite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(melbourneBusiness._id)
      .withService(melbourneService._id)
      .withCreatedBy(owner._id)
      .save();

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

    // Create category using builder
    const category = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();
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

    const service = await new ServiceBuilder()
      .withName('Test Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(business._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await new DealBuilder()
      .withTitle('Deal Without Location Filter')
      .withDescription('Should appear when no location params')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(site._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(business._id)
      .withService(service._id)
      .withCreatedBy(owner._id)
      .save();

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

    // Create category using builder
    const category = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();
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

    const service = await new ServiceBuilder()
      .withName('Fallback Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(business._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await new DealBuilder()
      .withTitle('Fallback Test Deal')
      .withDescription('Should work with fallback calculation')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(site._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(business._id)
      .withService(service._id)
      .withCreatedBy(owner._id)
      .save();

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

    // Create category using builder
    const category = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();
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

    const service = await new ServiceBuilder()
      .withName('Status Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(business._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Active deal (should appear)
    await new DealBuilder()
      .withTitle('Active Status Deal')
      .withDescription('Should appear')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(site._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(business._id)
      .withService(service._id)
      .withCreatedBy(owner._id)
      .save();

    // Inactive deal (should NOT appear)
    await new DealBuilder()
      .withTitle('Inactive Status Deal')
      .withDescription('Should NOT appear')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(site._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withInactive()
      .withBusiness(business._id)
      .withService(service._id)
      .withCreatedBy(owner._id)
      .save();

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

    // Create category using builder
    const category = await new CategoryBuilder()
      .withName('Cleaning')
      .withSlug('cleaning')
      .withIcon('🧹')
      .withActive()
      .save();
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

    const activeService = await new ServiceBuilder()
      .withName('Active Business Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(activeBusiness._id)
      .withActive()
      .save();

    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Active deal from active business (should appear)
    await new DealBuilder()
      .withTitle('Active Business Deal')
      .withDescription('Should appear')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(activeSite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(activeBusiness._id)
      .withService(activeService._id)
      .withCreatedBy(owner._id)
      .save();

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

    const pendingService = await new ServiceBuilder()
      .withName('Pending Business Service')
      .withDuration(60)
      .withBasePrice(100)
      .withBusiness(pendingBusiness._id)
      .withActive()
      .save();

    // Active deal from pending business (should NOT appear)
    await new DealBuilder()
      .withTitle('Pending Business Deal')
      .withDescription('Should NOT appear')
      .withPrice(90)
      .withOriginalPrice(120)
      .withDuration(180)
      .withOperatingSite(pendingSite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(0)
      .withActive()
      .withBusiness(pendingBusiness._id)
      .withService(pendingService._id)
      .withCreatedBy(owner._id)
      .save();

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

  it('should return correct results based on radius distance (1km, 2km, 5km = 0 results, 10km-100km = 1 result)', async () => {
    // User location from actual API usage
    const USER_LAT = -33.9090378022738;
    const USER_LON = 151.23673539028317;

    // Sydney site coordinates from seed data (matches seedCompleteBusinessSetup.ts)
    const SYDNEY_SITE_LAT = -33.8690;
    const SYDNEY_SITE_LON = 151.2095;

    // Setup: Create the seed data structure for this test
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    // Create categories
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

    // Create business owner
    const owner = await new UserBuilder()
      .withEmail('seed-test-owner@example.com')
      .withPassword('OwnerPass123!')
      .withActive(true)
      .save();

    // Create active business
    const business = await new BusinessBuilder()
      .withName('Zendulge')
      .withOwner(owner._id)
      .withMember(owner._id, ownerRole!._id)
      .withStatus(BusinessStatus.ACTIVE)
      .save();

    // Create Sydney operate site (matches seed data coordinates)
    const sydneySite = await new OperateSiteBuilder()
      .withBusiness(business._id)
      .withName('Zendulge Sydney CBD')
      .withLatitude(SYDNEY_SITE_LAT)
      .withLongitude(SYDNEY_SITE_LON)
      .save();

    // Ensure location field is set for geospatial queries
    const siteAny = sydneySite as any;
    siteAny.location = {
      type: 'Point',
      coordinates: [SYDNEY_SITE_LON, SYDNEY_SITE_LAT],
    };
    await sydneySite.save();

    const officeService = await new ServiceBuilder()
      .withName('Office Cleaning')
      .withCategory('Cleaning')
      .withDuration(120)
      .withBasePrice(150)
      .withBusiness(business._id)
      .withActive()
      .save();

    // Create Office Deep Clean deal (matches seed data)
    const now = new Date();
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

    await new DealBuilder()
      .withTitle('Office Deep Clean')
      .withDescription('Professional office cleaning service perfect for post-construction cleanup or quarterly deep cleaning. Includes carpet cleaning and sanitization.')
      .withPrice(300)
      .withOriginalPrice(400)
      .withDuration(240)
      .withOperatingSite(sydneySite._id)
      .withStartDate(now)
      .withEndDate(future)
      .withCurrentBookings(5)
      .withActive()
      .withBusiness(business._id)
      .withService(officeService._id)
      .withCreatedBy(owner._id)
      .save();

    // Test 1km - should return 0 results
    const res1km = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '1',
      })
      .expect(200);

    expect(res1km.body.success).toBe(true);
    expect(Array.isArray(res1km.body.data)).toBe(true);
    expect(res1km.body.data.length).toBe(0);

    // Test 2km - should return 0 results
    const res2km = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '2',
      })
      .expect(200);

    expect(res2km.body.success).toBe(true);
    expect(Array.isArray(res2km.body.data)).toBe(true);
    expect(res2km.body.data.length).toBe(0);

    // Test 5km - should return 0 results
    const res5km = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '5',
      })
      .expect(200);

    expect(res5km.body.success).toBe(true);
    expect(Array.isArray(res5km.body.data)).toBe(true);
    expect(res5km.body.data.length).toBe(0);

    // Test 10km - should return 1 result (Office Deep Clean)
    const res10km = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '10',
      })
      .expect(200);

    expect(res10km.body.success).toBe(true);
    expect(Array.isArray(res10km.body.data)).toBe(true);
    expect(res10km.body.data.length).toBe(1);
    expect(res10km.body.data[0].title).toBe('Office Deep Clean');

    // Test 50km - should return 1 result (Office Deep Clean)
    const res50km = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '50',
      })
      .expect(200);

    expect(res50km.body.success).toBe(true);
    expect(Array.isArray(res50km.body.data)).toBe(true);
    expect(res50km.body.data.length).toBe(1);
    expect(res50km.body.data[0].title).toBe('Office Deep Clean');

    // Test 100km - should return 1 result (Office Deep Clean)
    const res100km = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '100',
      })
      .expect(200);

    expect(res100km.body.success).toBe(true);
    expect(Array.isArray(res100km.body.data)).toBe(true);
    expect(res100km.body.data.length).toBe(1);
    expect(res100km.body.data[0].title).toBe('Office Deep Clean');

    // Test category filtering with location - should return Office Deep Clean when filtering by cleaning
    const resCategoryFilter = await request(app.getApp())
      .get('/api/v1/public/deals')
      .query({
        category: 'cleaning', // Filter by category slug
        latitude: USER_LAT.toString(),
        longitude: USER_LON.toString(),
        radiusKm: '50',
      })
      .expect(200);

    expect(resCategoryFilter.body.success).toBe(true);
    expect(Array.isArray(resCategoryFilter.body.data)).toBe(true);
    expect(resCategoryFilter.body.data.length).toBe(1);
    expect(resCategoryFilter.body.data[0].title).toBe('Office Deep Clean');
    expect(resCategoryFilter.body.data[0].service.name).toBe('Office Cleaning');

    // Verify category data is populated
    expect(resCategoryFilter.body.data[0].categoryData).toBeDefined();
    expect(resCategoryFilter.body.data[0].categoryData.name).toBe('Cleaning');
    expect(resCategoryFilter.body.data[0].categoryData.slug).toBe('cleaning');
  });
});

