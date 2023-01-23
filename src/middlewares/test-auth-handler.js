import authService from '../services/auth.service.js';

export default function (req, res, next) {
  if (req.path === '/auth') {
    return next();
  }

  let jwt = req.cookies['xpl_sid'];
  if (jwt) {
    authService
      .verifyToken(jwt)
      .then((jwtUser) => {
        req.jwtUser = jwtUser;
        return next();
      })
      .catch((error) => next(error));
  } else {
    req.jwtUser = (req.headers['jwt-user'] && JSON.parse(req.headers['jwt-user'])) || {
      userId: 'test-user-id',
      role: 'admin',
      email: 'test_user_email@xploristo.org',
      firstName: 'Test',
      lastName: 'User',
    };
    return next();
  }
}
