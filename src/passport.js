import passport from 'koa-passport';

import User from './models/user';
import localStrategy from './strategies/local';

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => User.findById(id).select('+firstName +lastName').exec(done));

passport.use(localStrategy);

export default passport;

