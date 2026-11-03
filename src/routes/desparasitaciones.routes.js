const express = require('express');
const router = express.Router();
const desparasitacionesController = require('../controllers/desparasitaciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), desparasitacionesController.listar);
router.get('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), desparasitacionesController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Desparasitacion', 'crear'), desparasitacionesController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Desparasitacion', 'editar'), desparasitacionesController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Desparasitacion', 'eliminar'), desparasitacionesController.eliminar);

module.exports = router;
