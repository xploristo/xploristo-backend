import express from 'express';

import resultsController from '../controllers/results.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .get('/', asyncErrorHandler(resultsController.getResults))
  .get('/:resultId([0-9a-fA-F]{24})', asyncErrorHandler(resultsController.getResult))
  .post('/', asyncErrorHandler(resultsController.createResult));
