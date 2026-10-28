const pool = require('../config/pool');
const { nowEcuador } = require('../utils/dates');
const { genUuid } = require('../utils/genUuid');

/**
 * Loguea una acción en la tabla auditoria dentro de una transacción.
 * Si se recibe un client (desde transacción), lo usa; si no, usa pool.query.
 */
async function log(usuario, rol, accion, entidad, entidadId, valoresAnteriores, valoresNuevos, diffCampos, ipAddress, userAgent, client = null) {
  const id = genUuid();

  const query = `INSERT INTO auditoria (id, usuario, rol, fecha_hora, accion, entidad, entidad_id, 
     valores_anteriores, valores_nuevos, diff_campos, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
  
  const params = [
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
  ];

  if (client) {
    await client.query(query, params);
  } else {
    await pool.query(query, params);
  }
}

// Alias para compatibilidad con otros controllers
log.logAudit = log;

module.exports = { log, logAudit: log };
