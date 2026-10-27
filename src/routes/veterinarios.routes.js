const express = require('express');
const router = express.Router();
const veterinariosController = require('../controllers/veterinarios.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rolesMiddleware = require('../middleware/roles.middleware');
const auditMiddleware = require('../middleware/audit.middleware');

router.get('/', authMiddleware, veterinariosController.listar);
router.get('/:id', authMiddleware, veterinariosController.obtener);
router.get('/:id/bloqueos', authMiddleware, veterinariosController.obtenerBloqueos);
router.post('/:id/bloqueos', authMiddleware, rolesMiddleware(['admin']), auditMiddleware('Bloqueo', 'crear'), veterinariosController.crearBloqueo);
router.delete('/bloqueos/:bloqueoId', authMiddleware, rolesMiddleware(['admin']), auditMiddleware('Bloqueo', 'eliminar'), veterinariosController.eliminarBloqueo);
router.post('/sync/:userId', authMiddleware, rolesMiddleware(['admin']), veterinariosController.syncWithStaff);

module.exports = router;
