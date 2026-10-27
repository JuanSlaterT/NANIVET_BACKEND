const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * GET /api/search/global?q=...
 * Búsqueda global de clientes, mascotas y veterinarios
 */
async function buscarGlobal(req, res) {
  try {
    const pool = require('../config/db').getPool();
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        data: {
          clientes: [],
          mascotas: [],
          veterinarios: [],
        }
      });
    }

    const pattern = `%${q}%`;

    // Buscar clientes
    const clientesResult = await pool.query(
      `SELECT id, nombre, apellido, telefono, cedula, email
       FROM clientes
       WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR cedula ILIKE $1 OR telefono ILIKE $1
       LIMIT 10`,
      [pattern]
    );

    // Buscar mascotas
    const mascotasResult = await pool.query(
      `SELECT m.id, m.nombre, m.especie, m.raza, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
       FROM mascotas m
       JOIN clientes c ON m.cliente_id = c.id
       WHERE m.nombre ILIKE $1 OR m.raza ILIKE $1 OR c.nombre ILIKE $1 OR c.apellido ILIKE $1
       LIMIT 10`,
      [pattern]
    );

    // Buscar veterinarios
    const vetsResult = await pool.query(
      `SELECT id, nombre, especialidad, telefono
       FROM veterinarios
       WHERE nombre ILIKE $1 OR especialidad ILIKE $1
       LIMIT 10`,
      [pattern]
    );

    return res.json({
      data: {
        clientes: clientesResult.rows,
        mascotas: mascotasResult.rows,
        veterinarios: vetsResult.rows,
      }
    });
  } catch (err) {
    console.error('Error searching global:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

router.get('/', authMiddleware, buscarGlobal);

module.exports = router;
