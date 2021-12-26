import authService from '../services/auth.service.js';

function login(req, res) {
  // TODO
  authService.login();
  res.send('Work In Progress!');
};

export default {
  login,
};
