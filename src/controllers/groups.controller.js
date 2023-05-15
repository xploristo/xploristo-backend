import groupsService from '../services/groups.service.js';

async function getGroup(req, res) {
  const { groupId } = req.params;

  const group = await groupsService.getGroup(groupId, req.jwtUser);

  res.status(200).json(group);
}

async function getGroups(req, res) {
  const groups = await groupsService.getGroups(req.jwtUser);

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

async function enrollStudents(req, res) {
  // TODO Enroll students via CSV?
  const { groupId } = req.params;
  // TODO Validate body (Joi?)
  const { students } = req.body;

  const group = await groupsService.enrollStudents(groupId, students, req.jwtUser);

  res.status(200).json(group);
}

async function addTeacherToGroup(req, res) {
  const { groupId } = req.params;
  const { teacherEmail } = req.body;

  const group = await groupsService.addTeacherToGroup(groupId, teacherEmail);

  res.status(200).json(group);
}

async function deleteTeacherFromGroup(req, res) {
  const { groupId, teacherId } = req.params;

  const group = await groupsService.deleteTeacherFromGroup(groupId, teacherId);

  res.status(200).json(group);
}

export default {
  getGroup,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  enrollStudents,
  addTeacherToGroup,
  deleteTeacherFromGroup,
};
