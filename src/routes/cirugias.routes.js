const express = require('express');
const router = express.Router();
const cirugiasController = require('../controllers/cirugias.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, cirugiasController.listar);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Cirugia', 'crear'), cirugiasController.crear);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Cirugia', 'eliminar'), cirugiasController.eliminar);

module.exports = router;
