const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, clientesController.listar);
router.get('/buscar', authMiddleware, clientesController.buscar);
router.get('/:id', authMiddleware, clientesController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), auditMiddleware('Cliente', 'crear'), clientesController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), auditMiddleware('Cliente', 'editar'), clientesController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin']), auditMiddleware('Cliente', 'eliminar'), clientesController.eliminar);
router.post('/:id/revocar-consentimiento', authMiddleware, rolesMiddleware(['admin']), auditMiddleware('Cliente', 'revocar'), clientesController.revocarConsentimiento);

module.exports = router;
