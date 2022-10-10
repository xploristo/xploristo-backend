import express from 'express';

import usersController from '../controllers/users.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .post('/', asyncErrorHandler(usersController.createUser))
  .get('/:userId([0-9a-fA-F]{24})', asyncErrorHandler(usersController.getUser))
  .put('/:userId([0-9a-fA-F]{24})', asyncErrorHandler(usersController.updateUser))
  .delete('/:userId([0-9a-fA-F]{24})', asyncErrorHandler(usersController.deleteUser))
  .get('/profile', asyncErrorHandler(usersController.getUserProfile))
  .get('/teachers', asyncErrorHandler(usersController.getTeachers))
  .get('/students', asyncErrorHandler(usersController.getStudents));
