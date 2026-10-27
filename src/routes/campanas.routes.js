const express = require('express');
const router = express.Router();
const campanasController = require('../controllers/campanas.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

router.get('/segmentos', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), campanasController.obtenerSegmentos);
router.get('/envios', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), campanasController.listarEnvios);
router.post('/enviar', authMiddleware, rolesMiddleware(['admin', 'veterinario']), campanasController.enviarCampana);

module.exports = router;
