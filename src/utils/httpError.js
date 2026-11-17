class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const createHttpError = (status, code, message, details) =>
  new HttpError(status, code, message, details);

module.exports = { HttpError, createHttpError };
