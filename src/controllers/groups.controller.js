import groupsService from '../services/groups.service.js';

async function getGroup(req, res) {
  const { groupId } = req.params;
  
  const group = await groupsService.getGroup(groupId);

  res.status(201).json(group);
}

async function getGroups(req, res) {
  const { userId } = req.jwtUser;
  
  const groups = await groupsService.getGroups(userId);

  if (!groups || !groups.length) {
    return res.status(204).json(groups);
  }

  res.status(201).json(groups);
}

async function createGroup(req, res) {
  // TODO Validate body (Joi?)
  const { userId } = req.jwtUser;
  
  const group = await groupsService.createGroup(req.body, userId);

  res.status(201).json(group);
}

async function createAssignment(req, res) {
  // TODO Validate body (Joi?)
  const { groupId } = req.params;

  const assignment = await groupsService.createAssignment(groupId, req.body);

  res.status(201).json(assignment);
}

async function getAssignments(req, res) {
  const { groupId } = req.params;
  
  const assignments = await groupsService.getAssignments(groupId);

  if (!assignments || !assignments.length) {
    return res.status(204).json(assignments);
  }

  res.status(201).json(assignments);
}

async function enrollStudents(req, res) {
  // TODO Validate body (Joi?)
  const { groupId } = req.params;

  const group = await groupsService.enrollStudents(groupId, req.body);

  res.status(201).json(group);

}

export default {
  getGroup,
  getGroups,
  createGroup,
  createAssignment,
  getAssignments,
  enrollStudents
};