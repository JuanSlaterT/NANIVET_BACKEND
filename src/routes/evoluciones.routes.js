const express = require('express');
const router = express.Router();
const evolucionesController = require('../controllers/evoluciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/hospitalizaciones/:id/evoluciones', authMiddleware, rolesMiddleware(['admin', 'veterinario']), evolucionesController.listarEvoluciones);
router.post('/hospitalizaciones/:id/evoluciones', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Evolucion', 'crear'), evolucionesController.crearEvolucion);

module.exports = router;
