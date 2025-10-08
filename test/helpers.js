import sinon from 'sinon';
import dbHandler from './dbHandler';
import * as sassMiddleware from '../src/app/middleware/saasMiddlewareV2';
import * as authMiddleware from '../src/app/middleware/authMiddleware';
const seed = require('./seed');

let authStub = null;
let sassStub = null;
let dbConnection = '';
let tenantConnection = '';

export const setup = async () => {
  let result = await dbHandler.connect();
  dbConnection = result.mainConnection;
  tenantConnection = result.tenantConnection;
  await dbHandler.clearDatabase();
  await seed(dbConnection);

  authStub = sinon
    .stub(authMiddleware, 'authenticationTokenMiddleware')
    .callsFake(function (req, res, next) {
      return next();
    });
  sassStub = sinon.stub(sassMiddleware, 'saas').callsFake(function (req, res, next) {
    req.dbConnection = dbConnection;
    req.tenantsConnection = tenantConnection;
    return next();
  });

  const app = require('../src/loaders/express');

  return {
    app,
    dbConnection,
    tenantConnection,
  };
};

export const restore = async () => {
  if (!authStub || !sassStub) return;
  await authStub.restore();
  await sassStub.restore();
  await dbHandler.closeDatabase();
};
