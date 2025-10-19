import mongoose from 'mongoose';
import Role from '../model/role';
import config from '../config/app';
import { RoleName } from '../enum/roles';

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.dbConnection);
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB for role seeding');

    // Define default roles
    const defaultRoles = [
      {
        name: RoleName.OWNER,
        description: 'Business owner who can manage their company',
        isActive: true,
      },
      {
        name: RoleName.EMPLOYEE,
        description: 'Employee with limited access to company resources',
        isActive: true,
      },
      {
        name: RoleName.CUSTOMER,
        description: 'Customer with basic access',
        isActive: true,
      },
    ];

    // Insert roles if they don't exist
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        // eslint-disable-next-line no-console
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`ℹ️  Role already exists: ${roleData.name}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log('🎉 Role seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
