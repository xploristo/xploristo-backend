import authService from '../services/auth.service.js';

async function login(req, res) {
  const { email, password } = req.body;

  const { sessionToken, sessionTTL, result } = await authService.login(email, password);

  res
    .cookie('xpl_sid', sessionToken, {
      maxAge: sessionTTL * 1000,
      sameSite: 'None',
      secure: true,
      httpOnly: true,
    })
    .status(200)
    .json(result);
}

async function logout(req, res) {
  const jwt = req.cookies['xpl_sid'];

  if (jwt) {
    await authService.clearSessionData(jwt);
  }

  res
    .cookie('xpl_sid', '', {
      expires: new Date(null),
      sameSite: 'None',
      secure: true,
      httpOnly: true,
    })
    .sendStatus(200);
}

async function setPassword(req, res) {
  const { password } = req.body;
  const { userId } = req.jwtUser;

  await authService.setPassword(userId, password);
  
  res.sendStatus(200);
}

export default {
  login,
  logout,
  setPassword,
};
