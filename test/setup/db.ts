import UserBuilder from '../__test__/builders/userBuilder';
import BusinessBuilder from '../__test__/builders/businessBuilder';
import dbHandler from './dbHandler';
import mongoose, { Connection } from 'mongoose';
import RoleBuilder from '../__test__/builders/roleBuilder';
import { RoleName } from '../../src/app/enum/roles';

let dbConnection: Connection | null = null;
let isInitialized = false;
let defaultUser: any = null;
let defaultBusiness: any = null;

async function connect(): Promise<{ dbConnection: Connection }> {
  if (!isInitialized) {
    try {
      await dbHandler.connect();
      dbConnection = mongoose.connection;
      isInitialized = true;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Failed to initialize database connections:', error);
      throw error;
    }
  }
  return { dbConnection: dbConnection! };
}

async function createDefaultData(): Promise<void> {
  // Seed roles
  await new RoleBuilder()
    .withName(RoleName.OWNER)
    .withDescription('Business owner who can manage their business')
    .withActive(true)
    .save();
  await new RoleBuilder()
    .withName(RoleName.MANAGER)
    .withDescription('Manager with extended team access')
    .withActive(true)
    .save();
  await new RoleBuilder()
    .withName(RoleName.EMPLOYEE)
    .withDescription('Employee with limited access to business resources')
    .withActive(true)
    .save();
  await new RoleBuilder()
    .withName(RoleName.CUSTOMER)
    .withDescription('Customer with basic access')
    .withActive(true)
    .save();

  const user = await new UserBuilder().save();
  defaultUser = user;

  const business = await new BusinessBuilder().withOwner(user.id).withContact(user.id).save();
  defaultBusiness = business;


}

async function clearDatabase(): Promise<void> {
  return dbHandler.clearDatabase();
}

export default {
  connect,
  clearDatabase,
  createDefaultData,
  get dbConnection(): Connection | null {
    return dbConnection;
  },
  get defaultUser(): any {
    return defaultUser;
  },
  get defaultBusiness(): any {
    return defaultBusiness;
  },
};
