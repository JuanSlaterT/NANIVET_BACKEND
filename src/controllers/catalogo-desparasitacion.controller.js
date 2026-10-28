const pool = require('../config/pool');

/**
 * GET /api/catalogo/desparasitacion
 * Listar todos los productos de desparasitación del catálogo
 */
async function listar(req, res) {
  try {
    const { activas } = req.query;
    let query = 'SELECT * FROM catalogo_desparasitacion';
    const params = [];

    if (activas === 'true') {
      query += ' WHERE activa = $1';
      params.push(true);
    }

    query += ' ORDER BY nombre';

    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('Error al listar catálogo de desparasitación:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/catalogo/desparasitacion/:id
 * Obtener un producto de desparasitación del catálogo por ID
 */
async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM catalogo_desparasitacion WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Producto de desparasitación no encontrado' } });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error al obtener producto de desparasitación:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/catalogo/desparasitacion
 * Crear nuevo producto de desparasitación en el catálogo
 */
async function crear(req, res) {
  try {
    const { nombre, intervaloMeses, via, activa } = req.body;
    const id = `cd_${Date.now().toString().slice(-6)}`;

    // Validaciones
    if (!nombre || !intervaloMeses) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'nombre y intervaloMeses son requeridos' }
      });
    }

    if (intervaloMeses <= 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'intervaloMeses debe ser mayor a 0' }
      });
    }

    const viaValida = ['Oral', 'Subcutánea', 'Tópica', 'Inyectable'];
    if (!viaValida.includes(via)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'via debe ser: Oral, Subcutánea, Tópica o Inyectable' }
      });
    }

    const result = await pool.query(
      `INSERT INTO catalogo_desparasitacion (id, nombre, intervalo_meses, via, activa)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, nombre, intervaloMeses, via, activa !== false]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        error: { code: 'DUPLICATE_ERROR', message: 'Ya existe un producto con ese nombre' }
      });
    }
    console.error('Error al crear producto de desparasitación:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/catalogo/desparasitacion/:id
 * Actualizar producto de desparasitación del catálogo
 */
async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { nombre, intervaloMeses, via, activa } = req.body;

    // Verificar que existe
    const existing = await pool.query('SELECT * FROM catalogo_desparasitacion WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Producto de desparasitación no encontrado' } });
    }

    // Validaciones
    if (intervaloMeses !== undefined && intervaloMeses <= 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'intervaloMeses debe ser mayor a 0' }
      });
    }

    const viaValida = ['Oral', 'Subcutánea', 'Tópica', 'Inyectable'];
    if (via !== undefined && !viaValida.includes(via)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'via debe ser: Oral, Subcutánea, Tópica o Inyectable' }
      });
    }

    const existingData = existing.rows[0];
    const result = await pool.query(
      `UPDATE catalogo_desparasitacion SET
        nombre = COALESCE($1, nombre),
        intervalo_meses = COALESCE($2, intervalo_meses),
        via = COALESCE($3, via),
        activa = COALESCE($4, activa)
       WHERE id = $5
       RETURNING *`,
      [nombre || existingData.nombre, intervaloMeses || existingData.intervalo_meses, via || existingData.via, activa !== undefined ? activa : existingData.activa, id]
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: { code: 'DUPLICATE_ERROR', message: 'Ya existe un producto con ese nombre' }
      });
    }
    console.error('Error al actualizar producto de desparasitación:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/catalogo/desparasitacion/:id
 * Eliminar producto de desparasitación del catálogo
 */
async function eliminar(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM catalogo_desparasitacion WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Producto de desparasitación no encontrado' } });
    }

    await pool.query('DELETE FROM catalogo_desparasitacion WHERE id = $1', [id]);

    return res.json({ message: 'Producto de desparasitación eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto de desparasitación:', err);
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
