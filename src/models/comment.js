import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';

const { Model, Schema } = mongoose;

const schema = new Schema({
  author: { type: String, required: true },
  date: { type: Date, required: true },
  article: { ref: 'Article', type: String, required: true },
  parent: { ref: 'Comment', type: Schema.ObjectId },
  html: { type: String, required: true },
});
schema.pre('save', function () {
  if (!this.html) return;
  this.html = sanitizeHtml(this.html, {
    allowedTags: ['p', 'b', 'i', 's', 'em', 'strong', 'sup', 'sub', 'blockquote', 'a', 'img'],
    allowedSchemes: ['http', 'https', 'data'],
    allowedAttributes: {
      'a': ['href'],
      'img': ['src', 'alt'],
    },
  });
});
export default class Comment extends Model { }

mongoose.model(Comment, schema, 'comments');
