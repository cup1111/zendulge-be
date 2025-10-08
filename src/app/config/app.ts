/* eslint-disable no-secrets/no-secrets */
const dotenv = require('dotenv');
process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
dotenv.config();
console.log(process.env.DB_CONNECTION);
export const config = {
  environment: process.env.ENVIRONMENT ?? 'production',
  name: process.env.NAME ?? 'techscrumapp',
  port: process.env.PORT ?? 8000,
  api: {
    prefix: process.env.API_PREFIX ?? '/api',
  },
  version: '1.0.0',
  emailSecret: process.env.EMAIL_SECRET ?? '123456',
  forgotSecret: process.env.FORGET_SECRET ?? '321654',
  accessSecret: process.env.ACCESS_SECRET ?? '',
  //---------------------------v2--------------------------
  dbConnection: process.env.DB_CONNECTION ?? '',
  mainDomain: process.env.MAIN_DOMAIN ?? null,
};

export default config;
