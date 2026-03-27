/**
 * Wraps an async route handler so thrown errors are forwarded to Express error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl} →`, err.message);

  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
  });
};
