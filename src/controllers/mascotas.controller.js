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
 * GET /api/mascotas
 * Listar mascotas con filtros
 */
async function listar(req, res) {
  try {
    const { clienteId, especie } = req.query;
    let query = `
      SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.telefono AS cliente_telefono
      FROM mascotas m
      JOIN clientes c ON m.cliente_id = c.id
    `;
    const params = [];
    let paramCount = 1;

    if (clienteId) {
      query += ` WHERE m.cliente_id = $${paramCount}`;
      params.push(clienteId);
      paramCount++;
    }
    if (especie) {
      query += `${clienteId ? ' AND' : ' WHERE'} m.especie = $${paramCount}`;
      params.push(especie);
      paramCount++;
    }

    query += ' ORDER BY m.nombre';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/mascotas/:id
 * Obtener mascota con datos del dueño
 */
async function obtener(req, res) {
  try {
    const result = await pool.query(
      `SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, 
       c.telefono AS cliente_telefono, c.email AS cliente_email
       FROM mascotas m
       JOIN clientes c ON m.cliente_id = c.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mascota no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/mascotas
 * Crear mascota
 */
async function crear(req, res) {
  try {
    const { clienteId, nombre, especie, sexo, fecha_nacimiento, raza, color, foto_url, esterilizado, microchip, alergias, notas } = req.body;

    // Verificar que el cliente existe
    const clientCheck = await pool.query('SELECT id FROM clientes WHERE id = $1', [clienteId]);
    if (clientCheck.rows.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Cliente no encontrado' } });
    }

    const id = `mas_${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      `INSERT INTO mascotas (id, cliente_id, nombre, especie, sexo, fecha_nacimiento, raza, color, foto_url, 
       esterilizado, microchip, alergias, notas, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [id, clienteId, nombre, especie, sexo, fecha_nacimiento || null, raza || null, color || null,
       foto_url || null, esterilizado || false, microchip || null, alergias || null, notas || null]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/mascotas/:id
 * Actualizar mascota
 */
async function actualizar(req, res) {
  try {
    const { nombre, especie, sexo, fecha_nacimiento, raza, color, foto_url, esterilizado, microchip, alergias, notas } = req.body;
    const result = await pool.query(
      `UPDATE mascotas SET
       nombre = COALESCE($1, nombre), especie = COALESCE($2, especie), sexo = COALESCE($3, sexo),
       fecha_nacimiento = COALESCE($4, fecha_nacimiento), raza = COALESCE($5, raza),
       color = COALESCE($6, color), foto_url = COALESCE($7, foto_url),
       esterilizado = COALESCE($8, esterilizado), microchip = COALESCE($9, microchip),
       alergias = COALESCE($10, alergias), notas = COALESCE($11, notas),
       fecha_actualizacion = NOW()
       WHERE id = $12 RETURNING *`,
      [nombre, especie, sexo, fecha_nacimiento, raza, color, foto_url,
       esterilizado, microchip, alergias, notas, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mascota no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/mascotas/:id
 * Eliminar mascota
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM mascotas WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/mascotas/buscar
 * Búsqueda por nombre/especie
 */
async function buscar(req, res) {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
       FROM mascotas m
       JOIN clientes c ON m.cliente_id = c.id
       WHERE m.nombre ILIKE $1 OR m.especie ILIKE $1
       ORDER BY m.nombre LIMIT 20`,
      [`%${q}%`]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, buscar };
