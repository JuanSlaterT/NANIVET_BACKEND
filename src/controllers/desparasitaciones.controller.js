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

/** GET /api/desparasitaciones/:id */
async function obtener(req, res) {
  try {
    const result = await pool.query(
      `SELECT d.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
       FROM desparasitaciones d
       JOIN mascotas mas ON d.mascota_id = mas.id
       JOIN veterinarios v ON d.veterinario_id = v.id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Desparasitación no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
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
    const { mascota_id:mascotaId, caso_id:casoId, producto, dosis, fecha, proxima_dosis, veterinario_id:veterinarioId } = req.body;
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

/** PUT /api/desparasitaciones/:id */
async function actualizar(req, res) {
  try {
    const fields = [];
    const values = [];
    const mapping = {
      mascota_id: 'mascota_id',
      caso_id: 'caso_id',
      producto: 'producto',
      dosis: 'dosis',
      fecha: 'fecha',
      proxima_dosis: 'proxima_dosis',
      veterinario_id: 'veterinario_id',
    };
    for (const [bodyField, dbField] of Object.entries(mapping)) {
      if (req.body[bodyField] !== undefined) {
        const nullable = bodyField === 'caso_id' || bodyField === 'proxima_dosis';
        values.push(nullable && !req.body[bodyField] ? null : req.body[bodyField]);
        fields.push(`${dbField} = $${values.length}`);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No hay campos para actualizar' } });
    }
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE desparasitaciones SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Desparasitación no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
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

module.exports = { listar, obtener, crear, actualizar, eliminar };
