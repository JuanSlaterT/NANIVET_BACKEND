const pool = require('../config/pool');
const campanaService = require('../services/campana.service');
const { normalizePhone, generateWhatsAppLink } = require('../services/whatsapp.service');
const { nowEcuador } = require('../utils/dates');

/**
 * GET /api/campanas/segmentos
 * Obtener segmentos calculados
 */
async function obtenerSegmentos(req, res) {
  try {
    const segmentos = await campanaService.calcularSegmentos();
    return res.json({ data: segmentos });
  } catch (err) {
    console.error('Error en segmentos:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * GET /api/campanas/envios
 * Listar envíos de campañas
 */
async function listarEnvios(req, res) {
  try {
    const { segmento } = req.query;
    let query = `
      SELECT ce.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
             m.nombre AS mascota_nombre
      FROM campana_envios ce
      JOIN clientes c ON ce.cliente_id = c.id
      LEFT JOIN mascotas m ON ce.mascota_id = m.id
    `;
    const params = [];
    let paramCount = 1;

    if (segmento) {
      query += ` WHERE ce.segmento = $${paramCount}`;
      params.push(segmento);
      paramCount++;
    }

    query += ' ORDER BY ce.fecha_enviado DESC';
    const result = await pool.query(query, params);
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/campanas/enviar
 * Enviar campaña a un segmento
 */
async function enviarCampana(req, res) {
  try {
    const { segmento, enviados } = req.body;
    const usuario = req.user?.nombre || 'Sistema';
    const rol = req.user?.rol || 'sistema';

    if (!segmento || !enviados || !Array.isArray(enviados)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'segmento y enviados (array) son requeridos' }
      });
    }

    const ahora = nowEcuador().toJSDate();
    const resultados = { exitosos: 0, fallidos: 0, detalles: [] };

    for (const envio of enviados) {
      try {
        // Insertar registro de envío
        await pool.query(
          `INSERT INTO campana_envios (id, segmento, cliente_id, mascota_id, motivo, fecha_enviado, enviado_por)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `cme_${Date.now().toString().slice(-6)}`,
            segmento,
            envio.clienteId,
            envio.mascotaId || null,
            envio.motivo,
            ahora,
            usuario
          ]
        );

        // Generar enlace de WhatsApp si tiene teléfono
        let whatsappLink = null;
        if (envio.telefono) {
          whatsappLink = generateWhatsAppLink(envio.telefono, {
            dueno: envio.dueno || '',
            mascota: envio.mascota || '',
            motivo: envio.motivo || ''
          });
        }

        resultados.exitosos++;
        resultados.detalles.push({
          clienteId: envio.clienteId,
          estado: 'enviado',
          whatsappLink
        });
      } catch (envioErr) {
        resultados.fallidos++;
        resultados.detalles.push({
          clienteId: envio.clienteId,
          estado: 'error',
          error: envioErr.message
        });
      }
    }

    // Log de auditoría
    const auditService = require('../services/audit.service');
    await auditService.log(
      usuario,
      rol,
      'enviar_campaña',
      'Campana',
      segmento,
      null,
      { segmento, total: enviados.length, exitosos: resultados.exitosos, fallidos: resultados.fallidos },
      null,
      req.ip,
      req.headers['user-agent']
    ).catch(() => {});

    return res.json({
      data: resultados,
      message: `Campaña enviada: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`
    });
  } catch (err) {
    console.error('Error enviando campaña:', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { obtenerSegmentos, listarEnvios, enviarCampana };
