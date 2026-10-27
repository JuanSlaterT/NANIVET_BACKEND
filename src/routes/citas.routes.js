const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citas.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// Públicos (sin auth)
router.get('/token/:token', optionalAuth, citasController.obtenerPorToken);
router.get('/veterinario/:vetId/slots', citasController.getSlots);
router.post('/token/:token/confirmar', optionalAuth, citasController.confirmarPorToken);
router.post('/token/:token/cancelar', optionalAuth, citasController.cancelarPorToken);
router.post('/token/:token/reprogramar', optionalAuth, citasController.reprogramarPorToken);

// Protegidos
router.get('/', authMiddleware, citasController.listar);
router.get('/:id', authMiddleware, citasController.obtener);
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), auditMiddleware('Cita', 'crear'), citasController.crear);
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario', 'recepcionista']), auditMiddleware('Cita', 'editar'), citasController.actualizar);
router.delete('/:id', authMiddleware, rolesMiddleware(['admin']), auditMiddleware('Cita', 'eliminar'), citasController.eliminar);

module.exports = router;
