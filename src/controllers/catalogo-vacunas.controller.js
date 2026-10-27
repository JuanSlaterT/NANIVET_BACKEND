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
 * GET /api/catalogo/vacunas
 * Listar todas las vacunas del catálogo
 */
async function listar(req, res) {
  try {
    const { activas } = req.query;
    let query = 'SELECT * FROM catalogo_vacunas';
    const params = [];

    if (activas === 'true') {
      query += ' WHERE activa = $1';
      params.push(true);
    }

    query += ' ORDER BY especie, nombre';

    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('Error al listar catálogo de vacunas:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/catalogo/vacunas/:id
 * Obtener una vacuna del catálogo por ID
 */
async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM catalogo_vacunas WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vacuna del catálogo no encontrada' } });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error al obtener vacuna del catálogo:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/catalogo/vacunas
 * Crear nueva vacuna en el catálogo
 */
async function crear(req, res) {
  try {
    const { nombre, intervaloDias, especie, activa } = req.body;
    const id = `cv_${Date.now().toString().slice(-6)}`;

    // Validaciones
    if (!nombre || !intervaloDias) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'nombre y intervaloDias son requeridos' }
      });
    }

    if (intervaloDias <= 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'intervaloDias debe ser mayor a 0' }
      });
    }

    const especieValida = ['all', 'Perro', 'Gato', 'Conejo', 'Ave'];
    if (!especieValida.includes(especie || 'all')) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'especie debe ser: all, Perro, Gato, Conejo o Ave' }
      });
    }

    const result = await pool.query(
      `INSERT INTO catalogo_vacunas (id, nombre, intervalo_dias, especie, activa)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, nombre, intervaloDias, especie || 'all', activa !== false]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        error: { code: 'DUPLICATE_ERROR', message: 'Ya existe una vacuna con ese nombre' }
      });
    }
    console.error('Error al crear vacuna del catálogo:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/catalogo/vacunas/:id
 * Actualizar vacuna del catálogo
 */
async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { nombre, intervaloDias, especie, activa } = req.body;

    // Verificar que existe
    const existing = await pool.query('SELECT * FROM catalogo_vacunas WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vacuna del catálogo no encontrada' } });
    }

    // Validaciones
    if (intervaloDias !== undefined && intervaloDias <= 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'intervaloDias debe ser mayor a 0' }
      });
    }

    const especieValida = ['all', 'Perro', 'Gato', 'Conejo', 'Ave'];
    if (especie !== undefined && !especieValida.includes(especie)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'especie debe ser: all, Perro, Gato, Conejo o Ave' }
      });
    }

    const existingData = existing.rows[0];
    const result = await pool.query(
      `UPDATE catalogo_vacunas SET
        nombre = COALESCE($1, nombre),
        intervalo_dias = COALESCE($2, intervalo_dias),
        especie = COALESCE($3, especie),
        activa = COALESCE($4, activa)
       WHERE id = $5
       RETURNING *`,
      [nombre || existingData.nombre, intervaloDias || existingData.intervalo_dias, especie || existingData.especie, activa !== undefined ? activa : existingData.activa, id]
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: { code: 'DUPLICATE_ERROR', message: 'Ya existe una vacuna con ese nombre' }
      });
    }
    console.error('Error al actualizar vacuna del catálogo:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/catalogo/vacunas/:id
 * Eliminar vacuna del catálogo
 */
async function eliminar(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM catalogo_vacunas WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vacuna del catálogo no encontrada' } });
    }

    await pool.query('DELETE FROM catalogo_vacunas WHERE id = $1', [id]);

    return res.json({ message: 'Vacuna del catálogo eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar vacuna del catálogo:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
