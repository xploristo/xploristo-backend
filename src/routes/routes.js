import express from 'express';

import authRoutes from './auth.routes.js';
import groupsRoutes from './auth.groups.js';
import usersRoutes from './users.routes.js';
import testsRoutes from './tests.routes.js';

export default express
  .Router()
  .use('/auth', authRoutes)
  .use('/groups', groupsRoutes)
  .use('/users', usersRoutes)
  .use('/tests', testsRoutes);
