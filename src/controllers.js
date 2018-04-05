import Article from './models/article';
import Comment from './models/comment';

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
  const article = await Article.findById(ctx.state.articleId).select('_id');
  if (!article) ctx.throw(400, 'Invalid article');
  const comment = new Comment({
    ...ctx.request.body,
    article: article._id,
    author: 'some_guy',
    date: new Date(),
  });
  ctx.body = await comment.save();
}
