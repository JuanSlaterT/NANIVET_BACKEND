const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../src/config/pool');
const pesoController = require('../src/controllers/peso.controller');

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

test('crea un peso usando el campo peso y devuelve el mismo contrato', async () => {
  const originalQuery = pool.query;
  let executedParams;
  pool.query = async (_query, params) => {
    executedParams = params;
    return { rows: [{ id: 'peso-1', mascota_id: 'mascota-1', peso: 12.4, fecha: '2026-11-02' }] };
  };

  try {
    const response = createResponse();
    await pesoController.crearPeso(
      { params: { id: 'mascota-1' }, body: { peso: 12.4, fecha: '2026-11-02' } },
      response,
    );

    assert.equal(response.statusCode, 201);
    assert.equal(executedParams[1], 'mascota-1');
    assert.equal(executedParams[2], 12.4);
    assert.equal(response.payload.data.peso, 12.4);
  } finally {
    pool.query = originalQuery;
  }
});
