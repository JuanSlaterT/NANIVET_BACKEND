const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/plantillas
 * Listar plantillas
 */
async function listar(req, res) {
  try {
    const { tipo, categoria } = req.query;
    let query = 'SELECT * FROM plantillas WHERE activo = true';
    const params = [];
    let paramCount = 1;

    if (tipo) {
      query += ` AND tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }
    if (categoria) {
      query += ` AND categoria = $${paramCount}`;
      params.push(categoria);
      paramCount++;
    }

    query += ' ORDER BY categoria, nombre';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/plantillas/:id
 * Obtener plantilla
 */
async function obtener(req, res) {
  try {
    const result = await pool.query('SELECT * FROM plantillas WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Plantilla no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/plantillas
 * Crear plantilla
 */
async function crear(req, res) {
  try {
    const { nombre, tipo, contenido, categoria } = req.body;
    const id = genUuid();

    const result = await pool.query(
      `INSERT INTO plantillas (id, nombre, tipo, contenido, categoria, creado_por, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [id, nombre, tipo, contenido, categoria || null, req.user.nombre]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/plantillas/:id
 * Actualizar plantilla
 */
async function actualizar(req, res) {
  try {
    const { nombre, tipo, contenido, categoria } = req.body;
    const result = await pool.query(
      `UPDATE plantillas SET nombre = COALESCE($1, nombre), tipo = COALESCE($2, tipo),
       contenido = COALESCE($3, contenido), categoria = COALESCE($4, categoria),
       fecha_actualizacion = NOW()
       WHERE id = $5 RETURNING *`,
      [nombre, tipo, contenido, categoria, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Plantilla no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/plantillas/:id
 * Eliminar plantilla
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM plantillas WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
