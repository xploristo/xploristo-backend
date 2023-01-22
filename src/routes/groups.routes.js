import express from 'express';

import groupsController from '../controllers/groups.controller.js';
import assignmentsController from '../controllers/assignments.controller.js';
import asyncErrorHandler from '../middlewares/async-error-handler.js';

export default express
  .Router()
  .get('/', asyncErrorHandler(groupsController.getGroups))
  .post('/', asyncErrorHandler(groupsController.createGroup))
  .get('/:groupId([0-9a-fA-F]{24})', asyncErrorHandler(groupsController.getGroup))
  .put('/:groupId([0-9a-fA-F]{24})', asyncErrorHandler(groupsController.updateGroup))
  .delete('/:groupId([0-9a-fA-F]{24})', asyncErrorHandler(groupsController.deleteGroup))
  .post('/:groupId([0-9a-fA-F]{24})/students', asyncErrorHandler(groupsController.enrollStudents))
  // Assignments
  .get(
    '/:groupId([0-9a-fA-F]{24})/assignments',
    asyncErrorHandler(assignmentsController.getAssignments)
  )
  .post(
    '/:groupId([0-9a-fA-F]{24})/assignments',
    asyncErrorHandler(assignmentsController.createAssignment)
  )
  .get(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})',
    asyncErrorHandler(assignmentsController.getAssignment)
  )
  .put(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})',
    asyncErrorHandler(assignmentsController.updateAssignment)
  )
  .delete(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})',
    asyncErrorHandler(assignmentsController.deleteAssignment)
  );
