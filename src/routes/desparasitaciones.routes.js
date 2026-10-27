const express = require('express');
const router = express.Router();
const desparasitacionesController = require('../controllers/desparasitaciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, desparasitacionesController.listar);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Desparasitacion', 'crear'), desparasitacionesController.crear);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Desparasitacion', 'eliminar'), desparasitacionesController.eliminar);

module.exports = router;
