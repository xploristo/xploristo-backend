import express from 'express';

import groupsController from '../controllers/groups.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .post('/', asyncErrorHandler(groupsController.createGroup));
