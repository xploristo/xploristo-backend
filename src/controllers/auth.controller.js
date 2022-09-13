import authService from '../services/auth.service.js';

async function login(req, res) {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json(result);
}

async function setPassword(req, res) {
  const { password } = req.body;

  await authService.setPassword(null, password);
  
  res.sendStatus(200);
}

export default {
  login,
  setPassword,
};
