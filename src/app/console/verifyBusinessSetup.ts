import mongoose from 'mongoose';
import User from '../model/user';
import Business from '../model/business';
import OperateSite from '../model/operateSite';
import Role from '../model/role';
import config from '../config/app';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

const verifyBusinessSetupData = async () => {
  try {
    await mongoose.connect(config.dbConnection);
    console.log('Connected to MongoDB for business setup verification');

    // Get Business
    const business = await Business.findOne({
      name: 'Zendulge Technologies Pty Ltd',
    });
    const businessOwner = business?.owner
      ? await User.findById(business.owner)
      : null;

    console.log('\n🏢 Business Details:');
    console.log(`   Name: ${business?.name}`);
    console.log(
      `   Owner: ${businessOwner?.firstName} ${businessOwner?.lastName} (${businessOwner?.email})`,
    );
    console.log(
      `   Address: ${business?.businessAddress?.street}, ${business?.businessAddress?.city}`,
    );
    console.log(`   ABN: ${business?.abn}`);
    console.log(`   Website: ${business?.website}`);
    console.log(`   Members: ${business?.members?.length || 0}`);

    if (business?.members && business.members.length > 0) {
      console.log('   Team Members:');
      for (const member of business.members) {
        const memberUser = await User.findById(member.user);
        const memberRole = await Role.findById(member.role);
        console.log(
          `     • ${memberUser?.firstName} ${memberUser?.lastName} (${memberUser?.email}) - Role: ${memberRole?.name}`,
        );
      }
    }

    // Get Operate Sites
    const operateSites = await OperateSite.find({ business: business?.id });
    console.log('\n📍 Operate Sites:');
    operateSites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.name}`);
      console.log(`      Address: ${site.address}`);
      console.log(`      Phone: ${site.phoneNumber}`);
      console.log(`      Email: ${site.emailAddress}`);
      console.log(
        `      Hours: Mon-Fri ${site.operatingHours.monday.open}-${site.operatingHours.monday.close}`,
      );
      console.log(`      Special: ${site.specialInstruction}`);
      console.log(`      Active: ${site.isActive}`);
      console.log('');
    });

    // Get Invited User
    const invitedUser = await User.findOne({ email: 'manager@zendulge.com' });

    console.log('👥 Invited User:');
    console.log(`   Email: ${invitedUser?.email}`);
    console.log(`   Name: ${invitedUser?.firstName} ${invitedUser?.lastName}`);
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
