// TODO Make sure bcryptjs is the best option
import bcryptjs from 'bcryptjs';
import passwordGenerator from 'generate-password';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import jwt from 'jsonwebtoken';

import ApiError from '../helpers/api-error.js';
import { Credentials } from '../models/credentials.js';
import redisService from './redis.service.js';
import usersService from './users.service.js';

const uuidNamespace = process.env.UUID_NAMESPACE;

const sessionTTL = process.env.SESSION_TTL;
const jwtOptions = {
  expiresIn: sessionTTL,
  audience: 'xploristo',
  issuer: 'xploristo-backend',
};
const jwtSecret = process.env.JWT_SECRET;


/**
 * Creates credentials for user with given email and role.
 * 
 * @param {string} email The user's email.
 * @param {string} role  The user's role.
 * 
 * @returns The credentials' _id and the generated password.
 */
async function createCredentials(email, role) {
  const generatedPassword = _generatePassword();
  const password = await _hashPassword(generatedPassword);

  const credentials = await Credentials.create({
    email,
    password,
    role
  });

  return { _id: credentials._id, password: generatedPassword };
}

async function setPassword(userId, password) {
  const hashedPassword = await _hashPassword(password);
  console.log('hashedPassword', hashedPassword);
}

async function _hashPassword(password) {
  return bcryptjs.hash(password, 10);
}

/**
 * Generates a random password with 10 characters and at least one number, uppercase
 * letter and lowercase letter.
 * 
 * @returns Generated password.
 */
function _generatePassword() {
  // TODO Longer default passwords? Symbols?
  return passwordGenerator.generate({
    length: 10,
    numbers: true,
    uppercase: true,
    lowercase: true,
    strict: true
  });
}

async function login(email, password) {
  const credentials = await Credentials.findOne({ email });
  if (!credentials) {
    throw new ApiError(400, 'USER_NOT_FOUND', 'No user was found with provided email.');
  }
  
  const didPasswordMatch = await bcryptjs.compare(password, credentials.password);
  if (!didPasswordMatch) {
    throw new ApiError(400, 'WRONG_PASSWORD', 'Wrong password');
  }

  const user = await usersService.getUserByCredentials(credentials._id);
  const sessionData = {
    userId: user._id,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const jti = uuidv5(uuidv4(), uuidNamespace);
  const sessionTokenData = {
    jti,
  };
  const sessionToken = jwt.sign(sessionTokenData, jwtSecret, jwtOptions);
  
  await redisService.createKey(`xploristo-session:${jti}`, JSON.stringify(sessionData), sessionTTL);

  // TODO sessionRefreshToken

  return { sessionToken };
}

export default {
  createCredentials,
  setPassword,
  login,
};
