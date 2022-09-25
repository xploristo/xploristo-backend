import ApiError from '../helpers/api-error.js';
import { User } from '../models/user.js';
import authService from './auth.service.js';

import studentPermissions from '../config/front-permissions/student.json' assert { type: 'json' };
import teacherPermissions from '../config/front-permissions/teacher.json' assert { type: 'json' };

const permissions = {
  student: studentPermissions,
  teacher: teacherPermissions
};

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

/**
 * Returns given user's profile.
 * 
 * @param {string} userId The user's id.
 */
async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }

  return {
    userId,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    permissions: permissions[user.role],
  };
}

export default {
  createUser,
  getUserByCredentials,
  getUserProfile,
};
