const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/desparasitaciones
 * Listar desparasitaciones
 */
async function listar(req, res) {
  try {
    const { mascotaId, casoId } = req.query;
    let query = `
      SELECT d.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM desparasitaciones d
      JOIN mascotas mas ON d.mascota_id = mas.id
      JOIN veterinarios v ON d.veterinario_id = v.id
    `;
    const params = [];
    let paramCount = 1;

    if (mascotaId) {
      query += ` WHERE d.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }
    if (casoId) {
      query += ` ${mascotaId ? 'AND' : 'WHERE'} d.caso_id = $${paramCount}`;
      params.push(casoId);
      paramCount++;
    }

    query += ' ORDER BY d.fecha DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/desparasitaciones
 * Crear desparasitación
 */
async function crear(req, res) {
  try {
    const { mascotaId, casoId, producto, dosis, fecha, proxima_dosis, veterinarioId } = req.body;
    const id = genUuid();
    req.entityId = id; // Para auditoría
    const vetId = veterinarioId || req.user.veterinario_id;

    const result = await pool.query(
      `INSERT INTO desparasitaciones (id, mascota_id, caso_id, producto, dosis, fecha, proxima_dosis, veterinario_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [id, mascotaId, casoId || null, producto, dosis, fecha, proxima_dosis || null, vetId]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/desparasitaciones/:id
 * Eliminar desparasitación
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM desparasitaciones WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, crear, eliminar };
