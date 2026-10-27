const { Pool } = require('pg');
const dbConfig = require('../config/db');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: dbConfig.DB_HOST,
      port: dbConfig.DB_PORT,
      database: dbConfig.DB_NAME,
      user: dbConfig.DB_USER,
      password: dbConfig.DB_PASSWORD,
      min: 0,
      max: 2
    });
  }
  return pool;
}

/**
 * Genera un ID único con formato "prefix_NNN" (ej: "cli_001", "mas_002")
 * Usa secuencia de base de datos para evitar colisiones
 * @param {string} prefix - Prefijo del ID (3 caracteres)
 * @param {number} length - Longitud del número (default 3)
 * @returns {Promise<string>} ID generado
 */
async function genId(prefix, length = 3) {
  const client = await getPool().connect();
  try {
    // Usar secuencia de PostgreSQL para IDs únicos
    await client.query('BEGIN');
    try {
      const result = await client.query(
        `SELECT nextval('seq_${prefix}')`,
        []
      );
      const num = parseInt(result.rows[0].nextval).toString().padStart(length, '0');
      await client.query('COMMIT');
      return `${prefix}_${num}`;
    } catch (seqErr) {
      // Si la secuencia no existe, crearla y usarla
      await client.query('ROLLBACK');
      const p = getPool();
      await p.query(`
        CREATE SEQUENCE IF NOT EXISTS seq_${prefix} START 1;
      `);
      const result = await p.query(`SELECT nextval('seq_${prefix}')`);
      const num = parseInt(result.rows[0].nextval).toString().padStart(length, '0');
      return `${prefix}_${num}`;
    }
  } catch (err) {
    // Fallback a random si hay error de DB
    console.warn(`genId fallback para ${prefix}: ${err.message}`);
    const num = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    return `${prefix}_${num}`;
  }
}

/**
 * Genera un ID único simple sin DB (para uso rápido)
 * @param {string} prefix - Prefijo del ID
 * @param {number} length - Longitud del número
 * @returns {string} ID generado
 */
function genIdSync(prefix, length = 3) {
  const num = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
  return `${prefix}_${num}`;
}

/**
 * Genera un token único alfanumérico de 16 caracteres
 * @returns {string} Token único
 */
function genToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = { genId, genIdSync, genToken };
