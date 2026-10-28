const { Pool } = require('pg');

// Usar DATABASE_URL de Supabase si está disponible, si no, usar variables separadas
const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL;

let pool;

if (DATABASE_URL) {
  // Conexión directa con URL de Supabase (incluye SSL)
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Supabase usa auto-firmado en free tier
    },
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
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
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });
}

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
