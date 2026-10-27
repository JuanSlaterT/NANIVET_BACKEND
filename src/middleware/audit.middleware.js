const auditService = require('../services/audit.service');

/**
 * Middleware para loguear automáticamente en auditoría
 * @param {string} entidad - Nombre de la entidad
 * @param {string} accion - Tipo de acción (crear, editar, eliminar)
 */
function auditMiddleware(entidad, accion) {
  return async (req, res, next) => {
    try {
      // Capturar valores antes de la operación (para PUT/DELETE)
      const oldValues = (req.method === 'PUT' || req.method === 'DELETE') ? req.body : null;

      // Ejecutar la ruta y capturar la respuesta
      const originalJson = res.json;
      res.json = function (data) {
        // Loguear en auditoría después de la operación
        const newValues = (accion === 'crear' || accion === 'editar') ? req.body : null;

        // Extraer ID de la entidad de params o response
        const entityId = req.params.id || data.data?.id || null;

        // Calcular diff de campos
        let diffCampos = null;
        if (oldValues && newValues) {
          diffCampos = Object.keys(newValues)
            .filter(key => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]))
            .map(key => ({
              campo: key,
              antes: oldValues[key],
              despues: newValues[key]
            }));
          if (diffCampos.length === 0) diffCampos = null;
        }

        const userId = req.user?.id || 'anonymous';
        const userName = req.user?.nombre || 'Sistema';
        const userRole = req.user?.rol || 'sistema';

        auditService.log(
          userName,
          userRole,
          accion,
          entidad,
          entityId,
          oldValues,
          newValues,
          diffCampos,
          req.ip,
          req.headers['user-agent']
        ).catch(err => console.error('Error en auditoría:', err));

        // Restaurar y devolver respuesta original
        res.json = originalJson;
        return res.json(data);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { auditMiddleware };
