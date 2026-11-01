const { securityEvent } = require('../services/security-events.service');

const CLINICAL_FIELDS = new Set(['alergias', 'notas', 'diagnostico', 'soap', 'pronostico']);

function denyClinicalFieldsForReceptionist(req, res, next) {
  if (req.user?.rol !== 'recepcionista') return next();
  const attempted = Object.keys(req.body || {}).filter(field => CLINICAL_FIELDS.has(field));
  if (attempted.length === 0) return next();

  securityEvent(req, 'clinical_field_access_denied', { fields: attempted });
  return res.status(403).json({
    error: {
      code: 'CLINICAL_DATA_FORBIDDEN',
      message: 'El rol recepcionista no puede modificar información clínica',
    },
  });
}

function sanitizePetForRole(row, role) {
  if (!row || role !== 'recepcionista') return row;
  const { alergias, notas, ...administrativeData } = row;
  return administrativeData;
}

function sanitizeAppointmentForRole(row, role) {
  if (!row || role !== 'recepcionista') return row;
  const { notas, peso_cita, ...administrativeData } = row;
  return administrativeData;
}

module.exports = { denyClinicalFieldsForReceptionist, sanitizePetForRole, sanitizeAppointmentForRole };
