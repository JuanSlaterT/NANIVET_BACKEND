const iaService = require('../services/ia.service');

/**
 * POST /api/ia/resumir-historia
 * Resumir historia clínica
 */
async function resumirHistoria(req, res) {
  try {
    const { mascotaId } = req.body;
    if (!mascotaId) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'mascotaId es requerido' } });
    }
    const result = await iaService.resumirHistoria(mascotaId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/ia/notas-a-soap
 * Convertir notas a SOAP
 */
async function notasASOAP(req, res) {
  try {
    const { mascotaId, notasLibres } = req.body;
    if (!mascotaId || !notasLibres) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'mascotaId y notasLibres son requeridos' } });
    }
    const result = await iaService.notasASOAP({ mascotaId, notasLibres });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/ia/redactar-mensaje
 * Redactar mensaje para dueño
 */
async function redactarMensaje(req, res) {
  try {
    const { tipo, mascotaNombre, duenoNombre, detalles } = req.body;
    if (!tipo || !mascotaNombre || !duenoNombre) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'tipo, mascotaNombre y duenoNombre son requeridos' } });
    }
    const result = await iaService.redactarMensaje({ tipo, mascotaNombre, duenoNombre, detalles });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

/**
 * POST /api/ia/diferenciales
 * Diagnósticos diferenciales
 */
async function diferenciales(req, res) {
  try {
    const result = await iaService.diagnosticosDiferenciales(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } });
  }
}

module.exports = { resumirHistoria, notasASOAP, redactarMensaje, diferenciales };
