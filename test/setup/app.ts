import { Express } from 'express';

let application: Express | undefined;

async function loadApp(): Promise<void> {
  const appModule = await import('../../src/loaders/express');
  const app = appModule.default;
  application = app();
}

export default {
  loadApp,
  get application(): Express | undefined {
    return application;
  },
};
