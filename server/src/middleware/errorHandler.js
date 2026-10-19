// Express treats a middleware with 4 parameters as the error handler.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) {
    console.error(err);
  }

  // Never leak internal error details to the client on a 500.
  const body = {
    error: { message: status >= 500 ? 'Internal server error' : err.message },
  };
  if (err.details) {
    body.error.details = err.details;
  }
  res.status(status).json(body);
}
