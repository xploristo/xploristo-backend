import usersService from '../services/users.service.js';

async function createUser(req, res) {
  const user = await usersService.createUser(req.body);

  res.status(201).json(user);
}

async function getUser(req, res) {
  const { userId } = req.params;

  const user = await usersService.getUser(userId);

  res.status(200).json(user);
}

async function updateUser(req, res) {
  const { userId } = req.params;

  const user = await usersService.updateUser(userId, req.body);

  res.status(200).json(user);
}

async function deleteUser(req, res) {
  const { userId } = req.params;
  const { groupId } = req.query;

  await usersService.deleteUser(userId, groupId);

  res.sendStatus(200);
}

async function getUserProfile(req, res) {
  const { userId } = req.jwtUser;

  const userProfile = await usersService.getUserProfile(userId);

  res.status(200).json(userProfile);
}

async function getTeachers(req, res) {
  const { userId } = req.jwtUser;

  const teachers = await usersService.getTeachers(userId);

  if (!teachers || !teachers.length) {
    return res.status(204).json(teachers);
  }

  res.status(200).json(teachers);
}

async function getStudents(req, res) {
  const { userId } = req.jwtUser;

  const students = await usersService.getStudents(userId);

  if (!students || !students.length) {
    return res.status(204).json(students);
  }

  res.status(200).json(students);
}

export default {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserProfile,
  getTeachers,
  getStudents,
};
