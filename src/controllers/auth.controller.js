import authService from '../services/auth.service.js';


async function login(req, res) {
  const { email, password } = req.body;

  const { sessionToken, sessionTTL } = await authService.login(email, password);

  // TODO Should I use HttpOnly and find other way of knowing whether the user still has a session in frontend?
  res.setHeader('Set-Cookie', `xpl_sid=${sessionToken}; max-age=${sessionTTL}; Path=/; SameSite=Strict; Secure`).sendStatus(200);
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
