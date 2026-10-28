const pool = require('../config/pool');
const { nowEcuador } = require('../utils/dates');

/**
 * Mock de IA para resumir historia clínica
 * @param {string} mascotaId - ID de la mascota
 * @returns {Promise<Object>} Resumen generado
 */
async function resumirHistoria(mascotaId) {
  // Simular delay de IA
  await new Promise(resolve => setTimeout(resolve, 1500));

  const client = await pool.connect();
  try {
    // Obtener datos de la mascota
    const mascotaRes = await client.query(`
      SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
      FROM mascotas m
      JOIN clientes c ON m.cliente_id = c.id
      WHERE m.id = $1
    `, [mascotaId]);

    if (mascotaRes.rows.length === 0) {
      return { error: { code: 'NOT_FOUND', message: 'Mascota no encontrada' } };
    }

    const mascota = mascotaRes.rows[0];

    // Obtener casos clínicos
    const casosRes = await client.query(
      'SELECT * FROM casos_clinicos WHERE mascota_id = $1 ORDER BY fecha_hora_inicio DESC',
      [mascotaId]
    );

    // Obtener vacunas
    const vacunasRes = await client.query(
      'SELECT * FROM vacunas WHERE mascota_id = $1 ORDER BY fecha_aplicacion DESC',
      [mascotaId]
    );

    // Obtener tratamientos
    const tratRes = await client.query(
      'SELECT * FROM tratamientos WHERE mascota_id = $1 ORDER BY fecha DESC',
      [mascotaId]
    );

    const resumen = `
## Historia Clínica de ${mascota.nombre}

**Dueño:** ${mascota.cliente_nombre} ${mascota.cliente_apellido}
**Especie:** ${mascota.especie} | **Raza:** ${mascota.raza || 'N/A'}
**Edad:** ${mascota.fecha_nacimiento ? new Date().getFullYear() - new Date(mascota.fecha_nacimiento).getFullYear() : 'N/A'} años

### Resumen
${casosRes.rows.length > 0
  ? casosRes.rows.map(c => `- **${c.fecha_hora_inicio?.split('T')[0]}**: ${c.motivo} - ${c.diagnostico || 'Sin diagnóstico'} (${c.estado})`).join('\n')
  : 'Sin casos clínicos registrados'}

### Vacunas Aplicadas
${vacunasRes.rows.length > 0
  ? vacunasRes.rows.map(v => `- ${v.nombre} (${v.lote}) - ${v.fecha_aplicacion} - Próxima: ${v.proxima_dosis || 'N/A'}`).join('\n')
  : 'Sin vacunas registradas'}

### Tratamientos Actuales
${tratRes.rows.length > 0
  ? tratRes.rows.map(t => `- ${t.nombre}: ${t.dosis} por ${t.duracion || 'N/A'}`).join('\n')
  : 'Sin tratamientos activos'}

---
*Sugerencia generada por IA como apoyo. No reemplaza el criterio clínico del veterinario.*
    `.trim();

    return {
      data: {
        mascota: {
          id: mascota.id,
          nombre: mascota.nombre,
          especie: mascota.especie
        },
        resumen: resumen,
        disclaimer: 'Sugerencia generada por IA como apoyo. No reemplaza el criterio clínico del veterinario.'
      }
    };
  } finally {
    client.release();
  }
}

/**
 * Mock de IA para convertir notas a formato SOAP
 * @param {Object} params - Parámetros de entrada
 * @returns {Promise<Object>} Formato SOAP generado
 */
async function notasASOAP(params) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const { mascotaId, notasLibres } = params;

  return {
    data: {
      mascotaId,
      soap: {
        subjetivo: `Según el dueño: ${notasLibres || 'El paciente presenta síntomas a evaluar.'}`,
        objetivo: `Examen físico completo. Signos vitales dentro de parámetros normales a confirmar.`,
        analisis: `Basado en la presentación clínica, se consideran diagnósticos diferenciales. Se recomienda completar con hallazgos del examen físico.`,
        plan: `1. Exámenes de laboratorio sugeridos\n2. Tratamiento sintomático según peso\n3. Control en 7 días\n4. Aislamiento si se confirma diagnóstico`
      },
      disclaimer: 'Sugerencia generada por IA como apoyo. No reemplaza el criterio clínico del veterinario.'
    }
  };
}

/**
 * Mock de IA para redactar mensaje para dueño
 * @param {Object} params - Parámetros de entrada
 * @returns {Promise<Object>} Mensaje redactado
 */
async function redactarMensaje(params) {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { tipo, mascotaNombre, duenoNombre, detalles } = params;

  const mensajes = {
    recordatorio: `Estimado/a ${duenoNombre}, le recordamos la cita de ${mascotaNombre} programada. Por favor confirmar asistencia.`,
    resultados: `Estimado/a ${duenoNombre}, le informamos que los resultados de ${mascotaNombre} están listos. Por favor acérquese a la clínica para revisión.`,
    seguimiento: `Estimado/a ${duenoNombre}, deseamos hacer seguimiento de ${mascotaNombre}. ¿Cómo se encuentra? Agende una cita si es necesario.`
  };

  return {
    data: {
      mensaje: mensajes[tipo] || mensajes.recordatorio,
      disclaimer: 'Sugerencia generada por IA como apoyo. No reemplaza el criterio clínico del veterinario.'
    }
  };
}

/**
 * Mock de IA para diagnósticos diferenciales
 * @param {Object} params - Parámetros de entrada
 * @returns {Promise<Object>} Diagnósticos diferenciales
 */
async function diagnosticosDiferenciales(params) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    data: {
      diferenciales: [
        {
          diagnostico: 'Diagnóstico diferencial 1',
          probabilidad: 'Alta',
          descripcion: 'Considerar basado en la presentación clínica y signos observados.',
          examenes: ['Hemograma completo', 'Bioquímica sérica', 'Radiografía']
        },
        {
          diagnostico: 'Diagnóstico diferencial 2',
          probabilidad: 'Media',
          descripcion: 'Presentación atípica que requiere descartar.',
          examenes: ['Ecografía abdominal', 'Urianálisis']
        },
        {
          diagnostico: 'Diagnóstico diferencial 3',
          probabilidad: 'Baja',
          descripcion: 'Menos probable pero considerar en el differential.',
          examenes: ['Ecografía torácica']
        }
      ],
      disclaimer: 'Sugerencia generada por IA como apoyo. No reemplaza el criterio clínico del veterinario.'
    }
  };
}

module.exports = {
  resumirHistoria,
  notasASOAP,
  redactarMensaje,
  diagnosticosDiferenciales
};
