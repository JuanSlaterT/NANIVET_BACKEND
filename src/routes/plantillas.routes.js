const express = require('express');
const router = express.Router();
const plantillasController = require('../controllers/plantillas.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), plantillasController.listar);
router.get('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), plantillasController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Plantilla', 'crear'), plantillasController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Plantilla', 'editar'), plantillasController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin']), auditMiddleware('Plantilla', 'eliminar'), plantillasController.eliminar);

module.exports = router;
