const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { accessTokenFrom, refreshTokenFrom } = require('../utils/auth-cookies');
const { securityEvent } = require('../services/security-events.service');
dotenv.config();

/**
 * Middleware para verificar token JWT
 */
function authMiddleware(req, res, next) {
  const token = accessTokenFrom(req);

  if (!token) {
    securityEvent(req, 'authentication_missing');
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No proporcionado token de autenticación'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    securityEvent(req, 'authentication_failed', { reason: err.name });
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expirado. Use un refresh token.'
        }
      });
    }
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido'
      }
    });
  }
}

/**
 * Middleware para verificar refresh token
 */
function refreshAuthMiddleware(req, res, next) {
  const token = refreshTokenFrom(req);

  if (!token) {
    securityEvent(req, 'refresh_token_missing');
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No proporcionado token de refresh'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    securityEvent(req, 'refresh_token_invalid', { reason: err.name });
    return res.status(401).json({
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token inválido o expirado'
      }
    });
  }
}

/**
 * Middleware opcional para autenticación (para endpoints mixtos público/autenticado)
 */
function optionalAuth(req, res, next) {
  const token = accessTokenFrom(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token inválido, continuar sin usuario
    }
  }
  next();
}

module.exports = { authMiddleware, refreshAuthMiddleware, optionalAuth };
