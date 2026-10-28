const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/cirugias
 * Listar cirugías
 */
async function listar(req, res) {
  try {
    const { mascotaId, casoId } = req.query;
    let query = `
      SELECT c.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM cirugias c
      JOIN mascotas mas ON c.mascota_id = mas.id
      JOIN veterinarios v ON c.veterinario_id = v.id
    `;
    const params = [];
    let paramCount = 1;

    if (mascotaId) {
      query += ` WHERE c.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }
    if (casoId) {
      query += ` ${mascotaId ? 'AND' : 'WHERE'} c.caso_id = $${paramCount}`;
      params.push(casoId);
      paramCount++;
    }

    query += ' ORDER BY c.fecha DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/cirugias
 * Crear cirugía
 */
async function crear(req, res) {
  try {
    const { mascotaId, casoId, tipo, fecha, anestesia, notas, prognosis, veterinarioId } = req.body;
    const id = genUuid();
    req.entityId = id; // Para auditoría
    const vetId = veterinarioId || req.user.veterinario_id;

    const result = await pool.query(
      `INSERT INTO cirugias (id, mascota_id, caso_id, tipo, fecha, veterinario_id, anestesia, notas, prognosis, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [id, mascotaId, casoId || null, tipo, fecha, vetId, anestesia || null, notas || null, prognosis || null]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/cirugias/:id
 * Eliminar cirugía
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM cirugias WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, crear, eliminar };
