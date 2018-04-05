import http from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import views from 'koa-views';
import mongoose from 'mongoose';
import path from 'path';
import { SCServer } from 'socketcluster-server';

// import { ngViewEngine, AppServerModuleNgFactory, LAZY_MODULE_MAP } from '../../a-typical-blog';

import { DIST_FOLDER, PORT, SERVER_URL } from './env';
import routes from './routes';
import { proxyServe, proxyViewEngine, thunkToPromise } from './utils';

// Koa server
const app = new Koa();
export default app;
app.server = http.createServer();
app.scServer = new SCServer({ httpServer: app.server });
app.context.exchange = app.scServer.exchange;

// proxy Angular Live Development Server websocket connections
if (process.env.NODE_ENV !== 'production') {
  const proxyMiddleware = proxyServe('http://localhost:4200/sockjs-node');
  app.use(proxyMiddleware);
  app.server.on('upgrade', proxyMiddleware.upgrade);
}

app.use(views(DIST_FOLDER, {
  map: { html: process.env.NODE_ENV === 'production' ? 'ng' : 'proxy' },
  engineSource: {
    // ng: ngViewEngine(AppServerModuleNgFactory, LAZY_MODULE_MAP, SERVER_URL),
    proxy: proxyViewEngine(DIST_FOLDER, 'http://localhost:4200/assets/'),
  },
}));

app.use(compress({
  filter: contentType => /json|text|javascript|css|font|svg/.test(contentType),
  level: 9,
}));

app.use(bodyParser());

app.use(routes);

app.server.on('request', app.callback());

app.listen = async function (port, ...args) {
  if (port == undefined) port = PORT;
  await mongoose.connect('mongodb://localhost/a-typical-blog');
  return await thunkToPromise(done => app.server.listen(port, ...args, done));
}
