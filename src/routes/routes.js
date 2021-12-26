import express from 'express';

import AuthRoutes from './auth.routes.js';

export default express
  .Router()
  .use('/auth', AuthRoutes);
