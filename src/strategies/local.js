
import { Strategy } from 'passport-local';

import User from '../models/user';

export default new Strategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ username }).select('+firstName +lastName +password');
    if (!user) return done(null);
    const verified = await user.verifyPassword(password);
    if (!verified) return done(null);
    delete user._doc.password;
    return done(null, user);
  } catch (err) {
    done(err);
  }
});
