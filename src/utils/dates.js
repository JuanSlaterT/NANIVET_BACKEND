const { DateTime } = require('luxon');

/**
 * Obtiene la fecha/hora actual en zona horaria America/Guayaquil (UTC-5)
 * @returns {DateTime} DateTime en zona de Ecuador
 */
function nowEcuador() {
  return DateTime.now().setZone('America/Guayaquil');
}

/**
 * Convierte un Date/DateTime/String a zona horaria de Ecuador
 * @param {Date|DateTime|string} date - Fecha a convertir
 * @returns {DateTime} DateTime en zona de Ecuador
 */
function toEcuador(date) {
  if (typeof date === 'string') {
    const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(date);
    const parsed = hasExplicitZone
      ? DateTime.fromISO(date, { setZone: true })
      : DateTime.fromISO(date, { zone: 'America/Guayaquil' });
    return parsed.setZone('America/Guayaquil');
  }
  if (date instanceof Date) {
    return DateTime.fromJSDate(date).setZone('America/Guayaquil');
  }
  return date.setZone('America/Guayaquil');
}

/** Interpreta fechas sin offset como hora local de la clínica y devuelve un ISO absoluto. */
function parseClinicDateTime(date) {
  const parsed = toEcuador(date);
  return parsed.isValid ? parsed.toUTC().toISO({ suppressMilliseconds: true }) : null;
}

function clinicDateISO(date) {
  const parsed = toEcuador(date);
  return parsed.isValid ? parsed.toISODate() : null;
}

/**
 * Formatea una fecha a ISO 8601 sin zona horaria (para respuesta API)
 * @param {Date|DateTime|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatISO(date) {
  const dt = toEcuador(date);
  return dt.toFormat("yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Formatea fecha para mostrar (DD/MM/YYYY)
 * @param {Date|DateTime|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
  const dt = toEcuador(date);
  return dt.toFormat('dd/MM/yyyy');
}

/**
 * Formatea hora para mostrar (HH:mm)
 * @param {Date|DateTime|string} date - Fecha a formatear
 * @returns {string} Hora formateada
 */
function formatTime(date) {
  const dt = toEcuador(date);
  return dt.toFormat('HH:mm');
}

/**
 * Suma días a la fecha actual en Ecuador
 * @param {number} days - Días a sumar
 * @returns {DateTime} Fecha resultante
 */
function addDays(days) {
  return nowEcuador().plus({ days });
}

/**
 * Resta días a la fecha actual en Ecuador
 * @param {number} days - Días a restar
 * @returns {DateTime} Fecha resultante
 */
function subtractDays(days) {
  return nowEcuador().minus({ days });
}

/**
 * Compara si una fecha está dentro del rango de días
 * @param {Date|DateTime|string} date - Fecha a verificar
 * @param {number} days - Días desde hoy
 * @returns {boolean} True si está dentro del rango
 */
function isWithinDays(date, days) {
  const dt = toEcuador(date).startOf('day');
  const today = nowEcuador().startOf('day');
  const future = today.plus({ days });
  return dt >= today && dt <= future;
}

module.exports = {
  nowEcuador,
  toEcuador,
  parseClinicDateTime,
  clinicDateISO,
  formatISO,
  formatDate,
  formatTime,
  addDays,
  subtractDays,
  isWithinDays
};
