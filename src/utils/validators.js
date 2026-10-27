/**
 * Valida formato de teléfono ecuatoriano
 * - Celular: 09XXXXXXXX (10 dígitos, empieza con 09)
 * - Fijo: (02|03|04)XXXXXXXX (10 dígitos)
 * - Internacional: +593XXXXXXXX
 * @param {string} telefono - Número a validar
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePhone(telefono) {
  if (!telefono || typeof telefono !== 'string') {
    return { valid: false, message: 'Teléfono requerido' };
  }

  const clean = telefono.replace(/[\s\-\(\)]/g, '');

  // Formato celular: 09XXXXXXXX
  if (/^09\d{8}$/.test(clean)) {
    return { valid: true };
  }

  // Formato internacional: +593XXXXXXXX
  if (/^\+593\d{8,9}$/.test(clean)) {
    return { valid: true };
  }

  // Formato fijo: (02|03|04)XXXXXXXX
  if (/^(02|03|04)\d{8}$/.test(clean)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'Formato de teléfono inválido. Use 09XXXXXXXX para celulares'
  };
}

/**
 * Valida formato de cédula ecuatoriana
 * - Personas naturales: 10 dígitos, último dígito verificador
 * - Personas jurídicas: 13 dígitos, termina en 00
 * - Especial: 9 dígitos (extranjeros)
 * @param {string} cedula - Cédula a validar
 * @returns {{ valid: boolean, message?: string }}
 */
function validateCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') {
    return { valid: false, message: 'Cédula requerida' };
  }

  const clean = cedula.trim();

  // Mínimo 10 dígitos, máximo 13
  if (!/^\d{10,13}$/.test(clean)) {
    return { valid: false, message: 'Cédula debe tener 10 dígitos (personas naturales) o 13 (personas jurídicas)' };
  }

  // Personas jurídicas (termina en 00)
  if (clean.length === 13 && clean.endsWith('00')) {
    return { valid: true };
  }

  // Debe tener 10 dígitos para personas naturales
  if (clean.length !== 10) {
    return { valid: false, message: 'Cédula inválida' };
  }

  // Obtener provincia (primeros 2 dígitos: 01-24)
  const provincia = parseInt(clean.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return { valid: false, message: 'Código de provincia inválido' };
  }

  // Dígito 3: 0-5 para nacionales, 6 para extranjeros
  const tercerDigito = parseInt(clean.substring(2, 3), 10);
  if (tercerDigito > 5) {
    return { valid: false, message: 'Cédula inválida' };
  }

  // Algoritmo de validación dígito verificador (último dígito)
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let digito = parseInt(clean.substring(i, i + 1), 10);
    let multiplicador = i % 2 === 0 ? 2 : 1;
    
    if (multiplicador === 2 && digito > 4) {
      digito = digito * 2 - 9;
    } else if (multiplicador === 2) {
      digito = digito * 2;
    }
    
    suma += digito;
  }
  
  const verificador = (10 - (suma % 10)) % 10;
  const cedulaVerificador = parseInt(clean.substring(9, 10), 10);

  if (verificador !== cedulaVerificador) {
    return { valid: false, message: 'Cédula inválida - dígito verificador no coincide' };
  }

  return { valid: true };
}

/**
 * Valida email básico
 * @param {string} email - Email a validar
 * @returns {{ valid: boolean, message?: string }}
 */
function validateEmail(email) {
  if (!email) {
    return { valid: true }; // Email es opcional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Email inválido' };
  }

  return { valid: true };
}

module.exports = {
  validatePhone,
  validateCedula,
  validateEmail
};
