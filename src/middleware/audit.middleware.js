const pool = require('../config/pool');
const auditService = require('../services/audit.service');

/**
 * Middleware para loguear automáticamente en auditoría
 * Usa transacción para que INSERT + auditoría usen el MISMO cliente del pool
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
      res.json = async function (data) {
        try {
          // Loguear en auditoría después de la operación
          const newValues = (accion === 'crear' || accion === 'editar') ? req.body : null;

          // Extraer ID de la entidad:优先 usar req.entityId (set por controllers al crear),
          // luego params, luego response data
          const entityId = req.entityId || req.params.id || data.data?.id || null;

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

          // Usar transacción: INSERT + auditoría en el MISMO cliente del pool
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            
            await auditService.log(
              userName,
              userRole,
              accion,
              entidad,
              entityId,
              oldValues,
              newValues,
              diffCampos,
              req.ip,
              req.headers['user-agent'],
              client // pasar el mismo cliente
            );

            await client.query('COMMIT');
          } catch (auditErr) {
            await client.query('ROLLBACK').catch(() => {});
            console.error('Error en auditoría:', auditErr);
          } finally {
            client.release();
          }

          // Restaurar y devolver respuesta original
          res.json = originalJson;
          return res.json(data);
        } catch (innerErr) {
          console.error('Error en middleware response:', innerErr);
          res.json = originalJson;
          return res.json(data);
        }
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { auditMiddleware };
