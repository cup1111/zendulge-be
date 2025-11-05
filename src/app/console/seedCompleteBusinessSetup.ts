import mongoose, { Types } from 'mongoose';
import User from '../model/user';
import Company from '../model/company';
import OperateSite from '../model/operateSite';
import Service from '../model/service';
import Deal from '../model/deal';
import Role from '../model/role';
import config from '../config/app';
import { RoleName } from '../enum/roles';

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

const createSitesIfNoExists = async (company: any) => {

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
    company: company.id,
    latitude: -37.8136,
    longitude: 144.9631,
    isActive: true,
  };

  const operateSite2Data = {
    name: 'Zendulge South Yarra',
    address: '456 Toorak Road, South Yarra VIC 3141',
    phoneNumber: '+61398765433',
    emailAddress: 'southyarra@zendulge.com',
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
    company: company.id,
    latitude: -37.8394,
    longitude: 144.9944,
    isActive: true,
  };

  // Create operate sites
  let operateSite1 = await OperateSite.findOne({
    name: operateSite1Data.name,
  });
  if (!operateSite1) {
    operateSite1 = new OperateSite(operateSite1Data);
    await operateSite1.save();
    console.log('✅ Created operate site: Melbourne CBD');
  } else {
    console.log('ℹ️  Operate site already exists: Melbourne CBD');
  }

  let operateSite2 = await OperateSite.findOne({
    name: operateSite2Data.name,
  });
  if (!operateSite2) {
    operateSite2 = new OperateSite(operateSite2Data);
    await operateSite2.save();
    console.log('✅ Created operate site: South Yarra');
  } else {
    console.log('ℹ️  Operate site already exists: South Yarra');
  }

  return [operateSite1, operateSite2];
};

const createServicesIfNotExists = async (company: any) => {
  const servicesData = [
    {
      name: 'Basic Cleaning Service',
      category: 'Cleaning',
      duration: 60,
      basePrice: 80.00,
      description: 'Standard cleaning service for residential properties',
      company: company.id,
    },
    {
      name: 'Deep Cleaning Service',
      category: 'Cleaning',
      duration: 180,
      basePrice: 200.00,
      description: 'Comprehensive deep cleaning including all areas',
      company: company.id,
    },
    {
      name: 'Office Cleaning',
      category: 'Commercial',
      duration: 120,
      basePrice: 150.00,
      description: 'Professional office cleaning service',
      company: company.id,
    },
    {
      name: 'Carpet Cleaning',
      category: 'Specialized',
      duration: 90,
      basePrice: 120.00,
      description: 'Professional carpet and upholstery cleaning',
      company: company.id,
      status: 'sold_out',
    },
    {
      name: 'Window Cleaning',
      category: 'Specialized',
      duration: 45,
      basePrice: 60.00,
      description: 'Interior and exterior window cleaning service',
      company: company.id,
      status: 'expired',
    },
    {
      name: 'Post-Construction Cleanup',
      category: 'Specialized',
      duration: 240,
      basePrice: 300.00,
      description: 'Heavy-duty cleaning after construction or renovation',
      company: company.id,
      status: 'inactive'
    },
  ];

  for (const serviceData of servicesData) {
    const existingService = await Service.findOne({
      name: serviceData.name,
      company: company.id,
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

const createDealsIfNotExists = async (company: any, MelbourneCBDOperateSite: any, SouthYarraoperateSite2: any, companyOwner: any) => {
  // Get services to reference them
  const basicCleaningService = await Service.findOne({ name: 'Basic Cleaning Service', company: company.id });
  const deepCleaningService = await Service.findOne({ name: 'Deep Cleaning Service', company: company.id });
  const officeCleaningService = await Service.findOne({ name: 'Office Cleaning', company: company.id });
  const carpetCleaningService = await Service.findOne({ name: 'Carpet Cleaning', company: company.id });
  const windowCleaningService = await Service.findOne({ name: 'Window Cleaning', company: company.id });
  const postConstructionService = await Service.findOne({ name: 'Post-Construction Cleanup', company: company.id });

  const dealsData = [
    {
      title: 'Spring Cleaning Special',
      description: 'Get your home sparkling clean with our comprehensive spring cleaning service. Includes deep cleaning of all rooms, windows, and appliances.',
      category: 'Cleaning',
      price: 150.00,
      originalPrice: 200.00,
      duration: 180,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: deepCleaningService?.id,
      createdBy: companyOwner.id,
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxBookings: 50,
        currentBookings: 12,
      },
      status: 'active',
      tags: ['spring', 'cleaning', 'special'],
      company: company.id,
    },
    {
      title: 'Office Deep Clean',
      description: 'Professional office cleaning service perfect for post-construction cleanup or quarterly deep cleaning. Includes carpet cleaning and sanitization.',
      category: 'Commercial',
      price: 300.00,
      originalPrice: 400.00,
      duration: 240,
      operatingSite: [SouthYarraoperateSite2.id],
      service: officeCleaningService?.id,
      createdBy: companyOwner.id,
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        maxBookings: 20,
        currentBookings: 5,
      },
      status: 'active',
      tags: ['office', 'commercial', 'deep-clean'],
      company: company.id,
    },
    {
      title: 'Carpet Cleaning Package',
      description: 'Professional carpet and upholstery cleaning for residential properties. Includes stain removal and deodorizing.',
      category: 'Specialized',
      price: 120.00,
      originalPrice: 150.00,
      duration: 90,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: carpetCleaningService?.id,
      createdBy: companyOwner.id,
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        maxBookings: 30,
        currentBookings: 8,
      },
      status: 'active',
      tags: ['carpet', 'upholstery', 'stain-removal'],
      company: company.id,
    },
    {
      title: 'Window Cleaning Service',
      description: 'Crystal clear windows inside and out. Professional window cleaning service for residential and commercial properties.',
      category: 'Specialized',
      price: 80.00,
      originalPrice: 100.00,
      duration: 60,
      operatingSite: [SouthYarraoperateSite2.id],
      service: windowCleaningService?.id,
      createdBy: companyOwner.id,
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        maxBookings: 40,
        currentBookings: 15,
      },
      status: 'active',
      tags: ['windows', 'residential', 'commercial'],
      company: company.id,
    },
    {
      title: 'Post-Construction Cleanup',
      description: 'Heavy-duty cleaning after construction or renovation. Includes debris removal, dust cleaning, and final touch-ups.',
      category: 'Specialized',
      price: 500.00,
      originalPrice: 650.00,
      duration: 360,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: postConstructionService?.id,
      createdBy: companyOwner.id,
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        maxBookings: 10,
        currentBookings: 2,
      },
      status: 'active',
      tags: ['construction', 'renovation', 'heavy-duty'],
      company: company.id,
    },
    {
      title: 'Monthly Maintenance Package',
      description: 'Regular monthly cleaning service to keep your property in top condition. Includes all basic cleaning tasks plus minor maintenance.',
      category: 'Cleaning',
      price: 200.00,
      originalPrice: 250.00,
      duration: 120,
      operatingSite: [MelbourneCBDOperateSite.id],
      service: basicCleaningService?.id,
      createdBy: companyOwner.id,
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        maxBookings: 100,
        currentBookings: 25,
      },
      status: 'active',
      tags: ['monthly', 'maintenance', 'subscription'],
      company: company.id,
    },
  ];

  for (const dealData of dealsData) {
    const existingDeal = await Deal.findOne({
      title: dealData.title,
      company: company.id,
    });

    if (!existingDeal) {
      const deal = new Deal(dealData);
      await deal.save();
      console.log(`✅ Created deal: ${dealData.title}`);
    } else {
      console.log(`ℹ️  Deal already exists: ${dealData.title}`);
    }
  }
};

const createCompanyIfNotExists = async (companyOwner: any) => {
  // Create a Company for the Company Owner
  const companyData = {
    name: 'Zendulge Technologies Pty Ltd',
    email: 'info@zendulge.com',
    description: 'Premium business services and technology solutions',
    serviceCategory: 'Technology & Business Services',
    businessAddress: {
      street: '123 Collins Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
    },
    contact: companyOwner.id,
    abn: '51824753556', // Valid ABN format for testing
    website: 'https://zendulge.com',
    facebookUrl: 'https://facebook.com/zendulge',
    twitterUrl: 'https://twitter.com/zendulge',
    owner: companyOwner.id,
    isActive: true,
  };

  let company = await Company.findOne({ name: companyData.name });
  if (!company) {
    company = new Company(companyData);
    await company.save();
    console.log('✅ Created company: Zendulge Technologies');
  } else {
    console.log('ℹ️  Company already exists: Zendulge Technologies');
  }
  return company;
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

    // Create Company Owner User
    const companyOwnerData = {
      email: 'owner@zendulge.com',
      password: 'zxc123!',
      firstName: 'Company',
      lastName: 'Owner',
      phoneNumber: '+61412345678',
      jobTitle: 'Business Owner',
      userName: 'companyowner',
      active: true,
      role: ownerRole.id,
    };

    // Create an invited user (Business Manager)
    const invitedAllMangerData = {
      email: 'manager@zendulge.com',
      password: 'zxc123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phoneNumber: '+61412345679',
      jobTitle: 'Business Manager',
      userName: 'sjohnson',
      active: true,
    };

    const invitedCBDOnlyManager1UserData = {
      email: 'cbdManager1@zendulge.com',
      password: 'zxc123!',
      firstName: 'Kit',
      lastName: 'Kat',
      phoneNumber: '+61412345679',
      jobTitle: 'Business Manager',
      userName: 'kitkat',
      active: true,
    };


    const invitedCBDOnlyManager2UserData = {
      email: 'cbdManager2@zendulge.com',
      password: 'zxc123!',
      firstName: 'Sam',
      lastName: 'Williams',
      phoneNumber: '+61412345679',
      jobTitle: 'Business Manager',
      userName: 'samwilliams',
      active: true,
    };


    const invitedSouthYarraManagerUserData = {
      email: 'southYarraManager@zendulge.com',
      password: 'zxc123!',
      firstName: 'Paul',
      lastName: 'Lee',
      phoneNumber: '+61412345679',
      jobTitle: 'Business Manager',
      userName: 'paullee',
      active: true,
    };


    // Create an invited user (Business Manager)
    const invitedEmployee1Data = {
      email: 'employee1@zendulge.com',
      password: 'zxc123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+61412345680',
      jobTitle: 'Employee',
      userName: 'jdoe',
      active: true,
    };

    const invitedEmployee2Data = {
      email: 'noAccess@zendulge.com',
      password: 'zxc123!',
      firstName: 'No',
      lastName: 'Access',
      phoneNumber: '+61412345681',
      jobTitle: 'Employee',
      userName: 'jsmith',
      active: true,
    };

    const invitedNotActiveEmployeeData = {
      email: 'notActive@zendulge.com',
      password: 'zxc123!',
      firstName: 'No',
      lastName: 'Active',
      phoneNumber: '+61412345681',
      jobTitle: 'Employee',
      userName: 'jsmith',
      active: false,
    };

    const customerWithCompanyUserData = {
      email: 'customerWithCompany@zendulge.com',
      password: 'zxc123!',
      firstName: 'Customer',
      lastName: 'With Company',
      phoneNumber: '+61412345682',
      userName: 'cwithcompany',
      active: true,
    };

    const customerNoCompanyUserData = {
      email: 'customerNoCompany@zendulge.com',
      password: 'zxc123!',
      firstName: 'Customer',
      lastName: 'No Company',
      phoneNumber: '+61412345682',
      userName: 'cwithcompany',
      active: true,
    };

    // Check if company owner already exists
    const companyOwner = await createUserIfNotExists(companyOwnerData, 'Company Owner user');
    const invitedAllManagerUser = await createUserIfNotExists(invitedAllMangerData, 'invited user: Sarah Johnson');
    const invitedEmployee1 = await createUserIfNotExists(invitedEmployee1Data, 'invited employee: John Doe');
    const invitedNoSiteEmployee2 = await createUserIfNotExists(invitedEmployee2Data, 'invited employee: Jane Smith');
    const invitedCBDOnlyManager1 = await createUserIfNotExists(invitedCBDOnlyManager1UserData, 'invited employee: Kit Kat');
    const invitedCBDOnlyManager2 = await createUserIfNotExists(invitedCBDOnlyManager2UserData, 'invited employee: Sam Williams');
    const invitedSouthYarraManager = await createUserIfNotExists(invitedSouthYarraManagerUserData, 'invited employee: Paul Lee');
    const invitedEmployeeNotActive = await createUserIfNotExists(invitedNotActiveEmployeeData, 'invited employee: Not Active');
    const customerWithCompany = await createUserIfNotExists(customerWithCompanyUserData, 'customer: Customer With Company');
    const createUserNoCompany = createUserIfNotExists(customerNoCompanyUserData, 'customer: Customer No Company');

    const company = await createCompanyIfNotExists(companyOwner);
    const [MelbourneCBDOperateSite, SouthYarraoperateSite2] = await createSitesIfNoExists(company);
    await createServicesIfNotExists(company);
    await createDealsIfNotExists(company, MelbourneCBDOperateSite, SouthYarraoperateSite2, companyOwner);

    await company.addMember(new Types.ObjectId(companyOwner.id), ownerRole.id);
    await company.addMember(new Types.ObjectId(invitedAllManagerUser.id), managerRole.id);
    await company.addMember(new Types.ObjectId(invitedEmployee1.id), employeeRole.id);
    await company.addMember(new Types.ObjectId(invitedNoSiteEmployee2.id), employeeRole.id);
    await company.addMember(new Types.ObjectId(invitedCBDOnlyManager2.id), managerRole.id);
    await company.addMember(new Types.ObjectId(invitedCBDOnlyManager1.id), managerRole.id);
    await company.addMember(new Types.ObjectId(invitedSouthYarraManager.id), managerRole.id);
    await company.addMember(new Types.ObjectId(invitedEmployeeNotActive.id), employeeRole.id);

    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedAllManagerUser.id));
    await SouthYarraoperateSite2.addMember(new Types.ObjectId(invitedAllManagerUser.id));
    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedEmployee1.id));
    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedCBDOnlyManager1.id));
    await MelbourneCBDOperateSite.addMember(new Types.ObjectId(invitedCBDOnlyManager2.id));
    await SouthYarraoperateSite2.addMember(new Types.ObjectId(invitedSouthYarraManager.id));
    await SouthYarraoperateSite2.addMember(new Types.ObjectId(invitedEmployeeNotActive.id));

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
