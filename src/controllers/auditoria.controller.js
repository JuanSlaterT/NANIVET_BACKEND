const { Pool } = require('pg');
const dbConfig = require('../config/db');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: dbConfig.DB_HOST,
      port: dbConfig.DB_PORT,
      database: dbConfig.DB_NAME,
      user: dbConfig.DB_USER,
      password: dbConfig.DB_PASSWORD,
      min: dbConfig.DB_POOL_MIN,
      max: dbConfig.DB_POOL_MAX
    });
  }
  return pool;
}

/**
 * GET /api/auditoria
 * Listar registros de auditoría
 */
async function listar(req, res) {
  try {
    const { usuario, accion, entidad, desde, hasta, pagina = 1, limit = 20 } = req.query;
    const offset = (pagina - 1) * limit;

    let query = 'SELECT * FROM auditoria';
    const params = [];
    let paramCount = 1;
    const conditions = [];

    if (usuario) {
      conditions.push(`usuario ILIKE $${paramCount}`);
      params.push(`%${usuario}%`);
      paramCount++;
    }
    if (accion) {
      conditions.push(`accion = $${paramCount}`);
      params.push(accion);
      paramCount++;
    }
    if (entidad) {
      conditions.push(`entidad ILIKE $${paramCount}`);
      params.push(`%${entidad}%`);
      paramCount++;
    }
    if (desde) {
      conditions.push(`fecha_hora >= $${paramCount}`);
      params.push(desde);
      paramCount++;
    }
    if (hasta) {
      conditions.push(`fecha_hora <= $${paramCount}`);
      params.push(hasta);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY fecha_hora DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return res.json({ data: result.rows, meta: { pagina: parseInt(pagina), limit: parseInt(limit) } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/auditoria/entidad/:entidad/:entidadId
 * Historial de una entidad
 */
async function historialEntidad(req, res) {
  try {
    const { entidad, entidadId } = req.params;
    const result = await pool.query(
      'SELECT * FROM auditoria WHERE entidad = $1 AND entidad_id = $2 ORDER BY fecha_hora DESC',
      [entidad, entidadId]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, historialEntidad };
