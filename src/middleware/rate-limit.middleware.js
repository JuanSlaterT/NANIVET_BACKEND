const rateLimit = require('express-rate-limit');
const { securityEvent } = require('../services/security-events.service');

function createLimiter({ windowMs, limit, code, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (req, res) => {
      securityEvent(req, 'rate_limit_exceeded', { limiter: code });
      res.status(429).json({ error: { code, message } });
    },
  });
}

const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_GLOBAL || 500),
  code: 'RATE_LIMITED',
  message: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
});

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_LOGIN || 10),
  code: 'LOGIN_RATE_LIMITED',
  message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.',
});

const publicLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PUBLIC || 60),
  code: 'PUBLIC_RATE_LIMITED',
  message: 'Demasiadas solicitudes públicas. Intenta nuevamente más tarde.',
});

const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_AI || 30),
  code: 'AI_RATE_LIMITED',
  message: 'Se alcanzó el límite temporal del asistente de IA.',
});

module.exports = { globalLimiter, loginLimiter, publicLimiter, aiLimiter };
