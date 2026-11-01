function write(level, event, context = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  const output = JSON.stringify(payload);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

function securityEvent(req, event, context = {}, level = 'warn') {
  write(level, event, {
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl?.split('?')[0],
    ip: req?.ip,
    userId: req?.user?.id || null,
    role: req?.user?.rol || null,
    userAgent: req?.headers?.['user-agent'],
    ...context,
  });
}

function errorEvent(req, event, error, context = {}) {
  securityEvent(req, event, {
    errorName: error?.name,
    errorMessage: error?.message,
    errorCode: error?.code,
    ...context,
  }, 'error');
}

module.exports = { write, securityEvent, errorEvent };
