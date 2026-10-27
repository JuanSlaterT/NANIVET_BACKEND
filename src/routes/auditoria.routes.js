const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

router.get('/', authMiddleware, rolesMiddleware(['admin']), auditoriaController.listar);
router.get('/entidad/:entidad/:entidadId', authMiddleware, rolesMiddleware(['admin']), auditoriaController.historialEntidad);

module.exports = router;
