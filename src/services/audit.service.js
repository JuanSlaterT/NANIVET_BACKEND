const pool = require('../config/pool');
const { nowEcuador } = require('../utils/dates');

/**
 * Loguea una acción en la tabla auditoria
 */
async function log(usuario, rol, accion, entidad, entidadId, valoresAnteriores, valoresNuevos, diffCampos, ipAddress, userAgent) {
  const id = `aud_${Date.now().toString(36)}`;

  await pool.query(
    `INSERT INTO auditoria (id, usuario, rol, fecha_hora, accion, entidad, entidad_id, 
     valores_anteriores, valores_nuevos, diff_campos, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      usuario,
      rol,
      nowEcuador().toJSDate(),
      accion,
      entidad,
      entidadId,
      valoresAnteriores ? JSON.stringify(valoresAnteriores) : null,
      valoresNuevos ? JSON.stringify(valoresNuevos) : null,
      diffCampos ? JSON.stringify(diffCampos) : null,
      ipAddress || null,
      userAgent || null
    ]
  );
}

// Alias para compatibilidad con otros controllers
log.logAudit = log;

module.exports = { log, logAudit: log };
