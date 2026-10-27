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
 * GET /api/examenes
 * Listar exámenes adjuntos
 */
async function listar(req, res) {
  try {
    const { mascotaId, casoId } = req.query;
    let query = `
      SELECT e.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM examenes_adjuntos e
      JOIN mascotas mas ON e.mascota_id = mas.id
      LEFT JOIN veterinarios v ON e.veterinario_id = v.id
    `;
    const params = [];
    let paramCount = 1;

    if (mascotaId) {
      query += ` WHERE e.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }
    if (casoId) {
      query += ` ${mascotaId ? 'AND' : 'WHERE'} e.caso_id = $${paramCount}`;
      params.push(casoId);
      paramCount++;
    }

    query += ' ORDER BY e.fecha DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/examenes
 * Crear examen adjunto
 */
async function crear(req, res) {
  try {
    const { mascotaId, casoId, tipo, titulo, descripcion, fecha, archivo_url, veterinarioId } = req.body;
    const id = `exa_${Date.now().toString().slice(-6)}`;

    const result = await pool.query(
      `INSERT INTO examenes_adjuntos (id, mascota_id, caso_id, tipo, titulo, descripcion, fecha, archivo_url, veterinario_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [id, mascotaId, casoId || null, tipo, titulo || null, descripcion || null, fecha, archivo_url || null, veterinarioId || null]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/examenes/:id
 * Eliminar examen
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM examenes_adjuntos WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, crear, eliminar };
