/**
 * This function is used to override default Express error handler.
 */
export default function (err, req, res, next) {
  if (res.headersSent) {
    // If headers were already sent, delegate to default Express error handler
    return next(err);
  }
  let { status, errorCode = 'UNKNOWN_ERROR', message = 'Unknown error', payload } = err;
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    status = 500;
  }

  console.error(`🔴 ERROR with status ${status}: ${errorCode} ${message}`);
  if (status === 500) {
    console.error(err.stack);
  }
  res.status(status).json({ status, errorCode, message, payload });
}
