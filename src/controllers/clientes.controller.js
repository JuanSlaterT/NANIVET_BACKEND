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

    // Extraer valor booleano si viene como objeto { aceptado: true, ... }
    const datosAceptado = typeof consentimiento_datos === 'object' ? consentimiento_datos.aceptado : consentimiento_datos;
    const comunicacionesAceptado = typeof consentimiento_comunicaciones === 'object' ? consentimiento_comunicaciones.aceptado : consentimiento_comunicaciones;
    const versionAviso = typeof consentimiento_datos === 'object' ? consentimiento_datos.versionAviso : 'v1.0';

    if (!datosAceptado) {
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [id, nombre, apellido, telefono, cedula, email || null, direccion || null,
       datosAceptado, ahora, versionAviso || 'v1.0', comunicacionesAceptado || false,
       comunicacionesAceptado ? ahora : null, ahora, ahora]
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
 * Eliminar cliente con cascade a mascotas y todo lo anclado a ellas
 */
async function eliminar(req, res) {
  try {
    const clienteId = req.params.id;

    // Primero eliminar todas las mascotas (que a su vez elimina todo lo anclado)
    const mascotas = await pool.query('SELECT id FROM mascotas WHERE cliente_id = $1', [clienteId]);
    for (const mascota of mascotas.rows) {
      // hospitalizaciones → (medicaciones → tomas, evoluciones)
      await pool.query('DELETE FROM hospitalizaciones WHERE mascota_id = $1', [mascota.id]);
      // alertas_mascotas
      await pool.query('DELETE FROM alertas_mascotas WHERE mascota_id = $1', [mascota.id]);
      // registros de peso
      await pool.query('DELETE FROM registros_peso WHERE mascota_id = $1', [mascota.id]);
      // citas
      await pool.query('DELETE FROM citas WHERE mascota_id = $1', [mascota.id]);
      // casos clínicos
      await pool.query('DELETE FROM casos_clinicos WHERE mascota_id = $1', [mascota.id]);
      // vacunas
      await pool.query('DELETE FROM vacunas WHERE mascota_id = $1', [mascota.id]);
      // tratamientos
      await pool.query('DELETE FROM tratamientos WHERE mascota_id = $1', [mascota.id]);
      // desparasitaciones
      await pool.query('DELETE FROM desparasitaciones WHERE mascota_id = $1', [mascota.id]);
      // cirugías
      await pool.query('DELETE FROM cirugias WHERE mascota_id = $1', [mascota.id]);
      // exámenes adjuntos
      await pool.query('DELETE FROM examenes_adjuntos WHERE mascota_id = $1', [mascota.id]);
      // puntuaciones
      await pool.query('DELETE FROM puntuaciones WHERE mascota_id = $1', [mascota.id]);
      // finalmente la mascota
      await pool.query('DELETE FROM mascotas WHERE id = $1', [mascota.id]);
    }

    // Campana envios
    await pool.query('DELETE FROM campana_envios WHERE cliente_id = $1', [clienteId]);

    // Finalmente eliminar el cliente
    await pool.query('DELETE FROM clientes WHERE id = $1', [clienteId]);

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
