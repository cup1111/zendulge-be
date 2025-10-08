/* eslint-disable no-secrets/no-secrets */
const dotenv = require('dotenv');
process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
dotenv.config();

export const config = {
  environment: process.env.ENVIRONMENT ?? 'production',
  name: process.env.NAME ?? 'techscrumapp',
  port: process.env.PORT ?? 8000,
  api: {
    prefix: process.env.API_PREFIX ?? '/api',
  },
  version: '1.0.0',
  companyAddress: process.env.COMPANY_ADDRESS ?? '',
  emailSecret: process.env.EMAIL_SECRET ?? '123456',
  forgotSecret: process.env.FORGET_SECRET ?? '321654',
  accessSecret: process.env.ACCESS_SECRET ?? '',
  //---------------------------v2--------------------------
  tenantsDBConnection: process.env.TENANTS_CONNECTION ?? '',
  publicConnection: process.env.PUBLIC_CONNECTION ?? '',
  connectTenantOrigin: process.env.CONNECT_TENANT ?? null,
  mainDomain: process.env.MAIN_DOMAIN ?? null,
  protocol: process.env.ENVIRONMENT === 'local' ? 'http://' : 'https://',
  devopsMode: process.env.DEVOPS_MODE === 'true' ? true : false,
  postman_testing: process.env.POSTMAN_TESTING ?? 'false',
};

export default config;
