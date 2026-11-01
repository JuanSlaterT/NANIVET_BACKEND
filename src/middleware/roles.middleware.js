/**
 * Middleware para verificar permisos por rol
 * @param {string|string[]} allowedRoles - Roles permitidos
 */
function rolesMiddleware(allowedRoles) {
  const { securityEvent } = require('../services/security-events.service');
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      securityEvent(req, 'authorization_failed', { reason: 'missing_role' });
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'No tiene permisos para acceder a este recurso'
        }
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      securityEvent(req, 'authorization_failed', { reason: 'role_denied', allowedRoles });
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'No tiene permisos para acceder a este recurso'
        }
      });
    }

    next();
  };
}

module.exports = { rolesMiddleware };
