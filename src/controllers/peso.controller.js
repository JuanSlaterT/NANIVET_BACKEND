const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/mascotas/:id/pesos
 * Historial de peso
 */
async function listarPesos(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM registros_peso WHERE mascota_id = $1 ORDER BY fecha DESC',
      [req.params.id]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/mascotas/:id/pesos
 * Registrar peso
 */
async function crearPeso(req, res) {
  try {
    const { peso_kg, fecha } = req.body;

    if (!peso_kg || !fecha) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'peso_kg y fecha son requeridos' } });
    }

    const id = genUuid();
    const result = await pool.query(
      'INSERT INTO registros_peso (id, mascota_id, peso_kg, fecha, fecha_creacion) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [id, req.params.id, peso_kg, fecha]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listarPesos, crearPeso };
