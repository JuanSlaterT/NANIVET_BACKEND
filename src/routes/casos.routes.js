const express = require('express');
const router = express.Router();
const casosController = require('../controllers/casos.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), casosController.listar);
router.get('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), casosController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CasoClinico', 'crear'), casosController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CasoClinico', 'editar'), casosController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CasoClinico', 'eliminar'), casosController.eliminar);

module.exports = router;
