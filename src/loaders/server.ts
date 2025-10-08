import { Server as HttpServer } from 'http';
import config from '../app/config/app';

const startServer = (httpServer: HttpServer) => {

  httpServer.listen(config.port, () => {
  // eslint-disable-next-line no-console
    console.log(`⚡️[server]: Server is running at http://localhost:${config.port}`);
  }).on('error', (e:any) => {
  // eslint-disable-next-line no-console
    console.log('Error', e);
  });
};

export default startServer;