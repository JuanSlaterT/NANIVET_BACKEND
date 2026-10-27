const express = require('express');
const router = express.Router();
const tratamientosController = require('../controllers/tratamientos.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, tratamientosController.listar);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Tratamiento', 'crear'), tratamientosController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Tratamiento', 'editar'), tratamientosController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Tratamiento', 'eliminar'), tratamientosController.eliminar);

module.exports = router;
