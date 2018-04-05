
import app from './src/app';
import { proxyServe } from './src/utils';

// Start up the Node server
app.listen().then(() => {
  console.log(`Node server listening on http://localhost:${app.server.address().port}`);
});
