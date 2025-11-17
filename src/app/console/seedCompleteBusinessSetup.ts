import mongoose, { Types } from 'mongoose';
import User from '../model/user';
import Business from '../model/business';
import OperateSite from '../model/operateSite';
import Service from '../model/service';
import Deal from '../model/deal';
import Role from '../model/role';
import Category from '../model/category';
import config from '../config/app';
import { RoleName } from '../enum/roles';
import { BusinessStatus } from '../enum/businessStatus';

/* eslint-disable no-console */

async function createUserIfNotExists(userData: any, userLabel: string) {
  let user = await User.findByEmail(userData.email);
  if (!user) {
    user = new User(userData);
    await user.save();
    console.log(`✅ Created ${userLabel}`);
  } else {
    console.log(`ℹ️  ${userLabel} already exists`);
  }
  return user;
}

const createCategoriesIfNotExists = async () => {
  const categoriesData = [
    { name: 'Massage', slug: 'massage', icon: '💆' },
    { name: 'Beauty', slug: 'beauty', icon: '💅' },
    { name: 'Spa', slug: 'spa', icon: '🛁' },
    { name: 'Fitness', slug: 'fitness', icon: '🏃' },
    { name: 'Alternative', slug: 'alternative', icon: '🌿' },
    { name: 'Hair Salon', slug: 'salon', icon: '💇' },
    { name: 'Cleaning', slug: 'cleaning', icon: '🧹' },
    { name: 'Commercial', slug: 'commercial', icon: '🏢' },
    { name: 'Specialized', slug: 'specialized', icon: '⚙️' },
    { name: 'General', slug: 'general', icon: '📋' },
  ];

  const createdCategories = [];
  for (const catData of categoriesData) {
    let category = await Category.findOne({ slug: catData.slug });
    if (!category) {
      category = new Category({
        ...catData,
        isActive: true,
      });
      await category.save();
      console.log(`✅ Created category: ${catData.name}`);
    } else {
      console.log(`ℹ️  Category already exists: ${catData.name}`);
    }
    createdCategories.push(category);
  }

  return createdCategories;
};

const createSitesIfNoExists = async (business: any) => {

  // Create 2 Operate Sites
  const operateSite1Data = {
    name: 'Zendulge Melbourne CBD',
    address: '123 Collins Street, Melbourne VIC 3000',
    phoneNumber: '+61398765432',
    emailAddress: 'melbourne@zendulge.com',
    operatingHours: {
      monday: { open: '08:00', close: '18:00', isClosed: false },
      tuesday: { open: '08:00', close: '18:00', isClosed: false },
      wednesday: { open: '08:00', close: '18:00', isClosed: false },
      thursday: { open: '08:00', close: '18:00', isClosed: false },
      friday: { open: '08:00', close: '18:00', isClosed: false },
      saturday: { open: '09:00', close: '17:00', isClosed: false },
      sunday: { open: '10:00', close: '16:00', isClosed: false },
    },
    specialInstruction:
      'Main headquarters with full service availability. Meeting rooms available by appointment.',
    business: business.id,
    latitude: -37.8136,
    longitude: 144.9631,
    isActive: true,
  };

  const operateSite2Data = {
    name: 'Zendulge Sydney CBD',
    address: '456 George Street, Sydney NSW 2000',
    phoneNumber: '+61298765433',
    emailAddress: 'sydney@zendulge.com',
    operatingHours: {
      monday: { open: '09:00', close: '17:00', isClosed: false },
      tuesday: { open: '09:00', close: '17:00', isClosed: false },
      wednesday: { open: '09:00', close: '17:00', isClosed: false },
      thursday: { open: '09:00', close: '17:00', isClosed: false },
      friday: { open: '09:00', close: '17:00', isClosed: false },
      saturday: { open: '10:00', close: '16:00', isClosed: false },
      sunday: { open: '12:00', close: '15:00', isClosed: true },
    },
    specialInstruction:
      'Boutique location specializing in premium consultations. Valet parking available.',
    business: business.id,
    // Actual George Street Sydney CBD coordinates (near Town Hall / Queen Victoria Building)
    // Distance from user location (-33.9090378022738, 151.23673539028317): ~5.11km (within 5-10km requirement)
    latitude: -33.8690,
    longitude: 151.2095,
    isActive: true,
  };

  // Create operate sites
  let operateSite1 = await OperateSite.findOne({
    name: operateSite1Data.name,
    business: business.id,
  });
  if (!operateSite1) {
    operateSite1 = new OperateSite(operateSite1Data);
    // Explicitly set location field for geospatial indexing
    (operateSite1 as any).location = {
      type: 'Point',
      coordinates: [operateSite1Data.longitude, operateSite1Data.latitude],
    };
    await operateSite1.save();
    console.log('✅ Created operate site: Melbourne CBD');
  } else {
    // Update existing site to ensure location field is set
    operateSite1.set(operateSite1Data);
    (operateSite1 as any).location = {
      type: 'Point',
      coordinates: [operateSite1Data.longitude, operateSite1Data.latitude],
    };
    await operateSite1.save();
    console.log('✅ Updated operate site: Melbourne CBD');
  }

  // Try to find by name first, then by old name if it was previously South Yarra
  let operateSite2 = await OperateSite.findOne({
    name: operateSite2Data.name,
    business: business.id,
  });

  // If not found, try to find the old "South Yarra" site to update it
  if (!operateSite2) {
    operateSite2 = await OperateSite.findOne({
      name: 'Zendulge South Yarra',
      business: business.id,
    });
  }

  if (!operateSite2) {
    operateSite2 = new OperateSite(operateSite2Data);
    await operateSite2.save();
    console.log('✅ Created operate site: Sydney CBD');
  } else {
    // Update existing site - ensure location field is set for geospatial queries
    operateSite2.set(operateSite2Data);
    // Explicitly set location field for geospatial indexing (will also be set by pre-save hook)
    (operateSite2 as any).location = {
      type: 'Point',
      coordinates: [operateSite2Data.longitude, operateSite2Data.latitude],
    };
    await operateSite2.save();
    console.log('✅ Updated operate site to: Sydney CBD');
  }

  return [operateSite1, operateSite2];
};

const createServicesIfNotExists = async (business: any) => {
  const servicesData = [
    {
      name: 'Basic Cleaning Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 80.00,
      description: 'Standard cleaning service for residential properties',
      business: business.id,
      status: 'active',
    },
    {
      name: 'Deep Cleaning Service',
      category: 'Cleaning',
      duration: 180,
      basePrice: 200.00,
      description: 'Comprehensive deep cleaning including all areas',
      business: business.id,
      status: 'active',
    },
    {
      name: 'Office Cleaning',
      category: 'Commercial',
      duration: 120,
      basePrice: 150.00,
      description: 'Professional office cleaning service',
      business: business.id,
      status: 'active',
    },
    {
      name: 'Carpet Cleaning',
      category: 'Specialized',
      duration: 90,
      basePrice: 120.00,
      description: 'Professional carpet and upholstery cleaning',
      business: business.id,
      status: 'active',
    },
    {
      name: 'Window Cleaning',
      category: 'Specialized',
      duration: 45,
      basePrice: 60.00,
      description: 'Interior and exterior window cleaning service',
      business: business.id,
      status: 'active',
    },
    {
      name: 'Post-Construction Cleanup',
      category: 'Specialized',
      duration: 240,
      basePrice: 300.00,
      description: 'Heavy-duty cleaning after construction or renovation',
      business: business.id,
      status: 'inactive',
    },
  ];

  for (const serviceData of servicesData) {
    const existingService = await Service.findOne({
      name: serviceData.name,
      business: business.id,
    });

    if (!existingService) {
      const service = new Service(serviceData);
      await service.save();
      console.log(`✅ Created service: ${serviceData.name}`);
    } else {
      console.log(`ℹ️  Service already exists: ${serviceData.name}`);
    }
  }
};

const createDealsIfNotExists = async (business: any, MelbourneCBDOperateSite: any, SydneyOperateSite: any, businessOwner: any) => {
  // Get services to reference them
  const basicCleaningService = await Service.findOne({ name: 'Basic Cleaning Service', business: business.id });
  const deepCleaningService = await Service.findOne({ name: 'Deep Cleaning Service', business: business.id });
  const officeCleaningService = await Service.findOne({ name: 'Office Cleaning', business: business.id });
  const carpetCleaningService = await Service.findOne({ name: 'Carpet Cleaning', business: business.id });
  const windowCleaningService = await Service.findOne({ name: 'Window Cleaning', business: business.id });
  const postConstructionService = await Service.findOne({ name: 'Post-Construction Cleanup', business: business.id });

  // Get categories to reference them (should exist after seeding)
  const cleaningCategory = await Category.findOne({ slug: 'cleaning' });
  const commercialCategory = await Category.findOne({ slug: 'commercial' });
  const specializedCategory = await Category.findOne({ slug: 'specialized' });
  const generalCategory = await Category.findOne({ slug: 'general' });

  if (!cleaningCategory || !commercialCategory || !specializedCategory || !generalCategory) {
    throw new Error('Required categories not found. Please ensure categories are seeded first.');
  }

  const dealsData = [
    {
      title: 'Spring Cleaning Special',
      description: 'Get your home sparkling clean with our comprehensive spring cleaning service. Includes deep cleaning of all rooms, windows, and appliances.',
      category: cleaningCategory._id,
      price: 150.00,
      originalPrice: 200.00,
      duration: 180,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: deepCleaningService?.id,
      createdBy: businessOwner.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxBookings: 50,
      currentBookings: 12,
      status: 'active',
      tags: ['spring', 'cleaning', 'special'],
      business: business.id,
    },
    {
      title: 'Office Deep Clean',
      description: 'Professional office cleaning service perfect for post-construction cleanup or quarterly deep cleaning. Includes carpet cleaning and sanitization.',
      category: commercialCategory._id,
      price: 300.00,
      originalPrice: 400.00,
      duration: 240,
      operatingSite: [SydneyOperateSite.id],
      service: officeCleaningService?.id,
      createdBy: businessOwner.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      maxBookings: 20,
      currentBookings: 5,
      status: 'active',
      tags: ['office', 'commercial', 'deep-clean'],
      business: business.id,
    },
    {
      title: 'Carpet Cleaning Package',
      description: 'Professional carpet and upholstery cleaning for residential properties. Includes stain removal and deodorizing.',
      category: specializedCategory._id,
      price: 120.00,
      originalPrice: 150.00,
      duration: 90,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: carpetCleaningService?.id,
      createdBy: businessOwner.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      maxBookings: 30,
      currentBookings: 8,
      status: 'active',
      tags: ['carpet', 'upholstery', 'stain-removal'],
      business: business.id,
    },
    {
      title: 'Window Cleaning Service',
      description: 'Crystal clear windows inside and out. Professional window cleaning service for residential and commercial properties.',
      category: specializedCategory._id,
      price: 80.00,
      originalPrice: 100.00,
      duration: 60,
      operatingSite: [SydneyOperateSite.id],
      service: windowCleaningService?.id,
      createdBy: businessOwner.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      maxBookings: 40,
      currentBookings: 15,
      status: 'sold_out',
      tags: ['windows', 'residential', 'commercial'],
      business: business.id,
    },
    {
      title: 'Post-Construction Cleanup',
      description: 'Heavy-duty cleaning after construction or renovation. Includes debris removal, dust cleaning, and final touch-ups.',
      category: specializedCategory._id,
      price: 500.00,
      originalPrice: 650.00,
      duration: 360,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: postConstructionService?.id,
      createdBy: businessOwner.id,
      startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      maxBookings: 10,
      currentBookings: 10,
      status: 'expired',
      tags: ['construction', 'renovation', 'heavy-duty'],
      business: business.id,
    },
    {
      title: 'Monthly Maintenance Package',
      description: 'Regular monthly cleaning service to keep your property in top condition. Includes all basic cleaning tasks plus minor maintenance.',
      category: cleaningCategory._id,
      price: 200.00,
      originalPrice: 250.00,
      duration: 120,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: basicCleaningService?.id,
      createdBy: businessOwner.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      maxBookings: 100,
      currentBookings: 25,
      status: 'inactive',
      tags: ['monthly', 'maintenance', 'subscription'],
      business: business.id,
    },
  ];

  for (const dealData of dealsData) {
    const existingDeal = await Deal.findOne({
      title: dealData.title,
      business: business.id,
    });

    if (!existingDeal) {
      // Ensure operatingSite IDs are strings (schema expects [String])
      const normalizedDealData = {
        ...dealData,
        operatingSite: Array.isArray(dealData.operatingSite)
          ? dealData.operatingSite.map((id: any) => String(id))
          : [String(dealData.operatingSite)],
      };
      const deal = new Deal(normalizedDealData);
      await deal.save();
      console.log(`✅ Created deal: ${dealData.title}`);
    } else {
      // Update existing deal to ensure operatingSite IDs are strings
      if (existingDeal.operatingSite) {
        existingDeal.operatingSite = Array.isArray(existingDeal.operatingSite)
          ? existingDeal.operatingSite.map((id: any) => String(id))
          : [String(existingDeal.operatingSite)];
        await existingDeal.save();
      }
      console.log(`ℹ️  Deal already exists: ${dealData.title}`);
    }
  }
};

const createBusinessIfNotExists = async (businessOwner: any) => {
  // Create a Business for the Business Owner
  const businessData = {
    name: 'Zendulge Technologies Pty Ltd',
    email: 'info@zendulge.com',
    description: 'Premium business services and technology solutions',
    categories: ['Technology & Business Services'],
    businessAddress: {
      street: '123 Collins Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
    },
    contact: businessOwner.id,
    abn: '51824753556', // Valid 11-digit ABN for testing
    website: 'https://zendulge.com',
    facebookUrl: 'https://facebook.com/zendulge',
    twitterUrl: 'https://twitter.com/zendulge',
    owner: businessOwner.id,
    status: 'active',
  };

  let business = await Business.findOne({ name: businessData.name });
  if (!business) {
    business = new Business(businessData);
    await business.save();
    console.log('✅ Created business: Zendulge Technologies');
  } else {
    console.log('ℹ️  Business already exists: Zendulge Technologies');
  }
  return business;
};

const seedCompleteBusinessSetup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.dbConnection);
    console.log('Connected to MongoDB for complete business setup seeding');

    // First, ensure roles exist
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    const managerRole = await Role.findOne({ name: RoleName.MANAGER });
    const employeeRole = await Role.findOne({ name: RoleName.EMPLOYEE });

    if (!ownerRole || !employeeRole || !managerRole) {
      throw new Error('Roles not found. Please run seed-roles first.');
    }

    // Seed categories first
    await createCategoriesIfNotExists();

    // Get general category for use in pending/disabled business deals
    const generalCategory = await Category.findOne({ slug: 'general' });
    if (!generalCategory) {
      throw new Error('General category not found. Please ensure categories are seeded first.');
    }

    // Create Business Owner User
    const businessOwnerData = {
      email: 'owner@zendulge.com',
      password: 'zxc123!',
      firstName: 'Business',
      lastName: 'Owner',
      jobTitle: 'Business Owner',
      userName: 'businessowner',
      phoneNumber: '+61400000001',
      active: true,
      role: ownerRole.id,
    };

    // Create an invited user (Business Manager)
    const invitedAllMangerData = {
      email: 'manager@zendulge.com',
      password: 'zxc123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      jobTitle: 'Business Manager',
      userName: 'sjohnson',
      phoneNumber: '+61400000002',
      active: true,
    };

    const invitedCBDOnlyManager1UserData = {
      email: 'cbdManager1@zendulge.com',
      password: 'zxc123!',
      firstName: 'Kit',
      lastName: 'Kat',
      jobTitle: 'Business Manager',
      userName: 'kitkat',
      phoneNumber: '+61400000003',
      active: true,
    };


    const invitedCBDOnlyManager2UserData = {
      email: 'cbdManager2@zendulge.com',
      password: 'zxc123!',
      firstName: 'Sam',
      lastName: 'Williams',
      jobTitle: 'Business Manager',
      userName: 'samwilliams',
      phoneNumber: '+61400000004',
      active: true,
    };


    const invitedSouthYarraManagerUserData = {
      email: 'southYarraManager@zendulge.com',
      password: 'zxc123!',
      firstName: 'Paul',
      lastName: 'Lee',
      jobTitle: 'Business Manager',
      userName: 'paullee',
      phoneNumber: '+61400000005',
      active: true,
    };


    // Create an invited user (Business Manager)
    const invitedMelbourneCBDEmployee1Data = {
      email: 'employee1@zendulge.com',
      password: 'zxc123!',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'Employee',
      userName: 'jdoe',
      phoneNumber: '+61400000006',
      active: true,
    };

    const invitedNoSiteEmployeeData = {
      email: 'noAccess@zendulge.com',
      password: 'zxc123!',
      firstName: 'No',
      lastName: 'Access',
      jobTitle: 'Employee',
      userName: 'jsmith',
      phoneNumber: '+61400000007',
      active: true,
    };

    const invitedSouthYarraNotActiveEmployeeData = {
      email: 'notActive@zendulge.com',
      password: 'zxc123!',
      firstName: 'No',
      lastName: 'Active',
      jobTitle: 'Employee',
      userName: 'jsmith',
      phoneNumber: '+61400000008',
      active: false,
    };

    const customerWithBusinessUserData = {
      // eslint-disable-next-line no-secrets/no-secrets
      email: 'customerWithBusiness@zendulge.com',
      password: 'zxc123!',
      firstName: 'Customer',
      lastName: 'With Business',
      userName: 'cwithbusiness',
      phoneNumber: '+61400000009',
      active: true,
    };

    const customerNoBusinessUserData = {
      email: 'customerNoBusiness@zendulge.com',
      password: 'zxc123!',
      firstName: 'Customer',
      lastName: 'No Business',
      userName: 'cwithbusiness',
      phoneNumber: '+61400000010',
      active: true,
    };

    // Check if business owner already exists
    const businessOwner = await createUserIfNotExists(businessOwnerData, 'Business Owner user');
    const invitedAllManagerUser = await createUserIfNotExists(invitedAllMangerData, 'invited user: Sarah Johnson');
    const invitedMelbourneCBDEmployee1 = await createUserIfNotExists(invitedMelbourneCBDEmployee1Data, 'invited employee: John Doe');
    const invitedNoSiteEmployee2 = await createUserIfNotExists(invitedNoSiteEmployeeData, 'invited employee: Jane Smith');
    const invitedCBDOnlyManager1 = await createUserIfNotExists(invitedCBDOnlyManager1UserData, 'invited employee: Kit Kat');
    const invitedCBDOnlyManager2 = await createUserIfNotExists(invitedCBDOnlyManager2UserData, 'invited employee: Sam Williams');
    const invitedSouthYarraManager = await createUserIfNotExists(invitedSouthYarraManagerUserData, 'invited employee: Paul Lee');
    const invitedSouthYarraNotActiveEmployee = await createUserIfNotExists(invitedSouthYarraNotActiveEmployeeData, 'invited employee: Not Active');
    const customerWithBusiness = await createUserIfNotExists(customerWithBusinessUserData, 'customer: Customer With Business');
    await createUserIfNotExists(customerNoBusinessUserData, 'customer: Customer No Business');

    const business = await createBusinessIfNotExists(businessOwner);
    const [MelbourneCBDOperateSite, SydneyOperateSite] = await createSitesIfNoExists(business);

    // Ensure all operate sites have the location field for geospatial queries
    // This fixes existing sites that were created before the pre-save hook was added
    // Update location for all businesses (active, pending, disabled)
    const allBusinesses = await Business.find({});
    for (const biz of allBusinesses) {
      const allSites = await OperateSite.find({ business: biz.id });
      for (const site of allSites) {
        const siteAny = site as any;
        // Always update location field to ensure it's properly set
        siteAny.location = {
          type: 'Point',
          coordinates: [site.longitude, site.latitude],
        };
        await site.save();
        console.log(`✅ Updated location field for operate site: ${site.name} (Business: ${biz.name})`);
      }
    }

    await createServicesIfNotExists(business);
    await createDealsIfNotExists(business, MelbourneCBDOperateSite, SydneyOperateSite, businessOwner);

    // Ensure all existing deals have operatingSite IDs as strings for proper matching
    const allDeals = await Deal.find({ business: business.id });
    for (const deal of allDeals) {
      if (deal.operatingSite && Array.isArray(deal.operatingSite)) {
        // Check if any ID is not already a string
        const hasNonStringIds = deal.operatingSite.some((id: any) => typeof id !== 'string');

        if (hasNonStringIds) {
          // Normalize all IDs to strings
          deal.operatingSite = deal.operatingSite.map((id: any) => String(id));
          await deal.save();
          console.log(`✅ Updated operatingSite IDs for deal: ${deal.title}`);
        }
      }
    }

    await business.addMember(new Types.ObjectId(businessOwner.id), ownerRole.id);
    await business.addMember(new Types.ObjectId(invitedAllManagerUser.id), managerRole.id);
    await business.addMember(new Types.ObjectId(invitedMelbourneCBDEmployee1.id), employeeRole.id);
    await business.addMember(new Types.ObjectId(invitedNoSiteEmployee2.id), employeeRole.id);
    await business.addMember(new Types.ObjectId(invitedCBDOnlyManager2.id), managerRole.id);
    await business.addMember(new Types.ObjectId(invitedCBDOnlyManager1.id), managerRole.id);
    await business.addMember(new Types.ObjectId(invitedSouthYarraManager.id), managerRole.id);
    await business.addMember(new Types.ObjectId(invitedSouthYarraNotActiveEmployee.id), employeeRole.id);

    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedAllManagerUser.id));
    await SydneyOperateSite.addMember(new Types.ObjectId(invitedAllManagerUser.id));
    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedMelbourneCBDEmployee1.id));
    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedCBDOnlyManager1.id));
    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedCBDOnlyManager2.id));
    await SydneyOperateSite.addMember(new Types.ObjectId(invitedSouthYarraManager.id));
    await SydneyOperateSite.addMember(new Types.ObjectId(invitedSouthYarraNotActiveEmployee.id));

    // Add customerWithBusiness to business.customers array
    if (!business.customers) {
      business.customers = [];
    }
    const customerId = new Types.ObjectId(customerWithBusiness.id);
    if (!business.customers.some((id: any) => id.toString() === customerId.toString())) {
      business.customers.push(customerId);
      await business.save();
      console.log('✅ Added customerWithBusiness to business.customers');
    } else {
      console.log('ℹ️  customerWithBusiness already in business.customers');
    }

    // Create a Pending Business
    const pendingBusinessOwnerData = {
      email: 'businesspending@zendulge.com',
      password: 'zxc123!',
      firstName: 'Pending',
      lastName: 'Owner',
      jobTitle: 'Business Owner',
      userName: 'pendingowner',
      phoneNumber: '+61400000011',
      active: true,
      role: ownerRole.id,
    };
    const pendingBusinessOwner = await createUserIfNotExists(pendingBusinessOwnerData, 'Pending Business Owner user');

    const pendingBusinessData = {
      name: 'Pending Business Pty Ltd',
      email: 'pending@business.com',
      description: 'This business is pending verification',
      categories: ['Pending Category'],
      businessAddress: {
        street: '789 Pending Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      contact: pendingBusinessOwner.id,
      abn: '53000000770', // Valid 11-digit ABN (checksum validated)
      website: 'https://pendingbusiness.com',
      owner: pendingBusinessOwner.id,
      status: BusinessStatus.PENDING,
    };

    let pendingBusiness = await Business.findOne({ name: pendingBusinessData.name });
    if (!pendingBusiness) {
      pendingBusiness = new Business(pendingBusinessData);
      await pendingBusiness.save();
      console.log('✅ Created pending business: Pending Business Pty Ltd');
    } else {
      console.log('ℹ️  Pending business already exists: Pending Business Pty Ltd');
    }
    await pendingBusiness.addMember(new Types.ObjectId(pendingBusinessOwner.id), ownerRole.id);

    // Create sites for Pending Business
    const [pendingSite1/* , pendingSite2 */] = await createSitesIfNoExists(pendingBusiness);

    // Create a Service for Pending Business
    const pendingServiceName = 'Pending Business Service';
    let pendingService = await Service.findOne({ name: pendingServiceName, business: pendingBusiness.id });
    if (!pendingService) {
      pendingService = new Service({
        name: pendingServiceName,
        category: 'General',
        duration: 60,
        basePrice: 100.0,
        description: 'Service for pending business (not visible to customers until verification).',
        business: pendingBusiness.id,
        status: 'inactive',
      });
      await pendingService.save();
      console.log(`✅ Created service: ${pendingServiceName}`);
    } else {
      console.log(`ℹ️  Service already exists: ${pendingServiceName}`);
    }

    // Create a Deal for Pending Business
    const pendingDealTitle = 'pendingBusinessDeal - Intro Offer';
    let pendingDeal = await Deal.findOne({ title: pendingDealTitle, business: pendingBusiness.id });
    if (!pendingDeal) {
      pendingDeal = new Deal({
        title: pendingDealTitle,
        description: 'Deal seeded for pending business (should be hidden from customers).',
        category: generalCategory._id,
        price: 49.0,
        originalPrice: 79.0,
        duration: 60,
        operatingSite: [pendingSite1.id],
        service: pendingService.id,
        createdBy: pendingBusinessOwner.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxBookings: 10,
        currentBookings: 0,
        status: 'inactive',
        tags: ['pending', 'seed'],
        business: pendingBusiness.id,
      });
      await pendingDeal.save();
      console.log(`✅ Created deal: ${pendingDealTitle}`);
    } else {
      console.log(`ℹ️  Deal already exists: ${pendingDealTitle}`);
    }

    // Create a Disabled Business
    const disabledBusinessOwnerData = {
      email: 'businessdisabled@zendulge.com',
      password: 'zxc123!',
      firstName: 'Disabled',
      lastName: 'Owner',
      jobTitle: 'Business Owner',
      userName: 'disabledowner',
      phoneNumber: '+61400000012',
      active: true,
      role: ownerRole.id,
    };
    const disabledBusinessOwner = await createUserIfNotExists(disabledBusinessOwnerData, 'Disabled Business Owner user');

    const disabledBusinessData = {
      name: 'Disabled Business Pty Ltd',
      email: 'disabled@business.com',
      description: 'This business has been disabled',
      categories: ['Disabled Category'],
      businessAddress: {
        street: '456 Disabled Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      contact: disabledBusinessOwner.id,
      abn: '53000000851', // Valid 11-digit ABN (checksum validated)
      website: 'https://disabledbusiness.com',
      owner: disabledBusinessOwner.id,
      status: BusinessStatus.DISABLED,
    };

    let disabledBusiness = await Business.findOne({ name: disabledBusinessData.name });
    if (!disabledBusiness) {
      disabledBusiness = new Business(disabledBusinessData);
      await disabledBusiness.save();
      console.log('✅ Created disabled business: Disabled Business Pty Ltd');
    } else {
      console.log('ℹ️  Disabled business already exists: Disabled Business Pty Ltd');
    }
    await disabledBusiness.addMember(new Types.ObjectId(disabledBusinessOwner.id), ownerRole.id);

    // Create sites for Disabled Business
    const [disabledSite1/* , disabledSite2 */] = await createSitesIfNoExists(disabledBusiness);

    // Create a Service for Disabled Business
    const disabledServiceName = 'Disabled Business Service';
    let disabledService = await Service.findOne({ name: disabledServiceName, business: disabledBusiness.id });
    if (!disabledService) {
      disabledService = new Service({
        name: disabledServiceName,
        category: 'General',
        duration: 60,
        basePrice: 110.0,
        description: 'Service for disabled business (business is disabled).',
        business: disabledBusiness.id,
        status: 'inactive',
      });
      await disabledService.save();
      console.log(`✅ Created service: ${disabledServiceName}`);
    } else {
      console.log(`ℹ️  Service already exists: ${disabledServiceName}`);
    }

    // Create a Deal for Disabled Business
    const disabledDealTitle = 'disabledBusinessDeal - Intro Offer';
    let disabledDeal = await Deal.findOne({ title: disabledDealTitle, business: disabledBusiness.id });
    if (!disabledDeal) {
      disabledDeal = new Deal({
        title: disabledDealTitle,
        description: 'Deal seeded for disabled business (business is disabled).',
        category: generalCategory._id,
        price: 59.0,
        originalPrice: 89.0,
        duration: 60,
        operatingSite: [disabledSite1.id],
        service: disabledService.id,
        createdBy: disabledBusinessOwner.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxBookings: 10,
        currentBookings: 0,
        status: 'inactive',
        tags: ['disabled', 'seed'],
        business: disabledBusiness.id,
      });
      await disabledDeal.save();
      console.log(`✅ Created deal: ${disabledDealTitle}`);
    } else {
      console.log(`ℹ️  Deal already exists: ${disabledDealTitle}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding complete business setup data:', error);
    process.exit(1);
  }
};

// Self-executing function
if (require.main === module) {
  seedCompleteBusinessSetup();
}

export default seedCompleteBusinessSetup;
