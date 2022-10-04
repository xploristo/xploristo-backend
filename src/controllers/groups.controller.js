import groupsService from '../services/groups.service.js';

async function createGroup(req, res) {
  // TODO Validate body (Joi?)
  const { userId } = req.jwtUser;
  
  const group = await groupsService.createGroup(req.body, userId);

  res.status(201).json(group);
}

export default {
  createGroup
};
