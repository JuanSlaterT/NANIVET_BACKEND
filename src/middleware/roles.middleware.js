/**
 * Middleware para verificar permisos por rol
 * @param {string|string[]} allowedRoles - Roles permitidos
 */
function rolesMiddleware(allowedRoles) {
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'No tiene permisos para acceder a este recurso'
        }
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Rol '${req.user.rol}' no autorizado. Se requieren: ${allowedRoles.join(', ')}`
        }
      });
    }

    next();
  };
}

module.exports = { rolesMiddleware };
