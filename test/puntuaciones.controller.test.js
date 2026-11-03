const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../src/config/pool');
const puntuacionesController = require('../src/controllers/puntuaciones.controller');

function createResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('conserva recomienda=false al responder una puntuacion', async () => {
  const originalQuery = pool.query;
  let executedParams;

  pool.query = async (_query, params) => {
    executedParams = params;
    return { rows: [{ token: 'rating-token', recomienda: false }] };
  };

  try {
    const response = createResponse();
    await puntuacionesController.responderPorToken(
      {
        params: { token: 'rating-token' },
        body: { calificacion: 4, recomienda: false, comentario: '' },
      },
      response,
    );

    assert.equal(response.statusCode, 200);
    assert.equal(executedParams[0], 4);
    assert.equal(executedParams[1], false);
    assert.equal(executedParams[2], null);
    assert.equal(executedParams[4], 'rating-token');
  } finally {
    pool.query = originalQuery;
  }
});

test('devuelve estadisticas con el contrato que consume el frontend', async () => {
  const originalQuery = pool.query;
  const results = [
    { rows: [{ promedio: '4.3', respondidas: '3', recomienda: '2' }] },
    { rows: [{ calificacion: 5, total: '2' }, { calificacion: 3, total: '1' }] },
    { rows: [{ veterinario_id: 'vet-1', veterinario_nombre: 'Dra. Uno', promedio: '4.3', total: '3' }] },
    { rows: [] },
    { rows: [{ id: 'pendiente-1' }, { id: 'pendiente-2' }] },
  ];
  pool.query = async () => results.shift();

  try {
    const response = createResponse();
    await puntuacionesController.estadisticas({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload.data, {
      promedio: 4.3,
      total: 3,
      respondidas: 3,
      pendientes: 2,
      recomienda: 2,
      porEstrella: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 },
      porVeterinario: [{ veterinarioId: 'vet-1', nombre: 'Dra. Uno', promedio: 4.3, total: 3 }],
      comentarios: [],
    });
  } finally {
    pool.query = originalQuery;
  }
});
