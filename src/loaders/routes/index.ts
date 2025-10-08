import { Request, Response, NextFunction } from 'express';
// import { winstonLogger } from '../../loaders/logger';

const asyncMiddleware = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((e) => {
    //winstonLogger.error(e.message);
    res.status(500).send('An internal server error occurred');
  });
};

export const globalAsyncErrorHandler = (router: any) => {
  router?.stack?.forEach((item: any) => {
    const { route } = item;
    route?.stack?.forEach((routeItem: any) => {
      routeItem.handle = asyncMiddleware(routeItem.handle);
    });
  });
  return router;
};
