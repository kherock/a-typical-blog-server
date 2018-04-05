'use strict';

// https://github.com/angular/universal/issues/844
global['Event'] = class {};
global['Node'] = class {};

const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');

exports.require = require;

function thunkToPromise(fn) {
  return new Promise((resolve, reject) => {
    fn((err, ...args) => {
      if (err) return reject(err);
      resolve(args.length > 1 ? args : args[0]);
    });
  });
}

function proxyServe(context, options) {
  const proxy = require('http-proxy-middleware');
  const middleware = proxy(context, {
    changeOrigin: true,
    ...options
  });
  const fn = async (ctx, next) => {
    await thunkToPromise(done => middleware(ctx.req, ctx.res, done));
    if (ctx.status === 404) return await next();
    ctx.respond = false;
  }
  fn.upgrade = middleware.upgrade;
  return fn;
}

function proxyViewEngine(fileBase, urlBase) {
  const { protocol, hostname, port, pathname } = url.parse(urlBase);
  const { request } = protocol === 'https:' ? https : http;
  return async (filePath, ctx) => {
    const file = url.format(path.relative(fileBase, filePath));
    const req = request({
      hostname,
      port,
      path: pathname + file,
      method: 'GET',
    });
    req.end();
    const res = await new Promise((resolve, reject) => {
      req.on('error', reject);
      req.on('response', resolve);
    });
    if (res.statusCode === 404) ctx.throw(404);
    return res;
  }
}

Object.assign(exports, {
  thunkToPromise,
  proxyServe,
  proxyViewEngine,
});
