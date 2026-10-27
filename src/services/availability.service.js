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
      min: dbConfig.DB_POOL_MIN,
      max: dbConfig.DB_POOL_MAX
    });
  }
  return pool;
}

/**
 * Obtiene los slots ocupados de un veterinario en un día
 * Incluye: citas existentes + días bloqueados (todos los slots)
 * @param {string} veterinarioId - ID del veterinario
 * @param {string} fecha - Fecha (YYYY-MM-DD)
 * @returns {Promise<Array>} Array de horas ocupadas
 */
async function getOcupados(veterinarioId, fecha) {
  const client = await getPool().connect();
  try {
    // 1. Verificar si el día está bloqueado
    const bloqueoRes = await client.query(
      `SELECT 1 FROM horarios_bloqueados 
       WHERE veterinario_id = $1 AND fecha = $2::date 
       LIMIT 1`,
      [veterinarioId, fecha]
    );

    if (bloqueoRes.rows.length > 0) {
      // Día bloqueado: devolver TODOS los slots (08:00 a 20:00)
      const todosSlots = [];
      for (let h = 8; h < 20; h++) {
        for (let m = 0; m < 60; m += 30) {
          todosSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }
      return todosSlots;
    }

    // 2. Si no está bloqueado, devolver solo las citas existentes
    const result = await client.query(`
      SELECT
        TO_CHAR(fecha_hora, 'HH24:MI') AS hora
      FROM citas
      WHERE veterinario_id = $1
        AND fecha_hora::date = $2::date
        AND estado != 'cancelada'
      ORDER BY fecha_hora
    `, [veterinarioId, fecha]);

    return result.rows.map(row => row.hora);
  } finally {
    client.release();
  }
}

/**
 * Calcula los slots disponibles para un veterinario en una fecha
 * @param {string} veterinarioId - ID del veterinario
 * @param {string} fecha - Fecha (YYYY-MM-DD)
 * @param {number} intervaloMinutos - Intervalo entre citas (default 30)
 * @returns {Promise<Array>} Array de slots disponibles
 */
async function getDisponibles(veterinarioId, fecha, intervaloMinutos = 30) {
  const ocupados = await getOcupados(veterinarioId, fecha);

  // Obtener horario del veterinario
  const client = await getPool().connect();
  try {
    const vetRes = await client.query(
      'SELECT horario_inicio, horario_fin, dias_semana FROM veterinarios WHERE id = $1',
      [veterinarioId]
    );

    if (vetRes.rows.length === 0) return [];

    const vet = vetRes.rows[0];
    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();

    // Verificar si el veterinario trabaja ese día
    if (!vet.dias_semana.includes(diaSemana)) return [];

    const inicio = vet.horario_inicio;
    const fin = vet.horario_fin;

    // Generar todos los slots posibles
    const slots = [];
    const [startH, startM] = inicio.split(':').map(Number);
    const [endH, endM] = fin.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + intervaloMinutos <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const slot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push(slot);
      currentMinutes += intervaloMinutos;
    }

    // Filtrar slots ocupados
    return slots.filter(slot => !ocupados.includes(slot));
  } finally {
    client.release();
  }
}

module.exports = { getOcupados, getDisponibles };
