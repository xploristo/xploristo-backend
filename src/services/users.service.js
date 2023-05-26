import { ObjectId } from 'mongodb';

import ApiError from '../helpers/api-error.js';
import { validateEmail } from '../helpers/validators.js';
import { User } from '../models/user.js';
import authService from './auth.service.js';
import mailService from './mail.service.js';
import groupsService from './groups.service.js';

import adminPermissions from '../config/front-permissions/admin.json' assert { type: 'json' };
import studentPermissions from '../config/front-permissions/student.json' assert { type: 'json' };
import teacherPermissions from '../config/front-permissions/teacher.json' assert { type: 'json' };

const permissions = {
  admin: adminPermissions,
  student: studentPermissions,
  teacher: teacherPermissions,
};

async function createUser(data) {
  const { email, role, password, groupIds } = data;

  await _checkUserEmail(email);

  const { _id: credentialsId, password: generatedPassword } = await authService.createCredentials(
    email,
    role,
    password
  );

  if (!password) {
    try {
      await mailService.sendPasswordEmail(email, {
        password: generatedPassword,
        role,
        groupId: groupIds ? groupIds[0] : null,
      });
    } catch (error) {
      // Delete created credentials, as user will no longer be created
      await authService.deleteCredentials(credentialsId);

      throw new ApiError(500, 'EMAIL_NOT_SENT', error.message);
    }
  }

  return await User.create({ ...data, credentialsId });
}

async function getUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }

  return user;
}

async function updateUser(userId, data) {
  const user = await User.findById(userId);

  if (data.email && data.email !== user.email) {
    await _checkUserEmail(data.email);

    await authService.updateCredentialsEmail(user.credentialsId, data.email);
  }

  return User.findOneAndUpdate({ _id: userId }, data, { new: true, runValidators: true });
}

async function _checkUserEmail(email) {
  validateEmail(email);

  const doesUserExist = await User.exists({ email });
  if (doesUserExist) {
    throw new ApiError(400, 'DUPLICATE_USER_EMAIL', 'A user already exists with given email.');
  }
}

async function updateUserRole(userId, role) {
  if (!['teacher', 'admin'].includes(role)) {
    throw new ApiError(400, 'WRONG_ROLE', 'Wrong role.');
  }

  const user = await User.findOneAndUpdate({ _id: userId }, { role }, { new: true });
  const { credentialsId } = user;

  await authService.updateCredentialsRole(credentialsId, role);

  return user;
}

async function deleteUser(userId, groupId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', `User not found for id ${userId}.`);
  }

  if (user.role === 'student') {
    if (!groupId) {
      throw new ApiError(400, 'MISSING_GROUP_ID', "User's group id was not provided.");
    }

    if (!user.groupIds.includes(groupId)) {
      throw new ApiError(400, 'WRONG_GROUP', 'User does not belong to given group.');
    }

    if (user.groupIds.length > 1) {
      // TODO Teachers?
      await User.updateOne({ _id: userId }, { $pull: { groupIds: ObjectId(groupId) } });
      await groupsService.removeUserFromGroups(userId);
      return;
    }
  }

  await User.deleteOne({ _id: userId });
  await groupsService.removeUserFromGroups(userId);
  await authService.deleteCredentials(user.credentialsId);
}

async function enrollStudent(groupId, studentData) {
  const { email, ...student } = studentData;

  const user = await User.findOne({ email });

  if (!user) {
    return await createUser({ ...studentData, groupIds: [ObjectId(groupId)] });
  }

  return await User.findOneAndUpdate(
    { email },
    {
      ...student,
      role: 'student',
      $addToSet: { groupIds: ObjectId(groupId) },
    }
  );
}

async function removeStudentsFromGroup(groupId) {
  return await User.updateMany(
    { groupIds: ObjectId(groupId) },
    {
      $pull: { groupIds: ObjectId(groupId) },
    }
  );
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
 * Returns user with given email and role.
 *
 * @param {string} email The email.
 * @param {string} role  The role.
 *
 * @returns Found user.
 * @throws  A USER_NOT_FOUND error when no user is found.
 */
async function getUserByEmail(email, role = 'student') {
  const user = await User.findOne({ email, role });
  if (!user) {
    throw new ApiError(
      404,
      `USER_NOT_FOUND`,
      `User not found with email ${email} and role '${role}'.`
    );
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

async function getTeachers(shouldGetAdmins = false) {
  const query = shouldGetAdmins ? { role: { $in: ['teacher', 'admin'] } } : { role: 'teacher' };

  const teachers = await User.find(query);
  return teachers;
}

async function getStudents(userId) {
  const students = await User.find({ role: 'student', _id: { $ne: userId } });
  return students;
}

export default {
  createUser,
  getUser,
  updateUser,
  updateUserRole,
  deleteUser,
  enrollStudent,
  removeStudentsFromGroup,
  getUserByCredentials,
  getUserByEmail,
  getUserProfile,
  getTeachers,
  getStudents,
};
