const express = require('express');
const router = express.Router();
const pesoController = require('../controllers/peso.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');

// Todas las rutas de peso requieren autenticación
router.use(authMiddleware);

// Solo admin y veterinario pueden gestionar pesos
router.use(rolesMiddleware(['admin', 'veterinario']));

// GET /api/mascotas/:id/pesos - Historial de peso
router.get('/mascotas/:id/pesos', pesoController.listarPesos);

// POST /api/mascotas/:id/pesos - Registrar peso
router.post('/mascotas/:id/pesos', pesoController.crearPeso);

module.exports = router;
