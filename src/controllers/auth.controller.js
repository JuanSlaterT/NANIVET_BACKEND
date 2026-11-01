const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/pool');
const dotenv = require('dotenv');
const { setAuthCookies, clearAuthCookies, refreshTokenFrom } = require('../utils/auth-cookies');
const { securityEvent, errorEvent } = require('../services/security-events.service');
dotenv.config();

/**
 * POST /api/auth/login
 * Autenticación de usuario
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email y password son requeridos' }
      });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (result.rows.length === 0) {
      securityEvent(req, 'login_failed', { reason: 'unknown_user', email });
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' }
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      securityEvent(req, 'login_failed', { reason: 'invalid_password', email });
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' }
      });
    }

    // Actualizar última conexión
    await pool.query(
      'UPDATE usuarios SET ultima_conexion = NOW() WHERE id = $1',
      [user.id]
    );

    // Obtener veterinario_id si el usuario es veterinario
    let veterinarioId = null;
    if (user.rol === 'veterinario') {
      const vetResult = await pool.query(
        'SELECT id FROM veterinarios WHERE user_id = $1 AND activo = true',
        [user.id]
      );
      if (vetResult.rows.length > 0) {
        veterinarioId = vetResult.rows[0].id;
      }
    }

    // Generar tokens
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        telefono: user.telefono,
        especialidad: user.especialidad,
        veterinario_id: veterinarioId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    setAuthCookies(res, token, refreshToken);
    securityEvent(req, 'login_succeeded', { authenticatedUserId: user.id, authenticatedRole: user.rol }, 'info');

    return res.json({
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          telefono: user.telefono,
          especialidad: user.especialidad,
          veterinario_id: veterinarioId
        }
      }
    });
  } catch (err) {
    securityEvent(req, 'login_error', { errorName: err.name, errorMessage: err.message }, 'error');
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

/**
 * POST /api/auth/refresh
 * Refresh de token
 */
async function refresh(req, res) {
  try {
    const refreshToken = refreshTokenFrom(req);

    if (!refreshToken) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Refresh token requerido' }
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const result = await pool.query(
      'SELECT id, nombre, email, rol, telefono, especialidad FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token inválido' }
      });
    }

    const user = result.rows[0];

    // Obtener veterinario_id si el usuario es veterinario
    let veterinarioId = null;
    if (user.rol === 'veterinario') {
      const vetResult = await pool.query(
        'SELECT id FROM veterinarios WHERE user_id = $1 AND activo = true',
        [user.id]
      );
      if (vetResult.rows.length > 0) {
        veterinarioId = vetResult.rows[0].id;
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        telefono: user.telefono,
        especialidad: user.especialidad,
        veterinario_id: veterinarioId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const rotatedRefreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    setAuthCookies(res, token, rotatedRefreshToken);
    securityEvent(req, 'session_refreshed', { authenticatedUserId: user.id }, 'info');

    return res.json({
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          telefono: user.telefono,
          especialidad: user.especialidad,
          veterinario_id: veterinarioId
        }
      }
    });
  } catch (err) {
    clearAuthCookies(res);
    securityEvent(req, 'session_refresh_failed', { reason: err.name });
    return res.status(401).json({
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token inválido o expirado' }
    });
  }
}

function logout(req, res) {
  clearAuthCookies(res);
  securityEvent(req, 'logout', {}, 'info');
  return res.json({ data: { message: 'Sesión cerrada correctamente' } });
}

/**
 * GET /api/auth/me
 * Obtener usuario actual
 */
async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, telefono, especialidad FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' }
      });
    }

    const user = result.rows[0];

    // Obtener veterinario_id si el usuario es veterinario
    let veterinarioId = null;
    if (user.rol === 'veterinario') {
      const vetResult = await pool.query(
        'SELECT id FROM veterinarios WHERE user_id = $1 AND activo = true',
        [user.id]
      );
      if (vetResult.rows.length > 0) {
        veterinarioId = vetResult.rows[0].id;
      }
    }

    return res.json({
      data: {
        ...user,
        veterinario_id: veterinarioId
      }
    });
  } catch (err) {
    errorEvent(req, 'auth_me_failed', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
    });
  }
}

module.exports = { login, refresh, logout, getMe };
