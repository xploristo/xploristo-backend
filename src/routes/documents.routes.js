import express from 'express';

import documentsController from '../controllers/documents.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .get('/:id/download', asyncErrorHandler(documentsController.getDownloadUrl));
