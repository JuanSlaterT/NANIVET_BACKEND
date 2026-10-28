const pool = require('../config/pool');
const { genToken } = require('../utils/genToken');
const { nowEcuador } = require('../utils/dates');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/puntuaciones
 * Listar puntuaciones con filtros
 */
async function listar(req, res) {
  try {
    const { citaId, respondida, veterinarioId } = req.query;
    let query = `
      SELECT p.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
             v.nombre AS veterinario_nombre, cli.nombre AS cliente_nombre, cli.apellido AS cliente_apellido,
             ci.fecha_hora, ci.estado AS cita_estado, ci.token AS cita_token
      FROM puntuaciones p
      JOIN citas ci ON p.cita_id = ci.id
      JOIN mascotas mas ON p.mascota_id = mas.id
      JOIN veterinarios v ON p.veterinario_id = v.id
      JOIN clientes cli ON mas.cliente_id = cli.id
    `;
    const params = [];
    let paramCount = 1;

    if (citaId) {
      query += ` WHERE p.cita_id = $${paramCount}`;
      params.push(citaId);
      paramCount++;
    }
    if (respondida !== undefined) {
      query += ` ${citaId ? 'AND' : 'WHERE'} p.respondida = $${paramCount}`;
      params.push(respondida === 'true');
      paramCount++;
    }
    if (veterinarioId) {
      query += ` ${citaId || respondida !== undefined ? 'AND' : 'WHERE'} p.veterinario_id = $${paramCount}`;
      params.push(veterinarioId);
      paramCount++;
    }

    query += ' ORDER BY p.fecha_respuesta DESC NULLS LAST';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/puntuaciones/stats
 * Estadísticas de puntuaciones
 */
async function estadisticas(req, res) {
  try {
    // Promedio general
    const avgResult = await pool.query(
      `SELECT 
        COALESCE(AVG(calificacion), 0)::NUMERIC(3,1) AS promedio,
        COUNT(*) AS total,
        COALESCE(AVG(CASE WHEN recomienda = true THEN 1 ELSE 0 END) * 100, 0)::NUMERIC(5,1) AS recomienda_pct
       FROM puntuaciones
       WHERE respondida = true AND calificacion > 0`
    );

    // Por veterinario
    const vetResult = await pool.query(
      `SELECT 
        v.id AS veterinario_id,
        v.nombre AS veterinario_nombre,
        COALESCE(AVG(p.calificacion), 0)::NUMERIC(3,1) AS promedio,
        COUNT(p.id) AS total
       FROM veterinarios v
       LEFT JOIN puntuaciones p ON v.id = p.veterinario_id AND p.respondida = true AND p.calificacion > 0
       GROUP BY v.id, v.nombre
       ORDER BY promedio DESC`
    );

    // Comentarios recientes
    const commentsResult = await pool.query(
      `SELECT p.*, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
       FROM puntuaciones p
       JOIN mascotas mas ON p.mascota_id = mas.id
       JOIN veterinarios v ON p.veterinario_id = v.id
       WHERE p.respondida = true AND p.comentario IS NOT NULL AND p.comentario != ''
       ORDER BY p.fecha_respuesta DESC
       LIMIT 20`
    );

    // Pendientes (no respondidas)
    const pendingResult = await pool.query(
      `SELECT p.*, ci.fecha_hora, mas.nombre AS mascota_nombre, v.nombre AS veterinario_nombre
       FROM puntuaciones p
       JOIN citas ci ON p.cita_id = ci.id
       JOIN mascotas mas ON p.mascota_id = mas.id
       JOIN veterinarios v ON p.veterinario_id = v.id
       WHERE p.respondida = false
       ORDER BY ci.fecha_hora DESC`
    );

    return res.json({
      data: {
        promedio: parseFloat(avgResult.rows[0].promedio),
        total: parseInt(avgResult.rows[0].total),
        recomienda: parseFloat(avgResult.rows[0].recomienda_pct),
        porVeterinario: vetResult.rows.map(v => ({
          veterinarioId: v.veterinario_id,
          nombre: v.veterinario_nombre,
          promedio: parseFloat(v.promedio),
          total: parseInt(v.total)
        })),
        comentarios: commentsResult.rows.map(r => ({
          id: r.id,
          mascotaNombre: r.mascota_nombre,
          veterinarioNombre: r.veterinario_nombre,
          calificacion: r.calificacion,
          recomienda: r.recomienda,
          comentario: r.comentario,
          fechaRespuesta: r.fecha_respuesta
        })),
        pendientes: pendingResult.rows.map(r => ({
          id: r.id,
          citaId: r.cita_id,
          mascotaNombre: r.mascota_nombre,
          veterinarioNombre: r.veterinario_nombre,
          fechaHora: r.fecha_hora,
          token: r.token
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/puntuaciones/token/:token
 * Obtener puntuación por token (público)
 */
async function obtenerPorToken(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
              v.nombre AS veterinario_nombre, cli.nombre AS cliente_nombre, cli.apellido AS cliente_apellido,
              ci.fecha_hora, ci.estado AS cita_estado, ci.tipo_servicio, ci.motivo
       FROM puntuaciones p
       JOIN citas ci ON p.cita_id = ci.id
       JOIN mascotas mas ON p.mascota_id = mas.id
       JOIN veterinarios v ON p.veterinario_id = v.id
       JOIN clientes cli ON mas.cliente_id = cli.id
       WHERE p.token = $1`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Puntuación no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/puntuaciones/token/:token/responder
 * Responder puntuación (público)
 */
async function responderPorToken(req, res) {
  try {
    const { calificacion, recomienda, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Calificación debe ser entre 1 y 5' } });
    }

    const ahora = nowEcuador().toJSDate();
    const result = await pool.query(
      `UPDATE puntuaciones SET 
       calificacion = $1, recomienda = $2, comentario = $3, respondida = true, fecha_respuesta = $4
       WHERE token = $5 RETURNING *`,
      [calificacion, recomienda || null, comentario || null, ahora, req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Puntuación no encontrada' } });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/puntuaciones/cita/:citaId/crear
 * Crear puntuación pendiente (interno)
 */
async function crearPorCita(req, res) {
  try {
    const { citaId } = req.params;
    const userId = req.user?.id || 'sistema';

    // Verificar que la cita existe
    const citaResult = await pool.query('SELECT * FROM citas WHERE id = $1', [citaId]);
    if (citaResult.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }

    const cita = citaResult.rows[0];

    // Verificar si ya existe una puntuación para esta cita
    const existing = await pool.query('SELECT id FROM puntuaciones WHERE cita_id = $1', [citaId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: 'Ya existe una puntuación para esta cita' } });
    }

    const token = genToken();
    const id = genUuid();
    req.entityId = id; // Para auditoría

    const result = await pool.query(
      `INSERT INTO puntuaciones (id, cita_id, token, mascota_id, veterinario_id, calificacion, respondida, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, 0, false, NOW())
       RETURNING *`,
      [id, citaId, token, cita.mascota_id, cita.veterinario_id]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/puntuaciones/cita/:citaId
 * Obtener puntuación por cita
 */
async function obtenerPorCita(req, res) {
  try {
    const { citaId } = req.params;
    const result = await pool.query(
      `SELECT p.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
              v.nombre AS veterinario_nombre, ci.fecha_hora, ci.estado AS cita_estado
       FROM puntuaciones p
       JOIN citas ci ON p.cita_id = ci.id
       JOIN mascotas mas ON p.mascota_id = mas.id
       JOIN veterinarios v ON p.veterinario_id = v.id
       WHERE p.cita_id = $1`,
      [citaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Puntuación no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/puntuaciones/pendientes
 * Listar puntuaciones pendientes de responder
 */
async function listarPendientes(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.*, ci.fecha_hora, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
              v.nombre AS veterinario_nombre, cli.nombre AS cliente_nombre, cli.apellido AS cliente_apellido
       FROM puntuaciones p
       JOIN citas ci ON p.cita_id = ci.id
       JOIN mascotas mas ON p.mascota_id = mas.id
       JOIN veterinarios v ON p.veterinario_id = v.id
       JOIN clientes cli ON mas.cliente_id = cli.id
       WHERE p.respondida = false
       ORDER BY ci.fecha_hora DESC`
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, estadisticas, obtenerPorToken, responderPorToken, crearPorCita, obtenerPorCita, listarPendientes };
