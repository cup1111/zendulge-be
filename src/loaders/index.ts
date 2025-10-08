import expressLoader from './express';
import serverLoader from './server';
import { createServer } from 'http';

const init = () => {
  const app = expressLoader();
  const server = createServer(app);
  serverLoader(server);
};

export default { init };
