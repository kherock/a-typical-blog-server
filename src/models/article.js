import mongoose from 'mongoose';

const { Model, Schema } = mongoose;

const schema = new Schema({
  _id: String,
  headline: { type: String, required: true },
  subhead: String,
  author: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: Date, required: true },
});
export default class Article extends Model { }

mongoose.model(Article, schema, 'articles');