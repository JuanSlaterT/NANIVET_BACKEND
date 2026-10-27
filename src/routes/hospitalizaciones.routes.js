const express = require('express');
const router = express.Router();
const hospitalizacionesController = require('../controllers/hospitalizaciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), hospitalizacionesController.listar);
router.get('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), hospitalizacionesController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Hospitalizacion', 'crear'), hospitalizacionesController.crear);
router.put('/:id/alta', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Hospitalizacion', 'alta_hospitalizacion'), hospitalizacionesController.darAlta);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Hospitalizacion', 'editar'), hospitalizacionesController.actualizar);

module.exports = router;
