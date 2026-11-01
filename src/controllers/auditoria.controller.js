const pool = require('../config/pool');
const { z } = require('zod');
const { errorEvent } = require('../services/security-events.service');
const auditService = require('../services/audit.service');

const mascotaParamsSchema = z.object({
  mascotaId: z.string().trim().min(1).max(128),
});

const referralExportSchema = z.object({
  incluyeRadiografias: z.boolean(),
});

/**
 * GET /api/auditoria
 * Listar registros de auditoría
 */
async function listar(req, res) {
  try {
    const { usuario, accion, entidad, desde, hasta, pagina = 1, limit = 20 } = req.query;
    const offset = (pagina - 1) * limit;

    let query = 'SELECT * FROM auditoria';
    const params = [];
    let paramCount = 1;
    const conditions = [];

    if (usuario) {
      conditions.push(`usuario ILIKE $${paramCount}`);
      params.push(`%${usuario}%`);
      paramCount++;
    }
    if (accion) {
      conditions.push(`accion = $${paramCount}`);
      params.push(accion);
      paramCount++;
    }
    if (entidad) {
      conditions.push(`entidad ILIKE $${paramCount}`);
      params.push(`%${entidad}%`);
      paramCount++;
    }
    if (desde) {
      conditions.push(`fecha_hora >= $${paramCount}`);
      params.push(desde);
      paramCount++;
    }
    if (hasta) {
      conditions.push(`fecha_hora <= $${paramCount}`);
      params.push(hasta);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY fecha_hora DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return res.json({ data: result.rows, meta: { pagina: parseInt(pagina), limit: parseInt(limit) } });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/auditoria/entidad/:entidad/:entidadId
 * Historial de una entidad
 */
async function historialEntidad(req, res) {
  try {
    const { entidad, entidadId } = req.params;
    const result = await pool.query(
      'SELECT * FROM auditoria WHERE entidad = $1 AND entidad_id = $2 ORDER BY fecha_hora DESC',
      [entidad, entidadId]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/auditoria/mascota/:mascotaId
 * Historial completo de una mascota y de todas sus entidades dependientes.
 */
async function historialMascota(req, res) {
  try {
    const parsed = mascotaParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El identificador de la mascota no es válido',
          details: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
        },
      });
    }

    const { mascotaId } = parsed.data;
    const result = await pool.query(
      `WITH audit_relations AS (
         SELECT DISTINCT entidad, entidad_id
         FROM auditoria
         WHERE COALESCE(
           valores_nuevos ->> 'mascota_id',
           valores_nuevos ->> 'mascotaId',
           valores_anteriores ->> 'mascota_id',
           valores_anteriores ->> 'mascotaId'
         ) = $1
       ),
       related_entities AS (
         SELECT 'Mascota'::text AS entidad, $1::text AS entidad_id
         UNION SELECT 'Cita', id::text FROM citas WHERE mascota_id = $1
         UNION SELECT 'CasoClinico', id::text FROM casos_clinicos WHERE mascota_id = $1
         UNION SELECT 'Vacuna', id::text FROM vacunas WHERE mascota_id = $1
         UNION SELECT 'Tratamiento', id::text FROM tratamientos WHERE mascota_id = $1
         UNION SELECT 'Desparasitacion', id::text FROM desparasitaciones WHERE mascota_id = $1
         UNION SELECT 'Cirugia', id::text FROM cirugias WHERE mascota_id = $1
         UNION SELECT 'Examen', id::text FROM examenes_adjuntos WHERE mascota_id = $1
         UNION SELECT 'Peso', id::text FROM registros_peso WHERE mascota_id = $1
         UNION SELECT 'Hospitalizacion', id::text FROM hospitalizaciones WHERE mascota_id = $1
         UNION SELECT 'Puntuacion', id::text FROM puntuaciones WHERE mascota_id = $1
         UNION SELECT 'Campana', segmento::text FROM campana_envios WHERE mascota_id = $1
         UNION SELECT 'CampanaEnvio', id::text FROM campana_envios WHERE mascota_id = $1
         UNION
           SELECT 'Medicacion', m.id::text
           FROM medicaciones_hospitalizacion m
           JOIN hospitalizaciones h ON h.id = m.hospitalizacion_id
           WHERE h.mascota_id = $1
         UNION
           SELECT 'Evolucion', e.id::text
           FROM evoluciones_hospitalizacion e
           JOIN hospitalizaciones h ON h.id = e.hospitalizacion_id
           WHERE h.mascota_id = $1
         UNION
           SELECT 'TomaMedicacion', t.id::text
           FROM tomas_medicacion t
           JOIN medicaciones_hospitalizacion m ON m.id = t.medicacion_id
           JOIN hospitalizaciones h ON h.id = m.hospitalizacion_id
           WHERE h.mascota_id = $1
         UNION
           SELECT 'TomaMedicacion', m.id::text
           FROM medicaciones_hospitalizacion m
           JOIN hospitalizaciones h ON h.id = m.hospitalizacion_id
           WHERE h.mascota_id = $1
         UNION SELECT entidad, entidad_id::text FROM audit_relations
       )
       SELECT a.*
       FROM auditoria a
       WHERE EXISTS (
         SELECT 1
         FROM related_entities r
         WHERE LOWER(r.entidad) = LOWER(a.entidad)
           AND r.entidad_id = a.entidad_id::text
       )
       ORDER BY a.fecha_hora DESC`,
      [mascotaId],
    );

    return res.json({ data: result.rows, meta: { mascotaId, total: result.rows.length } });
  } catch (err) {
    errorEvent(req, 'pet_audit_query_failed', err, { mascotaId: req.params?.mascotaId });
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'No fue posible consultar la auditoría de la mascota' } });
  }
}

/**
 * POST /api/auditoria/mascota/:mascotaId/exportacion
 * Registra la descarga de una referencia sin persistir su contenido clínico.
 */
async function registrarExportacionMascota(req, res) {
  try {
    const params = mascotaParamsSchema.safeParse(req.params);
    const body = referralExportSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      const issues = [
        ...(params.success ? [] : params.error.issues),
        ...(body.success ? [] : body.error.issues),
      ];
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos de la exportación no son válidos',
          details: issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
        },
      });
    }

    await auditService.log(
      req.user?.nombre || 'Sistema',
      req.user?.rol || 'sistema',
      'consultar',
      'Mascota',
      params.data.mascotaId,
      null,
      {
        tipo: 'referencia_pdf_anonimizada',
        incluye_radiografias: body.data.incluyeRadiografias,
      },
      null,
      req.ip,
      req.headers['user-agent'],
    );
    return res.status(201).json({ data: { registered: true } });
  } catch (err) {
    errorEvent(req, 'pet_referral_export_audit_failed', err, { mascotaId: req.params?.mascotaId });
    return res.status(500).json({ error: { code: 'AUDIT_ERROR', message: 'No fue posible registrar la exportación' } });
  }
}

module.exports = { listar, historialEntidad, historialMascota, registrarExportacionMascota };
