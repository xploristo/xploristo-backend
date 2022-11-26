import ApiError from './api-error.js';

const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

/**
 * Checks whether provided value is a valid email address.
 *
 * @param {string} value Value to check.
 *
 * @returns True if value is a valid email address, false otherwise.
 */
function _isValidEmail(value) {
  return value && emailRegex.test(value);
}

/**
 * Validates provided value is a valid email address.
 *
 * @param {string} value Value to validate.
 *
 * @throws  An error if value is not a valid email address.
 */
function validateEmail(value) {
  if (!_isValidEmail(value)) {
    throw new ApiError(400, 'INVALID_EMAIL', `'${value}' is not a valid email address.`);
  }
}

export { validateEmail };
