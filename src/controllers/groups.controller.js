import groupsService from '../services/groups.service.js';

async function getGroup(req, res) {
  const { groupId } = req.params;

  const group = await groupsService.getGroup(groupId, req.jwtUser);

  res.status(200).json(group);
}

async function getGroups(req, res) {
  const { userId } = req.jwtUser;

  const groups = await groupsService.getGroups(userId);

  if (!groups || !groups.length) {
    return res.status(204).json(groups);
  }

  res.status(200).json(groups);
}

async function createGroup(req, res) {
  // TODO Validate body (Joi?)
  const { userId } = req.jwtUser;

  const group = await groupsService.createGroup(req.body, userId);

  res.status(201).json(group);
}

async function updateGroup(req, res) {
  // TODO Validate body (Joi?)
  const { groupId } = req.params;

  const group = await groupsService.updateGroup(groupId, req.body);

  res.status(200).json(group);
}

async function deleteGroup(req, res) {
  const { groupId } = req.params;

  await groupsService.deleteGroup(groupId);

  res.sendStatus(200);
}

async function createAssignment(req, res) {
  // TODO Validate body (Joi?)
  const { groupId } = req.params;

  const assignment = await groupsService.createAssignment(groupId, req.body);

  res.status(201).json(assignment);
}

async function updateAssignment(req, res) {
  // TODO Validate body (Joi?)
  const { assignmentId } = req.params;

  const assignment = await groupsService.updateAssignment(assignmentId, req.body);

  res.status(200).json(assignment);
}

async function deleteAssignment(req, res) {
  const { assignmentId } = req.params;

  await groupsService.deleteAssignment(assignmentId);

  res.sendStatus(200);
}

async function getAssignments(req, res) {
  const { groupId } = req.params;

  const assignments = await groupsService.getAssignments(groupId, req.jwtUser);

  if (!assignments || !assignments.length) {
    return res.status(204).json(assignments);
  }

  res.status(200).json(assignments);
}

async function getAssignment(req, res) {
  const { assignmentId } = req.params;

  const assignment = await groupsService.getAssignment(assignmentId, req.jwtUser);

  res.status(200).json(assignment);
}

async function enrollStudents(req, res) {
  // TODO Validate body (Joi?)
  const { groupId } = req.params;

  const group = await groupsService.enrollStudents(groupId, req.body);

  res.status(200).json(group);
}

export default {
  getGroup,
  getGroups,
  createGroup,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  deleteGroup,
  getAssignments,
  getAssignment,
  enrollStudents,
  updateGroup,
};
