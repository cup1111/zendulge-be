import UserBuilder from '../__test__/builders/userBuilder';
import CompanyBuilder from '../__test__/builders/companyBuilder';
import dbHandler from './dbHandler';
import mongoose, { Connection } from 'mongoose';

let dbConnection: Connection | null = null;
let isInitialized = false;
let defaultUser: any = null;
let defaultCompany: any = null;

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
  const user = await new UserBuilder().save();
  defaultUser = user;

  const company = await new CompanyBuilder().withOwner(user._id).withContact(user._id).save();
  defaultCompany = company;
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
  get defaultCompany(): any {
    return defaultCompany;
  },
};
