const pool = require('../config/pool');
const { genToken } = require('../utils/genToken');
const { nowEcuador, parseClinicDateTime, clinicDateISO, toEcuador } = require('../utils/dates');
const { getOcupados } = require('../services/availability.service');
const { genUuid } = require('../utils/genUuid');
const { errorEvent } = require('../services/security-events.service');
const { sanitizeAppointmentForRole } = require('../middleware/clinical-access.middleware');
/**
 * GET /api/citas
 * Listar citas con filtros (requiere autenticación)
 */
async function listar(req, res) {
  try {
    const { fecha, veterinarioId, estado, mascotaId } = req.query;
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
    const filters = [];

    if (fecha) {
      params.push(fecha);
      filters.push(`(ci.fecha_hora AT TIME ZONE 'America/Guayaquil')::date = $${params.length}::date`);
    }
    if (veterinarioId) {
      params.push(veterinarioId);
      filters.push(`ci.veterinario_id = $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      filters.push(`ci.estado = $${params.length}`);
    }
    if (mascotaId) {
      params.push(mascotaId);
      filters.push(`ci.mascota_id = $${params.length}`);
    }

    if (filters.length > 0) {
      query += ` WHERE ${filters.join(' AND ')}`;
    }

    query += ' ORDER BY ci.fecha_hora DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows.map(row => sanitizeAppointmentForRole(row, req.user?.rol)) });
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
        SELECT ci.id, ci.tipo_servicio, ci.fecha_hora, ci.estado,
               mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
               v.nombre AS veterinario_nombre
        FROM citas ci
        JOIN mascotas mas ON ci.mascota_id = mas.id
        JOIN veterinarios v ON ci.veterinario_id = v.id
        WHERE ci.veterinario_id = $1
          AND (ci.fecha_hora AT TIME ZONE 'America/Guayaquil')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date
          AND (ci.fecha_hora AT TIME ZONE 'America/Guayaquil')::date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date + 14
        ORDER BY ci.fecha_hora ASC
      `,
      [vetId]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    errorEvent(req, 'appointment_upcoming_list_failed', err);
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
    return res.json({ data: sanitizeAppointmentForRole(result.rows[0], req.user?.rol) });
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
      `SELECT ci.id, ci.mascota_id, ci.veterinario_id, ci.tipo_servicio, ci.fecha_hora, ci.estado, ci.motivo,
              ci.confirmada_por_cliente, ci.cancelada_por_cliente,
              mas.nombre AS mascota_nombre, mas.especie AS mascota_especie,
              v.nombre AS veterinario_nombre
       FROM citas ci
       JOIN mascotas mas ON ci.mascota_id = mas.id
       JOIN veterinarios v ON ci.veterinario_id = v.id
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
    const { mascota_id: mascotaId, veterinario_id: veterinarioId, tipo_servicio, fecha_hora, estado, motivo, notas, peso_cita } = req.body;
    const fechaHora = parseClinicDateTime(fecha_hora);
    if (!fechaHora) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'fecha_hora no es válida' } });
    }

    const id = genUuid();
    req.entityId = id; // Para auditoría
    const token = genToken();
    // Verificar disponibilidad
    const fecha = clinicDateISO(fechaHora);
    const ocupados = await getOcupados(veterinarioId, fecha);
    const hora = toEcuador(fechaHora).toFormat('HH:mm');
    if (ocupados.includes(hora)) {
      return res.status(409).json({ error: { code: 'SLOT_OCCUPIED', message: 'Este horario no está disponible' } });
    }

    const result = await pool.query(
      `INSERT INTO citas (id, mascota_id, veterinario_id, tipo_servicio, fecha_hora, estado, motivo, notas, token,
       confirmada_por_cliente, cancelada_por_cliente, peso_cita, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, $10, NOW(), NOW())
       RETURNING *`,
      [id, mascotaId, veterinarioId, tipo_servicio, fechaHora, estado || 'pendiente', motivo || null, notas || null, token, peso_cita || null]
    );

    const nuevaCita = result.rows[0];

    // Regla de negocio: Si es cirugía con estado confirmada o atendida, crear hospitalización automáticamente
    if (tipo_servicio === 'cirugia' && (estado === 'confirmada' || estado === 'atendida')) {
      try {
        await pool.query(
          `INSERT INTO hospitalizaciones (id, mascota_id, veterinario_id, cita_id, fecha_ingreso, jaula_area, motivo, estado, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'hospitalizado', NOW())`,
          [
            genUuid(),
            mascotaId,
            veterinarioId,
            id,
            fechaHora,
            'Por asignar',
            motivo || 'Cirugía'
          ]
        );
      } catch (hospitalErr) {
        errorEvent(req, 'automatic_hospitalization_failed', hospitalErr, { appointmentId: id });
      }
    }

    // Si la cita se crea directamente como 'atendida', registrar peso, crear puntuación y auto-registrar vacunas/desparasitaciones
    if (estado === 'atendida') {
      // Registrar peso si se proporcionó
      if (peso_cita) {
        try {
          const pesoId = genUuid();
          await pool.query(
            `INSERT INTO registros_peso (id, mascota_id, peso_kg, fecha, fecha_creacion)
             VALUES ($1, $2, $3, $4, NOW())`,
            [pesoId, mascotaId, peso_cita, fecha]
          );
        } catch (pesoErr) {
          errorEvent(req, 'automatic_weight_failed', pesoErr, { appointmentId: id });
        }
      }

      // Crear puntuación pendiente
      try {
        const pntToken = genToken();
        const pntId = genUuid();
        await pool.query(
          `INSERT INTO puntuaciones (id, cita_id, token, mascota_id, veterinario_id, calificacion, respondida, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5, 0, false, NOW())`,
          [pntId, id, pntToken, mascotaId, veterinarioId]
        );
      } catch (pntErr) {
        errorEvent(req, 'automatic_rating_failed', pntErr, { appointmentId: id });
      }

      // Auto-crear vacuna si es tipo 'vacunacion'
      if (tipo_servicio === 'vacunacion') {
        try {
          const vacId = genUuid();
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
          errorEvent(req, 'automatic_vaccine_failed', vacErr, { appointmentId: id });
        }
      }

      // Auto-crear desparasitación si es tipo 'desparasitacion'
      if (tipo_servicio === 'desparasitacion') {
        try {
          const desId = genUuid();
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
          errorEvent(req, 'automatic_deworming_failed', desErr, { appointmentId: id });
        }
      }
    }

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    errorEvent(req, 'appointment_create_failed', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/citas/:id
 * Actualizar cita
 */
async function actualizar(req, res) {
  try {
    const {
      mascota_id: mascotaId,
      veterinario_id: veterinarioId,
      tipo_servicio,
      fecha_hora,
      estado,
      motivo,
      notas,
      peso_cita,
    } = req.body;
    const fechaHora = fecha_hora ? parseClinicDateTime(fecha_hora) : null;
    if (fecha_hora && !fechaHora) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'fecha_hora no es válida' } });
    }

    // No modificar cita atendida
    const current = await pool.query('SELECT estado, veterinario_id, fecha_hora FROM citas WHERE id = $1', [req.params.id]);
    if (current.rows.length > 0 && current.rows[0].estado === 'atendida') {
      return res.status(400).json({ error: { code: 'CANNOT_MODIFY', message: 'No se puede modificar una cita atendida' } });
    }
    if (current.rows.length > 0 && (fechaHora || veterinarioId)) {
      const targetVet = veterinarioId || current.rows[0].veterinario_id;
      const targetDateTime = fechaHora || current.rows[0].fecha_hora;
      const occupied = await pool.query(
        `SELECT 1 FROM citas
         WHERE veterinario_id = $1 AND fecha_hora = $2 AND id != $3 AND estado != 'cancelada'
         LIMIT 1`,
        [targetVet, targetDateTime, req.params.id]
      );
      if (occupied.rows.length > 0) {
        return res.status(409).json({ error: { code: 'SLOT_OCCUPIED', message: 'Este horario no está disponible' } });
      }
    }

    const result = await pool.query(
      `UPDATE citas SET
       mascota_id = COALESCE($1, mascota_id), veterinario_id = COALESCE($2, veterinario_id),
       tipo_servicio = COALESCE($3, tipo_servicio), fecha_hora = COALESCE($4, fecha_hora),
       estado = COALESCE($5, estado), motivo = COALESCE($6, motivo), notas = COALESCE($7, notas),
       peso_cita = COALESCE($8, peso_cita), fecha_actualizacion = NOW()
       WHERE id = $9 RETURNING *`,
      [mascotaId, veterinarioId, tipo_servicio, fechaHora, estado, motivo, notas, peso_cita || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    }

    const updatedCita = result.rows[0];

    // Si la cita se marca como 'atendida' y tiene peso, registrar peso, crear puntuación y auto-registrar vacunas/desparasitaciones
    if (estado === 'atendida') {
      const fecha = clinicDateISO(updatedCita.fecha_hora) || nowEcuador().toISODate();

      // Registrar peso si se proporcionó
      if (peso_cita) {
        try {
          const pesoId = genUuid();
          await pool.query(
            `INSERT INTO registros_peso (id, mascota_id, peso_kg, fecha, fecha_creacion)
             VALUES ($1, $2, $3, $4, NOW())`,
            [pesoId, updatedCita.mascota_id, peso_cita, fecha]
          );
        } catch (pesoErr) {
          errorEvent(req, 'automatic_weight_failed', pesoErr, { appointmentId: req.params.id });
        }
      }

      // Crear puntuación pendiente
      try {
        const pntToken = genToken();
        const pntId = genUuid();
        await pool.query(
          `INSERT INTO puntuaciones (id, cita_id, token, mascota_id, veterinario_id, calificacion, respondida, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5, 0, false, NOW())`,
          [pntId, req.params.id, pntToken, updatedCita.mascota_id, updatedCita.veterinario_id]
        );
      } catch (pntErr) {
        errorEvent(req, 'automatic_rating_failed', pntErr, { appointmentId: req.params.id });
      }

      // Auto-crear vacuna si es tipo 'vacunacion'
      if (updatedCita.tipo_servicio === 'vacunacion') {
        try {
          const vacId = genUuid();
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
          errorEvent(req, 'automatic_vaccine_failed', vacErr, { appointmentId: req.params.id });
        }
      }

      // Auto-crear desparasitación si es tipo 'desparasitacion'
      if (updatedCita.tipo_servicio === 'desparasitacion') {
        try {
          const desId = genUuid();
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
          errorEvent(req, 'automatic_deworming_failed', desErr, { appointmentId: req.params.id });
        }
      }

    }

    // Una cirugía confirmada o atendida debe tener exactamente una hospitalización asociada.
    if (updatedCita.tipo_servicio === 'cirugia' && (estado === 'confirmada' || estado === 'atendida')) {
      try {
        await pool.query(
          `INSERT INTO hospitalizaciones
           (id, mascota_id, veterinario_id, cita_id, fecha_ingreso, jaula_area, motivo, estado, fecha_creacion)
           SELECT $1, $2, $3, $4, $5, $6, $7, 'hospitalizado', NOW()
           WHERE NOT EXISTS (SELECT 1 FROM hospitalizaciones WHERE cita_id = $4)`,
          [
            genUuid(),
            updatedCita.mascota_id,
            updatedCita.veterinario_id,
            req.params.id,
            updatedCita.fecha_hora,
            'Por asignar',
            updatedCita.motivo || 'Cirugía',
          ]
        );
      } catch (hospitalErr) {
        errorEvent(req, 'automatic_hospitalization_failed', hospitalErr, { appointmentId: req.params.id });
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
       WHERE token = $2
       RETURNING id, mascota_id, veterinario_id, tipo_servicio, fecha_hora, estado, motivo,
                 confirmada_por_cliente, cancelada_por_cliente`,
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
       WHERE token = $2
       RETURNING id, mascota_id, veterinario_id, tipo_servicio, fecha_hora, estado, motivo,
                 motivo_cancelacion, confirmada_por_cliente, cancelada_por_cliente`,
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
    const fechaHora = req.body.fecha_hora || req.body.nueva_fecha_hora || req.body.nuevaFechaHora;
    const nuevaFechaHora = parseClinicDateTime(fechaHora);
    if (!nuevaFechaHora) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'La nueva fecha y hora no es válida' } });
    }
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

    const occupied = await pool.query(
      `SELECT 1 FROM citas
       WHERE veterinario_id = $1 AND fecha_hora = $2 AND id != $3 AND estado != 'cancelada'
       LIMIT 1`,
      [cita.rows[0].veterinario_id, nuevaFechaHora, cita.rows[0].id]
    );
    if (occupied.rows.length > 0) {
      return res.status(409).json({ error: { code: 'SLOT_OCCUPIED', message: 'Este horario no está disponible' } });
    }

    const result = await pool.query(
      `UPDATE citas SET fecha_hora = $1, estado = 'pendiente',
       ultimo_cambio_por = 'cliente', fecha_actualizacion = NOW()
       WHERE token = $2
       RETURNING id, mascota_id, veterinario_id, tipo_servicio, fecha_hora, estado, motivo,
                 confirmada_por_cliente, cancelada_por_cliente`,
      [nuevaFechaHora, req.params.token]
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

module.exports = { listar, obtener, obtenerPorToken, obtenerProximasPorVeterinario, crear, actualizar, eliminar, confirmarPorToken, cancelarPorToken, reprogramarPorToken, getSlots };
