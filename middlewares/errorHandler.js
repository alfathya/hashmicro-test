const ApiError = require("../helpers/apiError");

function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.url}`, err);

  const status = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
