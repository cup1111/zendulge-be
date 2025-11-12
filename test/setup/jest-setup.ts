import sinon from 'sinon';
import * as dotenv from 'dotenv';
import db from './db';
import app from './app';

beforeAll(async () => {
  dotenv.config();
  await db.connect();
  await db.createDefaultData();
  await app.loadApp();
});

beforeEach(async () => {
  await db.clearDatabase();
  await db.createDefaultData();
  jest.clearAllMocks();
});

afterAll(async () => {
  sinon.restore();
  if (db.dbConnection && typeof db.dbConnection.close === 'function') {
    await db.dbConnection.close();
  }
});
