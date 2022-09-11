export default class ApiError extends Error {
  constructor(status = 500, errorCode, message, payload) {
    super();

    this.status = status;
    this.errorCode = errorCode;
    this.message = message;
    this.payload = payload;
    Error.captureStackTrace(this, ApiError);
  }
}
