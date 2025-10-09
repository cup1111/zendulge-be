import express from 'express';
import rateLimit from 'express-rate-limit';
import config from '../app/config/app';

import apiRouterV1 from '../app/routes/v1/api';
const cors = require('cors');
const helmet = require('helmet');
import { globalAsyncErrorHandler, globalErrorHandler } from './routes';
const compression = require('compression');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const createExpressApp = () => {
  const app = express();

  app.use(compression());
  app.use(cors({
    exposedHeaders: ['Content-Disposition'], 
  }));
  app.use(express.json());
  if (process.env.LIMITER?.toString() === true.toString()) {
    app.use(limiter);
  }
  app.use(helmet());
  
  // Routes
  app.use(`${config.api.prefix}/v1`, globalAsyncErrorHandler(apiRouterV1));
  
  // Global error handling middleware (must be last)
  app.use(globalErrorHandler);

  return app;
};

export default createExpressApp;
