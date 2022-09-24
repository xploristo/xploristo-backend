import usersService from '../services/users.service.js';

async function createUser(req, res) {
  const user = await usersService.createUser(req.body);

  res.status(201).json(user);
}

async function getUserProfile(req, res) {
  const { userId } = req.jwtUser;

  const userProfile = await usersService.getUserProfile(userId);

  res.status(200).json(userProfile);
}

export default {
  createUser,
  getUserProfile,
};
