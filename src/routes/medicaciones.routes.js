const express = require('express');
const router = express.Router();
const medicacionesController = require('../controllers/medicaciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// Nuevos endpoints unificados
router.get('/', authMiddleware, medicacionesController.listar);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Medicacion', 'editar'), medicacionesController.actualizar);
router.post('/:id/tomas', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('TomaMedicacion', 'crear'), medicacionesController.registrarToma);

// Endpoints legacy de hospitalización
router.get('/hospitalizaciones/:id/medicaciones', authMiddleware, rolesMiddleware(['admin', 'veterinario']), medicacionesController.listarMedicaciones);
router.post('/hospitalizaciones/:id/medicaciones', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Medicacion', 'crear'), medicacionesController.crearMedicacion);
router.put('/medicaciones/:medId/tomas/:tomaId/administrar', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('TomaMedicacion', 'editar'), medicacionesController.administrarToma);

module.exports = router;
