const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo admin puede gestionar staff
router.use(rolesMiddleware(['admin']));

// GET /api/staff - Obtener todos los miembros del staff
router.get('/', staffController.getAllStaff);

// GET /api/staff/:id - Obtener miembro del staff por ID
router.get('/:id', staffController.getStaffById);

// GET /api/staff/email/:email - Verificar si existe un email
router.get('/email/:email', staffController.getStaffByEmail);

// POST /api/staff - Crear nuevo miembro del staff
router.post('/', staffController.createStaff);

// PUT /api/staff/:id - Actualizar miembro del staff
router.put('/:id', staffController.updateStaff);

// PATCH /api/staff/:id/active - Activar/desactivar miembro del staff
router.patch('/:id/active', staffController.toggleActive);

// PUT /api/staff/:id/activo - Activar/desactivar miembro del staff (compatibilidad)
router.put('/:id/activo', staffController.toggleActive);

// DELETE /api/staff/:id - Eliminar miembro del staff
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
