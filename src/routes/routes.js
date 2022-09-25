import express from 'express';

import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import testsRoutes from './tests.routes.js';

export default express
  .Router()
  .use('/auth', authRoutes)
  .use('/users', usersRoutes)
  .use('/tests', testsRoutes);
