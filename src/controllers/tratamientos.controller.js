const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/tratamientos
 * Listar tratamientos
 */
async function listar(req, res) {
  try {
    const { mascotaId, casoId } = req.query;
    const db = pool;
    let query = `
      SELECT t.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
      FROM tratamientos t
      JOIN mascotas mas ON t.mascota_id = mas.id
      JOIN veterinarios v ON t.veterinario_id = v.id
    `;
    const params = [];
    let paramCount = 1;

    if (mascotaId) {
      query += ` WHERE t.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }
    if (casoId) {
      query += ` ${mascotaId ? 'AND' : 'WHERE'} t.caso_id = $${paramCount}`;
      params.push(casoId);
      paramCount++;
    }

    query += ' ORDER BY t.fecha DESC';
    const result = await db.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/tratamientos
 * Crear tratamiento
 */
async function crear(req, res) {
  try {
    const { mascotaId, casoId, nombre, dosis, duracion, fecha, veterinarioId } = req.body;
    const id = genUuid();
    const vetId = veterinarioId || req.user.veterinario_id;
    const db = pool;

    const result = await db.query(
      `INSERT INTO tratamientos (id, mascota_id, caso_id, nombre, dosis, duracion, fecha, veterinario_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [id, mascotaId, casoId || null, nombre, dosis, duracion || null, fecha, vetId]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/tratamientos/:id
 * Actualizar tratamiento
 */
async function actualizar(req, res) {
  try {
    const { mascotaId, casoId, nombre, dosis, duracion, fecha, veterinarioId } = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (mascotaId) { fields.push(`mascota_id = $${paramCount}`); values.push(mascotaId); paramCount++; }
    if (casoId !== undefined) { fields.push(`caso_id = $${paramCount}`); values.push(casoId || null); paramCount++; }
    if (nombre) { fields.push(`nombre = $${paramCount}`); values.push(nombre); paramCount++; }
    if (dosis) { fields.push(`dosis = $${paramCount}`); values.push(dosis); paramCount++; }
    if (duracion !== undefined) { fields.push(`duracion = $${paramCount}`); values.push(duracion); paramCount++; }
    if (fecha) { fields.push(`fecha = $${paramCount}`); values.push(fecha); paramCount++; }
    if (veterinarioId) { fields.push(`veterinario_id = $${paramCount}`); values.push(veterinarioId); paramCount++; }

    if (fields.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No hay campos para actualizar' } });
    }

    fields.push(`fecha_actualizacion = NOW()`);
    const query = `UPDATE tratamientos SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(req.params.id);
    const db = pool;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tratamiento no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/tratamientos/:id
 * Eliminar tratamiento
 */
async function eliminar(req, res) {
  try {
    const db = pool;
    await db.query('DELETE FROM tratamientos WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, crear, actualizar, eliminar };
