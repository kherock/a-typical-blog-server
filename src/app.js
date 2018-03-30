import http from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import passport from './passport';
import session from 'koa-session';
import views from 'koa-views';
import mongoose from 'mongoose';
import path from 'path';
import { SCServer } from 'socketcluster-server';

import { ngViewEngine, AppServerModuleNgFactory, LAZY_MODULE_MAP } from 'a-typical-blog';

import { DIST_FOLDER, PORT, SERVER_URL, SESSION_SECRET } from './env';
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
    ng: ngViewEngine(AppServerModuleNgFactory, LAZY_MODULE_MAP, SERVER_URL),
    proxy: proxyViewEngine(DIST_FOLDER, 'http://localhost:4200/assets/'),
  },
}));

app.use(compress({
  filter: contentType => /json|text|javascript|css|font|svg/.test(contentType),
  level: 9,
}));

app.use(bodyParser());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const { name, status, message } = err;
    if (status) ctx.status = status;
    ctx.body = { name };
    if (400 <= status && status < 500) {
      ctx.body.message = message;
    } else {
      console.log(err.stack);
      ctx.status = 500;
      ctx.body.message = 'Internal server error';
    }
  }
});

app.keys = [SESSION_SECRET];
app.use(session(app))

app.use(passport.initialize());
app.use(passport.session());

app.use(routes);

app.scServer.addMiddleware('publishIn', (req, next) => {
  next(true); // disable publishing messages
});

app.server.on('request', app.callback());
app.scServer.on('connection', (socket) => {
  socket.on('subscribe', (channelName) => {
    console.log(socket.id + ' subscribed to ' + channelName);
  });
  socket.on('unsubscribe', (channelName) => {
    console.log(socket.id + ' unsubscribed from ' + channelName);
  });
});

app.listen = async function (port, ...args) {
  if (port == undefined) port = PORT;
  await mongoose.connect('mongodb://localhost/a-typical-blog');
  return await thunkToPromise(done => app.server.listen(port, ...args, done));
}
