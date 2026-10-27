const express = require('express');
const router = express.Router();
const vacunasController = require('../controllers/vacunas.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, vacunasController.listar);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Vacuna', 'crear'), vacunasController.crear);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Vacuna', 'eliminar'), vacunasController.eliminar);

module.exports = router;
