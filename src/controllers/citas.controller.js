const pool = require('../config/pool');
const { genToken } = require('../utils/genToken');
const { nowEcuador, formatISO } = require('../utils/dates');
const { getOcupados } = require('../services/availability.service');

/**
 * GET /api/citas
 * Listar citas con filtros (requiere autenticación)
 */
async function listar(req, res) {
  try {
    const { fecha, veterinarioId, estado } = req.query;
    let query = `
      SELECT ci.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
             v.nombre AS veterinario_nombre, cli.nombre AS cliente_nombre, cli.apellido AS cliente_apellido,
             cli.telefono AS cliente_telefono
      FROM citas ci
      JOIN mascotas mas ON ci.mascota_id = mas.id
      JOIN veterinarios v ON ci.veterinario_id = v.id
      JOIN clientes cli ON mas.cliente_id = cli.id
    `;
    const params = [];
    let paramCount = 1;

    if (fecha) {
      query += ` WHERE ci.fecha_hora::date = $${paramCount}`;
      params.push(fecha);
      paramCount++;
    }
    if (veterinarioId) {
      query += `${fecha ? ' AND' : ' WHERE'} ci.veterinario_id = $${paramCount}`;
      params.push(veterinarioId);
      paramCount++;
    }
    if (estado) {
      query += ` ${fecha || veterinarioId ? 'AND' : 'WHERE'} ci.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    query += ' ORDER BY ci.fecha_hora DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/citas/veterinario/:vetId/proximas
 * Obtener citas próximas de un veterinario (hoy a +14 días) — sin autenticación
 */
async function obtenerProximasPorVeterinario(req, res) {
  try {
    const { vetId } = req.params;

    const result = await pool.query(
      `
        SELECT ci.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
               v.nombre AS veterinario_nombre
        FROM citas ci
        JOIN mascotas mas ON ci.mascota_id = mas.id
        JOIN veterinarios v ON ci.veterinario_id = v.id
        WHERE ci.veterinario_id = $1
          AND ci.fecha_hora::date >= CURRENT_DATE
          AND ci.fecha_hora::date <= CURRENT_DATE + INTERVAL '14 days'
        ORDER BY ci.fecha_hora ASC
      `,
      [vetId]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error('Error en obtenerProximasPorVeterinario:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/citas/:id
 * Obtener cita
 */
async function obtener(req, res) {
  try {
    const result = await pool.query(
      `SELECT ci.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
              v.nombre AS veterinario_nombre, cli.nombre AS cliente_nombre, cli.apellido AS cliente_apellido
       FROM citas ci
       JOIN mascotas mas ON ci.mascota_id = mas.id
       JOIN veterinarios v ON ci.veterinario_id = v.id
       JOIN clientes cli ON mas.cliente_id = cli.id
       WHERE ci.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/citas/token/:token
 * Obtener cita por token (público)
 */
async function obtenerPorToken(req, res) {
  try {
    const result = await pool.query(
      `SELECT ci.*, mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
              v.nombre AS veterinario_nombre, cli.nombre AS cliente_nombre, cli.apellido AS cliente_apellido,
              cli.telefono AS cliente_telefono
       FROM citas ci
       JOIN mascotas mas ON ci.mascota_id = mas.id
       JOIN veterinarios v ON ci.veterinario_id = v.id
       JOIN clientes cli ON mas.cliente_id = cli.id
       WHERE ci.token = $1`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/citas
 * Crear cita
 */
async function crear(req, res) {
  try {
    const { mascotaId, veterinarioId, tipo_servicio, fecha_hora, estado, motivo, notas, peso_cita } = req.body;
    const token = genToken();
    const id = `cit_${Date.now().toString().slice(-6)}`;

    // Verificar disponibilidad
    const fecha = fecha_hora.split('T')[0];
    const ocupados = await getOcupados(veterinarioId, fecha);
    const hora = fecha_hora.split('T')[1]?.substring(0, 5) || '00:00';
    if (ocupados.includes(hora)) {
      return res.status(409).json({ error: { code: 'SLOT_OCCUPIED', message: 'Este horario no está disponible' } });
    }

    const result = await pool.query(
      `INSERT INTO citas (id, mascota_id, veterinario_id, tipo_servicio, fecha_hora, estado, motivo, notas, token,
       confirmada_por_cliente, cancelada_por_cliente, peso_cita, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, $10, NOW(), NOW())
       RETURNING *`,
      [id, mascotaId, veterinarioId, tipo_servicio, fecha_hora, estado || 'pendiente', motivo || null, notas || null, token, peso_cita || null]
    );

    const nuevaCita = result.rows[0];

    // Regla de negocio: Si es cirugía con estado confirmada o atendida, crear hospitalización automáticamente
    if (tipo_servicio === 'cirugia' && (estado === 'confirmada' || estado === 'atendida')) {
      try {
        await pool.query(
          `INSERT INTO hospitalizaciones (id, mascota_id, veterinario_id, cita_id, fecha_ingreso, jaula_area, motivo, estado, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'hospitalizado', NOW())`,
          [
            `hos_${Date.now().toString().slice(-6)}`,
            mascotaId,
            veterinarioId,
            id,
            fecha_hora
          ]
        );
      } catch (hospitalErr) {
        console.error('Error creando hospitalización automática:', hospitalErr);
      }
    }

    // Si la cita se crea directamente como 'atendida', registrar peso, crear puntuación y auto-registrar vacunas/desparasitaciones
    if (estado === 'atendida') {
      // Registrar peso si se proporcionó
      if (peso_cita) {
        try {
          const pesoId = `pes_${Date.now().toString().slice(-6)}`;
          await pool.query(
            `INSERT INTO registros_peso (id, mascota_id, peso_kg, fecha, fecha_creacion)
             VALUES ($1, $2, $3, $4, NOW())`,
            [pesoId, mascotaId, peso_cita, fecha]
          );
        } catch (pesoErr) {
          console.error('Error registrando peso automático:', pesoErr);
        }
      }

      // Crear puntuación pendiente
      try {
        const pntToken = genToken();
        const pntId = `pnt_${Date.now().toString().slice(-6)}`;
        await pool.query(
          `INSERT INTO puntuaciones (id, cita_id, token, mascota_id, veterinario_id, calificacion, respondida, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5, 0, false, NOW())`,
          [pntId, id, pntToken, mascotaId, veterinarioId]
        );
      } catch (pntErr) {
        console.error('Error creando puntuación pendiente:', pntErr);
      }

      // Auto-crear vacuna si es tipo 'vacunacion'
      if (tipo_servicio === 'vacunacion') {
        try {
          const vacId = `vac_${Date.now().toString().slice(-6)}`;
          const nombreVacuna = motivo && motivo.trim().length > 0 ? motivo : 'Vacunación';
          // Calcular próxima dosis (1 año por defecto)
          const proximaDosis = new Date(fecha);
          proximaDosis.setFullYear(proximaDosis.getFullYear() + 1);
          await pool.query(
            `INSERT INTO vacunas (id, mascota_id, nombre, lote, fecha_aplicacion, proxima_dosis, veterinario_id, fecha_creacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [vacId, mascotaId, nombreVacuna, `AUTO-${fecha.replace(/-/g, '')}`, fecha, proximaDosis.toISOString().split('T')[0], veterinarioId]
          );
        } catch (vacErr) {
          console.error('Error creando vacuna automática:', vacErr);
        }
      }

      // Auto-crear desparasitación si es tipo 'desparasitacion'
      if (tipo_servicio === 'desparasitacion') {
        try {
          const desId = `des_${Date.now().toString().slice(-6)}`;
          const producto = motivo && motivo.trim().length > 0 ? motivo : 'Desparasitación';
          // Calcular próxima desparasitación (3 meses por defecto)
          const proximaDes = new Date(fecha);
          proximaDes.setMonth(proximaDes.getMonth() + 3);
          await pool.query(
            `INSERT INTO desparasitaciones (id, mascota_id, producto, dosis, fecha, proxima_dosis, veterinario_id, fecha_creacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [desId, mascotaId, producto, 'Según protocolo', fecha, proximaDes.toISOString().split('T')[0], veterinarioId]
          );
        } catch (desErr) {
          console.error('Error creando desparasitación automática:', desErr);
        }
      }
    }

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/citas/:id
 * Actualizar cita
 */
async function actualizar(req, res) {
  try {
    const { tipo_servicio, fecha_hora, estado, motivo, notas, peso_cita } = req.body;

    // No modificar cita atendida
    const current = await pool.query('SELECT estado FROM citas WHERE id = $1', [req.params.id]);
    if (current.rows.length > 0 && current.rows[0].estado === 'atendida') {
      return res.status(400).json({ error: { code: 'CANNOT_MODIFY', message: 'No se puede modificar una cita atendida' } });
    }

    const result = await pool.query(
      `UPDATE citas SET
       tipo_servicio = COALESCE($1, tipo_servicio), fecha_hora = COALESCE($2, fecha_hora),
       estado = COALESCE($3, estado), motivo = COALESCE($4, motivo), notas = COALESCE($5, notas),
       peso_cita = COALESCE($6, peso_cita), fecha_actualizacion = NOW()
       WHERE id = $7 RETURNING *`,
      [tipo_servicio, fecha_hora, estado, motivo, notas, peso_cita || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }

    const updatedCita = result.rows[0];

    // Si la cita se marca como 'atendida' y tiene peso, registrar peso, crear puntuación y auto-registrar vacunas/desparasitaciones
    if (estado === 'atendida') {
      const fecha = (updatedCita.fecha_hora && updatedCita.fecha_hora.split('T')[0]) || new Date().toISOString().split('T')[0];
      
      // Registrar peso si se proporcionó
      if (peso_cita) {
        try {
          const pesoId = `pes_${Date.now().toString().slice(-6)}`;
          await pool.query(
            `INSERT INTO registros_peso (id, mascota_id, peso_kg, fecha, fecha_creacion)
             VALUES ($1, $2, $3, $4, NOW())`,
            [pesoId, updatedCita.mascota_id, peso_cita, fecha]
          );
        } catch (pesoErr) {
          console.error('Error registrando peso automático:', pesoErr);
        }
      }

      // Crear puntuación pendiente
      try {
        const pntToken = genToken();
        const pntId = `pnt_${Date.now().toString().slice(-6)}`;
        await pool.query(
          `INSERT INTO puntuaciones (id, cita_id, token, mascota_id, veterinario_id, calificacion, respondida, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5, 0, false, NOW())`,
          [pntId, req.params.id, pntToken, updatedCita.mascota_id, updatedCita.veterinario_id]
        );
      } catch (pntErr) {
        console.error('Error creando puntuación pendiente:', pntErr);
      }

      // Auto-crear vacuna si es tipo 'vacunacion'
      if (updatedCita.tipo_servicio === 'vacunacion') {
        try {
          const vacId = `vac_${Date.now().toString().slice(-6)}`;
          const nombreVacuna = (updatedCita.motivo && updatedCita.motivo.trim().length > 0) ? updatedCita.motivo : 'Vacunación';
          // Calcular próxima dosis (1 año por defecto)
          const proximaDosis = new Date(fecha);
          proximaDosis.setFullYear(proximaDosis.getFullYear() + 1);
          await pool.query(
            `INSERT INTO vacunas (id, mascota_id, nombre, lote, fecha_aplicacion, proxima_dosis, veterinario_id, fecha_creacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [vacId, updatedCita.mascota_id, nombreVacuna, `AUTO-${fecha.replace(/-/g, '')}`, fecha, proximaDosis.toISOString().split('T')[0], updatedCita.veterinario_id]
          );
        } catch (vacErr) {
          console.error('Error creando vacuna automática:', vacErr);
        }
      }

      // Auto-crear desparasitación si es tipo 'desparasitacion'
      if (updatedCita.tipo_servicio === 'desparasitacion') {
        try {
          const desId = `des_${Date.now().toString().slice(-6)}`;
          const producto = (updatedCita.motivo && updatedCita.motivo.trim().length > 0) ? updatedCita.motivo : 'Desparasitación';
          // Calcular próxima desparasitación (3 meses por defecto)
          const proximaDes = new Date(fecha);
          proximaDes.setMonth(proximaDes.getMonth() + 3);
          await pool.query(
            `INSERT INTO desparasitaciones (id, mascota_id, producto, dosis, fecha, proxima_dosis, veterinario_id, fecha_creacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [desId, updatedCita.mascota_id, producto, 'Según protocolo', fecha, proximaDes.toISOString().split('T')[0], updatedCita.veterinario_id]
          );
        } catch (desErr) {
          console.error('Error creando desparasitación automática:', desErr);
        }
      }

      // Regla de negocio: Si es cirugía con estado confirmada o atendida, crear hospitalización automáticamente
      if (updatedCita.tipo_servicio === 'cirugia' && (estado === 'confirmada' || estado === 'atendida')) {
        try {
          await pool.query(
            `INSERT INTO hospitalizaciones (id, mascota_id, veterinario_id, cita_id, fecha_ingreso, jaula_area, motivo, estado, fecha_creacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'hospitalizado', NOW())`,
            [
              `hos_${Date.now().toString().slice(-6)}`,
              updatedCita.mascota_id,
              updatedCita.veterinario_id,
              req.params.id,
              updatedCita.fecha_hora
            ]
          );
        } catch (hospitalErr) {
          console.error('Error creando hospitalización automática (actualizar):', hospitalErr);
        }
      }
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * DELETE /api/citas/:id
 * Eliminar cita
 */
async function eliminar(req, res) {
  try {
    await pool.query('DELETE FROM citas WHERE id = $1', [req.params.id]);
    return res.json({ data: { deleted: true } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/citas/token/:token/confirmar
 * Confirmar cita (público)
 */
async function confirmarPorToken(req, res) {
  try {
    const ahora = nowEcuador().toJSDate();
    const result = await pool.query(
      `UPDATE citas SET estado = 'confirmada', fecha_confirmacion = $1,
       ultimo_cambio_por = 'cliente', confirmada_por_cliente = true, fecha_actualizacion = NOW()
       WHERE token = $2 RETURNING *`,
      [ahora, req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/citas/token/:token/cancelar
 * Cancelar cita (público)
 */
async function cancelarPorToken(req, res) {
  try {
    const { motivo } = req.body;
    const cita = await pool.query('SELECT * FROM citas WHERE token = $1', [req.params.token]);
    if (cita.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }

    // Verificar regla de 12 horas
    const citaHora = new Date(cita.rows[0].fecha_hora);
    const ahora = new Date();
    const horasRestantes = (citaHora - ahora) / (1000 * 60 * 60);
    if (horasRestantes < 12) {
      return res.status(400).json({ error: { code: 'TOO_LATE', message: 'Solo se pueden cancelar citas con más de 12 horas de anticipación' } });
    }

    const result = await pool.query(
      `UPDATE citas SET estado = 'cancelada', motivo_cancelacion = $1,
       ultimo_cambio_por = 'cliente', cancelada_por_cliente = true, fecha_actualizacion = NOW()
       WHERE token = $2 RETURNING *`,
      [motivo || 'Cancelada por el cliente', req.params.token]
    );
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/citas/token/:token/reprogramar
 * Reprogramar cita (público)
 */
async function reprogramarPorToken(req, res) {
  try {
    const { fecha_hora } = req.body;
    const cita = await pool.query('SELECT * FROM citas WHERE token = $1', [req.params.token]);
    if (cita.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }

    // Verificar regla de 12 horas
    const citaHora = new Date(cita.rows[0].fecha_hora);
    const ahora = new Date();
    const horasRestantes = (citaHora - ahora) / (1000 * 60 * 60);
    if (horasRestantes < 12) {
      return res.status(400).json({ error: { code: 'TOO_LATE', message: 'Solo se pueden reprogramar citas con más de 12 horas de anticipación' } });
    }

    const result = await pool.query(
      `UPDATE citas SET fecha_hora = $1, estado = 'pendiente',
       ultimo_cambio_por = 'cliente', fecha_actualizacion = NOW()
       WHERE token = $2 RETURNING *`,
      [fecha_hora, req.params.token]
    );
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/citas/veterinario/:vetId/slots
 * Slots ocupados para disponibilidad
 * Incluye: citas existentes + días bloqueados (todos los slots)
 */
async function getSlots(req, res) {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Fecha es requerida' } });
    }

    // Verificar si el día está bloqueado
    const bloqueoRes = await pool.query(
      `SELECT hb.*, v.nombre AS veterinario_nombre 
       FROM horarios_bloqueados hb 
       JOIN veterinarios v ON hb.veterinario_id = v.id 
       WHERE hb.veterinario_id = $1 AND hb.fecha = $2::date 
       LIMIT 1`,
      [req.params.vetId, fecha]
    );

    const estaBloqueado = bloqueoRes.rows.length > 0;
    const bloqueo = estaBloqueado ? bloqueoRes.rows[0] : null;

    if (estaBloqueado) {
      // Día bloqueado: devolver todos los slots y flag de bloqueo
      const todosSlots = [];
      for (let h = 8; h < 20; h++) {
        for (let m = 0; m < 60; m += 30) {
          todosSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }
      return res.json({
        data: {
          ocupados: todosSlots,
          bloqueado: true,
          motivo: bloqueo.motivo || null
        }
      });
    }

    const ocupados = await getOcupados(req.params.vetId, fecha);
    return res.json({ data: { ocupados, bloqueado: false } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, obtener, obtenerPorToken, crear, actualizar, eliminar, confirmarPorToken, cancelarPorToken, reprogramarPorToken, getSlots };
