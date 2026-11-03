const express = require('express');
const router = express.Router();
const medicacionesController = require('../controllers/medicaciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// Nuevos endpoints unificados
router.get('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), medicacionesController.listar);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Medicacion', 'editar'), medicacionesController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Medicacion', 'eliminar'), medicacionesController.eliminar);
router.post('/:id/tomas', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('TomaMedicacion', 'crear'), medicacionesController.registrarToma);

// Endpoints legacy de hospitalización
router.put('/:medId/tomas/:tomaId/administrar', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('TomaMedicacion', 'editar'), medicacionesController.administrarToma);

module.exports = router;
