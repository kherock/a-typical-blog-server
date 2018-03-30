const path = require('path');

import { require } from './utils';

export const DIST_FOLDER = path.join(path.dirname(require.resolve('a-typical-blog')), 'browser');
export const PORT = process.env.PORT || 4000;
export const SERVER_URL = 'http://localhost:4000';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'super secret';
