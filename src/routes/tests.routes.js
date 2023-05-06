import express from 'express';

import testsController from '../controllers/tests.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .get('/', asyncErrorHandler(testsController.getTests))
  .post('/', asyncErrorHandler(testsController.createTest))
  .get('/:testId([0-9a-fA-F]{24})', asyncErrorHandler(testsController.getTest))
  .get(
    '/:testId([0-9a-fA-F]{24})/document-download-url',
    asyncErrorHandler(testsController.getTestDocumentDownloadUrl)
  )
  .put('/:testId([0-9a-fA-F]{24})', asyncErrorHandler(testsController.updateTest))
  .put('/:testId([0-9a-fA-F]{24})/document', asyncErrorHandler(testsController.updateTestDocument))
  .delete('/:testId([0-9a-fA-F]{24})', asyncErrorHandler(testsController.deleteTest));
