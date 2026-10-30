const iaService = require('../services/ia.service');

function handleIAError(err, res) {
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code || 'SERVER_ERROR';
  const publicMessage = statusCode === 500 ? 'Error interno del servidor' : err.message;

  console.error(`[IA] ${code}: ${err.message}`);
  return res.status(statusCode).json({ error: { code, message: publicMessage } });
}

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
    return handleIAError(err, res);
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
    return handleIAError(err, res);
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
    return handleIAError(err, res);
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
    return handleIAError(err, res);
  }
}

module.exports = { resumirHistoria, notasASOAP, redactarMensaje, diferenciales };
