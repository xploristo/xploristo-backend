import assignmentsService from '../services/assignments.service.js';
import ApiError from '../helpers/api-error.js';

function checkUserRole(jwtUser) {
  if (!jwtUser.role === 'student') {
    throw new ApiError(403, 'FORBIDDEN', `You are not allowed to perform this action.`);
  }
}

async function createAssignment(req, res) {
  checkUserRole(req.jwtUser);

  // TODO Validate body (Joi?)
  const { groupId } = req.params;

  const assignment = await assignmentsService.createAssignment(groupId, req.body);

  res.status(201).json(assignment);
}

async function updateAssignment(req, res) {
  checkUserRole(req.jwtUser);

  // TODO Validate body (Joi?)
  const { assignmentId } = req.params;

  const assignment = await assignmentsService.updateAssignment(assignmentId, req.body);

  res.status(200).json(assignment);
}

async function deleteAssignment(req, res) {
  checkUserRole(req.jwtUser);

  const { assignmentId } = req.params;

  await assignmentsService.deleteAssignment(assignmentId);

  res.sendStatus(200);
}

async function getAssignments(req, res) {
  const { groupId } = req.params;

  const assignments = await assignmentsService.getAssignments(groupId, req.jwtUser);

  if (!assignments || !assignments.length) {
    return res.status(204).json(assignments);
  }

  res.status(200).json(assignments);
}

async function getAssignment(req, res) {
  const { assignmentId } = req.params;

  const assignment = await assignmentsService.getAssignment(assignmentId, req.jwtUser);

  res.status(200).json(assignment);
}

export default {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  getAssignment,
};
