import express from 'express';

import testsController from '../controllers/tests.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .post('/', asyncErrorHandler(testsController.createTest))
  .get('/:testId', asyncErrorHandler(testsController.getTest));
