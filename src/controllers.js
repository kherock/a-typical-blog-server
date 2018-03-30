import Article from './models/article';
import Comment from './models/comment';
import User from './models/user';
import passport from './passport';

export async function getArticle(ctx) {
  const [article, comments] = await Promise.all([
    await Article.findById(ctx.state.articleId),
    await Comment.count({ article: ctx.state.articleId }),
  ]);
  if (!article) ctx.throw(404);
  ctx.body = { article, comments };
}

export async function getComments(ctx) {
  const article = await Article.findById(ctx.state.articleId).select('_id');
  if (!article) ctx.throw(404, 'Invalid article');
  ctx.body = await Comment.find({
    article: article._id
  });
}

export async function postComment(ctx) {
  if (!ctx.isAuthenticated()) ctx.throw(401, 'You must be signed in to post comments');
  const article = await Article.findById(ctx.state.articleId).select('_id');
  if (!article) ctx.throw(400, 'Invalid article');
  const comment = new Comment({
    ...ctx.request.body,
    article: article._id,
    author: ctx.state.user.username,
    date: new Date(),
  });
  ctx.body = await comment.save();
  const { year, month, articleName } = ctx.params;
  ctx.exchange.publish(`/${year}/${month}/${articleName}/comments`, ctx.body);
  Comment.count({ article: ctx.state.articleId }).then((comments) => {
    ctx.exchange.publish(`/${year}/${month}/${articleName}`, { comments });
  });
}

export async function getSession(ctx) {
  ctx.body = ctx.state.user;
}

export async function logIn(ctx) {
  if ('firstName' in ctx.request.body || 'lastName' in ctx.request.body) {
    const user = await new User(ctx.request.body).save();
    ctx.body = user;
    ctx.logIn(user);
  } else {
    await passport.authenticate('local', (err, user, info, status) => {
      if (user === false) {
        ctx.throw(400, 'Invalid username or password');
      } else {
        ctx.body = user;
        return ctx.logIn(user);
      }
    })(ctx);
  }
}

export async function logOut(ctx) {
  ctx.logOut();
  ctx.status = 204;
}
