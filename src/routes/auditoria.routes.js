const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

router.get('/', authMiddleware, rolesMiddleware(['admin']), auditoriaController.listar);
router.get('/mascota/:mascotaId', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditoriaController.historialMascota);
router.post('/mascota/:mascotaId/exportacion', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditoriaController.registrarExportacionMascota);
router.get('/entidad/:entidad/:entidadId', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditoriaController.historialEntidad);

module.exports = router;
