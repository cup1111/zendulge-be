import sinon from 'sinon';
import * as dotenv from 'dotenv';
import db from './db';
import app from './app';
import * as authMiddleware from '../../src/app/middleware/authMiddleware';
import * as saasMiddleware from '../../src/app/middleware/saasMiddlewareV2';
import * as permissionMiddleware from '../../src/app/middleware/permissionMiddleware';

beforeAll(async () => {
  dotenv.config();
  await db.connect();
  await db.createDefaultData();

  sinon.stub(saasMiddleware, 'saas').callsFake(function (req: any, res: any, next: any) {
    req.dbConnection = db.dbConnection;
    req.companyId = db.defaultCompany.id;
    req.userId = db.defaultUser.id;
    return next();
  });

  sinon.stub(authMiddleware, 'authenticationTokenMiddleware').callsFake(function (req: any, res: any, next: any) {
    return next();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sinon.stub(permissionMiddleware, 'permission').callsFake(function (slug: string) {
    return (req: any, res: any, next: any) => {
      return next();
    };
  });
  await app.loadApp();
});

beforeEach(async () => {
  await db.clearDatabase();
  await db.createDefaultData();
});

afterAll(async () => {
  sinon.restore();
  if (db.dbConnection && typeof db.dbConnection.close === 'function') {
    await db.dbConnection.close();
  }
});
