const express = require('express');
const router = express.Router();
const iaController = require('../controllers/ia.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

router.post('/resumir-historia', authMiddleware, rolesMiddleware(['admin', 'veterinario']), iaController.resumirHistoria);
router.post('/notas-a-soap', authMiddleware, rolesMiddleware(['admin', 'veterinario']), iaController.notasASOAP);
router.post('/redactar-mensaje', authMiddleware, rolesMiddleware(['admin', 'veterinario']), iaController.redactarMensaje);
router.post('/diferenciales', authMiddleware, rolesMiddleware(['admin', 'veterinario']), iaController.diferenciales);

module.exports = router;
