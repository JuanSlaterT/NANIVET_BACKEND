const { Pool } = require('pg');
const dbConfig = require('../config/db');
const { subtractDays, addDays } = require('../utils/dates');

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
 * Calcula los segmentos de campañas
 */
async function calcularSegmentos() {
  const client = await getPool().connect();
  try {
    const result = {};

    // 1. Vacunas vencidas o por vencer (próxima dosis dentro de 15 días)
    const vacunasRes = await client.query(`
      SELECT
        v.*,
        mas.nombre AS mascota_nombre,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.telefono AS cliente_telefono,
        cli.consentimiento_comunicaciones
      FROM vacunas v
      JOIN mascotas mas ON v.mascota_id = mas.id
      JOIN clientes cli ON mas.cliente_id = cli.id
      WHERE v.proxima_dosis <= CURRENT_DATE + INTERVAL '15 days'
        AND cli.consentimiento_comunicaciones = true
      ORDER BY v.proxima_dosis
    `);

    result.vacunas_vencidas = vacunasRes.rows.map(v => ({
      clienteId: v.cliente_id,
      clienteNombre: `${v.cliente_nombre} ${v.cliente_apellido}`,
      mascotaId: v.mascota_id,
      mascotaNombre: v.mascota_nombre,
      motivo: `Vacuna ${v.nombre} vence ${v.proxima_dosis} - refuerzo`,
      fecha: v.proxima_dosis
    }));

    // 2. Desparasitación pendiente
    const desparRes = await client.query(`
      SELECT
        d.*,
        mas.nombre AS mascota_nombre,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.telefono AS cliente_telefono,
        cli.consentimiento_comunicaciones
      FROM desparasitaciones d
      JOIN mascotas mas ON d.mascota_id = mas.id
      JOIN clientes cli ON mas.cliente_id = cli.id
      WHERE d.proxima_dosis <= CURRENT_DATE + INTERVAL '15 days'
        AND cli.consentimiento_comunicaciones = true
      ORDER BY d.proxima_dosis
    `);

    result.desparasitacion_pendiente = desparRes.rows.map(d => ({
      clienteId: d.cliente_id,
      clienteNombre: `${d.cliente_nombre} ${d.cliente_apellido}`,
      mascotaId: d.mascota_id,
      mascotaNombre: d.mascota_nombre,
      motivo: `Desparasización con ${d.producto} próxima: ${d.proxima_dosis}`,
      fecha: d.proxima_dosis
    }));

    // 3. Clientes inactivos (sin citas atendidas en 6 meses)
    const inactivosRes = await client.query(`
      SELECT DISTINCT
        c.*,
        (SELECT MAX(ci.fecha_hora)
         FROM citas ci
         JOIN mascotas m ON ci.mascota_id = m.id
         WHERE m.cliente_id = c.id
           AND ci.estado = 'atendida'
        ) AS ultima_cita_atendida
      FROM clientes c
      WHERE (
        SELECT MAX(ci.fecha_hora)
        FROM citas ci
        JOIN mascotas m ON ci.mascota_id = m.id
        WHERE m.cliente_id = c.id
          AND ci.estado = 'atendida'
      ) < CURRENT_TIMESTAMP - INTERVAL '6 months'
      OR (
        SELECT MAX(ci.fecha_hora)
        FROM citas ci
        JOIN mascotas m ON ci.mascota_id = m.id
        WHERE m.cliente_id = c.id
          AND ci.estado = 'atendida'
      ) IS NULL
      AND c.consentimiento_comunicaciones = true
    `);

    result.clientes_inactivos = inactivosRes.rows.map(c => ({
      clienteId: c.id,
      clienteNombre: `${c.nombre} ${c.apellido}`,
      mascotaId: null,
      mascotaNombre: null,
      motivo: `Sin visitas desde hace más de 6 meses`,
      fecha: c.ultima_cita_atendida
    }));

    // 4. Cumpleaños de mascotas (próximos 7 días)
    const cumpleRes = await client.query(`
      SELECT
        m.*,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.telefono AS cliente_telefono
      FROM mascotas m
      JOIN clientes cli ON m.cliente_id = cli.id
      WHERE EXTRACT(MONTH FROM m.fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM m.fecha_nacimiento) BETWEEN EXTRACT(DAY FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM (CURRENT_DATE + INTERVAL '7 days'))
      ORDER BY m.fecha_nacimiento
    `);

    result.cumpleanos_mascotas = cumpleRes.rows.map(m => ({
      clienteId: m.cliente_id,
      clienteNombre: `${m.cliente_nombre} ${m.cliente_apellido}`,
      mascotaId: m.id,
      mascotaNombre: m.nombre,
      motivo: `¡Cumpleaños de ${m.nombre}!`,
      fecha: m.fecha_nacimiento
    }));

    return result;
  } finally {
    client.release();
  }
}

module.exports = { calcularSegmentos };
