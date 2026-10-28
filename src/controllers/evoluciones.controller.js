const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/hospitalizaciones/:id/evoluciones
 * Listar evoluciones
 */
async function listarEvoluciones(req, res) {
  try {
    const result = await pool.query(
      'SELECT ev.*, v.nombre AS veterinario_nombre FROM evoluciones_hospitalizacion ev LEFT JOIN veterinarios v ON ev.veterinario_id = v.id WHERE ev.hospitalizacion_id = $1 ORDER BY ev.fecha',
      [req.params.id]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/hospitalizaciones/:id/evoluciones
 * Crear evolución
 */
async function crearEvolucion(req, res) {
  try {
    const { fecha, signos_vitales, estado_general, observaciones, veterinario_id:veterinarioId } = req.body;
    const id = genUuid();
    req.entityId = id; // Para auditoría
    const vetId = veterinarioId || req.user.veterinario_id;

    const result = await pool.query(
      `INSERT INTO evoluciones_hospitalizacion (id, hospitalizacion_id, fecha, signos_vitales, estado_general, observaciones, veterinario_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [id, req.params.id, fecha, signos_vitales || null, estado_general || null, observaciones || null, vetId]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listarEvoluciones, crearEvolucion };
