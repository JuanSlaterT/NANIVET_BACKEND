const pool = require('../config/pool');
const { nowEcuador } = require('../utils/dates');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/casos
 * Listar casos clínicos
 */
async function listar(req, res) {
  try {
    const { mascotaId, estado } = req.query;
    let query = `
      SELECT cc.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM casos_clinicos cc
      JOIN mascotas mas ON cc.mascota_id = mas.id
      JOIN veterinarios v ON cc.veterinario_id = v.id
    `;
    const params = [];
    let paramCount = 1;

    if (mascotaId) {
      query += ` WHERE cc.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }
    if (estado) {
      query += ` ${mascotaId ? 'AND' : 'WHERE'} cc.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    query += ' ORDER BY cc.fecha_hora_inicio DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/casos/:id
 * Obtener caso clínico
 */
async function obtener(req, res) {
  try {
    const result = await pool.query(
      `SELECT cc.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
       FROM casos_clinicos cc
       JOIN mascotas mas ON cc.mascota_id = mas.id
       JOIN veterinarios v ON cc.veterinario_id = v.id
       WHERE cc.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Caso clínico no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/casos
 * Crear caso clínico
 */
async function crear(req, res) {
  try {
    const { mascota_id:mascotaId, motivo, soap, diagnostico, estado, veterinario_id:veterinarioId } = req.body;

    // Verificar que la mascota existe
    const mascotaCheck = await pool.query('SELECT id FROM mascotas WHERE id = $1', [mascotaId]);
    if (mascotaCheck.rows.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Mascota no encontrada' } });
    }

    const id = genUuid();
    req.entityId = id; // Para auditoría
    const vetId = veterinarioId || req.user.veterinario_id;

    const result = await pool.query(
      `INSERT INTO casos_clinicos (id, mascota_id, motivo, soap_subjetivo, soap_objetivo, soap_analisis, soap_plan,
       diagnostico, estado, fecha_hora_inicio, veterinario_id, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), NOW())
       RETURNING *`,
      [id, mascotaId, motivo, soap?.subjetivo || null, soap?.objetivo || null, soap?.analisis || null, soap?.plan || null,
       diagnostico || null, estado || 'abierto', vetId]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/casos/:id
 * Actualizar caso clínico
 */
async function actualizar(req, res) {
  try {
    const { motivo, soap, diagnostico, estado } = req.body;

    const result = await pool.query(
      `UPDATE casos_clinicos SET
       motivo = COALESCE($1, motivo),
       soap_subjetivo = COALESCE($2, soap_subjetivo), soap_objetivo = COALESCE($3, soap_objetivo),
       soap_analisis = COALESCE($4, soap_analisis), soap_plan = COALESCE($5, soap_plan),
       diagnostico = COALESCE($6, diagnostico), estado = COALESCE($7, estado),
       fecha_actualizacion = NOW()
       WHERE id = $8 RETURNING *`,
      [motivo, soap?.subjetivo, soap?.objetivo, soap?.analisis, soap?.plan, diagnostico, estado, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Caso clínico no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/casos/:id
 * Eliminar caso clínico
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM casos_clinicos WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
