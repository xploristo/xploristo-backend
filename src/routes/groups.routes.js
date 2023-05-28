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
  .post(
    '/:groupId([0-9a-fA-F]{24})/teachers',
    asyncErrorHandler(groupsController.addTeacherToGroup)
  )
  .delete(
    '/:groupId([0-9a-fA-F]{24})/teachers/:teacherId([0-9a-fA-F]{24})',
    asyncErrorHandler(groupsController.deleteTeacherFromGroup)
  )

  // Assignments
  .post(
    '/:groupId([0-9a-fA-F]{24})/assignments',
    asyncErrorHandler(assignmentsController.createAssignment)
  )
  .get(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})',
    asyncErrorHandler(assignmentsController.getAssignment)
  )
  .get(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})/test/document-download-url',
    asyncErrorHandler(assignmentsController.getAssignmentTestDocumentDownloadUrl)
  )
  .put(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})',
    asyncErrorHandler(assignmentsController.updateAssignment)
  )
  .put(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})/test',
    asyncErrorHandler(assignmentsController.updateAssignmentTest)
  )
  .put(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})/test/document',
    asyncErrorHandler(assignmentsController.updateAssignmentTestDocument)
  )
  .put(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})/test/reset',
    asyncErrorHandler(assignmentsController.resetAssignmentTest)
  )
  .delete(
    '/:groupId([0-9a-fA-F]{24})/assignments/:assignmentId([0-9a-fA-F]{24})',
    asyncErrorHandler(assignmentsController.deleteAssignment)
  );
