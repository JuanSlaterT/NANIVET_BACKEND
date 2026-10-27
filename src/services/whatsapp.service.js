/**
 * Normaliza un número de teléfono ecuatoriano a formato internacional
 * De: 09XXXXXXXX -> +5939XXXXXXXX
 * @param {string} telefono - Número en formato local
 * @returns {string} Número en formato internacional
 */
function normalizePhone(telefono) {
  if (!telefono) return null;
  // Quitar espacios, guiones, paréntesis
  const clean = telefono.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('09')) {
    return `+593${clean.substring(1)}`;
  }
  if (clean.startsWith('+593')) {
    return clean;
  }
  return `+593${clean}`;
}

/**
 * Genera un enlace de WhatsApp con mensaje predefinido
 * @param {string} telefono - Número en formato local o internacional
 * @param {Object} variables - Variables para reemplazar en el mensaje
 * @returns {string} Enlace wa.me
 */
function generateWhatsAppLink(telefono, variables = {}) {
  const normalized = normalizePhone(telefono);
  const number = normalized.replace('+', '');

  // Variables de plantilla
  let message = 'Hola {{dueno}}, le recordamos de NANIVET:';

  if (variables.mascota) {
    message = message.replace('{{mascota}}', variables.mascota);
  }
  if (variables.dueno) {
    message = message.replace('{{dueno}}', variables.dueno);
  }
  if (variables.fecha) {
    message = message.replace('{{fecha}}', variables.fecha);
  }
  if (variables.hora) {
    message = message.replace('{{hora}}', variables.hora);
  }
  if (variables.servicio) {
    message = message.replace('{{servicio}}', variables.servicio);
  }
  if (variables.motivo) {
    message = message.replace('{{motivo}}', variables.motivo);
  }

  // Reemplazar todas las variables restantes
  message = message.replace(/\{\{[^}]+\}\}/g, '');

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encodedMessage}`;
}

/**
 * Genera enlace de cita pública
 * @param {string} token - Token de la cita
 * @returns {string} Enlace relativo
 */
function generateCitaLink(token) {
  return `/#/agendar/cita/${token}`;
}

/**
 * Genera enlace de puntuación pública
 * @param {string} token - Token de la puntuación
 * @returns {string} Enlace relativo
 */
function generatePuntuacionLink(token) {
  return `/#/puntuar/${token}`;
}

module.exports = {
  normalizePhone,
  generateWhatsAppLink,
  generateCitaLink,
  generatePuntuacionLink
};
