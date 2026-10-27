const express = require('express');
const router = express.Router();
const mascotasController = require('../controllers/mascotas.controller');
const tratamientosController = require('../controllers/tratamientos.controller');
const medicacionesController = require('../controllers/medicaciones.controller');
const pesoController = require('../controllers/peso.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

router.get('/', authMiddleware, mascotasController.listar);
router.get('/buscar', authMiddleware, mascotasController.buscar);
router.get('/:id', authMiddleware, mascotasController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), auditMiddleware('Mascota', 'crear'), mascotasController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), auditMiddleware('Mascota', 'editar'), mascotasController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Mascota', 'eliminar'), mascotasController.eliminar);

// Peso endpoints
router.get('/:id/pesos', authMiddleware, pesoController.listarPesos);
router.post('/:id/pesos', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('Peso', 'crear'), pesoController.crearPeso);

// Integración: Tratamientos de una mascota
router.get('/:id/tratamientos', authMiddleware, tratamientosController.listar);

// Integración: Medicaciones de una mascota (resuelve desde hospitalizaciones)
router.get('/:id/medicaciones', authMiddleware, medicacionesController.listar);

module.exports = router;
