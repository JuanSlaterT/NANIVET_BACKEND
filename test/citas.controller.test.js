const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../src/config/pool');
const citasController = require('../src/controllers/citas.controller');

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

test('filtra las citas por mascotaId', async () => {
  const originalQuery = pool.query;
  const mascotaId = '8a6fb302-5bfa-4258-8249-3bc4eba0b072';
  let executedQuery;
  let executedParams;

  pool.query = async (query, params) => {
    executedQuery = query;
    executedParams = params;
    return { rows: [] };
  };

  try {
    const response = createResponse();
    await citasController.listar(
      { query: { mascotaId }, user: { rol: 'admin' } },
      response,
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, { data: [] });
    assert.deepEqual(executedParams, [mascotaId]);
    assert.match(executedQuery, /WHERE ci\.mascota_id = \$1/);
  } finally {
    pool.query = originalQuery;
  }
});

test('combina mascotaId con los demas filtros de citas', async () => {
  const originalQuery = pool.query;
  let executedQuery;
  let executedParams;

  pool.query = async (query, params) => {
    executedQuery = query;
    executedParams = params;
    return { rows: [] };
  };

  try {
    const query = {
      fecha: '2026-11-02',
      veterinarioId: 'vet-1',
      estado: 'confirmada',
      mascotaId: '8a6fb302-5bfa-4258-8249-3bc4eba0b072',
    };
    const response = createResponse();
    await citasController.listar(
      { query, user: { rol: 'admin' } },
      response,
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(executedParams, [
      query.fecha,
      query.veterinarioId,
      query.estado,
      query.mascotaId,
    ]);
    assert.match(
      executedQuery,
      /WHERE \(ci\.fecha_hora AT TIME ZONE 'America\/Guayaquil'\)::date = \$1::date AND ci\.veterinario_id = \$2 AND ci\.estado = \$3 AND ci\.mascota_id = \$4/,
    );
  } finally {
    pool.query = originalQuery;
  }
});
