const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const corsConfig = require('./config/cors');
const dotenv = require('dotenv');
const { requestContext } = require('./middleware/request-context.middleware');
const { globalLimiter, loginLimiter, publicLimiter, aiLimiter } = require('./middleware/rate-limit.middleware');
const { validateApiRequest } = require('./middleware/request-validation.middleware');
const { securityEvent } = require('./services/security-events.service');

dotenv.config();

const app = express();

// Seguridad y contexto de cada petición
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(requestContext);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsConfig));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT || '256kb' }));
app.use('/api', globalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/ia', aiLimiter);
app.use('/api/citas/token', publicLimiter);
app.use('/api/puntuaciones/token', publicLimiter);
app.use('/api/citas/veterinario', publicLimiter);
app.use('/api/veterinarios', publicLimiter);
app.use('/api', validateApiRequest);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/veterinarios', require('./routes/veterinarios.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/mascotas', require('./routes/mascotas.routes'));
app.use('/api/citas', require('./routes/citas.routes'));
app.use('/api/casos', require('./routes/casos.routes'));
app.use('/api/vacunas', require('./routes/vacunas.routes'));
app.use('/api/tratamientos', require('./routes/tratamientos.routes'));
app.use('/api/desparasitaciones', require('./routes/desparasitaciones.routes'));
app.use('/api/cirugias', require('./routes/cirugias.routes'));
app.use('/api/examenes', require('./routes/examenes.routes'));
app.use('/api/hospitalizaciones', require('./routes/hospitalizaciones.routes'));
app.use('/api/medicaciones', require('./routes/medicaciones.routes'));
app.use('/api/evoluciones', require('./routes/evoluciones.routes'));
app.use('/api/auditoria', require('./routes/auditoria.routes'));
app.use('/api/campanas', require('./routes/campanas.routes'));
app.use('/api/plantillas', require('./routes/plantillas.routes'));
app.use('/api/ia', require('./routes/ia.routes'));
app.use('/api/puntuaciones', require('./routes/puntuaciones.routes'));
app.use('/api/catalogo/vacunas', require('./routes/catalogo-vacunas.routes'));
app.use('/api/catalogo/desparasitacion', require('./routes/catalogo-desparasitacion.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/search', require('./routes/search.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado', requestId: req.requestId } });
});

// Error handler
app.use((err, req, res, next) => {
  securityEvent(req, 'unhandled_server_error', {
    errorName: err?.name,
    // El detalle se registra en servidor, nunca se devuelve al cliente.
    errorMessage: err?.message,
    postgresCode: err?.code,
  }, 'error');
  const isBodyTooLarge = err?.type === 'entity.too.large';
  const isInvalidJson = err instanceof SyntaxError && err?.type === 'entity.parse.failed';
  const status = isBodyTooLarge ? 413 : (isInvalidJson ? 400 : 500);
  const code = isBodyTooLarge ? 'PAYLOAD_TOO_LARGE' : (isInvalidJson ? 'INVALID_JSON' : 'SERVER_ERROR');
  const message = isBodyTooLarge
    ? 'El contenido enviado supera el tamaño permitido'
    : (isInvalidJson ? 'El cuerpo de la solicitud no contiene JSON válido' : 'Error interno del servidor');

  res.status(status).json({
    error: { code, message, requestId: req.requestId }
  });
});

module.exports = app;
