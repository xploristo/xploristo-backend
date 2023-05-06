import assignmentsService from '../services/assignments.service.js';
import ApiError from '../helpers/api-error.js';

// TODO Only teachers assigned to the group should be able to CRUD its assignments
const allowedActions = {
  createAssignment: (jwtUser) => ['admin', 'teacher'].includes(jwtUser.role),
  updateAssignment: (jwtUser) => ['admin', 'teacher'].includes(jwtUser.role),
  updateAssignmentTest: (jwtUser) => ['admin', 'teacher'].includes(jwtUser.role),
  updateAssignmentTestDocument: (jwtUser) => ['admin', 'teacher'].includes(jwtUser.role),
  resetAssignmentTest: (jwtUser) => ['admin', 'teacher'].includes(jwtUser.role),
  deleteAssignment: (jwtUser) => ['admin', 'teacher'].includes(jwtUser.role),
};

async function getAssignments(req, res) {
  const { groupId } = req.params;

  const assignments = await assignmentsService.getAssignments(groupId, req.jwtUser);

  if (!assignments || !assignments.length) {
    return res.status(204).json(assignments);
  }

  res.status(200).json(assignments);
}

async function getAssignment(req, res) {
  const assignment = await assignmentsService.getAssignment(req.params.assignmentId, req.jwtUser);

  res.status(200).json(assignment);
}

async function getAssignmentTestDocumentDownloadUrl(req, res) {
  const documentDownloadUrl = await assignmentsService.getAssignmentTestDocumentDownloadUrl(
    req.params.assignmentId,
    req.jwtUser
  );

  res.status(200).json(documentDownloadUrl);
}

async function createAssignment(req, res) {
  if (!allowedActions['createAssignment'](req.jwtUser)) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'You are not allowed to create an assignment for this group.'
    );
  }

  const assignment = await assignmentsService.createAssignment(req.params.groupId, req.body);

  res.status(201).json(assignment);
}

async function updateAssignment(req, res) {
  if (!allowedActions['updateAssignment'](req.jwtUser)) {
    throw new ApiError(403, 'FORBIDDEN', "You are not allowed update this assignment's test.");
  }

  const assignment = await assignmentsService.updateAssignment(req.params.assignmentId, req.body);

  res.status(200).json(assignment);
}

async function updateAssignmentTest(req, res) {
  if (!allowedActions['updateAssignmentTest'](req.jwtUser)) {
    throw new ApiError(403, 'FORBIDDEN', "You are not allowed to update this assignment's test.");
  }

  const assignment = await assignmentsService.updateAssignmentTest(
    req.params.assignmentId,
    req.body
  );

  res.status(200).json(assignment);
}

async function updateAssignmentTestDocument(req, res) {
  if (!allowedActions['updateAssignmentTestDocument'](req.jwtUser)) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      "You are not allowed to update this assignment's test's document."
    );
  }

  const assignment = await assignmentsService.updateAssignmentTestDocument(
    req.params.assignmentId,
    req.body
  );

  res.status(200).json(assignment);
}

async function resetAssignmentTest(req, res) {
  if (!allowedActions['resetAssignmentTest'](req.jwtUser)) {
    throw new ApiError(403, 'FORBIDDEN', "You are not allowed to reset this assignment's test.");
  }

  const assignment = await assignmentsService.resetAssignmentTest(req.params.assignmentId);

  res.status(200).json(assignment);
}

async function deleteAssignment(req, res) {
  if (!allowedActions['deleteAssignment'](req.jwtUser)) {
    throw new ApiError(403, 'FORBIDDEN', 'You are not allowed to delete this assignment.');
  }

  await assignmentsService.deleteAssignment(req.params.assignmentId);

  res.sendStatus(200);
}

export default {
  getAssignments,
  getAssignment,
  getAssignmentTestDocumentDownloadUrl,
  createAssignment,
  updateAssignment,
  updateAssignmentTest,
  updateAssignmentTestDocument,
  resetAssignmentTest,
  deleteAssignment,
};
