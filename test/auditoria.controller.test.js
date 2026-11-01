const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../src/config/pool');
const auditoriaController = require('../src/controllers/auditoria.controller');

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

test('consulta la auditoria de una mascota usando el UUID con tipos explicitos', async () => {
  const originalQuery = pool.query;
  const mascotaId = '73b7c62e-b36e-43b6-a214-5a9c8f0209ce';
  let executedQuery;
  let executedParams;

  pool.query = async (query, params) => {
    executedQuery = query;
    executedParams = params;
    return { rows: [] };
  };

  try {
    const response = createResponse();
    await auditoriaController.historialMascota(
      { params: { mascotaId } },
      response,
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, { data: [], meta: { mascotaId, total: 0 } });
    assert.deepEqual(executedParams, [mascotaId]);
    assert.match(executedQuery, /\) = \$1::uuid::text/);
    assert.match(executedQuery, /WHERE mascota_id = \$1::uuid/);
    assert.doesNotMatch(executedQuery, /WHERE mascota_id = \$1(?:\s|$)/);
  } finally {
    pool.query = originalQuery;
  }
});

test('rechaza un identificador que no sea UUID antes de consultar PostgreSQL', async () => {
  const originalQuery = pool.query;
  let queryWasCalled = false;
  pool.query = async () => {
    queryWasCalled = true;
    return { rows: [] };
  };

  try {
    const response = createResponse();
    await auditoriaController.historialMascota(
      { params: { mascotaId: 'mascota-invalida' } },
      response,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.payload.error.code, 'VALIDATION_ERROR');
    assert.equal(queryWasCalled, false);
  } finally {
    pool.query = originalQuery;
  }
});
