import usersService from '../services/users.service.js';

async function createUser(req, res) {
  const user = await usersService.createUser(req.body);

  res.status(201).json(user);
}

export default {
  createUser
};
