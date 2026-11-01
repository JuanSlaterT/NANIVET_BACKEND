const crypto = require('crypto');
const { write } = require('../services/security-events.service');

function requestContext(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  req.requestId = typeof incomingId === 'string' && /^[a-zA-Z0-9._-]{8,100}$/.test(incomingId)
    ? incomingId
    : crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (payload?.error && !payload.error.requestId) {
      payload.error.requestId = req.requestId;
    }
    if (payload?.error) {
      write(res.statusCode >= 500 ? 'error' : 'warn', 'api_error_response', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        errorCode: payload.error.code,
        userId: req.user?.id || null,
        role: req.user?.rol || null,
      });
    }
    return originalJson(payload);
  };

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    write(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http_request', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userId: req.user?.id || null,
      role: req.user?.rol || null,
    });
  });

  next();
}

module.exports = { requestContext };
