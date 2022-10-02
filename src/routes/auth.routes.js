import express from 'express';

import authController from '../controllers/auth.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .post('/', asyncErrorHandler(authController.login))
  .delete('/', asyncErrorHandler(authController.logout))
  .put('/password', asyncErrorHandler(authController.setPassword));
