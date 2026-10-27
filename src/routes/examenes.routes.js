const express = require('express');
const router = express.Router();
const examenesController = require('../controllers/examenes.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, examenesController.listar);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Examen', 'crear'), examenesController.crear);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Examen', 'eliminar'), examenesController.eliminar);

module.exports = router;
