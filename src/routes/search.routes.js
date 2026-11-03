const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const pool = require('../config/pool');
const { errorEvent } = require('../services/security-events.service');

/**
 * GET /api/search/global?q=...
 * Búsqueda global de clientes, mascotas, citas, casos y veterinarios
 */
async function buscarGlobal(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        data: {
          clientes: [],
          mascotas: [],
          citas: [],
          casos: [],
          veterinarios: [],
        }
      });
    }

    const pattern = `%${q}%`;

    const [clientesResult, mascotasResult, citasResult, casosResult, vetsResult] = await Promise.all([
      pool.query(
      `SELECT id, nombre, apellido, telefono, cedula, email
       FROM clientes
       WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR cedula ILIKE $1 OR telefono ILIKE $1
       LIMIT 10`,
      [pattern]
      ),
      pool.query(
      `SELECT m.id, m.nombre, m.especie, m.raza, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
       FROM mascotas m
       JOIN clientes c ON m.cliente_id = c.id
       WHERE m.nombre ILIKE $1 OR m.raza ILIKE $1 OR c.nombre ILIKE $1 OR c.apellido ILIKE $1
       LIMIT 10`,
      [pattern]
      ),
      pool.query(
      `SELECT ci.id, ci.mascota_id, ci.veterinario_id, ci.motivo, ci.tipo_servicio, ci.fecha_hora, ci.estado,
              m.nombre AS mascota_nombre, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
       FROM citas ci
       JOIN mascotas m ON m.id = ci.mascota_id
       JOIN clientes c ON c.id = m.cliente_id
       WHERE COALESCE(ci.motivo, '') ILIKE $1 OR ci.tipo_servicio ILIKE $1
          OR m.nombre ILIKE $1 OR c.nombre ILIKE $1 OR c.apellido ILIKE $1
       ORDER BY ci.fecha_hora DESC
       LIMIT 10`,
      [pattern]
      ),
      pool.query(
      `SELECT cc.id, cc.mascota_id, cc.veterinario_id, cc.motivo, cc.diagnostico, cc.estado,
              cc.fecha_hora_inicio, m.nombre AS mascota_nombre
       FROM casos_clinicos cc
       JOIN mascotas m ON m.id = cc.mascota_id
       WHERE cc.motivo ILIKE $1 OR COALESCE(cc.diagnostico, '') ILIKE $1 OR m.nombre ILIKE $1
       ORDER BY cc.fecha_hora_inicio DESC
       LIMIT 10`,
      [pattern]
      ),
      pool.query(
      `SELECT id, nombre, especialidad, telefono, horario_inicio, horario_fin, dias_semana, intervalo_minutos
       FROM veterinarios
       WHERE nombre ILIKE $1 OR COALESCE(especialidad, '') ILIKE $1
       LIMIT 10`,
      [pattern]
      ),
    ]);

    return res.json({
      data: {
        clientes: clientesResult.rows,
        mascotas: mascotasResult.rows,
        citas: citasResult.rows,
        casos: casosResult.rows,
        veterinarios: vetsResult.rows,
      }
    });
  } catch (err) {
    errorEvent(req, 'global_search_failed', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

router.get('/global', authMiddleware, buscarGlobal);
router.get('/', authMiddleware, buscarGlobal);

module.exports = router;
