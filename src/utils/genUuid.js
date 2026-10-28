const { v4: uuidv4 } = require('uuid');

/**
 * Genera un UUID v4 único
 * @returns {string} UUID en formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function genUuid() {
  return uuidv4();
}

module.exports = { genUuid };
