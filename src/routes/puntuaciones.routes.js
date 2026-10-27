const express = require('express');
const router = express.Router();
const puntuacionesController = require('../controllers/puntuaciones.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

// Públicos (sin auth o con auth opcional)
router.get('/token/:token', optionalAuth, puntuacionesController.obtenerPorToken);
router.post('/token/:token/responder', optionalAuth, puntuacionesController.responderPorToken);

// Protegidos
router.get('/', authMiddleware, puntuacionesController.listar);
router.get('/stats', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), puntuacionesController.estadisticas);
router.get('/pendientes', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), puntuacionesController.listarPendientes);
router.get('/cita/:citaId', authMiddleware, puntuacionesController.obtenerPorCita);
router.post('/cita/:citaId/crear', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), puntuacionesController.crearPorCita);

module.exports = router;
