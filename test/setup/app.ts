import createExpressApp from '../../src/loaders/express';
import { Express } from 'express';

let application: Express | undefined;

async function loadApp(): Promise<void> {
  application = createExpressApp();
}

function getApp(): Express {
  if (!application) {
    throw new Error('App not loaded. Make sure loadApp() is called in beforeAll.');
  }
  return application;
}

export default {
  loadApp,
  getApp,
  get application(): Express | undefined {
    return application;
  },
};
