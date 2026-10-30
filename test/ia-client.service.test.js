const test = require('node:test');
const assert = require('node:assert/strict');

const {
  IAProviderError,
  chatCompletion,
  parseJsonContent
} = require('../src/services/ia-client.service');

const ENV_KEYS = [
  'AI_API_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'AI_MAX_TOKENS',
  'AI_TEMPERATURE',
  'AI_TIMEOUT_MS'
];

function configureEnv() {
  process.env.AI_API_URL = 'https://ia.example.test/v1/chat/completions';
  process.env.AI_API_KEY = 'test-secret';
  process.env.AI_MODEL = 'test-model';
  process.env.AI_MAX_TOKENS = '512';
  process.env.AI_TEMPERATURE = '0.2';
  process.env.AI_TIMEOUT_MS = '5000';
}

test.afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  delete global.fetch;
});

test('envía una solicitud compatible con OpenAI y extrae el contenido', async () => {
  configureEnv();
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Respuesta de prueba' } }] })
    };
  };

  const result = await chatCompletion({ system: 'Sistema', user: 'Usuario' });
  const body = JSON.parse(request.options.body);

  assert.equal(result, 'Respuesta de prueba');
  assert.equal(request.url, 'https://ia.example.test/v1/chat/completions');
  assert.equal(request.options.headers.Authorization, 'Bearer test-secret');
  assert.equal(body.model, 'test-model');
  assert.equal(body.stream, false);
  assert.deepEqual(body.messages, [
    { role: 'system', content: 'Sistema' },
    { role: 'user', content: 'Usuario' }
  ]);
});

test('acepta JSON dentro de un bloque Markdown', () => {
  assert.deepEqual(parseJsonContent('```json\n{"plan":"Control"}\n```'), { plan: 'Control' });
});

test('convierte errores HTTP del proveedor en un error 502', async () => {
  configureEnv();
  global.fetch = async () => ({ ok: false, status: 401 });

  await assert.rejects(
    () => chatCompletion({ system: 'Sistema', user: 'Usuario' }),
    error => error instanceof IAProviderError && error.code === 'IA_UPSTREAM_ERROR' && error.statusCode === 502
  );
});
