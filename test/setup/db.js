import UserBuilder from '../__tests__/builders/userBuilder';
import CompanyBuilder from '../__tests__/builders/companyBuilder';
import dbHandler from './dbHandler';

let dbConnection = null;
let isInitialized = false;
let defaultUser = null;
let defaultCompany = null;

async function connect() {
  if (!isInitialized) {
    try {
      const result = await dbHandler.connect();
      dbConnection = result.dbConnection;
      isInitialized = true;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Failed to initialize database connections:', error);
      throw error;
    }
  }
  return { dbConnection };
}

async function createDefaultData() {
  const user = await new UserBuilder().save();
  defaultUser = user;

  const company = await new CompanyBuilder().withOwner(user._id).save();
  defaultCompany = company;
}

async function clearDatabase() {
  return dbHandler.clearDatabase();
}
export default {
  connect,
  clearDatabase,
  createDefaultData,
  get dbConnection() {
    return dbConnection;
  },
  get defaultUser() {
    return defaultUser;
  },
  get defaultCompany() {
    return defaultCompany;
  },
};
