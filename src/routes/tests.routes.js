import express from 'express';

import testsController from '../controllers/tests.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .post('/', asyncErrorHandler(testsController.createTest))
  .put('/:testId', asyncErrorHandler(testsController.updateTest))
  .put('/:testId/document', asyncErrorHandler(testsController.updateTestDocument))
  .get('/:testId', asyncErrorHandler(testsController.getTest))
  .delete('/:testId', asyncErrorHandler(testsController.deleteTest));
