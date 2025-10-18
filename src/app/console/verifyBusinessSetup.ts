import mongoose from 'mongoose';
import User from '../model/user';
import Company from '../model/company';
import OperateSite from '../model/operateSite';
import Role from '../model/role';
import config from '../config/app';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

const verifyBusinessSetupData = async () => {
  try {
    await mongoose.connect(config.dbConnection);
    console.log('Connected to MongoDB for business setup verification');



    // Get Company
    const company = await Company.findOne({ name: 'Zendulge Technologies Pty Ltd' });
    const companyOwner = company?.owner ? await User.findById(company.owner) : null;
    
    console.log('\n🏢 Company Details:');
    console.log(`   Name: ${company?.name}`);
    console.log(`   Owner: ${companyOwner?.firstName} ${companyOwner?.lastName} (${companyOwner?.email})`);
    console.log(`   Address: ${company?.businessAddress?.street}, ${company?.businessAddress?.city}`);
    console.log(`   ABN: ${company?.abn}`);
    console.log(`   Website: ${company?.website}`);
    console.log(`   Members: ${company?.members?.length || 0}`);
    
    if (company?.members && company.members.length > 0) {
      console.log('   Team Members:');
      for (const member of company.members) {
        const memberUser = await User.findById(member.user);
        const memberRole = await Role.findById(member.role);
        console.log(`     • ${memberUser?.firstName} ${memberUser?.lastName} (${memberUser?.email}) - Role: ${memberRole?.name}`);
      }
    }

    // Get Operate Sites
    const operateSites = await OperateSite.find({ company: company?.id });
    console.log('\n📍 Operate Sites:');
    operateSites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.name}`);
      console.log(`      Address: ${site.address}`);
      console.log(`      Phone: ${site.phoneNumber}`);
      console.log(`      Email: ${site.emailAddress}`);
      console.log(`      Hours: Mon-Fri ${site.operatingHours.monday.open}-${site.operatingHours.monday.close}`);
      console.log(`      Special: ${site.specialInstruction}`);
      console.log(`      Active: ${site.isActive}`);
      console.log('');
    });

    // Get Invited User
    const invitedUser = await User.findOne({ email: 'manager@zendulge.com' });
    const invitedUserRole = invitedUser?.role ? await Role.findById(invitedUser.role) : null;
    
    console.log('👥 Invited User:');
    console.log(`   Email: ${invitedUser?.email}`);
    console.log(`   Name: ${invitedUser?.firstName} ${invitedUser?.lastName}`);
    console.log(`   Role: ${invitedUserRole?.name}`);
    console.log(`   Job Title: ${invitedUser?.jobTitle}`);
    console.log(`   Active: ${invitedUser?.active}`);

    console.log('\n✅ Data verification completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  verifyBusinessSetupData();
}

export default verifyBusinessSetupData;
