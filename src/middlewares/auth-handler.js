import ApiError from '../helpers/api-error.js';
import authService from '../services/auth.service.js';

export default function (req, res, next) {
  if (req.path === '/auth') {
    return next();
  }

  let jwt = req.cookies['xpl_sid'];
  if (!jwt) {
    throw new ApiError(401, 'UNAUTHORIZED', 'No session cookie.');
  }

  authService
    .verifyToken(jwt)
    .then((jwtUser) => {
      req.jwtUser = jwtUser;
      return next();
    })
    .catch((error) => next(error));
}
