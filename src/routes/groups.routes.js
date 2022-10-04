import express from 'express';

import groupsController from '../controllers/groups.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .get('/', asyncErrorHandler(groupsController.getGroups))
  .post('/', asyncErrorHandler(groupsController.createGroup))
  .get('/:groupId', asyncErrorHandler(groupsController.getGroup))
  .post('/:groupId/assignment', asyncErrorHandler(groupsController.createAssignment));
