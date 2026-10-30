const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.6;
const DEFAULT_TIMEOUT_MS = 120000;

class IAProviderError extends Error {
  constructor(code, message, statusCode, cause) {
    super(message, { cause });
    this.name = 'IAProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new IAProviderError(
      'IA_NOT_CONFIGURED',
      `Falta configurar la variable de entorno ${name}`,
      503
    );
  }
  return value;
}

function numberEnv(name, fallback, { min, max }) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') return fallback;

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new IAProviderError(
      'IA_NOT_CONFIGURED',
      `${name} debe ser un número entre ${min} y ${max}`,
      503
    );
  }
  return value;
}

function getConfig() {
  const apiUrl = requiredEnv('AI_API_URL');
  let parsedUrl;
  try {
    parsedUrl = new URL(apiUrl);
  } catch (error) {
    throw new IAProviderError('IA_NOT_CONFIGURED', 'AI_API_URL no es una URL válida', 503, error);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new IAProviderError('IA_NOT_CONFIGURED', 'AI_API_URL debe usar http o https', 503);
  }

  return {
    apiUrl: parsedUrl.toString(),
    apiKey: requiredEnv('AI_API_KEY'),
    model: requiredEnv('AI_MODEL'),
    maxTokens: numberEnv('AI_MAX_TOKENS', DEFAULT_MAX_TOKENS, { min: 1, max: 32768 }),
    temperature: numberEnv('AI_TEMPERATURE', DEFAULT_TEMPERATURE, { min: 0, max: 2 }),
    timeoutMs: numberEnv('AI_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, { min: 1000, max: 120000 })
  };
}

function getMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string' && content.trim()) return content.trim();

  if (Array.isArray(content)) {
    const text = content
      .filter(part => part?.type === 'text' && typeof part.text === 'string')
      .map(part => part.text)
      .join('\n')
      .trim();
    if (text) return text;
  }

  throw new IAProviderError(
    'IA_INVALID_RESPONSE',
    'La IA respondió sin contenido utilizable',
    502
  );
}

async function chatCompletion({ system, user }) {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new IAProviderError(
        'IA_UPSTREAM_ERROR',
        `El proveedor de IA respondió con HTTP ${response.status}`,
        502
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new IAProviderError(
        'IA_INVALID_RESPONSE',
        'El proveedor de IA no devolvió JSON válido',
        502,
        error
      );
    }

    return getMessageContent(payload);
  } catch (error) {
    if (error instanceof IAProviderError) throw error;
    if (error?.name === 'AbortError') {
      throw new IAProviderError(
        'IA_TIMEOUT',
        `La IA no respondió antes de ${config.timeoutMs} ms`,
        504,
        error
      );
    }
    throw new IAProviderError(
      'IA_UNAVAILABLE',
      'No fue posible conectar con el proveedor de IA',
      502,
      error
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonContent(content) {
  const withoutFence = content
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const candidates = [withoutFence];
  const objectStart = withoutFence.indexOf('{');
  const objectEnd = withoutFence.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    candidates.push(withoutFence.slice(objectStart, objectEnd + 1));
  }

  const arrayStart = withoutFence.indexOf('[');
  const arrayEnd = withoutFence.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    candidates.push(withoutFence.slice(arrayStart, arrayEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // Probar el siguiente candidato.
    }
  }

  throw new IAProviderError(
    'IA_INVALID_RESPONSE',
    'La IA no devolvió el formato JSON solicitado',
    502
  );
}

async function chatCompletionJson(params) {
  const content = await chatCompletion(params);
  return parseJsonContent(content);
}

module.exports = {
  IAProviderError,
  chatCompletion,
  chatCompletionJson,
  parseJsonContent
};
