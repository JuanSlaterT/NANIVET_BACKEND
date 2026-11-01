const { randomUUID } = require('crypto');

/**
 * Genera un UUID v4 único
 * @returns {string} UUID en formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function genUuid() {
  return randomUUID();
}

module.exports = { genUuid };
