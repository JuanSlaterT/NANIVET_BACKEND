const express = require('express');
const cors = require('cors');
const corsConfig = require('./config/cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

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
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado' } });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' }
  });
});

module.exports = app;
