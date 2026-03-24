export function publicApiError(res, status, code, message, details) {
  res.locals.publicApiErrorCode = code;
  return res.status(status).json({
    error: {
      code,
      message,
      details: details ?? null,
    },
  });
}
