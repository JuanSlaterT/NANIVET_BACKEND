const pool = require('../config/pool');

/**
 * Genera todas las tomas basándose en horasProgramadas y rango de fechas.
 * Combina tomas administradas (desde DB) con tomas pendientes (generadas dinámicamente).
 */
function generarTomasAutomaticas(medicacion, tomasDB) {
  const tomas = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let inicio = new Date(medicacion.fecha_inicio);
  inicio.setHours(0, 0, 0, 0);

  // Si no tiene fechaFin, usar hoy (no generar tomas futuras)
  let fin = medicacion.fecha_fin ? new Date(medicacion.fecha_fin) : hoy;
  fin.setHours(0, 0, 0, 0);

  // Crear mapa de tomas ya administradas (desde DB) para referencia rápida
  const tomasMap = new Map();
  if (Array.isArray(tomasDB)) {
    for (const toma of tomasDB) {
      const key = `${toma.fecha}_${toma.hora_programada}`;
      tomasMap.set(key, toma);
    }
  }

  // Iterar por cada día en el rango
  const dia = new Date(inicio);
  while (dia <= fin) {
    const fechaStr = dia.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Para cada hora programada
    let horas;
    try {
      horas = JSON.parse(medicacion.horas_programadas);
    } catch (e) {
      horas = [];
    }

    for (const hora of horas) {
      const key = `${fechaStr}_${hora}`;
      const tomaExistente = tomasMap.get(key);

      tomas.push({
        fecha: fechaStr,
        hora: hora,
        administrada: tomaExistente ? tomaExistente.administrada : false,
        horaReal: tomaExistente ? tomaExistente.hora_real : null,
        usuario: tomaExistente ? tomaExistente.usuario_administro : null,
      });
    }

    // Avanzar al siguiente día
    dia.setDate(dia.getDate() + 1);
  }

  return tomas;
}

/**
 * GET /api/medicaciones
 * Listar todas las medicaciones (con filtros opcionales)
 * Genera tomas automáticamente basándose en horasProgramadas × fechas
 */
async function listar(req, res) {
  try {
    const { hospitalizacionId, mascotaId } = req.query;
    const db = pool;

    // Primera consulta: obtener medicaciones sin tomas
    let query = `
      SELECT m.*,
        h.id AS hospitalizacion_id,
        h.mascota_id,
        mas.nombre AS mascota_nombre
      FROM medicaciones_hospitalizacion m
      JOIN hospitalizaciones h ON m.hospitalizacion_id = h.id
      JOIN mascotas mas ON h.mascota_id = mas.id
    `;
    const params = [];
    let paramCount = 1;

    if (hospitalizacionId) {
      query += ` WHERE m.hospitalizacion_id = $${paramCount}`;
      params.push(hospitalizacionId);
      paramCount++;
    }
    if (mascotaId) {
      query += ` ${hospitalizacionId ? 'AND' : 'WHERE'} h.mascota_id = $${paramCount}`;
      params.push(mascotaId);
      paramCount++;
    }

    query += ` ORDER BY m.fecha_inicio`;
    const result = await db.query(query, params);

    // Segunda consulta: obtener solo tomas administradas desde DB
    let tomasQuery = `
      SELECT tm.medicacion_id, tm.fecha, tm.hora_programada, tm.administrada, tm.hora_real, tm.usuario_administro
      FROM tomas_medicacion tm
      WHERE tm.administrada = true
    `;
    const tomasParams = [];
    let tomasParamCount = 1;

    if (hospitalizacionId) {
      tomasQuery += ` JOIN medicaciones_hospitalizacion m ON tm.medicacion_id = m.id WHERE m.hospitalizacion_id = $${tomasParamCount}`;
      tomasParams.push(hospitalizacionId);
      tomasParamCount++;
    }
    if (mascotaId) {
      tomasQuery += ` ${hospitalizacionId ? 'AND' : 'WHERE'} EXISTS (SELECT 1 FROM medicaciones_hospitalizacion m2 JOIN hospitalizaciones h2 ON m2.hospitalizacion_id = h2.id WHERE tm.medicacion_id = m2.id ${hospitalizacionId ? 'AND' : 'AND'} h2.mascota_id = $${tomasParamCount})`;
      tomasParams.push(mascotaId);
      tomasParamCount++;
    }

    const tomasResult = await db.query(tomasQuery, tomasParams);

    // Agrupar tomas por medicacion_id
    const tomasPorMedicacion = {};
    for (const toma of tomasResult.rows) {
      if (!tomasPorMedicacion[toma.medicacion_id]) {
        tomasPorMedicacion[toma.medicacion_id] = [];
      }
      tomasPorMedicacion[toma.medicacion_id].push(toma);
    }

    // Construir respuesta con tomas generadas automáticamente
    const medicaciones = result.rows.map(med => {
      const tomasDB = tomasPorMedicacion[med.id] || [];
      const tomas = generarTomasAutomaticas(med, tomasDB);

      return {
        ...med,
        tomas: tomas,
      };
    });

    return res.json({ data: medicaciones });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/hospitalizaciones/:id/medicaciones
 * Listar medicaciones de una hospitalización (legacy)
 * Genera tomas automáticamente
 */
async function listarMedicaciones(req, res) {
  try {
    const db = pool;
    const result = await db.query(
      'SELECT * FROM medicaciones_hospitalizacion WHERE hospitalizacion_id = $1 ORDER BY fecha_inicio',
      [req.params.id]
    );

    // Obtener tomas administradas desde DB
    const tomasResult = await db.query(
      `SELECT tm.* FROM tomas_medicacion tm
       JOIN medicaciones_hospitalizacion m ON tm.medicacion_id = m.id
       WHERE m.hospitalizacion_id = $1 AND tm.administrada = true`,
      [req.params.id]
    );

    // Agrupar tomas por medicacion_id
    const tomasPorMedicacion = {};
    for (const toma of tomasResult.rows) {
      if (!tomasPorMedicacion[toma.medicacion_id]) {
        tomasPorMedicacion[toma.medicacion_id] = [];
      }
      tomasPorMedicacion[toma.medicacion_id].push(toma);
    }

    // Construir respuesta con tomas generadas automáticamente
    const medicaciones = result.rows.map(med => {
      const tomasDB = tomasPorMedicacion[med.id] || [];
      const tomas = generarTomasAutomaticas(med, tomasDB);

      return {
        ...med,
        tomas: tomas,
      };
    });

    return res.json({ data: medicaciones });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/hospitalizaciones/:id/medicaciones
 * Crear medicación
 */
async function crearMedicacion(req, res) {
  try {
    const { medicamento, dosis, via, frecuencia, horas_programadas, fecha_inicio, fecha_fin } = req.body;
    const id = genUuid();
    req.entityId = id; // Para auditoría
    const db = pool;

    const result = await db.query(
      `INSERT INTO medicaciones_hospitalizacion (id, hospitalizacion_id, medicamento, dosis, via, frecuencia, horas_programadas, fecha_inicio, fecha_fin, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, NOW())
       RETURNING *`,
      [id, req.params.id, medicamento, dosis, via, frecuencia, JSON.stringify(horas_programadas), fecha_inicio, fecha_fin || null]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/medicaciones/:id
 * Actualizar medicación
 */
async function actualizar(req, res) {
  try {
    const { medicamento, dosis, via, frecuencia, horasProgramadas, fechaInicio, fechaFin } = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (medicamento) { fields.push(`medicamento = $${paramCount}`); values.push(medicamento); paramCount++; }
    if (dosis) { fields.push(`dosis = $${paramCount}`); values.push(dosis); paramCount++; }
    if (via) { fields.push(`via = $${paramCount}`); values.push(via); paramCount++; }
    if (frecuencia) { fields.push(`frecuencia = $${paramCount}`); values.push(frecuencia); paramCount++; }
    if (horasProgramadas) { fields.push(`horas_programadas = $${paramCount}::jsonb`); values.push(JSON.stringify(horasProgramadas)); paramCount++; }
    if (fechaInicio) { fields.push(`fecha_inicio = $${paramCount}`); values.push(fechaInicio); paramCount++; }
    if (fechaFin !== undefined) { fields.push(`fecha_fin = $${paramCount}`); values.push(fechaFin || null); paramCount++; }

    if (fields.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No hay campos para actualizar' } });
    }

    fields.push(`fecha_actualizacion = NOW()`);
    const query = `UPDATE medicaciones_hospitalizacion SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(req.params.id);
    const db = pool;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Medicación no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/medicaciones/:id/tomas
 * Registrar una toma de medicación
 */
async function registrarToma(req, res) {
  try {
    const { fecha, hora, administrada, horaReal, usuario } = req.body;
    const { id } = req.params;
    const db = pool;

    // Verificar si ya existe una toma con la misma fecha y hora
    const existing = await db.query(
      `SELECT id FROM tomas_medicacion WHERE medicacion_id = $1 AND fecha = $2 AND hora_programada = $3`,
      [id, fecha, hora]
    );

    if (existing.rows.length > 0) {
      // Actualizar la toma existente
      const result = await db.query(
        `UPDATE tomas_medicacion SET administrada = $1, hora_real = $2, usuario_administro = $3, fecha_creacion = NOW()
         WHERE medicacion_id = $4 AND fecha = $5 AND hora_programada = $6
         RETURNING *`,
        [administrada || false, horaReal || null, usuario || req.user.nombre, id, fecha, hora]
      );
      return res.json({ data: result.rows[0] });
    } else {
      // Crear nueva toma
      const tomaId = genUuid();
      const result = await db.query(
        `INSERT INTO tomas_medicacion (id, medicacion_id, fecha, hora_programada, administrada, hora_real, usuario_administro, fecha_creacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [tomaId, id, fecha, hora, administrada || false, horaReal || null, usuario || req.user.nombre]
      );
      return res.status(201).json({ data: result.rows[0] });
    }
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * PUT /api/medicaciones/:medId/tomas/:tomaId/administrar
 * Marcar toma como administrada (legacy endpoint)
 */
async function administrarToma(req, res) {
  try {
    const { horaReal } = req.body;
    const { medId, tomaId } = req.params;
    const db = pool;

    const result = await db.query(
      `UPDATE tomas_medicacion SET administrada = true, hora_real = $1, usuario_administro = $2
       WHERE id = $3 AND medicacion_id = $4
       RETURNING *`,
      [horaReal, req.user.nombre, tomaId, medId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Toma no encontrada' } });
    }
    return res.json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { listar, listarMedicaciones, crearMedicacion, actualizar, registrarToma, administrarToma };
