import express from 'express';

import usersController from '../controllers/users.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .post('/', asyncErrorHandler(usersController.createUser))
  .get('/profile', asyncErrorHandler(usersController.getUserProfile));
