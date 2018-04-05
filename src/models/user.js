import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';

const { Model, Schema } = mongoose;

const schema = new Schema({
  username: { type: String, required: true },
  created: { type: Date, required: true },
  password: { type: String, required: true, select: false },
});
schema.pre('save', async function () {
  const HASH_BYTES = 32;
  const SALT_BYTES = 16;

  // Hashing should take about a second
  const ITERATIONS = 872791;

  // generate salt for pbkdf2
  if (!this.isModified('password')) return;

  const salt = await thunkToPromise(done => crypto.randomBytes(SALT_BYTES));
  const buf = Buffer.allocUnsafe(8 + SALT_BYTES + HASH_BYTES);
  // include the size of the salt
  buf.writeUInt32BE(SALT_BYTES, 0, true);
  // include the iteration count
  buf.writeUInt32BE(ITERATIONS, 4, true);
  salt.copy(buf, 8);

  // save the plaintext password for passing into the hashing function
  const plaintext = this.password;
  this.password = buf.toString('base64');
  const hash = await this.hashPassword(plaintext);
  hash.copy(buf, 8 + SALT_BYTES);
  this.password = buf.toString('base64');
});
export default class Comment extends Model {
  async hashPassword(plaintext) {
    if (!('password' in this._doc)) throw new Error('Password field excluded from projection');
    const buf = Buffer.from(this.password, 'base64');

    // extract the salt and hash from the combined buffer
    const saltBytes = buf.readUInt32BE(0);
    const hashBytes = buf.length - 8 - saltBytes;
    const iterations = buf.readUInt32BE(4);
    const salt = buf.slice(8, 8 + saltBytes);

    return await thunkToPromise(done => crypto.pbkdf2(plaintext, salt, iterations, hashBytes, 'sha256', done));
  }

  async verifyPassword(password) {
    const hash = await this.hashPassword(password || '');
    const buf = Buffer.from(this.password, 'base64');

    const saltBytes = buf.readUInt32BE(0);
    const currentHash = buf.slice(8 + saltBytes);

    return hash.equals(currentHash);
  }
}

mongoose.model(Comment, schema, 'comments');
