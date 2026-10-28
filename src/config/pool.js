const { Pool } = require('pg');

// Usar DATABASE_URL de Supabase si está disponible, si no, usar variables separadas
const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL;

// Detectar si estamos en Vercel/serverless
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

let pool;

if (DATABASE_URL) {
  // Conexión directa con URL de Supabase (incluye SSL)
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Supabase usa auto-firmado en free tier
    },
    family: 4, // Forzar IPv4 para evitar problemas de conectividad en algunos hosting
    connectionTimeoutMillis: 3000,
    statement_timeout: 10000,
    // Configuración para serverless (Vercel)
    application_name: 'nanivet',
    // En serverless, mantener menos conexiones máximas para evitar agotamiento
    max: isServerless ? 3 : (parseInt(process.env.DB_POOL_MAX || '10', 10)),
    // Mantener al menos 1 conexión mínima en serverless para evitar reconexiones constantes
    min: isServerless ? 1 : (parseInt(process.env.DB_POOL_MIN || '2', 10)),
    // Reutilizar conexiones por 30 segundos para evitar que se cierren durante operaciones
    idleTimeoutMillis: isServerless ? 30000 : 10000,
    // No permitir que el pool cierre el proceso si se queda sin conexiones
    allowExitOnIdle: false,
  });
} else {
  // Fallback para desarrollo local
  const dbConfig = require('./db');
  pool = new Pool({
    host: dbConfig.DB_HOST,
    port: parseInt(dbConfig.DB_PORT, 10),
    database: dbConfig.DB_NAME,
    user: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
    max: dbConfig.DB_POOL_MAX,
    min: dbConfig.DB_POOL_MIN,
    ssl: dbConfig.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
    family: 4, // Forzar IPv4
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    keepAlive: true,
    application_name: 'nanivet',
  });
}

// Manejar reconexión automática en serverless
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
  // No salir del proceso, solo loggear
  // En Vercel, la función se reinvoca y el pool se recrea
});

// Manejar conexiones perdidas (común en serverless)
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('remove', (client) => {
  console.log('🗑️ Cliente eliminado del pool');
});

// Wrapper para manejar reconexión automática en serverless
// Cuando una conexión se pierde (timeout, ECONNRESET), el pool la marca como muerta
// y la remueve, pero necesitamos reconectar antes de la siguiente query
const originalQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  try {
    return await originalQuery(text, params);
  } catch (err) {
    // Si es error de conexión/timeout, intentar reconectar
    if (
      err.message.toLowerCase().includes('connection') ||
      err.message.toLowerCase().includes('timeout') ||
      err.message.toLowerCase().includes('terminated') ||
      err.code === 'ECONNRESET' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
    ) {
      console.log('🔄 Reconectando a PostgreSQL...');
      // Esperar un momento para que el pool se recupere
      await new Promise(resolve => setTimeout(resolve, 100));
      // Intentar de nuevo
      return originalQuery(text, params);
    }
    throw err;
  }
};

module.exports = pool;
