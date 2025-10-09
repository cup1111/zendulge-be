import expressLoader from './express';
import serverLoader from './server';
import databaseLoader from './database';
import { createServer } from 'http';

const init = () => {
  // Initialize database settings first
  databaseLoader();
  
  const app = expressLoader();
  const server = createServer(app);
  serverLoader(server);
};

export default { init };
