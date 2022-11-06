/**
 * Parses a string to its boolean value.
 *
 * @param {string} stringValue          The string value.
 * @param {*}      [defaultValue=false] The default value to return if cast fails.
 *
 * @returns True if stringValue is 'true', false if stringValue is 'false', defaultValue otherwise.
 */
function parseStringToBoolean(stringValue, defaultValue = false) {
  let booleanValue;
  try {
    booleanValue = JSON.parse(stringValue);
  } catch (err) {
    booleanValue = defaultValue;
  }
  return booleanValue;
}

export { parseStringToBoolean };
