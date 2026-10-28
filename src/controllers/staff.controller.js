const bcrypt = require('bcryptjs');
const pool = require('../config/pool');
const { genId } = require('../utils/genId');
const auditService = require('../services/audit.service');

/**
 * GET /api/staff
 * Obtener todos los miembros del staff
 */
async function getAllStaff(req, res) {
  try {
    const staffData = req.user?.rol === 'admin' ? true : false;
    
    const result = await pool.query(
      `SELECT 
        id, nombre, email, rol, telefono, especialidad, 
        activo, fecha_alta, fecha_creacion as fechaAlta,
        ultima_conexion as ultimaConexion
      FROM usuarios
      ORDER BY rol, nombre`
    );

    const staff = result.rows.map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono,
      especialidad: user.especialidad,
      activo: user.activo,
      fechaAlta: user.fecha_alta,
      ultimaConexion: user.ultima_conexion
    }));

    return res.json({ data: staff });
  } catch (error) {
    console.error('Error getting all staff:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * GET /api/staff/:id
 * Obtener miembro del staff por ID
 */
async function getStaffById(req, res) {
  try {
    const { id } = req.params;

    const pool = pool;
    const result = await pool.query(
      `SELECT 
        id, nombre, email, rol, telefono, especialidad, 
        activo, fecha_alta, fecha_creacion as fechaCreacion,
        ultima_conexion as ultimaConexion
      FROM usuarios
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Miembro del staff no encontrado' }
      });
    }

    const user = result.rows[0];
    const staff = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono,
      especialidad: user.especialidad,
      activo: user.activo,
      fechaAlta: user.fecha_alta,
      ultimaConexion: user.ultima_conexion
    };

    return res.json({ data: staff });
  } catch (error) {
    console.error('Error getting staff by id:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * GET /api/staff/email/:email
 * Verificar si existe un email
 */
async function getStaffByEmail(req, res) {
  try {
    const { email } = req.params;

    const pool = pool;
    const result = await pool.query(
      `SELECT id, nombre, email, rol FROM usuarios WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ data: { exists: false } });
    }

    return res.json({ 
      data: { 
        exists: true, 
        user: result.rows[0] 
      } 
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * POST /api/staff
 * Crear nuevo miembro del staff
 */
async function createStaff(req, res) {
  try {
    const { nombre, email, password, rol, telefono, especialidad, fechaAlta } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !rol || !telefono) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Nombre, email, password y teléfono son requeridos' }
      });
    }

    if (!['admin', 'veterinario', 'recepcionista'].includes(rol)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Rol inválido' }
      });
    }

    // Validar especialidad para veterinarios
    if (rol === 'veterinario' && !especialidad) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'La especialidad es requerida para veterinarios' }
      });
    }

    // Validar que no sea especialidad para no veterinarios
    if (rol !== 'veterinario' && especialidad) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Solo los veterinarios pueden tener especialidad' }
      });
    }

    // Verificar email único
    const pool = pool;
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'El email ya está registrado' }
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Generar ID
    const id = genId('usr');

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, telefono, especialidad, activo, fecha_alta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nombre, email, rol, telefono, especialidad, activo, fecha_alta, fecha_creacion as fechaCreacion`,
      [id, nombre, email, passwordHash, rol, telefono, especialidad || null, true, fechaAlta || null]
    );

    const newUser = result.rows[0];
    
    // Log de auditoría
    await auditService.logAudit(
      req.user.nombre,
      req.user.rol,
      'crear',
      'Staff',
      id,
      null,
      { nombre, email, rol, telefono, especialidad: especialidad || null }
    );

    return res.status(201).json({
      data: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        telefono: newUser.telefono,
        especialidad: newUser.especialidad,
        activo: newUser.activo,
        fechaAlta: newUser.fecha_alta
      }
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * PUT /api/staff/:id
 * Actualizar miembro del staff
 */
async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, telefono, especialidad, activo, fechaAlta } = req.body;

    // Verificar que existe
    const pool = pool;
    const existing = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Miembro del staff no encontrado' }
      });
    }

    const oldUser = existing.rows[0];

    // Verificar email único (excluyendo el actual)
    if (email && email !== oldUser.email) {
      const emailCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'El email ya está registrado' }
        });
      }
    }

    // Validar especialidad para veterinarios
    const finalRol = rol || oldUser.rol;
    if (finalRol === 'veterinario' && !especialidad && oldUser.especialidad) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'La especialidad es requerida para veterinarios' }
      });
    }

    // Hashear nueva contraseña si se proporciona
    let passwordHash = oldUser.password_hash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Actualizar usuario
    const result = await pool.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash),
           rol = COALESCE($4, rol),
           telefono = COALESCE($5, telefono),
           especialidad = $6,
           activo = COALESCE($7, activo),
           fecha_alta = COALESCE($8, fecha_alta)
       WHERE id = $9
       RETURNING id, nombre, email, rol, telefono, especialidad, activo, fecha_alta`,
      [nombre, email, passwordHash, rol, telefono, especialidad || null, activo, fechaAlta || null, id]
    );

    const updatedUser = result.rows[0];

    // Calcular diff para auditoría
    const diffCampos = [];
    const nuevosValores = {};
    const valoresAnteriores = {};

    if (nombre && nombre !== oldUser.nombre) {
      diffCampos.push({ campo: 'nombre', antes: oldUser.nombre, despues: nombre });
    }
    if (email && email !== oldUser.email) {
      diffCampos.push({ campo: 'email', antes: oldUser.email, despues: email });
    }
    if (telefono && telefono !== oldUser.telefono) {
      diffCampos.push({ campo: 'telefono', antes: oldUser.telefono, despues: telefono });
    }
    if (especialidad !== undefined && especialidad !== oldUser.especialidad) {
      diffCampos.push({ campo: 'especialidad', antes: oldUser.especialidad, despues: especialidad });
    }
    if (activo !== undefined && activo !== oldUser.activo) {
      diffCampos.push({ campo: 'activo', antes: oldUser.activo, despues: activo });
    }
    if (fechaAlta && fechaAlta !== oldUser.fecha_alta) {
      diffCampos.push({ campo: 'fechaAlta', antes: oldUser.fecha_alta, despues: fechaAlta });
    }

    nuevosValores.nombre = nombre || oldUser.nombre;
    nuevosValores.email = email || oldUser.email;
    nuevosValores.rol = rol || oldUser.rol;
    nuevosValores.telefono = telefono || oldUser.telefono;
    nuevosValores.especialidad = especialidad || oldUser.especialidad;
    nuevosValores.activo = activo !== undefined ? activo : oldUser.activo;

    valoresAnteriores.nombre = oldUser.nombre;
    valoresAnteriores.email = oldUser.email;
    valoresAnteriores.rol = oldUser.rol;
    valoresAnteriores.telefono = oldUser.telefono;
    valoresAnteriores.especialidad = oldUser.especialidad;
    valoresAnteriores.activo = oldUser.activo;

    // Log de auditoría
    await auditService.logAudit(
      req.user.nombre,
      req.user.rol,
      'editar',
      'Staff',
      id,
      valoresAnteriores,
      nuevosValores,
      diffCampos.length > 0 ? diffCampos : null
    );

    return res.json({
      data: {
        id: updatedUser.id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        rol: updatedUser.rol,
        telefono: updatedUser.telefono,
        especialidad: updatedUser.especialidad,
        activo: updatedUser.activo,
        fechaAlta: updatedUser.fecha_alta
      }
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * PATCH /api/staff/:id/active
 * Activar/desactivar miembro del staff
 */
async function toggleActive(req, res) {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'El campo activo debe ser booleano' }
      });
    }

    const pool = pool;
    
    // Verificar que existe
    const existing = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Miembro del staff no encontrado' }
      });
    }

    const oldUser = existing.rows[0];

    // Actualizar estado
    const result = await pool.query(
      `UPDATE usuarios 
       SET activo = $1 
       WHERE id = $2 
       RETURNING id, nombre, email, rol, activo`,
      [activo, id]
    );

    const updatedUser = result.rows[0];

    // Log de auditoría
    const accion = activo ? 'activar' : 'desactivar';
    await auditService.logAudit(
      req.user.nombre,
      req.user.rol,
      accion,
      'Staff',
      id,
      { activo: !activo },
      { activo }
    );

    return res.json({
      data: {
        id: updatedUser.id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        rol: updatedUser.rol,
        activo: updatedUser.activo
      }
    });
  } catch (error) {
    console.error('Error toggling active:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * DELETE /api/staff/:id
 * Eliminar miembro del staff
 */
async function deleteStaff(req, res) {
  try {
    const { id } = req.params;

    const pool = pool;
    
    // Verificar que existe
    const existing = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Miembro del staff no encontrado' }
      });
    }

    const oldUser = existing.rows[0];

    // No permitir eliminarse a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No puedes eliminarte a ti mismo' }
      });
    }

    // Eliminar usuario
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

    // Log de auditoría
    await auditService.logAudit(
      req.user.nombre,
      req.user.rol,
      'eliminar',
      'Staff',
      id,
      { nombre: oldUser.nombre, email: oldUser.email, rol: oldUser.rol },
      null
    );

    return res.json({
      data: { message: 'Miembro del staff eliminado correctamente' }
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

module.exports = {
  getAllStaff,
  getStaffById,
  getStaffByEmail,
  createStaff,
  updateStaff,
  toggleActive,
  deleteStaff
};
