import mongoose from 'mongoose';
import User from '../model/user';
import Company from '../model/company';
import OperateSite from '../model/operateSite';
import Role from '../model/role';
import config from '../config/app';
import { RoleName } from '../enum/roles';
import * as bcrypt from 'bcrypt';

/* eslint-disable no-console */

const seedCompleteBusinessSetup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.dbConnection);
    console.log('Connected to MongoDB for complete business setup seeding');

    // First, ensure roles exist
    const adminRole = await Role.findOne({ name: RoleName.ADMIN });
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    const customerRole = await Role.findOne({ name: RoleName.CUSTOMER });

    if (!adminRole || !ownerRole || !customerRole) {
      throw new Error('Roles not found. Please run seed-roles first.');
    }

    // Create Super Admin User
    const superAdminData = {
      email: 'superadmin@zendulge.com',
      password: await bcrypt.hash('SuperAdmin123!', 8),
      firstName: 'Super',
      lastName: 'Admin',
      phoneNumber: '+61412345678',
      jobTitle: 'System Administrator',
      userName: 'superadmin',
      active: true,
      role: adminRole._id,
      isSuperUser: 1,
    };

    // Check if super admin already exists
    let superAdmin = await User.findByEmail(superAdminData.email);
    if (!superAdmin) {
      superAdmin = new User(superAdminData);
      await superAdmin.save();
      console.log('✅ Created Super Admin user');
    } else {
      console.log('ℹ️  Super Admin user already exists');
    }

    // Create a Company for the Super Admin
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
      contact: superAdmin._id,
      abn: '51824753556', // Valid ABN format for testing
      website: 'https://zendulge.com',
      facebookUrl: 'https://facebook.com/zendulge',
      twitterUrl: 'https://twitter.com/zendulge',
      owner: superAdmin._id,
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
      specialInstruction: 'Main headquarters with full service availability. Meeting rooms available by appointment.',
      company: company._id,
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
      specialInstruction: 'Boutique location specializing in premium consultations. Valet parking available.',
      company: company._id,
      latitude: -37.8394,
      longitude: 144.9944,
      isActive: true,
    };

    // Create operate sites
    let operateSite1 = await OperateSite.findOne({ name: operateSite1Data.name });
    if (!operateSite1) {
      operateSite1 = new OperateSite(operateSite1Data);
      await operateSite1.save();
      console.log('✅ Created operate site: Melbourne CBD');
    } else {
      console.log('ℹ️  Operate site already exists: Melbourne CBD');
    }

    let operateSite2 = await OperateSite.findOne({ name: operateSite2Data.name });
    if (!operateSite2) {
      operateSite2 = new OperateSite(operateSite2Data);
      await operateSite2.save();
      console.log('✅ Created operate site: South Yarra');
    } else {
      console.log('ℹ️  Operate site already exists: South Yarra');
    }

    // Create an invited user (Business Manager)
    const invitedUserData = {
      email: 'manager@zendulge.com',
      password: await bcrypt.hash('Manager123!', 8),
      firstName: 'Sarah',
      lastName: 'Johnson',
      phoneNumber: '+61412345679',
      jobTitle: 'Business Manager',
      userName: 'sjohnson',
      active: true,
      role: ownerRole._id, // Give them owner role for the business
    };

    let invitedUser = await User.findByEmail(invitedUserData.email);
    if (!invitedUser) {
      invitedUser = new User(invitedUserData);
      await invitedUser.save();
      console.log('✅ Created invited user: Sarah Johnson');
    } else {
      console.log('ℹ️  Invited user already exists: Sarah Johnson');
    }

    // Add the invited user as a member of the company
    const isAlreadyMember = company.members?.some(member => member.user.equals(invitedUser!._id));
    if (!isAlreadyMember) {
      if (!company.members) {
        company.members = [];
      }
      company.members.push({
        user: invitedUser!._id,
        role: ownerRole._id,
        joinedAt: new Date(),
      });
      await company.save();
      console.log('✅ Added Sarah Johnson as company member');
    } else {
      console.log('ℹ️  Sarah Johnson is already a company member');
    }

    // Create sample services data (as simple objects since no Service model exists yet)
    const servicesData = [
      {
        name: 'Premium Business Consultation',
        description: 'Comprehensive business strategy and optimization consultation',
        category: 'Business Services',
        price: 299.99,
        duration: '2 hours',
        isActive: true,
        operateSites: [operateSite1._id, operateSite2._id],
      },
      {
        name: 'Technology Integration Services',
        description: 'Full-stack technology integration and digital transformation',
        category: 'Technology Services',
        price: 499.99,
        duration: '4 hours',
        isActive: true,
        operateSites: [operateSite1._id], // Only available at main location
      },
    ];

    console.log('📊 Sample Services Configuration:');
    servicesData.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - $${service.price}`);
      console.log(`      Available at: ${service.operateSites.length} location(s)`);
    });

    // Summary
    console.log('\n🎉 Complete business setup seeding completed successfully!');
    console.log('\n📋 Summary of created data:');
    console.log(`   👤 Super Admin: ${superAdmin.email}`);
    console.log(`   🏢 Company: ${company.name}`);
    console.log('   📍 Operate Sites: 2 locations');
    console.log(`   👥 Team Members: 1 invited user (${invitedUser.email})`);
    console.log(`   🛠️  Services: ${servicesData.length} service offerings`);
    
    console.log('\n🔐 Login Credentials:');
    console.log(`   Super Admin: ${superAdmin.email} / SuperAdmin123!`);
    console.log(`   Manager: ${invitedUser.email} / Manager123!`);

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
