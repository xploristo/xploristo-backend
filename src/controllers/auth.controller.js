import authService from '../services/auth.service.js';

async function login(req, res) {
  const { email, password } = req.body;

  const { sessionToken, sessionTTL } = await authService.login(email, password);

  res
    .cookie('xpl_sid', sessionToken, {
      maxAge: sessionTTL * 1000,
      sameSite: 'None',
      secure: true,
      httpOnly: true,
    })
    .sendStatus(200);
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
