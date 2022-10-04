import groupsService from '../services/groups.service.js';

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

export default {
  createGroup,
  createAssignment,
};
