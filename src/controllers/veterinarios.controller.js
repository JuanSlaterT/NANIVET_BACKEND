const pool = require('../config/pool');
const authMiddleware = require('../middleware/auth.middleware');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/veterinarios
 * Listar todos los veterinarios (sincronizados con staff)
 */
async function listar(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        u.nombre AS staff_nombre,
        u.email AS staff_email,
        u.telefono AS staff_telefono,
        u.activo AS staff_activo
      FROM veterinarios v
      LEFT JOIN usuarios u ON v.user_id = u.id
      WHERE v.activo = true
      ORDER BY u.nombre
    `);
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('Error en listar veterinarios:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/veterinarios/:id
 * Obtener un veterinario
 */
async function obtener(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        u.nombre AS staff_nombre,
        u.email AS staff_email,
        u.telefono AS staff_telefono,
        u.activo AS staff_activo
      FROM veterinarios v
      LEFT JOIN usuarios u ON v.user_id = u.id
      WHERE v.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Veterinario no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/veterinarios/:id/bloqueos
 * Obtener bloqueos de un veterinario
 */
async function obtenerBloqueos(req, res) {
  try {
    const result = await pool.query(
      `SELECT hb.*, u.nombre AS veterinario_nombre 
       FROM horarios_bloqueados hb 
       LEFT JOIN usuarios u ON hb.veterinario_id = u.id 
       WHERE hb.veterinario_id = $1 
       ORDER BY hb.fecha`,
      [req.params.id]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/veterinarios/:id/bloqueos
 * Crear bloqueo
 */
async function crearBloqueo(req, res) {
  try {
    const { fecha, motivo } = req.body;
    const id = genUuid();
    req.entityId = id; // Para auditoría
    const result = await pool.query(
      `INSERT INTO horarios_bloqueados (id, veterinario_id, fecha, motivo) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [id, req.params.id, fecha, motivo]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/veterinarios/bloqueos/:bloqueoId
 * Eliminar bloqueo
 */
async function eliminarBloqueo(req, res) {
  try {
    await pool.query('DELETE FROM horarios_bloqueados WHERE id = $1', [req.params.bloqueoId]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/veterinarios/sync/:userId
 * Sincronizar veterinario con usuario de staff
 * Cuando se crea un usuario veterinario en staff, se crea/actualiza su registro en veterinarios
 */
async function syncWithStaff(req, res) {
  try {
    const { userId } = req.params;
    const { 
      especialidad, 
      telefono, 
      horario_inicio = '08:00', 
      horario_fin = '17:00',
      dias_semana = [1,2,3,4,5,6],
      intervalo_minutos = 30
    } = req.body;

    const result = await pool.query(`
      INSERT INTO veterinarios (
        user_id, especialidad, telefono, 
        horario_inicio, horario_fin, dias_semana, intervalo_minutos, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (user_id) DO UPDATE SET
        especialidad = EXCLUDED.especialidad,
        telefono = EXCLUDED.telefono,
        horario_inicio = EXCLUDED.horario_inicio,
        horario_fin = EXCLUDED.horario_fin,
        dias_semana = EXCLUDED.dias_semana,
        intervalo_minutos = EXCLUDED.intervalo_minutos
      RETURNING *
    `, [userId, especialidad, telefono, horario_inicio, horario_fin, dias_semana, intervalo_minutos]);

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error en sync veterinarios:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, obtenerBloqueos, crearBloqueo, eliminarBloqueo, syncWithStaff };
