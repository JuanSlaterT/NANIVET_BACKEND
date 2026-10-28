const pool = require('../config/pool');
const { nowEcuador } = require('../utils/dates');
const { validatePhone, validateCedula, validateEmail } = require('../utils/validators');
const { genUuid } = require('../utils/genUuid');

/**
 * GET /api/clientes
 * Listar clientes con filtros
 */
async function listar(req, res) {
  try {
    const { q, pagina = 1, limit = 20 } = req.query;
    const offset = (pagina - 1) * limit;

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM mascotas m WHERE m.cliente_id = c.id) AS cantidad_mascotas
      FROM clientes c
    `;
    const params = [];
    let paramCount = 1;

    if (q) {
      query += ` WHERE (c.nombre ILIKE $${paramCount} OR c.apellido ILIKE $${paramCount} OR c.cedula ILIKE $${paramCount} OR c.telefono ILIKE $${paramCount})`;
      params.push(`%${q}%`);
      paramCount++;
    }

    query += ` ORDER BY c.nombre, c.apellido LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return res.json({ data: result.rows, meta: { pagina: parseInt(pagina), limit: parseInt(limit), total: result.rows.length } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/clientes/:id
 * Obtener cliente
 */
async function obtener(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT json_agg(json_build_object('id', m.id, 'nombre', m.nombre, 'especie', m.especie))
         FROM mascotas m WHERE m.cliente_id = c.id) AS mascotas
       FROM clientes c WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/clientes
 * Crear cliente
 */
async function crear(req, res) {
  try {
    const { nombre, apellido, telefono, cedula, email, direccion, consentimiento_datos, consentimiento_comunicaciones } = req.body;

    if (!consentimiento_datos) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Consentimiento de datos es obligatorio' } });
    }

    // Validaciones
    const phoneValidation = validatePhone(telefono);
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: phoneValidation.message } });
    }

    const cedulaValidation = validateCedula(cedula);
    if (!cedulaValidation.valid) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: cedulaValidation.message } });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: emailValidation.message } });
    }

    if (!nombre || !apellido) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Nombre y apellido son requeridos' } });
    }

    const id = genUuid();
    req.entityId = id; // Para auditoría
    const ahora = nowEcuador().toJSDate();

    const result = await pool.query(
      `INSERT INTO clientes (id, nombre, apellido, telefono, cedula, email, direccion, 
       consentimiento_datos, consentimiento_fecha, consentimiento_version, 
       consentimiento_comunicaciones, consentimiento_comunicaciones_fecha, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'v1.0', $10, $11, $12, $13)
       RETURNING *`,
      [id, nombre, apellido, telefono, cedula, email || null, direccion || null,
       consentimiento_datos, ahora, consentimiento_comunicaciones || false,
       consentimiento_comunicaciones ? ahora : null, ahora, ahora]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Ya existe un cliente con esa cédula' } });
    }
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/clientes/:id
 * Actualizar cliente
 */
async function actualizar(req, res) {
  try {
    const { nombre, apellido, telefono, email, direccion } = req.body;
    const result = await pool.query(
      `UPDATE clientes SET nombre = COALESCE($1, nombre), apellido = COALESCE($2, apellido),
       telefono = COALESCE($3, telefono), email = COALESCE($4, email),
       direccion = COALESCE($5, direccion), fecha_actualizacion = NOW()
       WHERE id = $6 RETURNING *`,
      [nombre, apellido, telefono, email, direccion, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/clientes/:id
 * Eliminar cliente
 */
async function eliminar(req, res) {
  try {
    const check = await pool.query('SELECT COUNT(*) FROM mascotas WHERE cliente_id = $1', [req.params.id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ error: { code: 'RESTRICT_DELETE', message: 'No se puede eliminar cliente con mascotas' } });
    }
    await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/clientes/:id/revocar-consentimiento
 * Revocar consentimiento de datos
 */
async function revocarConsentimiento(req, res) {
  try {
    const ahora = nowEcuador().toJSDate();
    const result = await pool.query(
      `UPDATE clientes SET consentimiento_datos = false, fecha_revocacion = $1, fecha_actualizacion = NOW()
       WHERE id = $2 RETURNING *`,
      [ahora, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/clientes/buscar
 * Búsqueda por nombre/cédula/tel
 */
async function buscar(req, res) {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT * FROM clientes WHERE (nombre ILIKE $1 OR apellido ILIKE $1 OR cedula ILIKE $1 OR telefono ILIKE $1)
       ORDER BY nombre LIMIT 20`,
      [`%${q}%`]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, revocarConsentimiento, buscar };
