import ApiError from '../helpers/api-error.js';
import { User } from '../models/user.js';
import authService from './auth.service.js';

async function createUser(data) {
  // TODO Validate email
  const { email, role } = data;

  const doesUserExist = await User.exists({ email });
  if (doesUserExist) {
    throw new ApiError(400, 'DUPLICATE_USER_EMAIL', 'A user already exists with given email');
  }

  const { _id: credentialsId, password } = await authService.createCredentials(email, role);

  // TODO Send email with generated password
  console.log('password', password);

  return User.create({ ...data, credentialsId });
}

/**
 * Returns user linked to given credentials.
 * 
 * @param {string} credentialsId Credentials id.
 * 
 * @returns Found user.
 * @throws  A USER_NOT_FOUND error when no user is found.
 */
async function getUserByCredentials(credentialsId) {
  const user = await User.findOne({ credentialsId });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found for given credentials.');
  }
  
  return user;
}

export default {
  createUser,
  getUserByCredentials
};
