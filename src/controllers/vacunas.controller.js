const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/vacunas
 * Listar vacunas
 */
async function listar(req, res) {
  try {
    const { mascotaId, casoId, porVencer } = req.query;
    let query = `
      SELECT v.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM vacunas v
      JOIN mascotas mas ON v.mascota_id = mas.id
      JOIN veterinarios vet ON v.veterinario_id = vet.id
    `;
    const params = [];
    let paramCount = 1;

    if (mascotaId) {
      query += ` WHERE v.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }
    if (casoId) {
      query += ` ${mascotaId ? 'AND' : 'WHERE'} v.caso_id = $${paramCount}`;
      params.push(casoId);
      paramCount++;
    }
    if (porVencer) {
      const days = parseInt(porVencer);
      query += ` ${mascotaId || casoId ? 'AND' : 'WHERE'} v.proxima_dosis <= CURRENT_DATE + INTERVAL '${days} days'`;
    }

    query += ' ORDER BY v.proxima_dosis ASC NULLS LAST';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/vacunas
 * Crear vacuna
 */
async function crear(req, res) {
  try {
    const { mascotaId, casoId, nombre, lote, fecha_aplicacion, proxima_dosis, veterinarioId } = req.body;
    const id = genUuid();
    const vetId = veterinarioId || req.user.veterinario_id;

    const result = await pool.query(
      `INSERT INTO vacunas (id, mascota_id, caso_id, nombre, lote, fecha_aplicacion, proxima_dosis, veterinario_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [id, mascotaId, casoId || null, nombre, lote, fecha_aplicacion, proxima_dosis || null, vetId]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/vacunas/:id
 * Eliminar vacuna
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM vacunas WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, crear, eliminar };
