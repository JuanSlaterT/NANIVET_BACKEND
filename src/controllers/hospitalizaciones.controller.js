const pool = require('../config/pool');
const { nowEcuador } = require('../utils/dates');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/hospitalizaciones
 * Listar hospitalizaciones
 */
async function listar(req, res) {
  try {
    const { estado, mascotaId } = req.query;
    let query = `
      SELECT h.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM hospitalizaciones h
      JOIN mascotas mas ON h.mascota_id = mas.id
      JOIN veterinarios v ON h.veterinario_id = v.id
    `;
    const params = [];
    let paramCount = 1;

    if (estado) {
      query += ` WHERE h.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }
    if (mascotaId) {
      query += ` ${estado ? 'AND' : 'WHERE'} h.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }

    query += ' ORDER BY h.fecha_ingreso DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/hospitalizaciones/:id
 * Obtener hospitalización con medicaciones y evoluciones
 */
async function obtener(req, res) {
  try {
    const result = await pool.query(
      `SELECT h.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
       FROM hospitalizaciones h
       JOIN mascotas mas ON h.mascota_id = mas.id
       JOIN veterinarios v ON h.veterinario_id = v.id
       WHERE h.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hospitalización no encontrada' } });
    }

    // Obtener medicaciones
    const medicaciones = await pool.query(
      'SELECT * FROM medicaciones_hospitalizacion WHERE hospitalizacion_id = $1',
      [req.params.id]
    );

    // Obtener evoluciones
    const evoluciones = await pool.query(
      'SELECT ev.*, v.nombre AS veterinario_nombre FROM evoluciones_hospitalizacion ev LEFT JOIN veterinarios v ON ev.veterinario_id = v.id WHERE ev.hospitalizacion_id = $1 ORDER BY ev.fecha',
      [req.params.id]
    );

    return res.json({
      data: {
        ...result.rows[0],
        medicaciones: medicaciones.rows,
        evoluciones: evoluciones.rows
      }
    });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/hospitalizaciones
 * Crear hospitalización
 */
async function crear(req, res) {
  try {
    const { mascotaId, casoId, veterinarioId, citaId, fecha_ingreso, jaula_area, motivo } = req.body;
    const id = genUuid();
    req.entityId = id; // Para auditoría
    const vetId = veterinarioId || req.user.veterinario_id;

    const result = await pool.query(
      `INSERT INTO hospitalizaciones (id, mascota_id, caso_id, veterinario_id, cita_id, fecha_ingreso, jaula_area, motivo, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'hospitalizado', NOW())
       RETURNING *`,
      [id, mascotaId, casoId || null, vetId, citaId || null, fecha_ingreso, jaula_area, motivo]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/hospitalizaciones/:id/alta
 * Dar alta
 */
async function darAlta(req, res) {
  try {
    const { resumen_alta, indicaciones_alta } = req.body;
    const ahora = nowEcuador().toJSDate();

    const result = await pool.query(
      `UPDATE hospitalizaciones SET estado = 'alta', fecha_alta = $1, resumen_alta = $2, indicaciones_alta = $3
       WHERE id = $4 RETURNING *`,
      [ahora, resumen_alta || null, indicaciones_alta || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hospitalización no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/hospitalizaciones/:id
 * Actualizar hospitalización
 */
async function actualizar(req, res) {
  try {
    const { jaula_area, motivo, resumen_alta, indicaciones_alta } = req.body;
    const result = await pool.query(
      `UPDATE hospitalizaciones SET
       jaula_area = COALESCE($1, jaula_area), motivo = COALESCE($2, motivo),
       resumen_alta = COALESCE($3, resumen_alta), indicaciones_alta = COALESCE($4, indicaciones_alta)
       WHERE id = $5 RETURNING *`,
      [jaula_area, motivo, resumen_alta, indicaciones_alta, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hospitalización no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, crear, darAlta, actualizar };
