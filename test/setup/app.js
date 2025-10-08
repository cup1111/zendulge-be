let application;

async function loadApp() {
  const appModule = await import('../../src/loaders/express');
  const app = appModule.default;
  application = app();
}
export default {
  loadApp,
  get application() {
    return application;
  },
};
