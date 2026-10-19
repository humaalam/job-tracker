// An error that carries an HTTP status. Services throw it; errorHandler
// turns it into { error: { message, details? } } with that status.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
