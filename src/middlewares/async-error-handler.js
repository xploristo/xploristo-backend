/**
 * This function must be used inside route handlers so errors thrown within asynchronous
 * functions are passed to the next() function for Express to handle them.
 * See https://expressjs.com/en/guide/error-handling.html.
 * 
 * @param {function} fn The asynchronous function.
 */
export default function (fn) {
  return function (req, res, next) {
    return fn(req, res, next).catch(next);
  };
}
