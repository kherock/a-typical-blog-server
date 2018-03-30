import mount from 'koa-mount';
import Router from 'koa-router';
import serve from 'koa-static';

import * as ctrl from './controllers';
import { DIST_FOLDER } from './env';
import { proxyServe } from './utils';

const router = new Router();

const serveMiddleware = process.env.NODE_ENV === 'production'
  ? serve(DIST_FOLDER, {
      maxage: 365 * 24 * 60 * 60 * 1000, // 1 year
      index: false
    })
  : proxyServe('http://localhost:4200', { pathRewrite: { '^/': '/assets/' } });
router.get('/favicon.ico', serveMiddleware);
router.get('/assets/*', mount('/assets', (ctx, next) => {
  if (ctx.url.endsWith('.html')) return next();
  return serveMiddleware(ctx, next);
}));

router.get('*', (ctx, next) => {
  switch (ctx.accepts('text', 'json', 'html')) {
  case 'text': return next();
  case 'json': return next();
  case 'html': return ctx.render('index', ctx);
  default: ctx.throw(406);
  }
});

router
  .param('articleName', (articleName, ctx, next) => {
    const { year, month } = ctx.params;
    ctx.state.articleId = `${year}-${month}-${articleName}`;
    return next();
  })
  .get('/:year/:month/:articleName', ctrl.getArticle)
  .get('/:year/:month/:articleName/comments', ctrl.getComments)
  .post('/:year/:month/:articleName/comments', ctrl.postComment);

router
  .get('/session', ctrl.getSession)
  .post('/session', ctrl.logIn)
  .delete('/session', ctrl.logOut);

export default router.routes();
